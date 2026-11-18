/* ══ ASCII bloom ══════════════════════════════════════
   A flower drawn in text characters. Drag up to open it, down to fold it
   back into a bud; let go and it keeps blooming by itself, then breathes
   gently at full bloom. Up and Down arrows open and close it in steps.

   ── BRIGHTNESS TO GLYPHS ─────────────────────────────
   The panel is a grid of character cells. For each cell the flower's
   brightness is worked out at the cell's centre and mapped to a character
   from a ramp that runs from sparse to dense, like " .:-=+*#%@", and to an
   opacity, so dark areas fade into the background. Cells are grouped by
   level and drawn with one colour change per level, which keeps each frame
   cheap.

   ── A FLOWER FROM SHAPES ─────────────────────────────
   The flower is three rings of teardrop petals around a dense disc, with a
   stem and two leaves. Each petal is tested in its own rotated frame:
   along its length it widens and narrows like a teardrop, it brightens
   toward the tip and the edges, darkens along its centre crease, and a
   light from the upper left shades it. Later rings paint over earlier ones.

   ── OPENING ──────────────────────────────────────────
   One number from 0 to 1 is the bloom. At 0 the petals are bunched upward
   and short; as it rises they fan out to a full circle and lengthen, the
   outer ring first and the inner ring last, and the whole flower grows to
   almost twice its bud size. After a drag the bloom keeps a little
   momentum, then drifts open and slowly breathes between full and three
   quarters. */
import { useEffect, useRef, type CSSProperties } from "react";

export type AsciiBloomProps = {
  cell?: number;
  charset?: "Classic" | "Blocks" | "Binary";
  drift?: number;
  ink?: "Ink" | "Pick" | "Ok";
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;
};
type Loop = { stop: (ms?: number) => void; setVolume: (n: number) => void; setPitch: (n: number) => void } | undefined;

const W = 280, H = 260;
const SETS = { Classic: " .:-=+*#%@", Blocks: " ░▒▓█", Binary: "  0011" };
const LAYERS = [
  { n: 14, len: 1, wid: 0.13, start: 0, rot: 0 },
  { n: 12, len: 0.74, wid: 0.15, start: 0.15, rot: 0.5 },
  { n: 10, len: 0.5, wid: 0.17, start: 0.3, rot: 0.25 },
];
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

/* brightness of the flower at (x, y) for a bloom amount b */
function bright(x: number, y: number, b: number) {
  const cx = W / 2, cy = H * 0.56, R = 44 * (1 + 0.8 * b);
  const dx = x - cx, dy = y - cy;
  let v = 0;
  // stem and leaves
  if (y > cy && Math.abs(dx + Math.sin((y - cy) / 40) * 3) < 2.2) v = 0.42;
  for (const s of [-1, 1]) {
    const lx = cx + s * 20, ly = cy + 62 + (s > 0 ? 18 : 0);
    const u = ((x - lx) * Math.cos(s * 0.6) + (y - ly) * Math.sin(s * 0.6)) / 24, w = ((y - ly) * Math.cos(s * 0.6) - (x - lx) * Math.sin(s * 0.6)) / 8;
    if (u * u + w * w < 1) v = Math.max(v, 0.3 + 0.25 * (1 - Math.abs(w)));
  }
  const r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  for (const L of LAYERS) {
    const o = clamp((b - L.start) / 0.7);
    const len = R * L.len * (0.62 + 0.38 * o), spread = 0.28 + 0.72 * o;
    if (r > len + 2) continue;
    for (let k = 0; k < L.n; k++) {
      let rel = ((k + L.rot) / L.n) * Math.PI * 2;
      if (rel > Math.PI) rel -= Math.PI * 2;
      const pa = -Math.PI / 2 + rel * spread;
      let da = ang - pa;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      const u = r * Math.cos(da), w = r * Math.sin(da);
      if (u < 0 || u > len) continue;
      const half = len * L.wid * Math.pow(Math.sin((Math.PI * u) / len), 0.7) * (1 - 0.35 * (u / len)) * (0.6 + 0.4 * o);
      if (Math.abs(w) > half) continue;
      const t = u / len, e = Math.abs(w) / (half || 1);
      const light = 0.85 + 0.25 * Math.cos(pa - Math.PI * 1.25);
      v = (0.3 + 0.6 * t) * (0.5 + 0.5 * e) * light * (e > 0.82 ? 1.2 : 1);
    }
  }
  const disc = R * 0.2;
  if (r < disc) v = 0.3 + 0.25 * hash(Math.round(x), Math.round(y));
  return v ? clamp(v + (hash(x, y) - 0.5) * 0.12) : 0;
}

export function AsciiBloom({ cell = 7, charset = "Classic", drift = 0.12, ink = "Ink", sound = true, volume = 70, onSound }: AsciiBloomProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const opts = useRef({ cell, charset, drift, ink, sound, volume, onSound });
  opts.current = { cell, charset, drift, ink, sound, volume, onSound };
  const st = useRef({ b: 0.85, v: 0, drag: null as null | { y: number; b: number; t: number; ly: number }, hold: 0, target: 1, loop: undefined as Loop });
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => { kickRef.current(); }, [cell, charset, ink]);

  useEffect(() => {
    const canvas = cv.current!, ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, running = false, visible = false, last = 0, color = "#000", drawnB = -1, drawnKey = "";

    const draw = () => {
      const o = opts.current, s = st.current;
      const key = `${o.cell}|${o.charset}|${color}`;
      if (Math.abs(s.b - drawnB) < 0.002 && key === drawnKey) return;
      drawnB = s.b; drawnKey = key;
      const c = Math.max(4, o.cell), cw = c * 0.62, ramp = SETS[o.charset], n = ramp.length - 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.font = `${c}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "middle"; ctx.textAlign = "center";
      const buckets: [number, number, string][][] = Array.from({ length: n + 1 }, () => []);
      for (let y = c / 2; y < H; y += c) for (let x = cw / 2; x < W; x += cw) {
        const v = bright(x, y, s.b);
        if (v <= 0.02) continue;
        const i = Math.max(1, Math.min(n, Math.round(Math.pow(v, 0.75) * n * 1.1)));
        buckets[i].push([x, y, ramp[i]]);
      }
      ctx.fillStyle = color;
      buckets.forEach((list, i) => {
        if (!list.length) return;
        ctx.globalAlpha = 0.4 + 0.6 * (i / n);
        for (const [x, y, ch] of list) ctx.fillText(ch, x, y);
      });
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const s = st.current, o = opts.current;
      let moving = false;
      if (!s.drag && !reduced) {
        if (Math.abs(s.v) > 0.01) { s.b = clamp(s.b + s.v * dt); s.v *= Math.pow(0.04, dt); moving = true; }
        else if (o.drift > 0) {
          if (s.hold > 0) { s.hold -= dt; moving = true; }
          else {
            const d = s.target - s.b, step = o.drift * dt * (s.target < 1 ? 0.5 : 1);
            if (Math.abs(d) <= step) { s.b = s.target; s.hold = s.target === 1 ? 3 : 0.4; s.target = s.target === 1 ? 0.75 : 1; }
            else s.b += Math.sign(d) * step;
            moving = true;
          }
        }
      }
      draw();
      if ((moving || s.drag) && visible) raf = requestAnimationFrame(frame);
      else { running = false; last = 0; }
    };
    const kick = () => {
      color = getComputedStyle(canvas).color;
      drawnKey = "";
      if (!visible) return;
      if (!running) { running = true; raf = requestAnimationFrame(frame); }
    };
    kickRef.current = kick;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(canvas);
    const mo = new MutationObserver(() => kick());
    mo.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-theme"] });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); st.current.loop?.stop(0); };
  }, []);

  const endDrag = () => {
    const s = st.current;
    if (!s.drag) return;
    s.drag = null;
    s.target = 1; s.hold = 0;
    s.loop?.stop(300); s.loop = undefined;
    kickRef.current();
  };

  return (
    <div className="asb" data-ink={ink.toLowerCase()} style={{ "--asb-w": `${W}px`, "--asb-h": `${H}px` } as CSSProperties}>
      <canvas
        ref={cv}
        className="asb-cv"
        role="slider"
        tabIndex={0}
        aria-label="Bloom"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(st.current.b * 100)}
        onPointerDown={(e) => {
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
          const s = st.current;
          s.drag = { y: e.clientY, b: s.b, t: performance.now(), ly: e.clientY };
          s.v = 0;
          const o = opts.current;
          if (o.sound && o.onSound) s.loop = o.onSound("rustle", { loop: true, volume: 0 }) as Loop;
          kickRef.current();
        }}
        onPointerMove={(e) => {
          const s = st.current, d = s.drag;
          if (!d) return;
          const now = performance.now(), dt = Math.max(1, now - d.t);
          const nb = clamp(d.b - (e.clientY - d.y) / 160);
          const vel = (-(e.clientY - d.ly) / 160 / dt) * 1000;
          s.v = vel;
          s.b = nb;
          d.t = now; d.ly = e.clientY;
          const o = opts.current;
          s.loop?.setVolume?.(Math.min(0.5, Math.abs(vel) * 0.25) * (o.volume / 100));
          s.loop?.setPitch?.(vel > 0 ? 0.9 : 0.8);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          const s = st.current;
          const n = e.key === "ArrowUp" || e.key === "ArrowRight" ? s.b + 0.05 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? s.b - 0.05 : e.key === "Home" ? 0 : e.key === "End" ? 1 : null;
          if (n === null) return;
          e.preventDefault();
          s.b = clamp(n); s.v = 0; s.hold = 2; s.target = 1;
          kickRef.current();
        }}
      />
    </div>
  );
}
