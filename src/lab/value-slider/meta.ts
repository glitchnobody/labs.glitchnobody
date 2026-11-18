import type { Meta } from "..";
import "./ValueSlider.css";
import "./ValueSlider.site.css";

export default {
  name: "Value slider",
  description: "A slider whose thumb swells as you drag and shows the number in a bubble. Drag past the ends to stretch the track, or click the track to glide there.",
  tag: "Slide",
  sounds: ["tick"],
  demo: [
    { move: [0.05, 1.3], ms: 0 },
    { move: [0.12, 0.65], ms: 500 },
    { down: true },
    { move: [1.08, 0.65], ms: 900 },
    { up: true },
    { wait: 400 },
    { move: [0.423, 0.65], ms: 400 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.05, 1.3], ms: 500 },
  ],
  knobs: [
    { prop: "value", label: "Value", type: "range", min: 0, max: 100, step: 1, default: 0 },
    { prop: "step", label: "Step", type: "select", options: ["1", "5", "10"], default: "1" },
    { prop: "bubble", label: "Value bubble", type: "toggle", default: true },
    { prop: "accent", label: "Accent", type: "select", options: ["Pick", "Ok", "Ink"], default: "Pick" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ValueSlider").then((m) => m.ValueSlider),
} satisfies Meta;
