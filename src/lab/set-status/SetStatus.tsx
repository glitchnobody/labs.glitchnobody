/* ══ Set status ═════════════════════════════════
   A "Set Status" pill that pops up a row of emoji statuses. Hover one to read
   its label in a thought bubble, press it to send the emoji flying into the
   pill, and press the cross to clear it again.

   ── SPRINGS WITHOUT A LIBRARY ────────────────
   Every pop is a CSS transition whose easing is a linear() curve. The curve is
   sampled from a damped spring (the bounce prop sets the damping), so the
   options overshoot and settle with no animation library. Each option gets a
   transition-delay from its distance to the centre of the row, so they pop
   outwards from the middle and close back inwards.

   ── THE THOUGHT BUBBLE ───────────────
   One bubble is shared by all options. Its position and width are plain
   transforms and sizes set from the hovered option and its measured label, with
   the same spring easing, so it glides and resizes when you move along the
   row. The two trailing dots use a slower copy of the transition, so they lag
   behind and wobble.

   ── THE FLIGHT ────────────────────────
   On a pick, a copy of the emoji is placed over its option and animated along
   a short arc to the pill's icon slot with the Web Animations API, with a
   small spin and an overshoot on landing. The pill's own emoji stays hidden
   until the copy lands, then the pill squashes. The label width is measured
   so the pill grows and shrinks to fit the text. */

import { Icon } from "@iconify/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type SetStatusProps = {
  set?: "Work" | "Mood" | "Travel";
  /** how many statuses from the set, 3 to 7 */
  count?: number;
  buttonLabel?: string;
  showLabel?: boolean;
  bubble?: boolean;
  direction?: "Up" | "Down";
  /** diameter of the round options, px */
  size?: number;
  /** space between options, px */
  gap?: number;
  /** ms between options popping */
  stagger?: number;
  /** 0 to 100 */
  bounce?: number;
  hoverOpen?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const SETS: Record<string, [string, string][]> = {
  Work: [["🌴", "On Vacation"], ["🤒", "Feeling Sick"], ["🗓️", "In a Meeting"], ["👟", "Be Right Back"], ["🚌", "Commuting"], ["🍔", "Out for Lunch"], ["🎧", "Focusing"]],
  Mood: [["😊", "Feeling Good"], ["😴", "Sleepy"], ["☕", "Need Coffee"], ["🥳", "Celebrating"], ["🧘", "Calm"], ["🤯", "Overloaded"], ["🔥", "On Fire"]],
  Travel: [["✈️", "Flying"], ["🚆", "On a Train"], ["🏖️", "At the Beach"], ["🏔️", "In the Mountains"], ["🚗", "Driving"], ["🏨", "At the Hotel"], ["🗺️", "Exploring"]],
};

type Status = { emoji: string; label: string };

/* sample a damped spring into a CSS linear() easing */
function spring(bounce: number) {
  const z = 0.95 - (bounce / 100) * 0.6;
  const wn = 12;
  const wd = wn * Math.sqrt(1 - z * z);
  const pts: string[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const v = i === 32 ? 1 : 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
    pts.push(v.toFixed(3));
  }
  return `linear(${pts.join(",")})`;
}

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setR(q.matches);
    u();
    q.addEventListener("change", u);
    return () => q.removeEventListener("change", u);
  }, []);
  return r;
}

export function SetStatus({
  set = "Work",
  count = 5,
  buttonLabel = "Set Status",
  showLabel = true,
  bubble = true,
  direction = "Up",
  size = 60,
  gap = 8,
  stagger = 30,
  bounce = 40,
  hoverOpen = false,
  sound = true,
  volume = 70,
  onSound,
}: SetStatusProps) {
  const items = useMemo(() => SETS[set].slice(0, Math.min(7, Math.max(3, count))), [set, count]);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false); // row mounted
  const [open, setOpen] = useState(false); // row animated in
  const [status, setStatus] = useState<Status | null>(null);
  const [last, setLast] = useState<Status | null>(null); // emoji kept while the slot animates out
  const [hi, setHi] = useState<number | null>(null);
  const [fly, setFly] = useState<{ emoji: string; fx: number; fy: number; tx: number; ty: number; fs: number } | null>(null);
  const [live, setLive] = useState("");
  const [bubbleLabel, setBubbleLabel] = useState("");
  const [bubbleW, setBubbleW] = useState(0);
  const [bubbleX, setBubbleX] = useState(0);
  const [snap, setSnap] = useState(false);
  const [labelW, setLabelW] = useState(0);

  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const flyEl = useRef<HTMLSpanElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const bMeasure = useRef<HTMLSpanElement>(null);
  const opts = useRef<(HTMLButtonElement | null)[]>([]);
  const main = useRef<HTMLButtonElement>(null);
  const timers = useRef<{ close?: number; hide?: number; unmount?: number; touch?: number }>({});
  const lastTick = useRef(0);
  const pointerIn = useRef(false);

  const snd = (name: string, v: number, pitch = 1) => {
    if (sound) onSound?.(name, { volume: (volume / 100) * v, pitch });
  };

  const text = status ? (showLabel ? status.label : "") : buttonLabel;

  /* the pill's text width, measured so the pill can animate to it */
  useLayoutEffect(() => {
    setLabelW(measure.current?.offsetWidth ?? 0);
  }, [text]);

  /* the bubble keeps its last label so it can fade out with text in it */
  useLayoutEffect(() => {
    if (hi === null || !items[hi]) return;
    const o = opts.current[hi];
    setBubbleLabel(items[hi][1]);
    setBubbleW((bMeasure.current?.offsetWidth ?? 0));
    if (o) setBubbleX(o.offsetLeft + o.offsetWidth / 2);
  }, [hi, items, size, gap]);
  useLayoutEffect(() => {
    if (bubbleLabel && bMeasure.current) setBubbleW(bMeasure.current.offsetWidth);
  }, [bubbleLabel]);

  /* changing the set clears the status */
  useEffect(() => {
    setStatus(null);
  }, [set]);

  const openRow = () => {
    clearTimeout(timers.current.unmount);
    clearTimeout(timers.current.close);
    if (open) return;
    setShown(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    snd("expand", 0.6);
    const cur = status ? Math.max(0, items.findIndex((i) => i[1] === status.label)) : 0;
    setTimeout(() => {
      if (!root.current?.contains(document.activeElement) && !pointerIn.current) return;
      opts.current[cur]?.focus({ preventScroll: true });
    }, 60);
  };
  const closeRow = (silent = false, refocus = false) => {
    clearTimeout(timers.current.close);
    if (!open && !shown) return;
    setOpen(false);
    setHi(null);
    if (!silent) snd("collapse", 0.5);
    if (refocus) main.current?.focus();
    clearTimeout(timers.current.unmount);
    timers.current.unmount = window.setTimeout(() => setShown(false), 500);
  };
  useEffect(() => () => Object.values(timers.current).forEach((t) => clearTimeout(t)), []);

  /* press outside closes */
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) closeRow();
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  });

  /* Esc, scoped to the block */
  useEffect(() => {
    const scope = root.current?.closest("[data-shortcut-scope]") ?? root.current;
    if (!scope) return;
    const enter = () => (pointerIn.current = true);
    const leave = () => (pointerIn.current = false);
    const key = (e: Event) => {
      const k = e as KeyboardEvent;
      if (k.key === "Escape" && open && (pointerIn.current || root.current?.contains(document.activeElement))) {
        closeRow(false, true);
      }
    };
    scope.addEventListener("pointerenter", enter);
    scope.addEventListener("pointerleave", leave);
    document.addEventListener("keydown", key);
    return () => {
      scope.removeEventListener("pointerenter", enter);
      scope.removeEventListener("pointerleave", leave);
      document.removeEventListener("keydown", key);
    };
  });

  const showBubble = (i: number) => {
    clearTimeout(timers.current.hide);
    if (hi === null) {
      setSnap(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
    } else if (hi !== i) {
      const now = performance.now();
      if (now - lastTick.current > 40) {
        lastTick.current = now;
        snd("tick", 0.35, 0.9 + (0.4 * i) / Math.max(1, items.length - 1));
      }
    }
    setHi(i);
  };
  const hideBubble = () => {
    clearTimeout(timers.current.hide);
    timers.current.hide = window.setTimeout(() => setHi(null), 150);
  };

  const pick = (i: number) => {
    const [emoji, label] = items[i];
    const o = opts.current[i];
    const pr = root.current?.getBoundingClientRect();
    const or = o?.getBoundingClientRect();
    const sr = slot.current?.getBoundingClientRect();
    closeRow(true);
    setStatus({ emoji, label });
    setLast({ emoji, label });
    setLive(`Status set: ${label}`);
    if (reduced || !pr || !or || !sr) {
      snd("pop", 0.8, 0.95 + Math.random() * 0.1);
      return;
    }
    const fs = size * 0.5;
    setFly({
      emoji,
      fs,
      fx: or.left - pr.left + or.width / 2,
      fy: or.top - pr.top + or.height / 2,
      tx: sr.left - pr.left + sr.width / 2,
      ty: sr.top - pr.top + sr.height / 2,
    });
  };

  useEffect(() => {
    const el = flyEl.current;
    if (!fly || !el) return;
    const { fx, fy, tx, ty, fs } = fly;
    const k = 20 / fs;
    const at = (x: number, y: number, r: number, s: number) =>
      `translate(${x - fs / 2}px, ${y - fs / 2}px) rotate(${r}deg) scale(${s})`;
    const a = el.animate(
      [
        { transform: at(fx, fy, 0, 1) },
        { transform: at((fx + tx) / 2, Math.min(fy, ty) - 36, -16, 0.8), offset: 0.5 },
        { transform: at(tx, ty, 10, k * 1.3), offset: 0.85 },
        { transform: at(tx, ty, 0, k) },
      ],
      { duration: 450, easing: "cubic-bezier(.3,.7,.4,1)", fill: "forwards" },
    );
    a.onfinish = () => {
      setFly(null);
      snd("pop", 0.8, 0.95 + Math.random() * 0.1);
      pill.current?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.06, 0.92)", offset: 0.35 }, { transform: "scale(0.98, 1.03)", offset: 0.7 }, { transform: "scale(1)" }],
        { duration: 300, easing: "ease-out" },
      );
    };
    return () => a.cancel();
  }, [fly]);

  const clear = () => {
    setStatus(null);
    setFly(null);
    setLive("Status cleared");
    snd("collapse", 0.5);
  };

  const onOptKey = (e: React.KeyboardEvent, i: number) => {
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (to !== null) {
      e.preventDefault();
      const n = Math.min(items.length - 1, Math.max(0, to));
      opts.current[n]?.focus();
      showBubble(n);
    }
  };

  const mid = (items.length - 1) / 2;
  const maxD = Math.ceil(mid);
  const style = {
    "--sst-size": `${size}px`,
    "--sst-gap": `${gap}px`,
    "--sst-spring": spring(bounce),
    "--sst-glide": spring(bounce * 0.6),
  } as CSSProperties;
  const slotEmoji = status ?? last;
  const isTouch = (e: React.PointerEvent) => e.pointerType !== "mouse";

  return (
    <div
      ref={root}
      className="sst"
      style={style}
      data-open={open || undefined}
      data-dir={direction}
      data-set={status ? "" : undefined}
      onPointerEnter={(e) => {
        if (hoverOpen && !isTouch(e)) openRow();
        clearTimeout(timers.current.close);
      }}
      onPointerLeave={(e) => {
        if (hoverOpen && !isTouch(e)) {
          clearTimeout(timers.current.close);
          timers.current.close = window.setTimeout(() => closeRow(), 300);
        }
      }}
    >
      <div className="sst-pill" ref={pill}>
        <button
          ref={main}
          type="button"
          className="sst-main"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={status ? `Status: ${status.label}` : "Set status"}
          onClick={() => (open ? closeRow() : openRow())}
        >
          <span className="sst-slot" ref={slot} aria-hidden="true">
            <svg className="sst-ring" viewBox="0 0 20 20" width="20" height="20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            </svg>
            <span className="sst-emoji" style={fly ? { visibility: "hidden" } : undefined}>
              {slotEmoji?.emoji}
            </span>
          </span>
          <span className="sst-label" style={{ width: labelW }}>
            <span key={text} className="sst-text">
              {text}
            </span>
          </span>
          <span className="sst-measure" ref={measure} aria-hidden="true">
            {text}
          </span>
        </button>
        <button type="button" className="sst-x" aria-label="Clear status" tabIndex={status ? 0 : -1} onClick={clear}>
          <Icon icon="ph:x-bold" width="12" height="12" />
        </button>
      </div>

      {shown && (
        <div className="sst-rowpos">
          <div
            ref={row}
            className="sst-row"
            role="listbox"
            aria-label="Statuses"
            onPointerLeave={hideBubble}
          >
            {items.map(([emoji, label], i) => {
              const d = Math.abs(i - mid);
              return (
                <button
                  key={set + i}
                  ref={(el) => {
                    opts.current[i] = el;
                  }}
                  type="button"
                  role="option"
                  aria-label={label}
                  aria-selected={status?.label === label}
                  className="sst-opt"
                  tabIndex={i === 0 ? 0 : -1}
                  style={{ "--in": `${d * stagger}ms`, "--out": `${(maxD - d) * stagger}ms` } as CSSProperties}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") showBubble(i);
                  }}
                  onFocus={() => showBubble(i)}
                  onPointerDown={(e) => {
                    if (isTouch(e)) {
                      showBubble(i);
                      clearTimeout(timers.current.touch);
                      timers.current.touch = window.setTimeout(() => setHi(null), 600);
                    }
                  }}
                  onKeyDown={(e) => onOptKey(e, i)}
                  onClick={() => pick(i)}
                >
                  <span className="sst-opt-emoji" aria-hidden="true">
                    {emoji}
                  </span>
                </button>
              );
            })}
            {bubble && (
              <div className="sst-bubble" data-on={hi !== null || undefined} data-snap={snap || undefined} aria-hidden="true">
                <span className="sst-bubble-body" style={{ width: bubbleW + 24, transform: `translateX(${bubbleX}px) translateX(-50%)` }}>
                  <span className="sst-bubble-clip" style={{ width: bubbleW }}>
                    <span key={bubbleLabel} className="sst-bubble-text">
                      {bubbleLabel}
                    </span>
                  </span>
                </span>
                <span className="sst-dot sst-dot-1" style={{ transform: `translateX(${bubbleX}px) translateX(-50%)` }} />
                <span className="sst-dot sst-dot-2" style={{ transform: `translateX(${bubbleX}px) translateX(-50%)` }} />
                <span className="sst-measure" ref={bMeasure}>
                  {bubbleLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {fly && (
        <span ref={flyEl} className="sst-fly" aria-hidden="true" style={{ width: fly.fs, height: fly.fs, fontSize: fly.fs }}>
          {fly.emoji}
        </span>
      )}
      <span className="sst-live" role="status" aria-live="polite">
        {live}
      </span>
    </div>
  );
}
