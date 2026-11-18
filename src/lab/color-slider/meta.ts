import type { Meta } from "..";
import "./ColorSlider.css";
import "./ColorSlider.site.css";

export default {
  name: "Color slider",
  description: "A shade slider with a hue strip tucked behind a colour wheel. Drag along the gradient to pick a shade; press the wheel to open a hue row and change the colour family.",
  tag: "Slide",
  sounds: ["tick", "expand", "collapse"],
  demo: [
    { move: [0.3, 1.4], ms: 0 },
    { move: [0.217, 0.65], ms: 500 },
    { down: true },
    { move: [0.558, 0.65], ms: 800 },
    { up: true },
    { move: [0.886, 0.65], ms: 400 },
    { down: true },
    { up: true },
    { wait: 400 },
    { move: [0.477, 0.733], ms: 400 },
    { down: true },
    { move: [0.607, 0.733], ms: 700 },
    { up: true },
    { move: [0.886, 0.433], ms: 400 },
    { down: true },
    { up: true },
    { wait: 300 },
    { move: [0.3, 1.4], ms: 500 },
  ],
  knobs: [
    { prop: "readout", label: "Readout", type: "select", options: ["Off", "Hex", "HSL"], default: "Off" },
    { prop: "thumb", label: "Thumb", type: "select", options: ["Ring", "Solid", "Loupe"], default: "Ring" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ColorSlider").then((m) => m.ColorSlider),
} satisfies Meta;
