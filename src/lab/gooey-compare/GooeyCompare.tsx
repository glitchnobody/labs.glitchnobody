/* ══ Gooey compare ═════════════════════════════
   A before and after image slider with a liquid edge. Drag the handle, or
   press anywhere on the picture, and the split follows; move fast and the
   edge bulges like a curtain of liquid, then wobbles back flat. Arrow keys
   move it too while the handle has focus.

   ── ONE IMAGE, TWO LOOKS ─────────────────────
   Both sides are the same picture. The after side is shown as it is; the
   before side is a copy on top of it under a CSS filter (grayscale, sepia,
   blur, or grayscale with the accent colour blended in), clipped so it only
   shows on one side of the edge.

   ── THE EDGE IS A CURVE ──────────────────────
   The clip is a CSS path() rebuilt every frame: a straight run from the
   corner to the split, then two cubic curves down through the split whose
   middle is pushed sideways by the bulge. The white line is a stroked copy
   of the same curve, and the handle rides on its middle point.

   ── SPEED DRIVES A SPRING ────────────────────
   Each frame measures how fast the split moved. That speed, times the goo
   amount and clamped to 60 px, is the target of a spring for the bulge, so
   the middle of the edge leads the movement and the top and bottom lag.
   When the movement stops the target falls to zero and the spring swings
   through flat a few times before it rests; the wobble setting picks its
   stiffness and damping. A press away from the handle moves the split with
   a second, firmer spring, so a jump has speed and wobbles too.

   ── SOUND ────────────────────────────────────
   A tick each time the split crosses a 10% step, higher on the right, and a
   soft jelly sound the first time a big bulge swings back through flat. */

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type GooeyCompareProps = {
  /** the filter on the before side */
  treatment?: "Grayscale" | "Sepia" | "Blur" | "Duotone";
  orientation?: "Horizontal" | "Vertical";
  /** how far the edge bulges per speed, 0 to 100 (0 = straight) */
  goo?: number;
  /** how long the edge wobbles before it settles */
  wobble?: "Low" | "Medium" | "High";
  /** starting split in percent */
  split?: number;
  /** frame width in px */
  width?: number;
  aspect?: "4:3" | "1:1" | "3:4";
  /** frame corner in px */
  radius?: number;
  /** Before and After pills */
  labels?: boolean;
  /** image URLs; the first is used. Without one the picture is a gradient from the title */
  images?: string[];
  /** alt text, and the seed of the fallback gradient */
  title?: string;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
  onChange?: (percent: number) => void;
};

const SPRING = { Low: { k: 320, c: 32 }, Medium: { k: 260, c: 14 }, High: { k: 200, c: 6 } }; // per second
const JUMP = { k: 260, c: 32 }; // the split's own spring for presses and keys, about 300 ms
const MAX = 60; // px of bulge
const MIN = 2; // % kept from each side
const ASPECT = { "4:3": 3 / 4, "1:1": 1, "3:4": 4 / 3 };

/* two hues from a hash of the title, and a soft sun so the filters have something to show */
function gradient(title: string) {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = h % 360;
  const b = (a + 40 + ((h >> 9) % 80)) % 360;
  return `radial-gradient(circle at 70% 30%, hsl(${(a + 30) % 360} 90% 85%) 0 8%, transparent 26%), linear-gradient(160deg, hsl(${a} 70% 68%), hsl(${b} 55% 38%))`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function GooeyCompare({
  treatment = "Grayscale",
  orientation = "Horizontal",
  goo = 60,
  wobble = "Medium",
  split = 50,
  width = 300,
  aspect = "4:3",
  radius = 4,
  labels = true,
  images,
  title = "Meadow",
  sound = true,
  volume = 70,
  onSound,
  onChange,
}: GooeyCompareProps) {
  const vertical = orientation === "Vertical";
  const height = Math.round(width * ASPECT[aspect]);
  const image = images?.[0];

  const root = useRef<HTMLDivElement>(null);
  const before = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const pillB = useRef<HTMLSpanElement>(null);
  const pillA = useRef<HTMLSpanElement>(null);

  /* everything the frame loop reads, so it never waits for a render */
  const s = useRef({
    pos: clamp(split, MIN, 100 - MIN), // % shown
    target: clamp(split, MIN, 100 - MIN),
    pv: 0, // %/s of the split's spring
    chase: false, // the split springs to target instead of following it
    drag: false,
    b: 0, // bulge px
    bv: 0,
    speed: 0, // px/s, smoothed
    peak: 0,
    step: Math.floor(clamp(split, MIN, 100 - MIN) / 10),
    lastTick: 0,
    lastJelly: 0,
    raf: 0,
    t: 0,
  });
  const live = useRef({ vertical, width, height, goo, wobble, sound, volume, onSound, onChange, reduced: false });
  live.current = { ...live.current, vertical, width, height, goo, wobble, sound, volume, onSound, onChange };

  /* draw the edge, line, handle, pills and aria for the current state */
  const draw = () => {
    const { vertical: v, width: W, height: H } = live.current;
    const st = s.current;
    const len = v ? W : H; // along the edge
    const span = v ? H : W; // across it
    const x = (st.pos / 100) * span;
    const b = clamp(st.b, (MIN / 100) * span - x, ((100 - MIN) / 100) * span - x); // never past the 2% / 98% sides
    const m = x + b;
    const q = len / 4;
    const P = (a: number, c: number) => (v ? `${c} ${a}` : `${a} ${c}`); // (across, along) to (x, y)
    const curve = `C ${P(x, q)} ${P(m, q)} ${P(m, 2 * q)} C ${P(m, 3 * q)} ${P(x, 3 * q)} ${P(x, len)}`;
    if (before.current) before.current.style.clipPath = `path("M 0 0 L ${P(x, 0)} ${curve} L ${P(0, len)} Z")`;
    line.current?.setAttribute("d", `M ${P(x, 0)} ${curve}`);
    if (handle.current) {
      handle.current.style.transform = `translate(${v ? W / 2 : m}px, ${v ? m : H / 2}px) translate(-50%, -50%)`;
      handle.current.setAttribute("aria-valuenow", String(Math.round(st.pos)));
      handle.current.setAttribute("aria-valuetext", `${Math.round(st.pos)} percent before`);
    }
    /* a pill hides once the edge is over it; the edge's ends sit at x */
    const cover = (el: HTMLElement | null, isBefore: boolean) => {
      if (!el) return;
      const r = v ? el.offsetTop + el.offsetHeight : el.offsetLeft + el.offsetWidth;
      const l = v ? el.offsetTop : el.offsetLeft;
      el.toggleAttribute("data-hidden", isBefore ? x < r + 4 : x > l - 4);
    };
    cover(pillB.current, true);
    cover(pillA.current, false);
  };

  const frame = (now: number) => {
    const st = s.current;
    const L = live.current;
    const dt = Math.min(0.032, st.t ? (now - st.t) / 1000 : 0.016);
    st.t = now;
    const span = L.vertical ? L.height : L.width;
    const from = st.pos;

    if (L.reduced) {
      st.pos = st.target;
      st.pv = st.b = st.bv = 0;
    } else {
      if (st.chase) {
        st.pv += (JUMP.k * (st.target - st.pos) - JUMP.c * st.pv) * dt;
        st.pos += st.pv * dt;
        if (Math.abs(st.target - st.pos) < 0.05 && Math.abs(st.pv) < 1) {
          st.pos = st.target;
          st.pv = 0;
          st.chase = false;
        }
      } else st.pos = st.target;
      const v = (((st.pos - from) / 100) * span) / Math.max(dt, 0.001);
      st.speed += (v - st.speed) * 0.35;
      const goal = clamp(st.speed * (L.goo / 100) * 0.15, -MAX, MAX);
      const { k, c } = SPRING[L.wobble];
      const prev = st.b;
      st.bv += (k * (goal - st.b) - c * st.bv) * dt;
      st.b += st.bv * dt;
      st.peak = Math.max(st.peak, Math.abs(st.b));
      /* the first swing back through flat after a big bulge */
      if (st.peak > 15 && Math.abs(goal) < 5 && Math.sign(prev) !== Math.sign(st.b)) {
        if (L.sound && L.onSound && now - st.lastJelly > 300) {
          st.lastJelly = now;
          L.onSound("jelly", { volume: (L.volume / 100) * (0.2 + (0.3 * Math.min(st.peak, MAX)) / MAX) });
        }
        st.peak = 0;
      }
    }

    if (st.pos !== from) {
      const step = Math.floor(st.pos / 10);
      if (step !== st.step) {
        st.step = step;
        if (L.sound && L.onSound && now - st.lastTick > 40) {
          st.lastTick = now;
          L.onSound("tick", { volume: 0.25 * (L.volume / 100), pitch: 0.85 + 0.3 * (st.pos / 100) });
        }
      }
      L.onChange?.(st.pos);
    }
    draw();

    const still = !st.drag && !st.chase && Math.abs(st.b) < 0.1 && Math.abs(st.bv) < 1 && Math.abs(st.speed) < 1;
    if (still) {
      st.b = st.bv = st.speed = st.peak = 0;
      st.raf = 0;
      st.t = 0;
      draw();
    } else st.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (!s.current.raf) s.current.raf = requestAnimationFrame(frame);
  };

  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => (live.current.reduced = q.matches);
    update();
    q.addEventListener("change", update);
    return () => {
      q.removeEventListener("change", update);
      cancelAnimationFrame(s.current.raf);
    };
  }, []);

  /* a new start value from the knob jumps there; size and orientation redraw in percent */
  useEffect(() => {
    s.current.target = clamp(split, MIN, 100 - MIN);
    s.current.chase = true;
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split]);
  useLayoutEffect(draw);

  const percentAt = (e: PointerEvent) => {
    const r = root.current!.getBoundingClientRect();
    const p = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    return clamp(p * 100, MIN, 100 - MIN);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const st = s.current;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointers (the play demo) have no capture */
    }
    st.drag = true;
    st.chase = !handle.current?.contains(e.target as Node); // a press off the handle jumps with a spring
    st.target = percentAt(e);
    if (!st.chase) st.pv = 0;
    handle.current?.focus({ preventScroll: true });
    root.current?.setAttribute("data-dragging", "");
    e.preventDefault();
    kick();
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!s.current.drag) return;
    s.current.target = percentAt(e);
    kick();
  };
  const up = () => {
    s.current.drag = false;
    root.current?.removeAttribute("data-dragging");
  };

  const key = (e: KeyboardEvent) => {
    const st = s.current;
    const by = e.shiftKey ? 10 : 2;
    const less = vertical ? "ArrowUp" : "ArrowLeft";
    const more = vertical ? "ArrowDown" : "ArrowRight";
    let t: number;
    if (e.key === less) t = st.target - by;
    else if (e.key === more) t = st.target + by;
    else if (e.key === "Home") t = 0;
    else if (e.key === "End") t = 100;
    else return;
    e.preventDefault();
    st.target = clamp(t, MIN, 100 - MIN);
    st.chase = true;
    kick();
  };

  const picture = (hidden: boolean) =>
    image ? (
      <img className="gc-img" src={image} alt={hidden ? "" : title} aria-hidden={hidden || undefined} draggable={false} />
    ) : (
      <div className="gc-img" style={{ background: gradient(title) }} role={hidden ? undefined : "img"} aria-label={hidden ? undefined : title} aria-hidden={hidden || undefined} />
    );

  return (
    <div
      ref={root}
      className="gc"
      data-vertical={vertical ? "" : undefined}
      data-treatment={treatment.toLowerCase()}
      style={{ "--w": `${width}px`, "--h": `${height}px`, "--radius": `${radius}px` } as CSSProperties}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {picture(false)}
      <div ref={before} className="gc-before" aria-hidden="true">
        {picture(true)}
        {treatment === "Duotone" && <div className="gc-tint" />}
      </div>
      <svg className="gc-line" width={width} height={height} aria-hidden="true">
        <path ref={line} />
      </svg>
      {labels && (
        <>
          <span ref={pillB} className="gc-pill gc-pill-before" aria-hidden="true">
            Before
          </span>
          <span ref={pillA} className="gc-pill gc-pill-after" aria-hidden="true">
            After
          </span>
        </>
      )}
      <div
        ref={handle}
        className="gc-handle"
        role="slider"
        tabIndex={0}
        aria-label="Before and after comparison"
        aria-orientation={vertical ? "vertical" : "horizontal"}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={key}
      >
        <Icon icon={vertical ? "ph:arrows-down-up" : "ph:arrows-left-right"} width={16} height={16} />
      </div>
    </div>
  );
}
