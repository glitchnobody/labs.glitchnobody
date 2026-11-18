import type { Meta } from "..";
import "./NotifyMe.css";
import "./NotifyMe.site.css";

export default {
  name: "Notify me",
  description: "A Notify me button that opens into an email field. Type an address and press Enter: a wrong one shakes, a good one folds into You're on the list.",
  tag: "Type",
  install: "npm install @iconify/react",
  sounds: ["expand", "collapse", "tick", "join"],
  demo: [
    { move: [0.5, 1.6], ms: 0 },
    { move: [0.5, 0.5], ms: 450 },
    { down: true },
    { up: true },
    { wait: 700 },
    { move: [0.25, 0.5], ms: 300 },
    { down: true },
    { up: true },
    { type: "mira@\n", ms: 500 },
    { wait: 500 },
    { type: "example.com\n", ms: 700 },
    { wait: 1500 },
    { move: [0.5, 1.6], ms: 400 },
  ],
  knobs: [
    { prop: "blur", label: "Blur (px)", type: "range", min: 0, max: 20, default: 8 },
    { prop: "speed", label: "Speed", type: "range", min: 0, max: 100, default: 60 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./NotifyMe").then((m) => m.NotifyMe),
} satisfies Meta;
