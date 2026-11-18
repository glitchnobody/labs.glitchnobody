import type { Meta } from "..";
import "./RevenueCard.css";

export default {
  name: "Revenue card",
  description: "A revenue card with this period's chart against the last. Move across the chart to scrub it: a dot follows the line and the total rolls to the running total.",
  tag: "Hover",
  install: "npm install @iconify/react",
  sounds: ["tick"],
  demo: [
    { move: [0.05, 1.05], ms: 0 },
    { move: [0.08, 0.6], ms: 500 },
    { move: [0.94, 0.55], ms: 2800 },
    { wait: 400 },
    { move: [1.2, 0.55], ms: 500 },
  ],
  knobs: [
    { prop: "curve", label: "Curve", type: "select", options: ["Linear", "Step", "Smooth"], default: "Linear" },
    { prop: "area", label: "Area", type: "toggle", default: true },
    { prop: "compare", label: "Last period", type: "toggle", default: true },
    { prop: "accent", label: "Accent", type: "select", options: ["Pink", "Green", "Blue", "Violet"], default: "Pink" },
    { prop: "points", label: "Points", type: "range", min: 12, max: 48, step: 6, default: 30 },
    { prop: "stroke", label: "Line (px)", type: "range", min: 1, max: 3, step: 0.5, default: 2 },
    { prop: "dots", label: "Dots", type: "toggle", default: false },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./RevenueCard").then((m) => m.RevenueCard),
} satisfies Meta;
