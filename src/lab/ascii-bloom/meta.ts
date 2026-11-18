import type { Meta } from "..";
import "./AsciiBloom.css";

export default {
  name: "ASCII bloom",
  description: "A flower drawn in text characters. Drag up to open it and down to fold it into a bud; let go and it keeps blooming by itself.",
  tag: "Drag",
  sounds: ["rustle"],
  demo: [
    { move: [1.05, 0.5], ms: 0 },
    { move: [0.5, 0.45], ms: 400 },
    { down: true },
    { move: [0.5, 0.91], ms: 900 },
    { move: [0.5, 0.14], ms: 1200 },
    { up: true },
    { move: [1.05, 0.3], ms: 500 },
  ],
  knobs: [
    { prop: "cell", label: "Cell (px)", type: "range", min: 4, max: 14, default: 7 },
    { prop: "charset", label: "Characters", type: "select", options: ["Classic", "Blocks", "Binary"], default: "Classic" },
    { prop: "drift", label: "Drift", type: "range", min: 0, max: 0.5, step: 0.02, default: 0.12 },
    { prop: "ink", label: "Ink", type: "select", options: ["Ink", "Pick", "Ok"], default: "Ink" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./AsciiBloom").then((m) => m.AsciiBloom),
} satisfies Meta;
