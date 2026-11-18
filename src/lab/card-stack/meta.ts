import type { Meta } from "..";
import "./CardStack.css";
import "./CardStack.site.css";

export default {
  name: "Card stack",
  description: "An endless deck of picture cards. Drag or flick the top card to either side and it tucks in at the back of the pile; a short drag springs back.",
  tag: "Drag",
  install: "npm install motion",
  sounds: ["swipe", "slide", "jelly"],
  siteProps: { images: Array.from({ length: 11 }, (_, i) => `/lab/demoimages/${i + 1}.png`) },
  demo: [
    { move: [0.5, 1.15], ms: 0 },
    { move: [0.5, 0.55], ms: 500 },
    { down: true },
    { move: [1.1, 0.42], ms: 350 },
    { up: true },
    { wait: 600 },
    { move: [0.5, 0.55], ms: 400 },
    { down: true },
    { move: [0.1, 0.55], ms: 180 },
    { up: true },
    { wait: 600 },
    { move: [0.5, 1.15], ms: 500 },
  ],
  knobs: [
    { prop: "count", label: "Cards", type: "range", min: 3, max: 8, default: 5 },
    { prop: "width", label: "Width (px)", type: "range", min: 140, max: 260, default: 200 },
    { prop: "radius", label: "Corner (px)", type: "range", min: 0, max: 32, default: 4 },
    { prop: "offset", label: "Peek (px)", type: "range", min: 0, max: 24, default: 10 },
    { prop: "tilt", label: "Tilt", type: "range", min: 0, max: 30, default: 12 },
    { prop: "threshold", label: "Throw at (px)", type: "range", min: 40, max: 160, default: 90 },
    { prop: "bounce", label: "Bounce", type: "select", options: ["Low", "Medium", "High"], default: "Medium" },
    { prop: "captions", label: "Captions", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./CardStack").then((m) => m.CardStack),
} satisfies Meta;
