# glitchnobody labs

A wall of interactive React components. Each one opens to a live stage, its settings and its source. Built on Astro.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build
```

## Add a component

A component is one folder in `src/lab/`; the folder name is its URL. Nothing else needs editing.

```text
src/lab/my-thing/
  MyThing.tsx    the component; every prop optional
  MyThing.css    its styles, reading colours from src/lab/tokens.css
  meta.ts        name, description, tag, knobs, loader
```

```ts
// src/lab/my-thing/meta.ts
import type { Meta } from "..";
import "./MyThing.css";

export default {
  name: "My thing",
  description: "One sentence on what it does and how to play with it.",
  tag: "Press", // the filter chip it appears under
  install: "npm install framer-motion", // only if it needs packages beyond React
  knobs: [
    { prop: "size", label: "Size", type: "range", min: 8, max: 20, default: 10 },
    { prop: "style", label: "Style", type: "select", options: ["Bar", "Field"], default: "Bar" },
    { prop: "auto", label: "Auto", type: "toggle", default: false },
  ],
  load: () => import("./MyThing").then((m) => m.MyThing),
} satisfies Meta;
```

- **Knobs are props.** Each knob sets the prop of the same name on the live component.
- **Code view** shows every `.tsx` and `.css` file in the folder, exactly as it runs. "How it works" is read from a header comment in the `.tsx` that starts `/* ══ Name ═══` with `── HEADING ───` lines between paragraphs; leave the comment out and the section is too.
- **Fill and Stroke** are set by the site as `data-theme` / `data-fill` and `data-stroke="on"` on the stage. Style against them if the component should respond.
- **Images** go in `public/lab/`.

## Where things are

| Path | What it is |
| --- | --- |
| `src/lab/index.ts` | Builds the registry from every `meta.ts` |
| `src/components/Wall.astro` | The wall and its filter chips; every page renders it |
| `src/components/Block.tsx` | Renders one component by slug |
| `src/components/Modal.tsx` | Opens a component over the wall; `/slug` is the open state |
| `src/components/Detail.tsx` | The modal's contents: stage, settings, code view |
| `src/pages/[slug].json.ts` | Highlighted source and "How it works" notes for the code view |
| `src/layouts/Layout.astro` | Header, command menu (Ctrl/Cmd K), theme (Alt/Option D), mute |

Third-party code and its licences are listed in [THIRD_PARTY.md](THIRD_PARTY.md).
