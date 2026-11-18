import type { Meta } from "..";
import "./DateScrubber.css";
import "./DateScrubber.site.css";

export default {
  name: "Date scrubber",
  description: "A date picker you flick like a ruler. Drag or flick the day ticks under the marker; it glides, snaps to a day, and the Today pill brings you back.",
  tag: "Drag",
  sounds: ["tick", "swipe"],
  demo: [
    { move: [0.2, 1.2], ms: 0 },
    { move: [0.3, 0.75], ms: 400 },
    { down: true },
    { move: [0.75, 0.75], ms: 300 },
    { up: true },
    { wait: 2200 },
    { move: [0.85, 0.15], ms: 500 },
    { down: true },
    { up: true },
    { wait: 1500 },
    { move: [0.2, 1.2], ms: 500 },
  ],
  knobs: [
    { prop: "range", label: "Range (days)", type: "range", min: 30, max: 365, step: 15, default: 90 },
    { prop: "spacing", label: "Tick spacing (px)", type: "range", min: 5, max: 16, default: 9 },
    { prop: "fisheye", label: "Fisheye", type: "range", min: 0, max: 100, default: 60 },
    { prop: "friction", label: "Momentum", type: "range", min: 0, max: 100, default: 50 },
    { prop: "accent", label: "Accent", type: "select", options: ["Danger", "Pick", "Ink"], default: "Danger" },
    { prop: "format", label: "Format", type: "select", options: ["Sun • Oct 27", "27 Oct 2026", "Oct 27"], default: "Sun • Oct 27" },
    { prop: "months", label: "Month labels", type: "toggle", default: false },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./DateScrubber").then((m) => m.DateScrubber),
} satisfies Meta;
