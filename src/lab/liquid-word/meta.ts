import type { Meta } from "..";
import "./LiquidWord.css";

export default {
  name: "Liquid word",
  description: "A word made of flowing liquid chrome. Move over it and the flow bends toward you; press and hold to melt the letters together.",
  tag: "Hover",
  sounds: ["heat"],
  demo: [
    { move: [0.05, 0.15], ms: 0 },
    { move: [0.3, 0.75], ms: 500 },
    { move: [0.5, 0.25], ms: 500 },
    { move: [0.7, 0.75], ms: 500 },
    { move: [0.95, 0.3], ms: 500 },
    { move: [0.5, 0.5], ms: 400 },
    { down: true },
    { wait: 1200 },
    { up: true },
    { wait: 500 },
    { move: [1.3, 1.4], ms: 500 },
  ],
  knobs: [
    { prop: "word", label: "Word", type: "text", maxLength: 8, default: "LABS" },
    { prop: "weight", label: "Weight", type: "range", min: 300, max: 500, step: 100, default: 500 },
    { prop: "speed", label: "Flow speed", type: "range", min: 0, max: 100, default: 35 },
    { prop: "stripe", label: "Stripe (px)", type: "range", min: 20, max: 200, default: 90 },
    { prop: "blur", label: "Blur", type: "range", min: 0, max: 12, step: 0.5, default: 4 },
    { prop: "grain", label: "Grain", type: "range", min: 0, max: 100, default: 25 },
    { prop: "chrome", label: "Chrome", type: "range", min: 0, max: 100, default: 60 },
    { prop: "palette", label: "Palette", type: "select", options: ["Thermal", "Chrome", "Sunset", "Mint"], default: "Thermal" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./LiquidWord").then((m) => m.LiquidWord),
} satisfies Meta;
