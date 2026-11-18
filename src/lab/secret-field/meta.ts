import type { Meta } from "..";
import "./SecretField.css";

export default {
  name: "Secret field",
  description: "A card number that hides itself. Copy it while the ring counts down; when it runs out the digits scramble into a mask, and the eye scrambles them back.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["tick", "pop"],
  demo: [
    { move: [0.5, 1.8], ms: 0 },
    { move: [0.93, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { move: [0.8, 1.7], ms: 400 },
    { wait: 6800 },
    { move: [0.93, 0.5], ms: 400 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.5, 1.8], ms: 500 },
  ],
  knobs: [
    { prop: "reveal", label: "Reveal (s)", type: "range", min: 2, max: 20, default: 6 },
    { prop: "masked", label: "Start masked", type: "toggle", default: false },
    { prop: "visible", label: "Visible digits", type: "range", min: 0, max: 4, default: 4 },
    { prop: "maskChar", label: "Mask", type: "select", options: ["×", "•", "*"], default: "×" },
    { prop: "scramble", label: "Scramble (ms)", type: "range", min: 0, max: 900, step: 30, default: 420 },
    { prop: "ring", label: "Ring", type: "select", options: ["Ok", "Pick", "Ink"], default: "Ok" },
    { prop: "grouping", label: "Group in 4s", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./SecretField").then((m) => m.SecretField),
} satisfies Meta;
