import type { Meta } from "..";
import "./HoldToDelete.css";
import "./HoldToDelete.site.css";

export default {
  name: "Hold to delete",
  description: "A destructive button that only works if you hold it. Hold until the fill crosses it to delete, then press Undo before the ring runs out.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["charge", "crunch", "swipe", "pop", "collapse"],
  demo: [
    { move: [0.5, 1.8], ms: 0 },
    { move: [0.5, 0.5], ms: 500 },
    { down: true },
    { wait: 640 },
    { up: true },
    { wait: 600 },
    { down: true },
    { wait: 1300 },
    { up: true },
    { wait: 800 },
    { move: [0.77, 0.5], ms: 400 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.5, 1.8], ms: 500 },
  ],
  knobs: [
    { prop: "label", label: "Label", type: "text", maxLength: 24, default: "Delete project" },
    { prop: "doneLabel", label: "Done label", type: "text", maxLength: 16, default: "Deleted" },
    { prop: "hold", label: "Hold (s)", type: "range", min: 0.5, max: 3, step: 0.1, default: 1.2 },
    { prop: "easing", label: "Fill easing", type: "select", options: ["Linear", "Build-up", "Ease-out"], default: "Build-up" },
    { prop: "undo", label: "Undo window (s)", type: "range", min: 2, max: 10, step: 0.5, default: 5 },
    { prop: "fill", label: "Fill colour", type: "select", options: ["Danger", "Accent", "Ink"], default: "Danger" },
    { prop: "radius", label: "Corner (px)", type: "range", min: 6, max: 28, default: 28 },
    { prop: "haptic", label: "Haptic", type: "toggle", default: true },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./HoldToDelete").then((m) => m.HoldToDelete),
} satisfies Meta;
