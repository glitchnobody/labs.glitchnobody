import type { Meta } from "..";
import "./SearchExpand.css";
import "./SearchExpand.site.css";

export default {
  name: "Search expand",
  description: "A round search button that stretches into a field. Press it, type a few letters and the list of components filters and reshuffles; pick one or press × to clear and close.",
  tag: "Type",
  install: "npm install @iconify/react",
  sounds: ["expand", "collapse", "tick", "shuffle", "pop"],
  demo: [
    { move: [1.4, 1.4], ms: 0 },
    { move: [0.5, 0.5], ms: 500 },
    { down: true },
    { up: true },
    { wait: 900 },
    { move: [0.4, 0.115], ms: 400 },
    { down: true },
    { up: true },
    { type: "tim", ms: 700 },
    { wait: 1200 },
    { move: [0.93, 0.115], ms: 500 },
    { down: true },
    { up: true },
    { wait: 500 },
    { down: true },
    { up: true },
    { wait: 500 },
    { move: [1.4, 1.4], ms: 400 },
  ],
  knobs: [
    { prop: "max", label: "Results", type: "range", min: 3, max: 8, default: 4 },
    { prop: "blur", label: "Reorder blur (px)", type: "range", min: 0, max: 16, default: 6 },
    { prop: "speed", label: "Reorder speed", type: "range", min: 0, max: 100, default: 60 },
    { prop: "tags", label: "Show tags", type: "toggle", default: false },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./SearchExpand").then((m) => m.SearchExpand),
} satisfies Meta;
