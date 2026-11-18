/* ══ Liquid toggle ═════════════════════════════
   An on/off switch with a liquid lens riding a gradient pill. Click it and the
   lens stretches across into a capsule and springs round at the other end; or
   drag the lens and fling it. Off sits at the left, on at the right.

   ── TWO EDGES, TWO SPRINGS ────────────────────
   The lens is not one moving circle but two edges, each pulled to its target
   by its own spring. The edge in the direction of travel has a stiff spring
   and leaves first; the trailing edge has a soft one and lags behind, so the
   gap between them grows into a capsule. The stretch knob caps that gap as a
   share of the track; past the cap the trailing edge is towed along. When the
   leading edge arrives, the trailing edge catches up, overshoots a little and
   the lens wobbles round, with the bounce knob setting the springs' damping.

   ── SHARP INSIDE, BLURRED OUTSIDE ─────────────
   The pill is the gradient with a CSS blur, which softens its edges into a
   glow that spills past the pill. The lens is a window holding a second, sharp
   copy of the same gradient, shifted by the lens's own offset so the colours
   line up with the track beneath it. Edges and window are written straight to
   the DOM each animation frame, so moving never re-renders React.

   ── FLINGING ──────────────────────────────────
   While dragging, the pointer sets where the lens should be and the same two
   springs chase it, so a fast drag stretches it more. On release, a quick
   flick goes to the end it was thrown towards; a slow release goes to the
   nearer end.

   ── NOTES ALONG THE WAY ───────────────────────
   The track is split into five zones tuned to a pentatonic scale. Each time
   the lens's centre enters a zone a marimba blip plays at that note, so going
   on is a rising run and going off a falling one; a jelly boing marks the
   settle. */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type LiquidToggleProps = {
  checked?: boolean;
  size?: "S" | "M" | "L";
  /** px of blur on the gradient outside the lens */
  blur?: number;
  /** longest the lens stretches, as a share of the track (0 to 1) */
  stretch?: number;
  /** spring bounce when it settles, 0 to 100 */
  bounce?: number;
  palette?: "Red → Blue" | "Sunset" | "Mint" | "Mono";
  label?: string;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onChange?: (on: boolean) => void;
  onSound?: Sound;
};

const SIZES = { S: [64, 28], M: [92, 40], L: [120, 52] } as const;
const PALETTES = {
  "Red → Blue": ["#e8343a", "#f09cc4", "#3d7fe0"],
  Sunset: ["#ff5e3a", "#ffb347", "#8f5bff"],
  Mint: ["#9aa3ad", "#7fe0c3", "#1fb38a"],
  Mono: ["var(--ink-4)", "var(--ink-3)", "var(--fill-on)"],
};
const INSET = 3;
const LEAD_K = 900; // stiff spring for the edge in front
const TRAIL_K = 220; // soft spring for the edge behind
const NOTES = [0, 2, 4, 7, 9];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function LiquidToggle({
  checked = false,
  size = "M",
  blur = 10,
  stretch = 0.7,
  bounce = 40,
  palette = "Red → Blue",
  label = "Liquid toggle",
  sound = true,
  volume = 70,
  onChange,
  onSound,
}: LiquidToggleProps) {
  const [on, setOn] = useState(checked);
  const [W, H] = SIZES[size] ?? SIZES.M;
  const D = H - INSET * 2;
  const offA = INSET;
  const onA = W - INSET - D;

  const lens = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const sim = useRef({
    a: on ? onA : offA, // left edge
    b: (on ? onA : offA) + D, // right edge
    va: 0,
    vb: 0,
    ta: on ? onA : offA, // target of the left edge
    tween: null as null | { from: number; to: number; at: number },
    drag: null as null | { id: number; x0: number; a0: number; moved: boolean; hist: [number, number][] },
    moving: false,
    raf: 0,
    last: 0,
    zone: -1,
  });
  const live = useRef({ W, D, stretch, bounce, sound, volume, onSound, onChange, on });
  live.current = { W, D, stretch, bounce, sound, volume, onSound, onChange, on };
  const lastBlip = useRef(0);
  const lastJelly = useRef(0);

  const play = (name: string, vol: number, pitch = 1, gap: { current: number }, ms: number) => {
    const l = live.current;
    const now = performance.now();
    if (!l.sound || !l.onSound || now - gap.current < ms) return;
    gap.current = now;
    l.onSound(name, { volume: vol * (l.volume / 100), pitch });
  };

  const draw = () => {
    const s = sim.current;
    if (!lens.current || !fill.current) return;
    lens.current.style.transform = `translateX(${s.a.toFixed(2)}px)`;
    lens.current.style.width = `${(s.b - s.a).toFixed(2)}px`;
    fill.current.style.transform = `translateX(${(-s.a).toFixed(2)}px)`;
    const { W: w } = live.current;
    const zone = clamp(Math.floor((((s.a + s.b) / 2) / w) * 5), 0, 4);
    if (s.moving && zone !== s.zone) play("blip", 0.35, 2 ** (NOTES[zone] / 12), lastBlip, 50);
    s.zone = zone;
  };

  const frame = (now: number) => {
    const s = sim.current;
    const { W: w, D: d, stretch: st, bounce: bo } = live.current;
    const dt = Math.min(0.032, (now - s.last) / 1000 || 0.016);
    s.last = now;
    let rest = false;

    if (s.tween) {
      // reduced motion: a 150 ms slide, no stretch or bounce
      const t = clamp((now - s.tween.at) / 150, 0, 1);
      s.a = s.tween.from + (s.tween.to - s.tween.from) * (1 - (1 - t) ** 2);
      s.b = s.a + d;
      if (t === 1) (s.tween = null), (rest = true);
    } else {
      const ta = s.ta;
      const tb = ta + d;
      const dir = Math.sign(ta - (s.a + s.b - d) / 2) || 1;
      const zeta = 1 - (clamp(bo, 0, 100) / 100) * 0.85;
      const maxLen = Math.max(d, st * w);
      const minLen = d * 0.78;
      const steps = 4;
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const ka = dir < 0 ? LEAD_K : TRAIL_K;
        const kb = dir > 0 ? LEAD_K : TRAIL_K;
        s.va += (ka * (ta - s.a) - 2 * zeta * Math.sqrt(ka) * s.va) * h;
        s.vb += (kb * (tb - s.b) - 2 * zeta * Math.sqrt(kb) * s.vb) * h;
        s.a += s.va * h;
        s.b += s.vb * h;
        const len = s.b - s.a;
        // tow the trailing edge so the capsule never outgrows the cap or pinches shut
        if (len > maxLen || len < minLen) {
          const want = clamp(len, minLen, maxLen);
          if (dir > 0) (s.a = s.b - want), (s.va = s.vb);
          else (s.b = s.a + want), (s.vb = s.va);
        }
      }
      s.a = clamp(s.a, 0, w - minLen);
      s.b = clamp(s.b, s.a + minLen, w);
      const still = Math.abs(s.va) + Math.abs(s.vb) < 4 && Math.abs(ta - s.a) + Math.abs(tb - s.b) < 0.4;
      if (still && !s.drag) (s.a = ta), (s.b = tb), (s.va = s.vb = 0), (rest = true);
    }

    draw();
    if (rest) {
      s.raf = 0;
      if (s.moving) play("jelly", 0.45, 1, lastJelly, 200);
      s.moving = false;
      return;
    }
    s.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const s = sim.current;
    s.moving = true;
    if (!s.raf) {
      s.last = performance.now();
      s.raf = requestAnimationFrame(frame);
    }
  };

  const goTo = (next: boolean) => {
    const s = sim.current;
    const { W: w, D: d } = live.current;
    const to = next ? w - INSET - d : INSET;
    s.ta = to;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      s.tween = { from: s.a, to, at: performance.now() };
      s.va = s.vb = 0;
    } else s.tween = null;
    kick();
    if (next !== live.current.on) {
      setOn(next);
      live.current.onChange?.(next);
    }
  };

  useEffect(() => setOn(checked), [checked]);

  /* a new checked prop or size: go there (snap when only the size changed) */
  const prevSize = useRef(size);
  useLayoutEffect(() => {
    const s = sim.current;
    if (prevSize.current !== size) {
      prevSize.current = size;
      s.ta = s.a = on ? onA : offA;
      s.b = s.a + D;
      s.va = s.vb = 0;
      draw();
      return;
    }
    if (s.ta !== (on ? onA : offA) && !s.drag) goTo(on);
  }, [on, size]);

  useLayoutEffect(() => draw(), []);
  useEffect(() => () => cancelAnimationFrame(sim.current.raf), []);

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const s = sim.current;
    // a drag that starts anywhere on the pill carries the lens (easier to grab than the lens alone)
    s.drag = { id: e.pointerId, x0: e.clientX, a0: s.ta, moved: false, hist: [[e.timeStamp, e.clientX]] };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic demo pointers cannot be captured */
    }
  };

  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const g = sim.current.drag;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x0;
    if (!g.moved && Math.abs(dx) > 4) g.moved = true;
    if (!g.moved) return;
    const { W: w, D: d } = live.current;
    sim.current.tween = null;
    sim.current.ta = clamp(g.a0 + dx, INSET, w - INSET - d);
    g.hist.push([e.timeStamp, e.clientX]);
    if (g.hist.length > 6) g.hist.shift();
    kick();
  };

  const up = (e: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current;
    const g = s.drag;
    if (!g || g.id !== e.pointerId) return;
    s.drag = null;
    if (!g.moved) return goTo(!live.current.on);
    const [t0, x0] = g.hist[0];
    const v = (e.clientX - x0) / Math.max(1, e.timeStamp - t0); // px per ms
    const { W: w, D: d } = live.current;
    goTo(Math.abs(v) > 0.3 ? v > 0 : s.ta + d / 2 > w / 2);
  };

  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = e.key === " " || e.key === "Enter" ? !on : e.key === "ArrowRight" ? true : e.key === "ArrowLeft" ? false : null;
    if (next === null) return;
    e.preventDefault();
    goTo(next);
  };

  const [c1, c2, c3] = PALETTES[palette] ?? PALETTES["Red → Blue"];
  const style = {
    "--lqt-w": `${W}px`,
    "--lqt-h": `${H}px`,
    "--lqt-d": `${D}px`,
    "--lqt-blur": `${blur}px`,
    "--lqt-c1": c1,
    "--lqt-c2": c2,
    "--lqt-c3": c3,
    "--lqt-grad": `linear-gradient(90deg, ${c1}, ${c2}, ${c3})`,
  } as CSSProperties;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="lqt"
      data-on={on}
      style={style}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      <span className="lqt-glow" aria-hidden />
      <span className="lqt-body" aria-hidden />
      <span className="lqt-lens" ref={lens} aria-hidden>
        <span className="lqt-sharp" ref={fill} />
      </span>
    </button>
  );
}
