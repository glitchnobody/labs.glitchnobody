import type { ComponentType } from "react";

type KnobBase = { prop: string; label: string };
export type Knob =
  | (KnobBase & { type: "range"; min: number; max: number; step?: number; default: number })
  | (KnobBase & { type: "select"; options: string[]; default: string })
  | (KnobBase & { type: "toggle"; default: boolean })
  | (KnobBase & { type: "text"; default: string; maxLength?: number });

/* A demo is a short script for a pretend cursor, in fractions of the block's box:
   move there over `ms`, press, release, wait, or type into the focused field over `ms`. */
export type Step =
  | { move: [number, number]; ms?: number }
  | { down: true }
  | { up: true }
  | { wait: number }
  | { type: string; ms?: number };

export type Meta = {
  name: string;
  description: string;
  /* the interaction it is filed under on the wall: Hover, Press, Drag… */
  tag: string;
  /* shown above the code when the block needs packages beyond React */
  install?: string;
  /* set only for code taken from elsewhere: the page it came from, shown as a credit */
  adaptedFrom?: string;
  /* what the card's play button shows */
  demo?: Step[];
  /* the sound names it passes to onSound, files in public/sounds/<name>.mp3 */
  sounds?: string[];
  /* props given on the site only (the avatar and filler image URLs); never in Usage or the copied prompt */
  siteProps?: Record<string, unknown>;
  knobs: Knob[];
  load: () => Promise<ComponentType<any>>;
};

/* a component is a folder with a meta.ts; the folder name is its slug */
const metas = import.meta.glob<Meta>("./*/meta.ts", { eager: true, import: "default" });

export const blocks: Record<string, Meta> = Object.fromEntries(
  Object.entries(metas).map(([path, meta]) => [path.split("/")[1], meta]),
);
