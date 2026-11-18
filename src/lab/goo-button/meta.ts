import type { Meta } from "..";
import "./GooButton.css";

export default {
  name: "Goo button",
  description: "A call-to-action whose arrow is a drop of liquid. Hover and the arrow melts into the button and turns up-right; press and the arrow shoots off.",
  tag: "Hover",
  install: "npm install @iconify/react",
  sounds: ["jelly", "whoosh"],
  demo: [
    { move: [0.5, 2.0], ms: 0 },
    { move: [0.35, 0.5], ms: 500 },
    { wait: 600 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.5, 2.0], ms: 500 },
    { wait: 400 },
  ],
  knobs: [
    { prop: "label", label: "Label", type: "text", maxLength: 24, default: "Explore more" },
    { prop: "goo", label: "Goo", type: "range", min: 2, max: 14, default: 7 },
    { prop: "gap", label: "Gap (px)", type: "range", min: 0, max: 24, default: 8 },
    { prop: "size", label: "Size", type: "select", options: ["S", "M", "L"], default: "M" },
    { prop: "accent", label: "Colour", type: "select", options: ["Ink", "Pick"], default: "Ink" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./GooButton").then((m) => m.GooButton),
} satisfies Meta;
