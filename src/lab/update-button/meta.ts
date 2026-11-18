import type { Meta } from "..";
import "./UpdateButton.css";

export default {
  name: "Update button",
  description: "An update button that does the whole job in one press: it counts the download, installs, restarts and reports Up to date, morphing its label letter by letter.",
  tag: "Loading",
  install: "npm install @iconify/react",
  sounds: ["tick"],
  demo: [
    { move: [0.5, 1.6], ms: 0 },
    { move: [0.5, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { move: [0.5, 0.6], ms: 400 },
    { wait: 3000 },
    { move: [0.5, 1.6], ms: 500 },
  ],
  knobs: [
    { prop: "download", label: "Download step", type: "toggle", default: true },
    { prop: "install", label: "Install step", type: "toggle", default: true },
    { prop: "restart", label: "Restart step", type: "toggle", default: true },
    { prop: "accent", label: "Accent", type: "select", options: ["Ink", "Pick", "Ok"], default: "Ink" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./UpdateButton").then((m) => m.UpdateButton),
} satisfies Meta;
