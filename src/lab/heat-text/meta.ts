import type { Meta } from "..";
import "./HeatText.css";

export default {
  name: "Heat text",
  description: "Words that heat up under your pointer. Move across them to leave a thermal-camera trail that blooms from blue to red to yellow, then cools away.",
  tag: "Hover",
  sounds: ["heat"],
  demo: [
    { move: [0.75, 0.25], ms: 0 },
    { move: [0.3, 0.28], ms: 500 },
    { move: [0.62, 0.5], ms: 500 },
    { move: [0.25, 0.7], ms: 500 },
    { move: [0.6, 0.84], ms: 500 },
    { move: [1.3, 1.2], ms: 500 },
    { wait: 1500 },
  ],
  knobs: [
    { prop: "text", label: "Text", type: "text", maxLength: 80, default: "COLOR CHANGES EVERYTHING DEPENDING ON HOW LIGHT TOUCHES IT" },
    { prop: "fontSize", label: "Font size (px)", type: "range", min: 16, max: 48, default: 30 },
    { prop: "tracking", label: "Letter spacing (em)", type: "range", min: 0, max: 0.2, step: 0.01, default: 0.04 },
    { prop: "brush", label: "Brush (px)", type: "range", min: 10, max: 60, default: 26 },
    { prop: "heat", label: "Heat", type: "range", min: 10, max: 100, default: 60 },
    { prop: "cooling", label: "Cooling (s)", type: "range", min: 0.5, max: 6, step: 0.1, default: 2.2 },
    { prop: "palette", label: "Palette", type: "select", options: ["Thermal", "Infrared", "Ink", "Pick"], default: "Thermal" },
    { prop: "goo", label: "Goo", type: "range", min: 0, max: 100, default: 70 },
    { prop: "drift", label: "Idle drift", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./HeatText").then((m) => m.HeatText),
} satisfies Meta;
