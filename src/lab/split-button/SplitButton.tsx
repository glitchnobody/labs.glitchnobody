/* ══ Split button ═════════════════════════════════
   A Publish button with a caret that opens more actions. Press the main half
   to watch it load and finish. Pick another action from the menu and it
   becomes the main button; switch "Swap action" off and a pick runs once
   instead.

   ── THE PROGRESS SWEEP ────────────────────────────
   Pressing the main half starts a busy phase. A fill layer the size of the
   whole button grows from scaleX(0) to scaleX(1) with a linear CSS transition
   lasting exactly the busy time. A timer of the same length moves to the done
   phase (spinner becomes a check), and a second one, 800 ms later, rolls back
   to the idle label. The caret is disabled while busy.

   ── ROLLING LABELS AND WIDTH ──────────────────────
   Whatever the main half shows (icon and text for idle, busy or done) is a
   layer. When it changes, the old layer slides up and out while a new one
   slides up in. An invisible copy of the current content is measured, and
   the visible window animates its width to match, so the button grows or
   shrinks to fit the new label.

   ── THE MENU ──────────────────────────────────────
   The menu is always in the page and hidden. Opening scales it from 0.96 at
   the corner it hangs from. One highlight pill, moved with a CSS transform by
   row index, follows the pointer or the keyboard cursor. Menu items are
   real buttons with menu roles, arrow keys wrap, and Escape returns focus to
   the caret. Shortcut hints are only text: no keys are bound. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Icon as Iconify } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type SplitAction = { label: string; icon?: string; shortcut?: string; busy?: string; done?: string };

export type SplitButtonProps = {
  actions?: SplitAction[];
  variant?: "Solid" | "Outline" | "Soft";
  size?: "Small" | "Medium" | "Large";
  /** corner radius in px of the button; the menu follows up to 10 */
  radius?: number;
  /** picking makes it the main action (on) or runs it once (off) */
  swap?: boolean;
  /** how long the progress sweep takes, in ms */
  duration?: number;
  align?: "Right" | "Left";
  shortcuts?: boolean;
  onAction?: (label: string) => void;
  sound?: boolean;
  volume?: number;
  onSound?: Sound;
};

const ACTIONS: SplitAction[] = [
  { label: "Publish", icon: "ph:paper-plane-tilt", shortcut: "⌘↵", busy: "Publishing…", done: "Published" },
  { label: "Schedule", icon: "ph:calendar-blank", shortcut: "⌘⇧S", busy: "Scheduling…", done: "Scheduled" },
  { label: "Save draft", icon: "ph:floppy-disk", shortcut: "⌘S", busy: "Saving…", done: "Saved" },
  { label: "Duplicate", icon: "ph:copy", shortcut: "⌘D", busy: "Duplicating…", done: "Duplicated" },
];
// the wrapper keeps the icon's box before Iconify has loaded it, so measured widths are stable
const Icon = ({ icon, className }: { icon: string; className: string }) => (
  <span className={className} aria-hidden="true">
    <Iconify icon={icon} width="100%" height="100%" />
  </span>
);

const HEIGHT = { Small: 32, Medium: 36, Large: 44 };
const TEXT = { Small: 13, Medium: 14, Large: 16 };
const ROLL = 200;
const HOLD = 800;

type Content = { key: string; icon?: string; text: string; kind: "idle" | "busy" | "done" };
type Layer = { id: number; c: Content; out: boolean; enter: boolean };

const Body = ({ c }: { c: Content }) => (
  <>
    {c.kind === "busy" ? (
      <Icon icon="ph:spinner-gap" className="sb-icon sb-spin" />
    ) : c.kind === "done" ? (
      <Icon icon="ph:check-bold" className="sb-icon sb-pop" />
    ) : c.icon ? (
      <Icon icon={c.icon} className="sb-icon" />
    ) : null}
    <span className="sb-text">{c.text}</span>
  </>
);

export function SplitButton({
  actions = ACTIONS,
  variant = "Solid",
  size = "Medium",
  radius = 22,
  swap = true,
  duration = 900,
  align = "Right",
  shortcuts = true,
  onAction,
  sound = true,
  volume = 70,
  onSound,
}: SplitButtonProps) {
  const list = actions.length ? actions : ACTIONS;
  const [main, setMain] = useState(0);
  const [running, setRunning] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<number | null>(null);
  const [apple, setApple] = useState(true);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [width, setWidth] = useState<number>();
  const [live, setLive] = useState("");

  const root = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLButtonElement>(null);
  const sizer = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const lastTick = useRef(0);
  const viaKey = useRef(false);
  const layerId = useRef(0);
  const prevKey = useRef("");

  const loud = sound && onSound ? volume / 100 : 0;
  const snd = (name: string, v: number, pitch = 1) => {
    if (loud) onSound!(name, { volume: v * loud, pitch });
  };
  const mainIdx = Math.min(main, list.length - 1);

  useEffect(() => setApple(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!swap) setMain(0);
  }, [swap]);

  const shown = running ?? mainIdx;
  const a = list[shown];
  const content: Content =
    phase === "busy"
      ? { key: `${shown}:busy`, text: a.busy ?? `${a.label}…`, kind: "busy" }
      : phase === "done"
        ? { key: `${shown}:done`, text: a.done ?? "Done", kind: "done" }
        : { key: `${shown}:idle`, icon: a.icon, text: a.label, kind: "idle" };

  // roll: keep the old layer while the new one slides in
  useEffect(() => {
    if (prevKey.current === content.key) return;
    const first = prevKey.current === "";
    prevKey.current = content.key;
    const id = ++layerId.current;
    setLayers((l) => [...l.map((x) => ({ ...x, out: true })), { id, c: content, out: false, enter: !first }]);
    if (first) return;
    const t = window.setTimeout(() => setLayers((l) => l.filter((x) => !x.out)), ROLL);
    timers.current.push(t);
  });

  useLayoutEffect(() => {
    if (sizer.current) setWidth(sizer.current.offsetWidth);
  }, [content.key, size, list]);

  useEffect(() => {
    if (phase === "busy") setLive(content.text.replace("…", ""));
    if (phase === "done") setLive(content.text);
  }, [phase, content.text]);

  const run = (i: number) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setRunning(i);
    setPhase("busy");
    setOpen(false);
    snd("tick", 0.4);
    onAction?.(list[i].label);
    timers.current.push(
      window.setTimeout(() => {
        setPhase("done");
        snd("pop", 0.45, 1.1);
      }, duration),
      window.setTimeout(() => {
        setPhase("idle");
        setRunning(null);
        busyRef.current = false;
      }, duration + HOLD),
    );
  };

  const close = useCallback((returnFocus = false, silent = false) => {
    setOpen((o) => {
      if (o && !silent) snd("collapse", 0.3);
      return false;
    });
    setCur(null);
    if (returnFocus) caret.current?.focus();
  }, [loud]); // eslint-disable-line react-hooks/exhaustive-deps

  const openMenu = (byKey: boolean) => {
    if (busyRef.current || open) return;
    viaKey.current = byKey;
    setOpen(true);
    snd("expand", 0.35);
  };

  useEffect(() => {
    if (open && viaKey.current) items.current[mainIdx]?.focus();
    viaKey.current = false;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open, close]);

  const pick = (i: number) => {
    if (busyRef.current) return;
    if (swap) {
      setMain(i);
      close(false, true);
    } else run(i);
  };

  const hover = (i: number) => {
    setCur(i);
    const now = performance.now();
    if (now - lastTick.current > 50) {
      lastTick.current = now;
      snd("tick", 0.15, 1.1);
    }
  };

  const focusItem = (i: number) => items.current[(i + list.length) % list.length]?.focus();
  const menuKey = (e: KeyboardEvent) => {
    const at = items.current.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") focusItem(at + 1);
    else if (e.key === "ArrowUp") focusItem(at < 0 ? -1 : at - 1);
    else if (e.key === "Home") focusItem(0);
    else if (e.key === "End") focusItem(-1);
    else if (e.key === "Escape") close(true);
    else if (e.key === "Tab") close();
    else return;
    if (e.key !== "Tab") e.preventDefault();
  };
  const triggerKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    if (open) focusItem(mainIdx);
    else openMenu(true);
  };

  const mac = (s: string) => (apple ? s : s.replace("⌘", "Ctrl "));
  const role = swap ? "menuitemradio" : "menuitem";
  const style = {
    "--h": `${HEIGHT[size]}px`,
    "--fs": `${TEXT[size]}px`,
    "--radius": `${radius}px`,
    "--dur": `${duration}ms`,
    "--rows": list.length,
    "--w": width !== undefined ? `${width}px` : "auto",
    // the box is exactly what is visible: the button, plus the menu while open
    ...(width !== undefined && {
      width: Math.max(Math.min(width, 260) + 2 * Math.round(HEIGHT[size] * 0.36) + 36, open ? 220 : 0),
      height: HEIGHT[size] + (open ? 16 + list.length * 32 : 0),
    }),
  } as CSSProperties;

  return (
    <div
      ref={root}
      className="sb"
      data-variant={variant.toLowerCase()}
      data-phase={phase}
      data-open={open || undefined}
      data-align={align.toLowerCase()}
      style={style}
      onBlur={(e) => {
        if (open && e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) close();
      }}
    >
      <div className="sb-btn">
        <span className="sb-fill" aria-hidden="true" />
        <button type="button" className="sb-main" aria-busy={phase === "busy"} onClick={() => run(shown)} onKeyDown={triggerKey}>
          <span className="sb-view">
            <span className="sb-sizer" ref={sizer} aria-hidden="true">
              <Body c={content} />
            </span>
            {layers.map((l) => (
              <span key={l.id} className="sb-layer" data-out={l.out || undefined} data-enter={l.enter || undefined} aria-hidden={l.out || undefined}>
                <Body c={l.c} />
              </span>
            ))}
          </span>
        </button>
        <button
          ref={caret}
          type="button"
          className="sb-caret"
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={phase !== "idle"}
          onClick={() => (open ? close() : openMenu(false))}
          onKeyDown={triggerKey}
        >
          <Icon icon="ph:caret-down-bold" className="sb-caret-icon" />
        </button>
      </div>

      <div className="sb-menu" role="menu" aria-label="Actions" onKeyDown={menuKey} onPointerLeave={() => setCur(null)}>
        <span className="sb-hl" aria-hidden="true" style={{ "--i": cur ?? 0, opacity: cur === null ? 0 : 1 } as CSSProperties} />
        {list.map((x, i) => (
          <button
            key={x.label}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            role={role}
            aria-checked={swap ? i === mainIdx : undefined}
            tabIndex={-1}
            className="sb-row"
            onPointerEnter={() => hover(i)}
            onFocus={() => cur !== i && hover(i)}
            onClick={() => pick(i)}
          >
            {x.icon && <Icon icon={x.icon} className="sb-row-icon" />}
            <span className="sb-row-label">{x.label}</span>
            {i === mainIdx && <Icon icon="ph:check-bold" className="sb-row-check" />}
            {shortcuts && x.shortcut && <span className="sb-row-key">{mac(x.shortcut)}</span>}
          </button>
        ))}
      </div>
      <span className="sb-live" role="status" aria-live="polite">
        {live}
      </span>
    </div>
  );
}

