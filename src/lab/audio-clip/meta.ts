import type { Meta } from "..";
import "./AudioClip.css";

export default {
  name: "Audio clip",
  description: "A compact audio player with the clip's real waveform. Press play, then drag the playhead to scrub and hear the rain follow your hand.",
  tag: "Drag",
  install: "npm install @iconify/react",
  sounds: ["rain-clip"],
  demo: [
    { move: [0.5, 1.6], ms: 0 },
    { move: [0.07, 0.22], ms: 500 },
    { down: true },
    { up: true },
    { wait: 800 },
    { move: [0.15, 0.69], ms: 400 },
    { down: true },
    { move: [0.65, 0.69], ms: 800 },
    { move: [0.45, 0.69], ms: 500 },
    { up: true },
    { wait: 800 },
    { move: [0.07, 0.22], ms: 400 },
    { down: true },
    { up: true },
    { move: [0.5, 1.6], ms: 500 },
  ],
  knobs: [
    { prop: "bars", label: "Bars", type: "range", min: 24, max: 120, default: 64 },
    { prop: "barWidth", label: "Bar width (px)", type: "range", min: 1, max: 4, step: 0.5, default: 2 },
    { prop: "handle", label: "Playhead", type: "select", options: ["Pin", "Line", "Dot"], default: "Pin" },
    { prop: "time", label: "Time", type: "select", options: ["Left", "Elapsed", "Both"], default: "Left" },
    { prop: "accent", label: "Played", type: "select", options: ["Ink", "Pick", "Ok"], default: "Ink" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./AudioClip").then((m) => m.AudioClip),
} satisfies Meta;
