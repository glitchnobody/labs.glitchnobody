import type { Meta } from "..";
import "./TagPicker.css";
import "./TagPicker.site.css";

export default {
  name: "Tag picker",
  description: "A tag field with suggestions under it. Click a suggestion and it flies into the field, click × to send it home, type to filter, and drag tags to reorder.",
  tag: "Select",
  install: "npm install motion @iconify/react",
  sounds: ["pop", "swipe", "tick", "collapse"],
  demo: [
    { move: [0.5, 1.15], ms: 0 },
    { move: [0.71, 0.878], ms: 500 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.527, 0.878], ms: 400 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.206, 0.238], ms: 500 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.5, 1.15], ms: 500 },
  ],
  knobs: [
    { prop: "max", label: "Max tags", type: "range", min: 0, max: 8, default: 0 },
    { prop: "create", label: "Allow create", type: "toggle", default: true },
    { prop: "tagStyle", label: "Tag style", type: "select", options: ["Pill", "Square", "Outline"], default: "Pill" },
    { prop: "speed", label: "Flight speed", type: "range", min: 0, max: 100, default: 60 },
    { prop: "bounce", label: "Bounce", type: "range", min: 0, max: 100, default: 25 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./TagPicker").then((m) => m.TagPicker),
} satisfies Meta;
