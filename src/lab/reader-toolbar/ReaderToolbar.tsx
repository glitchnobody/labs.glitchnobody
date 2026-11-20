/* ══ Reader toolbar ═════════════════════════════
   A reader's toolbar pill: back arrow, book cover, title and author, and a
   "…" button. Press "…" and the title blurs away into Pin, Share and Close;
   press Close, or Escape, to bring the title back.

   ── BLUR CROSS-FADE ──────────────────────────
   Everything is plain CSS transitions on filter, opacity and transform,
   driven by one data-open attribute on the pill. Leaving items blur out and
   slide a few pixels left; entering actions blur in from the right. Because
   they are transitions, pressing Close halfway through an open simply turns
   each item around from wherever it is.

   ── THE STAGGER ──────────────────────────────
   Each action has its place as a CSS variable. Its transition-delay is the
   place times the stagger when opening (left to right) and the reverse when
   closing (right to left). The delay belongs to the state being entered, so
   the two directions need no JavaScript.

   ── FIT WIDTH ────────────────────────────────
   The width of the pill is a CSS variable. Reading, it is a fixed width;
   open with Fit width on, it is worked out from the cover plus the actions,
   and a transition on width moves between the two.

   ── FOCUS ────────────────────────────────────
   The hidden group is inert, so Tab skips it. After opening, focus moves to
   the first action; after closing it returns to "…". */

import { Icon } from "@iconify/react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type ReaderToolbarProps = {
  title?: string;
  author?: string;
  /** cover image URL; without one the cover is a gradient with the title's initials */
  cover?: string;
  /** site only: filler images, the first is used as the cover */
  images?: string[];
  /** how blurry items get, in px */
  blur?: number;
  /** morph duration, ms */
  speed?: number;
  /** ms between actions */
  stagger?: number;
  /** the pill shrinks to fit the actions */
  fitWidth?: boolean;
  /** 2 to 4, Close is always last */
  actions?: number;
  coverShape?: "Square" | "Rounded" | "Round";
  size?: "S" | "M" | "L";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onPin?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onBack?: () => void;
  onSound?: Sound;
};

const SIZE = { S: 40, M: 48, L: 56 };
const ICON = {
  pin: ["ph:push-pin-fill", "Pin"],
  share: ["ph:export-fill", "Share"],
  bookmark: ["ph:bookmark-simple-fill", "Bookmark"],
  close: ["ph:x-bold", "Close actions"],
} as const;
const SETS = {
  2: ["pin", "close"],
  3: ["pin", "share", "close"],
  4: ["pin", "share", "bookmark", "close"],
} as const;
const READING_W = 280;
const POP = "linear(0, 0.4 8%, 0.8 18%, 1.04 32%, 1.07 40%, 1.02 62%, 0.995 80%, 1)";

function hue(s: string, k: number) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0) * (k + 1)) % 360;
  return h;
}

export function ReaderToolbar({
  title = "Field Notes on Making",
  author = "Ada Moreno",
  cover,
  images,
  blur = 8,
  speed = 260,
  stagger = 40,
  fitWidth = false,
  actions = 3,
  coverShape = "Rounded",
  size = "M",
  sound = true,
  volume = 70,
  onPin,
  onShare,
  onBookmark,
  onBack,
  onSound,
}: ReaderToolbarProps) {
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const gid = useId();

  const h = SIZE[size] ?? 48;
  const btn = h - 8;
  const ids = SETS[Math.min(4, Math.max(2, Math.round(actions))) as 2 | 3 | 4];
  const n = ids.length;
  const fit = 4 + btn + 4 + (h - 12) + 12 + n * btn + (n - 1) * 8 + 4;
  const width = open && fitWidth ? fit : Math.max(READING_W, fit);
  const src = cover ?? images?.[0];
  const initials = title.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const loud = sound && onSound ? volume / 100 : 0;
  const snd = (name: string, v: number, pitch = 1) => loud && onSound!(name, { volume: v * loud, pitch });

  const toggle = (next: boolean) => {
    if (next === open) return;
    setOpen(next);
    snd(next ? "expand" : "collapse", 0.5);
  };

  useEffect(() => {
    /* only a real open/close moves focus: not the first render, and not React's dev double-run,
       which would otherwise pull the page to this component on every load */
    if (mounted.current === open) return;
    mounted.current = open;
    const keep = { preventScroll: true };
    if (open) groupRef.current?.querySelector<HTMLElement>("button")?.focus(keep);
    else if (groupRef.current?.contains(document.activeElement)) moreRef.current?.focus(keep);
  }, [open]);

  const press = (e: React.MouseEvent<HTMLButtonElement>, fn?: () => void) => {
    const icon = e.currentTarget.firstElementChild as HTMLElement | null;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      icon?.animate?.([{ transform: "scale(0.9)" }, { transform: "scale(1)" }], { duration: 400, easing: POP });
    snd("tick", 0.5, 1.1);
    fn?.();
  };

  const style = {
    "--h": `${h}px`,
    "--btn": `${btn}px`,
    "--w": `${width}px`,
    "--blur": `${blur}px`,
    "--speed": `${speed}ms`,
    "--stagger": `${stagger}ms`,
    "--n": n,
  } as CSSProperties;

  return (
    <div
      className="rt"
      role="toolbar"
      aria-label={title}
      data-open={open ? "" : undefined}
      data-cover={coverShape.toLowerCase()}
      style={style}
      onKeyDown={(e) => e.key === "Escape" && open && toggle(false)}
    >
      <button type="button" className="rt-btn rt-back rt-read" aria-label="Back" inert={open} onClick={(e) => press(e, onBack)}>
        <Icon icon="ph:caret-left-bold" width={16} height={16} />
      </button>
      <div
        className="rt-cover"
        role="img"
        aria-label={title}
        style={
          src
            ? { backgroundImage: `url(${src})` }
            : { backgroundImage: `linear-gradient(135deg, hsl(${hue(title, 1)} 60% 55%), hsl(${hue(title, 2)} 65% 40%))` }
        }
      >
        {!src && <span>{initials}</span>}
      </div>
      <div className="rt-text rt-read" aria-hidden={open}>
        <span className="rt-title">{title}</span>
        <span className="rt-author">{author}</span>
      </div>
      <button
        ref={moreRef}
        type="button"
        className="rt-btn rt-more rt-read"
        aria-label="More actions"
        aria-expanded={open}
        aria-controls={gid}
        inert={open}
        onClick={() => toggle(true)}
      >
        <Icon icon="ph:dots-three-bold" width={16} height={16} />
      </button>
      <div id={gid} ref={groupRef} className="rt-actions" role="group" aria-label="Actions" inert={!open}>
        {ids.map((id, i) => (
          <button
            key={id}
            type="button"
            className="rt-btn rt-act"
            data-kind={id}
            style={{ "--i": i } as CSSProperties}
            aria-label={ICON[id][1]}
            onClick={(e) => (id === "close" ? toggle(false) : press(e, id === "pin" ? onPin : id === "share" ? onShare : onBookmark))}
          >
            <Icon icon={ICON[id][0]} width={16} height={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
