import type { Meta } from "..";
import "./WalletTopup.css";

export default {
  name: "Wallet top-up",
  description: "A wallet balance that opens into a top-up form. Press Add Cash, pick a card and an amount, and watch the balance roll up as coins burst out.",
  tag: "Press",
  install: "npm install motion @iconify/react",
  sounds: ["expand", "collapse", "tick", "coins"],
  demo: [
    { move: [0.6, 1.8], ms: 0 },
    { move: [0.766, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [0.5, 0.502], ms: 500 },
    { down: true },
    { up: true },
    { move: [0.5, 0.735], ms: 400 },
    { down: true },
    { up: true },
    { move: [0.234, 0.896], ms: 400 },
    { down: true },
    { up: true },
    { wait: 1800 },
    { move: [0.6, 1.8], ms: 500 },
  ],
  knobs: [
    { prop: "chips", label: "Amounts", type: "select", options: ["Small", "Medium", "Large"], default: "Medium" },
    { prop: "cards", label: "Saved cards", type: "range", min: 1, max: 3, default: 2 },
    { prop: "burst", label: "Coin burst", type: "toggle", default: true },
    { prop: "reset", label: "Reset after (s)", type: "range", min: 0, max: 20, default: 5 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./WalletTopup").then((m) => m.WalletTopup),
} satisfies Meta;
