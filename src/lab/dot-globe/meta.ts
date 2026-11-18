import type { Meta } from "..";
import "./DotGlobe.css";
import "./DotGlobe.site.css";

export default {
  name: "Dot globe",
  description: "A spinning Earth drawn in dots. Hover to swell the dots under a lens, or grab it and flick it spinning; it coasts back to its slow turn.",
  tag: "Drag",
  sounds: ["whoosh"],
  demo: [
    { move: [0.05, 0.5], ms: 0 },
    { move: [0.3, 0.5], ms: 400 },
    { down: true },
    { move: [0.75, 0.48], ms: 200 },
    { up: true },
    { move: [0.6, 0.85], ms: 500 },
    { wait: 1800 },
    { move: [1.2, 1.1], ms: 400 },
  ],
  knobs: [
    { prop: "density", label: "Dots", type: "range", min: 40, max: 160, default: 100 },
    { prop: "dotSize", label: "Dot size (px)", type: "range", min: 1, max: 5, step: 0.2, default: 2.4 },
    { prop: "speed", label: "Spin (°/s)", type: "range", min: 0, max: 40, default: 8 },
    { prop: "tilt", label: "Tilt (°)", type: "range", min: 0, max: 40, default: 18 },
    { prop: "lens", label: "Lens (px)", type: "range", min: 0, max: 100, default: 46 },
    { prop: "lensStrength", label: "Lens strength", type: "range", min: 1, max: 3, step: 0.1, default: 1.8 },
    { prop: "accent", label: "Land", type: "select", options: ["Ink", "Pick", "Ok"], default: "Ink" },
    { prop: "sea", label: "Sea dots", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./DotGlobe").then((m) => m.DotGlobe),
} satisfies Meta;
