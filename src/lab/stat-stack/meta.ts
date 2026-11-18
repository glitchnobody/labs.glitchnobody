import type { Meta } from "..";
import "./StatStack.css";
import "./StatStack.site.css";

export default {
  name: "Stat stack",
  description: "Stat tiles that share one timeline. Scrub any chart to move a marker through every tile, and press Period to switch between 7, 28 and 90 days.",
  tag: "Hover",
  sounds: ["tick", "swipe"],
  demo: [
    { move: [1.05, 0.2], ms: 0 },
    { move: [0.5, 0.25], ms: 500 },
    { move: [0.95, 0.22], ms: 1800 },
    { move: [0.12, 0.4], ms: 600 },
    { down: true },
    { up: true },
    { wait: 900 },
    { move: [1.05, 0.2], ms: 500 },
  ],
  knobs: [
    { prop: "tiles", label: "Tiles", type: "range", min: 2, max: 3, default: 2 },
    { prop: "caps", label: "Bar caps", type: "toggle", default: true },
    { prop: "linked", label: "Linked scrub", type: "toggle", default: true },
    { prop: "ring", label: "Focus ring", type: "toggle", default: true },
    { prop: "period", label: "Period", type: "select", options: ["7D", "28D", "90D"], default: "28D" },
    { prop: "morph", label: "Morph (ms)", type: "range", min: 0, max: 900, step: 50, default: 450 },
    { prop: "density", label: "Density", type: "select", options: ["Regular", "Compact"], default: "Regular" },
    { prop: "radius", label: "Corner (px)", type: "range", min: 4, max: 20, default: 10 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./StatStack").then((m) => m.StatStack),
} satisfies Meta;
