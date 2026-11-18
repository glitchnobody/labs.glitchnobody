import type { Meta } from "..";
import "./GooeyCompare.css";

export default {
  name: "Gooey compare",
  description: "A before and after image slider with a liquid edge. Drag the handle fast and the split bulges, then wobbles back flat; press anywhere on the picture to jump there.",
  tag: "Drag",
  install: "npm install @iconify/react",
  sounds: ["tick", "jelly"],
  siteProps: { images: ["/lab/demoimages/3.png"] },
  demo: [
    { move: [0.5, 1.15], ms: 0 },
    { move: [0.5, 0.5], ms: 500 },
    { down: true },
    { move: [0.88, 0.5], ms: 250 },
    { wait: 700 },
    { move: [0.5, 0.5], ms: 1400 },
    { up: true },
    { wait: 400 },
    { move: [0.5, 1.15], ms: 500 },
  ],
  knobs: [
    { prop: "treatment", label: "Before", type: "select", options: ["Grayscale", "Sepia", "Blur", "Duotone"], default: "Grayscale" },
    { prop: "orientation", label: "Orientation", type: "select", options: ["Horizontal", "Vertical"], default: "Horizontal" },
    { prop: "goo", label: "Goo", type: "range", min: 0, max: 100, default: 60 },
    { prop: "wobble", label: "Wobble", type: "select", options: ["Low", "Medium", "High"], default: "Medium" },
    { prop: "split", label: "Start (%)", type: "range", min: 0, max: 100, default: 50 },
    { prop: "width", label: "Width (px)", type: "range", min: 200, max: 360, default: 300 },
    { prop: "aspect", label: "Aspect", type: "select", options: ["4:3", "1:1", "3:4"], default: "4:3" },
    { prop: "radius", label: "Corner (px)", type: "range", min: 0, max: 32, default: 4 },
    { prop: "labels", label: "Labels", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./GooeyCompare").then((m) => m.GooeyCompare),
} satisfies Meta;
