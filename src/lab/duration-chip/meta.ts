import type { Meta } from "..";
import "./DurationChip.css";

export default {
  name: "Duration chip",
  description: "A duration in one small chip. Press the pencil and it splits into a pill per unit; type new numbers and press the tick to fold them back.",
  tag: "Type",
  install: "npm install motion @iconify/react",
  sounds: ["expand", "tick", "collapse"],
  demo: [
    { move: [1.4, 1.8], ms: 0 },
    { move: [0.88, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 900 },
    { move: [0.59, 0.5], ms: 400 },
    { down: true },
    { up: true },
    { type: "45", ms: 700 },
    { wait: 300 },
    { move: [0.9, 0.5], ms: 400 },
    { down: true },
    { up: true },
    { wait: 900 },
    { move: [1.4, 1.8], ms: 500 },
  ],
  knobs: [
    { prop: "units", label: "Units", type: "select", options: ["Hr + Min", "Min + Sec", "Hr + Min + Sec"], default: "Hr + Min" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./DurationChip").then((m) => m.DurationChip),
} satisfies Meta;
