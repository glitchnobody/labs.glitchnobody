/* ══ Meeting picker ═══════════════════════════════════
   A calendar with time slots for booking a meeting. Pick a day and the slot
   column refreshes; pick a time and the sentence at the bottom rolls only
   the words that changed. Continue folds the whole panel into a small
   confirmation card, and Change unfolds it again with the choice kept.

   ── REAL DATES ───────────────────────────────────────
   The calendar opens on the current month with today marked. A few days
   per month are unavailable, picked by a random generator seeded with the
   year and month, so the same days are blocked every time you look. Slots
   run from the first slot to the end of the day at the chosen interval,
   only where the whole meeting fits, and a few seeded slots are hidden as
   already taken.

   ── ONE HIGHLIGHT EACH ───────────────────────────────
   The selected day and the selected slot each sit on a single highlight
   element that is moved with a transform, so it slides from the old choice
   to the new one instead of appearing in place.

   ── ROLLING WORDS ────────────────────────────────────
   Each changeable word of the sentence lives in a clipped box. When it
   changes, the old word slides up and out while the new one slides up in,
   a little after the word before it, so a new date ripples left to right.

   ── THE FOLD ─────────────────────────────────────────
   The panel's size follows its content through a ResizeObserver and a CSS
   size transition. Continue swaps the content for the confirmation card,
   so the panel shrinks around it while the card fades in. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";

export type MeetingPickerProps = {
  layout?: "Side by side" | "Stacked";
  interval?: "15 min" | "30 min" | "60 min";
  length?: "15 min" | "30 min" | "45 min" | "60 min";
  dayStart?: number;
  dayEnd?: number;
  clock?: "24-hour" | "12-hour";
  weekStart?: "Sunday" | "Monday";
  unavailable?: number;
  weekendsOff?: boolean;
  radius?: number;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayKey = (d: Date) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
const same = (a: Date | null, b: Date | null) => !!a && !!b && dayKey(a) === dayKey(b);
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const mins = (s: string) => parseInt(s, 10);

function Roll({ text, i }: { text: string; i: number }) {
  const [state, setState] = useState({ cur: text, old: null as string | null, n: 0 });
  useEffect(() => { setState((s) => (s.cur === text ? s : { cur: text, old: s.cur, n: s.n + 1 })); }, [text]);
  return (
    <span className="mtp-roll" style={{ "--d": `${i * 30}ms` } as CSSProperties}>
      {state.old !== null && <span key={`o${state.n}`} className="mtp-out" aria-hidden onAnimationEnd={() => setState((s) => ({ ...s, old: null }))}>{state.old}</span>}
      <span key={`n${state.n}`} className={state.n ? "mtp-in" : undefined}>{state.cur}</span>
    </span>
  );
}

export function MeetingPicker({
  layout = "Side by side", interval = "15 min", length = "30 min", dayStart = 9, dayEnd = 17, clock = "24-hour",
  weekStart = "Sunday", unavailable = 3, weekendsOff = false, radius = 10, sound = true, volume = 70, onSound,
}: MeetingPickerProps) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [dir, setDir] = useState(0);
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [focusDay, setFocusDay] = useState<Date | null>(null);
  const [booked, setBooked] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const inner = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const lastSwipe = useRef(0);
  const live = useId();
  const ws = weekStart === "Monday" ? 1 : 0;
  const step = mins(interval), len = mins(length);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  const blocked = useMemo(() => {
    const cache = new Map<number, Set<number>>();
    return (d: Date) => {
      const k = d.getFullYear() * 12 + d.getMonth();
      if (!cache.has(k)) {
        const r = rng(k * 7 + 3), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), s = new Set<number>();
        while (s.size < Math.min(unavailable, dim)) s.add(1 + Math.floor(r() * dim));
        cache.set(k, s);
      }
      return cache.get(k)!.has(d.getDate()) || (weekendsOff && (d.getDay() === 0 || d.getDay() === 6));
    };
  }, [unavailable, weekendsOff]);
  const selectable = (d: Date) => d >= today && !blocked(d);

  const slotsFor = (d: Date | null) => {
    if (!d) return [];
    const r = rng(dayKey(d)), out: number[] = [];
    for (let t = Math.round(dayStart * 60); t + len <= Math.round(dayEnd * 60); t += step) if (r() > 0.18) out.push(t);
    return out;
  };
  const slots = useMemo(() => slotsFor(day), [day, dayStart, dayEnd, step, len]); // eslint-disable-line react-hooks/exhaustive-deps

  /* defaults: next available day after today, first slot at or after 10:00 */
  useEffect(() => {
    if (day && selectable(day)) return;
    const d = new Date(today);
    for (let i = 0; i < 90; i++) { d.setDate(d.getDate() + 1); if (selectable(d)) break; }
    const nd = new Date(d);
    setDay(nd);
    setFocusDay(nd);
    setView(new Date(nd.getFullYear(), nd.getMonth(), 1));
  }, [blocked]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!slots.length) { setTime(null); return; }
    if (time === null || !slots.includes(time)) setTime(slots.find((t) => t >= 600) ?? slots[0]);
  }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* keep the selected slot in view */
  useEffect(() => {
    const c = slotsRef.current, i = time === null ? -1 : slots.indexOf(time);
    if (!c || i < 0) return;
    const el = c.querySelectorAll<HTMLElement>(".mtp-slot")[i];
    if (!el) return;
    const side = layout === "Stacked";
    const a = side ? el.offsetLeft : el.offsetTop, s = side ? el.offsetWidth : el.offsetHeight, v = side ? c.clientWidth : c.clientHeight, cur = side ? c.scrollLeft : c.scrollTop;
    if (a < cur + 8 || a + s > cur + v - 8) c.scrollTo({ [side ? "left" : "top"]: a - v / 2 + s / 2, behavior: "smooth" });
  }, [time, slots, layout]);

  const fmtTime = (t: number) => {
    const h = Math.floor(t / 60), m = t % 60;
    if (clock === "24-hour") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  function month(d: number) {
    const nv = new Date(view.getFullYear(), view.getMonth() + d, 1);
    if (nv < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    setDir(d);
    setView(nv);
    const t = performance.now();
    if (t - lastSwipe.current > 150) { lastSwipe.current = t; snd("swipe", { volume: 0.5, pitch: d > 0 ? 1.1 : 0.9 }); }
  }
  function pickDay(d: Date) {
    if (!selectable(d)) return;
    setFocusDay(d);
    if (same(d, day)) return;
    setDay(new Date(d));
    if (d.getMonth() !== view.getMonth()) { setDir(d > view ? 1 : -1); setView(new Date(d.getFullYear(), d.getMonth(), 1)); }
    snd("tick", { volume: 0.5 });
  }
  function pickTime(t: number) {
    if (t === time) return;
    setTime(t);
    snd("tick", { volume: 0.5, pitch: 1.15 });
  }

  /* 6 weeks starting on the week start */
  const first = new Date(view);
  first.setDate(1 - ((view.getDay() - ws + 7) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(first); d.setDate(first.getDate() + i); return d; });
  const selIdx = cells.findIndex((c) => same(c, day));

  const onGridKey = (e: KeyboardEvent) => {
    const f = focusDay ?? day ?? today;
    const d = new Date(f);
    const col = (d.getDay() - ws + 7) % 7;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => d.setDate(d.getDate() - 1), ArrowRight: () => d.setDate(d.getDate() + 1),
      ArrowUp: () => d.setDate(d.getDate() - 7), ArrowDown: () => d.setDate(d.getDate() + 7),
      Home: () => d.setDate(d.getDate() - col), End: () => d.setDate(d.getDate() + 6 - col),
      PageUp: () => d.setMonth(d.getMonth() - 1), PageDown: () => d.setMonth(d.getMonth() + 1),
    };
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickDay(f); return; }
    if (!moves[e.key]) return;
    e.preventDefault();
    moves[e.key]();
    if (d < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    setFocusDay(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) { setDir(d > view ? 1 : -1); setView(new Date(d.getFullYear(), d.getMonth(), 1)); }
    requestAnimationFrame(() => inner.current?.querySelector<HTMLElement>(".mtp-day[tabindex='0']")?.focus());
  };

  const wd = day ? day.toLocaleDateString("en-US", { weekday: "long" }) : "";
  const mo = day ? day.toLocaleDateString("en-US", { month: "long" }) : "";
  const dn = day ? String(day.getDate()) : "";
  const tm = time !== null ? fmtTime(time) : "";
  const ready = !!day && time !== null;
  const sentence = ready ? `Your meeting is booked for ${wd}, ${mo} ${dn} at ${tm}.` : "Pick a day and a time.";
  const stacked = layout === "Stacked";
  const slotIdx = time === null ? -1 : slots.indexOf(time);
  const atStart = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
  const style = { "--mtp-r": `${radius}px`, "--mtp-r2": `${Math.round(radius * 0.6)}px`, width: size?.w, height: size?.h } as CSSProperties;

  return (
    <div className="mtp" style={style} data-layout={stacked ? "stacked" : "side"} data-booked={booked}>
      <div className="mtp-inner" ref={inner}>
        {booked ? (
          <div className="mtp-done">
            <span className="mtp-check"><Icon icon="ph:check-circle-fill" width={28} height={28} /></span>
            <div className="mtp-done-txt">
              <b>Meeting booked</b>
              <span>{wd}, {mo} {dn} · {tm} – {time !== null ? fmtTime(time + len) : ""}</span>
            </div>
            <button type="button" className="mtp-link" onClick={() => { setBooked(false); snd("collapse", { volume: 0.5 }); }}>Change</button>
          </div>
        ) : (
          <div className="mtp-pick">
            <div className="mtp-body">
              <div className="mtp-cal">
                <div className="mtp-head">
                  <button type="button" className="mtp-nav" aria-label="Previous month" disabled={atStart} onClick={() => month(-1)}><Icon icon="ph:caret-left-bold" width={14} height={14} /></button>
                  <span key={view.getTime()} className="mtp-month" data-dir={dir}>{fmtMonth.format(view)}</span>
                  <button type="button" className="mtp-nav" aria-label="Next month" onClick={() => month(1)}><Icon icon="ph:caret-right-bold" width={14} height={14} /></button>
                </div>
                <div className="mtp-wd" aria-hidden>{Array.from({ length: 7 }, (_, i) => <span key={i}>{WD[(i + ws) % 7]}</span>)}</div>
                <div className="mtp-gridwrap">
                  <div key={view.getTime()} className="mtp-grid" role="grid" aria-label={fmtMonth.format(view)} data-dir={dir} onKeyDown={onGridKey}>
                    {selIdx >= 0 && cells[selIdx].getMonth() === view.getMonth() && (
                      <span className="mtp-hl" aria-hidden style={{ transform: `translate(${(selIdx % 7) * 32}px, ${Math.floor(selIdx / 7) * 28}px)` }} />
                    )}
                    {cells.map((c, i) => {
                      const inMonth = c.getMonth() === view.getMonth();
                      const ok = selectable(c);
                      const focus = same(c, focusDay) || (!focusDay && same(c, day));
                      return (
                        <button
                          key={i}
                          type="button"
                          role="gridcell"
                          className="mtp-day"
                          data-out={!inMonth}
                          data-past={c < today}
                          data-blocked={c >= today && blocked(c)}
                          data-today={same(c, today)}
                          data-on={same(c, day) && inMonth}
                          aria-selected={same(c, day)}
                          aria-disabled={!ok}
                          aria-label={c.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                          tabIndex={focus && inMonth ? 0 : -1}
                          onClick={() => pickDay(c)}
                        >
                          {inMonth ? c.getDate() : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mtp-slots" ref={slotsRef}>
                <div
                  key={day ? dayKey(day) : 0}
                  className="mtp-list"
                  role="listbox"
                  aria-label="Times"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
                    if (!d || !slots.length) return;
                    e.preventDefault();
                    pickTime(slots[Math.max(0, Math.min(slots.length - 1, slotIdx + d))]);
                  }}
                >
                  {slotIdx >= 0 && <span className="mtp-shl" aria-hidden style={{ transform: stacked ? `translateX(${slotIdx * 76}px)` : `translateY(${slotIdx * 40}px)` }} />}
                  {slots.map((t, i) => (
                    <button key={t} type="button" role="option" aria-selected={t === time} tabIndex={-1} className="mtp-slot" data-on={t === time}
                      style={{ animationDelay: `${i * 15}ms` }} onClick={() => pickTime(t)}>
                      {fmtTime(t)}
                    </button>
                  ))}
                  {!slots.length && <span className="mtp-none">No times left</span>}
                </div>
              </div>
            </div>
            <div className="mtp-foot">
              <p className="mtp-say">
                {ready ? (
                  <>Your meeting is booked for <b><Roll text={wd} i={0} />, <Roll text={mo} i={1} /> <Roll text={dn} i={2} /></b> at <b><Roll text={tm} i={3} /></b>.</>
                ) : "Pick a day and a time."}
              </p>
              <button type="button" className="mtp-go" disabled={!ready} onClick={() => { setBooked(true); snd("join", { volume: 0.8 }); }}>Continue</button>
            </div>
          </div>
        )}
      </div>
      <span id={live} className="mtp-sr" aria-live="polite">{booked ? `Meeting booked, ${wd}, ${mo} ${dn}, ${tm}` : sentence}</span>
    </div>
  );
}
