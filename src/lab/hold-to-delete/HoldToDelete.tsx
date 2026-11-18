/* ══ Hold to delete ═════════════════════════════════
   A destructive button that only works if you hold it. Press and hold until
   the colour fill has crossed the whole pill to delete; let go early and it
   drains back with a shake and a hint. Once deleted, the pill splits into a
   "Deleted" chip and an Undo button whose ring counts down the seconds you
   have to change your mind.

   ── ONE CLIPPED COPY ────────────────────────────────
   The pill holds the label twice, in exactly the same place. The top copy has
   the fill colour as its background and white text, and is cut with
   clip-path: inset(0 X 0 0 round R), where X shrinks as the hold goes on. The
   fill and the white text are therefore the same element, so the text turns
   white exactly where the fill covers it, letter by letter, and the rounded
   inset gives the fill a pill-shaped leading edge.

   ── PROGRESS BY FRAME ───────────────────────────────
   A requestAnimationFrame loop adds the elapsed time divided by the hold
   length to a raw clock, then shapes it with the chosen easing (Build-up is
   an ease-in, so pressure seems to build). The result is written straight
   into a CSS variable, with no React render per frame. Letting go runs the
   loop the other way for 300 ms; pressing again inverts the easing to find
   the clock for the current fill, so the hold resumes where the drain is.

   ── SPLIT AND MERGE ─────────────────────────────────
   The widths of both labels and of the Undo button are measured, so the
   pill can animate its width when the label changes and the Undo button can
   grow from zero. The springs are CSS linear() curves. The countdown ring is
   an SVG circle whose dash offset runs out over the undo window; a timer
   ends the window and merges everything back.

   ── SOUND ───────────────────────────────────────────
   While held, a looping hum rises in volume and pitch with the fill and fades
   out the moment you let go or the delete lands. A crunch marks the delete, a
   soft swish an early release, a pop the undo and a falling whoosh the end of
   the window. */

import { Icon } from "@iconify/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type LoopHandle = { stop(fadeMs?: number): void; setPitch(n: number): void; setVolume(n: number): void };
type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => LoopHandle | void;

export type HoldToDeleteProps = {
  label?: string;
  /** text once deleted */
  doneLabel?: string;
  /** seconds to hold */
  hold?: number;
  easing?: "Linear" | "Build-up" | "Ease-out";
  /** seconds Undo is offered */
  undo?: number;
  fill?: "Danger" | "Accent" | "Ink";
  /** corner radius in px; 28 is a full pill */
  radius?: number;
  /** vibrate on delete and early release, where supported */
  haptic?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

/* each easing with its inverse, so a new press can resume from the current fill */
const EASE = {
  Linear: [(t: number) => t, (p: number) => p],
  "Build-up": [(t: number) => t * t, (p: number) => Math.sqrt(p)],
  "Ease-out": [(t: number) => 1 - (1 - t) ** 2, (p: number) => 1 - Math.sqrt(1 - p)],
} as const;

const DRAIN_MS = 300;
const MERGE_MS = 450;
const SPLIT_AFTER = 500;

type State = "idle" | "done" | "split";

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

export function HoldToDelete({
  label = "Delete project",
  doneLabel = "Deleted",
  hold = 1.2,
  easing = "Build-up",
  undo = 5,
  fill = "Danger",
  radius = 28,
  haptic = true,
  sound = true,
  volume = 70,
  onSound,
}: HoldToDeleteProps) {
  const [state, setState] = useState<State>("idle");
  const [held, setHeld] = useState(false);
  const [hint, setHint] = useState(false);
  const [left, setLeft] = useState(undo);
  const [announced, setAnnounced] = useState("");
  const [widths, setWidths] = useState<{ idle: number; done: number; undo: number } | null>(null);
  const reduced = useReducedMotion();

  const root = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const undoBtn = useRef<HTMLButtonElement>(null);
  const idleFace = useRef<HTMLSpanElement>(null);
  const doneFace = useRef<HTMLSpanElement>(null);
  const undoFace = useRef<HTMLSpanElement>(null);

  /* the live values the frame loop and timers read, kept out of render */
  const live = useRef({ hold, easing, undo, haptic, reduced, loud: 0, onSound });
  live.current = { hold, easing, undo, haptic, reduced, loud: sound && onSound ? volume / 100 : 0, onSound };
  const p = useRef(0);
  const mode = useRef<"hold" | "drain" | null>(null);
  const drain = useRef({ from: 0, start: 0, ms: DRAIN_MS });
  const last = useRef(0);
  const raf = useRef(0);
  const charge = useRef<LoopHandle | void>(undefined);
  const timers = useRef<{ split?: number; end?: number; hint?: number; count?: number }>({});
  const stateRef = useRef<State>("idle");
  stateRef.current = state;
  const focusNext = useRef<"undo" | "pill" | null>(null);

  const snd = (name: string, v: number, pitch?: number) => {
    const { loud, onSound } = live.current;
    if (loud) onSound!(name, { volume: v * loud, pitch });
  };

  const setP = (v: number) => {
    p.current = v;
    pill.current?.style.setProperty("--p", String(v));
    const { loud } = live.current;
    charge.current?.setVolume(0.6 * v * loud);
    charge.current?.setPitch(0.8 + 0.8 * v);
  };

  const stopCharge = () => {
    charge.current?.stop(80);
    charge.current = undefined;
  };

  const loop = (now: number) => {
    const dt = (now - last.current) / 1000;
    last.current = now;
    if (mode.current === "hold") {
      const [ease, inv] = EASE[live.current.easing];
      const t = Math.min(1, inv(p.current) + dt / live.current.hold);
      setP(t >= 1 ? 1 : ease(t));
      if (t >= 1) return complete();
    } else if (mode.current === "drain") {
      const { from, start, ms } = drain.current;
      const k = Math.min(1, (now - start) / ms);
      setP(from * (1 - (1 - (1 - k) ** 3)));
      if (k >= 1) mode.current = null;
    }
    if (mode.current) raf.current = requestAnimationFrame(loop);
  };

  const run = () => {
    cancelAnimationFrame(raf.current);
    last.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  };

  const startDrain = (ms: number) => {
    mode.current = "drain";
    drain.current = { from: p.current, start: performance.now(), ms };
    run();
  };

  const focused = () => !!root.current?.contains(document.activeElement);

  const press = () => {
    if (stateRef.current !== "idle" || mode.current === "hold") return;
    mode.current = "hold";
    setHeld(true);
    setHint(false);
    const { loud, onSound } = live.current;
    if (loud) charge.current = onSound!("charge", { loop: true, volume: 0.6 * p.current * loud, pitch: 0.8 + 0.8 * p.current });
    run();
  };

  const release = () => {
    if (mode.current !== "hold") return;
    setHeld(false);
    stopCharge();
    startDrain(DRAIN_MS);
    snd("swipe", 0.35, 0.85);
    if (live.current.haptic) navigator.vibrate?.([10, 40, 10]);
    if (!live.current.reduced)
      root.current?.animate(
        [0, -4, 4, -4, 4, -4, 4, 0].map((x) => ({ transform: `translateX(${x}px)` })),
        { duration: 300, easing: "ease-in-out" },
      );
    setHint(true);
    clearTimeout(timers.current.hint);
    timers.current.hint = window.setTimeout(() => setHint(false), 2000);
  };

  const complete = () => {
    mode.current = null;
    setHeld(false);
    stopCharge();
    snd("crunch", 0.9);
    if (live.current.haptic) navigator.vibrate?.(30);
    setHint(false);
    setState("done");
    const secs = live.current.undo;
    setAnnounced(`Project deleted. Undo available for ${secs} seconds`);
    timers.current.split = window.setTimeout(() => {
      focusNext.current = focused() ? "undo" : null;
      setState("split");
      const ends = performance.now() + secs * 1000;
      setLeft(secs);
      timers.current.count = window.setInterval(() => setLeft(Math.max(0, Math.ceil((ends - performance.now()) / 1000))), 200);
      timers.current.end = window.setTimeout(() => merge("collapse", 0.5, "Undo expired"), secs * 1000);
    }, SPLIT_AFTER);
  };

  const merge = (name: string, v: number, said: string) => {
    clearTimeout(timers.current.end);
    clearInterval(timers.current.count);
    focusNext.current = focused() ? "pill" : null;
    setState("idle");
    snd(name, v);
    setAnnounced(said);
    startDrain(live.current.reduced ? 200 : MERGE_MS);
  };

  /* focus follows the visible control, only if it was already inside */
  useEffect(() => {
    const to = focusNext.current;
    focusNext.current = null;
    if (to === "undo") undoBtn.current?.focus({ preventScroll: true });
    if (to === "pill") pill.current?.focus({ preventScroll: true });
  }, [state]);

  /* the window losing visibility mid-hold counts as letting go */
  useEffect(() => {
    const away = () => document.hidden && release();
    document.addEventListener("visibilitychange", away);
    return () => document.removeEventListener("visibilitychange", away);
  });

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      stopCharge();
      const t = timers.current;
      clearTimeout(t.split);
      clearTimeout(t.end);
      clearTimeout(t.hint);
      clearInterval(t.count);
    },
    [],
  );

  /* measure both labels and the Undo content, again whenever text or font changes */
  useLayoutEffect(() => {
    const els = [idleFace.current!, doneFace.current!, undoFace.current!];
    const measure = () => {
      const [a, b, c] = els.map((el) => el.offsetWidth + 1); // layout width, unaffected by the card's scale; +1 covers rounding
      setWidths({ idle: a, done: b, undo: c });
    };
    measure();
    const ro = new ResizeObserver(measure);
    els.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, []);

  const face = (copy: boolean) => (
    <span className="htd-faces" aria-hidden="true">
      <span ref={copy ? undefined : idleFace} className="htd-face" data-shown={state === "idle" ? "" : undefined}>
        <Icon icon="ph:trash" className="htd-icon" />
        {label}
      </span>
      <span ref={copy ? undefined : doneFace} className="htd-face" data-shown={state !== "idle" ? "" : undefined}>
        <Icon icon="ph:check-bold" className="htd-icon" />
        {doneLabel}
      </span>
    </span>
  );

  const pad = state === "split" ? 36 : 48; // both side paddings: the chip is a little tighter
  const pillW = widths ? (state === "idle" ? widths.idle : widths.done) + pad : undefined;

  return (
    <div
      ref={root}
      className="htd"
      data-state={state}
      data-fill={fill.toLowerCase()}
      data-held={held ? "" : undefined}
      data-measured={widths ? "" : undefined}
      style={
        {
          "--radius": `${radius}px`,
          "--undo": `${undo}s`,
          "--uw": widths ? `${widths.undo + 40}px` : "auto",
        } as CSSProperties
      }
    >
      <button
        ref={pill}
        type="button"
        className="htd-pill"
        aria-label={state === "idle" ? `${label}, hold to confirm` : doneLabel}
        aria-disabled={state !== "idle" || undefined}
        tabIndex={state === "idle" ? 0 : -1}
        style={{ width: pillW }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {} // a pointer the browser does not know (a scripted one) cannot be captured
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onLostPointerCapture={release}
        onBlur={release}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key !== " " && e.key !== "Enter") return;
          e.preventDefault();
          if (!e.repeat) press();
        }}
        onKeyUp={(e) => {
          if (e.key !== " " && e.key !== "Enter") return;
          e.preventDefault();
          release();
        }}
      >
        {face(false)}
        <span className="htd-over">{face(true)}</span>
      </button>
      <button
        ref={undoBtn}
        type="button"
        className="htd-undo"
        aria-label={`Undo delete, ${left} seconds left`}
        aria-hidden={state !== "split" || undefined}
        tabIndex={state === "split" ? 0 : -1}
        onClick={() => stateRef.current === "split" && merge("pop", 0.7, "Delete undone")}
      >
        <span ref={undoFace} className="htd-undo-face">
          <svg className="htd-ring" viewBox="0 0 16 16" aria-hidden="true">
            <circle className="htd-ring-track" cx="8" cy="8" r="6" />
            <circle key={state} className="htd-ring-left" cx="8" cy="8" r="6" pathLength={100} />
          </svg>
          Undo
        </span>
      </button>
      <span className="htd-tip" aria-hidden="true">
        {left}s left
      </span>
      <span className="htd-hint" data-shown={hint ? "" : undefined} aria-hidden="true">
        Hold to delete
      </span>
      <span className="htd-live" aria-live="polite">
        {announced}
      </span>
    </div>
  );
}
