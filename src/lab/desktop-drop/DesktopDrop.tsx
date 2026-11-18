/* ══ Desktop drop ═════════════════════════════════════
   A tiny desktop with a folder and a few files. Drag any file and all the
   files gather into a stack under the pointer; drop the stack on the
   folder and the files slide in while their tags pop up above it.
   Double-click the folder to pour the files back out.

   ── SPRINGS WITH LAG ─────────────────────────────────
   Every file has its own small spring that pulls its position, rotation
   and scale toward a target, all run in one requestAnimationFrame loop.
   The file you grab is stiff, so it stays glued to the pointer; the others
   are softer the further away they started, so they trail in one after
   another and settle into a slightly fanned pile with a count badge.

   ── DROPPING IN ──────────────────────────────────────
   When the stack's centre comes near the folder, the folder opens. Let go
   there and each file's target becomes the folder's mouth at a fifth of
   its size, a beat after the one before, and the files fade as they go in.
   Anywhere else, the targets go back to their home spots.

   ── TAGS ─────────────────────────────────────────────
   The files that went in show their tags above the folder, popping in one
   after another with a rising pitch. Pouring out reverses everything: the
   tags drop back and the files fly from the folder to their homes. */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPE } from "react";
import { Icon } from "@iconify/react";

const FILES = [
  { name: "Project brief", tag: "Planning", hue: "var(--pick)" },
  { name: "Research notes", tag: "Research", hue: "var(--hue-violet)" },
  { name: "Next steps", tag: "Notes", hue: "var(--ok)" },
  { name: "Moodboard", tag: "Design", hue: "var(--danger)" },
  { name: "Budget", tag: "Finance", hue: "var(--hue-orange)" },
];
const W = 320, ROT = [-4, 3, -2, 4, -3];

export type DesktopDropProps = {
  files?: number;
  iconSize?: number;
  labels?: boolean;
  tags?: "Pills" | "Dots" | "None";
  accent?: "Pick" | "Ink";
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};
type S = { x: number; y: number; vx: number; vy: number; s: number; r: number; o: number; tx: number; ty: number; ts: number; tr: number; to: number; k: number; at: number };

export function DesktopDrop({ files = 3, iconSize = 44, labels = true, tags = "Pills", accent = "Pick", sound = true, volume = 70, onSound }: DesktopDropProps) {
  const n = Math.max(2, Math.min(5, Math.round(files)));
  const H = Math.round(iconSize * 1.25 + 44), fy = Math.round(iconSize * 0.5 + 4);
  const folder = { x: 44, y: fy };
  const homes = Array.from({ length: n }, (_, i) => ({ x: 120 + ((W - 160) / (n - 1)) * i, y: fy }));
  const [, force] = useState(0);
  const [inside, setInside] = useState<number[]>([]);
  const [shown, setShown] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const [hot, setHot] = useState(false);
  const [say, setSay] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const sim = useRef<S[]>([]);
  const raf = useRef(0);
  const press = useRef<{ i: number; x: number; y: number; started: boolean; moving: number[] } | null>(null);
  const lastClick = useRef(0), lastSlide = useRef(0), timers = useRef<number[]>([]);
  const reduced = useRef(false);
  const live = useRef({ sound, volume, onSound, inside });
  live.current = { sound, volume, onSound, inside };

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    const l = live.current;
    if (l.sound && l.onSound) l.onSound(name, { ...o, volume: (o.volume ?? 1) * (l.volume / 100) });
  };
  const slide = () => { const t = performance.now(); if (t - lastSlide.current > 250) { lastSlide.current = t; snd("slide", { volume: 0.55 }); } };
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)); };

  /* (re)seed the springs when the file count or size changes */
  const seed = () => homes.map((h) => ({ x: h.x, y: h.y, vx: 0, vy: 0, s: 1, r: 0, o: 1, tx: h.x, ty: h.y, ts: 1, tr: 0, to: 1, k: 300, at: 0 }));
  if (sim.current.length !== n) sim.current = seed();
  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    sim.current = seed();
    setInside([]); setShown([]);
    force((v) => v + 1);
  }, [n, iconSize]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelAnimationFrame(raf.current); timers.current.forEach(clearTimeout); }, []);

  const kick = () => {
    if (raf.current) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      let busy = false;
      for (const f of sim.current) {
        if (now < f.at) { busy = true; continue; }
        if (reduced.current) { f.x = f.tx; f.y = f.ty; f.s = f.ts; f.r = f.tr; f.o = f.to; continue; }
        const c = 2 * Math.sqrt(f.k) * 0.8;
        f.vx += (-f.k * (f.x - f.tx) - c * f.vx) * dt; f.vy += (-f.k * (f.y - f.ty) - c * f.vy) * dt;
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.s += (f.ts - f.s) * Math.min(1, dt * 14); f.r += (f.tr - f.r) * Math.min(1, dt * 12); f.o += (f.to - f.o) * Math.min(1, dt * 12);
        if (Math.abs(f.x - f.tx) + Math.abs(f.y - f.ty) > 0.3 || Math.abs(f.vx) + Math.abs(f.vy) > 2 || Math.abs(f.s - f.ts) > 0.01 || Math.abs(f.o - f.to) > 0.01) busy = true;
      }
      force((v) => v + 1);
      raf.current = busy || press.current?.started ? requestAnimationFrame(step) : 0;
    };
    raf.current = requestAnimationFrame(step);
  };

  const local = (e: { clientX: number; clientY: number }) => {
    const r = root.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const nearFolder = (x: number, y: number) => Math.abs(x - folder.x) < iconSize / 2 + 24 && Math.abs(y - folder.y) < iconSize / 2 + 24;

  function stackTo(x: number, y: number, moving: number[], lead: number) {
    moving.forEach((i, j) => {
      const f = sim.current[i];
      const d = moving.indexOf(lead);
      const order = j < d ? j + 1 : j === d ? 0 : j;
      f.tx = x + order * 3; f.ty = y - order * 3; f.tr = order ? ROT[order % ROT.length] : 0; f.ts = 1;
      f.k = i === lead ? 2000 : Math.max(60, 260 - Math.abs(homes[i].x - homes[lead].x) * 1.2);
    });
  }

  const onDown = (i: number) => (e: RPE<HTMLButtonElement>) => {
    if (inside.includes(i)) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    const p = local(e);
    press.current = { i, x: p.x, y: p.y, started: false, moving: homes.map((_, k) => k).filter((k) => !inside.includes(k)) };
  };
  const onMove = (e: RPE<HTMLButtonElement>) => {
    const pr = press.current;
    if (!pr) return;
    const p = local(e);
    if (!pr.started) {
      if (Math.hypot(p.x - pr.x, p.y - pr.y) < 4) return;
      pr.started = true;
      setDragging(true);
      slide();
      pr.moving.filter((k) => k !== pr.i).forEach((_, j) => later(60 + j * 60, () => snd("tick", { volume: 0.35, pitch: 1 + 0.06 * j })));
    }
    stackTo(p.x, p.y, pr.moving, pr.i);
    setHot(nearFolder(p.x, p.y));
    kick();
  };
  const onUp = (e: RPE<HTMLButtonElement>) => {
    const pr = press.current;
    press.current = null;
    if (!pr?.started) return;
    setDragging(false);
    const p = local(e);
    setHot(false);
    if (nearFolder(p.x, p.y)) {
      const now = performance.now();
      pr.moving.forEach((k, j) => {
        const f = sim.current[k];
        Object.assign(f, { tx: folder.x, ty: folder.y - 4, ts: 0.2, tr: 0, to: 0, k: 220, at: now + j * 40 });
      });
      const next = [...inside, ...pr.moving];
      setInside(next);
      setSay(`${pr.moving.length} files moved to Docs`);
      pr.moving.forEach((k, j) => later(320 + j * 80, () => { setShown((s) => [...s, k]); if (tags !== "None") snd("pop", { volume: 0.4, pitch: 1 + 0.1 * j }); }));
    } else {
      pr.moving.forEach((k) => Object.assign(sim.current[k], { tx: homes[k].x, ty: homes[k].y, tr: 0, ts: 1, k: 260 }));
    }
    kick();
  };

  function pour() {
    if (!inside.length) return;
    setShown([]);
    const now = performance.now();
    inside.forEach((k, j) => {
      const f = sim.current[k];
      Object.assign(f, { x: folder.x, y: folder.y, s: 0.2, o: 0, tx: homes[k].x, ty: homes[k].y, ts: 1, to: 1, tr: 0, k: 200, at: now + 120 + j * 60, vx: 0, vy: -200 });
    });
    setInside([]);
    setSay("Files restored");
    slide();
    kick();
  }

  const accentC = accent === "Ink" ? "var(--fill-on)" : "var(--pick)";
  const pressed = press.current?.started ? press.current : null;
  const lead = pressed ? sim.current[pressed.i] : null;

  return (
    <div className="dsk" ref={root} style={{ "--dsk-i": `${iconSize}px`, "--dsk-acc": accentC, width: W, height: H } as CSSProperties} data-labels={labels} data-dragging={dragging}>
      <div className="dsk-tags" style={{ left: folder.x, bottom: H - folder.y + iconSize / 2 + 8 }} data-kind={tags.toLowerCase()} aria-hidden>
        {tags !== "None" && shown.map((k) => (
          <span key={k} className="dsk-tag" style={{ "--c": FILES[k].hue } as CSSProperties}>
            <i />{tags === "Pills" && FILES[k].tag}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="dsk-folder"
        data-hot={hot}
        style={{ left: folder.x, top: folder.y }}
        aria-label={`Docs folder${inside.length ? `, ${inside.length} files. Press Enter to pour them out` : ""}`}
        onClick={() => {
          const t = performance.now();
          if (t - lastClick.current < 320) { lastClick.current = 0; pour(); } else lastClick.current = t;
        }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pour(); } }}
      >
        <Icon icon={hot ? "ph:folder-open-fill" : "ph:folder-fill"} width={iconSize} height={iconSize} />
        {labels && <span className="dsk-label">Docs</span>}
      </button>
      {homes.map((_, i) => {
        const f = sim.current[i];
        if (!f) return null;
        const moving = !!pressed && pressed.moving.includes(i);
        return (
          <button
            key={i}
            type="button"
            className="dsk-file"
            data-moving={moving}
            data-in={inside.includes(i)}
            tabIndex={inside.includes(i) ? -1 : 0}
            aria-label={`${FILES[i].name}, ${FILES[i].tag}`}
            style={{ left: f.x, top: f.y, transform: `translate(-50%, -${iconSize * 0.4}px) rotate(${f.r}deg) scale(${f.s})`, opacity: f.o, zIndex: moving ? (i === pressed?.i ? 10 : 5) : 1 }}
            onPointerDown={onDown(i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <Icon icon="ph:file-text-fill" width={iconSize * 0.8} height={iconSize * 0.8} />
            {labels && <span className="dsk-label">{FILES[i].name}</span>}
          </button>
        );
      })}
      {pressed && lead && pressed.moving.length > 1 && (
        <span className="dsk-badge" style={{ left: lead.x + iconSize * 0.4, top: lead.y - iconSize * 0.4 - 6 }}>{pressed.moving.length}</span>
      )}
      <span className="dsk-sr" aria-live="polite">{say}</span>
    </div>
  );
}
