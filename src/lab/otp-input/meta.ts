import type { Meta } from "..";
import "./OtpInput.css";
import "./OtpInput.site.css";

export default {
  name: "OTP input",
  description: "A one-time code field with a box per digit. Type or paste a code: a wrong one shakes and clears, the right one (424242) ripples green.",
  tag: "Type",
  install: "npm install @iconify/react",
  sounds: ["tick", "error", "join", "pop"],
  demo: [
    { move: [0.5, 1.8], ms: 0 },
    { move: [0.07, 0.3], ms: 500 },
    { down: true },
    { up: true },
    { type: "123456", ms: 900 },
    { wait: 1500 },
    { type: "424242", ms: 900 },
    { wait: 1400 },
    { move: [0.5, 1.8], ms: 500 },
  ],
  knobs: [
    { prop: "length", label: "Digits", type: "range", min: 4, max: 8, default: 6 },
    { prop: "code", label: "Correct code", type: "text", maxLength: 8, default: "424242" },
    { prop: "shape", label: "Shape", type: "select", options: ["Rounded", "Square", "Circle"], default: "Rounded" },
    { prop: "size", label: "Box (px)", type: "range", min: 32, max: 60, default: 44 },
    { prop: "group", label: "Split in half", type: "toggle", default: true },
    { prop: "mask", label: "Mask digits", type: "toggle", default: false },
    { prop: "delay", label: "Verify (ms)", type: "range", min: 0, max: 1500, step: 100, default: 600 },
    { prop: "resend", label: "Resend (s)", type: "range", min: 0, max: 60, step: 5, default: 30 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./OtpInput").then((m) => m.OtpInput),
} satisfies Meta;
