/* ══ Audio clip ═══════════════════════════════════════
   A compact audio player with a real waveform. Press play to hear the
   rain, drag the playhead to scrub through it and hear the sound follow
   your hand, press the waveform to seek, and cycle the speed chip. Space
   plays and pauses; Left and Right on the waveform move a second.

   ── A WAVEFORM FROM THE FILE ─────────────────────────
   The clip is fetched and decoded once with Web Audio. The decoded samples
   are split into as many slices as there are bars, and each bar's height
   is the loudest sample in its slice, so the waveform is the clip's own.

   ── KEEPING TIME ─────────────────────────────────────
   A playing clip is a buffer source started at an offset. Its position is
   that offset plus the time since it started, times the playback rate, so
   the playhead can be drawn every frame without asking the audio for it.
   Seeking or changing speed restarts the source at the new position.

   ── SCRUBBING WITH GRAINS ────────────────────────────
   While the playhead is dragged, every 40 ms of movement plays a 60 ms
   grain of audio from under the playhead with a quick fade in and out, so
   moving fast sounds like fast-forwarding tape and holding still is
   silent. An analyser reads the live output level and makes the bars near
   the playhead bounce with it. */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@iconify/react";

export type AudioClipProps = {
  bars?: number;
  barWidth?: number;
  handle?: "Pin" | "Line" | "Dot";
  time?: "Left" | "Elapsed" | "Both";
  accent?: "Ink" | "Pick" | "Ok";
  src?: string;
  name?: string;
  onEnded?: () => void;
  sound?: boolean;
  volume?: number;
};

const SPEEDS = [1, 1.5, 2];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function AudioClip({
  bars = 64, barWidth = 2, handle = "Pin", time = "Left", accent = "Ink", src = "/sounds/rain-clip.mp3", name = "Rain.mp3",
  onEnded, sound = true, volume = 70,
}: AudioClipProps) {
  const [buf, setBuf] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [rate, setRate] = useState(1);
  const [level, setLevel] = useState(0);
  const [drag, setDrag] = useState(false);
  const wave = useRef<HTMLDivElement>(null);
  const a = useRef<{ ctx?: AudioContext; gain?: GainNode; an?: AnalyserNode; src?: AudioBufferSourceNode; startAt: number; offset: number }>({ startAt: 0, offset: 0 });
  const raf = useRef(0), endT = useRef(0), lastGrain = useRef(0), wasPlaying = useRef(false), moved = useRef(false);
  const live = useRef({ sound, volume, rate, playing });
  live.current = { sound, volume, rate, playing };
  const dur = buf?.duration ?? 12;

  /* decode once and read the peaks */
  useEffect(() => {
    let off = false;
    fetch(src).then((r) => r.arrayBuffer()).then((ab) => new OfflineAudioContext(1, 44100, 44100).decodeAudioData(ab)).then((b) => { if (!off) setBuf(b); }).catch(() => {});
    return () => { off = true; };
  }, [src]);
  useEffect(() => {
    if (!buf) return;
    const d = buf.getChannelData(0), n = Math.max(8, Math.round(bars)), step = Math.floor(d.length / n), out: number[] = [];
    for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step; j < (i + 1) * step; j += 16) m = Math.max(m, Math.abs(d[j])); out.push(m); }
    const max = Math.max(...out) || 1;
    setPeaks(out.map((v) => 0.12 + 0.88 * (v / max)));
  }, [buf, bars]);
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(endT.current); try { a.current.src?.stop(); } catch { /* not started */ } a.current.ctx?.close(); }, []);

  const outGain = () => (live.current.sound && !document.documentElement.hasAttribute("data-muted") ? live.current.volume / 100 : 0);
  useEffect(() => { a.current.gain?.gain.setTargetAtTime(outGain(), a.current.ctx!.currentTime, 0.02); }, [sound, volume]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensure = () => {
    const s = a.current;
    if (!s.ctx) {
      s.ctx = new AudioContext();
      s.an = s.ctx.createAnalyser(); s.an.fftSize = 256;
      s.gain = s.ctx.createGain(); s.gain.gain.value = outGain();
      s.gain.connect(s.an); s.an.connect(s.ctx.destination);
    }
    if (s.ctx.state === "suspended") s.ctx.resume();
    return s;
  };
  const now = () => { const s = a.current; return live.current.playing && s.ctx ? s.offset + (s.ctx.currentTime - s.startAt) * live.current.rate : s.offset; };

  function stopSrc() { const s = a.current; if (s.src) { s.src.onended = null; try { s.src.stop(); } catch { /* not started */ } s.src = undefined; } }
  function start(at: number, r = rate) {
    if (!buf) return;
    const s = ensure();
    stopSrc();
    const node = s.ctx!.createBufferSource();
    node.buffer = buf; node.playbackRate.value = r; node.connect(s.gain!);
    node.start(0, Math.min(at, buf.duration - 0.01));
    s.src = node; s.startAt = s.ctx!.currentTime; s.offset = at;
    node.onended = () => {
      setPlaying(false); live.current.playing = false; a.current.offset = buf.duration; setPos(buf.duration); onEnded?.();
      endT.current = window.setTimeout(() => { a.current.offset = 0; setPos(0); }, 600);
    };
    setPlaying(true); live.current.playing = true;
    loop();
  }
  function pause() { a.current.offset = now(); stopSrc(); setPlaying(false); live.current.playing = false; setPos(a.current.offset); }
  function loop() {
    cancelAnimationFrame(raf.current);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const data = new Uint8Array(128);
    const f = () => {
      if (!live.current.playing) { setLevel(0); return; }
      setPos(now());
      if (a.current.an && !reduced) { a.current.an.getByteTimeDomainData(data); let m = 0; for (const v of data) m = Math.max(m, Math.abs(v - 128)); setLevel(m / 128); }
      raf.current = requestAnimationFrame(f);
    };
    raf.current = requestAnimationFrame(f);
  }
  const toggle = () => { clearTimeout(endT.current); if (playing) pause(); else start(pos >= dur - 0.05 ? 0 : pos); };

  function grain(at: number) {
    if (!buf) return;
    const t = performance.now();
    if (t - lastGrain.current < 40) return;
    lastGrain.current = t;
    const s = ensure(), g = s.ctx!.createGain(), node = s.ctx!.createBufferSource(), c = s.ctx!.currentTime;
    node.buffer = buf; node.connect(g); g.connect(s.gain!);
    g.gain.setValueAtTime(0, c); g.gain.linearRampToValueAtTime(1, c + 0.01); g.gain.setValueAtTime(1, c + 0.05); g.gain.linearRampToValueAtTime(0, c + 0.06);
    node.start(c, Math.max(0, Math.min(at, buf.duration - 0.07)), 0.06);
  }
  const seekFrom = (e: PointerEvent) => {
    const r = wave.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    clearTimeout(endT.current);
    wasPlaying.current = playing; moved.current = false;
    if (playing) pause();
    const t = seekFrom(e);
    a.current.offset = t; setPos(t); setDrag(true);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const t = seekFrom(e);
    if (Math.abs(t - a.current.offset) > 0.001) { moved.current = true; grain(t); }
    a.current.offset = t; setPos(t);
  };
  const onUp = () => {
    if (!drag) return;
    setDrag(false);
    if (wasPlaying.current) start(a.current.offset);
  };

  const n = Math.max(8, Math.round(bars));
  const p = Math.min(1, pos / dur), at = p * n;
  const left = Math.max(0, Math.ceil((dur - pos) / rate));
  const label = time === "Left" ? `${left}s` : time === "Elapsed" ? mmss(pos / rate) : `${mmss(pos / rate)} / ${mmss(dur / rate)}`;

  return (
    <div className="auc" data-accent={accent.toLowerCase()} data-handle={handle.toLowerCase()} style={{ "--auc-bw": `${barWidth}px`, "--auc-p": p } as CSSProperties}
      tabIndex={-1}
      onKeyDown={(e: KeyboardEvent) => { if (e.key === " " && e.target === e.currentTarget) { e.preventDefault(); toggle(); } }}>
      <div className="auc-top">
        <button type="button" className="auc-play" aria-label={playing ? "Pause" : `Play ${name}`} onClick={toggle} disabled={!buf}>
          <Icon icon={playing ? "ph:pause-fill" : "ph:play-fill"} width={12} height={12} />
        </button>
        <span className="auc-name">{name}</span>
        <button type="button" className="auc-speed" aria-label={`Playback speed ${rate}×`}
          onClick={() => { const r = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length]; const t = now(); setRate(r); live.current.rate = r; if (playing) start(t, r); }}>
          {rate}×
        </button>
        <span className="auc-time">{label}</span>
      </div>
      <div
        ref={wave}
        className="auc-wave"
        role="slider"
        tabIndex={0}
        aria-label="Position"
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)} of ${Math.round(dur)} seconds`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          const t = e.key === "ArrowRight" ? pos + 1 : e.key === "ArrowLeft" ? pos - 1 : e.key === "Home" ? 0 : e.key === "End" ? dur : null;
          if (e.key === " ") { e.preventDefault(); toggle(); return; }
          if (t === null) return;
          e.preventDefault();
          const c = Math.max(0, Math.min(dur, t));
          if (playing) start(c); else { a.current.offset = c; setPos(c); }
        }}
      >
        <div className="auc-bars">
          {Array.from({ length: n }, (_, i) => {
            const h = peaks[i] ?? 0.15, near = playing ? Math.max(0, 1 - Math.abs(i - at) / 6) : 0;
            return <i key={i} data-on={i < at} style={{ height: `${Math.min(100, h * 100 * (1 + 0.2 * near * level * 3))}%` }} />;
          })}
        </div>
        <span className="auc-head" aria-hidden><b /></span>
      </div>
    </div>
  );
}
