import type { Meta } from "..";
import "./ToolDock.css";

export default {
  name: "Tool dock",
  description: "A tool dock with one sliding highlight and a ticker tooltip. Glide across it and the highlight and label slide with you; press a tool to select it.",
  tag: "Hover",
  install: "npm install @iconify/react",
  sounds: ["tick", "pop"],
  demo: [
    { move: [0.05, 1.6], ms: 0 },
    { move: [0.1, 0.5], ms: 500 },
    { move: [0.9, 0.5], ms: 1400 },
    { move: [0.42, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { move: [0.9, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.05, 1.6], ms: 500 },
  ],
  knobs: [
    { prop: "tools", label: "Tools", type: "range", min: 3, max: 6, step: 1, default: 6 },
    { prop: "size", label: "Size", type: "select", options: ["S", "M", "L"], default: "M" },
    { prop: "bounce", label: "Bounce", type: "range", min: 0, max: 100, default: 25 },
    { prop: "shape", label: "Highlight", type: "select", options: ["Circle", "Rounded"], default: "Circle" },
    { prop: "badges", label: "Shortcuts", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ToolDock").then((m) => m.ToolDock),
} satisfies Meta;
