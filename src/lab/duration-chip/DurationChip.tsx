/* ══ Duration chip ═════════════════════════════════
   A duration shown as one small chip, "2 Hr. 30 Min.". Press the pencil and the
   chip splits into one editable pill per unit plus a tick pill; type new
   numbers and confirm to fold them back into a single chip.

   ── SPLITTING WITH SHARED LAYOUT IDS ─────────────────
   The compact chip and the editing pills render the same numbers and labels
   under the same layoutIds. motion measures both layouts and animates every
   number and label from its place in the chip to its place in its pill, and
   back. The chip's background shares an id with the first pill, so it appears
   to divide; the other pills and the tick fade in.

   ── TYPING ───────────────────────────────────────────
   Each pill holds a numeric input that accepts digits only: 2 for minutes and
   seconds, 3 for hours. A key that is not a digit, or that would pass the
   limit, is dropped and the pill shakes. On confirm, empty becomes 0 and
   minutes and seconds clamp to 59. Pasting "1:45" fills hours and minutes.

   ── CONFIRM, CANCEL, BLUR ────────────────────────────
   The tick button, Enter, or a press outside confirms; Escape cancels and keeps
   the old value. Focus returns to the chip, and a live region announces the
   saved duration. With reduced motion the layout animation is skipped. */

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { LazyMotion, MotionConfig, domMax, m } from "motion/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;
type Unit = "hours" | "minutes" | "seconds";
export type Duration = { hours: number; minutes: number; seconds: number };

export type DurationChipProps = {
  value?: Duration;
  onChange?: (d: Duration) => void;
  units?: "Hr + Min" | "Min + Sec" | "Hr + Min + Sec";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const SETS: Record<string, Unit[]> = {
  "Hr + Min": ["hours", "minutes"],
  "Min + Sec": ["minutes", "seconds"],
  "Hr + Min + Sec": ["hours", "minutes", "seconds"],
};
const LABEL: Record<Unit, string> = { hours: "Hr.", minutes: "Min.", seconds: "Sec." };
const NAME: Record<Unit, string> = { hours: "Hours", minutes: "Minutes", seconds: "Seconds" };
const MAXLEN: Record<Unit, number> = { hours: 3, minutes: 2, seconds: 2 };
const MAX: Record<Unit, number> = { hours: 999, minutes: 59, seconds: 59 };
const DEFAULT: Duration = { hours: 2, minutes: 30, seconds: 0 };

export function DurationChip({
  value = DEFAULT,
  onChange,
  units = "Hr + Min",
  sound = true,
  volume = 70,
  onSound,
}: DurationChipProps) {
  const set = SETS[units] ?? SETS["Hr + Min"];
  const [dur, setDur] = useState<Duration>(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<Unit, string>>({ hours: "", minutes: "", seconds: "" });
  const [shake, setShake] = useState<{ u: Unit; n: number } | null>(null);
  const [said, setSaid] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const inputs = useRef<Partial<Record<Unit, HTMLInputElement | null>>>({});
  const lastTick = useRef(0);
  const refocus = useRef(false);
  const dk = value.hours + "," + value.minutes + "," + value.seconds;

  useEffect(() => setDur(value), [dk]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = (name: string, vol: number, pitch?: number) => {
    if (sound && onSound) onSound(name, { volume: (vol * volume) / 100, pitch });
  };

  const open = () => {
    setDraft({ hours: String(dur.hours), minutes: String(dur.minutes), seconds: String(dur.seconds) });
    setEditing(true);
    play("expand", 0.45);
  };

  useEffect(() => {
    if (editing) {
      const el = inputs.current[set[0]];
      el?.focus();
      el?.select();
    } else if (refocus.current) {
      refocus.current = false;
      chip.current?.focus();
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = (focusChip = true) => {
    const next = { ...dur };
    for (const u of set) next[u] = Math.min(MAX[u], parseInt(draft[u], 10) || 0);
    refocus.current = focusChip;
    setDur(next);
    setEditing(false);
    onChange?.(next);
    setSaid(`Saved ${set.map((u) => `${next[u]} ${NAME[u].toLowerCase()}`).join(" ")}`);
  };
  const cancel = () => {
    refocus.current = true;
    setEditing(false);
    play("collapse", 0.4);
  };

  // A press outside the pills confirms, keeping the edits.
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;
  useEffect(() => {
    if (!editing) return;
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) confirmRef.current(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [editing]);

  const reject = (u: Unit) => setShake((s) => ({ u, n: (s?.n ?? 0) + 1 }));

  const type = (u: Unit, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const ok = digits === raw && digits.length <= MAXLEN[u];
    if (!ok) reject(u);
    const next = digits.slice(0, MAXLEN[u]);
    if (next !== draft[u] && ok) {
      const now = performance.now();
      if (now - lastTick.current > 30) {
        lastTick.current = now;
        play("tick", 0.3);
      }
    }
    setDraft((d) => ({ ...d, [u]: next }));
  };

  const paste = (u: Unit, e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData("text").trim().match(/^(\d+):(\d+)$/);
    if (!t) return;
    e.preventDefault();
    const i = set.indexOf(u);
    if (i < 0 || i + 1 >= set.length) return;
    setDraft((d) => ({ ...d, [u]: t[1].slice(0, MAXLEN[u]), [set[i + 1]]: t[2].slice(0, MAXLEN[set[i + 1]]) }));
  };

  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); confirm(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  };

  const spring = { type: "spring" as const, stiffness: 420, damping: 36 };

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={spring}>
        <div className="dch" ref={root} data-editing={editing ? "" : undefined}>
          {!editing ? (
            <m.button
              ref={chip}
              type="button"
              className="dch-pill dch-chip"
              layoutId="dch-bg-0"
              style={{ borderRadius: 10 }}
              onClick={open}
              aria-label={`Edit duration, ${set.map((u) => `${dur[u]} ${NAME[u].toLowerCase()}`).join(" ")}`}
            >
              {set.map((u) => (
                <span className="dch-part" key={u}>
                  <m.span layoutId={`dch-n-${u}`} className="dch-num">{dur[u]}</m.span>
                  <m.span layoutId={`dch-l-${u}`} className="dch-unit">{LABEL[u]}</m.span>
                </span>
              ))}
              <m.span layoutId="dch-icon" className="dch-icon"><Icon icon="ph:pencil-simple-fill" width={14} /></m.span>
            </m.button>
          ) : (
            <>
              {set.map((u, i) => (
                <m.div
                  key={u}
                  className="dch-pill dch-field"
                  layoutId={`dch-bg-${i}`}
                  style={{ borderRadius: 10 }}
                  onClick={() => { const el = inputs.current[u]; el?.focus(); el?.select(); }}
                >
                  <m.span
                    key={shake?.u === u ? shake.n : 0}
                    className="dch-shake"
                    animate={shake?.u === u && shake.n ? { x: [0, -3, 3, -2, 0] } : undefined}
                    transition={{ duration: 0.25 }}
                  >
                    <m.span layoutId={`dch-n-${u}`} className="dch-num">
                      <input
                        ref={(el) => { inputs.current[u] = el; }}
                        className="dch-input"
                        inputMode="numeric"
                        aria-label={NAME[u]}
                        value={draft[u]}
                        onChange={(e) => type(u, e.target.value)}
                        onClick={(e) => { e.currentTarget.focus(); e.currentTarget.select(); }}
                        onPaste={(e) => paste(u, e)}
                        onKeyDown={key}
                        style={{ width: `${MAXLEN[u] + 0.5}ch` }}
                      />
                    </m.span>
                  </m.span>
                  <m.span layoutId={`dch-l-${u}`} className="dch-unit">{LABEL[u]}</m.span>
                </m.div>
              ))}
              <m.button
                type="button"
                className="dch-pill dch-save"
                layoutId="dch-bg-save"
                style={{ borderRadius: 10 }}
                onClick={() => confirm()}
                aria-label="Save duration"
              >
                <m.span layoutId="dch-icon" className="dch-icon dch-icon-on"><Icon icon="ph:check-bold" width={14} /></m.span>
              </m.button>
            </>
          )}
          <span className="dch-sr" role="status" aria-live="polite">{said}</span>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
