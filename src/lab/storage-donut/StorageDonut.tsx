/* ══ Storage donut ═════════════════════════════
   A storage breakdown drawn as a ring of thin coloured arcs, each with a soft
   band inside it. Hover or focus a segment and its band slides into the arc,
   the others dim, a note plays and the centre rolls to that category's size.

   ── ARCS FROM TRIGONOMETRY ───────────────────
   Every segment is an SVG path: a start and end angle turned into points on a
   circle with sin and cos. Round caps eat into the gap, so the gap you set is
   the space between the caps. Segments under 3% keep a 6 degree minimum so
   they stay hoverable. The path is set through the CSS "d" property, so
   changing the segment count or gap animates the angles with a transition.

   ── THE BAND SLIDES OUT ──────────────────────
   The band is a wider stroke on a smaller circle. On hover its radius grows
   until it sits on the arc while it fades, so the segment ends up as one clean
   line. The arc itself gets 2px thicker and moves 4px outward. Only the
   strokes catch the pointer, so the empty centre and corners do nothing.

   ── THE ROLLING NUMBER ───────────────────────
   Each digit is a window over a strip of 0 to 9; changing the digit slides
   the strip, so the figure rolls like an odometer. Colours of the five
   categories are fixed hues that read on light and dark; Mono uses the ink. */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;
type Item = { label: string; value: number };

export type StorageDonutProps = {
  /** used categories, largest first (GB) */
  data?: Item[];
  /** capacity in GB */
  total?: number;
  title?: string;
  /** outer arc thickness in px */
  arcWidth?: number;
  band?: boolean;
  bandWidth?: number;
  /** degrees between segments */
  gap?: number;
  /** how many segments; the rest merge into Other */
  segments?: number;
  palette?: "Colour" | "Mono";
  readout?: "Value + %" | "Value" | "%";
  unit?: "GB" | "MB";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const DATA: Item[] = [
  { label: "Photos", value: 72 },
  { label: "Video", value: 54 },
  { label: "Apps", value: 31 },
  { label: "Documents", value: 18 },
  { label: "Other", value: 9 },
];
const HUES = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#737373"];
const MONO = [100, 75, 55, 38, 24];
const SEMI = [0, 2, 4, 7, 9];
const C = 150;
const R = 124;
const MIN_DEG = 6;
const fmt = new Intl.NumberFormat("en-US");

const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
};
const arc = (r: number, a0: number, a1: number) =>
  `path("M ${pt(r, a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(r, a1)}")`;

function Roll({ text }: { text: string }) {
  const chars = [...text];
  return (
    <span className="sdn-roll" aria-hidden>
      {chars.map((ch, i) => {
        const d = ch >= "0" && ch <= "9" ? +ch : -1;
        // key from the right so a growing number keeps its low digits
        const k = chars.length - i;
        return d < 0 ? (
          <span key={k + ch} className="sdn-ch">{ch === " " ? " " : ch}</span>
        ) : (
          <span key={k} className="sdn-dg">
            <span className="sdn-strip" style={{ "--d": d } as CSSProperties}>
              {"0123456789".split("").map((n) => <span key={n}>{n}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function StorageDonut({
  data = DATA,
  total = 256,
  title = "Storage used",
  arcWidth = 6,
  band = true,
  bandWidth = 34,
  gap = 6,
  segments = 5,
  palette = "Colour",
  readout = "Value + %",
  unit = "GB",
  sound = true,
  volume = 70,
  onSound,
}: StorageDonutProps) {
  const [active, setActive] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const last = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const k = unit === "MB" ? 1024 : 1;

  const segs = useMemo(() => {
    const n = Math.max(2, Math.min(segments, data.length));
    let items = data;
    if (data.length > n) {
      items = [...data.slice(0, n - 1), { label: "Other", value: data.slice(n - 1).reduce((s, d) => s + d.value, 0) }];
    }
    const used = items.reduce((s, d) => s + d.value, 0);
    const all = [...items, { label: "Free", value: Math.max(total - used, 0) }];
    let at = -90;
    const cap = ((arcWidth / 2) / R) * (180 / Math.PI);
    const bcap = ((bandWidth / 2) / (R - arcWidth / 2 - bandWidth / 2 - 2)) * (180 / Math.PI);
    return {
      used,
      list: all.map((d, i) => {
        const free = i === all.length - 1;
        const span = (d.value / total) * 360;
        const vis = Math.max(span - gap, MIN_DEG);
        const mid = at + span / 2;
        const a0 = mid - vis / 2 + cap, a1 = Math.max(mid + vis / 2 - cap, a0 + 0.1);
        const b0 = mid - vis / 2 + bcap, b1 = Math.max(mid + vis / 2 - bcap, b0 + 0.1);
        at += span;
        const ci = free ? 0 : i === items.length - 1 && items.length < 5 ? 4 : i;
        const color = palette === "Mono" ? `color-mix(in srgb, var(--fill-on) ${MONO[ci]}%, var(--fill-slab))` : HUES[ci];
        return { ...d, free, a0, a1, b0, b1, color, pct: Math.round((d.value / total) * 100), semi: free ? 12 : SEMI[Math.min(i, 4)] };
      }),
    };
  }, [data, total, segments, gap, arcWidth, bandWidth, palette]);

  const play = (i: number) => {
    const now = performance.now();
    if (!sound || !onSound || now - last.current < 60) return;
    last.current = now;
    const s = segs.list[i];
    onSound("blip", { volume: (s.free ? 0.25 : 0.5) * (volume / 100), pitch: 2 ** (s.semi / 12) });
  };
  const select = (i: number | null) => {
    setActive((p) => {
      if (i !== null && p !== i) play(i);
      return i;
    });
  };

  const a = active !== null ? segs.list[active] : null;
  const num = (v: number) => `${fmt.format(v * k)} ${unit}`;
  const main = a
    ? readout === "%" ? `${a.pct}%` : readout === "Value" ? num(a.value) : `${num(a.value)} [${a.pct}%]`
    : `${fmt.format(segs.used * k)} ${unit} of ${fmt.format(total * k)} ${unit}`;
  const name = a ? a.label : title;
  const bandR = R - arcWidth / 2 - bandWidth / 2 - 2;

  useEffect(() => {
    if (active === null) return;
    const off = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !(e.target as Element).closest?.("[data-seg]")) setActive(null);
    };
    window.addEventListener("pointerdown", off);
    return () => window.removeEventListener("pointerdown", off);
  }, [active]);

  const key = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + segs.list.length) % segs.list.length;
    setFocusIdx(n);
    root.current?.querySelectorAll<SVGGElement>("[data-seg]")[n]?.focus();
  };

  return (
    <div ref={root} className="sdn" data-active={a ? "on" : "off"} role="group" aria-label={`${title}, ${fmt.format(segs.used * k)} ${unit} of ${fmt.format(total * k)} ${unit}`}>
      <svg viewBox="0 0 300 300" width="300" height="300">
        {segs.list.map((s, i) => {
          const h = active === i ? 1 : 0;
          const dim = active !== null && active !== i;
          return (
            <g
              key={s.label}
              data-seg=""
              data-hot={h}
              className="sdn-seg"
              style={{ opacity: dim ? 0.45 : 1 }}
              role="img"
              tabIndex={focusIdx === i ? 0 : -1}
              aria-label={`${s.label}, ${num(s.value)}, ${s.pct} percent`}
              onPointerEnter={() => select(i)}
              onPointerLeave={() => setActive((p) => (p === i ? null : p))}
              onFocus={() => { setFocusIdx(i); select(i); }}
              onBlur={() => setActive((p) => (p === i ? null : p))}
              onKeyDown={(e) => key(e, i)}
            >
              <path className="sdn-hit" style={{ d: arc(R, s.a0, s.a1), strokeWidth: arcWidth + 16 } as CSSProperties} />
              {band && !s.free && (
                <>
                  <path
                    className="sdn-bedge"
                    style={{ d: arc(h ? R + 4 : bandR, s.b0, s.b1), strokeWidth: bandWidth + 2, stroke: `color-mix(in srgb, ${s.color} 30%, var(--fill-slab))`, opacity: h ? 0 : 1 } as CSSProperties}
                  />
                  <path
                    className="sdn-band"
                    style={{ d: arc(h ? R + 4 : bandR, s.b0, s.b1), strokeWidth: bandWidth, stroke: `color-mix(in srgb, ${s.color} ${palette === "Mono" ? 10 : 18}%, var(--fill-slab))`, opacity: h ? 0 : 1 } as CSSProperties}
                  />
                </>
              )}
              <path
                className="sdn-arc"
                data-free={s.free ? "" : undefined}
                style={{
                  d: arc(R + 4 * h, s.a0, s.a1),
                  strokeWidth: arcWidth + 2 * h,
                  stroke: s.free ? (h ? "var(--ink-4)" : "var(--ink-5)") : s.color,
                  strokeDasharray: s.free && !h ? "2 6" : "1000 0",
                } as CSSProperties}
              />
            </g>
          );
        })}
      </svg>
      <div className="sdn-mid" aria-hidden>
        <span className="sdn-name" key={name}>
          {a && !a.free && <i style={{ color: a.color }}>●&nbsp;</i>}
          {name}
        </span>
        <span className="sdn-main" data-long={main.length > 9 ? "" : undefined}><Roll text={main} /></span>
      </div>
      <span className="sdn-sr" aria-live="polite">{`${name}, ${main}`}</span>
    </div>
  );
}
