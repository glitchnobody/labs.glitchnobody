/* ══ Aspect ratio ═════════════════════════════════════
   An aspect-ratio picker with a photo that re-crops itself. Press square,
   landscape or portrait and the photo springs into the new shape; the dots
   button holds more ratios (4:3, 3:2, 21:9 and Free).

   ── A SPRING ON WIDTH AND HEIGHT ─────────────────────
   The photo's width and height each follow a small hand-written spring run in
   requestAnimationFrame and written straight to the element's style, so no
   React render happens per frame. The bounce knob sets the damping ratio:
   no bounce is critically damped, full bounce overshoots a few times. Picking
   another ratio mid-morph only changes the target; position and velocity carry
   on from where they are, so nothing jumps.

   ── RE-CROPPING ──────────────────────────────────────
   The photo is centred in a fixed 220 × 160 stage at the largest size that fits
   the ratio. Its image is object-fit: cover, so as the box changes shape the
   crop changes continuously with it. Nothing is drawn outside the photo.

   ── GRID LINES ───────────────────────────────────────
   Thirds or golden-ratio lines sit inside the photo and fade in while it
   changes shape, for 800 ms after it settles, and while the pointer is over it.

   ── THE MENU ─────────────────────────────────────────
   The three shape buttons are a radio group with arrow keys. More opens a menu
   of radio items; choosing one puts the highlight on More and a small label
   under the tile names the ratio. Escape or a press outside closes it. With
   reduced motion the photo changes size with a short ease and no spring. */

import { Icon } from "@iconify/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type Ratio = "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9" | "Free";

export type AspectRatioProps = {
  /** the ratio it starts at, and the one a new value moves to */
  ratio?: Ratio;
  grid?: "Off" | "Thirds" | "Golden";
  /** overshoot of the re-crop spring, 0 to 100 */
  bounce?: number;
  title?: string;
  /** photo URL; without one a gradient landscape is drawn */
  image?: string;
  /** site only: filler photos, the first is used */
  images?: string[];
  onChange?: (ratio: Ratio) => void;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const W = 220;
const H = 160;
const MAIN: Ratio[] = ["1:1", "16:9", "9:16"];
const MORE: Ratio[] = ["4:3", "3:2", "21:9", "Free"];
const NAMES: Record<string, string> = { "1:1": "Square", "16:9": "Landscape", "9:16": "Portrait" };
const ICONS = ["ph:square", "ph:rectangle", "ph:rectangle"];
const GRID = { Thirds: [1 / 3, 2 / 3], Golden: [0.382, 0.618], Off: [] as number[] };

function sizeOf(r: Ratio): [number, number] {
  if (r === "Free") return [W, H];
  const [a, b] = r.split(":").map(Number);
  const w = Math.min(W, (H * a) / b);
  return [w, (w * b) / a];
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function AspectRatio({
  ratio = "1:1",
  grid = "Thirds",
  bounce = 35,
  title = "Aspect ratio",
  image,
  images,
  onChange,
  sound = true,
  volume = 70,
  onSound,
}: AspectRatioProps) {
  const [current, setCurrent] = useState<Ratio>(ratio);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const photo = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  const menuId = useId();

  /* spring state lives outside React: written to the element every frame */
  const sp = useRef({ x: sizeOf(ratio)[0], y: sizeOf(ratio)[1], vx: 0, vy: 0, tx: 0, ty: 0, raf: 0, t: 0 });
  const timers = useRef<number[]>([]);
  const props = useRef({ sound, volume, bounce, reduced, onSound });
  props.current = { sound, volume, bounce, reduced, onSound };

  const say = (name: string, v: number, pitch?: number) => {
    const p = props.current;
    if (p.sound) p.onSound?.(name, { volume: (v * p.volume) / 100, pitch });
  };
  const paint = () => {
    const s = sp.current;
    photo.current?.style.setProperty("width", `${s.x}px`);
    photo.current?.style.setProperty("height", `${s.y}px`);
  };
  const settled = () => {
    timers.current.push(window.setTimeout(() => setBusy(false), 800));
  };

  const step = (now: number) => {
    const s = sp.current;
    const dt = Math.min(0.032, (now - s.t) / 1000);
    s.t = now;
    const k = 170;
    const c = 2 * Math.sqrt(k) * (1 - (props.current.bounce / 100) * 0.65);
    s.vx += (-k * (s.x - s.tx) - c * s.vx) * dt;
    s.vy += (-k * (s.y - s.ty) - c * s.vy) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const done = Math.abs(s.x - s.tx) < 0.2 && Math.abs(s.y - s.ty) < 0.2 && Math.abs(s.vx) < 2 && Math.abs(s.vy) < 2;
    if (done) {
      Object.assign(s, { x: s.tx, y: s.ty, vx: 0, vy: 0, raf: 0 });
      paint();
      settled();
      return;
    }
    paint();
    s.raf = requestAnimationFrame(step);
  };

  const morph = (r: Ratio) => {
    const s = sp.current;
    [s.tx, s.ty] = sizeOf(r);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBusy(true);
    if (props.current.reduced) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.x = s.tx;
      s.y = s.ty;
      paint();
      timers.current.push(window.setTimeout(settled, 120));
    } else if (!s.raf) {
      s.t = performance.now();
      s.raf = requestAnimationFrame(step);
    }
  };

  const pick = (r: Ratio, press = true) => {
    if (press) say("tick", 0.5, 1.1);
    if (r !== current) {
      setCurrent(r);
      onChange?.(r);
      morph(r);
    }
  };

  /* a new ratio from outside animates like a press, without the tick */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    pick(ratio, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);

  useLayoutEffect(paint, []);
  useEffect(
    () => () => {
      cancelAnimationFrame(sp.current.raf);
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const toggle = (next: boolean) => {
    setOpen(next);
    say(next ? "expand" : "collapse", 0.4);
  };
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!e.composedPath().includes(menu.current!) && !e.composedPath().includes(more.current!)) toggle(false);
    };
    document.addEventListener("pointerdown", away);
    menu.current?.querySelector<HTMLElement>("[aria-checked=true], [role=menuitemradio]")?.focus();
    return () => document.removeEventListener("pointerdown", away);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const radioKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + MAIN.length) % MAIN.length;
    radios.current[n]?.focus();
    pick(MAIN[n]);
  };
  const menuKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      toggle(false);
      more.current?.focus();
      return;
    }
    const items = [...menu.current!.querySelectorAll<HTMLElement>("[role=menuitemradio]")];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (d) {
      e.preventDefault();
      items[(at + d + items.length) % items.length].focus();
    }
  };

  const inMenu = MORE.includes(current);
  const index = inMenu ? 3 : MAIN.indexOf(current);
  const src = image ?? images?.[0];
  const h = hash(title + "ratio");
  const art = {
    "--a": `${h % 360}`,
    "--b": `${(h >> 8) % 360}`,
  } as CSSProperties;
  const lines = GRID[grid];

  return (
    <div ref={root} className="ar" style={{ "--bounce-ease": reduced ? "120ms ease" : "0s", "--i": index } as CSSProperties} data-busy={busy || undefined} data-reduced={reduced || undefined}>
      <div className="ar-stage" aria-hidden="true">
        <div ref={photo} className="ar-photo">
          {src ? <img src={src} alt="" draggable={false} /> : <div className="ar-art" style={art} />}
          <div className="ar-grid">
            {lines.map((p) => (
              <span key={`v${p}`} className="ar-line ar-v" style={{ left: `${p * 100}%` }} />
            ))}
            {lines.map((p) => (
              <span key={`h${p}`} className="ar-line ar-h" style={{ top: `${p * 100}%` }} />
            ))}
          </div>
        </div>
      </div>
      {title && <div className="ar-title">{title}</div>}
      <div className="ar-tile">
        <span className="ar-mark" aria-hidden="true" />
        <div className="ar-radios" role="radiogroup" aria-label="Aspect ratio">
          {MAIN.map((r, i) => (
            <button
              key={r}
              ref={(el) => {
                radios.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={current === r}
              aria-label={`${NAMES[r]}, ${r}`}
              tabIndex={current === r || (!MAIN.includes(current) && i === 0) ? 0 : -1}
              className="ar-btn"
              data-on={current === r || undefined}
              onClick={() => pick(r)}
              onKeyDown={(e) => radioKey(e, i)}
            >
              <Icon icon={ICONS[i]} width={20} style={i === 2 ? { transform: "rotate(90deg)" } : undefined} />
            </button>
          ))}
        </div>
        <button
          ref={more}
          type="button"
          className="ar-btn"
          data-on={inMenu || undefined}
          aria-label="More ratios"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => {
            say("tick", 0.5, 1.1);
            toggle(!open);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !open) {
              e.preventDefault();
              toggle(true);
            }
          }}
        >
          <Icon icon="ph:dots-three-circle" width={20} />
        </button>
        {open && (
          <div ref={menu} id={menuId} className="ar-menu" role="menu" aria-label="More ratios" onKeyDown={menuKey}>
            {MORE.map((r) => (
              <button
                key={r}
                type="button"
                role="menuitemradio"
                aria-checked={current === r}
                className="ar-item"
                onClick={() => {
                  pick(r);
                  toggle(false);
                  more.current?.focus();
                }}
              >
                {r}
                {current === r && <Icon icon="ph:check-bold" width={12} />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="ar-label" aria-hidden="true">{inMenu ? current : ""}</div>
      <span className="ar-live" role="status" aria-live="polite">
        {current === "Free" ? "Aspect ratio free" : `Aspect ratio ${current.replace(":", " to ")}`}
      </span>
    </div>
  );
}
