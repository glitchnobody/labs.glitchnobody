/* ══ OTP input ═════════════════════════════════
   A one-time code field with a box per digit. Type or paste a code: digits pop
   into their boxes, a wrong code shakes and clears, and the right one ripples
   green.

   ── ONE INPUT, MANY BOXES ────────────────────
   The boxes are only drawing. A single transparent <input> spans the row and
   holds the real digits, so typing, paste, the phone's number keyboard and
   one-time-code autofill all work like any other field. Whatever it receives
   is reduced to digits and cut to the length; the caret is kept at the end
   because a code is always filled in order.

   ── THE SLIDING RING ─────────────────────────
   The focus ring is one element moved with a transform to the box that is
   next to fill, so it glides between boxes instead of blinking on and off.
   The empty box under it shows a blinking caret.

   ── VERIFY, THEN PASS OR FAIL ────────────────
   When the last box fills the field locks, a soft highlight sweeps across the
   row, and the digits are compared with the correct code. A wrong code flashes
   the boxes red, shakes the row, then drops the digits out right to left. The
   right code sends a green wave through the boxes, left to right, and shows
   "Verified" before resetting. Every delay is a CSS animation-delay set from
   the box's position, with timers lined up to the same numbers. */

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type OtpInputProps = {
  /** number of boxes, 4 to 8 */
  length?: number;
  /** the code that verifies; repeated or trimmed to `length` */
  code?: string;
  shape?: "Rounded" | "Square" | "Circle";
  /** box width in px */
  size?: number;
  /** wider gap in the middle */
  group?: boolean;
  /** digits turn into dots after 600 ms */
  mask?: boolean;
  /** ms the verify sweep lasts */
  delay?: number;
  /** resend countdown in seconds; 0 hides the line */
  resend?: number;
  onComplete?: (value: string) => void;
  onVerify?: (ok: boolean) => void;
  onResend?: () => void;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

type Phase = "idle" | "verifying" | "wrong" | "clearing" | "right";

const RADIUS = { Rounded: "var(--r-panel)", Square: "var(--r-card)", Circle: "9999px" };
const POP = 40; // ms between pasted digits
const DROP = 30; // ms between digits dropping out
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function OtpInput({
  length = 6,
  code = "424242",
  shape = "Rounded",
  size = 44,
  group = true,
  mask = false,
  delay = 600,
  resend = 30,
  onComplete,
  onVerify,
  onResend,
  sound = true,
  volume = 70,
  onSound,
}: OtpInputProps) {
  const n = Math.min(8, Math.max(4, Math.round(length)));
  const answer = (() => {
    const d = code.replace(/\D/g, "") || "0";
    return d.repeat(Math.ceil(n / d.length)).slice(0, n);
  })();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const lastTick = useRef(0);
  const [value, setValue] = useState("");
  const [from, setFrom] = useState(0); // first digit of the latest cascade
  const [ghost, setGhost] = useState<{ i: number; ch: string; k: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [focus, setFocus] = useState(false);
  const [left, setLeft] = useState(resend);
  const [note, setNote] = useState("");

  const vol = Math.max(0, Math.min(100, volume)) / 100;
  const play = (name: string, v: number, pitch?: number) => {
    if (sound && onSound) onSound(name, { volume: v * vol, pitch });
  };
  const tick = (v: number, pitch: number, at = 0) => {
    const go = () => {
      const t = performance.now();
      if (t - lastTick.current < 30) return;
      lastTick.current = t;
      play("tick", v, pitch);
    };
    if (at) later(go, at);
    else go();
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const reset = () => {
    setValue("");
    setPhase("idle");
    setFrom(0);
    setLeft(resend);
  };
  /* length, code or delay changes start over */
  useEffect(() => {
    clearTimers();
    reset();
    setNote("");
    return clearTimers;
  }, [n, resend]);

  /* resend countdown */
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const verify = (v: string, cascade: number) => {
    setPhase("verifying");
    onComplete?.(v);
    later(() => {
      const ok = v === answer;
      onVerify?.(ok);
      if (ok) {
        setPhase("right");
        setNote("Code verified");
        play("join", 0.5);
        later(() => {
          reset();
          setNote("");
        }, 2500);
      } else {
        setPhase("wrong");
        setNote("Code incorrect");
        play("error", 0.5);
        later(() => {
          setPhase("clearing");
          later(() => {
            setValue("");
            setPhase("idle");
            setFrom(0);
          }, n * DROP + 120);
        }, 400);
      }
    }, delay + cascade);
  };

  const change = (raw: string) => {
    if (phase !== "idle") return;
    const next = raw.replace(/\D/g, "").slice(0, n);
    if (next === value) return;
    if (next.length > value.length) {
      const start = value.length;
      const added = next.length - start;
      setFrom(start);
      for (let i = 0; i < added; i++) tick(0.35, 0.9 + 0.06 * (start + i), i * POP);
      if (next.length === n) verify(next, (added - 1) * POP);
    } else {
      const i = next.length;
      setGhost({ i, ch: value[i], k: Date.now() });
      later(() => setGhost(null), 120);
      tick(0.3, 0.75);
    }
    setValue(next);
  };

  const resendNow = () => {
    play("pop", 0.4);
    clearTimers();
    reset();
    setNote("");
    onResend?.();
    input.current?.focus();
  };

  const ring = Math.min(value.length, n - 1);
  const split = Math.ceil(n / 2);
  const pos = (i: number) => i * (size + 8) + (group && i >= split ? 8 : 0);
  const height = shape === "Circle" ? size : Math.round(size * 1.15);
  const live = phase === "idle";
  const style = {
    "--size": `${size}px`,
    "--h": `${height}px`,
    "--radius": RADIUS[shape],
    "--delay": `${delay}ms`,
    "--ring-x": `${pos(ring)}px`,
  } as CSSProperties;

  return (
    <div className="otp" data-phase={phase} data-mask={mask} data-group={group} style={style}>
      <div className="otp-row">
        {Array.from({ length: n }, (_, i) => {
          const ch = value[i] ?? (ghost?.i === i ? ghost.ch : "");
          const out = !value[i] && ghost?.i === i;
          const dl = Math.max(0, i - from) * POP;
          return (
            <div
              key={i}
              className="otp-box"
              data-filled={!!value[i]}
              data-gap={group && i === split}
              style={{ "--i": i, "--rev": n - 1 - i } as CSSProperties}
            >
              {ch && (
                <span
                  key={out ? `g${ghost!.k}` : `d${value.length > i ? from : ""}-${i}`}
                  className="otp-d"
                  data-out={out}
                  style={{ "--dl": `${out ? 0 : dl}ms` } as CSSProperties}
                >
                  <span className="otp-g">{ch}</span>
                </span>
              )}
              {focus && live && i === value.length && <span className="otp-caret" />}
            </div>
          );
        })}
        <span className="otp-ring" data-on={focus && live} />
        {phase === "verifying" && delay > 0 && (
          <span className="otp-sweep">
            <i />
          </span>
        )}
        <input
          ref={input}
          className="otp-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`Verification code, ${n} digits`}
          value={value}
          readOnly={!live}
          onChange={(e) => change(e.target.value)}
          onClick={(e) => e.currentTarget.focus()} // synthetic clicks (the card demo) do not focus on their own
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onSelect={(e) => {
            const t = e.currentTarget;
            if (t.selectionStart !== value.length || t.selectionEnd !== value.length) t.setSelectionRange(value.length, value.length);
          }}
        />
      </div>
      {resend > 0 && (
        <div className="otp-status">
          {phase === "right" ? (
            <span className="otp-ok">
              <Icon icon="ph:check-circle-fill" width={14} height={14} /> Verified
            </span>
          ) : left > 0 ? (
            <span>Resend code in {clock(left)}</span>
          ) : (
            <button type="button" className="otp-resend" onClick={resendNow}>
              Resend code
            </button>
          )}
        </div>
      )}
      <span id={id} className="otp-live" role="status" aria-live="polite">
        {note}
      </span>
    </div>
  );
}
