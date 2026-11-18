/* ══ Dropdown ═════════════════════════════════
   A select that grows out of its own trigger. Open it, filter by typing, glide
   over grouped options and pick one (or several), and the trigger rolls to the
   new value. Works with the keyboard as a standard combobox.

   ── ONE SURFACE ──────────────────────────────
   The trigger and the list are the same box. Opening only animates the height
   of that box from the trigger's 40 px to 40 px plus the measured height of the
   list, with a CSS transition on a spring-shaped linear() curve, so the box
   stretches downward and overshoots a little. Closing fades the rows first,
   then shrinks the box with a plain ease. The slot around it animates to the same height, so
   the block is always the size of what is visible and grows equally up and down
   inside its centred card.

   ── THE SLIDING HIGHLIGHT ────────────────────
   There is one highlight pill, not a hover colour per row. Whenever the active
   row changes, by pointer or arrow keys, the pill's transform moves to that
   row's offset inside the scrolling list, so it glides from row to row.

   ── THE ROLL ─────────────────────────────────
   When the picked value changes, the trigger keeps the old content for 200 ms
   next to the new one. The old slides up and out while the new slides up in.
   In multi-select only the "+n" count updates, with no roll.

   ── SEARCH AND KEYS ──────────────────────────
   With search on, the trigger row turns into a text field while open. Typing
   filters rows by a case-insensitive substring, hides empty groups, and the
   height re-measures so the box resizes. The trigger or field is a
   role="combobox" with aria-activedescendant pointing at the highlighted
   option; focus never leaves it. */

import { Icon } from "@iconify/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type DropdownOption = { label: string; icon?: string; group?: string };

export type DropdownProps = {
  options?: DropdownOption[];
  /** caption above the trigger */
  label?: string;
  /** checkboxes, several values at once */
  multi?: boolean;
  /** the trigger row becomes a filter field when open */
  search?: boolean;
  groups?: boolean;
  icons?: boolean;
  /** trigger and panel width in px */
  width?: number;
  /** rows shown before the list scrolls */
  rows?: number;
  /** corner radius in px */
  radius?: number;
  speed?: "Snappy" | "Smooth" | "Slow";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onChange?: (value: string | string[]) => void;
  onSound?: Sound;
};

const OPTIONS: DropdownOption[] = [
  { group: "Date", label: "Newest", icon: "ph:clock-counter-clockwise" },
  { group: "Date", label: "Oldest", icon: "ph:clock-clockwise" },
  { group: "Popularity", label: "Most popular", icon: "ph:fire" },
  { group: "Popularity", label: "Most viewed", icon: "ph:eye" },
  { group: "Name", label: "A to Z", icon: "ph:sort-ascending" },
  { group: "Name", label: "Z to A", icon: "ph:sort-descending" },
  { group: "Price", label: "Low to high", icon: "ph:trend-up" },
  { group: "Price", label: "High to low", icon: "ph:trend-down" },
];
const DUR = { Snappy: 220, Smooth: 320, Slow: 480 };
const HEAD = 40;

/* keeps the old content beside the new one for 200 ms so CSS can roll them */
function Roll({ id, children }: { id: string; children: ReactNode }) {
  const last = useRef({ id, node: children });
  const timer = useRef(0);
  const [prev, setPrev] = useState<{ id: string; node: ReactNode } | null>(null);
  useLayoutEffect(() => {
    if (last.current.id !== id) {
      setPrev(last.current);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPrev(null), 220);
    }
    last.current = { id, node: children };
  }, [id, children]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <span className="dd-roll">
      {prev && (
        <span key={prev.id} className="dd-it dd-out">
          {prev.node}
        </span>
      )}
      <span key={id} className={prev ? "dd-it dd-in" : "dd-it"}>
        {children}
      </span>
    </span>
  );
}

export function Dropdown({
  options = OPTIONS,
  label = "Sort by",
  multi = false,
  search = true,
  groups = true,
  icons = true,
  width = 220,
  rows = 7,
  radius = 10,
  speed = "Smooth",
  sound = true,
  volume = 70,
  onChange,
  onSound,
}: DropdownProps) {
  const uid = useId();
  const dur = DUR[speed];
  const [selected, setSelected] = useState<string[]>(() => (options[0] ? [options[0].label] : []));
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [bodyH, setBodyH] = useState(0);
  const surface = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const listEl = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const rowEls = useRef<(HTMLDivElement | null)[]>([]);
  const closeTimer = useRef(0);
  const lastTick = useRef(0);
  const keyNav = useRef(false);

  const sel = multi ? selected : selected.slice(0, 1);
  useEffect(() => {
    if (!multi) setSelected((s) => (s.length > 1 ? s.slice(0, 1) : s));
  }, [multi]);

  const snd = (name: string, v: number, pitch?: number) => {
    if (sound) onSound?.(name, { volume: (v * volume) / 100, ...(pitch ? { pitch } : {}) });
  };

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q)), [options, q]);
  const sections = useMemo(() => {
    const out: { name: string; items: { o: DropdownOption; i: number }[] }[] = [];
    filtered.forEach((o, i) => {
      const name = groups ? o.group ?? "" : "";
      let s = out.find((x) => x.name === name);
      if (!s) out.push((s = { name, items: [] }));
      s.items.push({ o, i });
    });
    return out;
  }, [filtered, groups]);
  /* with groups the render order is by section, so keyboard order must match it */
  const order = useMemo(() => sections.flatMap((s) => s.items.map((x) => x.i)), [sections]);

  const openIt = (initial = "") => {
    clearTimeout(closeTimer.current);
    setQuery(initial);
    const first = options.findIndex((o) => sel.includes(o.label));
    setActive(initial ? 0 : Math.max(0, first));
    setOpen(true);
    setMounted(true);
    snd("expand", 0.4);
  };
  const closeIt = (refocus: boolean) => {
    if (!open) return;
    setOpen(false);
    snd("collapse", 0.35);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(() => {
      setMounted(false);
      setQuery("");
    }, reduce ? 0 : dur + 120);
    if (refocus) requestAnimationFrame(() => btn.current?.focus());
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  /* visual "shown" lags the logical open by two frames so the CSS transitions have a start */
  useEffect(() => {
    if (!open) return setReady(false);
    let a = requestAnimationFrame(() => (a = requestAnimationFrame(() => setReady(true))));
    return () => cancelAnimationFrame(a);
  }, [open]);

  useLayoutEffect(() => {
    if (mounted && body.current) setBodyH(body.current.offsetHeight);
  }, [mounted, filtered, groups, rows, query, width]);

  useLayoutEffect(() => {
    if (open && search) input.current?.focus();
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!surface.current?.contains(e.target as Node)) closeIt(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });

  /* slide the highlight to the active row */
  useLayoutEffect(() => {
    const h = hl.current;
    const el = rowEls.current[active];
    if (!h) return;
    if (!el || !mounted) {
      h.style.opacity = "0";
      return;
    }
    h.style.transition = ready ? "" : "none";
    h.style.opacity = "1";
    h.style.height = `${el.offsetHeight}px`;
    h.style.transform = `translateY(${el.offsetTop}px)`;
    const l = listEl.current;
    if (l && keyNav.current) {
      if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop - 4;
      else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight)
        l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight + 4;
    }
    keyNav.current = false;
  }, [active, filtered, sections, ready, mounted, icons]);

  const point = (i: number) => {
    if (i === active) return;
    setActive(i);
    const now = performance.now();
    if (now - lastTick.current > 50) {
      lastTick.current = now;
      snd("tick", 0.15, 1.1);
    }
  };
  const move = (d: number) => {
    if (!order.length) return;
    const at = order.indexOf(active);
    const next = at < 0 ? (d > 0 ? 0 : order.length - 1) : (at + d + order.length) % order.length;
    keyNav.current = true;
    point(order[next]);
  };

  const pick = (o: DropdownOption) => {
    if (multi) {
      const on = !selected.includes(o.label);
      const next = on ? [...selected, o.label] : selected.filter((l) => l !== o.label);
      setSelected(next);
      snd("tick", 0.35, on ? 1.2 : 0.9);
      onChange?.(next);
    } else {
      setSelected([o.label]);
      onChange?.(o.label);
      closeIt(true);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    const k = e.key;
    const printable = k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (!open) {
      if (k === "Enter" || k === " " || k === "ArrowDown" || k === "ArrowUp") {
        e.preventDefault();
        openIt();
      } else if (printable) {
        e.preventDefault();
        openIt(search ? k : "");
        if (!search) {
          const i = options.findIndex((o) => o.label.toLowerCase().startsWith(k.toLowerCase()));
          if (i >= 0) setActive(i);
        }
      }
      return;
    }
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      move(k === "ArrowDown" ? 1 : -1);
    } else if ((k === "Home" || k === "End") && !q) {
      e.preventDefault();
      keyNav.current = true;
      point(order[k === "Home" ? 0 : order.length - 1] ?? -1);
    } else if (k === "Enter" || (k === " " && !search)) {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (k === "Escape") {
      e.preventDefault();
      closeIt(true);
    } else if (printable && !search) {
      e.preventDefault();
      const at = order.indexOf(active);
      for (let n = 1; n <= order.length; n++) {
        const i = order[(at + n) % order.length];
        if (filtered[i].label.toLowerCase().startsWith(k.toLowerCase())) {
          keyNav.current = true;
          point(i);
          break;
        }
      }
    }
  };

  const first = options.find((o) => o.label === sel[0]);
  const optId = (o: DropdownOption) => `${uid}-o-${options.indexOf(o)}`;
  const aria = {
    role: "combobox" as const,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    "aria-controls": `${uid}-list`,
    "aria-label": label,
    "aria-activedescendant": open && filtered[active] ? optId(filtered[active]) : undefined,
    onKeyDown: onKey,
  };
  const hlText = (t: string) => {
    const i = q ? t.toLowerCase().indexOf(q) : -1;
    return i < 0 ? (
      t
    ) : (
      <>
        {t.slice(0, i)}
        <b>{t.slice(i, i + q.length)}</b>
        {t.slice(i + q.length)}
      </>
    );
  };

  const style = {
    "--dd-w": `${width}px`,
    "--dd-rows": rows,
    "--dd-r": `${radius}px`,
    "--dd-dur": `${dur}ms`,
  } as CSSProperties;
  const shown = open && ready;

  return (
    <div className="dd" style={style}>
      <span className="dd-cap">{label}</span>
      <div className="dd-slot" data-shown={shown} style={shown ? { height: HEAD + bodyH } : undefined}>
        <div
          ref={surface}
          className="dd-surface"
          data-open={open}
          data-shown={shown}
          onBlur={(e) => {
            if (open && e.relatedTarget && !surface.current?.contains(e.relatedTarget as Node)) closeIt(false);
          }}
        >
          <div
            className="dd-head"
            onClick={(e) => {
              if (e.target === input.current) return;
              open ? closeIt(true) : openIt();
            }}
          >
            {open && search ? (
              <>
                <Icon icon="ph:magnifying-glass" className="dd-lead" />
                <input
                  ref={input}
                  className="dd-input"
                  value={query}
                  placeholder="Search…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-autocomplete="list"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  {...aria}
                />
              </>
            ) : (
              <button ref={btn} type="button" className="dd-btn" {...aria}>
                <Roll id={multi ? (first?.label ?? "") : sel.join("|")}>
                  {first ? (
                    <>
                      {icons && first.icon && <Icon icon={first.icon} className="dd-ico" />}
                      <span className="dd-lbl" title={first.label}>
                        {first.label}
                      </span>
                      {sel.length > 1 && <span className="dd-more">+{sel.length - 1}</span>}
                    </>
                  ) : (
                    <span className="dd-none">None</span>
                  )}
                </Roll>
              </button>
            )}
            <Icon icon="ph:caret-down-bold" className="dd-caret" />
          </div>
          {mounted && (
            <div ref={body} className="dd-body">
              <div ref={listEl} className="dd-list">
                <div ref={hl} className="dd-hl" />
                {filtered.length ? (
                  <div
                    id={`${uid}-list`}
                    role="listbox"
                    aria-label={label}
                    aria-multiselectable={multi || undefined}
                  >
                    {sections.map((s, si) => {
                      const items = s.items.map(({ o, i }) => {
                        const on = sel.includes(o.label);
                        return (
                          <div
                            key={o.label}
                            ref={(el) => {
                              rowEls.current[i] = el;
                            }}
                            id={optId(o)}
                            role="option"
                            aria-selected={on}
                            className="dd-row"
                            data-active={i === active}
                            title={o.label}
                            style={{ "--i": Math.min(i, 12) } as CSSProperties}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              point(i);
                            }}
                            onPointerMove={() => point(i)}
                            onClick={() => pick(o)}
                          >
                            {icons && o.icon && <Icon icon={o.icon} className="dd-ico" />}
                            <span className="dd-lbl">{hlText(o.label)}</span>
                            {multi ? (
                              <span className="dd-box" data-on={on}>
                                <Icon icon="ph:check-bold" />
                              </span>
                            ) : (
                              on && <Icon icon="ph:check-bold" className="dd-tick" />
                            )}
                          </div>
                        );
                      });
                      if (!s.name) return items;
                      return (
                        <div key={s.name} role="group" aria-labelledby={`${uid}-g-${si}`} className="dd-group">
                          <div
                            id={`${uid}-g-${si}`}
                            className="dd-hd"
                            style={{ "--i": Math.min(s.items[0].i, 12) } as CSSProperties}
                          >
                            {s.name}
                          </div>
                          {items}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="dd-empty" id={`${uid}-list`} role="status">
                    No matches
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
