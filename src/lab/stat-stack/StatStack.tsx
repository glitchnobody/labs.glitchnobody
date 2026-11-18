/* ══ Stat stack ═════════════════════════════
   Stacked stat tiles that share one timeline. Scrub any chart and a date
   marker moves through every tile at once; press "Period" to switch between
   7, 28 and 90 days and watch the lines, bars and numbers morph.

   ── ONE SHARED POSITION ──────────────────
   The scrub is stored once, as a fraction of the chart width plus the tile
   that is being scrubbed. Every tile turns that fraction into its own nearest
   day (or bar), so all markers line up, and a period change simply re-snaps
   them. With linking off only the scrubbed tile draws a marker.

   ── SEEDED DATA ──────────────────────────
   Each metric is 180 days from a seeded random generator with a trend. The
   last 7, 28 or 90 days are shown; the number is the total over that span and
   the change compares it with the span before. Bars group days: 7, 14 or 15.

   ── MORPHING ─────────────────────────────
   Lines are resampled to 64 points for every period, so any two periods have
   the same point count and the y values just tween on a requestAnimationFrame
   clock. Bars tween height and width over 15 slots; absent slots sit at zero.
   Numbers are columns of digits slid with a CSS transform, like an odometer. */

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;
type P = "7D" | "28D" | "90D";

export type StatStackProps = {
  tiles?: number;
  caps?: boolean;
  linked?: boolean;
  ring?: boolean;
  period?: P;
  /** ms for the period morph */
  morph?: number;
  density?: "Regular" | "Compact";
  /** tile corner radius in px */
  radius?: number;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const DAYS: Record<P, number> = { "7D": 7, "28D": 28, "90D": 90 };
const GROUP: Record<P, number> = { "7D": 1, "28D": 2, "90D": 6 };
const ORDER: P[] = ["7D", "28D", "90D"];
const N = 64;
const SLOTS = 15;
const CW = 185;
const END = Date.UTC(2025, 11, 28);

const METRICS = [
  { name: "Impressions", kind: "line", base: 4200, trend: 0.5, seed: 11 },
  { name: "Engagements", kind: "bars", base: 460, trend: -0.4, seed: 7 },
  { name: "Clicks", kind: "area", base: 146, trend: 0.3, seed: 23 },
] as const;

function rng(s: number) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DATA = METRICS.map((m) => {
  const r = rng(m.seed);
  return Array.from({ length: 180 }, (_, d) => m.base * (1 + (m.trend * d) / 180) * (1 + 0.25 * Math.sin(d / 4 + m.seed) + 0.3 * (r() - 0.5)));
});

const fmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const fmtFull = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const dateOf = (back: number) =>
  new Date(END - back * 864e5).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function seriesOf(m: number, p: P) {
  const n = DAYS[p];
  return DATA[m].slice(180 - n);
}
function barsOf(m: number, p: P) {
  const s = seriesOf(m, p), g = GROUP[p];
  return Array.from({ length: Math.floor(s.length / g) }, (_, i) => sum(s.slice(s.length - (i + 1) * g, s.length - i * g)))
    .reverse();
}
function norm(a: number[]) {
  const lo = Math.min(...a), hi = Math.max(...a);
  return a.map((v) => (hi === lo ? 0.5 : (v - lo) / (hi - lo)));
}
function resample(a: number[]) {
  const u = norm(a);
  return Array.from({ length: N }, (_, k) => {
    const x = (k / (N - 1)) * (u.length - 1), i = Math.min(Math.floor(x), u.length - 2);
    return lerp(u[i], u[i + 1], x - i);
  });
}
function barSlots(a: number[]) {
  const u = norm(a);
  return Array.from({ length: SLOTS }, (_, i) => (i < u.length ? 0.15 + 0.85 * u[i] : 0));
}
function stat(m: number, p: P) {
  const n = DAYS[p], total = sum(DATA[m].slice(180 - n)), prev = sum(DATA[m].slice(180 - 2 * n, 180 - n));
  const ch = Math.round(((total - prev) / prev) * 100);
  return { value: fmt.format(total), change: `${ch < 0 ? "−" : "+"}${Math.abs(ch)}%`, up: ch >= 0 };
}

function Roll({ text, ms }: { text: string; ms: number }) {
  return (
    <span className="skx-roll" aria-label={text}>
      {[...text].map((c, i) =>
        /\d/.test(c) ? (
          <span className="skx-dig" key={i} aria-hidden>
            <span style={{ transform: `translateY(${-Number(c) * 24}px)`, transitionDuration: `${ms}ms` }}>
              {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden>{c}</span>
        ),
      )}
    </span>
  );
}

export function StatStack({
  tiles = 2, caps = true, linked = true, ring = true, period = "28D", morph = 450,
  density = "Regular", radius = 10, sound = true, volume = 70, onSound,
}: StatStackProps) {
  const root = useRef<HTMLDivElement>(null);
  const [per, setPer] = useState<P>(period);
  const [prev, setPrev] = useState<P>(period);
  const [prog, setProg] = useState(1);
  const [sel, setSel] = useState<{ tile: number; f: number } | null>(null);
  const raf = useRef(0);
  const last = useRef({ idx: -1, t: 0, st: 0 });
  const live = useId();
  const reduced = useRef(false);
  const H = density === "Compact" ? 92 : 120;
  const CH = H - 14;
  const count = Math.max(2, Math.min(3, Math.round(tiles)));

  useEffect(() => { reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { go(period); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  function go(next: P, user = false) {
    if (next === per && !user) return;
    cancelAnimationFrame(raf.current);
    setPrev(per);
    setPer(next);
    const dur = reduced.current ? 0 : morph;
    if (!dur) { setProg(1); return; }
    const t0 = performance.now();
    setProg(0);
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      setProg(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function cycle() {
    go(ORDER[(ORDER.indexOf(per) + 1) % 3], true);
    const t = performance.now();
    if (t - last.current.st > 200) { last.current.st = t; snd("swipe", { volume: 0.5 }); }
  }

  const nBars = (p: P) => Math.floor(DAYS[p] / GROUP[p]);
  const idxOf = (m: number, f: number) =>
    METRICS[m].kind === "bars"
      ? Math.min(nBars(per) - 1, Math.max(0, Math.floor(f * nBars(per))))
      : Math.round(Math.min(1, Math.max(0, f)) * (DAYS[per] - 1));
  const fOf = (m: number, i: number) =>
    METRICS[m].kind === "bars" ? (i + 0.5) / nBars(per) : i / (DAYS[per] - 1);

  function scrub(tile: number, f: number) {
    f = Math.min(1, Math.max(0, f));
    setSel({ tile, f });
    const i = idxOf(tile, f);
    const l = last.current, t = performance.now();
    if (i !== l.idx) {
      l.idx = i;
      if (t - l.t > 30) {
        l.t = t;
        const u = norm(METRICS[tile].kind === "bars" ? barsOf(tile, per) : seriesOf(tile, per))[i] ?? 0.5;
        snd("tick", { volume: 0.3, pitch: 0.85 + 0.4 * u });
      }
    }
  }

  const tileData = useMemo(
    () =>
      METRICS.map((m, i) => {
        const get = (p: P) => (m.kind === "bars" ? barSlots(barsOf(i, p)) : resample(seriesOf(i, p)));
        return Object.fromEntries(ORDER.map((p) => [p, get(p)])) as Record<P, number[]>;
      }),
    [],
  );

  const e = ease(prog);
  const style = { "--sks-r": `${radius}px`, "--sks-h": `${H}px` } as CSSProperties;
  const live_ = sel
    ? `${dateOf(DAYS[per] - 1 - idxOf(sel.tile, sel.f) * (METRICS[sel.tile].kind === "bars" ? GROUP[per] : 1) - (METRICS[sel.tile].kind === "bars" ? GROUP[per] - 1 : 0))}: ` +
      METRICS.slice(0, count).map((m, i) => `${m.name} ${fmtFull.format(valAt(i, idxOf(i, sel.f)))}`).join(", ")
    : "";

  function valAt(m: number, i: number) {
    return METRICS[m].kind === "bars" ? barsOf(m, per)[i] : seriesOf(m, per)[i];
  }

  return (
    <div className="skx" ref={root} style={style} data-ring={ring ? "on" : "off"}>
      {METRICS.slice(0, count).map((m, ti) => {
        const st = stat(ti, per);
        const showing = sel && (linked || sel.tile === ti);
        const idx = showing ? idxOf(ti, sel.f) : -1;
        const own = sel?.tile === ti;
        const a = tileData[ti][prev], b = tileData[ti][per];
        const y = (v: number) => 6 + (1 - v) * (CH - 12);
        const pts = Array.from({ length: N }, (_, k) => lerp(a[k], b[k], e));
        const x = (k: number) => (k / (N - 1)) * CW;
        const d = pts.map((v, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(v).toFixed(1)}`).join("");
        const area = `${d}L${CW} ${CH}L0 ${CH}Z`;
        const ca = nBars(prev), cb = nBars(per), c = lerp(ca, cb, e), bw = CW / c;
        let dx = 0, dy = 0, label = "";
        if (idx >= 0) {
          if (m.kind === "bars") {
            dx = (idx + 0.5) * (CW / cb);
            dy = CH - lerp(a[idx], b[idx], e) * (CH - 10);
          } else {
            dx = (idx / (DAYS[per] - 1)) * CW;
            dy = y(pts[Math.round((idx / (DAYS[per] - 1)) * (N - 1))]);
          }
          label = fmtFull.format(valAt(ti, idx));
        }
        const g = m.kind === "bars" ? GROUP[per] : 1;
        const day = idx >= 0 ? dateOf(DAYS[per] - 1 - idx * g - (g - 1)) : "";
        const flip = dx > CW * 0.5;
        return (
          <div className="skx-tile" key={m.name} data-stroke-slot>
            <div className="skx-stats">
              <span className="skx-name">{m.name}</span>
              <span className="skx-val">
                <Roll text={st.value} ms={reduced.current ? 0 : morph} />
                <span className="skx-chg" data-up={st.up}>{st.change}</span>
              </span>
              <button type="button" className="skx-per" aria-label={`Period ${DAYS[per]} days, change`} onClick={cycle}>
                Period: {per}
              </button>
            </div>
            <div
              className="skx-chart"
              tabIndex={0}
              role="img"
              aria-label={`${m.name}, last ${DAYS[per]} days. Left and right arrows move the marker.`}
              aria-describedby={live}
              onPointerDown={(ev) => {
                try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch { /* synthetic events */ }
                const r = ev.currentTarget.getBoundingClientRect();
                scrub(ti, (ev.clientX - r.left) / r.width);
              }}
              onPointerMove={(ev) => {
                const r = ev.currentTarget.getBoundingClientRect();
                scrub(ti, (ev.clientX - r.left) / r.width);
              }}
              onPointerLeave={(ev) => { if (!ev.currentTarget.hasPointerCapture?.(ev.pointerId)) setSel(null); }}
              onBlur={() => setSel(null)}
              onKeyDown={(ev) => {
                const n = m.kind === "bars" ? nBars(per) : DAYS[per];
                const cur = sel?.tile === ti ? idxOf(ti, sel.f) : n - 1;
                const nx = ev.key === "ArrowLeft" ? cur - 1 : ev.key === "ArrowRight" ? cur + 1 : ev.key === "Home" ? 0 : ev.key === "End" ? n - 1 : null;
                if (ev.key === "Escape") { setSel(null); return; }
                if (nx === null) return;
                ev.preventDefault();
                scrub(ti, fOf(ti, Math.min(n - 1, Math.max(0, nx))));
              }}
            >
              <svg width={CW} height={CH} aria-hidden>
                {m.kind === "bars" ? (
                  Array.from({ length: SLOTS }, (_, i) => {
                    const h = Math.max(0, lerp(a[i], b[i], e) * (CH - 10));
                    if (h < 0.1 && i >= Math.max(ca, cb)) return null;
                    return (
                      <g key={i} data-hot={idx === i}>
                        <rect className="skx-bar" x={i * bw + 1} y={CH - h} width={Math.max(0, bw - 2)} height={h} />
                        {caps && h > 2 && <rect className="skx-cap" x={i * bw + 1} y={CH - h} width={Math.max(0, bw - 2)} height={Math.min(2, h)} />}
                      </g>
                    );
                  })
                ) : (
                  <>
                    <path className="skx-fill" data-area={m.kind === "area"} d={area} />
                    <path className="skx-line" d={d} />
                  </>
                )}
                {idx >= 0 && <line className="skx-mark" x1={dx} x2={dx} y1={0} y2={CH} />}
                {idx >= 0 && m.kind !== "bars" && <circle className="skx-dot" cx={dx} cy={dy} r={3} />}
              </svg>
              {idx >= 0 && (
                <div className="skx-tip" data-own={own} style={{ left: dx, top: Math.max(4, Math.min(CH - 40, dy - 20)), transform: flip ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}>
                  {own && <span className="skx-tip-d">{day}</span>}
                  <b>{label}</b>
                  {own && <span className="skx-tip-m">{m.name}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <span id={live} className="skx-sr" aria-live="polite">{live_}</span>
    </div>
  );
}
