import type { Meta } from "..";
import "./PhotoFolder.css";
import "./PhotoFolder.site.css";

export default {
  name: "Photo folder",
  description: "A folder with photos tucked in its pocket. Hover it and the photos slide up one after another and fan out; move away and they sink back.",
  tag: "Hover",
  install: "npm install motion",
  sounds: ["slide"],
  siteProps: { images: [2, 5, 7, 9, 1, 11].map((n) => `/lab/demoimages/${n}.png`) },
  demo: [
    { move: [0.95, 0.95], ms: 0 },
    { move: [0.5, 0.75], ms: 500 },
    { wait: 1500 },
    { move: [1.15, 1.2], ms: 500 },
    { wait: 600 },
  ],
  knobs: [
    { prop: "count", label: "Photos", type: "range", min: 2, max: 6, default: 4 },
    { prop: "rise", label: "Rise (px)", type: "range", min: 10, max: 60, default: 34 },
    { prop: "fan", label: "Fan (°)", type: "range", min: 0, max: 30, default: 14 },
    { prop: "folderStyle", label: "Folder", type: "select", options: ["Paper", "Tinted", "Dark"], default: "Paper" },
    { prop: "tab", label: "Tab", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./PhotoFolder").then((m) => m.PhotoFolder),
} satisfies Meta;
