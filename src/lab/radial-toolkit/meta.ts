import type { Meta } from "..";
import "./RadialToolkit.css";

export default {
  name: "Radial toolkit",
  description: "A radial tool picker on a canvas. Press and hold anywhere and a ring of tools blooms around the pointer; sweep toward a tool and let go to pick it.",
  tag: "Drag",
  install: "npm install @iconify/react",
  sounds: ["expand", "tick", "pop", "collapse"],
  demo: [
    { move: [0.85, 0.85], ms: 0 },
    { move: [0.5, 0.45], ms: 500 },
    { down: true },
    { wait: 400 },
    { move: [0.36, 0.22], ms: 400 },
    { move: [0.5, 0.12], ms: 350 },
    { move: [0.64, 0.22], ms: 350 },
    { up: true },
    { wait: 800 },
    { move: [0.85, 0.9], ms: 500 },
  ],
  knobs: [
    { prop: "radius", label: "Radius (px)", type: "range", min: 64, max: 120, default: 92 },
    { prop: "tools", label: "Tools", type: "range", min: 4, max: 7, default: 7 },
    { prop: "labels", label: "Labels", type: "toggle", default: true },
    { prop: "badges", label: "Key badges", type: "toggle", default: true },
    { prop: "bloom", label: "Bloom", type: "select", options: ["Scale", "Stagger", "Spin-in"], default: "Stagger" },
    { prop: "speed", label: "Open (ms)", type: "range", min: 120, max: 600, step: 20, default: 280 },
    { prop: "wedge", label: "Wedge", type: "toggle", default: true },
    { prop: "wedgeWidth", label: "Wedge width (°)", type: "range", min: 20, max: 70, default: 40 },
    { prop: "accent", label: "Accent", type: "select", options: ["Pick", "Ink"], default: "Pick" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./RadialToolkit").then((m) => m.RadialToolkit),
} satisfies Meta;
