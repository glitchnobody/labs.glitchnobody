import type { Meta } from "..";
import "./FileUpload.css";
import "./FileUpload.site.css";

export default {
  name: "File upload",
  description: "A one-file drop zone with a simulated upload. Drag a file chip into the zone and watch the bar fill, turn liquid and drop a check mark.",
  tag: "Drag",
  install: "npm install @iconify/react",
  sounds: ["charge", "join", "tick", "collapse"],
  demo: [
    { move: [0.2, 1.15], ms: 0 },
    { move: [0.264, 0.886], ms: 500 },
    { down: true },
    { move: [0.5, 0.35], ms: 700 },
    { up: true },
    { wait: 4000 },
    { move: [0.15, 0.581], ms: 400 },
    { down: true },
    { up: true },
    { wait: 4000 },
    { move: [0.381, 0.581], ms: 300 },
    { down: true },
    { up: true },
    { wait: 300 },
    { move: [0.2, 1.15], ms: 500 },
  ],
  knobs: [
    { prop: "speed", label: "Upload speed (MB/s)", type: "range", min: 1, max: 20, default: 5 },
    { prop: "fail", label: "Fail chance (%)", type: "range", min: 0, max: 50, step: 5, default: 0 },
    { prop: "color", label: "Progress", type: "select", options: ["Danger", "Pick", "Ink"], default: "Danger" },
    { prop: "details", label: "Size and percent", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./FileUpload").then((m) => m.FileUpload),
} satisfies Meta;
