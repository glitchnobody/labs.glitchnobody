import type { Meta } from "..";
import "./ReaderToolbar.css";

export default {
  name: "Reader toolbar",
  description: "A reader's toolbar pill. Press the dots and the title blurs away into Pin, Share and Close; press Close to bring it back.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["expand", "collapse", "tick"],
  siteProps: { images: ["/lab/demoimages/3.png"] },
  demo: [
    { move: [0.9, 1.6], ms: 0 },
    { move: [0.91, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.57, 0.5], ms: 400 },
    { down: true },
    { up: true },
    { wait: 400 },
    { move: [0.91, 0.5], ms: 400 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.9, 1.6], ms: 500 },
  ],
  knobs: [
    { prop: "blur", label: "Blur (px)", type: "range", min: 0, max: 16, default: 8 },
    { prop: "speed", label: "Speed (ms)", type: "range", min: 120, max: 600, step: 20, default: 260 },
    { prop: "stagger", label: "Stagger (ms)", type: "range", min: 0, max: 120, step: 10, default: 40 },
    { prop: "fitWidth", label: "Fit width", type: "toggle", default: false },
    { prop: "actions", label: "Actions", type: "range", min: 2, max: 4, default: 3 },
    { prop: "coverShape", label: "Cover", type: "select", options: ["Square", "Rounded", "Round"], default: "Rounded" },
    { prop: "size", label: "Size", type: "select", options: ["S", "M", "L"], default: "M" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ReaderToolbar").then((m) => m.ReaderToolbar),
} satisfies Meta;
