/* ══ Toast stack ═════════════════════════════════════
   A neat pile of notifications. Hover it and the toasts unfold into a list;
   drag one sideways or press its × to dismiss it, or press the round × on
   the corner to clear them all and watch the stack refill one by one.

   ── ONE TRANSFORM PER TOAST ──────────────────────────
   Every toast sits at the same anchor (the bottom, or the top) and is moved
   only by a CSS transform. Its place is worked out from the measured heights
   of the toasts in front of it: in the pile, each one behind is lifted by the
   peek and scaled down 5% from its far edge, so a sliver shows past the one
   in front; in the list, it is lifted by the heights and gaps of all the
   toasts nearer the anchor. Unfolding is just a change of numbers, and a
   linear() spring curve on the transition does the rest.

   ── SWIPE AND FLICK ──────────────────────────────────
   A sideways drag moves the toast's body 1:1 and fades it. On release it
   flies off if it went past 80 px or was still moving faster than 0.4 px
   per ms; otherwise the same spring brings it back. A dismissed toast keeps
   the place it had, so it can fly from there, while the others take their
   new places at once and close the gap.

   ── CLEARING AND REFILLING ───────────────────────────
   Clear all sends every toast off with a 40 ms stagger, done with a
   transition delay per toast rather than timers, so the pile does not
   reshuffle mid-flight. Whenever the stack ends up empty it waits a second,
   then drops the original toasts back in, oldest first, each new one
   pushing the pile back.

   ── A BOX THAT FITS ──────────────────────────────────
   The stack's own box is always as tall as what is showing: the pile, or
   the unfolded list. Its height animates on the same spring, and because
   the page centres it, unfolding grows it equally up and down. */

import { Icon } from "@iconify/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as KE, type PointerEvent as PE } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type ToastKind = "success" | "info" | "warning" | "error";
export type Toast = { kind: ToastKind; title: string; description?: string };

export type ToastStackProps = {
  /** the toasts, newest first */
  toasts?: Toast[];
  /** how many of them are in the stack, 2 to 6 */
  count?: number;
  /** where the anchor is: the pile peeks and the list unfolds away from it */
  position?: "Bottom" | "Top";
  /** px each toast behind peeks out */
  peek?: number;
  /** px between toasts in the list */
  gap?: number;
  /** toast width in px */
  width?: number;
  /** toast corner radius in px */
  radius?: number;
  /** kind-coloured backgrounds */
  tint?: boolean;
  /** expand on hover; off, a click toggles it */
  hover?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
  onDismiss?: (index: number) => void;
  onClear?: () => void;
};

const KINDS: Record<ToastKind, { icon: string; color: string }> = {
  success: { icon: "ph:check-circle-fill", color: "var(--ok)" },
  info: { icon: "ph:info-fill", color: "var(--pick)" },
  warning: { icon: "ph:warning-fill", color: "var(--warn)" },
  error: { icon: "ph:x-circle-fill", color: "var(--danger)" },
};

const TOASTS: Toast[] = [
  { kind: "success", title: "Changes saved", description: "Your profile is up to date." },
  { kind: "info", title: "New comment", description: "Mira replied to your post." },
  { kind: "warning", title: "Storage almost full", description: "92% of 5 GB used." },
  { kind: "error", title: "Upload failed", description: "meadow.png is over 10 MB." },
  { kind: "success", title: "Invite sent", description: "Jonas will get an email." },
  { kind: "info", title: "Update ready", description: "Restart to install 2.4." },
];

const FALLBACK_H = 62; // a toast's height before it is measured
const SWIPE_PX = 80;
const FLICK = 0.4; // px per ms
const FLY_MS = 200;
const CLEAR_MS = 220;
const CLEAR_STAGGER = 40;
const CLOSE_MS = 180;
const REFILL_WAIT = 1000;
const REFILL_STEP = 180;

type Item = Toast & { id: number; enter?: boolean };
type Leave = { mode: "fly" | "shrink"; dir: number; ty: number; scale: number; z: number; dx: number; delay: number; ms: number };
type Gesture = { id: number; x: number; y: number; lx: number; lt: number; v: number; can: boolean; on: boolean };

export function ToastStack({
  toasts = TOASTS,
  count = 4,
  position = "Bottom",
  peek = 10,
  gap = 8,
  width = 300,
  radius = 10,
  tint = false,
  hover = true,
  sound = true,
  volume = 70,
  onSound,
  onDismiss,
  onClear,
}: ToastStackProps) {
  const ids = useRef(100); // later toasts; the first ones use their index, so server and client render the same ids
  const fresh = (): Item[] => toasts.slice(0, count).map((t) => ({ ...t, id: ids.current++ }));
  const [items, setItems] = useState<Item[]>(() => toasts.slice(0, count).map((t, i) => ({ ...t, id: i })));
  const [leaving, setLeaving] = useState<Record<number, Leave>>({});
  const [expanded, setExpanded] = useState(false);
  const [drag, setDrag] = useState<{ id: number; dx: number } | null>(null);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [snap, setSnap] = useState(false);
  const [hot, setHot] = useState<number | null>(null); // the toast under the pointer, which shows its ×

  const root = useRef<HTMLDivElement>(null);
  const els = useRef<Record<number, HTMLDivElement | null>>({});
  const open = useRef(false);
  const hovered = useRef(false);
  const gesture = useRef<Gesture | null>(null);
  const lastCue = useRef<Record<string, number>>({});
  const foldTimer = useRef(0);
  const refill = useRef<number[]>([]);
  const timers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const cue = (name: string, vol: number, pitch = 1, every = 0) => {
    if (!sound || !onSound) return;
    const now = performance.now();
    if (every && now - (lastCue.current[name] ?? -1e9) < every) return;
    lastCue.current[name] = now;
    onSound(name, { volume: vol * (volume / 100), pitch });
  };

  const setOpen = (on: boolean, quiet = false) => {
    clearTimeout(foldTimer.current);
    if (open.current === on) return;
    open.current = on;
    setExpanded(on);
    if (!quiet) cue(on ? "expand" : "collapse", on ? 0.3 : 0.25, 1, 300);
  };
  const foldSoon = () => {
    clearTimeout(foldTimer.current);
    foldTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  /* ── layout: where each toast sits, from the measured heights ── */
  const vis = items.filter((it) => !leaving[it.id]);
  const H = (id: number) => heights[id] ?? FALLBACK_H;
  const sign = position === "Bottom" ? -1 : 1; // toward the far side
  const place = vis.map((it, i) => {
    const z = vis.length - i;
    if (expanded) {
      let off = 0;
      for (let j = 0; j < i; j++) off += H(vis[j].id) + gap;
      return { ty: sign * off, scale: 1, z, behind: false, hidden: false };
    }
    const k = Math.min(i, 2);
    return { ty: sign * (H(vis[0].id) - H(it.id) + peek * k), scale: 1 - 0.05 * k, z, behind: i > 0, hidden: i > 2 };
  });
  const listH = vis.reduce((s, it, i) => s + H(it.id) + (i ? gap : 0), 0);
  /* the box is the size of what shows now (the pile, or the list), so the card keeps it centred */
  const box = expanded ? listH : vis.length ? H(vis[0].id) + peek * Math.min(vis.length - 1, 2) : 0;
  /* the clear-all × rides the far corner of the front toast, or of the last one in the list */
  const edge = expanded ? listH : vis.length ? H(vis[0].id) : 0;

  /* heights come from the DOM after each render; only a real change re-renders */
  useLayoutEffect(() => {
    let changed = false;
    const next = { ...heights };
    for (const it of items) {
      const h = els.current[it.id]?.offsetHeight;
      if (h && h !== next[it.id]) {
        next[it.id] = h;
        changed = true;
      }
    }
    if (changed) setHeights(next);
  });

  /* ── dismissing ── */
  const remove = (gone: number[], after: number) =>
    later(after, () => {
      setItems((its) => its.filter((x) => !gone.includes(x.id)));
      setLeaving((l) => {
        const r = { ...l };
        for (const id of gone) delete r[id];
        return r;
      });
    });

  const dismiss = (id: number, mode: Leave["mode"], dir = 1, dx = 0) => {
    const i = vis.findIndex((v) => v.id === id);
    if (i < 0) return;
    const p = place[i];
    const ms = mode === "fly" ? FLY_MS : CLOSE_MS;
    setLeaving((l) => ({ ...l, [id]: { mode, dir, ty: p.ty, scale: p.scale, z: p.z, dx, delay: 0, ms } }));
    remove([id], ms + 20);
    onDismiss?.(i);
  };

  const clearAll = () => {
    if (!vis.length) return;
    refill.current.forEach(clearTimeout);
    refill.current = [];
    const add: Record<number, Leave> = {};
    vis.forEach((it, i) => {
      const p = place[i];
      add[it.id] = { mode: "fly", dir: 1, ty: p.ty, scale: p.scale, z: p.z, dx: 0, delay: i * CLEAR_STAGGER, ms: CLEAR_MS };
    });
    setLeaving((l) => ({ ...l, ...add }));
    remove(Object.keys(add).map(Number), (vis.length - 1) * CLEAR_STAGGER + CLEAR_MS + 20);
    cue("whoosh", 0.45);
    hovered.current = false;
    setOpen(false, true);
    onClear?.();
  };

  /* ── refill: whenever the stack is empty, wait, then drop the toasts back in, oldest first ── */
  useEffect(() => {
    if (items.length) return;
    const src = toasts.slice(0, count).reverse();
    refill.current = [
      window.setTimeout(() => {
        src.forEach((t, k) =>
          refill.current.push(
            window.setTimeout(() => {
              setItems((its) => [{ ...t, id: ids.current++, enter: true }, ...its]);
              cue("pop", 0.25, 0.95 + 0.05 * k);
            }, k * REFILL_STEP),
          ),
        );
      }, REFILL_WAIT),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  /* a new count or list rebuilds the stack, without animation */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    refill.current.forEach(clearTimeout);
    timers.current.forEach(clearTimeout);
    refill.current = timers.current = [];
    setLeaving({});
    setItems(fresh());
    setSnap(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, toasts]);

  useLayoutEffect(() => {
    if (!snap) return;
    void root.current?.offsetWidth;
    setSnap(false);
  }, [snap]);

  /* a tap or click outside folds the list */
  useEffect(() => {
    if (!expanded) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      refill.current.forEach(clearTimeout);
      clearTimeout(foldTimer.current);
    },
    [],
  );

  /* ── pointer on a toast: a sideways drag dismisses, a plain click toggles in click mode ── */
  const down = (e: PE<HTMLDivElement>, id: number, i: number) => {
    if (e.button !== 0 || (e.target as Element).closest("button")) return;
    gesture.current = { id, x: e.clientX, y: e.clientY, lx: e.clientX, lt: e.timeStamp, v: 0, can: open.current || i === 0, on: false };
  };
  const move = (e: PE<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.on) {
      if (g.can && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        g.on = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {} // synthetic pointers (the play demo) cannot be captured
      } else if (Math.abs(dy) > 10) gesture.current = null; // a vertical scroll, not a swipe
      if (!g.on) return;
    }
    const dt = e.timeStamp - g.lt;
    if (dt > 0) g.v = (e.clientX - g.lx) / dt;
    g.lx = e.clientX;
    g.lt = e.timeStamp;
    setDrag({ id: g.id, dx });
  };
  const up = (e: PE<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (!g.on) {
      if (e.type === "pointerup" && (!hover || e.pointerType === "touch")) setOpen(!open.current);
      return;
    }
    const dx = e.clientX - g.x;
    const v = e.timeStamp - g.lt > 80 ? 0 : g.v; // a pause before letting go is not a flick
    setDrag(null);
    if (e.type === "pointerup" && (Math.abs(dx) > SWIPE_PX || Math.abs(v) > FLICK)) {
      const dir = Math.sign(Math.abs(v) > FLICK ? v : dx) || 1;
      dismiss(g.id, "fly", dir, dx);
      cue("swipe", 0.45, Math.min(1.3, 0.9 + Math.abs(v) * 0.25));
    }
    if (hover && !hovered.current) foldSoon();
  };

  const key = (e: KE<HTMLDivElement>, id: number, i: number) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const next = vis[i + 1] ?? vis[i - 1];
      if (next) els.current[next.id]?.focus();
      dismiss(id, "fly", 1);
      cue("swipe", 0.45);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = (e.key === "ArrowUp") === (position === "Bottom") ? 1 : -1;
      const to = vis[i + step];
      if (to) els.current[to.id]?.focus();
    }
  };

  return (
    <div
      ref={root}
      className="ts"
      role="region"
      aria-label={`Notifications, ${vis.length}`}
      data-position={position.toLowerCase()}
      data-expanded={expanded ? "" : undefined}
      data-tint={tint ? "" : undefined}
      data-click={hover ? undefined : ""}
      data-snap={snap ? "" : undefined}
      style={{ "--w": `${width}px`, "--r": `${radius}px`, "--box": `${box}px` } as CSSProperties}
      onPointerOver={(e) => {
        if (e.pointerType === "touch") return;
        clearTimeout(foldTimer.current);
        const t = (e.target as Element).closest<HTMLElement>(".ts-toast");
        setHot(t ? Number(t.dataset.id) : null);
        if (hover && (e.target as Element).closest(".ts-toast, .ts-zone")) {
          hovered.current = true;
          setOpen(true);
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") return;
        hovered.current = false;
        setHot(null);
        if (hover && !gesture.current?.on) foldSoon();
      }}
      onFocus={(e) => {
        if ((e.target as Element).matches(":focus-visible")) setOpen(true);
      }}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node) && !hovered.current) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open.current) {
          e.preventDefault(); // fold the list, not the dialog around it
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <div className="ts-list">
        <div className="ts-zone" style={{ "--zone": `${listH}px` } as CSSProperties} aria-hidden="true" />
        {items.map((it) => {
          const l = leaving[it.id];
          const i = vis.indexOf(it);
          const p = l ?? place[i];
          const dragging = drag?.id === it.id;
          const dx = dragging ? drag.dx : (l?.dx ?? 0);
          const k = KINDS[it.kind] ?? KINDS.info;
          return (
            <div
              key={it.id}
              ref={(el) => {
                els.current[it.id] = el;
              }}
              className="ts-toast"
              data-id={it.id}
              data-hot={hot === it.id ? "" : undefined}
              role="group"
              aria-label={it.description ? `${it.title}: ${it.description}` : it.title}
              tabIndex={l ? -1 : 0}
              inert={!!l}
              data-behind={!l && place[i].behind ? "" : undefined}
              data-hidden={!l && place[i].hidden ? "" : undefined}
              data-leave={l?.mode}
              data-drag={dragging ? "" : undefined}
              data-enter={it.enter ? "" : undefined}
              style={
                {
                  "--ty": `${p.ty}px`,
                  "--s": p.scale,
                  "--z": p.z,
                  "--kind": k.color,
                  "--dx": `${dx}px`,
                  "--o": Math.max(0.2, 1 - Math.abs(dx) / (width * 0.8)),
                  "--dir": l?.dir ?? 1,
                  "--delay": `${l?.delay ?? 0}ms`,
                  "--leave": `${l?.ms ?? FLY_MS}ms`,
                } as CSSProperties
              }
              onPointerDown={(e) => down(e, it.id, i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              onKeyDown={(e) => key(e, it.id, i)}
            >
              <div className="ts-body">
                <Icon className="ts-icon" icon={k.icon} aria-hidden="true" />
                <div className="ts-text">
                  <div className="ts-title">{it.title}</div>
                  {it.description && <div className="ts-desc">{it.description}</div>}
                </div>
                <button
                  type="button"
                  className="ts-close"
                  aria-label={`Dismiss: ${it.title}`}
                  onClick={() => {
                    dismiss(it.id, "shrink");
                    cue("swipe", 0.3, 1.1);
                  }}
                >
                  <Icon icon="ph:x-bold" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="ts-clear"
          aria-label="Clear all"
          data-gone={vis.length ? undefined : ""}
          tabIndex={vis.length ? 0 : -1}
          style={{ "--edge": `${sign * (edge - 16)}px` } as CSSProperties}
          onClick={clearAll}
        >
          <Icon icon="ph:x-bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
