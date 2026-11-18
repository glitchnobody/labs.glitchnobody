/* ══ Multi-line copy ═════════════════════════════
   A short message with a copy button that shows exactly what it copied: a
   highlight and an underline sweep through every line of the heading and the
   paragraph, then fade. Press Copy to try it.

   ── MEASURING THE LINES ──────────────────────
   A Range over each text node returns one rectangle per wrapped line
   (getClientRects). Rectangles on the same visual line are merged, so every
   line gets a box sized to its own text, not the full width. Lines are
   measured when you press Copy, and again if the block is resized or the
   fonts finish loading mid-sweep.

   ── THE SWEEP ────────────────────────────────
   Each box is an absolutely positioned element behind the text that grows
   with a CSS animation (scaleX from the start edge), delayed by its line
   index times the line delay. The underline runs slightly faster, so it
   leads and the highlight follows. Pressing again remounts the boxes, which
   restarts every animation cleanly with no stacking.

   ── HOLD, FADE, RESET ────────────────────────
   Timers fire a tick as each line lands and "Copied" when the last one does.
   After the hold, one opacity transition fades everything together. If the
   clipboard refuses, the sweep still plays, the text is selected and the
   button asks for Ctrl+C. With reduced motion the boxes fade in at once. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type MultilineCopyProps = {
  heading?: string;
  text?: string;
  /** ms each line takes to fill */
  speed?: number;
  /** ms between one line starting and the next */
  stagger?: number;
  /** seconds the highlights stay before fading */
  hold?: number;
  highlight?: "Selection" | "Accent" | "Ok" | "Ink";
  /** highlight corner in px */
  radius?: number;
  underline?: boolean;
  underlineWidth?: number;
  sound?: boolean;
  volume?: number;
  onSound?: Sound;
};

const DEFAULT_TEXT =
  "Hey! I'm using Labs to keep my projects in one place. Here's my invite link so you can join the workspace: labs.example/join/9F3K. It expires in 7 days, so jump in when you can.";
const COLORS = { Selection: "var(--pick)", Accent: "var(--pick)", Ok: "var(--ok)", Ink: "var(--fill-on)" };

type Line = { x: number; y: number; w: number; h: number };

export function MultilineCopy({
  heading = "Share your invite",
  text = DEFAULT_TEXT,
  speed = 320,
  stagger = 90,
  hold = 1.2,
  highlight = "Selection",
  radius = 4,
  underline = true,
  underlineWidth = 2,
  sound = true,
  volume = 70,
  onSound,
}: MultilineCopyProps) {
  const root = useRef<HTMLDivElement>(null);
  const hRef = useRef<HTMLHeadingElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  const timers = useRef<number[]>([]);
  const lastTick = useRef(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [run, setRun] = useState(0);
  const [fade, setFade] = useState(false);
  const [label, setLabel] = useState<"copy" | "copied" | "manual">("copy");
  const [live, setLive] = useState("");
  const [rtl, setRtl] = useState(false);
  const [mounted, setMounted] = useState(false); // iconify renders differently on server and client
  useEffect(() => setMounted(true), []);

  const play = (name: string, v: number, pitch = 1) => {
    if (!sound || !onSound) return;
    const now = performance.now();
    if (name === "tick" && now - lastTick.current < 30) return;
    if (name === "tick") lastTick.current = now;
    onSound(name, { volume: (v * volume) / 100, pitch });
  };

  const measure = useCallback((): Line[] => {
    const box = root.current?.getBoundingClientRect();
    if (!box) return [];
    const out: Line[] = [];
    for (const el of [hRef.current, pRef.current]) {
      const node = el?.firstChild;
      if (!el || !node) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0).sort((a, b) => a.top - b.top);
      const rows: { l: number; r: number; t: number; b: number }[] = [];
      for (const r of rects) {
        const row = rows[rows.length - 1];
        if (row && r.top < row.t + (row.b - row.t) / 2) {
          row.l = Math.min(row.l, r.left);
          row.r = Math.max(row.r, r.right);
        } else rows.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
      }
      for (const r of rows) out.push({ x: r.l - box.left, y: r.t - box.top, w: r.r - r.l, h: r.b - r.t });
    }
    return out;
  }, []);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const reset = useCallback(() => {
    clear();
    setLines([]);
    setFade(false);
    setLabel("copy");
  }, []);
  useEffect(() => clear, []);
  // changing the text mid-sweep cancels the sweep
  useEffect(reset, [heading, text, reset]);

  useLayoutEffect(() => {
    if (root.current) setRtl(getComputedStyle(root.current).direction === "rtl");
  }, []);

  // re-measure on resize and after fonts load, only while a sweep is showing
  useEffect(() => {
    if (!lines.length || !root.current) return;
    const again = () => setLines(measure());
    const ro = new ResizeObserver(again);
    ro.observe(root.current);
    document.fonts?.ready.then(again);
    return () => ro.disconnect();
  }, [lines.length, measure]);

  const copy = async () => {
    clear();
    const full = heading ? `${heading}\n\n${text}` : text;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ls = measure();
    const gap = reduced ? 30 : stagger;
    const dur = reduced ? 150 : speed;
    setFade(false);
    setLines(ls);
    setRun((n) => n + 1);
    let ok = true;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      ok = false;
    }
    // a second press during the await supersedes this one
    clear();
    ls.forEach((_, i) => after(i * gap + dur, () => play("tick", 0.45, 1 + 0.05 * i)));
    const total = (reduced ? 0 : Math.max(0, ls.length - 1) * gap) + dur;
    after(total, () => {
      if (ok) {
        setLabel("copied");
        setLive("Copied heading and message");
      } else {
        setLabel("manual");
        const sel = getSelection();
        if (sel && root.current) sel.selectAllChildren(root.current);
      }
    });
    const fadeAt = total + hold * 1000;
    after(fadeAt, () => setFade(true));
    after(Math.max(fadeAt + 300, total + (ok ? 1600 : 2000)), () => {
      setLines([]);
      setLabel("copy");
      setLive("");
    });
  };

  const color = COLORS[highlight];
  const style = {
    "--mlc-color": color,
    "--mlc-radius": `${radius}px`,
    "--mlc-ul": `${underlineWidth}px`,
  } as CSSProperties;

  return (
    <div ref={root} className="mlc" style={style} data-fade={fade || undefined} data-rtl={rtl || undefined}>
      <div className="mlc-hl" aria-hidden="true" key={run}>
        {lines.map((l, i) => {
          const pos = { left: l.x, top: l.y, width: l.w, height: l.h, "--d": `${i * stagger}ms`, "--s": `${speed}ms` } as CSSProperties;
          return (
            <span key={i} className="mlc-line" style={pos}>
              <span className="mlc-box" />
              {underline && <span className="mlc-ul" />}
            </span>
          );
        })}
      </div>
      <div className="mlc-top">
        <h3 className="mlc-heading" ref={hRef}>{heading}</h3>
        <button type="button" className="mlc-btn" aria-label="Copy message" data-state={label} onClick={copy}>
          <span className="mlc-icons">
            {mounted && <Icon icon="ph:copy-bold" width={14} className="mlc-i-copy" />}
            {mounted && <Icon icon="ph:check-bold" width={14} className="mlc-i-check" />}
          </span>
          <span className="mlc-labels">
            <span data-l="copy">Copy</span>
            <span data-l="copied">Copied</span>
            <span data-l="manual">Press Ctrl+C</span>
          </span>
        </button>
      </div>
      <div className="mlc-body">
        <p className="mlc-text" ref={pRef}>{text}</p>
      </div>
      <span className="mlc-live" role="status" aria-live="polite">{live}</span>
    </div>
  );
}
