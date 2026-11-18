/* ══ Tag picker ═══════════════════════════════════════
   A tag field with a box of suggestions under it. Click a suggestion and it
   flies up into the field; click a tag's × and it flies home. Type to filter
   the suggestions, press Enter to add the first match or create a new tag,
   and drag tags inside the field to reorder them.

   ── ONE TAG, TWO PLACES ──────────────────────────────
   Every tag has a layout id from motion that it keeps wherever it lives.
   Moving a tag between the field and the box removes it from one list and
   adds it to the other in the same render; motion sees the same id leave
   one box and appear in another and animates the element between them, so
   the tag visibly travels. The tags left behind slide to close the gap.

   ── GOING HOME ───────────────────────────────────────
   Each suggestion remembers its place in the original list, so a removed
   tag returns to exactly where it came from rather than to the end. Tags
   you created yourself have no home and join the end of the box.

   ── REORDERING ───────────────────────────────────────
   A dragged tag follows the pointer with motion's drag. On every move the
   tag under the pointer's centre is found and the order is swapped there,
   so the others re-flow around the dragged one, even across wrapped lines.
   Alt with the arrow keys moves a focused tag. */
import { useEffect, useId, useRef, useState } from "react";
import { LayoutGroup, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { Icon } from "@iconify/react";

const SELECTED = ["Node", "Express", "Typescript"];
const AVAILABLE = ["Javascript", "Vue", "Next", "Svelte", "Gatsby", "Html", "React", "Css"];

export type TagPickerProps = {
  max?: number;
  create?: boolean;
  tagStyle?: "Pill" | "Square" | "Outline";
  speed?: number;
  bounce?: number;
  selected?: string[];
  available?: string[];
  onChange?: (tags: string[]) => void;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

export function TagPicker({
  max = 0, create = true, tagStyle = "Pill", speed = 60, bounce = 25, selected: sel0 = SELECTED, available: av0 = AVAILABLE,
  onChange, sound = true, volume = 70, onSound,
}: TagPickerProps) {
  const home = useRef([...SELECTED.filter((t) => !sel0.includes(t)), ...av0]);
  const [sel, setSel] = useState(sel0);
  const [avail, setAvail] = useState(av0.filter((t) => !sel0.includes(t)));
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(-1);
  const [shake, setShake] = useState("");
  const [say, setSay] = useState("");
  const reduced = useReducedMotion();
  const group = useId();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const last = useRef({ tick: 0, max: 0 });
  const dragging = useRef<string | null>(null);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };
  const softTick = () => { const t = performance.now(); if (t - last.current.tick > 40) { last.current.tick = t; snd("tick", { volume: 0.25 }); } };
  useEffect(() => { onChange?.(sel); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const full = max > 0 && sel.length >= max;
  const shown = avail.filter((t) => t.toLowerCase().includes(q.trim().toLowerCase()));
  const spring = reduced ? { duration: 0.12 } : { type: "spring" as const, bounce: (bounce / 100) * 0.6, duration: 0.8 - (speed / 100) * 0.5 };

  function add(t: string) {
    if (full) {
      setShake(t); setTimeout(() => setShake(""), 320);
      const now = performance.now();
      if (now - last.current.max > 300) { last.current.max = now; snd("collapse", { volume: 0.35, pitch: 0.8 }); }
      return;
    }
    setAvail((a) => a.filter((x) => x !== t));
    setSel((s) => [...s, t]);
    setQ(""); setHi(-1);
    setSay(`Added ${t}`);
    setTimeout(() => snd("pop", { volume: 0.5, pitch: 0.96 + Math.random() * 0.08 }), reduced ? 0 : 220);
  }
  function remove(t: string) {
    setSel((s) => s.filter((x) => x !== t));
    setAvail((a) => {
      const order = home.current, i = order.indexOf(t);
      if (i < 0) return [...a, t];
      const next = [...a];
      const at = next.findIndex((x) => { const j = order.indexOf(x); return j < 0 || j > i; });
      next.splice(at < 0 ? next.length : at, 0, t);
      return next;
    });
    setSay(`Removed ${t}`);
    snd("swipe", { volume: 0.45 });
  }
  function move(t: string, to: number) {
    setSel((s) => {
      const from = s.indexOf(t);
      if (from < 0 || to < 0 || to >= s.length || from === to) return s;
      const n = [...s]; n.splice(from, 1); n.splice(to, 0, t);
      softTick();
      setSay(`Moved ${t} to position ${to + 1}`);
      return n;
    });
  }

  const onDrag = (t: string, point: { x: number; y: number }) => {
    const els = [...(input.current?.closest(".tgp")?.querySelectorAll<HTMLElement>(".tgp-field .tgp-tag") ?? [])];
    for (const el of els) {
      const name = el.dataset.tag!;
      if (name === t) continue;
      const r = el.getBoundingClientRect();
      if (point.x > r.left && point.x < r.right && point.y > r.top && point.y < r.bottom) { move(t, sel.indexOf(name)); break; }
    }
  };

  return (
    <LazyMotion features={domMax} strict>
      <LayoutGroup id={group}>
        <div className="tgp" data-look={tagStyle.toLowerCase()} data-full={full}>
          <span className="tgp-label">Tags</span>
          <div className="tgp-field" onClick={(e) => { if (e.target === e.currentTarget) input.current?.focus(); }}>
            <ul className="tgp-sel" aria-label="Selected tags">
              {sel.map((t, i) => (
                <m.li
                  key={t}
                  layoutId={`tag-${t}`}
                  transition={spring}
                  className="tgp-tag"
                  data-tag={t}
                  data-on
                  drag={!reduced}
                  dragSnapToOrigin
                  dragElastic={0.6}
                  dragMomentum={false}
                  onDragStart={() => { dragging.current = t; }}
                  onDrag={(_, info) => onDrag(t, { x: info.point.x - scrollX, y: info.point.y - scrollY })}
                  onDragEnd={() => { dragging.current = null; }}
                  whileDrag={{ scale: 1.06, zIndex: 3 }}
                  tabIndex={0}
                  aria-label={t}
                  onKeyDown={(e) => {
                    if (!e.altKey) return;
                    if (e.key === "ArrowLeft") { e.preventDefault(); move(t, i - 1); }
                    if (e.key === "ArrowRight") { e.preventDefault(); move(t, i + 1); }
                  }}
                >
                  <span>{t}</span>
                  <button type="button" className="tgp-x" aria-label={`Remove ${t}`} onPointerDownCapture={(e) => e.stopPropagation()} onClick={() => remove(t)}>
                    <Icon icon="ph:x-bold" width={10} height={10} />
                  </button>
                </m.li>
              ))}
            </ul>
            <input
              ref={input}
              className="tgp-in"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              placeholder="Add a tag"
              value={q}
              onClick={(e) => e.currentTarget.focus()}
              onChange={(e) => { setQ(e.target.value); setHi(-1); softTick(); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(shown.length - 1, h + 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(-1, h - 1)); }
                else if (e.key === "Backspace" && !q && sel.length) remove(sel[sel.length - 1]);
                else if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = shown[hi >= 0 ? hi : 0];
                  const typed = q.trim();
                  if (pick) add(pick);
                  else if (create && typed && !sel.some((s) => s.toLowerCase() === typed.toLowerCase())) {
                    if (full) { add(typed); return; }
                    setSel((s) => [...s, typed]); setQ(""); setSay(`Added ${typed}`); snd("pop", { volume: 0.5 });
                  }
                } else if (e.key === "Escape") { setQ(""); setHi(-1); }
              }}
            />
            {max > 0 && full && <span className="tgp-max">Max {max}</span>}
          </div>
          <ul className="tgp-avail" id={listId} role="listbox" aria-label="Available tags">
            {shown.map((t, i) => (
              <m.li
                key={t}
                layoutId={`tag-${t}`}
                transition={spring}
                className="tgp-tag"
                data-tag={t}
                data-hi={i === hi}
                data-shake={shake === t}
                role="option"
                aria-selected={false}
                onClick={() => add(t)}
              >
                <span>{t}</span>
              </m.li>
            ))}
            {!shown.length && <li className="tgp-empty">{create && q.trim() ? `Press Enter to create “${q.trim()}”` : "No tags left"}</li>}
          </ul>
          <span className="tgp-sr" aria-live="polite">{say}</span>
        </div>
      </LayoutGroup>
    </LazyMotion>
  );
}
