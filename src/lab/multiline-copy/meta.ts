import type { Meta } from "..";
import "./MultilineCopy.css";
import "./MultilineCopy.site.css";

export default {
  name: "Multi-line copy",
  description: "A message with a copy button that shows what it copied: a highlight and underline sweep through every line, then fade. Press Copy.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["tick"],
  demo: [
    { move: [1.2, 1.3], ms: 0 },
    { move: [0.9, 0.1], ms: 500 },
    { down: true },
    { up: true },
    { wait: 1600 },
    { down: true },
    { up: true },
    { wait: 1500 },
    { move: [1.2, 1.3], ms: 500 },
  ],
  knobs: [
    { prop: "heading", label: "Heading", type: "text", maxLength: 40, default: "Share your invite" },
    { prop: "text", label: "Text", type: "text", maxLength: 300, default: "Hey! I'm using Labs to keep my projects in one place. Here's my invite link so you can join the workspace: labs.example/join/9F3K. It expires in 7 days, so jump in when you can." },
    { prop: "speed", label: "Sweep (ms per line)", type: "range", min: 120, max: 900, step: 20, default: 320 },
    { prop: "stagger", label: "Line delay (ms)", type: "range", min: 0, max: 300, step: 10, default: 90 },
    { prop: "hold", label: "Hold (s)", type: "range", min: 0.3, max: 3, step: 0.1, default: 1.2 },
    { prop: "highlight", label: "Highlight", type: "select", options: ["Selection", "Accent", "Ok", "Ink"], default: "Selection" },
    { prop: "radius", label: "Highlight corner (px)", type: "range", min: 0, max: 10, default: 4 },
    { prop: "underline", label: "Underline", type: "toggle", default: true },
    { prop: "underlineWidth", label: "Underline (px)", type: "range", min: 1, max: 4, default: 2 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./MultilineCopy").then((m) => m.MultilineCopy),
} satisfies Meta;
