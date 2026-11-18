/* ══ Tool dock ═════════════════════════════════
   A pill of tools with one highlight and one tooltip that follow the
   pointer. Glide across it and the highlight slides with you while the
   tooltip's label scrolls sideways like a ticker; press a tool to select it.

   ── ONE HIGHLIGHT, ONE TOOLTIP ───────────────
   There is only a single highlight shape and a single tooltip. Hovering a
   tool just changes their target: the highlight's x, the tooltip's x and
   width, and the tooltip strip's offset. A small spring (written with
   requestAnimationFrame, no library) moves all four together, so they stay
   in step. The Bounce knob sets how springy it is.

   ── THE TICKER TOOLTIP ───────────────────────
   The tooltip's content is a horizontal strip holding every tool's label in
   order, clipped by the pill. Showing a label means sliding the strip so that
   label sits in the window while the pill's width morphs to the label's
   width. Moving right scrolls the strip left, so the new label arrives from
   the side you travel towards.

   ── COMING BACK ──────────────────────────────
   Leaving fades both out where they are. Coming back within 300 ms slides
   from the old spot; later, they jump to the new tool and fade in.

   ── SHORTCUTS ────────────────────────────────
   Letter keys select tools only while the pointer is inside the component's
   block (the nearest data-shortcut-scope, or the dock itself) or focus is in
   the dock, so several components never fight over a key. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type ToolDockProps = {
  /** how many tools, 3 to 6 (Ask AI stays last) */
  tools?: number;
  size?: "S" | "M" | "L";
  /** spring bounce, 0 to 100 */
  bounce?: number;
  shape?: "Circle" | "Rounded";
  /** key badges in the tooltip, and keyboard shortcuts */
  badges?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
  onChange?: (tool: string) => void;
};

const TOOLS = [
  { name: "Move", icon: "ph:cursor", keys: ["V"] },
  { name: "Pen", icon: "ph:pen-nib", keys: ["P"] },
  { name: "Text", icon: "ph:text-t", keys: ["T"] },
  { name: "Shapes", icon: "ph:shapes", keys: ["R"] },
  { name: "Image", icon: "ph:image", keys: ["I"] },
  { name: "Ask AI", icon: "ph:sparkle", keys: ["⌘", "J"], ai: true },
];
const SIZES = { S: [32, 18], M: [40, 20], L: [48, 24] } as const;
const PAD = 6;
const SPARKS = [0, 1, 2, 3, 4, 5];

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ToolDock({
  tools = 6,
  size = "M",
  bounce = 25,
  shape = "Circle",
  badges = true,
  sound = true,
  volume = 70,
  onSound,
  onChange,
}: ToolDockProps) {
  const list = [...TOOLS.slice(0, Math.max(3, Math.min(6, Math.round(tools))) - 1), TOOLS[5]];
  const [btn, iconSize] = SIZES[size] ?? SIZES.M;

  const [sel, setSel] = useState(0);
  const [act, setAct] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLSpanElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const strip = useRef<HTMLSpanElement>(null);
  const inside = useRef(false);
  const timer = useRef(0);
  const lastLeave = useRef(-1e9);
  const lastTick = useRef(0);
  const shown = useRef(false);
  const raf = useRef(0);
  const sp = useRef({ hx: 0, tl: 0, tw: 0, so: 0 });
  const vel = useRef({ hx: 0, tl: 0, tw: 0, so: 0 });
  const goal = useRef({ hx: 0, tl: 0, tw: 0, so: 0 });
  const props = useRef({ bounce, sound, volume, onSound, onChange });
  props.current = { bounce, sound, volume, onSound, onChange };

  const play = (name: string, v: number, pitch = 1) => {
    const p = props.current;
    if (p.sound) p.onSound?.(name, { volume: v * (p.volume / 100), pitch });
  };

  const paint = () => {
    const s = sp.current;
    if (hl.current) hl.current.style.transform = `translateX(${s.hx}px)`;
    if (pill.current) {
      pill.current.style.transform = `translateX(${s.tl}px)`;
      pill.current.style.width = `${s.tw}px`;
    }
    if (strip.current) strip.current.style.transform = `translateX(${-s.so}px)`;
  };

  const step = useCallback(() => {
    let last = performance.now();
    const k = 260;
    const tick = (now: number) => {
      let dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const z = 1 - 0.7 * (props.current.bounce / 100);
      const c = 2 * z * Math.sqrt(k);
      let moving = false;
      for (const key of ["hx", "tl", "tw", "so"] as const) {
        const n = Math.ceil(dt / 0.008);
        for (let i = 0; i < n; i++) {
          const h = dt / n;
          vel.current[key] += (k * (goal.current[key] - sp.current[key]) - c * vel.current[key]) * h;
          sp.current[key] += vel.current[key] * h;
        }
        if (Math.abs(goal.current[key] - sp.current[key]) > 0.05 || Math.abs(vel.current[key]) > 0.05) moving = true;
        else {
          sp.current[key] = goal.current[key];
          vel.current[key] = 0;
        }
      }
      paint();
      raf.current = moving ? requestAnimationFrame(tick) : 0;
    };
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }, []);

  /* aim the highlight, tooltip and strip at tool i; snap = jump instead of sliding */
  const aim = (i: number, snap: boolean) => {
    const b = root.current?.querySelectorAll<HTMLElement>(".td-btn")[i];
    const it = strip.current?.children[i] as HTMLElement | undefined;
    if (!b || !it) return;
    const centre = b.offsetLeft + b.offsetWidth / 2;
    goal.current = { hx: centre - b.offsetWidth / 2, tl: centre - it.offsetWidth / 2, tw: it.offsetWidth, so: it.offsetLeft };
    if (snap) {
      sp.current = { ...goal.current };
      vel.current = { hx: 0, tl: 0, tw: 0, so: 0 };
      paint();
    } else step();
  };

  useLayoutEffect(() => {
    root.current?.toggleAttribute("data-show", act !== null);
    if (act === null) {
      if (shown.current) lastLeave.current = performance.now();
      shown.current = false;
      return;
    }
    const snap = reduced() || (!shown.current && performance.now() - lastLeave.current > 300);
    aim(act, snap);
    shown.current = true;
  }, [act, tools, size, badges]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    clearTimeout(timer.current);
  }, []);

  const look = (i: number, hold = 0) => {
    clearTimeout(timer.current);
    setAct((p) => {
      if (p !== i) {
        const now = performance.now();
        if (now - lastTick.current > 35) {
          lastTick.current = now;
          play("tick", 0.3, 1 + 0.04 * i);
        }
      }
      return i;
    });
    if (hold) timer.current = window.setTimeout(() => setAct(null), hold);
  };

  const pick = (i: number, hold = 0) => {
    const t = list[i];
    play("pop", 0.55, t.ai ? 1.3 : 1);
    if (t.ai && !reduced()) setBurst((n) => n + 1);
    if (sel !== i) {
      setSel(i);
      props.current.onChange?.(t.name);
    }
    if (hold) look(i, hold);
  };

  /* shortcuts, scoped to the block the pointer is in (or focus in the dock) */
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e) => {
    const r = root.current;
    if (!badges || !r || e.altKey) return;
    if (!inside.current && !r.contains(document.activeElement)) return;
    const el = e.target as HTMLElement;
    if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    const key = e.key.toLowerCase();
    const i = list.findIndex((t) => (t.ai ? key === "j" && (e.metaKey || e.ctrlKey) : key === t.keys[0].toLowerCase() && !e.metaKey && !e.ctrlKey && !e.shiftKey));
    if (i < 0) return;
    e.preventDefault();
    pick(i, 800);
  };
  useEffect(() => {
    const r = root.current;
    if (!r) return;
    const scope = r.closest("[data-shortcut-scope]") ?? r;
    const on = () => (inside.current = true);
    const off = () => (inside.current = false);
    const key = (e: KeyboardEvent) => keyRef.current?.(e);
    scope.addEventListener("pointerenter", on);
    scope.addEventListener("pointerleave", off);
    window.addEventListener("keydown", key);
    return () => {
      scope.removeEventListener("pointerenter", on);
      scope.removeEventListener("pointerleave", off);
      window.removeEventListener("keydown", key);
    };
  }, []);

  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    root.current?.querySelectorAll<HTMLElement>(".td-btn")[(i + d + list.length) % list.length]?.focus();
  };

  return (
    <div
      ref={root}
      className="td"
      role="toolbar"
      aria-label="Tools"
      data-shape={shape.toLowerCase()}
      style={{ "--td-btn": `${btn}px`, "--td-icon": `${iconSize}px`, "--td-pad": `${PAD}px` } as CSSProperties}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") {
          clearTimeout(timer.current);
          setAct(null);
        }
      }}
    >
      <span className="td-hl" ref={hl} aria-hidden="true" />
      {list.map((t, i) => (
        <button
          key={t.name}
          type="button"
          className="td-btn"
          tabIndex={i === sel ? 0 : -1}
          aria-pressed={i === sel}
          aria-label={badges ? `${t.name} (${t.keys.join(" ")})` : t.name}
          data-ai={t.ai ? "" : undefined}
          data-on={i === sel}
          data-act={i === act}
          onPointerEnter={(e) => look(i, e.pointerType === "touch" ? 800 : 0)}
          onFocus={(e) => e.currentTarget.matches(":focus-visible") && look(i)}
          onBlur={() => setAct(null)}
          onKeyDown={(e) => move(e, i)}
          onClick={() => pick(i)}
        >
          <span className="td-sel" />
          <Icon icon={t.ai && i === sel ? "ph:sparkle-fill" : t.icon} width={iconSize} height={iconSize} />
          {t.ai && burst > 0 && (
            <span className="td-burst" key={burst} aria-hidden="true">
              {SPARKS.map((n) => (
                <i key={n} style={{ "--a": `${n * 60 + 15}deg` } as CSSProperties} />
              ))}
            </span>
          )}
        </button>
      ))}
      <span className="td-tip" aria-hidden="true">
        <span className="td-pill" ref={pill}>
          <span className="td-strip" ref={strip}>
            {list.map((t) => (
              <span className="td-item" key={t.name}>
                {t.name}
                {badges && t.keys.map((k) => <kbd key={k}>{k}</kbd>)}
              </span>
            ))}
          </span>
        </span>
      </span>
    </div>
  );
}
