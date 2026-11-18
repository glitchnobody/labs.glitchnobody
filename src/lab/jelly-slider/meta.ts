import type { Meta } from "..";
import "./JellySlider.css";
import "./JellySlider.site.css";

export default {
  name: "Jelly slider",
  description: "A percentage slider made of jelly. Drag along the pill or click to jump: the fill springs over with a flash and the pill wobbles before it settles.",
  tag: "Slide",
  sounds: ["tick", "jelly"],
  demo: [
    { move: [0.9, 1.3], ms: 0 },
    { move: [0.16, 0.5], ms: 500 },
    { down: true },
    { move: [0.6, 0.5], ms: 700 },
    { up: true },
    { wait: 600 },
    { move: [0.15, 0.5], ms: 400 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.96, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 800 },
    { move: [0.9, 1.3], ms: 500 },
  ],
  knobs: [
    { prop: "value", label: "Value (%)", type: "range", min: 0, max: 100, default: 16 },
    { prop: "wobble", label: "Wobble", type: "range", min: 0, max: 100, default: 60 },
    { prop: "damping", label: "Damping", type: "range", min: 0, max: 100, default: 45 },
    { prop: "flash", label: "Flash", type: "toggle", default: true },
    { prop: "blur", label: "Digit blur", type: "toggle", default: true },
    { prop: "accent", label: "Accent", type: "select", options: ["Pick", "Ok", "Danger", "Ink"], default: "Pick" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./JellySlider").then((m) => m.JellySlider),
} satisfies Meta;
