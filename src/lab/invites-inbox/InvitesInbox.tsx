/* ══ Invites inbox ═════════════════════════════════
   An "Invites" pill with a live count. Press it and it blurs open into a
   panel of invites; accept or decline them row by row and watch the badge
   count down to "All caught up". Closing folds the panel back into the pill.

   ── ONE ELEMENT, TWO FACES ───────────────────────────
   The pill and the panel are two layers inside one rounded box. The box's
   width, height and radius are set from measured sizes (the pill's own
   width, the panel's natural height) and transition with a spring-shaped
   CSS linear() curve. The face that is leaving blurs and fades first; the
   one arriving blurs in a moment later, its rows rising 4px one after
   another. While the panel is open its height follows the content live.

   ── ROWS LEAVE ONE BY ONE ────────────────────────────
   Every row sits in a grid wrapper that goes from 1fr to 0fr, so its height
   collapses smoothly with no measuring and the rows below move up. Accepted
   rows tint green, swap their icon for a check and slide right; declined
   rows slide left. Each row has its own timers, so several can leave at once.

   ── THE BADGE ROLL ───────────────────────────────────
   When the unread count changes, the old number slides out and the new one
   slides in from the other side, downwards when the count falls and upwards
   when it rises. After closing, handled invites can come back after 2s. */

import { Icon } from "@iconify/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type Invite = { title: string; line: string; icon: string };

export type InvitesInboxProps = {
  /** how many invites, 1 to 6 */
  count?: number;
  /** how many are unread (capped at count) */
  unread?: number;
  /** blur during the morph, px */
  blur?: number;
  /** 0 to 100 */
  speed?: number;
  /** handled invites come back after the panel closes */
  refill?: boolean;
  badge?: "Number" | "Dot" | "None";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onAccept?: (invite: Invite) => void;
  onDecline?: (invite: Invite) => void;
  onSound?: Sound;
};

const INVITES: Invite[] = [
  { title: "Sonora Repository", line: "Contribute to the code repository", icon: "ph:folder-simple-fill" },
  { title: "Design Tokens", line: "Collaborate on design tokens", icon: "ph:compass-tool-fill" },
  { title: "Motion Kit", line: "Contribute to motion components", icon: "ph:lightning-fill" },
  { title: "Build Tools", line: "Explore build tools & pipeline", icon: "ph:hammer-fill" },
  { title: "Icon Library", line: "Help shape the icon set", icon: "ph:shapes-fill" },
  { title: "Docs Site", line: "Review the new docs", icon: "ph:book-open-fill" },
];

type Item = { k: number; unread: boolean; st: "in" | "ok" | "out" | "gone"; dir: "l" | "r" };
const build = (count: number, unread: number): Item[] =>
  Array.from({ length: count }, (_, k) => ({ k, unread: k < unread, st: "in", dir: "r" }));

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(n)));

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

/* the badge number: the old value slides out, the new one in */
function Roll({ value }: { value: number }) {
  const [prev, setPrev] = useState<{ v: number; dir: "down" | "up" } | null>(null);
  const last = useRef(value);
  useEffect(() => {
    if (last.current === value) return;
    setPrev({ v: last.current, dir: value < last.current ? "down" : "up" });
    last.current = value;
    const t = setTimeout(() => setPrev(null), 240);
    return () => clearTimeout(t);
  }, [value]);
  const text = (n: number) => (n > 9 ? "9+" : String(n));
  return (
    <span className="ivi-roll" data-dir={prev?.dir}>
      <span key={value} className={prev ? "ivi-in" : undefined}>{text(value)}</span>
      {prev && <span key={"p" + prev.v} className="ivi-out" aria-hidden="true">{text(prev.v)}</span>}
    </span>
  );
}

export function InvitesInbox({
  count = 4,
  unread = 2,
  blur = 10,
  speed = 60,
  refill = true,
  badge = "Number",
  sound = true,
  volume = 70,
  onAccept,
  onDecline,
  onSound,
}: InvitesInboxProps) {
  const n = clamp(count, 1, 6);
  const u = clamp(unread, 0, n);
  const reduced = useReducedMotion();
  const [items, setItems] = useState<Item[]>(() => build(n, u));
  const [open, setOpen] = useState(false);
  const [morph, setMorph] = useState(false);
  const [size, setSize] = useState<{ pw: number; ph: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hot, setHot] = useState(-1);
  const [say, setSay] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const lastTick = useRef(0);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
  useEffect(() => {
    setMounted(true);
    const all = timers.current;
    return () => all.forEach(clearTimeout);
  }, []);

  const play = (name: string, vol: number) => {
    if (sound) onSound?.(name, { volume: (vol * volume) / 100 });
  };

  /* knobs rebuild the list without animation */
  useEffect(() => setItems(build(n, u)), [n, u]);

  const unreadNow = items.filter((i) => i.unread && i.st === "in").length;

  /* tick when the badge number changes */
  const prevUnread = useRef(unreadNow);
  useEffect(() => {
    if (prevUnread.current !== unreadNow) {
      prevUnread.current = unreadNow;
      const now = performance.now();
      if (now - lastTick.current > 60) {
        lastTick.current = now;
        play("tick", 0.3);
      }
    }
  });

  /* measure the pill's width and the panel's natural height */
  useLayoutEffect(() => {
    const p = pill.current;
    const pn = panel.current;
    if (!p || !pn) return;
    const measure = () => {
      const pw = p.offsetWidth;
      const ph = pn.offsetHeight;
      setSize((s) => (s && s.pw === pw && s.ph === ph ? s : { pw, ph }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(p);
    ro.observe(pn);
    return () => ro.disconnect();
  }, []);

  /* the closed layer is out of the tab order and the accessibility tree */
  useEffect(() => {
    panel.current?.toggleAttribute("inert", !open);
  }, [open, mounted]);

  const dur = reduced ? 160 : Math.round(800 - clamp(speed, 0, 100) * 6);

  const toggle = (to: boolean) => {
    if (to === open) return;
    setOpen(to);
    setMorph(true);
    later(() => setMorph(false), dur + 60);
    play(to ? "expand" : "collapse", 0.5);
    if (to) later(() => root.current?.querySelector<HTMLElement>('li[data-st="in"]')?.focus({ preventScroll: true }), 60);
    else if (root.current?.contains(document.activeElement)) pill.current?.focus({ preventScroll: true });
  };

  /* an outside press closes */
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) toggle(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });

  /* handled invites come back 2s after closing */
  const handled = items.some((i) => i.st !== "in");
  useEffect(() => {
    if (open || !handled || !refill) return;
    const t = setTimeout(() => setItems(build(n, u)), 2000);
    return () => clearTimeout(t);
  }, [open, handled, refill, n, u]);

  const act = (idx: number, kind: "accept" | "decline") => {
    const it = items[idx];
    if (it.st !== "in") return;
    const invite = INVITES[it.k];
    const set = (patch: Partial<Item>) => setItems((a) => a.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
    const left = items.filter((x, i) => x.unread && x.st === "in" && i !== idx).length;
    const outMs = reduced ? 120 : 300;
    if (kind === "accept") {
      set({ st: "ok" });
      later(() => set({ st: "out", dir: "r" }), reduced ? 0 : 250);
      later(() => set({ st: "gone" }), (reduced ? 0 : 250) + outMs);
      play("join", 0.5);
      onAccept?.(invite);
    } else {
      set({ st: "out", dir: "l" });
      later(() => set({ st: "gone" }), outMs);
      play("swipe", 0.5);
      onDecline?.(invite);
    }
    if (it.unread) setItems((a) => a.map((x, i) => (i === idx ? { ...x, unread: false } : x)));
    setSay(`${kind === "accept" ? "Accepted" : "Declined"} ${invite.title}. ${left} unread.`);
    /* focus moves on to the next open row, or to the close button */
    const lis = [...(root.current?.querySelectorAll<HTMLElement>('li[data-st="in"]') ?? [])];
    const at = lis.findIndex((l) => l.dataset.idx === String(idx));
    if (root.current?.contains(document.activeElement)) (lis[at + 1] ?? lis[at - 1] ?? closeBtn.current)?.focus({ preventScroll: true });
  };

  const visible = items.filter((i) => i.st === "in" || i.st === "ok").length;
  const w = 220;
  const style = {
    "--ivi-dur": `${dur}ms`,
    "--ivi-blur": `${reduced ? 0 : clamp(blur, 0, 20)}px`,
    ...(size && { width: open ? w : size.pw, height: open ? size.ph : 40 }),
  } as CSSProperties;

  const badgeEl =
    unreadNow > 0 && badge === "Number" ? (
      <span className="ivi-badge"><Roll value={unreadNow} /></span>
    ) : unreadNow > 0 && badge === "Dot" ? (
      <span className="ivi-dot" />
    ) : null;

  return (
    <div
      ref={root}
      className="ivi"
      style={style}
      data-open={open ? "" : undefined}
      data-morph={morph ? "" : undefined}
      data-ready={size ? "" : undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          toggle(false);
        }
      }}
    >
      <button
        ref={pill}
        type="button"
        className="ivi-pill"
        aria-expanded={open}
        aria-label={`Invites, ${unreadNow} unread`}
        tabIndex={open ? -1 : 0}
        onClick={() => toggle(true)}
      >
        <span>Invites</span>
        {badgeEl}
      </button>
      <div ref={panel} className="ivi-panel" aria-hidden={!open}>
        <div className="ivi-head">
          <h3>Invites</h3>
          <button ref={closeBtn} type="button" className="ivi-x" aria-label="Close invites" onClick={() => toggle(false)}>
            {mounted && <Icon icon="ph:x-bold" width={12} />}
          </button>
        </div>
        <ul className="ivi-list">
          {items.map((it, idx) => {
            const inv = INVITES[it.k];
            if (it.st === "gone") return null;
            return (
              <li
                key={it.k}
                className="ivi-wrap"
                data-st={it.st}
                data-idx={idx}
                tabIndex={-1}
                style={{ "--i": idx } as CSSProperties}
                onPointerEnter={() => setHot(idx)}
                onPointerLeave={() => setHot((h) => (h === idx ? -1 : h))}
              >
                <div className="ivi-clip">
                  <div className="ivi-row" data-dir={it.dir} data-hot={hot === idx ? "" : undefined}>
                    <span className="ivi-tile">
                      {mounted && <Icon key={it.st === "ok" ? "c" : "i"} icon={it.st === "ok" ? "ph:check-bold" : inv.icon} width={16} />}
                      {it.unread && <span className="ivi-unread" />}
                    </span>
                    <span className="ivi-text">
                      <b>{inv.title}</b>
                      <small>{inv.line}</small>
                    </span>
                    <span className="ivi-acts">
                      <button type="button" className="ivi-yes" aria-label={`Accept ${inv.title}`} onClick={() => act(idx, "accept")}>
                        {mounted && <Icon icon="ph:check-bold" width={12} />}
                      </button>
                      <button type="button" className="ivi-no" aria-label={`Decline ${inv.title}`} onClick={() => act(idx, "decline")}>
                        {mounted && <Icon icon="ph:x-bold" width={12} />}
                      </button>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="ivi-empty" data-show={visible === 0 ? "" : undefined}>
          <div>
            <span>
              {mounted && <Icon icon="ph:check-circle-fill" width={20} />}
              All caught up
            </span>
          </div>
        </div>
      </div>
      <span className="ivi-live" role="status" aria-live="polite">{say}</span>
    </div>
  );
}
