/* ══ Position inspector ═══════════════════════════════
   A design tool's position panel wired to a little artboard. Press the align
   buttons and the shape springs to the edge while X and Y count along; drag
   the X, Y or angle label to scrub the value, click a value to type one, and
   rotate or flip the shape with the buttons.

   ── ONE SPRING FOR EVERYTHING ────────────────────────
   Position, angle and the two flip scales share one hand-written spring that
   runs in requestAnimationFrame. A move sets new targets and the spring
   carries every value there; the Bounce setting lowers the damping so the
   shape overshoots and settles. The fields show the spring's current
   values, so the numbers count in step with the motion.

   ── SCRUBBING ────────────────────────────────────────
   Dragging a label turns pixels into units: the Scrub setting per pixel,
   ten times faster with Shift and ten times finer with Alt. With snapping
   on, X and Y land on multiples of 8 and the angle on 15° steps, and a tick
   plays each time the value crosses a step. The shape follows directly,
   without the spring, and stays inside the artboard.

   ── THE ARTBOARD ─────────────────────────────────────
   The preview stands for a 1200 by 300 unit artboard drawn at a smaller
   scale, so the numbers look like a real design file's while the frame fits
   on a card. */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPE } from "react";
import { Icon } from "@iconify/react";

type Shape = "Rectangle" | "Circle" | "Text";
type V = { x: number; y: number; a: number; sx: number; sy: number };
const AW = 1200, AH = 300;
const SIZE: Record<Shape, [number, number]> = { Rectangle: [240, 160], Circle: [160, 160], Text: [200, 64] };
const HZ = ["Left", "Right", "Left & right", "Center", "Scale"];
const VT = ["Top", "Bottom", "Top & bottom", "Center", "Scale"];

export type PositionInspectorProps = {
  frame?: boolean;
  shape?: Shape;
  bounce?: number;
  snap?: boolean;
  sensitivity?: number;
  density?: "Comfortable" | "Compact";
  accent?: "Pick" | "Ink";
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function PositionInspector({
  frame = true, shape = "Rectangle", bounce = 30, snap = true, sensitivity = 4, density = "Comfortable", accent = "Pick",
  sound = true, volume = 70, onSound,
}: PositionInspectorProps) {
  const [w, h] = SIZE[shape];
  const [v, setV] = useState<V>({ x: (AW - w) / 2, y: (AH - h) / 2, a: 0, sx: 1, sy: 1 });
  const [edit, setEdit] = useState<"x" | "y" | "a" | null>(null);
  const [menu, setMenu] = useState<"h" | "v" | null>(null);
  const [hz, setHz] = useState("Center");
  const [vt, setVt] = useState("Top");
  const [flash, setFlash] = useState("");
  const [say, setSay] = useState("");
  const cur = useRef(v), target = useRef(v), vel = useRef<V>({ x: 0, y: 0, a: 0, sx: 0, sy: 0 });
  const raf = useRef(0), lastTick = useRef(0), lastStep = useRef(0);
  const scrub = useRef<{ k: "x" | "y" | "a"; x0: number; v0: number } | null>(null);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { go({ x: clamp(target.current.x, 0, AW - w), y: clamp(target.current.y, 0, AH - h) }); }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };
  const put = (n: V) => { cur.current = n; setV(n); };

  function go(t: Partial<V>) {
    target.current = { ...target.current, ...t };
    cancelAnimationFrame(raf.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const from = { ...cur.current }, to = target.current, t0 = performance.now();
      const step = (now: number) => {
        const e = Math.min(1, (now - t0) / 120);
        put(Object.fromEntries(Object.keys(to).map((k) => [k, from[k as keyof V] + (to[k as keyof V] - from[k as keyof V]) * e])) as V);
        if (e < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
      return;
    }
    const k = 260, c = 2 * Math.sqrt(k) * (1 - 0.7 * (bounce / 100));
    let t0 = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - t0) / 1000);
      t0 = now;
      const n = { ...cur.current }, to = target.current, vv = vel.current;
      let done = true;
      for (const key of ["x", "y", "a", "sx", "sy"] as const) {
        const scale = key === "sx" || key === "sy" ? 100 : 1;
        vv[key] += (-k * (n[key] - to[key]) - c * vv[key]) * dt;
        n[key] += vv[key] * dt;
        if (Math.abs(n[key] - to[key]) * scale > 0.3 || Math.abs(vv[key]) * scale > 3) done = false;
      }
      if (done) { put({ ...to }); return; }
      put(n);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  const press = (id: string) => { setFlash(id); setTimeout(() => setFlash((f) => (f === id ? "" : f)), 180); snd("tick", { volume: 0.5, pitch: 1.1 }); };

  function align(axis: "x" | "y", where: 0 | 0.5 | 1, id: string) {
    const max = axis === "x" ? AW - w : AH - h, to = Math.round(max * where);
    if (Math.round(target.current[axis]) === to) {
      press(id);
      vel.current[axis] += where === 1 ? -120 : 120;
      go({});
      return;
    }
    snd("tick", { volume: 0.5, pitch: 1.1 });
    go({ [axis]: to });
    setSay(`${axis.toUpperCase()} ${to}`);
  }

  const limits = (k: "x" | "y" | "a") => (k === "x" ? [0, AW - w] : k === "y" ? [0, AH - h] : [-360, 360]);
  function setDirect(k: "x" | "y" | "a", raw: number) {
    const [lo, hi] = limits(k);
    const step = k === "a" ? 15 : 8;
    const val = clamp(snap ? Math.round(raw / step) * step : Math.round(raw), lo, hi);
    cancelAnimationFrame(raf.current);
    target.current = { ...target.current, [k]: val };
    vel.current[k] = 0;
    put({ ...cur.current, [k]: val });
    const bucket = Math.floor(val / (snap ? step : 8));
    const now = performance.now();
    if (bucket !== lastStep.current && now - lastTick.current > 30) {
      lastStep.current = bucket; lastTick.current = now;
      snd("tick", { volume: 0.3, pitch: 0.9 + 0.3 * ((val - lo) / (hi - lo || 1)) });
    }
  }

  /* move and up are heard on the window so the scrub keeps going when the pointer leaves the label */
  const scrubber = (k: "x" | "y" | "a") => ({
    onPointerDown: (e: RPE<HTMLElement>) => {
      e.preventDefault();
      scrub.current = { k, x0: e.clientX, v0: target.current[k] };
      lastStep.current = Math.floor(target.current[k] / (k === "a" ? 15 : 8));
      const move = (ev: PointerEvent) => {
        const s = scrub.current;
        if (!s) return;
        const mul = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
        const per = k === "a" ? sensitivity * 0.9 : sensitivity;
        setDirect(k, s.v0 + (ev.clientX - s.x0) * per * mul);
      };
      const up = () => {
        scrub.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
  });

  const field = (k: "x" | "y" | "a", label: React.ReactNode, name: string) => {
    const val = Math.round(v[k]);
    return (
      <div className="psi-field" role="spinbutton" aria-label={name} aria-valuenow={Math.round(target.current[k])} tabIndex={edit === k ? -1 : 0}
        onKeyDown={(e) => {
          if (edit) return;
          if (e.key === "Enter") { setEdit(k); return; }
          const d = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const [lo, hi] = limits(k);
          const n = clamp(Math.round(target.current[k]) + d * (e.shiftKey ? 10 : 1), lo, hi);
          cancelAnimationFrame(raf.current);
          target.current = { ...target.current, [k]: n };
          put({ ...cur.current, [k]: n });
        }}>
        <span className="psi-lab" {...scrubber(k)}>{label}</span>
        {edit === k ? (
          <input
            className="psi-in"
            autoFocus
            defaultValue={Math.round(target.current[k])}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEdit(null);
              if (e.key === "Enter") {
                const n = parseFloat(e.currentTarget.value);
                if (!Number.isNaN(n)) { const [lo, hi] = limits(k); go({ [k]: clamp(n, lo, hi) }); }
                setEdit(null);
              }
            }}
            onBlur={() => setEdit(null)}
          />
        ) : (
          <span className="psi-val" onClick={() => setEdit(k)}>{k === "a" ? `${val}°` : val}</span>
        )}
      </div>
    );
  };

  const mx = AW - w, my = AH - h, tx = Math.round(target.current.x), ty = Math.round(target.current.y);
  const on = { hl: tx === 0, hc: tx === Math.round(mx / 2), hr: tx === mx, vt: ty === 0, vc: ty === Math.round(my / 2), vb: ty === my };
  const btn = (id: string, icon: string, label: string, onClick: () => void, active = false) => (
    <button type="button" key={id} className="psi-btn" data-on={active} data-flash={flash === id} aria-label={label} onClick={onClick}>
      <Icon icon={icon} width={16} height={16} />
    </button>
  );
  const lines = {
    l: hz === "Left" || hz === "Left & right", r: hz === "Right" || hz === "Left & right", ch: hz === "Center",
    t: vt === "Top" || vt === "Top & bottom", b: vt === "Bottom" || vt === "Top & bottom", cv: vt === "Center",
  };
  const dd = (which: "h" | "v") => {
    const list = which === "h" ? HZ : VT, val = which === "h" ? hz : vt, setter = which === "h" ? setHz : setVt;
    return (
      <div className="psi-dd-wrap">
        <button type="button" className="psi-dd" aria-haspopup="listbox" aria-expanded={menu === which}
          onClick={() => { setMenu(menu === which ? null : which); snd(menu === which ? "collapse" : "expand", { volume: 0.4 }); }}>
          <Icon icon={which === "h" ? "ph:arrows-in-line-horizontal-bold" : "ph:arrows-in-line-vertical-bold"} width={14} height={14} />
          <span>{val}</span>
          <Icon icon="ph:caret-down-bold" width={12} height={12} />
        </button>
        {menu === which && (
          <ul className="psi-menu" role="listbox">
            {list.map((o) => (
              <li key={o} role="option" aria-selected={o === val} tabIndex={0}
                onClick={() => { setter(o); setMenu(null); snd("collapse", { volume: 0.4 }); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setter(o); setMenu(null); snd("collapse", { volume: 0.4 }); }
                  if (e.key === "Escape") { setMenu(null); snd("collapse", { volume: 0.4 }); }
                  if (e.key === "ArrowDown") (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
                  if (e.key === "ArrowUp") (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
                }}>
                {o}
                {o === val && <Icon icon="ph:check-bold" width={12} height={12} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const style = { "--psi-sw": `${(w / AW) * 100}%`, "--psi-sh": `${(h / AH) * 100}%` } as CSSProperties;

  return (
    <div className="psi" style={style} data-density={density.toLowerCase()} data-accent={accent.toLowerCase()}>
      {frame && (
        <div className="psi-frame" aria-hidden>
          <div
            className="psi-shape"
            data-shape={shape.toLowerCase()}
            style={{ left: `${(v.x / AW) * 100}%`, top: `${(v.y / AH) * 100}%`, transform: `rotate(${v.a}deg) scale(${v.sx}, ${v.sy})` }}
          >
            {shape === "Text" && <span>Label</span>}
            <i /><i /><i /><i />
          </div>
        </div>
      )}
      <div className="psi-panel psi-bar">
        <div className="psi-group" role="toolbar" aria-label="Horizontal align">
          {btn("hl", "ph:align-left-bold", "Align left", () => align("x", 0, "hl"), on.hl)}
          {btn("hc", "ph:align-center-horizontal-bold", "Align horizontal centre", () => align("x", 0.5, "hc"), on.hc)}
          {btn("hr", "ph:align-right-bold", "Align right", () => align("x", 1, "hr"), on.hr)}
        </div>
        <div className="psi-group" role="toolbar" aria-label="Vertical align">
          {btn("vt", "ph:align-top-bold", "Align top", () => align("y", 0, "vt"), on.vt)}
          {btn("vc", "ph:align-center-vertical-bold", "Align vertical centre", () => align("y", 0.5, "vc"), on.vc)}
          {btn("vb", "ph:align-bottom-bold", "Align bottom", () => align("y", 1, "vb"), on.vb)}
        </div>
        <div className="psi-group" role="toolbar" aria-label="Distribute">
          {btn("d1", "ph:text-align-justify-bold", "Tidy up", () => press("d1"))}
          {btn("d2", "ph:rows-bold", "Distribute vertically", () => press("d2"))}
          {btn("d3", "ph:columns-bold", "Distribute horizontally", () => press("d3"))}
        </div>
        <div className="psi-group">
          {btn("rot", "ph:arrow-clockwise-bold", "Rotate 90°", () => { snd("tick", { volume: 0.5, pitch: 1.1 }); go({ a: Math.round(target.current.a) + 90 }); })}
          {btn("fh", "ph:flip-horizontal-bold", "Flip horizontal", () => { snd("tick", { volume: 0.5, pitch: 1.1 }); go({ sx: -target.current.sx }); })}
          {btn("fv", "ph:flip-vertical-bold", "Flip vertical", () => { snd("tick", { volume: 0.5, pitch: 1.1 }); go({ sy: -target.current.sy }); })}
        </div>
      </div>
      <div className="psi-panel psi-grid">
        {field("x", "X", "X position")}
        {field("y", "Y", "Y position")}
        {field("a", <Icon icon="ph:angle-bold" width={16} height={16} />, "Rotation")}
        <div className="psi-cons" role="group" aria-label="Constraints">
          <div className="psi-box">
            {(["t", "b", "l", "r"] as const).map((s) => (
              <button type="button" key={s} className={`psi-ln psi-ln-${s}`} data-on={lines[s]} aria-label={`Constrain ${{ t: "top", b: "bottom", l: "left", r: "right" }[s]}`}
                onClick={() => { press(`c${s}`); s === "t" || s === "b" ? setVt(s === "t" ? "Top" : "Bottom") : setHz(s === "l" ? "Left" : "Right"); }} />
            ))}
            <button type="button" className="psi-ln psi-ln-ch" data-on={lines.ch} aria-label="Constrain horizontal centre" onClick={() => { press("cch"); setHz("Center"); }} />
            <button type="button" className="psi-ln psi-ln-cv" data-on={lines.cv} aria-label="Constrain vertical centre" onClick={() => { press("ccv"); setVt("Center"); }} />
          </div>
        </div>
        {dd("h")}{dd("v")}
      </div>
      <span className="psi-sr" aria-live="polite">{say}</span>
    </div>
  );
}
