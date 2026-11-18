import type { Meta } from "..";
import "./ActivityHeatmap.css";
import "./ActivityHeatmap.site.css";

export default {
  name: "Activity heatmap",
  description: "A contribution heatmap that plays a note for every cell you pass. Sweep across it: a ripple follows and busier days play higher notes.",
  tag: "Hover",
  sounds: ["blip"],
  demo: [
    { move: [0.05, 1.1], ms: 0 },
    { move: [0.1, 0.5], ms: 500 },
    { move: [0.92, 0.5], ms: 1600 },
    { move: [0.92, 0.72], ms: 200 },
    { move: [0.1, 0.72], ms: 1600 },
    { move: [0.05, 1.1], ms: 500 },
  ],
  knobs: [
    { prop: "weeks", label: "Weeks", type: "range", min: 12, max: 26, default: 22 },
    { prop: "cell", label: "Cell (px)", type: "range", min: 8, max: 16, default: 11 },
    { prop: "gap", label: "Gap (px)", type: "range", min: 1, max: 6, default: 3 },
    { prop: "shape", label: "Shape", type: "select", options: ["Square", "Rounded", "Circle", "Diamond", "Heart", "Star", "Hexagon"], default: "Rounded" },
    { prop: "levels", label: "Levels", type: "select", options: ["4", "5"], default: "5" },
    { prop: "ripple", label: "Ripple (cells)", type: "range", min: 0, max: 5, step: 0.5, default: 2.5 },
    { prop: "rippleStrength", label: "Ripple glow", type: "range", min: 0, max: 100, default: 60 },
    { prop: "labels", label: "Labels", type: "select", options: ["None", "Months", "Months + days"], default: "Months" },
    { prop: "legend", label: "Legend", type: "toggle", default: false },
    { prop: "accent", label: "Accent", type: "select", options: ["Green", "Pick", "Danger", "Ink"], default: "Green" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ActivityHeatmap").then((m) => m.ActivityHeatmap),
} satisfies Meta;
