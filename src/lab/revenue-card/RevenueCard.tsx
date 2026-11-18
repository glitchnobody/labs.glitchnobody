/* ══ Revenue card ═════════════════════════════════
   A revenue card with a chart of this period against the last. Move across
   the chart to scrub it: a dot follows the line, the tooltip shows the value,
   and the total rolls to the running total up to that day.

   ── THE CHART ────────────────────────────────────
   Hand-written SVG. The data is resampled to the chosen number of points and
   turned into a path three ways: straight segments, steps (hold the value,
   then jump), or a monotone cubic that bends through the points without ever
   overshooting them. The area under the line is the same path closed along
   the bottom and filled with a fading gradient.

   ── SCRUBBING ────────────────────────────────────
   The pointer's x position is snapped to the nearest point. The marker jumps
   there, its height glides for a moment, and the tooltip sits above it,
   flipping below near the top and staying inside the card at the sides. The
   keyboard steps the same marker with the arrow keys.

   ── THE ODOMETER ─────────────────────────────────
   Each digit is a window over a strip of 0 to 9 moved with a CSS transform,
   so changing the number rolls every digit. While scrubbing, the number is
   the sum of every day up to the hovered one, and the comparison is last
   period's sum for the same day. */

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type RevenueCardProps = {
  curve?: "Linear" | "Step" | "Smooth";
  /** gradient under the main line */
  area?: boolean;
  /** the faint last-period line */
  compare?: boolean;
  accent?: "Pink" | "Green" | "Blue" | "Violet";
  /** points drawn, 12 to 48 */
  points?: number;
  /** main line width in px */
  stroke?: number;
  dots?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  /** this period, one number per day */
  data?: number[];
  /** last period, one number per day */
  previous?: number[];
  currency?: string;
  onViewMore?: () => void;
  onDownload?: () => void;
  onSound?: Sound;
};

const W = 300, H = 120, PT = 22, PB = 8;
const ACCENT = { Pink: "#ff5c8a", Green: "var(--ok)", Blue: "var(--pick)", Violet: "#8b7bff" };

/* small seeded PRNG, rising trend plus noise, scaled so it sums to `total` */
function seeded(seed: number, total: number, n = 30) {
  let s = seed;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const raw = Array.from({ length: n }, (_, i) => 1 + (i / n) * 0.6 + (r() - 0.5) * 0.9);
  const k = total / raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v * k);
}
const THIS = seeded(7, 20560), LAST = seeded(19, 19432);

function resample(d: number[], n: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i * (d.length - 1)) / (n - 1), a = Math.floor(t), b = Math.min(a + 1, d.length - 1);
    return d[a] + (d[b] - d[a]) * (t - a);
  });
}

function pathOf(p: [number, number][], curve: string) {
  const f = (n: number) => n.toFixed(2);
  if (curve === "Step") return p.map(([x, y], i) => (i ? `H${f(x)}V${f(y)}` : `M${f(x)},${f(y)}`)).join("");
  if (curve === "Linear") return p.map(([x, y], i) => `${i ? "L" : "M"}${f(x)},${f(y)}`).join("");
  // monotone cubic (Fritsch–Carlson)
  const n = p.length, dx: number[] = [], m: number[] = [], t: number[] = new Array(n);
  for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[i + 1], w = dx[i] / 3;
    d += `C${f(x0 + w)},${f(y0 + t[i] * w)} ${f(x1 - w)},${f(y1 - t[i + 1] * w)} ${f(x1)},${f(y1)}`;
  }
  return d;
}

function Roll({ text }: { text: string }) {
  const chars = [...text];
  return (
    <span className="rvc-roll" aria-hidden="true">
      {chars.map((c, i) => {
        const key = chars.length - i; // keyed from the right so digits keep their place
        return /\d/.test(c) ? (
          <span className="rvc-digit" key={key}>
            <span className="rvc-strip" style={{ transform: `translateY(${-Number(c) * 10}%)` }}>
              {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : <span key={key}>{c}</span>;
      })}
    </span>
  );
}

export function RevenueCard({
  curve = "Linear", area = true, compare = true, accent = "Pink", points = 30, stroke = 2, dots = false,
  sound = true, volume = 70, data, previous, currency = "USD", onViewMore, onDownload, onSound,
}: RevenueCardProps) {
  const gid = "rvc" + useId().replace(/\W/g, "");
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState<number | null>(null);
  const lastTick = useRef(0);
  useEffect(() => setMounted(true), []);

  const cur = data ?? THIS, prev = previous ?? LAST;
  const n = Math.min(48, Math.max(12, Math.round(points)));
  const a = useMemo(() => resample(cur, n), [cur, n]);
  const b = useMemo(() => resample(prev, n), [prev, n]);
  const fmt = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }), [currency]);
  const all = [...a, ...(compare ? b : [])];
  let lo = Math.min(...all), hi = Math.max(...all);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.1; // flat data stays off the edges
  lo -= pad; hi += pad;
  const X = (i: number) => (i / (n - 1)) * W;
  const Y = (v: number) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const pa = a.map((v, i) => [X(i), Y(v)] as [number, number]);
  const pb = b.map((v, i) => [X(i), Y(v)] as [number, number]);
  const dA = pathOf(pa, curve), dB = pathOf(pb, curve);
  const sig = `${curve}${n}${accent}`;

  const day = (i: number) => Math.round((i * (cur.length - 1)) / (n - 1));
  const sum = (d: number[], to: number) => d.slice(0, Math.min(to, d.length - 1) + 1).reduce((s, v) => s + v, 0);
  const total = idx === null ? sum(cur, cur.length) : sum(cur, day(idx));
  const last = idx === null ? sum(prev, prev.length) : sum(prev, day(idx));
  const pct = last ? ((total - last) / last) * 100 : 0;
  const up = pct >= 0;
  const date = idx === null ? "" : `Nov ${day(idx) + 1}`;
  const money = (v: number) => fmt.format(Math.round(v));

  const go = (i: number | null) => {
    if (i === idx) return;
    setIdx(i);
    if (i === null || !sound || !onSound) return;
    const now = performance.now();
    if (now - lastTick.current < 30) return;
    lastTick.current = now;
    const mn = Math.min(...a), mx = Math.max(...a);
    onSound("tick", { volume: 0.3 * (volume / 100), pitch: 0.8 + 0.5 * ((a[i] - mn) / (mx - mn || 1)) });
  };
  const scrub = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    go(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
  };
  const key = (e: KeyboardEvent) => {
    const i = idx ?? -1, k = e.key;
    const to = k === "ArrowRight" ? Math.min(n - 1, i + 1) : k === "ArrowLeft" ? Math.max(0, i < 0 ? 0 : i - 1)
      : k === "Home" ? 0 : k === "End" ? n - 1 : k === "Escape" ? null : undefined;
    if (to === undefined) return;
    e.preventDefault();
    go(to);
  };

  const style = { "--rc-accent": ACCENT[accent], "--rvc-stroke": stroke } as CSSProperties;
  const mx = idx === null ? 0 : X(idx), my = idx === null ? 0 : Y(a[idx]);
  const flip = my < 34;
  const ic = (name: string) => (mounted ? <Icon icon={name} width={16} height={16} /> : <span className="rvc-ph" />);

  return (
    <div className="rvc" style={style} data-scrub={idx !== null || undefined}>
      <div className="rvc-head">
        <div className="rvc-label">{idx === null ? "Revenue" : `Revenue to ${date}`}</div>
        <div className="rvc-total"><Roll text={money(total)} /></div>
        <div className="rvc-row">
          <span className="rvc-pct" data-down={!up || undefined}>
            {ic(up ? "ph:trend-up-bold" : "ph:trend-down-bold")}
            {Math.abs(pct).toFixed(1)}%
          </span>
          <span className="rvc-vs">vs. {money(last)} last</span>
        </div>
      </div>

      <div
        className="rvc-chart" tabIndex={0} role="img" onKeyDown={key}
        aria-label={`Revenue, ${money(sum(cur, cur.length))} this period against ${money(sum(prev, prev.length))} last. Use arrow keys to step through days.`}
        onPointerMove={scrub} onPointerDown={scrub}
        onPointerLeave={() => go(null)} onPointerUp={(e) => e.pointerType === "touch" && go(null)}
        onPointerCancel={() => go(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--rc-accent)", stopOpacity: 0.28 }} />
              <stop offset="1" style={{ stopColor: "var(--rc-accent)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <g key={sig} className="rvc-draw">
            {compare && <path className="rvc-prev" d={dB} style={{ strokeWidth: Math.max(0.5, stroke - 1) }} />}
            {area && <path d={`${dA}L${W},${H}L0,${H}Z`} fill={`url(#${gid})`} />}
            <path className="rvc-line" d={dA} style={{ strokeWidth: stroke }} />
            {dots && pa.map(([x, y], i) => <circle key={i} className="rvc-pt" cx={x} cy={y} r={1.5} />)}
          </g>
          {idx !== null && <line className="rvc-guide" x1={mx} x2={mx} y1={PT - 6} y2={H} />}
        </svg>
        {idx !== null && (
          <>
            <span className="rvc-dot" style={{ left: mx, top: my }} />
            <span className="rvc-tip" data-flip={flip || undefined} style={{ left: Math.max(26, Math.min(W - 26, mx)), top: my }}>
              {money(a[idx])}
            </span>
          </>
        )}
        <span className="rvc-live" aria-live="polite">{idx === null ? "" : `${date}, ${money(a[idx])}, running total ${money(total)}`}</span>
      </div>

      <div className="rvc-foot">
        <button type="button" className="rvc-btn" onClick={onViewMore}>View More {ic("ph:caret-right-bold")}</button>
        <button type="button" className="rvc-btn" onClick={onDownload}>{ic("ph:download-simple-bold")} Download</button>
      </div>
    </div>
  );
}
