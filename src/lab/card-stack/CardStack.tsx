/* ══ Card stack ═════════════════════════════
   An endless deck of picture cards. Drag or flick the top card to either
   side and it flies off, then tucks in at the back of the pile while the
   rest step forward. A short drag springs back. With the stack focused,
   the Left and Right arrow keys throw the top card that way.

   ── A ROTATING LIST ──────────────────────────
   The deck is a list of card numbers; the first one is on top. A throw
   moves the first number to the end, so nothing is ever removed and the
   deck never runs out. Each card's place in the list sets its slot: every
   step back sits a few pixels higher and 5% smaller (scaled from its top
   edge, so exactly the peek shows), a little darker, and only the top four
   are visible.

   ── THREE LAYERS PER CARD ────────────────────
   Each card is three nested boxes. The outer one springs to the card's
   slot in the pile. The middle one lets the card just behind grow a touch
   as you drag the top card further, a preview of what comes next. The
   inner one follows the pointer through motion's drag gesture and tilts
   with its horizontal offset.

   ── THROW OR SNAP BACK ───────────────────────
   On release the drag's distance and speed decide: past the threshold, or
   faster than 0.5 px per ms, the card keeps going off that side. The list
   rotates at once, so the next card is ready to drag, but the thrown card
   stays drawn on top until it reaches the far point; then it drops to the
   back of the drawing order and springs home into the last slot. Otherwise
   it springs back with a small overshoot. The Bounce setting picks the
   springs' stiffness and damping. */

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  LazyMotion,
  domMax,
  m,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type CardStackProps = {
  /** cards in the deck, 3 to 8 */
  count?: number;
  /** card width in px; height is width × 1.3 */
  width?: number;
  /** card corner radius in px */
  radius?: number;
  /** px each card behind peeks out above the one in front */
  offset?: number;
  /** degrees of tilt at 100 px of horizontal drag */
  tilt?: number;
  /** px of horizontal drag that throws the card */
  threshold?: number;
  bounce?: "Low" | "Medium" | "High";
  /** show the title and caption scrim */
  captions?: boolean;
  /** image URLs, used in turn; without them each card gets a gradient */
  images?: string[];
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
  /** called with the index of the card that is now on top */
  onChange?: (topIndex: number) => void;
};

const TITLES = ["Meadow road", "River bend", "Fox hollow", "Swan lake", "Hare field", "Wolf ridge", "Flamingo bay", "Deer glade"];
const CAPTIONS = [
  "Poppies along the lane",
  "Slow water, tall grass",
  "A red tail in the clover",
  "Still water at dawn",
  "Long ears above the wheat",
  "Wind over the high pass",
  "Pink on the shallows",
  "Ferns and morning light",
];

const SPRING = {
  Low: { type: "spring", stiffness: 420, damping: 34 },
  Medium: { type: "spring", stiffness: 380, damping: 22 },
  High: { type: "spring", stiffness: 320, damping: 13 },
} as const;

const FLICK = 500; // px/s, i.e. 0.5 px/ms
const FLIGHT = 0.22; // s to the far point

/* two hues from a hash of the title */
function gradient(title: string) {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = h % 360;
  const b = (a + 40 + ((h >> 9) % 80)) % 360;
  return `linear-gradient(160deg, hsl(${a} 70% 68%), hsl(${b} 55% 38%))`;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

type Fling = (dir: number, vx?: number, vy?: number) => void;

type CardProps = {
  i: number;
  depth: number;
  count: number;
  width: number;
  height: number;
  offset: number;
  tilt: number;
  threshold: number;
  spring: (typeof SPRING)[keyof typeof SPRING];
  reduced: boolean;
  captions: boolean;
  image?: string;
  progress: MotionValue<number>;
  onThrow: () => void;
  register: (i: number, f: Fling | null) => void;
  sfx: (name: string, vol: number, pitch?: number) => void;
};

function Card({ i, depth, count, width, offset, tilt, threshold, spring, reduced, captions, image, progress, onThrow, register, sfx }: CardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const rotate = useTransform(x, (v) => (reduced ? 0 : (v * tilt) / 100));
  const preview = useTransform(progress, (p) => 1 + p * 0.03);
  const [flying, setFlying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const flyingRef = useRef(false);
  const top = depth === 0 && !flying;
  const title = TITLES[i % TITLES.length];

  const fling: Fling = (dir, vx = 0, vy = 0) => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    setFlying(true);
    onThrow();
    sfx("swipe", 0.5, 0.9 + Math.min(Math.abs(vx) / 3000, 1) * 0.25);
    animate(progress, 0, { duration: 0.2 });
    const land = () => {
      flyingRef.current = false;
      setFlying(false);
      sfx("slide", 0.35);
    };
    if (reduced) {
      // cross-fade to the back instead of flying
      animate(opacity, 0, { duration: 0.15 }).then(() => {
        x.set(0);
        y.set(0);
        land();
        opacity.set(1);
      });
      return;
    }
    Promise.all([
      animate(x, dir * width * 1.2, { duration: FLIGHT, ease: "easeOut" }),
      animate(y, y.get() + vy * 0.08, { duration: FLIGHT, ease: "easeOut" }),
    ]).then(() => {
      land();
      animate(x, 0, spring);
      animate(y, 0, spring);
    });
  };

  const flingRef = useRef(fling);
  flingRef.current = fling;
  useEffect(() => {
    const f: Fling = (...a) => flingRef.current(...a);
    register(i, f);
    return () => register(i, null);
  }, [i, register]);

  const snapBack = () => {
    animate(progress, 0, reduced ? { duration: 0 } : spring);
    if (reduced) {
      x.set(0);
      y.set(0);
      return;
    }
    animate(x, 0, spring);
    animate(y, 0, spring);
    sfx("jelly", 0.3);
  };

  // while flying, the card keeps its top slot
  const d = flying ? 0 : Math.min(depth, 3);

  return (
    <m.div
      className="cst-slot"
      style={{ zIndex: flying ? count + 1 : count - depth }}
      initial={false}
      animate={{
        y: -d * offset,
        scale: 1 - 0.05 * d,
        opacity: depth > 3 && !flying ? 0 : 1,
        filter: `brightness(${Math.pow(0.92, d).toFixed(3)})`,
      }}
      transition={reduced ? { duration: 0.15 } : spring}
    >
      <m.div className="cst-lift" style={{ scale: depth === 1 && !flying ? preview : 1 }}>
        <m.div
          className="cst-card"
          data-top={top || undefined}
          data-drag={dragging || undefined}
          aria-hidden={!top}
          style={{ x, y, rotate, opacity, ["--cst-fill" as string]: gradient(title) }}
          drag={top}
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDrag={() => progress.set(Math.min(Math.abs(x.get()) / threshold, 1))}
          onDragEnd={(_, info) => {
            setDragging(false);
            const dx = info.offset.x;
            const vx = info.velocity.x;
            const fast = Math.abs(vx) > FLICK;
            if (fast || Math.abs(dx) > threshold) fling(Math.sign(fast ? vx : dx) || 1, vx, info.velocity.y);
            else snapBack();
          }}
        >
          {image && <img src={image} alt={title} draggable={false} />}
          {captions && (
            <div className="cst-scrim">
              <div className="cst-title">{title}</div>
              <div className="cst-caption">{CAPTIONS[i % CAPTIONS.length]}</div>
            </div>
          )}
          {!image && !captions && <span className="cst-sr">{title}</span>}
        </m.div>
      </m.div>
    </m.div>
  );
}

export function CardStack({
  count = 5,
  width = 200,
  radius = 4,
  offset = 10,
  tilt = 12,
  threshold = 90,
  bounce = "Medium",
  captions = true,
  images,
  sound = true,
  volume = 70,
  onSound,
  onChange,
}: CardStackProps) {
  const reduced = !!useReducedMotion();
  const [order, setOrder] = useState(() => range(count));
  // count changes reset the order
  if (order.length !== count) setOrder(range(count));

  const height = Math.round(width * 1.3);
  const progress = useMotionValue(0);
  const throwers = useRef(new Map<number, Fling>());
  const register = useRef((i: number, f: Fling | null) => {
    if (f) throwers.current.set(i, f);
    else throwers.current.delete(i);
  }).current;

  const lastJelly = useRef(0);
  const sfx = (name: string, vol: number, pitch?: number) => {
    if (!sound || !onSound) return;
    if (name === "jelly") {
      const now = performance.now();
      if (now - lastJelly.current < 200) return;
      lastJelly.current = now;
    }
    onSound(name, { volume: (vol * volume) / 100, pitch });
  };

  const topIndex = order[0] ?? 0;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange?.(topIndex);
  }, [topIndex]);

  const onThrow = () => setOrder((o) => [...o.slice(1), o[0]]);

  const onKeyDown = (e: KeyboardEvent) => {
    const dir = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    throwers.current.get(topIndex)?.(dir, dir * 1500);
  };

  const topTitle = TITLES[topIndex % TITLES.length];
  const peek = Math.min(count - 1, 3) * offset;
  const style = {
    "--cst-w": `${width}px`,
    "--cst-h": `${height}px`,
    "--cst-peek": `${peek}px`,
    "--cst-r": `${radius}px`,
  } as CSSProperties;

  return (
    <LazyMotion features={domMax} strict>
      <div
        className="cst"
        style={style}
        role="group"
        tabIndex={0}
        aria-roledescription="card stack"
        aria-label={`Card stack, card ${topIndex + 1} of ${count}: ${topTitle}`}
        onKeyDown={onKeyDown}
      >
        {range(count).map((i) => (
          <Card
            key={i}
            i={i}
            depth={order.indexOf(i)}
            count={count}
            width={width}
            height={height}
            offset={offset}
            tilt={tilt}
            threshold={threshold}
            spring={SPRING[bounce] ?? SPRING.Medium}
            reduced={reduced}
            captions={captions}
            image={images?.length ? images[i % images.length] : undefined}
            progress={progress}
            onThrow={onThrow}
            register={register}
            sfx={sfx}
          />
        ))}
        <span className="cst-sr" aria-live="polite">
          {topTitle}
        </span>
      </div>
    </LazyMotion>
  );
}
