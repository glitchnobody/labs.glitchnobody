import type { Meta } from "..";
import "./InputBox.css";
import "./InputBox.site.css";

export default {
  name: "Input box",
  description: "A username field with a floating label and live checks. Focus it and the border draws itself; type and the rules tick off while a ring counts your characters. Try jonas or mira for a taken name.",
  tag: "Type",
  install: "npm install @iconify/react",
  sounds: ["tick", "pop", "error", "swipe"],
  demo: [
    { move: [0.5, 1.3], ms: 0 },
    { move: [0.4, 0.22], ms: 500 },
    { down: true },
    { up: true },
    { type: "mira_k", ms: 700 },
    { wait: 1400 },
    { move: [0.94, 0.22], ms: 400 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.5, 1.3], ms: 500 },
  ],
  knobs: [
    { prop: "label", label: "Label", type: "text", maxLength: 20, default: "Username" },
    { prop: "max", label: "Max length", type: "range", min: 8, max: 32, default: 16 },
    { prop: "size", label: "Size", type: "select", options: ["Small", "Medium", "Large"], default: "Medium" },
    { prop: "width", label: "Width (px)", type: "range", min: 200, max: 340, default: 280 },
    { prop: "radius", label: "Corner (px)", type: "range", min: 0, max: 24, default: 6 },
    { prop: "ring", label: "Ring draw (ms)", type: "range", min: 0, max: 1000, step: 50, default: 450 },
    { prop: "rules", label: "Rules", type: "toggle", default: true },
    { prop: "counter", label: "Counter", type: "toggle", default: true },
    { prop: "check", label: "Availability", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./InputBox").then((m) => m.InputBox),
} satisfies Meta;
