/* ══ Radial toolkit ═══════════════════════════════════
   A radial tool picker on a canvas. Press and hold anywhere and a ring of
   tools blooms around the pointer; sweep toward a tool and let go to pick
   it. A quick click pins the ring open instead, letters pick tools
   directly, and Alt+W opens the ring from the keyboard.

   ── AIMING BY ANGLE ──────────────────────────────────
   Only the direction matters. The angle from the ring's centre to the
   pointer picks the tool whose slot is nearest, so a short flick works as
   well as reaching the button. Inside a small dead zone around the centre
   nothing is selected, and letting go there cancels.

   ── THE WEDGE ────────────────────────────────────────
   A soft sector points from the centre to the selected tool. It is drawn
   once pointing up and rotated with a CSS transition; the rotation is kept
   as a running total that always takes the short way round, so going from
   the last tool to the first never spins the long way.

   ── BLOOMS ───────────────────────────────────────────
   Each button knows its place in the order and its slot's position. Scale
   grows the whole ring; Stagger delays each button by its order; Spin-in
   starts each button at the centre turned back 40° so it travels along a
   slight spiral. Closing plays the same transitions faster, in reverse. */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPE } from "react";
import { Icon } from "@iconify/react";

const TOOLS = [
  { name: "Move Tool", icon: "ph:cursor-fill", key: "V" },
  { name: "Pen Tool", icon: "ph:pen-nib-fill", key: "P" },
  { name: "Text", icon: "ph:text-t-bold", key: "T" },
  { name: "Actions", icon: "ph:squares-four-fill", key: "" },
  { name: "Comment", icon: "ph:chat-circle-fill", key: "C" },
  { name: "Objects", icon: "ph:shapes-fill", key: "O" },
  { name: "Frame", icon: "ph:hash-bold", key: "F" },
];
const DEAD = 24;

export type RadialToolkitProps = {
  radius?: number;
  tools?: number;
  labels?: boolean;
  badges?: boolean;
  bloom?: "Scale" | "Stagger" | "Spin-in";
  speed?: number;
  wedge?: boolean;
  wedgeWidth?: number;
  accent?: "Pick" | "Ink";
  value?: string;
  onChange?: (tool: string) => void;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

type Ring = { x: number; y: number; pinned: boolean; state: "open" | "closing" };

export function RadialToolkit({
  radius = 92, tools = 7, labels = true, badges = true, bloom = "Stagger", speed = 280, wedge = true, wedgeWidth = 40,
  accent = "Pick", value = "Move Tool", onChange, sound = true, volume = 70, onSound,
}: RadialToolkitProps) {
  const n = Math.max(4, Math.min(7, Math.round(tools)));
  const list = TOOLS.slice(0, n);
  const step = 360 / (n + 1), j0 = Math.round((n + 1) / 2);
  const angles = list.map((_, i) => (180 + (((j0 - 1 + i) % n) + 1) * step) % 360);
  const [cur, setCur] = useState(() => Math.max(0, list.findIndex((t) => t.name === value)));
  const [ring, setRing] = useState<Ring | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [rot, setRot] = useState(0);
  const [say, setSay] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; t: number; id: number; timer: number; opened: boolean } | null>(null);
  const lastTick = useRef(0), closeT = useRef(0);
  const live = useRef({ ring, sel });
  live.current = { ring, sel };

  useEffect(() => { const i = list.findIndex((t) => t.name === value); if (i >= 0) setCur(i); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (cur >= n) setCur(0); }, [n, cur]);
  useEffect(() => () => clearTimeout(closeT.current), []);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  const clampC = (x: number, y: number) => {
    const r = root.current!.getBoundingClientRect(), m = radius + 24;
    return { x: Math.min(r.width - m, Math.max(m, x)), y: Math.min(r.height - m, Math.max(m, y)) };
  };

  function open(x: number, y: number, pinned: boolean) {
    clearTimeout(closeT.current);
    setRing({ ...clampC(x, y), pinned, state: "open" });
    setSel(null);
    snd("expand", { volume: 0.5 });
  }
  function close(pick: number | null) {
    setRing((r) => (r ? { ...r, state: "closing" } : r));
    clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setRing(null), Math.max(100, speed * 0.6));
    if (pick === null) { snd("collapse", { volume: 0.4 }); return; }
    choose(pick);
  }
  function choose(i: number) {
    setCur(i);
    onChange?.(list[i].name);
    setSay(`${list[i].name} selected`);
    snd("pop", { volume: 0.6 });
  }
  function aim(i: number | null) {
    if (i === live.current.sel) return;
    setSel(i);
    if (i === null) return;
    const target = angles[i];
    setRot((r) => r + ((((target - r) % 360) + 540) % 360) - 180);
    const t = performance.now();
    if (t - lastTick.current > 30) { lastTick.current = t; snd("tick", { volume: 0.4, pitch: 0.9 + 0.05 * i }); }
  }
  function aimAt(cx: number, cy: number) {
    const r = live.current.ring;
    if (!r) return;
    const dx = cx - r.x, dy = cy - r.y;
    if (Math.hypot(dx, dy) < DEAD) return aim(null);
    const a = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    let best = 0, bd = 999;
    angles.forEach((t, i) => { const d = Math.abs(((a - t + 540) % 360) - 180); if (d < bd) { bd = d; best = i; } });
    aim(best);
  }

  const local = (e: { clientX: number; clientY: number }) => {
    const r = root.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: RPE<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const p = local(e);
    if (ring?.state === "open" && ring.pinned) {
      aimAt(p.x, p.y);
      close(live.current.sel);
      return;
    }
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    const y = e.pointerType === "touch" ? p.y - 40 : p.y;
    const timer = window.setTimeout(() => { if (press.current) { press.current.opened = true; open(p.x, y, false); } }, 120);
    press.current = { x: p.x, y, t: performance.now(), id: e.pointerId, timer, opened: false };
  };
  const onMove = (e: RPE<HTMLDivElement>) => {
    const p = local(e), pr = press.current;
    if (pr && !pr.opened && Math.hypot(p.x - pr.x, p.y - pr.y) > 6) {
      clearTimeout(pr.timer); pr.opened = true; open(pr.x, pr.y, false);
      return;
    }
    if (ring?.state === "open" && (pr?.opened || ring.pinned)) aimAt(p.x, p.y);
  };
  const onUp = () => {
    const pr = press.current;
    if (!pr) return;
    clearTimeout(pr.timer);
    press.current = null;
    if (!pr.opened) { open(pr.x, pr.y, true); return; }
    close(live.current.sel);
  };

  /* letters pick, Alt+W opens, Esc cancels: only while the pointer or focus is inside */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = root.current;
      if (!el || e.metaKey || e.ctrlKey) return;
      const scope = el.closest("[data-shortcut-scope]") ?? el;
      if (!scope.matches(":hover") && !scope.contains(document.activeElement)) return;
      const r = live.current.ring;
      if (e.altKey && e.code === "KeyW") {
        e.preventDefault();
        const b = el.getBoundingClientRect();
        openRef.current(b.width / 2, b.height / 2, true);
        return;
      }
      if (e.altKey) return;
      if (e.key === "Escape" && r?.state === "open") { e.preventDefault(); closeRef.current(null); return; }
      if (r?.state === "open") {
        const s = live.current.sel;
        const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        const order = angles.map((a, i) => [a, i]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
        if (d) {
          e.preventDefault();
          const at = s === null ? (d > 0 ? -1 : 0) : order.indexOf(s);
          aimRef.current(order[(at + d + n) % n]);
          return;
        }
        if (e.key === "Enter" && s !== null) { e.preventDefault(); closeRef.current(s); return; }
      }
      const i = list.findIndex((t) => t.key && t.key === e.key.toUpperCase());
      if (i >= 0 && !(e.target instanceof HTMLInputElement)) { if (r?.state === "open") closeRef.current(i); else chooseRef.current(i); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const openRef = useRef(open), closeRef = useRef(close), aimRef = useRef(aim), chooseRef = useRef(choose);
  openRef.current = open; closeRef.current = close; aimRef.current = aim; chooseRef.current = choose;

  const tool = list[Math.min(cur, n - 1)];
  const half = wedgeWidth / 2, ri = 32, ro = radius;
  const pt = (a: number, r: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return `${(Math.cos(t) * r).toFixed(2)} ${(Math.sin(t) * r).toFixed(2)}`;
  };
  const sector = `M${pt(-half, ri)} L${pt(-half, ro)} A${ro} ${ro} 0 0 1 ${pt(half, ro)} L${pt(half, ri)} A${ri} ${ri} 0 0 0 ${pt(-half, ri)}Z`;
  const arc = `M${pt(-half, ro)} A${ro} ${ro} 0 0 1 ${pt(half, ro)}`;
  const box = radius + 30;

  return (
    <div
      ref={root}
      className="rtk"
      tabIndex={0}
      role="application"
      aria-label="Canvas. Hold to pick a tool, or press a tool's letter. Alt+W opens tools."
      data-accent={accent.toLowerCase()}
      data-bloom={bloom.toLowerCase()}
      style={{ "--rtk-ms": `${speed}ms`, "--rtk-r": `${radius}px` } as CSSProperties}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={(e) => { if (e.pointerType === "mouse" && ring?.state === "open" && ring.pinned) close(null); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {!ring && <span className="rtk-hint">Hold to pick a tool</span>}
      {ring && (
        <div className="rtk-ring" data-state={ring.state} role="menu" aria-label="Tools" style={{ left: ring.x, top: ring.y }}>
          <svg className="rtk-svg" viewBox={`${-box} ${-box} ${box * 2} ${box * 2}`} style={{ width: box * 2, height: box * 2 }} aria-hidden>
            <defs>
              <radialGradient id="rtk-g" cx="0" cy="0" r={ro} gradientUnits="userSpaceOnUse">
                <stop offset={ri / ro} className="rtk-g0" />
                <stop offset="1" className="rtk-g1" />
              </radialGradient>
            </defs>
            <circle className="rtk-track" r={radius} />
            {wedge && sel !== null && (
              <g className="rtk-wedge" style={{ transform: `rotate(${rot}deg)` }}>
                <path d={sector} fill="url(#rtk-g)" />
                <path className="rtk-arc" d={arc} />
              </g>
            )}
            <circle className="rtk-core" r={30.5} />
          </svg>
          {list.map((t, i) => {
            const a = angles[i], rad = (a * Math.PI) / 180;
            const x = Math.sin(rad) * radius, y = -Math.cos(rad) * radius;
            const side = Math.sin(rad) > 0.2 ? "r" : Math.sin(rad) < -0.2 ? "l" : Math.cos(rad) > 0 ? "t" : "b";
            const order = Math.floor(a / step + 0.01);
            return (
              <div key={t.name} className="rtk-item" data-on={sel === i} data-side={side}
                style={{ "--x": `${x}px`, "--y": `${y}px`, "--i": order, "--n": n } as CSSProperties}>
                <span className="rtk-btn" role="menuitemradio" aria-checked={sel === i} aria-label={t.name}>
                  <Icon icon={t.icon} width={20} height={20} />
                </span>
                {labels && (
                  <span className="rtk-label">
                    {badges && t.key && <kbd>{t.key}</kbd>}
                    <span>{t.name}</span>
                  </span>
                )}
              </div>
            );
          })}
          <div className="rtk-item rtk-more" data-side="b" style={{ "--x": "0px", "--y": `${radius}px`, "--i": n, "--n": n } as CSSProperties}>
            <span className="rtk-label">More <Icon icon="ph:dots-three-bold" width={14} height={14} /></span>
          </div>
        </div>
      )}
      <div className="rtk-pill" aria-hidden>
        <span key={tool.name} className="rtk-cur">
          <Icon icon={tool.icon} width={16} height={16} />
          <b>{tool.name}</b>
          {tool.key && <kbd>{tool.key}</kbd>}
        </span>
      </div>
      <span className="rtk-sr" aria-live="polite">{say}</span>
    </div>
  );
}
