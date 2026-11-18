/* ══ Create menu ═════════════════════════════════
   A "Create new" button that grows into a menu. Press it to unfold a grid of
   things to create; pick one and it folds back into the button, which shows a
   check for a moment. Escape, the × or a press outside closes it.

   ── ONE ELEMENT, TWO SIZES ───────────────────────
   The pill and the panel are the same element. Its contents change (a button,
   or a header and a grid) and motion's layout animation springs its width,
   height and corner radius from the old box to the new one, so it is always the
   size of what is visible and stays centred where it sits.

   ── THE LABEL AND THE PLUS TRAVEL ────────────────
   The "Create new" label and the plus share a layoutId across both states, so
   motion moves them from the pill to the header instead of swapping them. The
   plus is turned 45 degrees when open, which makes it the close ×.

   ── ITEMS AND TIMING ─────────────────────────────
   Items fade and rise in once the panel is about 60% open, each one a stagger
   later in reading order. On close or pick they fade out first (100 ms), then
   the box folds back. Bounce and speed set the spring. With reduced motion the
   spring becomes a short cross-fade and items appear together. */

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

const ITEMS = [
  ["Project", "ph:folder"],
  ["Notebook", "ph:notepad"],
  ["Notes", "ph:copy"],
  ["Goal", "ph:trophy"],
  ["Milestone", "ph:flag"],
  ["Event", "ph:calendar-blank"],
  ["Task", "ph:check-square"],
  ["Doc", "ph:file-text"],
  ["Link", "ph:link"],
] as const;

export type CreateMenuProps = {
  /** how many items are in the menu, 3 to 9 */
  items?: number;
  /** grid columns, 2 to 4 */
  columns?: number;
  /** spring bounce, 0 to 100 */
  bounce?: number;
  /** morph speed, 0 to 100 */
  speed?: number;
  /** ms between items appearing */
  stagger?: number;
  /** which way the panel grows from the pill */
  origin?: "Down" | "Up" | "Centre";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onCreate?: (item: string) => void;
  onSound?: Sound;
};

export function CreateMenu({
  items = 6,
  columns = 3,
  bounce = 25,
  speed = 60,
  stagger = 25,
  origin = "Down",
  sound = true,
  volume = 70,
  onCreate,
  onSound,
}: CreateMenuProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const lastTick = useRef(0);
  const timers = useRef<number[]>([]);
  const [open, setOpen] = useState(false);
  const [itemsOn, setItemsOn] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [live, setLive] = useState("");

  const list = ITEMS.slice(0, Math.max(3, Math.min(9, Math.round(items))));
  const cols = Math.min(Math.max(2, Math.min(4, Math.round(columns))), list.length);
  const dur = 0.7 - (speed / 100) * 0.4;
  const spring = reduce ? { duration: 0.12 } : { type: "spring" as const, duration: dur, bounce: (bounce / 100) * 0.6 };
  const snd = (name: string, v: number, pitch?: number) => {
    if (sound) onSound?.(name, { volume: (v * volume) / 100, ...(pitch ? { pitch } : {}) });
  };
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const openMenu = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setDone(null);
    setOpen(true);
    snd("expand", 0.5);
    later(() => setItemsOn(true), reduce ? 0 : dur * 600);
    later(() => tiles.current[0]?.focus({ preventScroll: true }), reduce ? 20 : dur * 600 + 40);
  };
  const fold = (pick?: string) => {
    setItemsOn(false);
    later(() => {
      setOpen(false);
      if (pick) {
        setDone(pick);
        setLive(`${pick} created`);
        later(() => setDone(null), 1400);
      } else pill.current?.focus({ preventScroll: true });
    }, 100);
  };
  const close = () => {
    snd("collapse", 0.5);
    fold();
  };
  const pick = (name: string) => {
    snd("pop", 0.6);
    onCreate?.(name);
    fold(name);
  };

  // an outside press closes; the click that follows is swallowed so the wall card does not open
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (root.current?.contains(e.target as Node)) return;
      close();
      const stop = (ev: Event) => {
        if (!(ev.target as Element).closest?.("a")) return;
        ev.preventDefault();
        ev.stopPropagation();
      };
      window.addEventListener("click", stop, { capture: true, once: true });
      later(() => window.removeEventListener("click", stop, true), 400);
    };
    document.addEventListener("pointerdown", down, true);
    return () => document.removeEventListener("pointerdown", down, true);
  });

  const scope = () => root.current?.closest("[data-shortcut-scope]") ?? root.current;
  useEffect(() => {
    if (!open) return;
    const el = scope();
    const key = (e: Event) => {
      if ((e as globalThis.KeyboardEvent).key === "Escape" && itemsOn) close();
    };
    el?.addEventListener("keydown", key);
    return () => el?.removeEventListener("keydown", key);
  });

  const onGridKey = (e: KeyboardEvent) => {
    const i = tiles.current.indexOf(document.activeElement as HTMLButtonElement);
    const n = list.length;
    const go: Record<string, number> = {
      ArrowRight: Math.min(n - 1, i + 1),
      ArrowLeft: Math.max(0, i - 1),
      ArrowDown: i + cols < n ? i + cols : i,
      ArrowUp: i - cols >= 0 ? i - cols : i,
      Home: 0,
      End: n - 1,
    };
    if (e.key in go) {
      e.preventDefault();
      tiles.current[go[e.key]]?.focus();
    }
  };

  const hover = (i: number) => {
    const t = performance.now();
    if (t - lastTick.current < 40) return;
    lastTick.current = t;
    snd("tick", 0.3, 1 + 0.04 * i);
  };

  const originY = origin === "Down" ? "0%" : origin === "Up" ? "100%" : "50%";
  const style = {
    "--cmn-cols": cols,
    borderRadius: open ? 10 : 999,
    transformOrigin: `50% ${originY}`,
  } as CSSProperties;

  const label = (
    <m.span layoutId={`${id}-label`} className="cmn-label" transition={spring}>
      Create new
    </m.span>
  );
  const plus = (
    <m.span layoutId={`${id}-plus`} className="cmn-plus" transition={spring} animate={{ rotate: open ? 45 : 0 }}>
      <Icon icon="ph:plus-bold" width={16} height={16} />
    </m.span>
  );

  return (
    <LazyMotion features={domMax}>
      <m.div ref={root} className="cmn" data-open={open} layout transition={spring} style={style}>
        {open ? (
          <>
            <div className="cmn-head" onKeyDown={(e) => e.key === "Escape" && close()}>
              {label}
              <button type="button" className="cmn-close" aria-label="Close menu" onClick={close}>
                {plus}
              </button>
            </div>
            <m.div
              className="cmn-grid"
              role="menu"
              aria-label="Create new"
              onKeyDown={onGridKey}
              initial={false}
              animate={{ opacity: itemsOn ? 1 : 0 }}
              transition={{ duration: 0.1 }}
              style={{ pointerEvents: itemsOn ? "auto" : "none" }}
            >
              {list.map(([name, icon], i) => (
                <m.button
                  key={name}
                  type="button"
                  role="menuitem"
                  className="cmn-tile"
                  ref={(el) => {
                    tiles.current[i] = el;
                  }}
                  initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                  animate={{ opacity: itemsOn ? 1 : 0, y: 0 }}
                  transition={{ duration: 0.2, delay: itemsOn && !reduce ? (i * stagger) / 1000 : 0 }}
                  whileTap={{ scale: 0.94 }}
                  onPointerEnter={() => hover(i)}
                  onClick={() => pick(name)}
                >
                  <Icon icon={icon} width={20} height={20} />
                  <span>{name}</span>
                </m.button>
              ))}
            </m.div>
          </>
        ) : (
          <button
            ref={pill}
            type="button"
            className="cmn-pill"
            aria-haspopup="menu"
            aria-expanded={false}
            onClick={openMenu}
          >
            {done ? (
              <>
                <Icon icon="ph:check-bold" width={16} height={16} className="cmn-ok" />
                <m.span layout="position" className="cmn-label">{done} created</m.span>
              </>
            ) : (
              <>
                {label}
                {plus}
              </>
            )}
          </button>
        )}
        <span className="cmn-live" aria-live="polite">{live}</span>
      </m.div>
    </LazyMotion>
  );
}
