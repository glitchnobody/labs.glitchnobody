/* ══ Activity heatmap ═════════════════════════════
   A contribution heatmap that plays a note for every cell you pass. Sweep
   across it: each cell shows its day in a tooltip, the cells around it light
   up in a ripple, and busier days play higher notes.

   ── ONE LISTENER, NO PER-CELL EVENTS ─────
   The grid is a single SVG. One pointer listener turns the pointer position
   into a column and a row, so a hundred and fifty cells cost one handler.
   Days are laid out in columns of weeks, Sunday to Saturday, ending with this
   week. Counts are mapped to levels by quantiles of the busy days.

   ── THE RIPPLE ───────────────────────────
   Every frame, each cell eases its glow toward a target set by its distance
   from the hovered cell (closer is brighter). The easing is exponential, so a
   sweep leaves a short wake that fades. The loop stops once everything has
   settled. With reduced motion there is no ripple or scaling, only the ring.

   ── NOTES ────────────────────────────────
   Each new cell plays one note pitched by its level along a major pentatonic
   scale, so sweeping a busy row plays a small melody. Keyboard: arrow keys
   move between cells and play their notes too. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;
type Day = { date: Date; key: string; count: number; w: number; d: number; level: number };

export type ActivityHeatmapProps = {
  weeks?: number;
  /** cell size in px */
  cell?: number;
  gap?: number;
  shape?: "Square" | "Rounded" | "Circle" | "Diamond" | "Heart" | "Star" | "Hexagon";
  /** 4 or 5 colour levels */
  levels?: number | string;
  /** ripple radius in cells, 0 turns it off */
  ripple?: number;
  /** 0 to 100 */
  rippleStrength?: number;
  labels?: "None" | "Months" | "Months + days";
  legend?: boolean;
  accent?: "Green" | "Pick" | "Danger" | "Ink";
  /** overrides the seeded year: dates as YYYY-MM-DD */
  data?: { date: string; count: number }[];
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const ACCENTS = { Green: "var(--ok)", Pick: "var(--pick)", Danger: "var(--danger)", Ink: "var(--fill-on)" };
const MIX5 = [0, 30, 50, 80, 100];
const MIX4 = [0, 35, 65, 100];
const SEMI5 = [0, 2, 4, 7, 9];
const SEMI4 = [0, 2, 4, 7];

const f = (n: number) => +n.toFixed(3);
const rr = (r: number) =>
  `M${f(-0.5 + r)} -.5H${f(0.5 - r)}Q.5 -.5 .5 ${f(-0.5 + r)}V${f(0.5 - r)}Q.5 .5 ${f(0.5 - r)} .5H${f(-0.5 + r)}Q-.5 .5 -.5 ${f(0.5 - r)}V${f(-0.5 + r)}Q-.5 -.5 ${f(-0.5 + r)} -.5Z`;
const poly = (pts: [number, number][]) => "M" + pts.map((p) => p.map(f).join(" ")).join("L") + "Z";
const PATHS: Record<string, string> = {
  Square: rr(0.12),
  Rounded: rr(0.3),
  Circle: "M-.5 0A.5 .5 0 1 0 .5 0A.5 .5 0 1 0 -.5 0Z",
  Diamond: poly([[0, -0.5], [0.5, 0], [0, 0.5], [-0.5, 0]]),
  Heart: "M0 .45C-.55 .05 -.5 -.45 -.25 -.45C-.12 -.45 0 -.35 0 -.25C0 -.35 .12 -.45 .25 -.45C.5 -.45 .55 .05 0 .45Z",
  Star: poly(Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 0.2 : 0.5;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  })),
  Hexagon: poly(Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3) * 0.5, Math.sin((i * Math.PI) / 3) * 0.5] as [number, number])),
};

const rnd = (n: number) => {
  let t = (n * 2654435761 + 1013904223) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function build(weeks: number, levels: number, data?: { date: string; count: number }[]): Day[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - today.getDay() - (weeks - 1) * 7);
  const given = data && new Map(data.map((x) => [x.date, x.count]));
  const days: Day[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date > today) break;
    const key = keyOf(date);
    const idx = Math.round(date.getTime() / 864e5);
    const wk = Math.floor(idx / 7), dow = date.getDay();
    let count = 0;
    if (given) count = given.get(key) ?? 0;
    else {
      const p = rnd(wk + 999) < 0.18 ? 0.12 : dow === 0 || dow === 6 ? 0.35 : 0.8;
      if (rnd(idx) < p) count = 1 + Math.floor(rnd(idx + 77) ** 2 * (rnd(wk + 5000) > 0.8 ? 14 : 8));
    }
    days.push({ date, key, count, w: Math.floor(i / 7), d: i % 7, level: 0 });
  }
  const busy = days.filter((x) => x.count > 0).map((x) => x.count).sort((a, b) => a - b);
  for (const x of days)
    if (x.count > 0) x.level = Math.min(levels - 1, 1 + Math.floor((busy.filter((c) => c < x.count).length / busy.length) * (levels - 1)));
  return days;
}

export function ActivityHeatmap({
  weeks = 22, cell = 11, gap = 3, shape = "Rounded", levels = 5, ripple = 2.5, rippleStrength = 60,
  labels = "Months", legend = false, accent = "Green", data, sound = true, volume = 70, onSound,
}: ActivityHeatmapProps) {
  const L = Number(levels) === 4 ? 4 : 5;
  const top = L - 1;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const days = useMemo(() => (mounted ? build(weeks, L, data) : []), [mounted, weeks, L, data]);
  const [act, setAct] = useState<Day | null>(null);
  const pitch = cell + gap;
  const left = labels === "Months + days" ? 28 : 0;
  const topPad = labels === "None" ? 0 : 18;
  const W = left + weeks * pitch - gap, H = topPad + 7 * pitch - gap;
  const big = shape === "Heart" || shape === "Diamond" || shape === "Star";
  const cx = (x: Day) => left + x.w * pitch + cell / 2;
  const cy = (x: Day) => topPad + x.d * pitch + cell / 2;

  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, SVGPathElement>());
  const glow = useRef(new Map<string, number>());
  const scale = useRef(new Map<string, number>());
  const raf = useRef(0);
  const actRef = useRef<Day | null>(null);
  const last = useRef({ t: 0, key: "" });
  const reduced = useRef(false);
  useEffect(() => { reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);

  const live = useRef({ days, ripple, rippleStrength, big, cell, pitch, left, topPad });
  live.current = { days, ripple, rippleStrength, big, cell, pitch, left, topPad };

  const loop = () => {
    cancelAnimationFrame(raf.current);
    let prev = performance.now();
    const step = (now: number) => {
      const s = live.current, a = actRef.current;
      const k = 1 - Math.exp(-(now - prev) / 40);
      prev = now;
      let busy = false;
      for (const x of s.days) {
        const el = els.current.get(x.key);
        if (!el) continue;
        let tg = 0, ts = 1;
        if (a && !reduced.current) {
          const dist = Math.hypot(x.w - a.w, x.d - a.d);
          if (x === a) { tg = 1; ts = s.big ? 1.35 : 1.25; }
          else if (s.ripple > 0 && dist < s.ripple) {
            const t = 1 - dist / s.ripple;
            tg = t * (s.rippleStrength / 100);
            ts = 1 + 0.08 * t;
          }
        }
        const g0 = glow.current.get(x.key) ?? 0, s0 = scale.current.get(x.key) ?? 1;
        let g = g0 + (tg - g0) * k, sc = s0 + (ts - s0) * k;
        if (Math.abs(g - tg) < 0.004) g = tg;
        if (Math.abs(sc - ts) < 0.002) sc = ts;
        if (g !== tg || sc !== ts) busy = true;
        if (g === g0 && sc === s0) continue;
        glow.current.set(x.key, g);
        scale.current.set(x.key, sc);
        el.style.fill = g > 0 ? `color-mix(in srgb, var(--lv${top}) ${f(g * 100)}%, var(--lv${x.level}))` : "";
        el.setAttribute("transform", `translate(${s.left + x.w * s.pitch + s.cell / 2} ${s.topPad + x.d * s.pitch + s.cell / 2}) scale(${f(s.cell * sc)})`);
      }
      if (busy || actRef.current) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const hover = (x: Day | null) => {
    if (x?.key === actRef.current?.key) return;
    actRef.current = x;
    setAct(x);
    loop();
    if (x && sound && onSound) {
      const now = performance.now();
      if (now - last.current.t < 35) return;
      last.current.t = now;
      const semi = (L === 4 ? SEMI4 : SEMI5)[x.level];
      onSound("blip", { volume: ((x.level === 0 ? 0.22 : 0.45) * volume) / 100, pitch: 2 ** (semi / 12) });
    }
  };

  const at = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const w = Math.floor((e.clientX - r.left - left) / pitch), d = Math.floor((e.clientY - r.top - topPad) / pitch);
    return days.find((x) => x.w === w && x.d === d) ?? null;
  };

  useLayoutEffect(() => {
    const t = tip.current, r = root.current, s = svg.current;
    if (!t || !r || !s || !act) return;
    const below = act.d === 0;
    const rb = r.getBoundingClientRect(), sb = s.getBoundingClientRect();
    const k = rb.width / r.offsetWidth || 1;
    const ox = (sb.left - rb.left) / k, oy = (sb.top - rb.top) / k;
    const half = t.offsetWidth / 2;
    const x = Math.min(Math.max(ox + cx(act), half), r.offsetWidth - half);
    const y = oy + cy(act) + (below ? cell / 2 + 6 : -cell / 2 - 6);
    t.style.left = `${x}px`;
    t.style.top = `${y}px`;
    t.style.transform = `translate(-50%, ${below ? "0" : "-100%"})`;
    t.dataset.below = below ? "1" : "0";
    t.style.setProperty("--arrow", `${ox + cx(act) - x}px`);
  }, [act, cell, pitch, left, topPad]);

  const text = (x: Day) =>
    `${x.count ? `${x.count} contribution${x.count > 1 ? "s" : ""}` : "No contributions"} on ${x.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;

  const onKey = (e: React.KeyboardEvent) => {
    if (!act) return;
    let w = act.w, d = act.d;
    if (e.key === "ArrowUp") d--;
    else if (e.key === "ArrowDown") d++;
    else if (e.key === "ArrowLeft") w--;
    else if (e.key === "ArrowRight") w++;
    else if (e.key === "Home") w = 0;
    else if (e.key === "End") w = weeks - 1;
    else return;
    e.preventDefault();
    const n = days.find((x) => x.w === w && x.d === d);
    if (n) els.current.get(n.key)?.focus();
  };

  const mix = L === 4 ? MIX4 : MIX5;
  const vars: Record<string, string> = { "--ah-accent": ACCENTS[accent] ?? ACCENTS.Green };
  for (let i = 0; i < L; i++)
    vars[`--lv${i}`] = i === 0 ? "color-mix(in srgb, var(--fill-on) 7%, var(--fill-slab))" : `color-mix(in srgb, var(--ah-accent) ${mix[i]}%, var(--fill-slab))`;

  const months: { w: number; name: string }[] = [];
  if (labels !== "None") {
    let lastW = -9, prevM = -1;
    for (let w = 0; w < weeks; w++) {
      const x = days.find((y) => y.w === w && y.d === 0);
      if (!x) continue;
      const m = x.date.getMonth();
      if (m !== prevM && w - lastW >= 3) { months.push({ w, name: x.date.toLocaleDateString(undefined, { month: "short" }) }); lastW = w; }
      prevM = m;
    }
  }

  return (
    <div ref={root} className="ah" style={vars as CSSProperties} data-shape={shape}>
      <svg
        ref={svg} className="ah-grid" width={W} height={H} role="grid" aria-label="Activity heatmap"
        onPointerMove={(e) => hover(at(e))} onPointerDown={(e) => hover(at(e))}
        onPointerLeave={() => hover(null)} onKeyDown={onKey}
      >
        {months.map((m) => (
          <text key={m.w} className="ah-label" x={left + m.w * pitch} y={11}>{m.name}</text>
        ))}
        {labels === "Months + days" &&
          ["Mon", "Wed", "Fri"].map((n, i) => (
            <text key={n} className="ah-label ah-day" x={0} y={topPad + (1 + i * 2) * pitch + cell / 2} dominantBaseline="central">{n}</text>
          ))}
        {Array.from({ length: 7 }, (_, d) => (
          <g key={d} role="row">
            {days.filter((x) => x.d === d).map((x) => (
              <path
                key={x.key}
                ref={(el) => { if (el) els.current.set(x.key, el); else els.current.delete(x.key); }}
                className="ah-cell" role="gridcell" aria-label={text(x)}
                data-l={x.level} data-top={x.level === top ? "" : undefined}
                tabIndex={act ? (act.key === x.key ? 0 : -1) : x.w === weeks - 1 && x.d === 0 ? 0 : -1}
                d={PATHS[shape]}
                transform={`translate(${cx(x)} ${cy(x)}) scale(${cell})`}
                onFocus={() => hover(x)} onBlur={() => hover(null)}
              />
            ))}
          </g>
        ))}
        {act && (
          <path
            className="ah-ring" d={PATHS[shape]} pointerEvents="none"
            transform={`translate(${cx(act)} ${cy(act)}) scale(${cell * (big ? 1.35 : 1.25)})`}
          />
        )}
      </svg>
      {legend && (
        <div className="ah-legend">
          Less
          {Array.from({ length: L }, (_, i) => (
            <svg key={i} width={cell} height={cell} viewBox="-.5 -.5 1 1" aria-hidden>
              <path d={PATHS[shape]} style={{ fill: `var(--lv${i})` }} />
            </svg>
          ))}
          More
        </div>
      )}
      <div ref={tip} className="ah-tip" data-on={act ? "" : undefined} role="status">{act ? text(act) : ""}</div>
    </div>
  );
}
