import type { Meta } from "..";
import "./AspectRatio.css";
import "./AspectRatio.site.css";

export default {
  name: "Aspect ratio",
  description: "An aspect-ratio picker with a photo that re-crops itself. Press square, landscape or portrait and the photo springs into the new shape; the dots hold more ratios.",
  tag: "Select",
  install: "npm install @iconify/react",
  sounds: ["tick", "expand", "collapse"],
  siteProps: { images: ["/lab/demoimages/1.png"] },
  demo: [
    { move: [0.5, 1.15], ms: 0 },
    { move: [0.379, 0.83], ms: 500 },
    { down: true },
    { up: true },
    { wait: 700 },
    { move: [0.621, 0.83], ms: 300 },
    { down: true },
    { up: true },
    { wait: 700 },
    { move: [0.136, 0.83], ms: 300 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.5, 1.15], ms: 500 },
  ],
  knobs: [
    { prop: "ratio", label: "Ratio", type: "select", options: ["1:1", "16:9", "9:16", "4:3", "3:2", "21:9", "Free"], default: "1:1" },
    { prop: "grid", label: "Grid", type: "select", options: ["Off", "Thirds", "Golden"], default: "Thirds" },
    { prop: "bounce", label: "Bounce", type: "range", min: 0, max: 100, default: 35 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./AspectRatio").then((m) => m.AspectRatio),
} satisfies Meta;
