/* The site's sounds. Components never import this: Block.tsx hands them
   `play` as their onSound prop. Each /sounds/<name>.mp3 is fetched and
   decoded once, then played through Web Audio, so rapid repeats are cheap.
   Mute lives on <html data-muted> and in localStorage ("muted"), and
   silences everything, loops included, through one master gain. */

export type SoundOptions = { volume?: number; pitch?: number; loop?: boolean };
export type LoopHandle = { stop(fadeMs?: number): void; setPitch(n: number): void; setVolume(n: number): void };

let ctx: AudioContext | undefined;
let master: GainNode;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

const muted = () => document.documentElement.hasAttribute("data-muted");

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted() ? 0 : 1;
    master.connect(ctx.destination);
  }
  return ctx;
}

/* browsers start audio suspended until the person does something */
if (typeof window !== "undefined") {
  const unlock = () => {
    audio().resume();
    removeEventListener("pointerdown", unlock, true);
    removeEventListener("keydown", unlock, true);
  };
  addEventListener("pointerdown", unlock, true);
  addEventListener("keydown", unlock, true);
}

function load(name: string) {
  let buffer = buffers.get(name);
  if (!buffer) {
    buffer = fetch(`/sounds/${name}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((data) => audio().decodeAudioData(data))
      .catch((e) => {
        console.warn(`sound "${name}" could not be loaded (${e})`); // once: the failure is cached too
        return null;
      });
    buffers.set(name, buffer);
  }
  return buffer;
}

export function setMuted(on: boolean) {
  document.documentElement.toggleAttribute("data-muted", on);
  try {
    localStorage.setItem("muted", on ? "1" : "");
  } catch {}
  if (ctx) master.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.01);
}

export function play(name: string, o?: SoundOptions & { loop?: false }): void;
export function play(name: string, o: SoundOptions & { loop: true }): LoopHandle;
export function play(name: string, { volume = 1, pitch = 1, loop = false }: SoundOptions = {}): LoopHandle | void {
  /* in dev, every call is listed for checking tools: window.__played */
  if (import.meta.env.DEV) ((window as any).__played ??= []).push({ name, volume, pitch, loop, at: Math.round(performance.now()) });
  /* before any gesture the context cannot start; queued sounds would burst out later */
  const live = typeof navigator !== "undefined" && (navigator.userActivation?.hasBeenActive ?? true);
  let source: AudioBufferSourceNode | undefined;
  let gain: GainNode | undefined;
  let stopped = !live;

  if (live)
    load(name).then((buffer) => {
      if (!buffer || stopped) return;
      const c = audio();
      source = c.createBufferSource();
      gain = c.createGain();
      source.buffer = buffer;
      source.loop = loop;
      source.playbackRate.value = pitch;
      gain.gain.value = volume;
      source.connect(gain).connect(master);
      source.start();
    });

  if (!loop) return;
  return {
    stop(fadeMs = 0) {
      stopped = true;
      if (!source || !gain || !ctx) return;
      const end = ctx.currentTime + fadeMs / 1000;
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, end);
      source.stop(end + 0.01);
    },
    setPitch(n) {
      pitch = n;
      if (source && ctx) source.playbackRate.setTargetAtTime(n, ctx.currentTime, 0.02);
    },
    setVolume(n) {
      volume = n;
      if (gain && ctx) gain.gain.setTargetAtTime(n, ctx.currentTime, 0.02);
    },
  };
}
