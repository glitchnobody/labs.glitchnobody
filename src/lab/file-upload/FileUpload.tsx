/* ══ File upload ══════════════════════════════════════
   A one-file drop zone with a simulated upload. Drag a demo file chip, or a
   real file from your desktop, into the zone: a progress bar fills with a
   rolling time estimate, turns liquid while the file is processed, and
   pinches off a droplet that becomes a check mark. Change restarts the
   upload, Remove empties the zone, and a second file is refused.

   ── DRAGGING WITH POINTER EVENTS ─────────────────────
   The demo chips are dragged with pointer events rather than the browser's
   drag and drop, so they lift, tilt and follow the pointer exactly. A copy
   of the chip follows the pointer while the original dims; let go over the
   zone and the file drops in, anywhere else and a small spring flies the
   copy home. Real files use the HTML drag events instead. Nothing is sent
   anywhere: the progress is made up.

   ── A LIQUID BAR ─────────────────────────────────────
   The bar is an SVG shape rebuilt every frame from a thickness function:
   a steady line whose thickness is raised by a bell curve. While the file
   is processed, the bell travels from left to right like a drop of ink
   running along a wire. At the end it detaches as a droplet that hops to
   the status spot and draws itself as a check mark.

   ── SOUND THAT FOLLOWS ───────────────────────────────
   A soft hum loops during the upload with its pitch rising with progress,
   and stops with a chime when the check lands. */
import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent as RPE } from "react";
import { Icon } from "@iconify/react";

type F = { name: string; mb: number; icon: string; tone: string };
const DEMO: F[] = [
  { name: "portfolio.pdf", mb: 12.6, icon: "ph:file-pdf-fill", tone: "danger" },
  { name: "cover.png", mb: 3.4, icon: "ph:file-image-fill", tone: "pick" },
];
const BW = 256, BH = 18, MID = 9;

export type FileUploadProps = {
  speed?: number;
  fail?: number;
  color?: "Danger" | "Pick" | "Ink";
  details?: boolean;
  onUpload?: (file: { name: string; mb: number }) => void;
  onRemove?: () => void;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;
};
type Loop = { stop: (ms?: number) => void; setPitch: (n: number) => void; setVolume: (n: number) => void } | undefined;
type Phase = "up" | "proc" | "drop" | "done" | "fail";

/* the bar's outline: a line of thickness t(x) with round ends */
function barPath(len: number, t: (x: number) => number) {
  if (len < 1) return "";
  const n = 48, top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * len, h = t(x) / 2;
    top.push(`${x.toFixed(1)} ${(MID - h).toFixed(2)}`);
    bot.unshift(`${x.toFixed(1)} ${(MID + h).toFixed(2)}`);
  }
  const h0 = t(0) / 2, h1 = t(len) / 2;
  return `M${top[0]} L${top.join(" L")} A${h1} ${h1} 0 0 1 ${bot[0]} L${bot.join(" L")} A${h0} ${h0} 0 0 1 ${top[0]}Z`;
}

export function FileUpload({
  speed = 5, fail = 0, color = "Danger", details = true, onUpload, onRemove, sound = true, volume = 70, onSound,
}: FileUploadProps) {
  const [file, setFile] = useState<F | null>(null);
  const [phase, setPhase] = useState<Phase>("up");
  const [p, setP] = useState(0);
  const [bulge, setBulge] = useState<number | null>(null);
  const [drop, setDrop] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ f: F; x: number; y: number; ox: number; oy: number; back: boolean } | null>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState(0);
  const [say, setSay] = useState("");
  const root = useRef<HTMLDivElement>(null), zone = useRef<HTMLDivElement>(null), picker = useRef<HTMLInputElement>(null);
  const raf = useRef(0), loop = useRef<Loop>(undefined), lastBad = useRef(0), errT = useRef(0);
  const reduced = useRef(false);
  const opts = useRef({ speed, fail, sound, volume, onSound });
  opts.current = { speed, fail, sound, volume, onSound };

  useEffect(() => { reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => () => { cancelAnimationFrame(raf.current); loop.current?.stop(0); clearTimeout(errT.current); }, []);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    const s = opts.current;
    if (s.sound && s.onSound) s.onSound(name, { ...o, volume: (o.volume ?? 1) * (s.volume / 100) });
  };
  const stopLoop = () => { loop.current?.stop(200); loop.current = undefined; };

  function run(f: F) {
    cancelAnimationFrame(raf.current);
    stopLoop();
    setPhase("up"); setP(0); setBulge(null); setDrop(null);
    setSay(`Uploading ${f.name}`);
    const s = opts.current;
    if (s.sound && s.onSound) loop.current = s.onSound("charge", { loop: true, volume: 0.35 * (s.volume / 100), pitch: 0.8 }) as Loop;
    const failAt = Math.random() * 100 < s.fail ? 0.3 + Math.random() * 0.6 : 2;
    let prog = 0, t0 = performance.now(), last = t0;
    const up = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      prog = Math.min(1, prog + (dt * opts.current.speed * (0.75 + Math.random() * 0.5)) / f.mb);
      loop.current?.setPitch?.(0.8 + 0.5 * prog);
      if (prog >= failAt) {
        setP(failAt); setPhase("fail"); stopLoop(); setSay("Upload failed");
        snd("collapse", { volume: 0.4, pitch: 0.8 });
        return;
      }
      setP(prog);
      if (prog < 1) { raf.current = requestAnimationFrame(up); return; }
      setPhase("proc"); t0 = now;
      raf.current = requestAnimationFrame(proc);
    };
    const proc = (now: number) => {
      const k = Math.min(1, (now - t0) / (reduced.current ? 300 : 900));
      setBulge(reduced.current ? null : k);
      if (k < 1) { raf.current = requestAnimationFrame(proc); return; }
      setBulge(null); setPhase("drop"); t0 = now;
      raf.current = requestAnimationFrame(hop);
    };
    const hop = (now: number) => {
      const k = Math.min(1, (now - t0) / (reduced.current ? 1 : 420));
      setDrop(k);
      if (k < 1) { raf.current = requestAnimationFrame(hop); return; }
      setPhase("done"); stopLoop(); setSay("Upload complete");
      snd("join", { volume: 0.5 });
    };
    raf.current = requestAnimationFrame(up);
  }

  function accept(f: F) {
    if (file) { refuse(); return false; }
    setFile(f);
    onUpload?.({ name: f.name, mb: f.mb });
    run(f);
    return true;
  }
  function refuse() {
    setErr((n) => n + 1);
    setSay("File limit reached");
    clearTimeout(errT.current);
    errT.current = window.setTimeout(() => setErr(0), 1600);
    const t = performance.now();
    if (t - lastBad.current > 300) { lastBad.current = t; snd("collapse", { volume: 0.4, pitch: 0.8 }); }
  }
  function remove() {
    cancelAnimationFrame(raf.current); stopLoop();
    setFile(null); setP(0); setBulge(null); setDrop(null);
    onRemove?.();
    setSay("File removed");
    snd("collapse", { volume: 0.5 });
  }

  /* chip dragging */
  const chipDown = (f: F) => (e: RPE<HTMLButtonElement>) => {
    if (file?.name === f.name || ghost) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    const r = e.currentTarget.getBoundingClientRect(), rr = root.current!.getBoundingClientRect();
    setGhost({ f, x: r.left - rr.left, y: r.top - rr.top, ox: e.clientX - r.left, oy: e.clientY - r.top, back: false });
  };
  const chipMove = (e: RPE<HTMLButtonElement>) => {
    if (!ghost || ghost.back) return;
    const rr = root.current!.getBoundingClientRect();
    setGhost({ ...ghost, x: e.clientX - rr.left - ghost.ox, y: e.clientY - rr.top - ghost.oy });
    const z = zone.current!.getBoundingClientRect();
    setOver(e.clientX > z.left && e.clientX < z.right && e.clientY > z.top && e.clientY < z.bottom);
  };
  const chipUp = (home: HTMLElement) => (e: RPE<HTMLButtonElement>) => {
    if (!ghost || ghost.back) return;
    const z = zone.current!.getBoundingClientRect();
    const inZone = e.clientX > z.left && e.clientX < z.right && e.clientY > z.top && e.clientY < z.bottom;
    setOver(false);
    if (inZone && accept(ghost.f)) { setGhost(null); return; }
    const r = home.getBoundingClientRect(), rr = root.current!.getBoundingClientRect();
    if (reduced.current) { setGhost(null); return; }
    setGhost({ ...ghost, x: r.left - rr.left, y: r.top - rr.top, back: true });
    setTimeout(() => setGhost(null), 360);
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setOver(true); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setOver(false);
    const real = e.dataTransfer.files?.[0];
    if (real) accept({ name: real.name, mb: Math.max(0.1, +(real.size / 1048576).toFixed(1)), icon: real.type.startsWith("image") ? "ph:file-image-fill" : "ph:file-fill", tone: "pick" });
  };

  const tone = phase === "done" ? "ok" : phase === "fail" ? "danger" : color.toLowerCase();
  const fill = p * BW;
  const thick = (x: number) => {
    let t = phase === "done" || phase === "drop" ? 5 : 4;
    if (bulge !== null) {
      const bx = bulge * BW;
      t += 6 * Math.exp(-(((x - bx) / 16) ** 2)) * Math.sin(Math.PI * Math.min(1, bulge * 1.2));
    }
    if (drop !== null && drop < 0.35) t += 6 * Math.exp(-(((x - BW) / 10) ** 2)) * (1 - drop / 0.35);
    return t;
  };
  const left = Math.max(0, Math.ceil(((1 - p) * (file?.mb ?? 0)) / speed));
  const status = phase === "up" ? "Uploading" : phase === "proc" || phase === "drop" ? "Processing · making preview" : phase === "done" ? "Completed" : "Failed";
  /* droplet: from the bar end up to the check spot (top right of the row) */
  const dk = drop ?? 0, dx = BW + 2 - 6 * dk, dy = MID - 34 * Math.sin(Math.min(1, dk) * Math.PI * 0.5) - 6 * dk;

  return (
    <div className="fup" ref={root} data-tone={tone}>
      <div
        ref={zone}
        className="fup-zone"
        data-over={over}
        data-has={!!file}
        data-shake={err > 0 ? err % 2 : undefined}
        role={file ? undefined : "button"}
        tabIndex={file ? -1 : 0}
        aria-label={file ? undefined : "Choose a file"}
        onClick={() => { if (!file) picker.current?.click(); }}
        onKeyDown={(e) => { if (!file && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); picker.current?.click(); } }}
        onDragOver={onDragOver}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {err > 0 && <span className="fup-err" role="alert">File limit reached · one file only</span>}
        {!file ? (
          <div className="fup-empty">
            <Icon icon="ph:upload-simple-bold" width={18} height={18} />
            <span>Drop a file here</span>
          </div>
        ) : (
          <div className="fup-row">
            <div className="fup-top">
              <span className={`fup-ico fup-${file.tone}`}><Icon icon={file.icon} width={28} height={28} /></span>
              <div className="fup-meta">
                <b>{file.name}</b>
                <span key={status} className="fup-status">{status}</span>
              </div>
              <div className="fup-right">
                {phase === "done" ? (
                  <span className="fup-ok">
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path className="fup-check" d="M2.5 7.4l3 3 6-6.4" pathLength={1} /></svg>
                    Completed
                  </span>
                ) : phase === "fail" ? (
                  <span className="fup-bad"><Icon icon="ph:warning-circle-fill" width={14} height={14} />Failed</span>
                ) : phase === "up" ? (
                  <span className="fup-pct">
                    <span key={left} className="fup-left">{left} s left</span>
                    {details && <> · {Math.floor(p * 100)}%</>}
                  </span>
                ) : null}
              </div>
            </div>
            <svg className="fup-bar" width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} role="progressbar" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress" style={{ overflow: "visible" }}>
              <path className="fup-track" d={barPath(BW, () => 4)} />
              <path className="fup-fill" d={barPath(phase === "drop" || phase === "done" ? BW : fill, thick)} />
              {phase === "drop" && drop !== null && drop >= 0.2 && <circle className="fup-drop" cx={dx} cy={dy} r={4 * (1 - Math.max(0, dk - 0.75) * 3)} />}
            </svg>
            {details && phase !== "done" && <span className="fup-mb">{(p * file.mb).toFixed(1)} MB of {file.mb} MB</span>}
            {phase === "done" && (
              <div className="fup-acts">
                <button type="button" className="fup-btn" onClick={() => { snd("tick", { volume: 0.45 }); run(file); }}>Change</button>
                <button type="button" className="fup-btn fup-rm" onClick={remove}>Remove</button>
              </div>
            )}
            {phase === "fail" && (
              <div className="fup-acts">
                <button type="button" className="fup-btn" onClick={() => run(file)}>Retry</button>
                <button type="button" className="fup-btn fup-rm" onClick={remove}>Remove</button>
              </div>
            )}
          </div>
        )}
        <input ref={picker} type="file" hidden onChange={(e) => { const r = e.target.files?.[0]; if (r) accept({ name: r.name, mb: Math.max(0.1, +(r.size / 1048576).toFixed(1)), icon: "ph:file-fill", tone: "pick" }); e.target.value = ""; }} />
      </div>
      <div className="fup-chips">
        {DEMO.map((f) => (
          <button
            key={f.name}
            type="button"
            className="fup-chip"
            data-used={file?.name === f.name || ghost?.f.name === f.name}
            aria-label={`Add ${f.name}, ${f.mb} MB`}
            onPointerDown={chipDown(f)}
            onPointerMove={chipMove}
            onPointerUp={(e) => chipUp(e.currentTarget)(e)}
            onPointerCancel={(e) => chipUp(e.currentTarget)(e)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (file?.name !== f.name) accept(f); } }}
          >
            <span className={`fup-${f.tone}`}><Icon icon={f.icon} width={16} height={16} /></span>
            {f.name}
            <small>{f.mb} MB</small>
          </button>
        ))}
      </div>
      {ghost && (
        <div className="fup-chip fup-ghost" data-back={ghost.back} style={{ left: ghost.x, top: ghost.y } as CSSProperties} aria-hidden>
          <span className={`fup-${ghost.f.tone}`}><Icon icon={ghost.f.icon} width={16} height={16} /></span>
          {ghost.f.name}
          <small>{ghost.f.mb} MB</small>
        </div>
      )}
      <span className="fup-sr" aria-live="polite">{say}</span>
    </div>
  );
}
