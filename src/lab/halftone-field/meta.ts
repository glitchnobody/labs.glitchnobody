import type { Meta } from "..";
import "./HalftoneField.css";

export default {
  name: "Halftone field",
  description: "A field of halftone dots that swell under the pointer and melt into a trailing blob. Move across it, or click to send a ripple ring outward.",
  tag: "Hover",
  sounds: ["whoosh", "jelly"],
  demo: [
    { move: [-0.05, 0.3], ms: 0 },
    { move: [0.35, 0.38], ms: 800 },
    { move: [0.7, 0.55], ms: 800 },
    { move: [1.05, 0.7], ms: 600 },
    { move: [0.5, 0.8], ms: 500 },
    { move: [0.5, 1.1], ms: 400 },
    { wait: 500 },
  ],
  knobs: [
    { prop: "radius", label: "Swell radius (px)", type: "range", min: 20, max: 160, default: 70 },
    { prop: "strength", label: "Swell strength", type: "range", min: 0.3, max: 1.6, step: 0.05, default: 1.15 },
    { prop: "lag", label: "Trail lag", type: "range", min: 0, max: 100, default: 45 },
    { prop: "shape", label: "Dot shape", type: "select", options: ["Circle", "Square", "Diamond"], default: "Circle" },
    { prop: "inverted", label: "Inverted", type: "toggle", default: false },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./HalftoneField").then((m) => m.HalftoneField),
} satisfies Meta;
