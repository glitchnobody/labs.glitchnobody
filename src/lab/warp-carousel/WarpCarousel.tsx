/* ══ Warp carousel ════════════════════════════════════
   A carousel of cards on the inside of a bent track. Drag or flick it and
   the side cards turn away and streak with motion; click a side card to
   bring it to the front, click a step dot to jump, or let it play by itself
   with the step player underneath. Left and Right step from the keyboard.

   ── A CYLINDER IN CSS 3D ─────────────────────────────
   Each card is turned around a vertical axis by its distance from the
   centre and pushed out by the cylinder's radius, inside a perspective
   container. Bend sets both the angle between cards and the radius, so at
   zero the track is a flat row and at full bend the cards wrap a full
   circle; cards past ninety degrees are seen from behind, mirrored.

   ── ONE CONTINUOUS OFFSET ────────────────────────────
   The carousel's position is a single number in cards. Dragging moves it
   one card per card width, a flick keeps going with the release speed and
   slows by the Momentum setting, and a spring settles it on the nearest
   whole card. Each time a card crosses the centre a whoosh plays, louder
   and higher the faster it goes.

   ── SMEAR ────────────────────────────────────────────
   Behind each card sits a blurred, stretched copy of its picture anchored
   at the card's outer edge. Its stretch and opacity grow with the card's
   angle from the centre and with the carousel's speed, so a fast spin
   streaks everything while a resting carousel only smears the far cards. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

export type WarpCarouselProps = {
  bend?: number;
  smear?: number;
  count?: number;
  cardWidth?: number;
  interval?: number;
  momentum?: number;
  /** card pictures; without them each card gets a glowing gradient */
  images?: string[];
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const glow = (i: number) => {
  const h = (i * 67 + 210) % 360, h2 = (h + 70) % 360, h3 = (h + 300) % 360;
  return `radial-gradient(circle at 30% 30%, hsl(${h} 90% 62%), transparent 55%), radial-gradient(circle at 75% 70%, hsl(${h2} 85% 55%), transparent 55%), radial-gradient(circle at 60% 20%, hsl(${h3} 80% 60% / .7), transparent 45%), hsl(${h} 60% 14%)`;
};
const wrap = (d: number, n: number) => ((((d + n / 2) % n) + n) % n) - n / 2;

export function WarpCarousel({
  bend = 60, smear = 55, count = 5, cardWidth = 120, interval = 3, momentum = 50, images, sound = true, volume = 70, onSound,
}: WarpCarouselProps) {
  const n = Math.max(3, Math.min(6, Math.round(count)));
  const [, force] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [say, setSay] = useState("");
  const st = useRef({ off: 0, vel: 0, target: null as number | null, drag: null as null | { x: number; off: number; t: number; lx: number; moved: boolean }, idle: 0, auto: 0, lastWhoosh: 0, centre: 0 });
  const raf = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduced = useRef(false);
  const live = useRef({ n, cardWidth, momentum, interval, playing, sound, volume, onSound });
  live.current = { n, cardWidth, momentum, interval, playing, sound, volume, onSound };

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    const l = live.current;
    if (l.sound && l.onSound) l.onSound(name, { ...o, volume: (o.volume ?? 1) * (l.volume / 100) });
  };

  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPlaying(false);
    let last = performance.now();
    const s = st.current;
    s.auto = last;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const l = live.current;
      if (!s.drag) {
        if (s.target === null && Math.abs(s.vel) > 0.05) {
          s.off += s.vel * dt;
          s.vel *= Math.pow(0.02 + 0.2 * (l.momentum / 100), dt * 3);
        } else {
          const goal = s.target ?? Math.round(s.off);
          if (reduced.current) { s.off += (goal - s.off) * Math.min(1, dt * 12); s.vel = 0; }
          else { s.vel += (-90 * (s.off - goal) - 16 * s.vel) * dt; s.off += s.vel * dt; }
          if (Math.abs(s.off - goal) < 0.002 && Math.abs(s.vel) < 0.02) { s.off = goal; s.vel = 0; s.target = null; }
        }
      }
      const c = Math.round(s.off);
      if (c !== s.centre) {
        s.centre = c;
        const sp = Math.min(1, Math.abs(s.vel) / 6);
        const el = root.current, scope = el?.closest("[data-shortcut-scope]") ?? el;
        const heard = !!el && (!!el.closest("dialog[open]") || !!scope?.matches(":hover") || !!scope?.contains(document.activeElement) || !!s.drag);
        if (heard && now - s.lastWhoosh > 70) { s.lastWhoosh = now; snd("whoosh", { volume: 0.25 + 0.4 * sp, pitch: 0.9 + 0.3 * sp }); }
        setSay(`Card ${(((c % l.n) + l.n) % l.n) + 1} of ${l.n}`);
      }
      /* autoplay: paused by interaction for 4 s, or by the button for good */
      const resting = !s.drag && s.target === null && Math.abs(s.vel) < 0.02;
      const idleFor = now - s.idle;
      if (l.playing && idleFor > 4000) {
        setWaiting(false);
        if (!resting) s.auto = now;
        else if (now - s.auto > l.interval * 1000) { s.auto = now; s.target = Math.round(s.off) + 1; }
      } else s.auto = now;
      force((v) => (v + 1) % 1e6);
      raf.current = visible ? requestAnimationFrame(step) : 0;
    };
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf.current) { last = performance.now(); raf.current = requestAnimationFrame(step); }
    });
    io.observe(root.current!);
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); raf.current = 0; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const touch = () => { st.current.idle = performance.now(); if (live.current.playing) setWaiting(true); };
  const go = (to: number) => { const s = st.current; s.target = to; s.vel = 0; touch(); };
  const toCard = (i: number) => { const s = st.current; go(Math.round(s.off) + wrap(i - Math.round(s.off), n)); };

  const s = st.current;
  const speed = Math.min(1, Math.abs(s.vel) / 5);
  const stepA = 18 + (360 / n - 18) * (bend / 100);
  const R = (cardWidth + 16) / (2 * Math.tan(((stepA / 2) * Math.PI) / 180));
  const active = ((Math.round(s.off) % n) + n) % n;
  const progress = !mounted ? 0 : playing && !waiting ? Math.min(1, (performance.now() - s.auto) / (interval * 1000)) : playing ? 0 : 1;

  return (
    <div className="wcr" ref={root} style={{ "--wcr-w": `${cardWidth}px` } as CSSProperties}>
      <div
        className="wcr-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Paintings"
        tabIndex={0}
        onPointerDown={(e) => {
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
          s.drag = { x: e.clientX, off: s.off, t: performance.now(), lx: e.clientX, moved: false };
          s.target = null; s.vel = 0; touch();
        }}
        onPointerMove={(e) => {
          const d = s.drag;
          if (!d) return;
          if (Math.abs(e.clientX - d.x) > 6) d.moved = true;
          const now = performance.now(), dt = Math.max(1, now - d.t);
          s.vel = (-(e.clientX - d.lx) / cardWidth / dt) * 1000;
          s.off = d.off - (e.clientX - d.x) / cardWidth;
          d.t = now; d.lx = e.clientX;
        }}
        onPointerUp={(e) => {
          const d = s.drag;
          s.drag = null;
          touch();
          if (!d) return;
          if (!d.moved) {
            const card = (e.target as Element).closest<HTMLElement>("[data-i]");
            if (card) toCard(+card.dataset.i!);
            return;
          }
          if (reduced.current || performance.now() - d.t > 80) s.vel = 0;
        }}
        onPointerCancel={() => { s.drag = null; }}
        onWheel={(e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { s.target = null; s.off += e.deltaX / cardWidth; s.vel = 0; touch(); } }}
        onKeyDown={(e) => {
          const r = Math.round(s.off);
          if (e.key === "ArrowRight") { e.preventDefault(); go(r + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(r - 1); }
          if (e.key === "Home") { e.preventDefault(); toCard(0); }
          if (e.key === "End") { e.preventDefault(); toCard(n - 1); }
        }}
      >
        <div className="wcr-ring" style={{ transform: `translateZ(${-R}px)` }}>
          {Array.from({ length: n }, (_, i) => {
            const d = wrap(i - s.off, n), a = d * stepA;
            const img = images?.length ? `center / cover no-repeat url("${images[i % images.length]}")` : glow(i);
            const k = reduced.current ? 0 : Math.min(1, (smear / 100) * (Math.min(1, Math.abs(d) * 0.45) + speed * 0.9));
            return (
              <div key={i} className="wcr-card" data-i={i} data-back={Math.abs(a) > 90}
                style={{ transform: `rotateY(${a}deg) translateZ(${R}px)`, zIndex: 100 - Math.round(Math.abs(d) * 10) } as CSSProperties}>
                <span className="wcr-smear" style={{ background: img, opacity: k, transform: `scaleX(${1 + 0.7 * k})`, transformOrigin: d < 0 ? "left center" : "right center", filter: `blur(${2 + 6 * k}px)` }} />
                <span className="wcr-face" style={{ background: img }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="wcr-player">
        <div className="wcr-steps" role="group" aria-label="Cards">
          {Array.from({ length: n }, (_, i) => (
            <button key={i} type="button" className="wcr-dot" data-on={i === active} aria-label={`Card ${i + 1} of ${n}`} aria-current={i === active}
              style={{ "--p": i === active ? progress : 0 } as CSSProperties} onClick={() => toCard(i)}>
              <i />
            </button>
          ))}
        </div>
        <button type="button" className="wcr-play" aria-label="Autoplay" aria-pressed={playing && !waiting}
          onClick={() => { const p = playing && waiting ? true : !playing; setPlaying(p); setWaiting(false); s.idle = 0; s.auto = performance.now(); snd("tick", { volume: 0.5 }); }}>
          <Icon icon={playing && !waiting ? "ph:pause-fill" : "ph:play-fill"} width={16} height={16} />
        </button>
      </div>
      <span className="wcr-sr" aria-live="polite">{say}</span>
    </div>
  );
}
