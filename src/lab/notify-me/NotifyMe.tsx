/* ══ Notify me ═════════════════════════════════
   A "Notify me" button that opens into an email field. Type an address and
   press Enter: a wrong one shakes, a good one folds into "You're on the list".

   ── ONE PILL, THREE FACES ────────────────────
   There is a single pill, always centred. Its width is the only thing that
   animates: closed, open and done are three widths, and a CSS transition with
   a spring-like linear() curve moves between them, so it grows equally left
   and right. Each face (the button, the field, the confirmation) is
   a layer of the same size as its state; the layers that are not showing
   cross-fade and blur away while the new one blurs in.

   ── CHECKING THE ADDRESS ─────────────────────
   The text is trimmed, then checked with the input's own type="email"
   validity plus a dot in the domain. A bad address shakes the pill with the
   Web Animations API, rings it in red for 1.5 s and shows a hint that the
   input points to with aria-describedby. A good one shows a spinner for a
   simulated 700 ms (nothing is sent) and then the done face.

   ── FOLDING BACK ─────────────────────────────
   Escape or a press outside folds an open field back; what you typed stays
   for the next time. An empty field also folds by itself 2 s after the
   pointer leaves it. The done face returns to the button after 4 s. */

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type NotifyMeProps = {
  /** the button's text */
  label?: string;
  /** text on the done face */
  successText?: string;
  /** called with the address after a valid submit */
  onSubmit?: (email: string) => void;
  /** blur in px while it morphs */
  blur?: number;
  /** 0 to 100 */
  speed?: number;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

type State = "closed" | "open" | "sending" | "done";

const OPEN_W = 260;
const SPRING = "linear(0, 0.38 8%, 0.78 17%, 1.02 29%, 1.07 38%, 1.04 48%, 0.99 60%, 1 75%, 1)";

export function NotifyMe({
  label = "Notify me",
  successText = "You're on the list",
  onSubmit,
  blur = 8,
  speed = 60,
  sound = true,
  volume = 70,
  onSound,
}: NotifyMeProps) {
  const [state, setState] = useState<State>("closed");
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [widths, setWidths] = useState({ closed: 124, done: 170 });
  const pill = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const closedBtn = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const textA = useRef<HTMLSpanElement>(null);
  const textB = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const last = useRef({ tick: 0, bad: 0 });
  const hintId = useId();
  const refocusRef = useRef(false);

  const say = (name: string, base: number, pitch = 1) => {
    if (sound && onSound) onSound(name, { volume: (base * volume) / 100, pitch });
  };
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /* the closed and done faces are as wide as their text; measure it */
  useLayoutEffect(() => {
    const measure = () => {
      const a = textA.current?.offsetWidth ?? 0;
      const b = textB.current?.offsetWidth ?? 0;
      setWidths({ closed: 16 + 15 + 8 + a + 16, done: 16 + 16 + 8 + b + 16 });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [label, successText]);

  const open = () => {
    clearTimers();
    setState("open");
    say("expand", 0.5);
  };
  /* focus moves with the state, not a timer: pointer events clear the timers */
  useEffect(() => {
    if (state === "open") input.current?.focus({ preventScroll: true });
    else if (state === "closed" && refocusRef.current) closedBtn.current?.focus({ preventScroll: true });
    refocusRef.current = false;
  }, [state]);
  const close = (refocus_ = false) => {
    clearTimers();
    setInvalid(false);
    setState("closed");
    say("collapse", 0.5);
    refocusRef.current = refocus_;
  };

  /* an empty field folds by itself once the pointer has left it */
  const leave = () => {
    if (state === "open" && !value) later(() => close(), 2000);
  };
  const enter = () => {
    if (state === "open") clearTimers();
  };

  /* press outside, or Escape, folds an open field */
  useEffect(() => {
    if (state !== "open") return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node) && !pill.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });

  const submit = () => {
    if (state !== "open") return;
    const text = value.trim();
    const el = input.current;
    const domain = text.split("@")[1] ?? "";
    const ok = !!el && el.checkValidity() && text === value.trim() && /.+\..+/.test(domain) && !!text;
    if (!ok) {
      setInvalid(true);
      clearTimers();
      later(() => setInvalid(false), 1500);
      const now = performance.now();
      if (now - last.current.bad > 300) say("collapse", 0.35, 0.8);
      last.current.bad = now;
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        pill.current?.animate(
          [0, -6, 6, -4, 4, 0].map((x) => ({ transform: `translateX(${x}px)` })),
          { duration: 300, easing: "ease-out" },
        );
      el?.focus({ preventScroll: true });
      return;
    }
    clearTimers();
    setInvalid(false);
    setState("sending");
    later(() => {
      setState("done");
      setValue("");
      say("join", 0.55);
      onSubmit?.(text);
      later(() => setState("closed"), 4000);
    }, 700);
  };

  const dur = 900 - speed * 7; // 0 → 900 ms, 100 → 200 ms
  const w = state === "closed" ? widths.closed : state === "done" ? widths.done : OPEN_W;
  const style = {
    "--nm-dur": `${dur}ms`,
    "--nm-blur": `${blur}px`,
    "--nm-w": `${w}px`,
    "--nm-closed": `${widths.closed}px`,
    "--nm-done": `${widths.done}px`,
    "--nm-spring": SPRING,
  } as CSSProperties;
  const face = state === "sending" ? "open" : state;

  return (
    <div className="nm" ref={root} style={style} data-state={state} data-invalid={invalid ? "" : undefined}>
      <span className="nm-measure" aria-hidden="true">
        <span ref={textA}>{label}</span>
        <span ref={textB}>{successText}</span>
      </span>
      <div className="nm-pill" ref={pill} onPointerLeave={leave} onPointerEnter={enter}>
        <button
          type="button"
          ref={closedBtn}
          className="nm-face nm-closed"
          aria-expanded={state !== "closed"}
          aria-label={label}
          tabIndex={face === "closed" ? 0 : -1}
          inert={face !== "closed"}
          onClick={open}
        >
          <Icon icon="ph:bell-fill" width={15} height={15} />
          <span>{label}</span>
        </button>

        <div
          className="nm-face nm-field"
          role="group"
          aria-label={label}
          inert={face !== "open"}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault(); // keeps a modal around the block open
              e.stopPropagation();
              close(true);
            }
          }}
        >
          <input
            ref={input}
            type="email"
            className="nm-input"
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            value={value}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? hintId : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              const now = performance.now();
              if (now - last.current.tick > 30) {
                say("tick", 0.2, 1 + (Math.random() - 0.5) * 0.08);
                last.current.tick = now;
              }
            }}
            onKeyDown={(e) => {
              /* "\n" is what the demo runner's type step sends for Enter */
              if (e.key === "Enter" || e.key === "\n") {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button type="button" className="nm-send" onClick={submit} disabled={state === "sending"}>
            {state === "sending" ? <Icon icon="ph:circle-notch-bold" className="nm-spin" width={14} height={14} /> : "Notify me"}
          </button>
        </div>

        <button
          type="button"
          className="nm-face nm-done"
          tabIndex={face === "done" ? 0 : -1}
          inert={face !== "done"}
          aria-label={successText}
          onClick={() => {
            clearTimers();
            setState("closed");
          }}
        >
          <Icon icon="ph:check-circle-fill" width={16} height={16} />
          <span>{successText}</span>
        </button>
      </div>
      <span className="nm-hint" id={hintId} aria-live="polite">
        {invalid ? "Enter a valid email" : ""}
      </span>
      <span className="nm-sr" role="status">
        {state === "done" ? successText : ""}
      </span>
    </div>
  );
}
