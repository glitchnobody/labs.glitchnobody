/* ══ Staggered countdown ═════════════════════════════
   A big number whose digits roll like an odometer, one after another, when
   the value changes. Press it to count down; at zero, press again to roll
   back up to the start. Arrow keys count down and up while it has focus.

   ── A STRIP PER DIGIT ────────────────────────────────
   Each digit is a window one digit tall over a vertical strip of the digits
   0 to 9, repeated five times. Changing the digit moves the strip with a CSS
   transform, so it rolls through every digit in between. Counting down always
   moves the strip down and counting up always moves it up, wrapping into the
   next copy of 0 to 9 instead of rolling back the long way. When the number
   settles, each strip is quietly moved to the same digit in the middle copy,
   with transitions off, so there is always room to roll either way.

   ── THE STAGGER ──────────────────────────────────────
   Every digit gets its own transition-delay: its place in the order (from the
   right, the left or the centre) times the stagger. Because these are plain
   CSS transitions, a new value in the middle of a roll simply retargets each
   strip from wherever it is, with no jump.

   ── GROWING AND SHRINKING ────────────────────────────
   There is always a slot for every digit the number can have. A slot the
   number does not need rolls to 0, fades, and collapses its width to nothing,
   so 1,000 becoming 999 slides together and stays centred. The width of one
   digit is measured once from the font, so the collapse is exact.

   ── SOUND AND TIMING ─────────────────────────────────
   Timers matching each delay plus the roll length call onSound: a tick as
   each changed digit lands, rising in pitch along the order. A screen reader
   hears the new value once, when the last digit lands, not every digit. */

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type StaggeredCountdownProps = {
  /** the number it starts at and resets to */
  value?: number;
  /** how far each press goes; "Random" drops 1–15% of the current value */
  drop?: "Random" | "1" | "10" | "100" | "1,000";
  prefix?: string;
  suffix?: string;
  /** prefix and suffix in the accent colour */
  accent?: boolean;
  separator?: "None" | "Comma" | "Dot" | "Space";
  /** digits after the decimal mark, 0 to 2 */
  decimals?: number;
  /** which digit moves first */
  direction?: "Right" | "Left" | "Centre";
  /** ms between one digit and the next */
  stagger?: number;
  /** ms each digit rolls */
  duration?: number;
  easing?: "Smooth" | "Overshoot" | "Linear";
  blur?: boolean;
  /** type size in px */
  size?: number;
  weight?: "Light" | "Regular" | "Medium";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const EASE = {
  Smooth: "cubic-bezier(.2,.7,.2,1)",
  Overshoot: "cubic-bezier(.34,1.56,.64,1)",
  Linear: "linear",
};
const WEIGHT = { Light: 300, Regular: 400, Medium: 500 };
const MARK = { None: "", Comma: ",", Dot: ".", Space: " " };

const COPIES = 5; // copies of 0–9 in each strip
const HOME = 20; // the middle copy, where strips rest
const CELLS = Array.from({ length: COPIES * 10 }, (_, i) => <span key={i}>{i % 10}</span>);

/* slots for the integer digits, keyed by place (0 = ones) so a digit keeps its slot */
const intKey = (place: number) => `i${place}`;
const fracKey = (k: number) => `f${k}`;
const digitsOf = (units: number, decimals: number) => {
  const all = String(units).padStart(decimals + 1, "0");
  return { int: all.slice(0, all.length - decimals), frac: all.slice(all.length - decimals) };
};

type Roll = {
  units: number;
  /* strip position per slot key: the cell index the window shows */
  pos: Record<string, number>;
  /* how many integer slots were in play (shown before or after), for the stagger order */
  span: number;
  /* bumps on every change, so effects know to schedule sounds */
  seq: number;
};

/* move every strip to `units`: down when the value fell, up when it rose */
function rollTo(prev: Roll, units: number, decimals: number, slots: number): Roll {
  if (units === prev.units && prev.seq >= 0) return prev;
  const from = digitsOf(prev.units, decimals);
  const to = digitsOf(units, decimals);
  const down = units < prev.units;
  slots = Math.max(slots, to.int.length);
  const pos: Record<string, number> = {};
  const target = (key: string, digit: number) => {
    const at = prev.pos[key] ?? HOME;
    const step = down ? -((((at % 10) - digit) + 10) % 10) : (digit - (at % 10) + 10) % 10;
    let next = at + step;
    if (next < 0 || next >= COPIES * 10) next = HOME + digit; // only after many interrupted rolls
    pos[key] = next;
  };
  for (let place = 0; place < slots; place++) {
    const d = to.int[to.int.length - 1 - place];
    target(intKey(place), d === undefined ? 0 : Number(d)); // a slot the number does not need rests on 0
  }
  for (let k = 0; k < decimals; k++) target(fracKey(k), Number(to.frac[k]));
  return { units, pos, span: Math.max(from.int.length, to.int.length), seq: prev.seq + 1 };
}

function rest(units: number, decimals: number, slots: number): Roll {
  return rollTo({ units, pos: {}, span: 0, seq: -1 }, units, decimals, slots);
}

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

export function StaggeredCountdown({
  value = 987654,
  drop = "Random",
  prefix = "",
  suffix = "$",
  accent = true,
  separator = "None",
  decimals = 0,
  direction = "Right",
  stagger = 40,
  duration = 600,
  easing = "Overshoot",
  blur = true,
  size = 40,
  weight = "Medium",
  sound = true,
  volume = 70,
  onSound,
}: StaggeredCountdownProps) {
  const scale = 10 ** decimals;
  const start = Math.max(0, Math.round(value * scale));
  const [roll, setRoll] = useState(() => rest(start, decimals, String(Math.floor(start / scale)).length));
  const [snap, setSnap] = useState(false);
  const [announced, setAnnounced] = useState("");
  const reduced = useReducedMotion();

  const root = useRef<HTMLButtonElement>(null);
  const sizer = useRef<HTMLSpanElement>(null);
  const slotEls = useRef<Record<string, HTMLElement | null>>({});
  const timers = useRef<number[]>([]);
  const lastTick = useRef(0);
  const [width, setWidth] = useState<{ digit: number; mark: number } | null>(null);
  const filter = `sc-blur-${useId().replace(/[^\w-]/g, "")}`;

  const { int, frac } = digitsOf(roll.units, decimals);
  /* one slot per digit the number can reach: the start value, or more if counted up past it */
  const slots = Math.max(String(Math.floor(start / scale)).length, int.length);
  const mark = MARK[separator];
  const point = separator === "Comma" ? "." : separator === "Dot" ? "," : ".";
  const go = (units: number) => setRoll((r) => rollTo(r, Math.max(0, units), decimals, slots));
  /* one press: a fixed step, or 1–15% of the current value */
  const step = () =>
    drop === "Random" ? Math.max(1, Math.round(roll.units * (0.01 + Math.random() * 0.14))) : Number(drop.replace(",", "")) * scale;

  /* a new start value (or decimals) from outside rolls to it */
  useEffect(() => {
    go(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, decimals]);

  /* measure one tabular digit and one grouping mark, again whenever the font or size changes */
  useEffect(() => {
    const el = sizer.current!;
    const measure = () => {
      const [d, m] = el.children;
      setWidth({ digit: d.getBoundingClientRect().width, mark: m.getBoundingClientRect().width });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* the order digits move in, and when each one lands */
  const order = (() => {
    const keys = [
      ...Array.from({ length: roll.span }, (_, i) => intKey(roll.span - 1 - i)),
      ...Array.from({ length: decimals }, (_, k) => fracKey(k)),
    ];
    const n = keys.length;
    const gap = reduced ? stagger / 3 : stagger;
    return Object.fromEntries(
      keys.map((key, i) => {
        const rank = direction === "Left" ? i : direction === "Right" ? n - 1 - i : Math.floor(Math.abs(i - (n - 1) / 2));
        return [key, { rank, delay: rank * gap }];
      }),
    );
  })();
  const roll_ms = reduced ? 150 : duration;

  /* on every change: blur while moving, a tick as each changed digit lands */
  const prev = useRef(roll);
  useEffect(() => {
    const before = prev.current;
    prev.current = roll;
    if (roll.seq === before.seq || roll.seq === 0) return;
    /* a new value mid-roll replaces the old schedule: its ticks and blur */
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    for (const el of Object.values(slotEls.current)) el?.removeAttribute("data-moving");
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    const loud = sound && onSound ? volume / 100 : 0;
    let end = 0;
    let moved = 0;

    for (const [key, { rank, delay }] of Object.entries(order)) {
      if (before.pos[key] % 10 === roll.pos[key] % 10) continue; // unchanged digits keep their place in the order, silently
      moved++;
      const el = slotEls.current[key];
      const lands = delay + roll_ms;
      end = Math.max(end, lands);
      later(delay, () => el?.setAttribute("data-moving", ""));
      later(delay + roll_ms * (reduced ? 1 : 0.8), () => el?.removeAttribute("data-moving"));
      later(lands, () => {
        const now = performance.now();
        if (!loud || now - lastTick.current < 25) return;
        lastTick.current = now;
        onSound!("tick", { volume: 0.6 * loud, pitch: 1 + 0.04 * rank });
      });
    }
    if (!moved) return;
    later(end + 20, () => {
      setAnnounced(label);
      /* park every strip on the middle copy, with transitions off, so the next roll has room */
      setRoll((r) => ({ ...r, pos: Object.fromEntries(Object.entries(r.pos).map(([k, p]) => [k, HOME + (p % 10)])) }));
      setSnap(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll.seq]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* read layout while transitions are off, so the parked strips do not animate, then turn them back on */
  useLayoutEffect(() => {
    if (!snap) return;
    void root.current?.offsetWidth;
    setSnap(false);
  }, [snap]);

  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, mark) + (decimals ? point + frac : "");
  const label = `${prefix}${formatted}${suffix}`;

  const press = () => {
    go(roll.units === 0 ? start : roll.units - step());
  };

  const slot = (key: string, shown: boolean) => {
    const delay = order[key]?.delay ?? 0;
    return (
      <span
        key={key}
        ref={(el) => {
          slotEls.current[key] = el;
        }}
        className="sc-slot"
        data-blank={shown ? undefined : ""}
        style={{ "--pos": roll.pos[key] ?? HOME, "--delay": `${delay}ms` } as CSSProperties}
      >
        <span className="sc-strip">{CELLS}</span>
      </span>
    );
  };

  const parts = [];
  for (let place = slots - 1; place >= 0; place--) {
    const shown = place < int.length;
    parts.push(slot(intKey(place), shown));
    if (mark && place > 0 && place % 3 === 0)
      parts.push(
        <span key={`s${place}`} className="sc-mark" data-blank={shown ? undefined : ""}>
          {mark}
        </span>,
      );
  }
  if (decimals) {
    parts.push(<span key="point" className="sc-mark sc-point">{point}</span>);
    for (let k = 0; k < decimals; k++) parts.push(slot(fracKey(k), true));
  }

  return (
    <button
      ref={root}
      type="button"
      className="sc"
      data-accent={accent ? "" : undefined}
      data-blur={blur ? "" : undefined}
      data-snap={snap ? "" : undefined}
      aria-label={`Count down, now ${label}`}
      onClick={press}
      onKeyDown={(e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        go(roll.units + (e.key === "ArrowUp" ? step() : -step()));
      }}
      style={
        {
          "--size": `${size}px`,
          "--weight": WEIGHT[weight],
          "--roll": `${duration}ms`,
          "--roll-ease": EASE[easing],
          "--digit": width ? `${width.digit}px` : "0.6em",
          "--mark": width ? `${width.mark}px` : "0.3em",
          "--blur": `url(#${filter})`,
        } as CSSProperties
      }
    >
      <svg className="sc-defs" aria-hidden="true">
        <filter id={filter}>
          <feGaussianBlur stdDeviation={`0 ${Math.max(1, size * 0.04)}`} />
        </filter>
      </svg>
      <span ref={sizer} className="sc-sizer" aria-hidden="true">
        <span>0</span>
        <span>{mark || ","}</span>
      </span>
      {prefix && <span className="sc-affix">{prefix}</span>}
      <span className="sc-digits" aria-hidden="true">
        {parts}
      </span>
      {suffix && <span className="sc-affix">{suffix}</span>}
      <span className="sc-live" aria-live="polite">
        {announced}
      </span>
    </button>
  );
}
