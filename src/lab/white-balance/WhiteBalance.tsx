/* ══ White balance ════════════════════════════════════
   A white balance control over a photo. Drag the temperature track toward
   blue or gold and the photo shifts live with a Kelvin badge counting along;
   turn on the tint track for green and magenta, and press the crosshair to
   snap back to neutral. Both tracks are sliders for the keyboard too.

   ── KELVIN ON A TRACK ────────────────────────────────
   The track maps to Kelvin in two straight pieces that meet at 6500K, the
   neutral daylight setting, so neutral sits exactly at the centre whatever
   the range. Higher settings warm the photo, as in a camera or photo editor:
   the setting describes the light being corrected for.

   ── FROM KELVIN TO A COLOUR MATRIX ───────────────────
   A blackbody approximation (Tanner Helland's curve fit) gives the colour of
   light at that temperature. Dividing the colour at 6500K by it gives per
   channel multipliers that cancel the light, softened with a square-root-like
   power so the far ends stay pleasant. Tint scales the green channel. The
   three numbers go on the diagonal of an SVG feColorMatrix filter that the
   photo references, so the browser does the pixel work.

   ── AUTO ─────────────────────────────────────────────
   The crosshair spins once while a small spring carries both values to
   neutral, with a ping as they land. */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@iconify/react";

export type WhiteBalanceProps = {
  kelvin?: number;
  range?: "2500–9000K" | "2000–10000K";
  tint?: boolean;
  /** photo URL; without one a soft landscape gradient is drawn */
  image?: string;
  images?: string[];
  title?: string;
  onChange?: (v: { kelvin: number; tint: number }) => void;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const N = 6500;

function light(k: number) {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [r, g, b].map((v) => clamp(v, 1, 255));
}
const REF = light(N);
const gains = (k: number, tint: number) => {
  const l = light(k);
  const m = REF.map((v, i) => clamp((v / l[i]) ** 0.55, 0.45, 1.6));
  return [m[0], m[1] * (1 - 0.15 * (tint / 100)), m[2]];
};

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const COOL = "oklch(0.7 0.12 250)", MID = "oklch(0.85 0.03 100)", WARM = "oklch(0.82 0.13 85)";
const GREEN = "oklch(0.75 0.12 145)", MAG = "oklch(0.7 0.14 340)";
const mix = (a: string, m: string, b: string, p: number) =>
  p < 0.5 ? `color-mix(in oklch, ${m} ${p * 200}%, ${a})` : `color-mix(in oklch, ${b} ${(p - 0.5) * 200}%, ${m})`;

export function WhiteBalance({
  kelvin: k0 = 6500, range = "2500–9000K", tint: showTint = false, image, images, title = "White balance",
  onChange, sound = true, volume = 70, onSound,
}: WhiteBalanceProps) {
  const [lo, hi] = range === "2000–10000K" ? [2000, 10000] : [2500, 9000];
  const [k, setK] = useState(clamp(k0, lo, hi));
  const [tint, setTint] = useState(0);
  const [drag, setDrag] = useState<"k" | "t" | null>(null);
  const [spin, setSpin] = useState(0);
  const id = "wb" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const raf = useRef(0);
  const last = useRef({ k: Math.round(k / 250), t: 0, at: 0 });
  const photo = image ?? images?.[0];

  useEffect(() => setK(clamp(k0, lo, hi)), [k0, lo, hi]);
  useEffect(() => { if (!showTint) setTint(0); }, [showTint]);
  useEffect(() => { onChange?.({ kelvin: Math.round(k), tint: Math.round(tint) }); }, [k, tint]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  const toP = (v: number) => (v <= N ? 0.5 * (v - lo) / (N - lo) : 0.5 + 0.5 * (v - N) / (hi - N));
  const fromP = (p: number) => (p <= 0.5 ? lo + (N - lo) * (p / 0.5) : N + (hi - N) * ((p - 0.5) / 0.5));
  const p = toP(k), tp = (tint + 100) / 200;

  const tick = (key: "k" | "t", n: number, pos: number) => {
    const l = last.current, now = performance.now();
    if (l[key] === n) return;
    l[key] = n;
    if (now - l.at < 30) return;
    l.at = now;
    snd("tick", { volume: 0.3, pitch: 0.8 + 0.5 * pos });
  };
  const putK = (v: number) => { v = clamp(v, lo, hi); setK(v); tick("k", Math.round(v / 250), toP(v)); };
  const putT = (v: number) => { v = clamp(v, -100, 100); setTint(v); tick("t", Math.round(v / 5), (v + 100) / 200); };

  function auto() {
    cancelAnimationFrame(raf.current);
    setSpin((s) => s + 1);
    if (Math.abs(k - N) < 1 && Math.abs(tint) < 0.5) { snd("tick"); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setK(N); setTint(0); snd("ping", { volume: 0.5, pitch: 1.1 }); return; }
    let x = toP(k), v = 0, y = tint, w = 0, t0 = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - t0) / 1000);
      t0 = now;
      v += (-170 * (x - 0.5) - 22 * v) * dt; x += v * dt;
      w += (-170 * y - 22 * w) * dt; y += w * dt;
      const done = Math.abs(x - 0.5) < 0.002 && Math.abs(v) < 0.02 && Math.abs(y) < 0.3;
      setK(done ? N : fromP(x));
      setTint(done ? 0 : y);
      if (done) { snd("ping", { volume: 0.5, pitch: 1.1 }); return; }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  const bind = (kind: "k" | "t", inset: number) => {
    const put = (f: number) => (kind === "k" ? putK(fromP(clamp(f, 0, 1))) : putT(clamp(f, 0, 1) * 200 - 100));
    const at = (e: PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      put((e.clientX - r.left - inset) / (r.width - 2 * inset));
    };
    return {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
        cancelAnimationFrame(raf.current);
        setDrag(kind);
        at(e);
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => { if (drag === kind) at(e); },
      onPointerUp: () => setDrag(null),
      onPointerCancel: () => setDrag(null),
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
        const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
        const big = e.shiftKey ? 10 : 1;
        if (kind === "k") {
          const n = d ? k + d * 50 * big : e.key === "Home" ? lo : e.key === "End" ? hi : null;
          if (n === null) return;
          e.preventDefault(); putK(n);
        } else {
          const n = d ? tint + d * big : e.key === "Home" ? -100 : e.key === "End" ? 100 : null;
          if (n === null) return;
          e.preventDefault(); putT(n);
        }
      },
    };
  };

  const [gr, gg, gb] = gains(k, tint);
  const h = hash(title);
  const fallback = `linear-gradient(to bottom, hsl(${200 + (h % 30)} 45% 82%) 0 45%, hsl(${90 + ((h >> 4) % 40)} 22% 58%) 45% 100%)`;
  const style = { "--wbl-p": p, "--wbl-tp": tp } as CSSProperties;

  return (
    <div className="wbl" style={style} data-tint={showTint} data-drag={drag ?? undefined}>
      <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`${gr} 0 0 0 0  0 ${gg} 0 0 0  0 0 ${gb} 0 0  0 0 0 1 0`} />
        </filter>
      </svg>
      <div className="wbl-photo">
        <div
          className="wbl-img"
          role="img"
          aria-label={`Photo at ${Math.round(k / 50) * 50} kelvin`}
          style={{ background: photo ? `center / cover no-repeat url("${photo}")` : fallback, filter: `url(#${id})` }}
        />
        <span className="wbl-badge">{Math.round(k / 50) * 50}K</span>
      </div>
      <span className="wbl-title">{title}</span>
      <div className="wbl-tile">
        <div className="wbl-row">
          <div
            className="wbl-temp"
            role="slider"
            tabIndex={0}
            aria-label="Temperature"
            aria-valuemin={lo}
            aria-valuemax={hi}
            aria-valuenow={Math.round(k)}
            aria-valuetext={`${Math.round(k / 50) * 50} kelvin`}
            {...bind("k", 3)}
          >
            <span className="wbl-thumb" style={{ background: mix(COOL, MID, WARM, p) }} />
          </div>
          <button type="button" className="wbl-auto" aria-label="Auto white balance" onClick={auto}>
            <span key={spin} className="wbl-spin" data-go={spin > 0}>
              <Icon icon="ph:crosshair-bold" width={16} height={16} />
            </span>
          </button>
        </div>
        {showTint && (
          <div
            className="wbl-tint"
            role="slider"
            tabIndex={0}
            aria-label="Tint"
            aria-valuemin={-100}
            aria-valuemax={100}
            aria-valuenow={Math.round(tint)}
            aria-valuetext={`Tint ${tint < 0 ? "minus" : "plus"} ${Math.abs(Math.round(tint))}`}
            {...bind("t", 0)}
          >
            <span className="wbl-tthumb" style={{ background: mix(GREEN, MID, MAG, tp) }} />
          </div>
        )}
      </div>
    </div>
  );
}
