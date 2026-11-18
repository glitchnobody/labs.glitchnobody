import type { Meta } from "..";
import "./OverviewBars.css";

export default {
  name: "Overview bars",
  description: "A bar chart of actuals against targets. Hover a bar to read its month; switch the range to watch the bars re-flow and the headline roll.",
  tag: "Hover",
  install: "npm install @iconify/react",
  sounds: ["tick", "expand", "collapse", "shuffle"],
  demo: [
    { move: [0.05, 1.05], ms: 0 },
    { move: [0.08, 0.7], ms: 500 },
    { move: [0.94, 0.68], ms: 2200 },
    { move: [0.6, 1.1], ms: 500 },
  ],
  knobs: [
    { prop: "hatch", label: "Stripes", type: "toggle", default: true },
    { prop: "hatchAngle", label: "Stripe angle (°)", type: "range", min: 0, max: 90, step: 15, default: 60 },
    { prop: "radius", label: "Corner (px)", type: "range", min: 0, max: 14, default: 4 },
    { prop: "gap", label: "Gap (px)", type: "range", min: 2, max: 20, default: 10 },
    { prop: "accent", label: "Active bar", type: "select", options: ["Ink", "Pick", "Ok"], default: "Ink" },
    { prop: "range", label: "Range", type: "select", options: ["Last month", "6 months", "Year"], default: "Year" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./OverviewBars").then((m) => m.OverviewBars),
} satisfies Meta;
