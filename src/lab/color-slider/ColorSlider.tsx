/* ══ Color slider ═════════════════════════════════════
   A shade slider with a hue strip tucked behind a colour wheel. Drag along
   the gradient to pick a shade; press the wheel to open a hue row underneath
   and change the colour family. Both rows are sliders for the keyboard too:
   arrows step, Shift steps ten times further, Home and End jump.

   ── PICKED IN OKLCH ──────────────────────────────────
   The shade track runs from a pale tint to the vivid colour of the current
   hue in OKLCH, a colour space where equal steps look equally different.
   The shade is a number from 0 to 1 that moves lightness and chroma along
   that line, so the thumb sits on exactly the colour the gradient shows.

   ── THE EXACT COLOUR ─────────────────────────────────
   To show a hex or HSL readout, and to fill the ring thumb, the OKLCH value
   is converted to sRGB: OKLCH to OKLab, OKLab to linear light through the
   LMS cone matrix, then the sRGB transfer curve. The ring's inside and the
   reported hex are the same number.

   ── THE HUE ROW ──────────────────────────────────────
   The wheel button spins half a turn and the tile grows to make room for a
   rainbow strip at the same lightness and chroma as the vivid end. Dragging
   it re-tints the shade track live. Escape or a press outside closes it. */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

export type ColorSliderProps = {
  readout?: "Off" | "Hex" | "HSL";
  thumb?: "Ring" | "Solid" | "Loupe";
  hue?: number;
  shade?: number;
  title?: string;
  onChange?: (c: { hue: number; shade: number; hex: string }) => void;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const lc = (s: number) => [0.9 - 0.18 * s, 0.04 + 0.1 * s] as const;

function rgb(l: number, c: number, h: number) {
  const r = (h * Math.PI) / 180, a = c * Math.cos(r), b = c * Math.sin(r);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  return lin.map((v) => Math.round(255 * clamp(v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055, 0, 1)));
}
const hex = (c: number[]) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
function hsl([r, g, b]: number[]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  const h = !d ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `hsl ${Math.round((h * 60 + 360) % 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ColorSlider({
  readout = "Off", thumb = "Ring", hue: hue0 = 215, shade: shade0 = 0.15, title = "Color slider",
  onChange, sound = true, volume = 70, onSound,
}: ColorSliderProps) {
  const [hue, setHue] = useState(hue0);
  const [shade, setShade] = useState(shade0);
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<"shade" | "hue" | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const last = useRef({ s: Math.round(shade0 * 20), h: Math.round(hue0 / 10), t: 0 });
  const rowId = useId();

  useEffect(() => setHue(hue0), [hue0]);
  useEffect(() => setShade(shade0), [shade0]);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  const [L, C] = lc(shade);
  const color = rgb(L, C, hue);
  const value = hex(color);
  useEffect(() => { onChange?.({ hue, shade, hex: value }); }, [hue, shade]); // eslint-disable-line react-hooks/exhaustive-deps

  const tick = (key: "s" | "h", n: number, pos: number) => {
    const l = last.current, t = performance.now();
    if (l[key] === n) return;
    l[key] = n;
    if (t - l.t < 30) return;
    l.t = t;
    snd("tick", { volume: 0.3, pitch: 0.85 + 0.4 * pos });
  };
  const putShade = (s: number) => { s = clamp(s, 0, 1); setShade(s); tick("s", Math.round(s * 20), s); };
  const putHue = (h: number) => { h = clamp(h, 0, 360); setHue(h); tick("h", Math.round(h / 10), h / 360); };

  function toggle(next = !open) {
    if (next === open) return;
    setOpen(next);
    snd(next ? "expand" : "collapse", { volume: 0.45 });
  }

  useEffect(() => {
    if (!open) return;
    const down = (e: globalThis.PointerEvent) => { if (!root.current?.querySelector(".cls-tile")?.contains(e.target as Node)) toggle(false); };
    const key = (e: globalThis.KeyboardEvent) => {
      const el = root.current;
      if (e.key !== "Escape" || !el) return;
      const scope = el.closest("[data-shortcut-scope]") ?? el;
      if (scope.matches(":hover") || scope.contains(document.activeElement)) toggle(false);
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }); // re-bound each render so toggle sees the current state

  const bind = (kind: "shade" | "hue", inset: number) => {
    const put = kind === "shade" ? putShade : (f: number) => putHue(f * 360);
    const at = (e: PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      put((e.clientX - r.left - inset) / (r.width - 2 * inset));
    };
    return {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
        setDrag(kind);
        at(e);
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => { if (drag === kind) at(e); },
      onPointerUp: () => setDrag(null),
      onPointerCancel: () => setDrag(null),
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
        const big = e.shiftKey ? 10 : 1;
        const unit = kind === "shade" ? 0.01 : 5 / 360;
        const cur = kind === "shade" ? shade : hue / 360;
        const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
        const n: number | null = d ? cur + d * unit * big : e.key === "Home" ? 0 : e.key === "End" ? 1 : null;
        if (n === null) return;
        e.preventDefault();
        put(clamp(n, 0, 1));
      },
    };
  };

  const text = readout === "Hex" ? value : readout === "HSL" ? hsl(color) : "";
  const [vl, vc] = lc(1);
  const style = {
    "--cls-h": hue,
    "--cls-c": value,
    "--cls-s": shade,
    "--cls-hp": hue / 360,
    "--cls-vl": vl,
    "--cls-vc": vc,
    "--cls-pale": hex(rgb(...lc(0), hue)),
    "--cls-vivid": hex(rgb(vl, vc, hue)),
  } as CSSProperties;

  return (
    <div className="cls" ref={root} style={style} data-thumb={thumb.toLowerCase()} data-open={open} data-drag={drag ?? undefined}>
      <span className="cls-title">{title}</span>
      <div className="cls-tile">
        <div className="cls-row">
          <div
            className="cls-shade"
            role="slider"
            tabIndex={0}
            aria-label="Shade"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(shade * 100)}
            aria-valuetext={`${Math.round(shade * 100)}%, ${value}`}
            {...bind("shade", 3)}
          >
            <span className="cls-thumb">
              {thumb === "Loupe" && <span className="cls-loupe" aria-hidden />}
              {text && <span className="cls-read" data-show={drag === "shade"}>{text}</span>}
            </span>
          </div>
          <button
            type="button"
            className="cls-wheel"
            aria-label="Change hue"
            aria-expanded={open}
            aria-controls={rowId}
            onClick={() => toggle()}
          />
        </div>
        <div className="cls-hue-wrap" aria-hidden={!open}>
          <div
            id={rowId}
            className="cls-hue"
            role="slider"
            tabIndex={open ? 0 : -1}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hue)}
            {...bind("hue", 2)}
          >
            <span className="cls-hthumb">
              {text && <span className="cls-read" data-show={drag === "hue"}>{text}</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
