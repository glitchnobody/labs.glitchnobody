/* ══ Color palette ═════════════════════════════════
   A palette generator in a tile. Press the refresh button to roll new colours
   in like slot reels, press a swatch to copy its hex, and hold one to lock it
   through the next shuffle. R shuffles, Enter copies and L locks from the
   keyboard.

   ── EVENLY BALANCED COLOUR ───────────────────────
   Palettes are built in OKLCH (lightness, chroma, hue), where equal steps look
   equal, then converted to sRGB hex. Each harmony is a small rule: nearby
   hues, a hue and its opposite, three hues 120° apart, or one hue stepped in
   lightness. Locked swatches are kept and the first one's hue becomes the base
   the rest are generated around.

   ── THE REEL ─────────────────────────────────────
   Each swatch stacks two layers, the old colour and the new one. A CSS
   animation slides the old one up and out while the new one rises from below
   (or both flip around a horizontal axis). Every changed swatch gets an
   animation-delay of its place in the order times 60 ms, so they land left to
   right. Tween skips the layers and transitions the background colour.

   ── PRESS OR HOLD ────────────────────────────────
   A press starts a 350 ms timer and a ring that fills around the press point.
   If the pointer is released first it was a copy; if the timer ends first the
   swatch toggles its lock and the release that follows copies nothing. */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type ColorPaletteProps = {
  /** heading above the tile; empty hides it */
  title?: string;
  /** initial hex colours */
  palette?: string[];
  /** how many swatches, 3 to 5 */
  count?: number;
  harmony?: "Random" | "Analogous" | "Complementary" | "Triad" | "Monochrome";
  labels?: "Always" | "On hover" | "Never";
  motion?: "Roll" | "Flip" | "Tween";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onChange?: (hexes: string[]) => void;
  onSound?: Sound;
};

const FIRST = ["#EEF0F2", "#6B7178", "#2BB5B8"];
const HOLD = 350;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));

/* ── OKLCH <-> hex ─────────────────────────────── */
function oklchToHex(L: number, C: number, H: number) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return (
    "#" +
    lin
      .map((v) => {
        v = clamp(v);
        v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
        return Math.round(clamp(v) * 255).toString(16).padStart(2, "0");
      })
      .join("")
      .toUpperCase()
  );
}

function hexToOklch(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}

const ink = (hex: string) => (hexToOklch(hex)[0] > 0.65 ? "#000" : "#fff");

function generate(harmony: string, n: number, baseHue: number): string[] {
  const t = (i: number) => (n > 1 ? i / (n - 1) : 0);
  const out: string[] = [];
  const light = Math.floor(Math.random() * n);
  const dark = (light + 1 + Math.floor(Math.random() * (n - 1))) % n;
  for (let i = 0; i < n; i++) {
    let L: number, C: number, H: number;
    if (harmony === "Random") {
      H = rnd(0, 360);
      C = rnd(0.02, 0.15);
      L = i === light ? rnd(0.85, 0.95) : i === dark ? rnd(0.45, 0.6) : rnd(0.45, 0.95);
    } else if (harmony === "Complementary") {
      H = baseHue + (i % 2 ? 180 : 0);
      L = 0.92 - 0.42 * t(i) + rnd(-0.03, 0.03);
      C = i % 2 ? 0.1 : 0.05 + 0.08 * t(i);
    } else if (harmony === "Triad") {
      H = baseHue + 120 * (i % 3) + rnd(-6, 6);
      L = [0.88, 0.66, 0.52][i % 3] + rnd(-0.04, 0.04);
      C = rnd(0.06, 0.14);
    } else if (harmony === "Monochrome") {
      H = baseHue + rnd(-3, 3);
      L = 0.95 - 0.5 * t(i);
      C = 0.03 + 0.09 * t(i);
    } else {
      H = baseHue + (i - (n - 1) / 2) * (60 / Math.max(1, n - 1)) + rnd(-5, 5);
      L = 0.93 - 0.35 * t(i) + rnd(-0.02, 0.02);
      C = 0.03 + 0.11 * t(i);
    }
    out.push(oklchToHex(L, C, (H + 360) % 360));
  }
  return out;
}

type Sw = { id: number; hex: string; prev: string; n: number; locked: boolean; delay: number };
let uid = 0;

export function ColorPalette({
  title = "Color Palette",
  palette,
  count = 3,
  harmony = "Analogous",
  labels = "On hover",
  motion = "Roll",
  sound = true,
  volume = 70,
  onChange,
  onSound,
}: ColorPaletteProps) {
  const n = Math.round(clamp(count, 3, 5));
  const [sw, setSw] = useState<Sw[]>(() =>
    Array.from({ length: n }, (_, i) => ({
      id: uid++,
      hex: (palette?.[i] ?? FIRST[i] ?? generate("Analogous", 1, rnd(0, 360))[0]).toUpperCase(),
      prev: "",
      n: 0,
      locked: false,
      delay: 0,
    })),
  );
  const [spin, setSpin] = useState(0);
  const [copied, setCopied] = useState(-1);
  const [manual, setManual] = useState(-1);
  const [ring, setRing] = useState<{ id: number; x: number; y: number } | null>(null);
  const [say, setSay] = useState("");
  const [mounted, setMounted] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const hold = useRef<{ t: number; id: number; fired: boolean } | null>(null);
  const copyT = useRef(0);
  const lastShuffle = useRef(0);
  const timers = useRef<number[]>([]);
  const live = useRef({ sw, harmony, n });
  live.current = { sw, harmony, n };
  const cb = useRef({ onChange, onSound, sound, volume });
  cb.current = { onChange, onSound, sound, volume };

  const play = (name: string, vol: number, pitch = 1) => {
    const c = cb.current;
    if (c.sound && c.onSound) c.onSound(name, { volume: vol * (c.volume / 100), pitch });
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(copyT.current);
      clearTimeout(hold.current?.t);
    };
  }, []);

  const shuffle = () => {
    const { sw: cur, harmony: h, n: num } = live.current;
    setSpin((s) => s + 1);
    const now = performance.now();
    if (now - lastShuffle.current > 200) {
      lastShuffle.current = now;
      play("shuffle", 0.6, 1 + rnd(-0.04, 0.04));
    }
    if (cur.every((s) => s.locked)) {
      play("tick", 0.35);
      setSay("All colours are locked");
      return;
    }
    const firstLocked = cur.find((s) => s.locked);
    const base = firstLocked ? hexToOklch(firstLocked.hex)[2] : rnd(0, 360);
    const fresh = generate(h, num, base);
    let order = 0;
    const next = cur.map((s, i) => {
      if (s.locked) return s;
      const d = order++ * 60;
      timers.current.push(window.setTimeout(() => play("tick", 0.35, 1 + 0.08 * i), d + 260));
      return { ...s, prev: s.hex, hex: fresh[i], n: s.n + 1, delay: d };
    });
    setSw(next);
    const hexes = next.map((s) => s.hex);
    cb.current.onChange?.(hexes);
    setSay("New palette: " + hexes.join(", "));
  };
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;

  // knob changes: harmony reshuffles, count grows/shrinks
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    shuffleRef.current();
  }, [harmony]);
  useEffect(() => {
    setSw((cur) => {
      if (cur.length === n) return cur;
      if (cur.length > n) return cur.slice(0, n);
      const base = hexToOklch(cur[0].hex)[2];
      const extra = generate(live.current.harmony, n, base).slice(cur.length);
      return [...cur, ...extra.map((hex) => ({ id: uid++, hex, prev: "", n: 1, locked: false, delay: 0 }))];
    });
  }, [n]);

  const copy = async (i: number) => {
    const hex = live.current.sw[i]?.hex;
    if (!hex) return;
    setManual(-1);
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(i);
    } catch {
      setManual(i);
      setCopied(i);
      requestAnimationFrame(() => {
        const el = root.current?.querySelectorAll(".cp-label")[i];
        if (el) getSelection()?.selectAllChildren(el);
      });
    }
    setSay("Copied " + hex);
    clearTimeout(copyT.current);
    copyT.current = window.setTimeout(() => {
      setCopied(-1);
      setManual(-1);
    }, 900);
  };

  const toggleLock = (i: number) => {
    const was = live.current.sw[i]?.locked;
    setSw((cur) => cur.map((s, j) => (j === i ? { ...s, locked: !s.locked } : s)));
    play("pop", 0.5, was ? 0.9 : 1.15);
  };

  const down = (e: React.PointerEvent, i: number) => {
    if (e.button > 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events from the demo cannot be captured */
    }
    const r = e.currentTarget.getBoundingClientRect();
    const id = uid++;
    setRing({ id, x: e.clientX - r.left, y: e.clientY - r.top });
    const h = { t: 0, id: i, fired: false };
    h.t = window.setTimeout(() => {
      h.fired = true;
      setRing(null);
      toggleLock(i);
    }, HOLD);
    hold.current = h;
  };
  const up = (i: number, cancel = false) => {
    const h = hold.current;
    if (!h || h.id !== i) return;
    clearTimeout(h.t);
    hold.current = null;
    setRing(null);
    if (!h.fired && !cancel) copy(i);
  };

  // R shuffles while the pointer or focus is inside the block
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const scope = el.closest("[data-shortcut-scope]") ?? el;
    let inside = false;
    const on = () => (inside = true);
    const off = () => (inside = false);
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "r") return;
      if (inside || el.contains(document.activeElement)) shuffleRef.current();
    };
    scope.addEventListener("pointerenter", on);
    scope.addEventListener("pointerleave", off);
    window.addEventListener("keydown", key);
    return () => {
      scope.removeEventListener("pointerenter", on);
      scope.removeEventListener("pointerleave", off);
      window.removeEventListener("keydown", key);
    };
  }, []);

  const keys = (e: React.KeyboardEvent, i: number) => {
    const k = e.key.toLowerCase();
    if (k === "enter") copy(i);
    else if (k === "l" || k === " ") toggleLock(i);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className="cp" data-motion={motion.toLowerCase()} data-labels={labels === "On hover" ? "hover" : labels.toLowerCase()}>
      {title ? <div className="cp-title">{title}</div> : null}
      <div className="cp-tile">
        <div className="cp-row">
          {sw.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="cp-sw"
              data-locked={s.locked ? "" : undefined}
              data-copied={copied === i ? "" : undefined}
              aria-pressed={s.locked}
              aria-label={`${s.hex}, copy${s.locked ? ", locked" : ""}`}
              style={{ "--ink-sw": ink(s.hex), "--d": `${s.delay}ms`, "--c": s.hex } as CSSProperties}
              onPointerDown={(e) => down(e, i)}
              onPointerUp={() => up(i)}
              onPointerCancel={() => up(i, true)}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => keys(e, i)}
            >
              <span className="cp-reel" aria-hidden>
                {s.prev && motion !== "Tween" ? <span key={"o" + s.n} className="cp-layer cp-old" style={{ background: s.prev }} /> : null}
                <span key={motion === "Tween" ? "t" : "n" + s.n} className="cp-layer cp-new" data-fresh={s.n > 0 ? "" : undefined} style={{ background: s.hex }} />
              </span>
              <span className="cp-label" data-manual={manual === i ? "" : undefined}>
                {copied === i && manual !== i ? "Copied" : s.hex}
              </span>
              {s.locked && mounted ? <Icon className="cp-lock" icon="ph:lock-simple-fill" width={12} height={12} /> : null}
              {ring && hold.current?.id === i ? (
                <svg key={ring.id} className="cp-ring" width="24" height="24" style={{ left: ring.x - 12, top: ring.y - 12 }} aria-hidden>
                  <circle cx="12" cy="12" r="9" pathLength="1" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
        <button type="button" className="cp-btn" aria-label="Shuffle palette" onClick={shuffle}>
          <span key={spin} className="cp-spin" data-spin={spin ? "" : undefined}>
            {mounted ? <Icon icon="ph:arrows-clockwise-bold" width={16} height={16} /> : null}
          </span>
        </button>
      </div>
      <div className="cp-live" aria-live="polite">{say}</div>
    </div>
  );
}
