/* ══ Search expand ═════════════════════════════════
   A round search button that unfolds into a field with a live-filtering list
   of the labs' components. Type to fuzzy-match: the matching letters turn
   bolder, and the results slide into their new order. Arrow keys move the
   highlight, Enter picks, Escape clears and then closes.

   ── FUZZY MATCH ──────────────────────────────────────
   The query's letters must appear in a name in order, ignoring case. Each
   name is scored by walking the query once: letters that sit right after the
   previous match and letters that start a word score extra, and a late first
   match costs a little. Results sort by score, ties keep the list's order.

   ── GLIDING ROWS ─────────────────────────────────────
   Every row is absolutely placed with a transform of its index times the row
   height, and the transform has a transition. When the order changes, rows
   that stay simply glide to their new slot (a FLIP without the measuring,
   since all rows are the same height). A row that drops out stays on screen
   as a ghost at its old slot and blurs away; a new row blurs in.

   ── STRETCHING OPEN ──────────────────────────────────
   The closed button and the open field are one element whose width
   transitions between 40 px and 240 px with a springy linear() curve. The
   panel's height follows the number of rows, so the whole thing grows from
   its own centre and never reserves room it is not using. */

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;
export type SearchItem = { name: string; tag: string };

const ROW = 30;

const DATA: [string, string][] = [
  ["Staggered countdown", "Press"],
  ["Voice chat", "Press"],
  ["Set status", "Select"],
  ["Event stack", "Swipe"],
  ["Hold to delete", "Press"],
  ["Radar", "Press"],
  ["View switcher", "Select"],
  ["Multi-line copy", "Press"],
  ["Meeting picker", "Select"],
  ["Profile card", "Press"],
  ["Photo folder", "Hover"],
  ["Jelly slider", "Slide"],
  ["Revenue card", "Hover"],
  ["Heat text", "Hover"],
  ["Reader toolbar", "Press"],
  ["Position inspector", "Drag"],
  ["Radial toolkit", "Drag"],
  ["Stat stack", "Hover"],
  ["Activity heatmap", "Hover"],
  ["Storage donut", "Hover"],
  ["Value slider", "Slide"],
  ["Color slider", "Slide"],
  ["White balance", "Slide"],
  ["Color palette", "Press"],
  ["Aspect ratio", "Select"],
  ["Date scrubber", "Drag"],
  ["Warp carousel", "Drag"],
  ["Create menu", "Press"],
  ["Overview bars", "Hover"],
  ["Tool dock", "Hover"],
  ["Liquid word", "Hover"],
  ["Dot globe", "Drag"],
  ["Secret field", "Press"],
  ["Audio clip", "Drag"],
  ["QR share", "Press"],
  ["Invites inbox", "Press"],
  ["Coupon copy", "Press"],
  ["Notify me", "Type"],
  ["Update button", "Loading"],
  ["Desktop drop", "Drag"],
  ["Pricing toggle", "Select"],
  ["Summary resize", "Drag"],
  ["Search expand", "Type"],
  ["Halftone field", "Hover"],
  ["File upload", "Drag"],
  ["ASCII bloom", "Drag"],
  ["Wallet top-up", "Press"],
  ["Share panel", "Press"],
  ["Liquid toggle", "Press"],
  ["Goo button", "Hover"],
  ["Duration chip", "Type"],
  ["Tag picker", "Select"],
  ["Split slider", "Slide"],
  ["OTP input", "Type"],
  ["Card stack", "Drag"],
  ["Gooey compare", "Drag"],
  ["Dropdown", "Select"],
  ["Split button", "Press"],
  ["Input box", "Type"],
  ["Toast stack", "Hover"],
];
export const DEFAULT_ITEMS: SearchItem[] = DATA.map(([name, tag]) => ({ name, tag }));

export type SearchExpandProps = {
  items?: SearchItem[];
  placeholder?: string;
  /** results shown, 3 to 8 */
  max?: number;
  /** blur in px on rows leaving and entering */
  blur?: number;
  /** 0 to 100, how fast rows glide to new places */
  speed?: number;
  /** show each result's tag */
  tags?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onPick?: (name: string) => void;
  onSound?: Sound;
};

/** matched letter positions and a score, or null when the letters are not all there in order */
function match(name: string, q: string): { at: number[]; score: number } | null {
  const n = name.toLowerCase();
  const at: number[] = [];
  let score = 0;
  let from = 0;
  for (const ch of q.toLowerCase()) {
    const i = n.indexOf(ch, from);
    if (i < 0) return null;
    if (at.length && i === from) score += 3;
    if (i === 0 || n[i - 1] === " ") score += 4;
    if (!at.length) score -= i * 0.3;
    at.push(i);
    from = i + 1;
  }
  return { at, score };
}

type Row = { name: string; tag: string; at: number[] };

export function SearchExpand({
  items = DEFAULT_ITEMS,
  placeholder = "Search components",
  max = 4,
  blur = 6,
  speed = 60,
  tags = false,
  sound = true,
  volume = 70,
  onPick,
  onSound,
}: SearchExpandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [fresh, setFresh] = useState(false);
  const [ghosts, setGhosts] = useState<(Row & { idx: number })[]>([]);
  const [mounted, setMounted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const prev = useRef<Row[]>([]);
  const last = useRef<Record<string, number>>({});
  const uid = useId();

  useEffect(() => setMounted(true), []);

  const play = (name: string, v: number, gap = 0) => {
    if (!sound || !onSound) return;
    const now = performance.now();
    if (now - (last.current[name] ?? -1e9) < gap) return;
    last.current[name] = now;
    onSound(name, { volume: (v * volume) / 100 });
  };

  const rows: Row[] = useMemo(() => {
    if (picked) return items.filter((i) => i.name === picked).map((i) => ({ ...i, at: [] }));
    if (!query.trim()) return items.slice(0, max).map((i) => ({ ...i, at: [] }));
    const q = query.replace(/\s+/g, "");
    return items
      .map((it, order) => ({ it, order, m: match(it.name, q) }))
      .filter((x) => x.m)
      .sort((a, b) => b.m!.score - a.m!.score || a.order - b.order)
      .slice(0, max)
      .map((x) => ({ ...x.it, at: x.m!.at }));
  }, [items, query, picked, max]);

  /* rows that dropped out stay as ghosts at their old slot while they blur away */
  useEffect(() => {
    const names = new Set(rows.map((r) => r.name));
    const gone = prev.current.map((r, idx) => ({ ...r, idx })).filter((r) => !names.has(r.name));
    const changed = prev.current.length && rows.some((r, i) => prev.current[i]?.name !== r.name);
    prev.current = rows;
    if (!open || !changed) return;
    play("shuffle", 0.35, 300);
    if (!gone.length) return;
    setGhosts(gone);
    const t = setTimeout(() => setGhosts([]), 360);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => setActive((a) => Math.min(a, rows.length - 1)), [rows.length]);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!query && !root.current?.contains(e.target as Node)) collapse();
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  const expand = () => {
    setOpen(true);
    setFresh(true);
    setTimeout(() => setFresh(false), 500);
    setTimeout(() => input.current?.focus(), 30);
    play("expand", 0.5);
  };
  const collapse = () => {
    setOpen(false);
    setQuery("");
    setPicked(null);
    setActive(0);
    prev.current = [];
    setGhosts([]);
    play("collapse", 0.5);
  };
  const type = (v: string) => {
    setQuery(v);
    setPicked(null);
    setActive(0);
    play("tick", 0.25, 30);
  };
  const pick = (r: Row) => {
    setQuery(r.name);
    setPicked(r.name);
    setActive(0);
    play("pop", 0.5);
    onPick?.(r.name);
    input.current?.focus();
  };
  const move = (i: number) => {
    if (i === active) return;
    setActive(i);
    play("tick", 0.25, 30);
  };
  const clear = () => {
    if (query) {
      type("");
      input.current?.focus();
    } else collapse();
  };

  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (rows.length) move((active + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[active] && !picked) pick(rows[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (query) clear();
      else collapse();
    }
  };

  const empty = open && !rows.length;
  const listH = Math.max(rows.length, 1) * ROW;
  const style = {
    "--sx-dur": `${120 + (100 - speed) * 5}ms`,
    "--sx-blur": `${blur}px`,
  } as CSSProperties;

  const label = (r: Row) =>
    r.at.length ? (
      <span className="sx-name" data-typed="">
        {[...r.name].map((c, i) => (
          <span key={i} data-hit={r.at.includes(i) ? "" : undefined}>
            {c}
          </span>
        ))}
      </span>
    ) : (
      <span className="sx-name">{r.name}</span>
    );

  return (
    <div className="sx" ref={root} style={style} data-open={open ? "" : undefined}>
      <div className="sx-field">
        <button
          type="button"
          className="sx-icon"
          aria-label="Search components"
          aria-hidden={open || undefined}
          tabIndex={open ? -1 : 0}
          onClick={() => (open ? input.current?.focus() : expand())}
        >
          {mounted ? <Icon icon="ph:magnifying-glass-bold" width={16} height={16} /> : <span className="sx-ph" />}
        </button>
        <input
          ref={input}
          className="sx-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-activedescendant={open && rows[active] ? `${uid}-o${active}` : undefined}
          aria-autocomplete="list"
          aria-label="Search components"
          placeholder={placeholder}
          value={query}
          tabIndex={open ? 0 : -1}
          autoComplete="off"
          spellCheck={false}
          onClick={() => input.current?.focus()}
          onChange={(e) => type(e.target.value)}
          onKeyDown={key}
        />
        <button type="button" className="sx-clear" aria-label={query ? "Clear search" : "Close search"} tabIndex={open ? 0 : -1} onClick={clear}>
          {mounted ? <Icon icon="ph:x-bold" width={12} height={12} /> : <span className="sx-ph" />}
        </button>
      </div>
      <div className="sx-panel" style={{ height: open ? listH + 8 : 0 }}>
        <div className="sx-list" id={`${uid}-list`} role="listbox" aria-label="Components" style={{ height: listH }}>
          {open && !empty && <div className="sx-hl" style={{ transform: `translateY(${active * ROW}px)` }} />}
          {open &&
            rows.map((r, i) => (
              <div
                key={r.name}
                id={`${uid}-o${i}`}
                role="option"
                aria-selected={i === active}
                className="sx-row"
                data-fresh={fresh ? "" : undefined}
                style={{ transform: `translateY(${i * ROW}px)`, animationDelay: fresh ? `${i * 25}ms` : undefined }}
                onPointerMove={() => move(i)}
                onClick={() => pick(r)}
              >
                {label(r)}
                {tags && <span className="sx-tag">{r.tag}</span>}
              </div>
            ))}
          {open &&
            ghosts.map((g) => (
              <div key={`g-${g.name}`} className="sx-row" data-ghost="" aria-hidden style={{ transform: `translateY(${g.idx * ROW}px)` }}>
                {label(g)}
                {tags && <span className="sx-tag">{g.tag}</span>}
              </div>
            ))}
          {empty && <div className="sx-row sx-none">No components match</div>}
        </div>
      </div>
      <div className="sx-live" aria-live="polite">
        {open && query ? `${rows.length} result${rows.length === 1 ? "" : "s"}` : ""}
      </div>
    </div>
  );
}
