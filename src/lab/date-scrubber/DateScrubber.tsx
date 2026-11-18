/* ══ Date scrubber ═════════════════════════════════
   A date picker you flick like a ruler. Drag or flick the day ticks under
   the marker; it glides, snaps to a day, and a Today pill brings you back.

   ── ONE NUMBER ───────────────────────────────────
   The whole ruler is a single float: how many days the marker is from
   today. Dragging changes it 1:1 (pixels divided by the tick spacing); the
   selected day is that number rounded. Only about fifty ticks around it are
   rendered, each placed at its distance from the marker.

   ── MOMENTUM AND SPRINGS ─────────────────────
   On release the number keeps the release velocity and decays it
   exponentially, time-corrected per frame. When it slows down, a damped
   spring pulls it to the nearest whole day. The same spring pulls it back
   from outside the range, which gives the soft bounce at both ends, and
   carries the glide back to today.

   ── FISHEYE ──────────────────────────────────
   Each tick's height and darkness follow a Gaussian of its distance to the
   marker, so ticks swell as they pass under it. Mondays and the 1st of each
   month are taller, and months stay dark at any distance. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type DateScrubberProps = {
  /** days available before and after today */
  range?: number;
  /** distance between day ticks in px */
  spacing?: number;
  /** how much ticks grow near the marker, 0 to 100 */
  fisheye?: number;
  /** how far a flick carries, 0 to 100 */
  friction?: number;
  accent?: "Danger" | "Pick" | "Ink";
  format?: "Sun • Oct 27" | "27 Oct 2026" | "Oct 27";
  /** month names under the 1st */
  months?: boolean;
  sound?: boolean;
  volume?: number;
  onChange?: (date: Date) => void;
  onSound?: Sound;
};

const W = 320;
const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", o);
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function DateScrubber({
  range = 90,
  spacing = 9,
  fisheye = 60,
  friction = 50,
  accent = "Danger",
  format = "Sun • Oct 27",
  months = false,
  sound = true,
  volume = 70,
  onChange,
  onSound,
}: DateScrubberProps) {
  const root = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const [today, setToday] = useState(() => dayOf(new Date()));
  const [pos, setPos] = useState(0);
  const [moving, setMoving] = useState(false);
  const [mounted, setMounted] = useState(false); // dates depend on the clock and timezone, so ticks wait for the client
  useEffect(() => setMounted(true), []);
  const sim = useRef({ pos: 0, v: 0, target: null as number | null, drag: false, raf: 0, last: 0, tick: 0, tickAt: 0, landed: 0 });
  const idle = useRef(0);
  const wheelT = useRef(0);
  const p = useRef({ range, spacing, friction, sound, volume, onChange, onSound, today });
  p.current = { range, spacing, friction, sound, volume, onChange, onSound, today };

  const play = (name: string, vol: number, pitch?: number) => {
    const c = p.current;
    if (c.sound) c.onSound?.(name, { volume: (vol * c.volume) / 100, pitch });
  };
  const dateAt = (n: number) => new Date(p.current.today.getFullYear(), p.current.today.getMonth(), p.current.today.getDate() + n);

  const sync = () => {
    const s = sim.current;
    const n = Math.round(s.pos);
    const now = performance.now();
    if (n !== s.tick) {
      s.tick = n;
      if (now - s.tickAt > 25) {
        s.tickAt = now;
        play("tick", 0.3, 0.9 + Math.min(Math.abs(s.v) / 20, 1) * 0.3);
      }
    }
    setPos(s.pos);
  };

  const loop = (t: number) => {
    const s = sim.current;
    s.raf = 0;
    if (s.drag) return;
    const dt = Math.min((t - s.last) / 1000, 0.04) || 0.016;
    s.last = t;
    const R = p.current.range;
    if (s.target === null && Math.abs(s.pos) > R) s.target = Math.max(-R, Math.min(R, s.pos));
    if (s.target !== null) {
      s.v += ((s.target - s.pos) * 170 - s.v * 20) * dt;
      s.pos += s.v * dt;
      if (Math.abs(s.target - s.pos) < 0.003 && Math.abs(s.v) < 0.05) {
        s.pos = s.target;
        s.v = 0;
        s.target = null;
        sync();
        land();
        return;
      }
    } else {
      s.pos += s.v * dt;
      s.v *= Math.exp(-4 * dt);
      if (Math.abs(s.v) < 0.6) s.target = Math.round(s.pos);
    }
    sync();
    s.raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    const s = sim.current;
    if (!s.raf) {
      s.last = performance.now();
      s.raf = requestAnimationFrame(loop);
    }
  };
  const busy = () => {
    clearTimeout(idle.current);
    setMoving(true);
  };
  const land = () => {
    const s = sim.current;
    const n = Math.round(s.pos);
    if (n !== s.landed) {
      s.landed = n;
      p.current.onChange?.(dateAt(n));
    }
    clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setMoving(false), 600);
  };
  const goTo = (n: number, glide = true) => {
    const s = sim.current;
    const R = p.current.range;
    n = Math.max(-R, Math.min(R, n));
    busy();
    s.v = 0;
    if (!glide || reduced()) {
      s.pos = n;
      s.target = null;
      sync();
      land();
    } else {
      s.target = n;
      kick();
    }
  };

  const drag = useRef({ x: 0, p0: 0, hist: [] as [number, number][] });
  const down = (e: React.PointerEvent) => {
    const s = sim.current;
    s.drag = true;
    s.target = null;
    s.v = 0;
    drag.current = { x: e.clientX, p0: s.pos, hist: [[performance.now(), s.pos]] };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    busy();
  };
  const move = (e: React.PointerEvent) => {
    const s = sim.current;
    if (!s.drag) return;
    const d = drag.current;
    let n = d.p0 - (e.clientX - d.x) / p.current.spacing;
    const R = p.current.range;
    if (Math.abs(n) > R) n = Math.sign(n) * (R + (Math.abs(n) - R) * 0.35);
    s.pos = n;
    d.hist.push([performance.now(), n]);
    if (d.hist.length > 8) d.hist.shift();
    sync();
  };
  const up = () => {
    const s = sim.current;
    if (!s.drag) return;
    s.drag = false;
    const h = drag.current.hist;
    const now = performance.now();
    const a = h.find((q) => now - q[0] < 100) ?? h[h.length - 1];
    const dt = (now - a[0]) / 1000;
    const v = dt > 0.005 ? (s.pos - a[1]) / dt : 0;
    if (reduced()) return goTo(Math.round(s.pos), false);
    s.v = Math.max(-300, Math.min(300, v)) * (p.current.friction / 100);
    if (Math.abs(s.v) < 0.6) s.target = Math.round(s.pos);
    kick();
    if (s.target !== null && !s.raf) land();
  };

  const key = (e: React.KeyboardEvent) => {
    const n = Math.round(sim.current.pos);
    const R = p.current.range;
    const to: Record<string, number> = { ArrowLeft: n - 1, ArrowRight: n + 1, PageUp: n + 7, PageDown: n - 7, Home: -R, End: R };
    if (!(e.key in to)) return;
    e.preventDefault();
    goTo(to[e.key]);
  };
  const toToday = () => {
    if (Math.round(sim.current.pos) === 0 && !sim.current.target) return;
    play("swipe", 0.5);
    goTo(0);
  };

  // wheel needs a non-passive listener to stop the page scrolling
  useEffect(() => {
    const el = ruler.current!;
    const f = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      e.preventDefault();
      const s = sim.current;
      s.target = null;
      s.v = 0;
      busy();
      const R = p.current.range;
      s.pos = Math.max(-R, Math.min(R, s.pos + d / p.current.spacing));
      sync();
      clearTimeout(wheelT.current);
      wheelT.current = window.setTimeout(() => goTo(Math.round(s.pos), !reduced()), 150);
    };
    el.addEventListener("wheel", f, { passive: false });
    return () => el.removeEventListener("wheel", f);
  }, []);

  // T jumps to today while the pointer or focus is inside the block
  useEffect(() => {
    const r = root.current!;
    const scope = r.closest("[data-shortcut-scope]") ?? r;
    let inside = false;
    const en = () => (inside = true);
    const lv = () => (inside = false);
    const f = (e: KeyboardEvent) => {
      if ((e.key !== "t" && e.key !== "T") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!inside && !scope.contains(document.activeElement)) return;
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      toToday();
    };
    scope.addEventListener("pointerenter", en);
    scope.addEventListener("pointerleave", lv);
    document.addEventListener("keydown", f);
    return () => {
      scope.removeEventListener("pointerenter", en);
      scope.removeEventListener("pointerleave", lv);
      document.removeEventListener("keydown", f);
    };
  }, []);

  // midnight rollover: check each minute
  useEffect(() => {
    const t = setInterval(() => setToday((d) => (dayOf(new Date()).getTime() === d.getTime() ? d : dayOf(new Date()))), 60000);
    return () => {
      clearInterval(t);
      cancelAnimationFrame(sim.current.raf);
      clearTimeout(idle.current);
      clearTimeout(wheelT.current);
    };
  }, []);

  // a smaller range clamps the selection
  useLayoutEffect(() => {
    if (Math.abs(sim.current.pos) > range) goTo(Math.sign(sim.current.pos) * range, false);
  }, [range]);

  const sel = Math.round(pos);
  const selDate = dateAt(sel);
  const label = useMemo(() => {
    if (format === "27 Oct 2026") return fmt(selDate, { day: "numeric", month: "short", year: "numeric" });
    if (format === "Oct 27") return fmt(selDate, { month: "short", day: "numeric" });
    return `${fmt(selDate, { weekday: "short" })} • ${fmt(selDate, { month: "short", day: "numeric" })}`;
  }, [format, sel, today]);

  const sigma = 3 + fisheye / 20;
  const amp = fisheye / 60;
  const half = Math.ceil(W / 2 / spacing) + 2;
  const ticks = [];
  for (let i = Math.max(-range, sel - half); i <= Math.min(range, sel + half) && mounted; i++) {
    const d = i - pos;
    const g = fisheye ? Math.exp(-(d * d) / (2 * sigma * sigma)) : 0;
    const date = dateAt(i);
    const first = date.getDate() === 1;
    const mon = date.getDay() === 1;
    const h = Math.min(36, (fisheye ? 8 + 18 * amp * g : 10) + (first ? 6 : mon ? 3 : 0));
    const gp = Math.round(g * 100);
    ticks.push(
      <i
        key={i}
        className="dsc-tick"
        data-first={first}
        data-flat={!fisheye}
        style={{ height: Math.round(h * 10) / 10, width: Math.min(1.5, spacing - 1), transform: `translateX(${Math.round(d * spacing * 10) / 10}px)`, "--g": gp } as CSSProperties}
      >
        {months && first && <b className="dsc-month">{fmt(date, { month: "short" })}</b>}
      </i>,
    );
  }

  const style = {
    "--dsc-accent": accent === "Pick" ? "var(--pick)" : accent === "Ink" ? "var(--fill-on)" : "var(--danger)",
    "--dsc-accent-on": accent === "Ink" ? "var(--fill-slab)" : "#fff",
  } as CSSProperties;

  return (
    <div className="dsc" ref={root} style={style}>
      <div className="dsc-pills">
        <button type="button" className="dsc-today dsc-left" data-show={sel > 0} tabIndex={sel > 0 ? 0 : -1} aria-label="Jump to today" onClick={toToday}>
          ← Today
        </button>
        <span className="dsc-date" data-moving={moving} suppressHydrationWarning>{label}</span>
        <button type="button" className="dsc-today dsc-right" data-show={sel < 0} tabIndex={sel < 0 ? 0 : -1} aria-label="Jump to today" onClick={toToday}>
          Today →
        </button>
      </div>
      <div
        className="dsc-ruler"
        ref={ruler}
        role="slider"
        tabIndex={0}
        aria-label="Date"
        aria-valuemin={-range}
        aria-valuemax={range}
        aria-valuenow={sel}
        aria-valuetext={fmt(selDate, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        {ticks}
        <span className="dsc-marker" />
      </div>
    </div>
  );
}
