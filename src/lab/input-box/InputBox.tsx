/* ══ Input box ═════════════════════════════════
   A username field with a floating label and live checks. Focus it and the
   border draws itself around the box; type and the rules tick off one by one
   while a ring counts your characters.

   ── THE DRAWN RING ───────────────────────────
   The focus ring is an SVG rounded-rectangle path that starts at the right end
   of the floated label and runs clockwise back to its left end. The path has
   pathLength="1", so one dash of length 1 can be hidden and revealed with a
   single stroke-dashoffset transition, whatever the size or corner radius.
   Blur reverses it, in half the time.

   ── THE FLOATING LABEL ───────────────────────
   The label is a slab-coloured chip over the top border. At rest it sits inside
   the field; on focus or with text it scales down and moves up onto the border,
   and its measured width sets the gap the ring leaves open.

   ── RULES AND AVAILABILITY ───────────────────
   Every rule is a pure test of the current text, re-run on each input. A rule
   that newly passes ticks. Once the first three pass and typing pauses for
   500 ms, a simulated 600 ms check looks the name up in a small taken list;
   editing cancels it. */

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type InputBoxProps = {
  /** floating label */
  label?: string;
  /** character limit */
  max?: number;
  size?: "Small" | "Medium" | "Large";
  /** field width in px */
  width?: number;
  /** corner in px */
  radius?: number;
  /** ms the focus ring takes to draw */
  ring?: number;
  /** show the rules list */
  rules?: boolean;
  /** show the character ring */
  counter?: boolean;
  /** simulate an availability check */
  check?: boolean;
  /** names that count as taken, besides the built-in few */
  taken?: string[];
  onChange?: (value: string) => void;
  onValid?: (valid: boolean) => void;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const HEIGHT = { Small: 36, Medium: 44, Large: 52 };
const TAKEN = ["admin", "root", "glitch", "nobody", "jonas", "mira", "user"];
const SCALE = 6 / 7; // 14 px label floats to 12 px
const CHECK_WAIT = 500;
const CHECK_TIME = 600;

type Avail = "idle" | "checking" | "available" | "taken";

export function InputBox({
  label = "Username",
  max = 16,
  size = "Medium",
  width = 280,
  radius = 6,
  ring = 450,
  rules = true,
  counter = true,
  check = true,
  taken = [],
  onChange,
  onValid,
  sound = true,
  volume = 70,
  onSound,
}: InputBoxProps) {
  const limit = Math.min(32, Math.max(8, Math.round(max)));
  const h = HEIGHT[size] ?? 44;
  const w = Math.max(160, width);
  const r = Math.max(0, Math.min(radius, h / 2));
  const gx0 = Math.max(10, r + 2);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const chip = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const prevMet = useRef<boolean[]>([false, false, false]);
  const [value, setValue] = useState("");
  const [focus, setFocus] = useState(false);
  const [gap, setGap] = useState(60);
  const [avail, setAvail] = useState<Avail>("idle");
  const [suggest, setSuggest] = useState("");
  const [shake, setShake] = useState(0);
  const [fading, setFading] = useState(false);
  const [note, setNote] = useState("");

  const vol = Math.max(0, Math.min(100, volume)) / 100;
  const play = (name: string, v: number, pitch?: number) => {
    if (sound && onSound) onSound(name, { volume: v * vol, pitch });
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const stopCheck = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stopCheck, []);

  /* the gap in the ring is the floated label's width */
  useLayoutEffect(() => {
    const measure = () => chip.current && setGap(chip.current.offsetWidth * SCALE);
    measure();
    document.fonts?.ready.then(measure);
  }, [label, size]);

  /* rules */
  const len = value.length;
  const met = [len >= 3 && len <= limit, len > 0 && /^\w+$/.test(value) && !/[^A-Za-z0-9_]/.test(value), /^[A-Za-z]/.test(value)];
  const broken = [false, len > 0 && !met[1], len > 0 && !met[2]];
  const basic = met.every(Boolean);
  const names = [...TAKEN, ...taken].map((t) => t.toLowerCase());
  const valid = basic && (!check || avail === "available");

  /* tick each rule that newly passes, staggered so the 60 ms rate limit holds */
  useEffect(() => {
    met.forEach((m, i) => {
      if (m && !prevMet.current[i]) {
        const k = prevMet.current.slice(0, i).filter((p, j) => !p && met[j]).length;
        window.setTimeout(() => play("tick", 0.35, 1.05 + 0.1 * i), k * 60);
      }
    });
    prevMet.current = met;
  }, [met[0], met[1], met[2]]);

  /* availability */
  useEffect(() => {
    stopCheck();
    setAvail("idle");
    if (!check || !basic) return;
    later(() => {
      setAvail("checking");
      later(() => {
        const v = value.toLowerCase();
        if (names.includes(v)) {
          let n = 2;
          while (names.includes(`${v}${n}`)) n++;
          setSuggest(`${value}${n}`);
          setAvail("taken");
          setNote(`${label} taken`);
          play("error", 0.4);
        } else {
          setAvail("available");
          setNote(`${label} available`);
          play("pop", 0.4);
        }
      }, CHECK_TIME);
    }, CHECK_WAIT);
  }, [value, check, basic, taken.join(",")]);

  useEffect(() => {
    onValid?.(valid);
  }, [valid]);

  const set = (v: string) => {
    setValue(v);
    setNote("");
    onChange?.(v);
  };
  const jolt = () => setShake((s) => s + 1);

  const clear = () => {
    if (!value || fading) return;
    play("swipe", 0.35);
    setFading(true);
    later(() => {
      set("");
      setFading(false);
    }, 120);
    input.current?.focus();
  };

  const floated = focus || value.length > 0;
  const remaining = limit - len;
  const frac = Math.min(1, len / limit);
  const C = 2 * Math.PI * 7;

  /* ring path: from the label gap's right end clockwise round to its left end */
  const p = 0.5;
  const rr = Math.max(0, r - p);
  const x0 = gx0;
  const x1 = Math.min(gx0 + gap, w - rr - 4);
  const d = `M${x1} ${p}H${w - p - rr}A${rr} ${rr} 0 0 1 ${w - p} ${p + rr}V${h - p - rr}A${rr} ${rr} 0 0 1 ${w - p - rr} ${h - p}H${p + rr}A${rr} ${rr} 0 0 1 ${p} ${h - p - rr}V${p + rr}A${rr} ${rr} 0 0 1 ${p + rr} ${p}H${x0}`;

  const style = {
    "--w": `${w}px`,
    "--h": `${h}px`,
    "--r": `${r}px`,
    "--px": `${gx0 + 4}px`,
    "--gx": `${gx0 - 1}px`,
    "--ring": `${ring}ms`,
    "--fs": size === "Large" ? "16px" : "14px",
  } as CSSProperties;

  const rows = [
    { ok: met[0], bad: broken[0], text: `3 to ${limit} characters` },
    { ok: met[1], bad: broken[1], text: "Letters, numbers and underscores" },
    { ok: met[2], bad: broken[2], text: "Starts with a letter" },
    ...(check
      ? [
          {
            ok: avail === "available",
            bad: avail === "taken",
            text: avail === "checking" ? "Checking…" : avail === "taken" ? `Taken: try ${suggest}` : "Available",
          },
        ]
      : []),
  ];
  const invalid = rows.some((x) => x.bad);

  return (
    <div className="ibx" style={style} data-focus={focus} data-floated={floated}>
      <div
        className="ibx-field"
        data-invalid={invalid}
        onPointerDown={(e) => {
          if (e.target !== input.current) e.preventDefault(); // keep focus while pressing the clear button
        }}
        onClick={() => input.current?.focus()}
      >
        <svg className="ibx-ring" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
          <path d={d} pathLength={1} data-on={focus} />
        </svg>
        <span className="ibx-label" ref={chip} data-up={floated} data-focus={focus}>
          {label}
        </span>
        <input
          ref={input}
          className="ibx-input"
          data-fading={fading}
          type="text"
          value={value}
          maxLength={limit}
          autoComplete="username"
          spellCheck={false}
          aria-label={label}
          aria-invalid={invalid}
          aria-describedby={rules ? id : undefined}
          onChange={(e) => set(e.target.value)}
          onClick={(e) => e.currentTarget.focus()} // synthetic clicks (the card demo) do not focus on their own
          onFocus={() => {
            setFocus(true);
            play("tick", 0.3, 0.8);
          }}
          onBlur={() => setFocus(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              clear();
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && len >= limit && e.currentTarget.selectionStart === e.currentTarget.selectionEnd) jolt();
          }}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text");
            if (len + t.length > limit) jolt();
          }}
        />
        <span className="ibx-side">
          {avail === "checking" && <Icon className="ibx-spin" icon="ph:spinner-gap" width={14} height={14} />}
          {avail === "available" && <Icon className="ibx-ok" icon="ph:check-circle-fill" width={14} height={14} />}
          {avail === "taken" && <Icon className="ibx-bad" icon="ph:warning-circle-fill" width={14} height={14} />}
          {counter && (
            <span key={shake} className="ibx-count" data-shake={shake > 0} data-full={len >= limit}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <circle className="ibx-track" cx="9" cy="9" r="7" />
                <circle className="ibx-arc" cx="9" cy="9" r="7" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
              </svg>
              {remaining <= 3 && len > 0 && <b>{remaining}</b>}
            </span>
          )}
          {value && (
            <button type="button" className="ibx-clear" aria-label="Clear" tabIndex={-1} onClick={clear}>
              <Icon icon="ph:x-circle-fill" width={16} height={16} />
            </button>
          )}
        </span>
      </div>
      {rules && (
        <ul className="ibx-rules" id={id}>
          {rows.map((row, i) => (
            <li key={i} data-state={row.ok ? "ok" : row.bad ? "bad" : "idle"}>
              <span className="ibx-dot">
                {row.ok && <Icon key="ok" icon="ph:check-bold" width={12} height={12} />}
                {row.bad && <Icon key="bad" icon="ph:x-bold" width={12} height={12} />}
              </span>
              {row.text}
            </li>
          ))}
        </ul>
      )}
      <span className="ibx-live" role="status" aria-live="polite">
        {note}
      </span>
    </div>
  );
}
