/* ══ Jelly slider ═════════════════════════════════
   A percentage slider made of jelly. Drag along the pill to set the value, or
   click anywhere on it to jump there: the fill snaps over with a white flash,
   the number blurs into place and the whole pill wobbles before it settles.
   Arrow keys, Page Up/Down, Home and End work while it has focus.

   ── A PILL DRAWN EVERY FRAME ─────────────────────
   The pill is one SVG path. Its top and bottom edges are smooth curves
   (Catmull-Rom splines turned into cubic Béziers) through seven control
   points, joined by two rounded ends. The track, the fill's clip shape and
   the stroke all share that one path, so when the points move, everything
   ripples together.

   ── JELLY AS SPRINGS ─────────────────────────────
   Each control point is a small spring pulled back to the clean pill, and
   tied to its neighbours, so a push on one point travels along the pill as a
   wave. A jump kicks the points near the fill's leading edge outward, harder
   for a longer jump; a fast drag squashes the pill and lets it ring on
   release. Damping drains the energy, and once it is gone the loop stops and
   the path snaps back to the clean pill.

   ── FILL AND DIGITS ──────────────────────────────
   While dragging, the fill follows the pointer exactly. A click or key press
   sets a target instead, and a stiff spring carries the fill there with a
   small overshoot. The number is drawn twice: once in ink over the track and
   once in white, clipped to the fill, so it stays readable wherever the
   leading edge cuts through it. A changed digit is a new element that fades
   in from a blur while the old one blurs away, except while dragging, when
   digits swap instantly so they stay readable. */

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type JellySliderProps = {
  /** the starting value, 0 to 100; changing it animates like a click */
  value?: number;
  /** how much the pill ripples, 0 to 100 */
  wobble?: number;
  /** how quickly the ripple calms, 0 to 100 */
  damping?: number;
  /** a white glow at the leading edge when the value jumps */
  flash?: boolean;
  /** digits blur into their new values */
  blur?: boolean;
  accent?: "Pick" | "Ok" | "Danger" | "Ink";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onChange?: (value: number) => void;
  onSound?: Sound;
};

const W = 300; // pill width
const H = 52; // pill height
const PAD = 12; // room above and below for the bulge
const R = H / 2;
const TOP = PAD;
const MID = PAD + R;
const BOT = PAD + H;
const N = 7; // control points per edge
const XS = Array.from({ length: N }, (_, i) => R + (i * (W - 2 * R)) / (N - 1));
const KAPPA = 0.5523; // a quarter circle as a cubic
const CLEAN = Array<number>(N).fill(0);

const KS = 520; // each point's pull back to the pill
const KC = 900; // the tie between neighbours, which makes the wave travel
const FILL_K = 420; // the fill's spring: stiff…
const FILL_C = 2 * Math.sqrt(FILL_K) * 0.62; // …with a small overshoot

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const f1 = (n: number) => Math.round(n * 10) / 10;

/* a smooth curve through points (already at p[0]), flat at both ends so it meets the rounded caps */
function spline(p: number[][]) {
  const t = (j: number) =>
    j === 0 || j === p.length - 1 ? [p[1][0] - p[0][0], 0] : [(p[j + 1][0] - p[j - 1][0]) / 2, (p[j + 1][1] - p[j - 1][1]) / 2];
  let s = "";
  for (let i = 0; i < p.length - 1; i++) {
    const a = t(i);
    const b = t(i + 1);
    s += ` C${f1(p[i][0] + a[0] / 3)} ${f1(p[i][1] + a[1] / 3)} ${f1(p[i + 1][0] - b[0] / 3)} ${f1(p[i + 1][1] - b[1] / 3)} ${f1(p[i + 1][0])} ${f1(p[i + 1][1])}`;
  }
  return s;
}

/* the pill with each control point pushed out by d[i] (top up, bottom down) */
function pill(d: number[]) {
  const top = XS.map((x, i) => [x, TOP - d[i]]);
  const bot = XS.map((x, i) => [x, BOT + d[i]]).reverse();
  const xr = XS[N - 1];
  const xl = XS[0];
  const [tr, br, bl, tl] = [top[N - 1][1], bot[0][1], bot[N - 1][1], top[0][1]];
  const cap = (x: number, out: number, y0: number, y1: number) =>
    ` C${f1(x + out * KAPPA)} ${f1(y0)} ${x + out} ${f1(MID + (y0 - MID) * KAPPA)} ${x + out} ${MID}` +
    ` C${x + out} ${f1(MID + (y1 - MID) * KAPPA)} ${f1(x + out * KAPPA)} ${f1(y1)} ${x} ${f1(y1)}`;
  return `M${xl} ${f1(tl)}` + spline(top) + cap(xr, R, tr, br) + spline(bot) + cap(xl, -R, bl, tl) + "Z";
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return reduced;
}

type Num = { cur: number; prev: number; seq: number; anim: boolean };

function Digits({ num }: { num: Num }) {
  const cur = String(num.cur);
  const prev = String(num.prev);
  return (
    <span className="jly-num">
      {[...cur].map((d, i) => {
        const place = cur.length - 1 - i; // slots keyed from the right, so the ones digit keeps its slot
        const was = prev[prev.length - 1 - place];
        const changed = num.anim && num.seq > 0 && was !== d;
        return (
          <span key={place} className="jly-slot">
            <span key={d} className="jly-d" data-in={changed ? "" : undefined}>
              {d}
            </span>
            {changed && was !== undefined && (
              <span key={`o${num.seq}`} className="jly-d jly-out">
                {was}
              </span>
            )}
          </span>
        );
      })}
      <span className="jly-pct">%</span>
    </span>
  );
}

export function JellySlider({
  value = 16,
  wobble = 60,
  damping = 45,
  flash = true,
  blur = true,
  accent = "Pick",
  sound = true,
  volume = 70,
  onChange,
  onSound,
}: JellySliderProps) {
  const start = clamp(Math.round(value), 0, 100);
  const [num, setNum] = useState<Num>({ cur: start, prev: start, seq: 0, anim: false });
  const [dragging, setDragging] = useState(false);
  const reduced = useReducedMotion();
  const id = useId().replace(/[^\w-]/g, "");

  const root = useRef<HTMLDivElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const fillEl = useRef<SVGRectElement>(null);
  const gradEl = useRef<SVGLinearGradientElement>(null);
  const glowEl = useRef<SVGCircleElement>(null);
  const lightEl = useRef<HTMLDivElement>(null);

  /* everything the frame loop reads, kept out of React so a frame never re-renders */
  const sim = useRef({
    x: (start / 100) * W, // fill's leading edge
    vx: 0,
    target: (start / 100) * W,
    tween: null as null | { from: number; at: number }, // reduced motion: a 150 ms ease instead of the spring
    d: [...CLEAN],
    v: [...CLEAN],
    squash: 0, // how far a drag pulls the pill in
    drag: false,
    raf: 0,
    last: 0,
  });
  const live = useRef({ wobble, damping, reduced, sound, volume, onSound, onChange });
  live.current = { wobble, damping, reduced, sound, volume, onSound, onChange };
  const valRef = useRef(start);
  const lastTick = useRef(0);
  const lastJelly = useRef(0);

  const loud = () => (live.current.sound && live.current.onSound ? live.current.volume / 100 : 0);

  const draw = () => {
    const s = sim.current;
    const d = pill(s.d);
    for (const p of paths.current) p?.setAttribute("d", d);
    const x = clamp(s.x, 0, W);
    fillEl.current?.setAttribute("width", String(f1(x)));
    gradEl.current?.setAttribute("x2", String(f1(Math.max(1, x))));
    glowEl.current?.setAttribute("cx", String(f1(x)));
    if (lightEl.current) lightEl.current.style.width = `${(x / W) * 100}%`;
  };

  const frame = (now: number) => {
    const s = sim.current;
    const { wobble: wob, damping: damp, reduced: still } = live.current;
    const dt = Math.min(0.05, (now - s.last) / 1000 || 1 / 60);
    s.last = now;
    const steps = Math.ceil(dt / (1 / 240));
    const h = dt / steps;
    const c = 1 + damp * 0.08;
    for (let k = 0; k < steps; k++) {
      if (!s.drag && !s.tween) {
        s.vx += (FILL_K * (s.target - s.x) - FILL_C * s.vx) * h;
        s.x += s.vx * h;
      }
      if (still || wob === 0) continue;
      const rest = -s.squash;
      for (let i = 0; i < N; i++) {
        const l = s.d[Math.max(0, i - 1)];
        const r = s.d[Math.min(N - 1, i + 1)];
        s.v[i] += (-KS * (s.d[i] - rest) + KC * (l + r - 2 * s.d[i]) - c * s.v[i]) * h;
      }
      for (let i = 0; i < N; i++) s.d[i] = clamp(s.d[i] + s.v[i] * h, -10, PAD);
    }
    if (s.tween) {
      const t = clamp((now - s.tween.at) / 150, 0, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      s.x = s.tween.from + (s.target - s.tween.from) * e;
      if (t === 1) s.tween = null;
    }
    if (still || wob === 0) s.d.fill(0);
    draw();
    const energy = s.d.reduce((a, n, i) => a + Math.abs(n) + Math.abs(s.v[i]) * 0.05, 0);
    const settled = !s.drag && !s.tween && Math.abs(s.target - s.x) < 0.05 && Math.abs(s.vx) < 0.5 && energy < 0.08;
    if (settled) {
      s.x = s.target;
      s.vx = 0;
      s.d.fill(0);
      s.v.fill(0);
      draw();
      s.raf = 0;
      return;
    }
    s.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const s = sim.current;
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(frame);
  };

  /* push the points near x outward; size 0–1 (1% barely moves, 80% rings fully) */
  const wobbleAt = (x: number, size: number) => {
    const s = sim.current;
    const amp = (live.current.wobble / 100) * 450 * clamp(size * 1.25, 0, 1);
    for (let i = 0; i < N; i++) s.v[i] = clamp(s.v[i] + amp * Math.exp(-(((XS[i] - x) / 70) ** 2)), -400, 400);
    const l = loud();
    const now = performance.now();
    if (l && size > 0.03 && now - lastJelly.current > 200) {
      lastJelly.current = now;
      live.current.onSound!("jelly", { volume: (0.3 + 0.5 * size) * l, pitch: 1.1 - 0.2 * size });
    }
    kick();
  };

  const glow = () => {
    if (!flash) return;
    glowEl.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: "ease-out" });
  };

  /* set the integer value; anim says whether digits blur, tick whether it ticks */
  const commit = (v: number, anim: boolean, tick: boolean) => {
    if (v === valRef.current) return;
    valRef.current = v;
    setNum((n) => ({ cur: v, prev: n.cur, seq: n.seq + 1, anim }));
    live.current.onChange?.(v);
    const l = loud();
    const now = performance.now();
    if (tick && l && now - lastTick.current >= 35) {
      lastTick.current = now;
      live.current.onSound!("tick", { volume: 0.3 * l, pitch: 0.85 + (0.4 * v) / 100 });
    }
  };

  /* a click, key press or new value prop: spring there, flash, wobble */
  const jump = (v: number, tick: boolean) => {
    const s = sim.current;
    const from = valRef.current;
    if (v === from) return;
    s.target = (v / 100) * W;
    if (live.current.reduced) s.tween = { from: s.x, at: performance.now() };
    commit(v, true, tick);
    glow();
    wobbleAt(s.target, Math.abs(v - from) / 100);
  };

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(sim.current.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    jump(start, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const toX = (clientX: number) => {
    const b = root.current!.getBoundingClientRect();
    return clamp(((clientX - b.left) / b.width) * W, 0, W);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    root.current?.focus({ preventScroll: true });
    const s = sim.current;
    const x0 = e.clientX;
    let moved = false;
    let lastX = toX(e.clientX);
    let lastT = performance.now();
    let speed = 0; // px/s, smoothed
    jump(Math.round((lastX / W) * 100), false);

    /* window listeners keep the drag going outside the pill (and work with synthetic demo events) */
    const move = (ev: globalThis.PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - x0) < 3) return;
      if (!moved) {
        moved = true;
        s.drag = true;
        s.tween = null;
        s.vx = 0;
        setDragging(true);
      }
      const x = toX(ev.clientX);
      const now = performance.now();
      speed = speed * 0.7 + (((x - lastX) / Math.max(1, now - lastT)) * 1000) * 0.3;
      lastX = x;
      lastT = now;
      s.x = s.target = x;
      s.squash = live.current.reduced ? 0 : Math.min(8, Math.abs(speed) * 0.004) * (live.current.wobble / 100);
      commit(Math.round((x / W) * 100), false, true);
      kick();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!moved) return;
      s.drag = false;
      s.squash = 0;
      s.target = (valRef.current / 100) * W; // rest on the whole number
      setDragging(false);
      wobbleAt(s.x, Math.max(0.15, Math.min(1, Math.abs(speed) / 1500)));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const v = valRef.current;
    const next =
      { ArrowLeft: v - 1, ArrowDown: v - 1, ArrowRight: v + 1, ArrowUp: v + 1, PageUp: v + 10, PageDown: v - 10, Home: 0, End: 100 }[
        e.key
      ];
    if (next === undefined) return;
    e.preventDefault();
    const to = clamp(next, 0, 100);
    if (to === v) return;
    jump(to, true);
    wobbleAt(sim.current.target, 0.15); // each key press gets a small wobble even for a 1% step
  };

  const d0 = pill(CLEAN);
  const path = (i: number, className: string, extra?: object) => (
    <path
      ref={(el) => {
        paths.current[i] = el;
      }}
      className={className}
      d={d0}
      {...extra}
    />
  );

  return (
    <div
      ref={root}
      className="jly"
      role="slider"
      tabIndex={0}
      aria-label="Progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={num.cur}
      aria-valuetext={`${num.cur} percent`}
      data-accent={accent.toLowerCase()}
      data-blur={blur ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      style={{ "--w": `${W}px`, "--h": `${H}px`, "--pad": `${PAD}px` } as CSSProperties}
    >
      <svg className="jly-svg" viewBox={`0 0 ${W} ${H + 2 * PAD}`} aria-hidden="true">
        <defs>
          <clipPath id={`${id}-clip`}>{path(0, "")}</clipPath>
          <linearGradient ref={gradEl} id={`${id}-grad`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className="jly-stop-a" />
            <stop offset="1" className="jly-stop-b" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" className="jly-glow-a" />
            <stop offset="1" className="jly-glow-b" />
          </radialGradient>
        </defs>
        {path(1, "jly-track")}
        <g clipPath={`url(#${id}-clip)`}>
          <rect ref={fillEl} className="jly-fill" x="0" y="0" height={H + 2 * PAD} width="0" fill={`url(#${id}-grad)`} />
          <circle ref={glowEl} className="jly-glow" cy={MID} r="30" fill={`url(#${id}-glow)`} />
        </g>
        {path(2, "jly-edge")}
      </svg>
      <div className="jly-label" aria-hidden="true">
        <Digits num={num} />
      </div>
      <div ref={lightEl} className="jly-light" aria-hidden="true">
        <div className="jly-label">
          <Digits num={num} />
        </div>
      </div>
    </div>
  );
}
