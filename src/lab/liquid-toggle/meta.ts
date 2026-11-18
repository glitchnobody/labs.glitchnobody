import type { Meta } from "..";
import "./LiquidToggle.css";

export default {
  name: "Liquid toggle",
  description: "An on/off switch with a liquid lens on a gradient pill. Click it to watch the lens stretch across and spring round, or grab the lens and fling it.",
  tag: "Press",
  sounds: ["blip", "jelly"],
  demo: [
    { move: [0.2, 1.8], ms: 0 },
    { move: [0.2, 0.5], ms: 500 },
    { down: true },
    { move: [0.95, 0.5], ms: 200 },
    { up: true },
    { wait: 800 },
    { move: [0.8, 0.5], ms: 250 },
    { down: true },
    { move: [0.05, 0.5], ms: 200 },
    { up: true },
    { wait: 600 },
    { move: [0.2, 1.8], ms: 500 },
  ],
  knobs: [
    { prop: "size", label: "Size", type: "select", options: ["S", "M", "L"], default: "M" },
    { prop: "blur", label: "Outside blur (px)", type: "range", min: 0, max: 20, default: 10 },
    { prop: "stretch", label: "Stretch", type: "range", min: 0, max: 1, step: 0.05, default: 0.7 },
    { prop: "bounce", label: "Bounce", type: "range", min: 0, max: 100, default: 40 },
    { prop: "palette", label: "Palette", type: "select", options: ["Red → Blue", "Sunset", "Mint", "Mono"], default: "Red → Blue" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./LiquidToggle").then((m) => m.LiquidToggle),
} satisfies Meta;
