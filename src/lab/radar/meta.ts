import type { Meta } from "..";
import "./Radar.css";

const AV = [12, 15, 21, 1, 6, 24, 3, 30, 37, 44, 50, 18];

export default {
  name: "Radar",
  description: "A nearby-people radar whose sweep pings each blip as it passes. Press a blip to see who it is and how far away; press empty radar to drop someone new.",
  tag: "Press",
  sounds: ["ping", "pop", "tick"],
  siteProps: { avatars: AV.map((n) => `/lab/avatars/${String(n).padStart(2, "0")}.webp`) },
  demo: [
    { move: [1.05, 1.05], ms: 0 },
    { move: [0.684, 0.453], ms: 600 },
    { down: true },
    { up: true },
    { wait: 1000 },
    { move: [0.3, 0.7], ms: 500 },
    { down: true },
    { up: true },
    { wait: 1500 },
    { move: [0.684, 0.453], ms: 500 },
    { down: true },
    { up: true },
    { wait: 300 },
    { move: [0.3, 0.7], ms: 400 },
    { down: true },
    { up: true },
    { down: true },
    { up: true },
    { move: [1.05, 1.05], ms: 500 },
  ],
  knobs: [
    { prop: "speed", label: "Sweep speed", type: "range", min: 0, max: 100, default: 50 },
    { prop: "wedge", label: "Wedge (°)", type: "range", min: 0, max: 120, default: 60 },
    { prop: "afterglow", label: "Afterglow (s)", type: "range", min: 0.3, max: 4, step: 0.1, default: 1.6 },
    { prop: "rings", label: "Rings", type: "range", min: 2, max: 8, default: 5 },
    { prop: "blips", label: "People", type: "range", min: 0, max: 8, default: 4 },
    { prop: "moving", label: "Moving blips", type: "toggle", default: false },
    { prop: "crosshair", label: "Crosshair", type: "toggle", default: true },
    { prop: "color", label: "Colour", type: "select", options: ["Phosphor", "Amber", "Accent", "Ink"], default: "Phosphor" },
    { prop: "size", label: "Size (px)", type: "range", min: 200, max: 420, default: 300 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./Radar").then((m) => m.Radar),
} satisfies Meta;
