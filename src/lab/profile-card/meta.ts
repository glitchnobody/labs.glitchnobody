import type { Meta } from "..";
import "./ProfileCard.css";
import "./ProfileCard.site.css";

export default {
  name: "Profile card",
  description: "A social profile card. Move over it to tilt it and slide the light across the cover, press Follow to watch the follower count roll, and press the link to copy it.",
  tag: "Press",
  install: "npm install @iconify/react",
  sounds: ["pop", "collapse", "tick"],
  siteProps: { images: Array.from({ length: 11 }, (_, i) => `/lab/demoimages/${i + 1}.png`) },
  demo: [
    { move: [0.2, 0.22], ms: 0 },
    { move: [0.8, 0.22], ms: 1000 },
    { move: [0.77, 0.46], ms: 500 },
    { down: true },
    { up: true },
    { wait: 1600 },
    { down: true },
    { up: true },
    { wait: 600 },
    { move: [1.3, 0.5], ms: 500 },
  ],
  knobs: [
    { prop: "tilt", label: "Tilt (°)", type: "range", min: 0, max: 15, default: 8 },
    { prop: "glare", label: "Glare", type: "toggle", default: true },
    { prop: "cover", label: "Cover", type: "select", options: ["Metal", "Gradient", "Image"], default: "Metal" },
    { prop: "logoShape", label: "Logo", type: "select", options: ["Square", "Round"], default: "Square" },
    { prop: "verified", label: "Verified", type: "toggle", default: true },
    { prop: "socials", label: "Socials", type: "toggle", default: true },
    { prop: "stats", label: "Stats", type: "toggle", default: true },
    { prop: "link", label: "Link", type: "toggle", default: true },
    { prop: "radius", label: "Corner (px)", type: "range", min: 0, max: 32, default: 10 },
    { prop: "sound", label: "Sound", type: "toggle", default: true },
    { prop: "volume", label: "Volume", type: "range", min: 0, max: 100, default: 70 },
  ],
  load: () => import("./ProfileCard").then((m) => m.ProfileCard),
} satisfies Meta;
