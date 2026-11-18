/* ══ Value slider ═════════════════════════════════
   A slider whose thumb swells while you hold it and whose bubble shows the
   number. Drag past either end to feel the track stretch, or click the track
   to glide the thumb there. Arrow keys, Page Up/Down, Home and End work too.

   ── ONE POSITION, TWO NUMBERS ────────────────────
   The thumb has a position from 0 to 100 and an overshoot in pixels. The
   position is where the value is; the overshoot is how far the thumb has been
   pulled past an end. While dragging, the position follows the pointer snapped
   to the step, and the overshoot is a quarter of the pull, at most 14 px, so
   the end feels like rubber. The track stretches by the same amount from the
   opposite end with a scaleX transform.

   ── A TINY SPRING ────────────────────────────────
   Gliding to a clicked spot and returning from a stretch share one
   requestAnimationFrame loop: a damped spring pulls the position toward its
   target and the overshoot toward zero, with a little bounce. A press on the
   track starts the glide and, if the pointer then moves, hands over to a drag.
   With reduced motion the spring becomes a 120 ms ease and nothing swells.

   ── SOUND ────────────────────────────────────────
   A dry tick plays whenever the value lands on a multiple of 5 (every step if
   the step is 5 or more), higher in pitch as the value rises, at most once
   per 30 ms.  */

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type ValueSliderProps = {
  /** the value it starts at; changing it glides the thumb there */
  value?: number;
  /** value increments: 1, 5 or 10 */
  step?: number | string;
  /** show the number above the thumb while pressed */
  bubble?: boolean;
  accent?: "Pick" | "Ok" | "Ink";
  title?: string;
  onChange?: (value: number) => void;
  sound?: boolean;
  volume?: number;
  onSound?: Sound;
};

const THUMB = 22;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function ValueSlider({
  value = 0,
  step: stepProp = 1,
  bubble = true,
  accent = "Pick",
  title = "Value slider",
  onChange,
  sound = true,
  volume = 70,
  onSound,
}: ValueSliderProps) {
  const step = Math.max(1, Number(stepProp) || 1);
  const snap = (p: number) => clamp(Math.round(p / step) * step, 0, 100);

  const [pos, setPos] = useState(() => clamp(value, 0, 100));
  const [over, setOver] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  const rail = useRef<HTMLDivElement>(null);
  const live = useRef({ pos: pos, over: 0, v: snap(pos), tick: 0 });
  const raf = useRef(0);
  const hide = useRef(0);
  const drag = useRef<{ id: number; x0: number; moved: boolean; glide: boolean } | null>(null);
  const cb = useRef({ onChange, onSound, sound, volume, step });
  cb.current = { onChange, onSound, sound, volume, step };

  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const f = () => setReduced(q.matches);
    q.addEventListener("change", f);
    return () => {
      q.removeEventListener("change", f);
      cancelAnimationFrame(raf.current);
      clearTimeout(hide.current);
    };
  }, []);

  const loud = () => (cb.current.sound && cb.current.onSound ? cb.current.volume / 100 : 0);

  // the value changes whenever the snapped position does; tick on multiples
  const commit = (p: number) => {
    const s = cb.current.step;
    const v = clamp(Math.round(p / s) * s, 0, 100);
    if (v === live.current.v) return;
    live.current.v = v;
    cb.current.onChange?.(v);
    const now = performance.now();
    if (loud() && (s >= 5 || v % 5 === 0) && now - live.current.tick > 30) {
      live.current.tick = now;
      cb.current.onSound!("tick", { volume: 0.35 * loud(), pitch: 0.85 + (0.4 * v) / 100 });
    }
  };

  const set = (p: number, o: number) => {
    live.current.pos = p;
    live.current.over = o;
    setPos(p);
    setOver(o);
    commit(p);
  };

  // glide toward a position (or hold it) while the overshoot returns to zero
  const run = (target: number | null) => {
    cancelAnimationFrame(raf.current);
    const goal = target ?? live.current.pos;
    const p0 = live.current.pos;
    const o0 = live.current.over;
    let vp = 0;
    let vo = 0;
    let last = performance.now();
    const tick = (t: number) => {
      let { pos: p, over: o } = live.current;
      let done = false;
      if (reduced) {
        const e = 1 - (1 - clamp((t - last0) / 120, 0, 1)) ** 3;
        p = p0 + (goal - p0) * e;
        o = o0 * (1 - e);
        done = t - last0 >= 120;
      } else {
        const dt = Math.min(0.032, (t - last) / 1000);
        last = t;
        vp += ((goal - p) * 180 - vp * 18) * dt;
        vo += ((0 - o) * 260 - vo * 22) * dt;
        p += vp * dt;
        o += vo * dt;
        done = Math.abs(goal - p) < 0.05 && Math.abs(vp) < 0.5 && Math.abs(o) < 0.1 && Math.abs(vo) < 1;
      }
      if (done) {
        p = goal;
        o = 0;
      }
      set(p, o);
      if (!done) raf.current = requestAnimationFrame(tick);
    };
    const last0 = last;
    raf.current = requestAnimationFrame(tick);
  };

  // a new value from outside glides like a click
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    run(snap(clamp(value, 0, 100)));
  }, [value]);

  const flash = (ms: number) => {
    setShown(true);
    clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setShown(false), ms);
  };

  const geom = (e: PointerEvent) => {
    const r = rail.current!.getBoundingClientRect();
    const span = r.width - THUMB;
    return { x: e.clientX - r.left - THUMB / 2, span };
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const { x, span } = geom(e);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic pointer (play demo) */ }
    cancelAnimationFrame(raf.current);
    clearTimeout(hide.current);
    const onThumb = Math.abs(x - (live.current.pos / 100) * span) <= THUMB / 2 + 4;
    drag.current = { id: e.pointerId, x0: e.clientX, moved: onThumb, glide: !onThumb };
    setPressed(true);
    setShown(true);
    if (onThumb) return;
    run(snap(clamp((x / span) * 100, 0, 100)));
  };

  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      if (Math.abs(e.clientX - d.x0) < 3) return;
      d.moved = true;
      d.glide = false;
      cancelAnimationFrame(raf.current);
    }
    const { x, span } = geom(e);
    const pull = x < 0 ? x : x > span ? x - span : 0;
    set(snap(clamp((x / span) * 100, 0, 100)), clamp(pull * 0.25, -14, 14));
  };

  const up = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setPressed(false);
    clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setShown(false), 300);
    if (!d.glide) run(null);
  };

  const key = (e: KeyboardEvent) => {
    const v = live.current.v;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowUp" ? v + step :
      e.key === "ArrowLeft" || e.key === "ArrowDown" ? v - step :
      e.key === "PageUp" ? v + 10 :
      e.key === "PageDown" ? v - 10 :
      e.key === "Home" ? 0 :
      e.key === "End" ? 100 : null;
    if (next === null) return;
    e.preventDefault();
    flash(800);
    run(snap(next));
  };

  const shownValue = clamp(Math.round(pos / step) * step, 0, 100);
  const style = {
    "--p": pos / 100,
    "--o": `${over}px`,
    "--stretch": over === 0 ? 1 : 1 + Math.abs(over) / 192,
    "--origin": over < 0 ? "right" : "left",
  } as CSSProperties;

  return (
    <div className="vs" data-accent={accent.toLowerCase()} data-pressed={pressed ? "" : undefined} data-reduced={reduced ? "" : undefined}>
      {title && <div className="vs-title">{title}</div>}
      <div
        className="vs-tile"
        role="slider"
        tabIndex={0}
        aria-label={title || "Value"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shownValue}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        style={style}
      >
        <div ref={rail} className="vs-rail">
          <div className="vs-track">
            <div className="vs-fill" />
          </div>
          <div className="vs-thumb">
            <div className="vs-knob" />
            {bubble && (
              <div className="vs-bubble" data-show={shown ? "" : undefined} aria-hidden="true">
                {shownValue}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
