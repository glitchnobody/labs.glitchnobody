/* ══ Event stack ══════════════════════════════════════
   A stack of upcoming events. Show All deals the cards out into a list,
   Show Less gathers them back behind the top card. Swipe a card sideways,
   or press its ×, to dismiss it, and Restore brings dismissed cards back.

   ── ONE LIST, TWO SHAPES ─────────────────────────────
   The cards are always one column. Stacked, every card after the first
   gets a negative top margin so it tucks behind the one above, leaving only
   a strip of its bottom edge; it is also scaled down from its bottom edge
   and its content fades out. Expanded, the margins become the list gap.
   motion's layout animation measures each card before and after and
   springs it between the two, one card after another.

   ── SWIPING ──────────────────────────────────────────
   Each card can be dragged sideways. Its horizontal offset drives a slight
   tilt and a fade, so it feels like a card leaving a table. Let go past the
   threshold, or with a fast flick, and it flies off that side while the
   others close the gap; otherwise it springs back.

   ── RESTORING ────────────────────────────────────────
   Dismissed cards remember the side they left on and come back from it, in
   their original order. */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { AnimatePresence, LayoutGroup, LazyMotion, domMax, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Icon } from "@iconify/react";

const EVENTS = [
  { title: "Camping", place: "Yosemite Park", date: "5 August", icon: "tent" },
  { title: "Hiking", place: "Mount Tamalpais", date: "12 August", icon: "mountains" },
  { title: "Flight to Lisbon", place: "SFO → LIS", date: "20 August", icon: "airplane-tilt" },
  { title: "Concert", place: "The Fillmore", date: "2 September", icon: "music-notes" },
  { title: "Birthday dinner", place: "Nopa", date: "9 September", icon: "cake" },
  { title: "Surf lesson", place: "Ocean Beach", date: "14 September", icon: "waves" },
  { title: "Book club", place: "City Lights", date: "21 September", icon: "book-open" },
];
const W = 300, H = 64;

export type EventStackProps = {
  count?: number;
  peek?: number;
  peekOffset?: number;
  peekScale?: number;
  gap?: number;
  radius?: number;
  tile?: "Dark" | "Accent" | "Soft";
  weight?: "Fill" | "Bold" | "Regular" | "Duotone";
  showDate?: boolean;
  dismiss?: boolean;
  threshold?: number;
  stagger?: number;
  bounce?: number;
  speed?: number;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

type Ev = (typeof EVENTS)[number];

function Card(props: {
  ev: Ev; level: number; open: boolean; peek: number; peekOffset: number; peekScale: number; gap: number; dismiss: boolean;
  threshold: number; transition: object; suffix: string; showDate: boolean; reduced: boolean; side: number; first: boolean;
  onGone: (dir: number) => void; onLand: () => void; onKey: (e: KeyboardEvent) => void;
}) {
  const { ev, level, open, peek, peekOffset, peekScale, gap, dismiss, threshold, transition, suffix, showDate, reduced, side } = props;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-W, 0, W], [-4, 0, 4]);
  const fade = useTransform(x, [-W, 0, W], [0.2, 1, 0.2]);
  const hidden = !open && level > peek;
  const top = !open && level > 0;
  const scale = open ? 1 : 1 - (Math.min(level, peek + 1) * peekScale) / 100;
  const marginTop = level === 0 ? 0 : open ? gap : -(H - (level > peek ? 0 : peekOffset));
  return (
    <m.li
      layout
      className="evs-card"
      data-top={level === 0 || open}
      tabIndex={level === 0 || open ? 0 : -1}
      aria-label={`${ev.title}, ${ev.place}, ${ev.date}`}
      style={{ x, rotate, zIndex: 20 - level, marginTop, transformOrigin: "50% 100%" } as never}
      initial={props.first ? false : { opacity: 0, x: (side || 1) * W }}
      animate={{ scale, opacity: hidden ? 0 : 1, x: 0 }}
      variants={{ exit: (d: number) => ({ opacity: 0, x: reduced ? 0 : (d || 1) * (W + 60), transition: { duration: reduced ? 0.12 : 0.28 } }) }}
      exit="exit"
      transition={transition}
      onLayoutAnimationComplete={() => { if (open && level > 0) props.onLand(); }}
      drag={dismiss && (level === 0 || open) ? "x" : false}
      dragDirectionLock
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        const far = Math.abs(info.offset.x) > (threshold / 100) * W || Math.abs(info.velocity.x) > 600;
        if (far) props.onGone(Math.sign(info.offset.x || info.velocity.x));
      }}
      onKeyDown={props.onKey}
    >
      <m.div className="evs-in" style={{ opacity: fade }} animate={{ opacity: top ? 0 : 1 }} transition={{ duration: 0.2 }}>
        <span className="evs-tile"><Icon icon={`ph:${ev.icon}${suffix}`} width={20} height={20} /></span>
        <span className="evs-txt">
          <b>{ev.title}</b>
          <span className="evs-sub"><span>{ev.place}</span>{showDate && <span>{ev.date}</span>}</span>
        </span>
        {dismiss && (
          <button type="button" className="evs-x" aria-label={`Dismiss ${ev.title}`} tabIndex={level === 0 || open ? 0 : -1}
            onPointerDownCapture={(e) => e.stopPropagation()} onClick={() => props.onGone(1)}>
            <Icon icon="ph:x-bold" width={12} height={12} />
          </button>
        )}
      </m.div>
    </m.li>
  );
}

export function EventStack({
  count = 4, peek = 2, peekOffset = 10, peekScale = 4, gap = 12, radius = 10, tile = "Dark", weight = "Fill", showDate = true,
  dismiss = true, threshold = 35, stagger = 40, bounce = 20, speed = 60, sound = true, volume = 70, onSound,
}: EventStackProps) {
  const n = Math.max(2, Math.min(7, Math.round(count)));
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState<Record<string, number>>({});
  const [lastDir, setLastDir] = useState(1);
  const sides = useRef<Record<string, number>>({});
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  const reduced = !!useReducedMotion();
  const group = useId(), listId = useId();
  const lastTick = useRef(0);
  const list = EVENTS.slice(0, n).filter((e) => !(e.title in gone));
  const suffix = { Fill: "-fill", Bold: "-bold", Regular: "", Duotone: "-duotone" }[weight];

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };
  const spring = (i: number, dir: 1 | -1) =>
    reduced ? { duration: 0.15 } : { type: "spring" as const, bounce: (bounce / 100) * 0.6, duration: 0.8 - (speed / 100) * 0.5, delay: ((dir > 0 ? i : list.length - 1 - i) * stagger) / 1000 };

  function toggle() {
    setOpen(!open);
    snd(open ? "collapse" : "expand", { volume: open ? 0.5 : 0.6 });
  }
  function drop(t: string, dir: number) {
    sides.current[t] = dir || 1;
    setLastDir(dir || 1);
    setGone((g) => ({ ...g, [t]: dir || 1 }));
    snd("swipe", { volume: 0.7, pitch: 0.94 + Math.random() * 0.12 });
  }
  function restore() {
    setGone({});
  }

  return (
    <LazyMotion features={domMax} strict>
      <LayoutGroup id={group}>
        <div className="evs" data-tile={tile.toLowerCase()} data-open={open} style={{ "--evs-r": `${radius}px` } as CSSProperties}>
          <ul className="evs-list" id={listId}>
            <AnimatePresence mode="popLayout" initial={false} custom={lastDir}>
              {list.map((ev, i) => (
                <Card
                  key={ev.title}
                  ev={ev} level={i} open={open} peek={peek} peekOffset={peekOffset} peekScale={peekScale} gap={gap} dismiss={dismiss}
                  threshold={threshold} transition={spring(i, open ? 1 : -1)} suffix={suffix} showDate={showDate} reduced={reduced}
                  side={sides.current[ev.title] ?? 1} first={!mounted.current}
                  onGone={(d) => drop(ev.title, d)}
                  onLand={() => { const t = performance.now(); if (t - lastTick.current > 30) { lastTick.current = t; snd("tick", { volume: 0.4, pitch: 1 + 0.06 * i }); } }}
                  onKey={(e) => {
                    if ((e.key === "Delete" || e.key === "Backspace") && dismiss && e.target === e.currentTarget) {
                      e.preventDefault();
                      const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                      drop(ev.title, 1);
                      requestAnimationFrame(() => next?.focus());
                    }
                  }}
                />
              ))}
            </AnimatePresence>
            {!list.length && (
              <m.li layout className="evs-empty">
                <Icon icon="ph:calendar-check" width={20} height={20} />
                All caught up
              </m.li>
            )}
          </ul>
          <m.div layout className="evs-bar" transition={reduced ? { duration: 0.15 } : { type: "spring", bounce: 0.2, duration: 0.5 }}>
            <button type="button" className="evs-btn" aria-expanded={open} aria-controls={listId} onClick={toggle} disabled={list.length < 2 && !open}>
              {open ? "Show Less" : "Show All"}
              <Icon icon="ph:caret-down-bold" width={12} height={12} />
            </button>
            {Object.keys(gone).length > 0 && (
              <button type="button" className="evs-restore" onClick={restore}>
                <Icon icon="ph:arrow-counter-clockwise-bold" width={12} height={12} />
                Restore
              </button>
            )}
          </m.div>
        </div>
      </LayoutGroup>
    </LazyMotion>
  );
}
