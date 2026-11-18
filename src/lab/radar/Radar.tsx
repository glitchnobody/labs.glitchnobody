/* ══ Radar ════════════════════════════════════════════
   A nearby-people radar whose sweep pings each blip as it passes. Press a
   blip to see who it is and how far away; press empty radar to drop a new
   person there. Double-press a dropped blip to remove it. Tab moves through
   the people, Enter selects, Esc deselects and N drops someone at random.

   ── ONE ANGLE DRIVES EVERYTHING ──────────────────────
   A requestAnimationFrame loop advances a single angle and writes it to a
   CSS custom property. The sweep line rotates by it and the wedge behind it
   is a conic-gradient that starts from it, so the two can never drift
   apart. React does not re-render per frame.

   ── PINGS ────────────────────────────────────────────
   Each frame compares the angle before and after the step. Any blip whose
   bearing lies in that slice was crossed, however fast the sweep, and gets
   a flash and a halo through the Web Animations API, plus a ping whose
   pitch and loudness fall with distance. The loop pauses when the radar is
   off screen or the tab is hidden, and pings are only heard while the pointer
   is on the radar's card or it is open, so the wall stays quiet.

   ── PEOPLE ───────────────────────────────────────────
   Starting positions come from a seeded random generator, so they are the
   same on every load. Drifting blips follow slow sine paths and stay inside
   the disc. A selected blip grows into an avatar with a name pill, and the
   ring at its distance draws itself in. */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const NAMES = ["Mika", "Ana", "Nathan", "Oğuz", "Mariana", "Afshin", "Ashish", "June", "Theo", "Sana", "Leo", "Ines"];
const METRES = 50;
const MAX = 12;

export type RadarProps = {
  speed?: number;
  wedge?: number;
  afterglow?: number;
  rings?: number;
  blips?: number;
  moving?: boolean;
  crosshair?: boolean;
  color?: "Phosphor" | "Amber" | "Accent" | "Ink";
  size?: number;
  /** one photo per name, in NAMES order; without them people get gradient avatars */
  avatars?: string[];
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

type Blip = { id: number; p: number; a: number; r: number; dropped: boolean };

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const START: Blip[] = (() => {
  const r = rng(7);
  return NAMES.map((_, i) => ({ id: i, p: i, a: (i * 137.5 + r() * 50) % 360, r: 0.2 + r() * 0.75, dropped: false }));
})();

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const gradient = (s: string) => {
  const h = hash(s);
  return `linear-gradient(135deg, hsl(${h % 360} 70% 62%), hsl(${(h >> 8) % 360} 70% 46%))`;
};
const metres = (r: number) => Math.round(r * METRES);

export function Radar({
  speed = 50, wedge = 60, afterglow = 1.6, rings = 5, blips = 4, moving = false, crosshair = true,
  color = "Phosphor", size = 300, avatars, sound = true, volume = 70, onSound,
}: RadarProps) {
  const root = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<Blip[]>(() => START.slice(0, blips));
  const [sel, setSel] = useState<number | null>(null);
  const [say, setSay] = useState("");
  const pos = useRef(new Map<number, { a: number; r: number }>());
  const els = useRef(new Map<number, HTMLButtonElement>());
  const nextId = useRef(100);
  const lastPing = useRef(0);
  const lastClick = useRef({ id: -1, t: 0 });
  const live = useRef({ speed, afterglow, moving, sound, volume, onSound, list, sel });
  live.current = { speed, afterglow, moving, sound, volume, onSound, list, sel };

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    const l = live.current;
    if (l.sound && l.onSound) l.onSound(name, { ...o, volume: (o.volume ?? 1) * (l.volume / 100) });
  };

  useEffect(() => {
    setList((cur) => {
      const base = START.slice(0, blips), drops = cur.filter((b) => b.dropped);
      return [...base, ...drops].slice(-MAX);
    });
  }, [blips]);
  useEffect(() => { if (sel !== null && !list.some((b) => b.id === sel)) setSel(null); }, [list, sel]);

  const place = (id: number, a: number, r: number) => {
    const el = els.current.get(id);
    if (!el) return;
    const rad = (a * Math.PI) / 180;
    el.style.left = `${50 + 50 * r * Math.sin(rad)}%`;
    el.style.top = `${50 - 50 * r * Math.cos(rad)}%`;
  };

  /* the sweep loop */
  useEffect(() => {
    const el = root.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, angle = 0, t0 = 0, onScreen = false, running = false;
    const frame = (now: number) => {
      const l = live.current;
      const dt = t0 ? Math.min(0.05, (now - t0) / 1000) : 0;
      t0 = now;
      const period = 8 - (l.speed / 100) * 6.5;
      const prev = angle;
      angle = (angle + (360 / period) * dt) % 360;
      if (!reduced) el.style.setProperty("--rdr-angle", `${angle}deg`);
      const crossed = (a: number) => (prev <= angle ? a > prev && a <= angle : a > prev || a <= angle);
      for (const b of l.list) {
        let p = pos.current.get(b.id);
        if (!p) { p = { a: b.a, r: b.r }; pos.current.set(b.id, p); }
        if (l.moving) {
          const s = now / 1000 + b.id * 3.1;
          p.a = (b.a + 6 * Math.sin(s * 0.23) + 4 * Math.sin(s * 0.11 + 1)) % 360;
          p.r = Math.min(0.95, Math.max(0.17, b.r + 0.05 * Math.sin(s * 0.17 + 2)));
          place(b.id, p.a, p.r);
        }
        if (dt && crossed((p.a + 360) % 360)) ping(b.id, p.r);
      }
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const want = onScreen && !document.hidden;
      if (want && !running) { running = true; t0 = 0; raf = requestAnimationFrame(frame); }
      if (!want && running) { running = false; cancelAnimationFrame(raf); }
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); cancelAnimationFrame(raf); };
  }, []);

  /* the sweep never stops, so it only pings out loud while someone is looking at it:
     the pointer is on its card or stage, focus is inside, or it is open in the modal */
  function audible() {
    const el = root.current;
    if (!el) return false;
    if (el.closest("dialog[open]")) return true;
    const scope = el.closest("[data-shortcut-scope]") ?? el;
    return scope.matches(":hover") || scope.contains(document.activeElement);
  }

  function ping(id: number, r: number) {
    const el = els.current.get(id);
    if (!el) return;
    const ms = live.current.afterglow * 1000;
    el.querySelector(".rdr-dot")?.animate([{ opacity: 1 }, { opacity: 0.15 }], { duration: ms, easing: "ease-in" });
    el.querySelector(".rdr-halo")?.animate(
      [{ transform: "scale(1)", opacity: 0.8 }, { transform: "scale(3.2)", opacity: 0 }],
      { duration: Math.min(900, ms), easing: "cubic-bezier(.2,.7,.2,1)" },
    );
    const t = performance.now();
    if (t - lastPing.current < 60 || !audible()) return;
    lastPing.current = t;
    snd("ping", { pitch: 1.4 - 0.6 * r, volume: 0.7 - 0.4 * r });
  }

  function select(id: number) {
    const b = list.find((x) => x.id === id)!;
    const t = performance.now(), lc = lastClick.current;
    lastClick.current = { id, t };
    if (b.dropped && lc.id === id && t - lc.t < 400) {
      setList((cur) => cur.filter((x) => x.id !== id));
      setSel(null);
      setSay(`Removed ${NAMES[b.p]}`);
      snd("tick", { pitch: 0.8 });
      return;
    }
    if (sel === id) { setSel(null); snd("tick", { pitch: 0.9 }); return; }
    setSel(id);
    const p = pos.current.get(id) ?? b;
    setSay(`${NAMES[b.p]}, ${metres(p.r)} metres`);
    snd("tick", { pitch: 1.2 });
  }

  function drop(a: number, r: number) {
    r = Math.min(0.95, Math.max(0.17, r));
    const used = new Set(list.map((b) => b.p));
    const p = NAMES.findIndex((_, i) => !used.has(i));
    const pick = p < 0 ? (list.find((b) => b.dropped) ?? list[0]).p : p;
    const id = nextId.current++;
    pos.current.set(id, { a, r });
    setList((cur) => {
      let next = [...cur, { id, p: pick, a, r, dropped: true }];
      if (next.length > MAX) { const old = next.find((b) => b.dropped && b.id !== id) ?? next[0]; next = next.filter((b) => b !== old); }
      return next;
    });
    setSay(`Added ${NAMES[pick]}, ${metres(r)} metres`);
    snd("pop", { volume: 0.7 });
    requestAnimationFrame(() => {
      const el = els.current.get(id);
      el?.animate([{ transform: "translate(-50%,-50%) scale(0)" }, { transform: "translate(-50%,-50%) scale(1.4)" }, { transform: "translate(-50%,-50%) scale(1)" }], { duration: 320, easing: "ease-out" });
      el?.querySelector(".rdr-dot")?.animate([{ opacity: 1 }, { opacity: 0.15 }], { duration: live.current.afterglow * 1000, easing: "ease-in" });
    });
  }

  /* N drops, Esc deselects, only while the pointer or focus is inside */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = root.current;
      if (!el || e.metaKey || e.ctrlKey || e.altKey) return;
      const scope = el.closest("[data-shortcut-scope]") ?? el;
      if (!scope.matches(":hover") && !scope.contains(document.activeElement)) return;
      if (e.key === "Escape" && live.current.sel !== null) { setSel(null); snd("tick", { pitch: 0.9 }); }
      if ((e.key === "n" || e.key === "N") && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        dropRef.current(Math.random() * 360, 0.2 + Math.random() * 0.75);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const dropRef = useRef(drop);
  dropRef.current = drop;

  const ringR = useMemo(() => Array.from({ length: rings }, (_, i) => (50 * (i + 1)) / rings), [rings]);
  const selB = list.find((b) => b.id === sel);
  const selP = selB ? pos.current.get(selB.id) ?? selB : null;
  const style = {
    "--rdr-size": `${size}px`,
    "--rdr-wedge": `${wedge}deg`,
  } as CSSProperties;

  return (
    <div
      ref={root}
      className="rdr"
      role="group"
      aria-label={`Nearby radar, ${list.length} ${list.length === 1 ? "person" : "people"}`}
      data-color={color.toLowerCase()}
      style={style}
      onClick={(e) => {
        if (e.target !== e.currentTarget && !(e.target as Element).closest(".rdr-bg")) return;
        const r = root.current!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        const d = Math.hypot(x, y) * 2;
        if (d > 1) return;
        drop(((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360, d);
      }}
    >
      <svg className="rdr-bg" viewBox="0 0 100 100" aria-hidden>
        {crosshair && <path className="rdr-cross" d="M0 50H100M50 0V100" />}
        {ringR.map((r) => <circle key={r} className="rdr-ring" cx="50" cy="50" r={r - 0.25} />)}
        {selP && (
          <circle key={`${sel}-${metres(selP.r)}`} className="rdr-hot" cx="50" cy="50" r={50 * selP.r} pathLength={1} />
        )}
      </svg>
      <div className="rdr-wedge" aria-hidden />
      <div className="rdr-line" aria-hidden />
      <div className="rdr-core" aria-hidden />
      {[...list].sort((a, b) => a.r - b.r).map((b) => {
        const p = pos.current.get(b.id) ?? b;
        const rad = (p.a * Math.PI) / 180;
        const on = sel === b.id;
        const name = NAMES[b.p];
        const img = avatars?.[b.p];
        return (
          <button
            key={b.id}
            ref={(el) => { if (el) els.current.set(b.id, el); else els.current.delete(b.id); }}
            type="button"
            className="rdr-blip"
            data-on={on}
            aria-pressed={on}
            aria-label={`${name}, ${metres(p.r)} metres`}
            style={{ left: `${50 + 50 * p.r * Math.sin(rad)}%`, top: `${50 - 50 * p.r * Math.cos(rad)}%` }}
            onClick={(e) => { e.stopPropagation(); select(b.id); }}
          >
            <span className="rdr-halo" />
            <span className="rdr-dot" />
            <span className="rdr-face" style={{ background: img ? `center / cover url("${img}")` : gradient(name) }} />
            {on && (
              <span className="rdr-label" data-flip={Math.sin(rad) * p.r > 0.25}>
                {name} · {metres(p.r)} m
              </span>
            )}
          </button>
        );
      })}
      <span className="rdr-sr" aria-live="polite">{say}</span>
    </div>
  );
}
