import type { Meta } from "..";
import "./SplitSlider.css";
import "./SplitSlider.site.css";

export default {
  name: "Split slider",
  description: "One track split between two things. Drag the divider to change the mix: the percentages roll, and when a side gets too thin its label hops up.",
  tag: "Slide",
  sounds: ["tick", "pop"],
  demo: [
    { move: [0.6, 1.6], ms: 0 },
    { move: [0.71, 0.7], ms: 500 },
    { down: true },
    { move: [0.08, 0.7], ms: 900 },
    { move: [0.86, 0.7], ms: 1200 },
    { move: [0.5, 0.7], ms: 600 },
    { up: true },
    { wait: 300 },
    { move: [0.6, 1.6], ms: 500 },
  ],
  knobs: [
    { prop: "left", label: "Left label", type: "text", maxLength: 12, default: "Coffee" },
    { prop: "right", label: "Right label", type: "text", maxLength: 12, default: "Milk" },
    { prop: "split", label: "Split (%)", type: "range", min: 0, max: 100, default: 71 },
    { prop: "threshold", label: "Hop below (%)", type: "range", min: 10, max: 30, default: 18 },
    { prop: "color", label: "Left colour", type: "select", options: ["Danger", "Pick", "Ok", "Ink"], default: "Danger" },
    { prop: "mono", label: "Mono labels", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./SplitSlider").then((m) => m.SplitSlider),
} satisfies Meta;
