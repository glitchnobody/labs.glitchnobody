import type { Meta } from "..";
import "./PricingToggle.css";
import "./PricingToggle.site.css";

export default {
  name: "Pricing toggle",
  description: "A pricing card with a Monthly / Yearly switch. Flip it: the price rolls, the billing line changes and the yearly-only perks light up.",
  tag: "Select",
  install: "npm install @iconify/react",
  sounds: ["tick", "pop"],
  demo: [
    { move: [1.1, 0.275], ms: 0 },
    { move: [0.71, 0.275], ms: 500 },
    { down: true },
    { up: true },
    { wait: 1000 },
    { move: [0.29, 0.275], ms: 400 },
    { down: true },
    { up: true },
    { wait: 800 },
    { move: [0.71, 0.275], ms: 400 },
    { down: true },
    { up: true },
    { wait: 800 },
    { move: [1.1, 0.275], ms: 500 },
  ],
  knobs: [
    { prop: "price", label: "Monthly price", type: "range", min: 5, max: 99, default: 24 },
    { prop: "discount", label: "Yearly discount (%)", type: "range", min: 0, max: 50, step: 5, default: 20 },
    { prop: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "GBP", "INR"], default: "USD" },
    { prop: "toggle", label: "Toggle", type: "select", options: ["Segmented", "Switch", "Tabs"], default: "Segmented" },
    { prop: "features", label: "Features", type: "range", min: 2, max: 6, default: 4 },
    { prop: "cta", label: "Button", type: "select", options: ["Solid", "Outline"], default: "Solid" },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./PricingToggle").then((m) => m.PricingToggle),
} satisfies Meta;
