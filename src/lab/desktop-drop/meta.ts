import type { Meta } from "..";
import "./DesktopDrop.css";
import "./DesktopDrop.site.css";

export default {
  name: "Desktop drop",
  description: "A tiny desktop with a folder and a few files. Drag any file and they all stack under the pointer; drop them on the folder to see their tags pop up. Double-click the folder to pour them out.",
  tag: "Drag",
  install: "npm install @iconify/react",
  sounds: ["tick", "slide", "pop"],
  demo: [
    { move: [0.9, 0.95], ms: 0 },
    { move: [0.875, 0.26], ms: 500 },
    { down: true },
    { move: [0.8, 0.22], ms: 200 },
    { move: [0.14, 0.26], ms: 700 },
    { up: true },
    { wait: 1000 },
    { move: [0.1375, 0.26], ms: 300 },
    { down: true },
    { up: true },
    { down: true },
    { up: true },
    { wait: 700 },
    { move: [0.9, 0.95], ms: 500 },
  ],
  knobs: [
    { prop: "files", label: "Files", type: "range", min: 2, max: 5, default: 3 },
    { prop: "iconSize", label: "Icon size (px)", type: "range", min: 28, max: 64, default: 44 },
    { prop: "labels", label: "Labels", type: "toggle", default: true },
    { prop: "tags", label: "Tags", type: "select", options: ["Pills", "Dots", "None"], default: "Pills" },
    { prop: "accent", label: "Selection", type: "select", options: ["Pick", "Ink"], default: "Pick" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./DesktopDrop").then((m) => m.DesktopDrop),
} satisfies Meta;
