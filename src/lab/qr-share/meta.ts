import type { Meta } from "..";
import "./QrShare.css";

export default {
  name: "QR share",
  description: "A share pill that blooms into a scannable QR code. Press it, watch the dots ripple in, copy the link, then close it back.",
  tag: "Press",
  install: "npm install qrcode-generator @iconify/react",
  sounds: ["expand", "collapse"],
  demo: [
    { move: [0.6, 1.8], ms: 0 },
    { move: [0.5, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 1000 },
    { move: [0.3, 0.88], ms: 400 },
    { down: true },
    { up: true },
    { wait: 900 },
    { move: [0.92, 0.88], ms: 400 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [0.6, 1.8], ms: 500 },
  ],
  knobs: [
    { prop: "dots", label: "Dots", type: "select", options: ["Round", "Square", "Diamond"], default: "Round" },
    { prop: "finders", label: "Finders", type: "select", options: ["Rounded", "Square", "Circle"], default: "Rounded" },
    { prop: "ripple", label: "Ripple", type: "toggle", default: true },
    { prop: "rippleSpeed", label: "Ripple (ms)", type: "range", min: 150, max: 1200, step: 50, default: 500 },
    { prop: "blur", label: "Blur (px)", type: "range", min: 0, max: 20, default: 10 },
    { prop: "size", label: "QR size (px)", type: "range", min: 120, max: 220, default: 170 },
    { prop: "quiet", label: "Margin (modules)", type: "range", min: 0, max: 4, default: 2 },
    { prop: "accent", label: "Dots colour", type: "select", options: ["Ink", "Pick"], default: "Ink" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./QrShare").then((m) => m.QrShare),
} satisfies Meta;
