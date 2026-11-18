import type { Meta } from "..";
import "./SharePanel.css";
import "./SharePanel.site.css";

export default {
  name: "Share panel",
  description: "A share panel where going public folds the invite list away. Flip \"Anyone with the link\" on and Invite tucks under; flip it off and it unfolds.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["tick", "collapse", "expand"],
  demo: [
    { move: [1.15, 0.25], ms: 0 },
    { move: [0.84, 0.3], ms: 500 },
    { down: true },
    { up: true },
    { wait: 1000 },
    { move: [0.84, 0.5], ms: 150 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [1.15, 0.25], ms: 500 },
  ],
  knobs: [
    { prop: "public", label: "Start public", type: "toggle", default: false },
    { prop: "speed", label: "Fold speed", type: "range", min: 0, max: 100, default: 60 },
    { prop: "blur", label: "Fold blur (px)", type: "range", min: 0, max: 16, default: 6 },
    { prop: "link", label: "Link", type: "text", default: "labs.glitchnobody.com/share/453", maxLength: 60 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./SharePanel").then((m) => m.SharePanel),
} satisfies Meta;
