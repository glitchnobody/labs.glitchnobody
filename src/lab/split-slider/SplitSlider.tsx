/* ══ Split slider ═════════════════════════════════
   One track split between two things. Drag the divider, or press anywhere on
   the track, to change the mix: both bars resize, the percentages roll, and
   when a side gets too thin the labels hop up out of the way.

   ── ONE NUMBER, TWO BARS ─────────────────────
   The whole component is a single number, the left share in whole percents.
   The divider sits at that percent of the track and each bar fills what is
   left on its side, minus a gap, so CSS does all the sizing and nothing is
   measured while dragging. At 0 or 100 the empty bar keeps a 4 px sliver so
   the divider always has two sides.

   ── THE HOP ──────────────────────────────────
   When either side is under the threshold, the track slims from 34 px to
   10 px and both labels slide from inside the bars to above the track. The
   labels are positioned by a transform, so moving them is one transition, and
   the track height uses a springy linear() curve.

   ── ROLLING VALUES ───────────────────────────
   Each digit is a window one line tall over a strip of 0 to 9. Changing the
   digit moves the strip with a transform, so it rolls through the numbers
   between, like an odometer.

   ── SLIDER ───────────────────────────────────
   The divider is a keyboard slider (arrows, Shift for 10, Home and End). A
   tick plays every 5%, and a pop when the labels hop. */

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type SplitSliderProps = {
  /** left side's name */
  left?: string;
  /** right side's name */
  right?: string;
  /** starting share of the left side, 0 to 100 */
  split?: number;
  /** labels hop above the track when a side is under this percent */
  threshold?: number;
  color?: "Danger" | "Pick" | "Ok" | "Ink";
  /** uppercase monospace labels */
  mono?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onChange?: (leftPercent: number) => void;
  onSound?: Sound;
};

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

function Roll({ value }: { value: number }) {
  const digits = String(value).padStart(3, " ").split("");
  return (
    <span className="ss-num">
      {digits.map((d, i) => (
        <span key={i} className="ss-digit" data-blank={d === " " ? "" : undefined}>
          <span className="ss-strip" style={{ "--d": d === " " ? 0 : Number(d) } as CSSProperties}>
            {"0123456789".split("").map((c) => (
              <span key={c}>{c}</span>
            ))}
          </span>
        </span>
      ))}
      <span>%</span>
    </span>
  );
}

export function SplitSlider({
  left = "Coffee",
  right = "Milk",
  split = 71,
  threshold = 18,
  color = "Danger",
  mono = true,
  sound = true,
  volume = 70,
  onChange,
  onSound,
}: SplitSliderProps) {
  const [p, setP] = useState(clamp(split));
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef({ tick: 0, pop: 0, p: clamp(split), hop: false });

  useEffect(() => setP(clamp(split)), [split]);

  const hop = p < threshold || 100 - p < threshold;
  const loud = sound && onSound ? volume / 100 : 0;

  const set = (next: number) => {
    next = clamp(next);
    if (next === last.current.p) return;
    const now = performance.now();
    const l = last.current;
    const nextHop = next < threshold || 100 - next < threshold;
    if (loud) {
      if (Math.floor(next / 5) !== Math.floor(l.p / 5) && now - l.tick > 30) {
        l.tick = now;
        onSound!("tick", { volume: 0.3 * loud, pitch: 0.85 + 0.4 * (next / 100) });
      }
      if (nextHop !== l.hop && now - l.pop > 150) {
        l.pop = now;
        onSound!("pop", { volume: 0.4 * loud, pitch: nextHop ? 1.15 : 0.9 });
      }
    }
    l.p = next;
    l.hop = nextHop;
    setP(next);
    onChange?.(next);
  };
  last.current.hop = hop;

  const fromPointer = (e: RPointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };

  return (
    <div
      className="ss"
      data-hop={hop ? "" : undefined}
      data-mono={mono ? "" : undefined}
      data-color={color}
      style={{ "--p": p } as CSSProperties}
    >
      <span className="ss-label ss-l">
        <span className="ss-name">{left}</span>
        <Roll value={p} />
      </span>
      <span className="ss-label ss-r">
        <Roll value={100 - p} />
        <span className="ss-name">{right}</span>
      </span>
      <div
        ref={track}
        className="ss-track"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
        }}
        onPointerCancel={() => (dragging.current = false)}
      >
        <span className="ss-bar ss-bar-l" />
        <span className="ss-bar ss-bar-r" />
        <span
          className="ss-divider"
          role="slider"
          tabIndex={0}
          aria-label={`${left} and ${right} split`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={p}
          aria-valuetext={`${left} ${p} percent, ${right} ${100 - p} percent`}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 1;
            const to = { ArrowLeft: p - step, ArrowDown: p - step, ArrowRight: p + step, ArrowUp: p + step, Home: 0, End: 100 }[e.key];
            if (to === undefined) return;
            e.preventDefault();
            set(to);
          }}
        >
          <i />
        </span>
      </div>
    </div>
  );
}
