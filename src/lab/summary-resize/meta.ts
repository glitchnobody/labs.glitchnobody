import type { Meta } from "..";
import "./SummaryResize.css";
import "./SummaryResize.site.css";

export default {
  name: "Summary resize",
  description: "A paragraph you resize to summarise. Drag the card's edge narrower and the text rewrites itself shorter, wider for the full story, or click a stop on the ruler.",
  tag: "Drag",
  sounds: ["tick"],
  demo: [
    { move: [1.1, 0.6], ms: 0 },
    { move: [0.732, 0.57], ms: 500 },
    { down: true },
    { move: [0.572, 0.57], ms: 700 },
    { up: true },
    { wait: 700 },
    { move: [0.572, 0.57], ms: 300 },
    { down: true },
    { move: [0.972, 0.57], ms: 900 },
    { up: true },
    { wait: 700 },
    { move: [1.1, 0.6], ms: 500 },
  ],
  knobs: [
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./SummaryResize").then((m) => m.SummaryResize),
} satisfies Meta;
