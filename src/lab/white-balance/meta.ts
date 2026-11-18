import type { Meta } from "..";
import "./WhiteBalance.css";
import "./WhiteBalance.site.css";

export default {
  name: "White balance",
  description: "A white balance control over a photo. Drag the temperature track toward blue or gold and the photo shifts live; press the crosshair to snap back to neutral.",
  tag: "Slide",
  install: "npm install @iconify/react",
  sounds: ["tick", "ping"],
  siteProps: { images: ["/lab/demoimages/3.png"] },
  demo: [
    { move: [0.4, 1.1], ms: 0 },
    { move: [0.423, 0.878], ms: 500 },
    { down: true },
    { move: [0.68, 0.878], ms: 800 },
    { up: true },
    { wait: 200 },
    { down: true },
    { move: [0.05, 0.878], ms: 1000 },
    { up: true },
    { move: [0.88, 0.878], ms: 400 },
    { down: true },
    { up: true },
    { wait: 900 },
    { move: [0.4, 1.1], ms: 500 },
  ],
  knobs: [
    { prop: "kelvin", label: "Temperature (K)", type: "range", min: 2000, max: 10000, step: 50, default: 6500 },
    { prop: "range", label: "Range", type: "select", options: ["2500–9000K", "2000–10000K"], default: "2500–9000K" },
    { prop: "tint", label: "Tint track", type: "toggle", default: false },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./WhiteBalance").then((m) => m.WhiteBalance),
} satisfies Meta;
