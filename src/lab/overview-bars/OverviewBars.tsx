/* ══ Overview bars ════════════════════════════════════
   A bar chart of actuals against targets. Hover a bar to read its month;
   switch the range to watch the bars re-flow and the headline roll to the
   new average. Left and Right move through the bars from the keyboard.

   ── TWO PORTIONS PER BAR ─────────────────────────────
   Each bar is a pale column as tall as the period's target with the actual
   value filled in from the bottom, striped with a repeating gradient. The
   hovered bar takes the accent colour and a pin sits on its top.

   ── ONE TOOLTIP ──────────────────────────────────────
   The tooltip is a single element that slides between bars instead of a
   new one per bar, so moving across the chart feels continuous. Near the
   card's edges it shifts sideways while its pointer stays on the bar.

   ── BARS KEEP THEIR IDENTITY ─────────────────────────
   Bars are keyed by their month. Switching from a year to six months keeps
   the last six months' bars, which slide and widen with CSS transitions;
   the others shrink to nothing and are removed after the transition, and
   new bars grow up from the baseline one after another. The headline digits
   roll like an odometer. */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Range = "Last month" | "6 months" | "Year";
const RANGES: Range[] = ["Last month", "6 months", "Year"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export type Bar = { key: string; label: string; long: string; actual: number; target: number };
export type OverviewBarsProps = {
  hatch?: boolean;
  hatchAngle?: number;
  radius?: number;
  gap?: number;
  accent?: "Ink" | "Pick" | "Ok";
  range?: Range;
  unit?: string;
  /** 24 months and 8 weeks, oldest first; the last 12 months / 4 weeks are shown */
  data?: { months: Bar[]; weeks: Bar[] };
  onRangeChange?: (r: Range) => void;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const DATA = (() => {
  const r = rng(42);
  const months: Bar[] = Array.from({ length: 24 }, (_, i) => {
    const m = (i + 10) % 12, y = 2024 + Math.floor((i + 10) / 12);
    const target = Math.round(2600 + r() * 700);
    return { key: `m${i}`, label: MONTHS[m], long: `${LONG[m]} ${y}`, target, actual: Math.round(target * (0.35 + r() * 0.6)) };
  });
  const weeks: Bar[] = Array.from({ length: 8 }, (_, i) => {
    const target = Math.round(650 + r() * 180);
    return { key: `w${i}`, label: `W${(i % 4) + 1}`, long: `Week ${(i % 4) + 1}, ${i < 4 ? "October" : "November"} 2025`, target, actual: Math.round(target * (0.4 + r() * 0.55)) };
  });
  return { months, weeks };
})();

const fmt = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const W = 308, H = 110;

function Roll({ text }: { text: string }) {
  return (
    <span className="ovb-roll" aria-label={text}>
      {[...text].map((c, i) =>
        /\d/.test(c) ? (
          <span className="ovb-dig" key={`${text.length}-${i}`} aria-hidden>
            <span style={{ transform: `translateY(${-Number(c) * 10}%)` }}>
              {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : <span key={`${text.length}-${i}`} aria-hidden>{c}</span>,
      )}
    </span>
  );
}

export function OverviewBars({
  hatch = true, hatchAngle = 60, radius = 4, gap = 10, accent = "Ink", range: range0 = "Year", unit = "pcs",
  data = DATA, onRangeChange, sound = true, volume = 70, onSound,
}: OverviewBarsProps) {
  const [range, setRange] = useState<Range>(range0);
  const [act, setAct] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [leaving, setLeaving] = useState<{ b: Bar; i: number; n: number }[]>([]);
  const [grown, setGrown] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const fresh = useRef(new Set<string>());
  const lastTick = useRef(0), lastShuffle = useRef(0), leaveT = useRef(0);

  useEffect(() => { pick(range0, false); }, [range0]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(leaveT.current), []);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  const slice = (r: Range) => (r === "Last month" ? data.weeks.slice(-4) : data.months.slice(r === "Year" ? -12 : -6));
  const prevSlice = (r: Range) => (r === "Last month" ? data.weeks.slice(-8, -4) : data.months.slice(r === "Year" ? -24 : -12, r === "Year" ? -12 : -6));
  const bars = useMemo(() => slice(range), [range, data]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = bars.length;
  const bw = (W - gap * (n - 1)) / n;
  const max = Math.max(...bars.map((b) => Math.max(b.target, b.actual))) * 1.08;
  const avg = (l: Bar[], k: "actual" | "target") => l.reduce((s, b) => s + b[k], 0) / l.length;
  const a = avg(bars, "actual"), t = avg(bars, "target"), pa = avg(prevSlice(range), "actual");
  const change = ((a - pa) / pa) * 100;
  const thin = bw + gap < 30;

  function pick(r: Range, user = true) {
    setOpen(false);
    if (r === range) { if (user) snd("collapse", { volume: 0.4 }); return; }
    const old = slice(range), next = slice(r), keys = new Set(next.map((b) => b.key)), had = new Set(old.map((b) => b.key));
    fresh.current = new Set(next.filter((b) => !had.has(b.key)).map((b) => b.key));
    setLeaving(old.map((b, i) => ({ b, i, n: old.length })).filter((x) => !keys.has(x.b.key)));
    clearTimeout(leaveT.current);
    leaveT.current = window.setTimeout(() => setLeaving([]), 380);
    setGrown(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    setRange(r);
    setAct(null);
    onRangeChange?.(r);
    if (user) {
      snd("collapse", { volume: 0.4 });
      const now = performance.now();
      if (now - lastShuffle.current > 200) { lastShuffle.current = now; snd("shuffle", { volume: 0.5 }); }
    }
  }

  function activate(i: number | null) {
    if (i === act) return;
    setAct(i);
    if (i === null) return;
    const now = performance.now();
    if (now - lastTick.current > 30) { lastTick.current = now; snd("tick", { volume: 0.3, pitch: 0.85 + 0.4 * (bars[i].actual / max) }); }
  }

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!root.current?.querySelector(".ovb-pick")?.contains(e.target as Node)) { setOpen(false); snd("collapse", { volume: 0.4 }); } };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  });

  const yOf = (v: number) => (v / max) * H;
  const ab = act !== null ? bars[act] : null;
  const cx = act !== null ? act * (bw + gap) + bw / 2 : 0;
  const tipX = Math.max(46, Math.min(W - 46, cx));

  const style = {
    "--ovb-r": `${Math.min(radius, bw / 2)}px`,
    "--ovb-angle": `${hatchAngle}deg`,
  } as CSSProperties;

  const bar = (b: Bar, i: number, count: number, gone = false) => {
    const w = (W - gap * (count - 1)) / count;
    const isNew = fresh.current.has(b.key);
    return (
      <div
        key={b.key}
        className="ovb-bar"
        data-on={!gone && act === i}
        data-gone={gone}
        data-new={isNew && !grown}
        style={{ left: i * (w + gap), width: w, height: yOf(b.target), transitionDelay: isNew ? `${i * 25}ms` : undefined } as CSSProperties}
      >
        <div className="ovb-act" style={{ height: `${(b.actual / b.target) * 100}%` }} />
      </div>
    );
  };

  return (
    <div className="ovb" ref={root} style={style} data-hatch={hatch} data-accent={accent.toLowerCase()}>
      <div className="ovb-head">
        <span className="ovb-title">Overview</span>
        <div className="ovb-pick">
          <button
            type="button"
            className="ovb-btn"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => { setOpen(!open); setHi(RANGES.indexOf(range)); snd(open ? "collapse" : "expand", { volume: 0.4 }); }}
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h + (e.key === "ArrowDown" ? 1 : 2)) % 3); }
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(RANGES[hi]); }
              if (e.key === "Escape") { setOpen(false); snd("collapse", { volume: 0.4 }); }
            }}
          >
            {range}
            <Icon icon="ph:caret-down-bold" width={12} height={12} />
          </button>
          {open && (
            <ul className="ovb-menu" role="listbox" aria-label="Range">
              {RANGES.map((r, i) => (
                <li key={r} role="option" aria-selected={r === range} data-hi={i === hi} onPointerEnter={() => setHi(i)} onClick={() => pick(r)}>
                  {r}
                  {r === range && <Icon icon="ph:check-bold" width={12} height={12} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="ovb-sub">Avg per {range === "Last month" ? "week" : "month"}</div>
      <div className="ovb-num">
        <Roll text={fmt.format(Math.round(a))} />
        <span className="ovb-of">/{compact.format(t)}</span>
        <span className="ovb-badge" data-up={change >= 0}>{Math.abs(change).toFixed(1)}% {change >= 0 ? "▲" : "▼"}</span>
      </div>
      <div
        className="ovb-chart"
        tabIndex={0}
        role="img"
        aria-label={`${n} bars of ${unit} against target. Left and right arrows read each bar.`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          activate(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / r.width) * n))));
        }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") activate(null); }}
        onBlur={() => activate(null)}
        onKeyDown={(e) => {
          if (e.key === "Escape") return activate(null);
          const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          activate(act === null ? (d > 0 ? 0 : n - 1) : Math.max(0, Math.min(n - 1, act + d)));
        }}
      >
        <div className="ovb-grid" aria-hidden><i /><i /><i /><i /></div>
        <div className="ovb-plot" aria-hidden>
          {leaving.map((x) => bar(x.b, x.i, x.n, true))}
          {bars.map((b, i) => bar(b, i, n))}
          {ab && (
            <>
              <span className="ovb-pin" key={`p${range}`} style={{ left: cx, bottom: yOf(ab.actual) }} />
              <div className="ovb-tip" style={{ left: tipX, bottom: yOf(ab.actual) + 12 }}>
                <span>{ab.long}</span>
                <b>{fmt.format(ab.actual)} {unit}</b>
                <i style={{ left: `calc(50% + ${cx - tipX}px)` }} />
              </div>
            </>
          )}
        </div>
        <div className="ovb-labels" aria-hidden>
          {bars.map((b, i) => (
            <span key={b.key} style={{ left: i * (bw + gap) + bw / 2 }} data-skip={thin && i % 2 === 1}>{b.label}</span>
          ))}
        </div>
      </div>
      <span className="ovb-sr" aria-live="polite">
        {ab ? `${ab.long}, ${fmt.format(ab.actual)} ${unit === "pcs" ? "pieces" : unit}, target ${fmt.format(ab.target)}` : ""}
      </span>
    </div>
  );
}
