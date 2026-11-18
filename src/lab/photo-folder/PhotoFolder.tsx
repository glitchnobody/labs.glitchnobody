/* ══ Photo folder ═════════════════════════════════════
   A folder with photos tucked in its pocket. Hover it and the photos slide
   up one after another and fan out; move away and they sink back in. Focus
   does the same from the keyboard, and a tap toggles on touch screens.

   ── A SANDWICH ───────────────────────────────────────
   The folder is three layers: a back panel with its tab, the photos, and a
   front pocket drawn over the photos' lower half. Nothing is clipped; the
   pocket simply covers what is tucked inside, with a faint shadow cast up
   onto the prints so they read as sitting behind it.

   ── STAGGERED SPRINGS ────────────────────────────────
   Each photo is animated with a spring from motion. Rising, each starts 40
   ms after the one to its left and overshoots a little; sinking runs right
   to left with a softer spring. Because springs carry their velocity,
   hovering again mid-sink simply turns them around from wherever they are.

   ── THE FAN ──────────────────────────────────────────
   Risen photos rotate away from the centre in proportion to their distance
   from it, so the outermost turn the most, and spread sideways a few pixels,
   pivoting near their bottom edge like cards held in a hand. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";

export type PhotoFolderProps = {
  count?: number;
  rise?: number;
  fan?: number;
  folderStyle?: "Paper" | "Tinted" | "Dark";
  tab?: boolean;
  title?: string;
  /** photo URLs; without them each photo gets a gradient fill */
  images?: string[];
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const TILT = [-6, 4, -3, 5, -4, 3];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const gradient = (s: string) => {
  const h = hash(s);
  return `linear-gradient(160deg, hsl(${h % 360} 65% 70%), hsl(${(h >> 7) % 360} 60% 45%))`;
};

export function PhotoFolder({
  count = 4, rise = 34, fan = 14, folderStyle = "Paper", tab = true, title = "Photos", images,
  sound = true, volume = 70, onSound,
}: PhotoFolderProps) {
  const [up, setUp] = useState(false);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();
  const lastSnd = useRef(0);
  const n = Math.max(2, Math.min(6, Math.round(count)));

  useEffect(() => { const t = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(t); }, []);

  const set = (v: boolean) => {
    if (v === up) return;
    setUp(v);
    const t = performance.now();
    if (!sound || !onSound || t - lastSnd.current < 250) return;
    lastSnd.current = t;
    onSound("slide", v ? { volume: 0.6 * (volume / 100), pitch: 0.97 + Math.random() * 0.06 } : { volume: 0.4 * (volume / 100), pitch: 0.85 });
  };

  const spacing = Math.min(40, 132 / (n - 1));
  const mid = (n - 1) / 2;

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className="phf"
        data-style={folderStyle.toLowerCase()}
        data-tab={tab}
        tabIndex={0}
        role="img"
        aria-label={`Folder with ${n} photos`}
        onPointerEnter={(e) => { if (e.pointerType !== "touch") set(true); }}
        onPointerLeave={(e) => { if (e.pointerType !== "touch") set(false); }}
        onPointerDown={(e) => { if (e.pointerType === "touch") set(!up); }}
        onFocus={() => set(true)}
        onBlur={() => set(false)}
      >
        <svg className="phf-back" viewBox="0 0 220 140" aria-hidden>
          <path d={tab
            ? "M0 18 Q0 2 16 2 L76 2 C88 2 92 14 104 14 L204 14 Q220 14 220 30 L220 124 Q220 140 204 140 L16 140 Q0 140 0 124 Z"
            : "M0 30 Q0 14 16 14 L204 14 Q220 14 220 30 L220 124 Q220 140 204 140 L16 140 Q0 140 0 124 Z"} />
        </svg>
        {Array.from({ length: n }, (_, i) => {
          const o = mid ? (i - mid) / mid : 0;
          const img = images?.length ? images[i % images.length] : undefined;
          const rest = { y: 0, x: 0, rotate: TILT[i], opacity: 1 };
          const risen = { y: -rise, x: o * 8, rotate: o * fan + TILT[i] * 0.3, opacity: 1 };
          const delay = reduced ? 0 : (up ? i : n - 1 - i) * 0.04;
          return (
            <m.div
              key={i}
              className="phf-photo"
              style={{ left: 110 - 32 + (i - mid) * spacing, background: img ? `center / cover no-repeat url("${img}")` : gradient(`${title}-${i}`) } as CSSProperties}
              initial={{ y: 22, rotate: TILT[i], opacity: 1 }}
              animate={!shown ? { y: 22 } : up ? risen : rest}
              transition={
                reduced
                  ? { duration: 0.15 }
                  : up
                    ? { type: "spring", stiffness: 420, damping: 18, delay }
                    : { type: "spring", stiffness: 300, damping: 26, delay }
              }
            />
          );
        })}
        <div className="phf-pocket" aria-hidden />
      </div>
    </LazyMotion>
  );
}
