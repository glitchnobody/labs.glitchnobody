/* ══ Liquid word ══════════════════════════════════
   A word made of flowing liquid chrome. Move over it and the flow bends
   toward you; press and hold (or hold Space or Enter) to melt the letters
   together into blobs, and let go to watch them spring back.

   ── STRIPES THAT FLOW ─────────────────────────────
   The letters are real SVG text filled with a repeating white-black-white
   gradient. Every frame a small loop slides the gradient along its axis and
   turns that axis, through the gradient's transform, so the bands stream
   across the word. The pointer's direction from the word's centre steers
   the angle, and fast movement pushes the flow up to three times faster.

   ── GREY INTO CHROME INTO COLOUR ──────────────────
   One SVG filter does the rest. A blurred copy of the letter shapes goes
   through specular lighting, which reads it as a bumpy surface and adds
   bright rounded highlights over the bands: that is the chrome. A colour
   lookup table then maps every grey to a palette, dark navy for black up
   through blue, orange and pink to white, like a thermal camera.

   ── MELTING ───────────────────────────────────────
   A final blur softens the bands into liquid. While you hold, that blur
   grows and an alpha threshold cuts the soft edges back to hard ones, so
   neighbouring letters swell into each other like drops of mercury. On
   release a little spring brings the blur back, overshooting slightly.
   Film grain from fractal noise sits on top.

   ── RESTING ───────────────────────────────────────
   The loop pauses whenever the word is off screen or the tab is hidden,
   and with reduced motion the stripes stand still. */

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type Loop = { stop?: (fadeMs?: number) => void; setPitch?: (n: number) => void; setVolume?: (n: number) => void };
type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type LiquidWordProps = {
  word?: string;
  /** font weight */
  weight?: number;
  /** 0 to 100: flow speed at rest */
  speed?: number;
  /** px width of one band */
  stripe?: number;
  /** resting softness */
  blur?: number;
  /** 0 to 100 */
  grain?: number;
  /** 0 to 100: lighting depth */
  chrome?: number;
  palette?: "Thermal" | "Chrome" | "Sunset" | "Mint";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

// fixed colours: they are the effect (dark grey → light grey)
const PALETTES: Record<string, string[] | null> = {
  Thermal: ["#0a0f3c", "#1f5bff", "#6ad5ff", "#ff7a29", "#ff6ad5", "#ffffff"],
  Chrome: null,
  Sunset: ["#2a0a2e", "#a3123a", "#ff6a1f", "#ffc23d", "#fff3d6"],
  Mint: ["#04303a", "#0f8a5f", "#5fe0b0", "#c8fff4", "#ffffff"],
};
const table = (stops: string[], ch: number) =>
  stops.map((h) => (parseInt(h.slice(1 + ch * 2, 3 + ch * 2), 16) / 255).toFixed(3)).join(" ");

const PAD = 8;
const BASE_ANGLE = 30;

export function LiquidWord({
  word = "LABS",
  weight = 500,
  speed = 35,
  stripe = 90,
  blur = 4,
  grain = 25,
  chrome = 60,
  palette = "Thermal",
  sound = true,
  volume = 70,
  onSound,
}: LiquidWordProps) {
  const id = "lqw" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const text = useRef<SVGTextElement>(null);
  const grad = useRef<SVGLinearGradientElement>(null);
  const blurEl = useRef<SVGFEGaussianBlurElement>(null);

  const w = (word.trim() || " ").toUpperCase().slice(0, 8);
  const fs = Math.min(96, 300 / (w.length * 0.72));
  const est = { x: 0, y: 0, w: Math.max(fs, w.length * fs * 0.72), h: fs * 0.75 };
  const [box, setBox] = useState(est);

  const live = useRef({ speed, stripe, blur, loud: 0, onSound, kick: () => {} });
  Object.assign(live.current, { speed, stripe, blur, loud: sound && onSound ? volume / 100 : 0, onSound });

  // root box = the word's measured bounds + PAD
  useLayoutEffect(() => {
    const measure = () => {
      const b = text.current?.getBBox();
      if (b && b.width) setBox({ x: b.x, y: b.y, w: b.width, h: b.height });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [w, fs, weight]);

  useEffect(() => live.current.kick(), [speed, stripe, blur]);

  useEffect(() => {
    const el = svg.current!;
    const L = live.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, last = 0, visible = true;
    let offset = 0, angle = BASE_ANGLE, target = BASE_ANGLE, energy = 0, boost = 1;
    let held = false, melt = 0, mv = 0;
    let prev: { x: number; y: number; t: number } | null = null;
    let loop: Loop | null = null;

    const stopLoop = () => {
      loop?.stop?.(400);
      loop = null;
    };

    function frame(t: number) {
      raf = 0;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      const still = reduced.matches;

      // melt: rise over 900 ms while held, spring back on release
      if (held) melt = Math.min(1, melt + dt / (still ? 0.2 : 0.9)), (mv = 0);
      else if (still) melt = Math.max(0, melt - dt / 0.2);
      else {
        mv += (-180 * melt - 16 * mv) * dt;
        melt += mv * dt;
        if (Math.abs(melt) < 0.002 && Math.abs(mv) < 0.01) melt = mv = 0;
      }

      energy *= Math.pow(0.04, dt); // ~1 s back to drift
      if (!still) {
        boost += (1 + 2 * Math.min(1, energy) - boost) * Math.min(1, dt * 6);
        let d = ((target - angle + 540) % 360) - 180;
        angle += d * Math.min(1, dt * 4);
        offset = (offset + (L.speed * 1.2 * boost * dt)) % (L.stripe * 1000);
      }

      const g = grad.current, bl = blurEl.current;
      const b = text.current?.getBBox();
      const cx = b ? b.x + b.width / 2 : 0, cy = b ? b.y + b.height / 2 : 0;
      g?.setAttribute("gradientTransform", `rotate(${angle.toFixed(2)} ${cx} ${cy}) translate(${offset.toFixed(2)} 0)`);
      bl?.setAttribute("stdDeviation", String(Math.max(0, L.blur + 10 * melt)));
      const m = Math.max(0, Math.min(1, melt));

      const act = Math.max(Math.min(1, energy), m);
      if (L.loud && L.onSound && act > 0.02) {
        if (!loop) {
          const h = L.onSound("heat", { loop: true, volume: act * 0.5 * L.loud });
          loop = (h && typeof h === "object" ? h : {}) as Loop;
        }
        loop.setVolume?.(act * 0.5 * L.loud);
        loop.setPitch?.(0.8 + 0.4 * m);
      } else stopLoop();

      const resting = !held && melt === 0 && energy < 0.01;
      if (!visible || (still && resting)) {
        last = 0;
        stopLoop();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    L.kick = start;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2, t = e.timeStamp || performance.now();
      if (Math.hypot(x, y) > 4) target = (Math.atan2(y, x) * 180) / Math.PI;
      if (prev) energy = Math.max(energy, Math.min(1.5, Math.hypot(x - prev.x, y - prev.y) / Math.max(8, t - prev.t) / 1.2));
      prev = { x, y, t };
      start();
    };
    const press = () => {
      held = true;
      start();
    };
    const release = () => {
      held = false;
      start();
    };
    const onDown = (e: PointerEvent) => {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      onMove(e);
      press();
    };
    const onLeave = () => {
      prev = null;
      target = BASE_ANGLE;
    };
    const isKey = (e: KeyboardEvent) => e.key === " " || e.key === "Enter";
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isKey(e)) return;
      e.preventDefault();
      if (!e.repeat) press();
    };
    const onKeyUp = (e: KeyboardEvent) => isKey(e) && release();

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("keyup", onKeyUp);
    el.addEventListener("blur", release);

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting && !document.hidden;
      if (visible) return start();
      cancelAnimationFrame(raf);
      raf = last = 0;
      stopLoop();
    });
    io.observe(el);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) start();
    };
    document.addEventListener("visibilitychange", onVis);
    reduced.addEventListener("change", start);
    start();

    return () => {
      cancelAnimationFrame(raf);
      stopLoop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduced.removeEventListener("change", start);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", release);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("blur", release);
      L.kick = () => {};
    };
  }, []);

  const pal = PALETTES[palette] ?? PALETTES.Thermal;
  const c = chrome / 100;
  const gr = grain / 100;
  const vw = box.w + PAD * 2, vh = box.h + PAD * 2;

  return (
    <svg
      ref={svg}
      className="lqw"
      role="img"
      aria-label={w}
      tabIndex={0}
      width={vw}
      height={vh}
      viewBox={`${box.x - PAD} ${box.y - PAD} ${vw} ${vh}`}
      style={{ "--lqw-weight": weight } as CSSProperties}
    >
      <defs>
        <linearGradient ref={grad} id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={stripe} y2="0" spreadMethod="repeat">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.5" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <filter id={`${id}f`} x="-10%" y="-25%" width="120%" height="150%" colorInterpolationFilters="sRGB">
          {/* chrome: light the blurred letter shapes and add the highlights over the bands */}
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="bump" />
          <feSpecularLighting in="bump" surfaceScale={2 + 6 * c} specularConstant={0.4 + 1.2 * c} specularExponent="18" lightingColor="#fff" result="spec">
            <feDistantLight azimuth="235" elevation="40" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feBlend in="SourceGraphic" in2="specIn" mode="overlay" result="ov" />
          <feComposite in="ov" in2="specIn" operator="arithmetic" k1="0" k2="1" k3={0.4 * c} k4="0" result="lit" />
          {/* colour lookup */}
          <feComponentTransfer in="lit" result="col">
            {pal && (
              <>
                <feFuncR type="table" tableValues={table(pal, 0)} />
                <feFuncG type="table" tableValues={table(pal, 1)} />
                <feFuncB type="table" tableValues={table(pal, 2)} />
              </>
            )}
          </feComponentTransfer>
          {/* liquid blur; the alpha threshold keeps edges crisp, so a bigger blur merges letters */}
          <feGaussianBlur ref={blurEl} in="col" stdDeviation={blur} result="soft" />
          <feComponentTransfer in="soft" result="cut">
            <feFuncA type="table" tableValues="0 0 1 1" />
          </feComponentTransfer>
          {/* grain */}
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
          <feComposite in="cut" in2="mono" operator="arithmetic" k1="0" k2="1" k3={0.35 * gr} k4={-0.175 * gr} result="grainy" />
          <feComposite in="grainy" in2="cut" operator="in" />
        </filter>
      </defs>
      <text ref={text} className="lqw-text" x="0" y="0" textAnchor="middle" fontSize={fs} fill={`url(#${id}g)`} stroke={`url(#${id}g)`} strokeWidth={fs * 0.06} strokeLinejoin="round" filter={`url(#${id}f)`}>
        {w}
      </text>
    </svg>
  );
}
