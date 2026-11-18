import type { Meta } from "..";
import "./CreateMenu.css";

export default {
  name: "Create menu",
  description: "A \"Create new\" button that grows into a grid of things to create. Press it, pick one, and it folds back with a check.",
  tag: "Press",
  sounds: ["expand", "collapse", "tick", "pop"],
  install: "npm install motion @iconify/react",
  demo: [
    { move: [1.3, 0.5], ms: 0 },
    { move: [0.5, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 900 },
    { move: [0.25, 0.4], ms: 400 },
    { move: [0.5, 0.4], ms: 300 },
    { move: [0.5, 0.75], ms: 400 },
    { move: [0.17, 0.75], ms: 300 },
    { down: true },
    { up: true },
    { wait: 1800 },
    { move: [1.3, 0.5], ms: 500 },
  ],
  knobs: [
    { prop: "items", label: "Items", type: "range", min: 3, max: 9, step: 1, default: 6 },
    { prop: "columns", label: "Columns", type: "range", min: 2, max: 4, step: 1, default: 3 },
    { prop: "bounce", label: "Bounce", type: "range", min: 0, max: 100, default: 25 },
    { prop: "speed", label: "Speed", type: "range", min: 0, max: 100, default: 60 },
    { prop: "stagger", label: "Stagger (ms)", type: "range", min: 0, max: 80, step: 5, default: 25 },
    { prop: "origin", label: "Opens", type: "select", options: ["Down", "Up", "Centre"], default: "Down" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./CreateMenu").then((m) => m.CreateMenu),
} satisfies Meta;
