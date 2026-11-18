import type { Meta } from "..";
import "./ToastStack.css";

export default {
  name: "Toast stack",
  description: "A neat pile of notifications. Hover it to unfold the list, swipe a toast away or close it, or press × to clear them all and watch the stack refill.",
  tag: "Hover",
  install: "npm install @iconify/react",
  sounds: ["expand", "collapse", "swipe", "whoosh", "pop"],
  demo: [
    { move: [1.05, 0.95], ms: 0 },
    { move: [0.6, 0.65], ms: 600 },
    { move: [0.6, 0.35], ms: 1500 },
    { wait: 500 },
    { move: [1.05, 0.6], ms: 500 },
    { wait: 600 },
  ],
  knobs: [
    { prop: "count", label: "Toasts", type: "range", min: 2, max: 6, default: 4 },
    { prop: "position", label: "Position", type: "select", options: ["Bottom", "Top"], default: "Bottom" },
    { prop: "peek", label: "Peek (px)", type: "range", min: 0, max: 20, default: 10 },
    { prop: "gap", label: "Gap (px)", type: "range", min: 0, max: 20, default: 8 },
    { prop: "width", label: "Width (px)", type: "range", min: 240, max: 340, default: 300 },
    { prop: "radius", label: "Corner (px)", type: "range", min: 4, max: 24, default: 10 },
    { prop: "tint", label: "Tinted", type: "toggle", default: false },
    { prop: "hover", label: "Expand on hover", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ToastStack").then((m) => m.ToastStack),
} satisfies Meta;
