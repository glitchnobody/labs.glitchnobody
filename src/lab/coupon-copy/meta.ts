import type { Meta } from "..";
import "./CouponCopy.css";

export default {
  name: "Coupon copy",
  description: "A promo code that copies with a countdown. Press Copy: it blurs into \"Code copied!\" while a fill sweeps across, then the code comes back.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["pop", "tick"],
  demo: [
    { move: [0.5, 1.6], ms: 0 },
    { move: [0.85, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { move: [0.7, 1.5], ms: 400 },
    { wait: 3000 },
    { move: [0.5, 1.6], ms: 500 },
  ],
  knobs: [
    { prop: "hold", label: "Hold (s)", type: "range", min: 1, max: 8, step: 0.5, default: 3 },
    { prop: "accent", label: "Accent", type: "select", options: ["Ink", "Ok", "Pick"], default: "Ink" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./CouponCopy").then((m) => m.CouponCopy),
} satisfies Meta;
