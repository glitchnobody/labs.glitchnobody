/* ══ Summary resize ═══════════════════════════════════
   A paragraph you resize to summarise. Drag the card's right edge narrower
   and the text rewrites itself shorter; drag it wider for the full story, or
   click a stop on the ruler above. Arrow keys on the handle step between
   lengths.

   ── THREE STOPS ──────────────────────────────────────
   Each length (In short, Short, Full) owns a card width. While you drag, the
   card follows the pointer freely and the nearest stop becomes active; on
   release a small spring carries the width to that stop exactly. A fast drag
   across all stops only rewrites once the pointer pauses for 60 ms, so the
   text never flickers through every version.

   ── A WORD DIFF ──────────────────────────────────────
   The old and new texts are compared word by word with a longest common
   subsequence. Words in both keep their identity, so React keeps their
   elements; words only in the old text become ghosts left at their old
   place, and words only in the new text are fresh elements.

   ── FLIP ─────────────────────────────────────────────
   Just before the swap every word's position is measured. After the new text
   lays out, each kept word is measured again and animated from its old place
   to its new one with a transform (First, Last, Invert, Play). Ghosts blur
   and fade where they stood, new words blur in a moment later, and the
   card's height animates between the two texts. */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type Len = "In short" | "Short" | "Full";
const STOPS: Len[] = ["In short", "Short", "Full"];
const WIDTH = [150, 190, 250];
const HEAD = ["In short", "Short", "About"];

const DEFAULT_TEXTS = {
  short: "Small interactive components with sound. Play, then copy the prompt.",
  medium: "glitchnobody labs is a wall of small interactive components with sounds. Play with the knobs, then copy the prompt into your own project.",
  full: "glitchnobody labs is a growing wall of small interactive components, each with its own sounds and settings. Open a card to play with it, tweak every knob, and read how it works. When you like one, copy the prompt and paste it into your own project. A new component lands every week, sixty in all.",
};

export type SummaryResizeProps = {
  texts?: { short: string; medium: string; full: string };
  length?: Len;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

type W = { k: string; t: string };
type Ghost = W & { x: number; y: number };

/* first keys are fixed so the server and client render the same; later ones only exist on the client */
const toWords = (s: string): W[] => s.split(/\s+/).filter(Boolean).map((t, i) => ({ k: `s${i}`, t }));
let uid = 0;

/* keeps the keys of words the old and new texts share (longest common subsequence) */
function diff(old: W[], next: string[]) {
  const n = old.length, m = next.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = old[i].t === next[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: W[] = [], gone: W[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && old[i].t === next[j]) { out.push(old[i]); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { out.push({ k: `w${uid++}`, t: next[j] }); j++; }
    else { gone.push(old[i]); i++; }
  }
  return { out, gone };
}

const ease = "cubic-bezier(.2,.7,.2,1)";

export function SummaryResize({ texts = DEFAULT_TEXTS, length = "Short", sound = true, volume = 70, onSound }: SummaryResizeProps) {
  const list = [texts.short, texts.medium, texts.full];
  const start = Math.max(0, STOPS.indexOf(length));
  const [stop, setStop] = useState(start);
  const [shown, setShown] = useState(start);
  const [w, setW] = useState(WIDTH[start]);
  const [words, setWords] = useState<W[]>(() => toWords(list[start]));
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [drag, setDrag] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const before = useRef<{ pos: Map<string, [number, number]>; h: number; fresh: Set<string> } | null>(null);
  const wRef = useRef(w), raf = useRef(0), pause = useRef(0), lastTick = useRef(0);
  const dragRef = useRef<{ x: number; w: number } | null>(null);
  const reduced = useRef(false);

  useEffect(() => { reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(pause.current); }, []);
  useEffect(() => { go(start); }, [length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { rewrite(shown, true); }, [texts.short, texts.medium, texts.full]); // eslint-disable-line react-hooks/exhaustive-deps

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  function setWidth(v: number) { wRef.current = v; setW(v); }

  function rewrite(to: number, force = false) {
    if (to === shown && !force) return;
    const el = body.current;
    const next = list[to].split(/\s+/).filter(Boolean);
    const { out, gone } = diff(words, next);
    if (el) {
      const b = el.getBoundingClientRect(), pos = new Map<string, [number, number]>();
      el.querySelectorAll<HTMLElement>("[data-k]").forEach((s) => {
        const r = s.getBoundingClientRect();
        pos.set(s.dataset.k!, [r.left - b.left, r.top - b.top]);
      });
      const kept = new Set(words.map((x) => x.k));
      before.current = { pos, h: b.height, fresh: new Set(out.filter((x) => !kept.has(x.k)).map((x) => x.k)) };
      setGhosts(reduced.current ? [] : gone.map((g) => ({ ...g, x: pos.get(g.k)?.[0] ?? 0, y: pos.get(g.k)?.[1] ?? 0 })));
    }
    setWords(out);
    setShown(to);
  }

  useLayoutEffect(() => {
    const el = body.current, prev = before.current;
    if (!el || !prev) return;
    before.current = null;
    const b = el.getBoundingClientRect();
    if (reduced.current) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
      return;
    }
    el.animate([{ height: `${prev.h}px` }, { height: `${b.height}px` }], { duration: 260, easing: ease });
    el.querySelectorAll<HTMLElement>("[data-k]").forEach((s) => {
      const k = s.dataset.k!;
      if (prev.fresh.has(k)) {
        s.animate([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 160, delay: 80, easing: "ease-out", fill: "backwards" });
        return;
      }
      const p = prev.pos.get(k);
      if (!p) return;
      const r = s.getBoundingClientRect(), dx = p[0] - (r.left - b.left), dy = p[1] - (r.top - b.top);
      if (dx || dy) s.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 260, easing: ease });
    });
  }, [words]);

  function spring(to: number) {
    cancelAnimationFrame(raf.current);
    if (reduced.current) { setWidth(to); return; }
    let x = wRef.current, v = 0, t0 = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - t0) / 1000);
      t0 = now;
      v += (-260 * (x - to) - 24 * v) * dt;
      x += v * dt;
      if (Math.abs(x - to) < 0.3 && Math.abs(v) < 2) { setWidth(to); return; }
      setWidth(x);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  function activate(i: number) {
    if (i === stop) return;
    setStop(i);
    const t = performance.now();
    if (t - lastTick.current > 80) { lastTick.current = t; snd("tick", { volume: 0.45, pitch: [0.9, 1, 1.1][i] }); }
  }

  function go(i: number) {
    activate(i);
    clearTimeout(pause.current);
    rewrite(i);
    spring(WIDTH[i]);
  }

  const nearest = (v: number) => WIDTH.reduce((best, x, i) => (Math.abs(x - v) < Math.abs(WIDTH[best] - v) ? i : best), 0);

  function onMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    let v = d.w + e.clientX - d.x;
    if (v < WIDTH[0]) v = WIDTH[0] - Math.sqrt(WIDTH[0] - v) * 2;
    if (v > WIDTH[2]) v = WIDTH[2] + Math.sqrt(v - WIDTH[2]) * 2;
    setWidth(v);
    const i = nearest(v);
    if (i !== stop) {
      activate(i);
      clearTimeout(pause.current);
      pause.current = window.setTimeout(() => rewrite(i), 60);
    }
  }

  function onUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDrag(false);
    clearTimeout(pause.current);
    rewrite(stop);
    spring(WIDTH[stop]);
  }

  const count = (i: number) => list[i].split(/\s+/).filter(Boolean).length;
  const secs = (i: number) => `${Math.max(5, Math.round((count(i) / 220) * 60 / 5) * 5)} secs`;

  return (
    <div className="smz" style={{ "--smz-max": `${WIDTH[2]}px` } as CSSProperties}>
      <div className="smz-ruler" style={{ "--smz-dot": `${(stop / 2) * 100}%` } as CSSProperties}>
        <div className="smz-stops">
          {STOPS.map((s, i) => (
            <button type="button" key={s} className="smz-stop" data-on={i === stop} onClick={() => go(i)}>
              <span>{s}</span>
              <small>{count(i)} words</small>
            </button>
          ))}
        </div>
        <div className="smz-line"><i /><i /><i /><b /></div>
      </div>
      <div className="smz-card" data-drag={drag} style={{ width: w }}>
        <div className="smz-head">
          <span key={`h${shown}`}>{HEAD[shown]}</span>
          <span key={`t${shown}`}>{secs(shown)}</span>
        </div>
        <div className="smz-body" ref={body} aria-live="polite">
          {words.map((x) => <span key={x.k}><span data-k={x.k}>{x.t}</span> </span>)}
          {ghosts.map((g) => (
            <span
              key={`g${g.k}`}
              className="smz-ghost"
              aria-hidden
              style={{ left: g.x, top: g.y }}
              onAnimationEnd={() => setGhosts((all) => all.filter((o) => o.k !== g.k))}
            >
              {g.t}
            </span>
          ))}
        </div>
        <div
          className="smz-handle"
          role="slider"
          tabIndex={0}
          aria-label="Summary length"
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={stop}
          aria-valuetext={`${STOPS[stop]}, ${count(stop)} words`}
          onPointerDown={(e) => {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
            cancelAnimationFrame(raf.current);
            dragRef.current = { x: e.clientX, w: wRef.current };
            setDrag(true);
          }}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={(e) => {
            const n = e.key === "ArrowLeft" || e.key === "ArrowDown" ? stop - 1 : e.key === "ArrowRight" || e.key === "ArrowUp" ? stop + 1 : e.key === "Home" ? 0 : e.key === "End" ? 2 : null;
            if (n === null) return;
            e.preventDefault();
            go(Math.max(0, Math.min(2, n)));
          }}
        />
      </div>
      <p className="smz-hint">Drag the edge to summarize</p>
    </div>
  );
}
