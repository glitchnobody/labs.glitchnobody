import type { Meta } from "..";
import "./ColorPalette.css";
import "./ColorPalette.site.css";

export default {
  name: "Color palette",
  description: "A palette generator in a tile. Press refresh to roll new colours in like slot reels, press a swatch to copy its hex, and hold one to lock it through the next shuffle.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["shuffle", "tick", "pop"],
  demo: [
    { move: [0.5, 1.3], ms: 0 },
    { move: [0.873, 0.65], ms: 500 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.418, 0.65], ms: 400 },
    { down: true },
    { wait: 500 },
    { up: true },
    { move: [0.873, 0.65], ms: 400 },
    { down: true },
    { up: true },
    { wait: 700 },
    { move: [0.418, 0.65], ms: 400 },
    { down: true },
    { wait: 500 },
    { up: true },
    { wait: 300 },
    { move: [0.5, 1.3], ms: 500 },
  ],
  knobs: [
    { prop: "count", label: "Swatches", type: "range", min: 3, max: 5, step: 1, default: 3 },
    { prop: "harmony", label: "Harmony", type: "select", options: ["Random", "Analogous", "Complementary", "Triad", "Monochrome"], default: "Analogous" },
    { prop: "labels", label: "Hex labels", type: "select", options: ["Always", "On hover", "Never"], default: "On hover" },
    { prop: "motion", label: "Motion", type: "select", options: ["Roll", "Flip", "Tween"], default: "Roll" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ColorPalette").then((m) => m.ColorPalette),
} satisfies Meta;
