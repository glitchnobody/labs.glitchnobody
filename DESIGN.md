# glitchnobody labs: design system

The look of the site and the defaults of every component: colours, corner radius, type, spacing, depth and base motion. Built from three references (2026-11-17), kept only as ideas, no names, art or copy:

- **ElevenLabs** sets the voice: light-weight headings, sentence case, soft surfaces nested in each other, hairline edges, shallow shadows, colour kept inside the objects instead of across the page.
- **Atlas** adds the drafting details: faint paired rails with joint dots, small uppercase utility labels, and a charcoal ground for dark mode.
- **Cursor** sets the rounding: almost-square cards, softer panels, pill actions.

The palette is **neutral** (true greys, no warm tint) in light and dark. The only brand colour is **blue**. Other colours are adapted from ElevenLabs' material colours and only appear where they mean something (state, data, tags).

**Precedence.** This file wins over any `SPEC.md` for colour, radius, type size and weight, spacing and shadows. When building a component, map each spec value to the nearest step here using the tables in "Mapping old spec values". Animation easing and timing stay per component. The base site follows "Motion" below.

---

## 1. Colour

Components only ever read token **names** (see `AGENTS.md`). The values below go into `src/lab/tokens.css`, which already handles light, dark, `[data-theme]` and the modal's Fill switch.

### Light (neutral paper)

| Token | Value | Role |
| ----- | ----- | ---- |
| `--bg` | `#fcfcfc` | Page canvas |
| `--card`, `--surface` | `#f4f4f4` | Stages: wall cards, modal stage, grouped areas |
| `--surface-2` | `#ececec` | Insets, pressed fills, track backgrounds |
| `--surface-3` | `#e3e3e3` | Deepest inset, inactive segments |
| `--fill-slab` | `#ffffff` | Raised surface: a component's own body, panels, inputs |
| `--fill-on`, `--ink` | `#0a0a0a` | Primary ink: headings, body text, primary buttons |
| `--ink-2` | `#404040` | Secondary text, primary-button hover |
| `--ink-3` | `#6b6b6b` | Muted text: captions, labels, support copy (5.3:1 on white, 4.9:1 on `--card`) |
| `--ink-4` | `#a3a3a3` | Placeholder, disabled, tertiary only (never for body text) |
| `--ink-5` | `#d4d4d4` | Strong lines: segmented-control edge, slider track |
| `--pane-edge` | `rgba(0,0,0,0.08)` | Hairline edge (stroke on, dividers) |
| `--hairline` | `rgba(0,0,0,0.05)` | Site rails and section rules |
| `--on-ink` | `#ffffff` | Text on `--ink` fills |

### Dark (neutral charcoal)

| Token | Value | Role |
| ----- | ----- | ---- |
| `--bg` | `#141414` | Page canvas |
| `--card`, `--surface` | `#1b1b1b` | Stages |
| `--surface-2` | `#232323` | Insets, tracks |
| `--surface-3` | `#2b2b2b` | Deepest inset |
| `--fill-slab` | `#222222` | Raised surface (lighter than the stage, as light comes from above) |
| `--fill-on`, `--ink` | `#f2f2f2` | Primary ink |
| `--ink-2` | `#c2c2c2` | Secondary text |
| `--ink-3` | `#8f8f8f` | Muted text (5:1 on `#222`) |
| `--ink-4` | `#636363` | Placeholder, disabled |
| `--ink-5` | `#3a3a3a` | Strong lines |
| `--pane-edge` | `rgba(255,255,255,0.08)` | Hairline edge |
| `--hairline` | `rgba(255,255,255,0.06)` | Site rails |
| `--on-ink` | `#0a0a0a` | Text on `--ink` fills |

Legacy names in `tokens.css` (`--board`, `--slab`, `--on-slab`, `--slab-dark`, `--pane`, `--inlay`, …) are re-pointed at the values above; they are not part of the design vocabulary.

### Accent and state

| Token | Light | Dark | Use |
| ----- | ----- | ---- | --- |
| `--pick` | `#3366e0` | `#5c8bff` | **The accent (blue).** Selection, active ring, sliders' fill, links, the one emphasised thing in a component. Adapted from ElevenLabs' luminous blue. |
| `--pick-soft` | `color-mix(in srgb, var(--pick) 12%, var(--fill-slab))` | same formula | Selected row, soft button, tinted badge |
| `--focus` | `#3366e0` | `#5c8bff` | Focus ring (same blue) |
| `--ok` | `#1e9e5a` | `#3fcf86` | Success, done, positive change |
| `--danger` | `#e04a3a` | `#ff6d5e` | Error, delete, negative change (a warm orange-red) |
| `--warn` | `#d4892a` | `#f0a650` | Warning, near a limit. `--ember` is kept as an alias of `--warn` |

### Material hues

For data, tags and luminous objects only (charts, heatmaps, tag colours, gradient art), never for chrome or text. Adapted from ElevenLabs' orange, violet, cyan and green materials:

| Token | Light | Dark |
| ----- | ----- | ---- |
| `--hue-blue` | `#3366e0` | `#5c8bff` |
| `--hue-violet` | `#7a5ae0` | `#9d85ff` |
| `--hue-cyan` | `#1aa3c4` | `#3cc6e6` |
| `--hue-green` | `#2ea866` | `#4fd28b` |
| `--hue-orange` | `#f06a2a` | `#ff8a4f` |
| `--hue-pink` | `#d94f9a` | `#f27bbd` |

Sequential data (heatmaps, thermal) ramps from `--surface-2` to one hue. Categorical data uses the hues in the order above.

### Colour rules

- **Neutral first.** A component at rest is greys plus at most one accent element. Colour marks state or meaning, never decoration.
- **One surface.** A component is all on `--fill-slab` or all on the stage; no dark band on a light panel. An inverted button (`--ink` fill, `--on-ink` text) is fine.
- **Images and luminous objects** may carry rich colour inside their frame (filler paintings, gradient avatars, gradient spheres). White text or lines on an image are allowed, with a scrim.
- **Links** are `--pick`, no underline, underline on hover. Navigation links are ink, not blue.
- No hard-coded colours outside this file; derived shades use `color-mix` from tokens.

---

## 2. Corner radius

From the Cursor reference, plus one step for small controls:

| Token | Value | Use |
| ----- | ----- | --- |
| `--r-card` | `4px` | Cards, tiles, media frames, images, wall cards, stages, chart bars, thumbnails |
| `--r-control` | `6px` | Inputs, menu rows, list rows, small controls, checkboxes, keycaps, tooltips, badges that are not pills |
| `--r-panel` | `10px` | Panels, popovers, menus, dropdowns, toasts, dialogs, the modal, floating windows, compact components' own body |
| `--r-pill` | `9999px` | Buttons, segmented controls, toggles, chips, tags, search fields, slider tracks |
| (circle) | `50%` | Avatars, round handles, dots, radio buttons |

- **Nested corners:** an element inside a rounded one uses `outer radius − inset`, at least 2 px (a highlight inside a 10 px menu with a 4 px inset is 6 px, which is `--r-control`).
- **Radius knobs** keep their range, but their **default is the role value** from this table.
- Do not invent other radii. A deliberately different shape (a blob, a squircle, a drawn path) is a shape, not a radius.

---

## 3. Typography

**Inter Tight**, one family for everything (already loaded in `Layout.astro`; widen the loaded weights to `300..600`). Stack: `"Inter Tight", "Inter", system-ui, "Helvetica Neue", Arial, sans-serif` as `--font-ui`. Code and spec numbers that need monospace use `--font-code` (`ui-monospace, "JetBrains Mono", Menlo, monospace`), for code only, never as decoration. A component whose spec has a `mono` option keeps it.

### Weights

- **300** for display sizes (28 px and up) only: headings speak softly.
- **400** the default for everything.
- **500** for emphasis: labels, button text in compact components, active tab, values. **The heaviest weight on the site.** No bold, no 600 or 700.

### Site scale

| Recipe | Size / line | Weight | Tracking | Use |
| ------ | ----------- | ------ | -------- | --- |
| `hero` | `clamp(80px, 19vw, 240px)` / 0.8 | 300 | -0.06em | The home page's "labs" title only (chosen by the user, 2026-11-17) |
| `display` | 48 / 52 | 300 | -0.02em | Large headings elsewhere |
| `heading` | 32 / 38 | 300 | -0.01em | Modal title, page sections |
| `title` | 20 / 28 | 400 | -0.005em | Section headings in the code view |
| `body` | 16 / 24 | 400 | 0.005em | Descriptions, paragraphs |
| `support` | 15 / 22 | 400 | 0.005em | Card copy, "How it works" |
| `ui` | 14 / 20 | 400 | 0 | Navigation, buttons, inputs, menus |
| `caption` | 13 / 18 | 400 | 0 | Card name pill, hints, meta |
| `label` | 11 / 14 | 500 | 0.06em, uppercase | Utility labels: tag chips, knob group titles, section eyebrows (the Atlas detail) |

### Component scale

Components use only these sizes:

| Step | Size / line | Typical use |
| ---- | ----------- | ----------- |
| `c-11` | 11 / 14 | Uppercase labels (500, 0.06em), tiny meta, axis ticks |
| `c-12` | 12 / 16 | Captions, hints, helper text, badges |
| `c-13` | 13 / 18 | Secondary rows, descriptions in rows, small buttons |
| `c-14` | 14 / 20 | Default component text: rows, inputs, buttons, menu items |
| `c-16` | 16 / 22 | Titles inside a component, emphasised values |
| `c-20` | 20 / 26 | Large values, headings inside big components |
| `c-28` | 28 / 32, 300 | Big numbers (counters, prices, stats) |
| `c-40` | 40 / 42, 300, -0.02em | Hero numbers and display words inside a component |

- **Tabular numbers** (`font-variant-numeric: tabular-nums`) for anything that changes: counters, timers, percentages, prices.
- **Sentence case** everywhere except the `label` recipe.
- Tracking tightens with size: +0.005em at 12–16, 0 at 20, −0.01em at 28, −0.02em at 40.

---

## 4. Spacing and layout

**Base 4 px.** Allowed steps: 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 120, 160.

- **Inside components:** 4–8 between related items, 12 between groups, 16 panel padding (12 for compact panels), 20 for roomy cards.
- **Control heights:** 28 (compact), 32 (small), 36 (default in components), 44 (primary site actions). Row height in menus and lists: 32–36.
- **Gaps between controls:** 8.

### The site

- **Canvas:** `--bg`, one colour top to bottom, no alternating bands.
- **Rails** (Atlas): the wall sits in a centred column (max 1920 px, 12 px side padding) bordered by 1 px `--hairline` vertical rails. Where a horizontal rule (header bottom, filter row, footer) meets a rail, draw a 5 px joint dot in `--ink-5`. Rails stay faint; no graph-paper grids.
- **Header:** 64 px, transparent over `--bg`, a 1 px `--hairline` bottom rule. Wordmark left, search and mute right.
- **Intro:** `hero` title left, a one-line `body` explanation in `--ink-3` to its right on wide screens, stacked on narrow; 120 px above, 40 px below.
- **Wall grid:** 12 px gutters, cards on `--card` with `--r-card` corners and the stage inset edge (see Depth). Name pill (`caption`) bottom left, play and settings buttons bottom right.
- **Filter chips:** `label` recipe in pills, 28 px high; active chip `--ink` fill with `--on-ink` text.
- **Modal:** a floating window: `--fill-slab`, `--r-panel`, the float shadow; stage inside on `--card` with `--r-card`.
- **Footer:** a 1 px `--hairline` rule, `caption` text in `--ink-3`, 96 px above.
- **Breakpoints:** 640, 768, 1024, 1280. Below 640 the rails disappear and side padding is 16 px.

---

### Components whose size changes stay centred

Anything that opens, grows, shrinks or changes width (dropdowns, split buttons, menus, toasts, expanding pills, morphing buttons) stays centred on its card and stage at every moment, the resting state included (chosen by the user, 2026-11-18):

- The component's root box is always the size of what is visible **now**. Never reserve space for an open state, and never pin a trigger to the top or bottom of a taller box.
- The wall card and the modal stage already centre the block, so a component that grows expands equally left and right, up and down.
- Animate the size change (width, height, or a measured transform) with the component's own easing, so the re-centring glides instead of jumping.

## 5. Depth

| Token | Light | Dark | Use |
| ----- | ----- | ---- | --- |
| `--shadow-raised` | `0 0 0 0.5px rgba(0,0,0,0.125), 0 1px 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)` | `0 0 0 0.5px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.4)` | A raised surface on a stage: secondary buttons, inputs, a component's body, cards in a stack |
| `--shadow-float` | `0 0 0 0.5px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.1)` | `0 0 0 0.5px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.5)` | Floating: menus, popovers, toasts, dragged items, the modal |
| `--stage-edge` | `inset 0 0 0 0.5px rgba(0,0,0,0.075)` | `inset 0 0 0 0.5px rgba(255,255,255,0.06)` | Stages: wall cards, modal stage |

- Two levels only: **raised** (resting on something) and **float** (above everything). No heavy outlines; a 0.5 px edge is enough.
- **Stroke on** (the modal switch) adds `0 0 0 1px var(--pane-edge)` to surfaces that can carry it, as in `AGENTS.md`.
- No glows, no coloured shadows. A drag or lift may move from raised to float.

---

## 6. Components: shared defaults

The parts that repeat across the 60 components, so they look like one family.

| Part | Default |
| ---- | ------- |
| **Primary button** | `--ink` fill, `--on-ink` text, `--r-pill`, 36 px high (44 on site actions), 16 px side padding, `c-14` 500. Hover `--ink-2`. |
| **Secondary button** | `--fill-slab`, `--shadow-raised`, ink text, otherwise as primary. Hover `--surface`. |
| **Ghost button** | No fill, `--ink-2` text; hover `--surface-2` fill. |
| **Icon button** | 32 px square, `--r-control` (or circle when standalone), icon 16 px `--ink-3`, hover `--surface-2` and `--ink`. |
| **Input** | `--fill-slab`, 36 px high, `--r-control`, 1 px `--pane-edge` border (inset shadow), `c-14`; placeholder `--ink-4`; focus 1.5 px `--focus` ring. |
| **Menu / popover** | `--fill-slab`, `--r-panel`, `--shadow-float`, 4 px inset; rows 32 px, `--r-control`, `c-14`; hover `--surface-2`; selected check in `--pick`. |
| **Segmented control** | `--r-pill`, track `--surface-2` with a 0.5 px `--ink-5` inset edge; active segment `--fill-slab` with `--shadow-raised`; inactive labels `--ink-3`. |
| **Toggle** | Track 36 × 20 `--r-pill`, off `--surface-3`, on `--pick`; white knob with `--shadow-raised`. |
| **Slider** | Track 4 px `--r-pill` `--ink-5`, fill `--pick`; handle 16 px circle `--fill-slab` with `--shadow-raised`. |
| **Checkbox / radio** | 16 px, `--r-control` 4 px / circle, on `--pick` with white mark. |
| **Chip / tag** | 24 px high, `--r-pill`, `--surface-2` fill, `c-12`; selected `--pick-soft` with `--pick` text. |
| **Card inside a component** | `--fill-slab` (or `--card` on a raised body), `--r-card`, `--shadow-raised` only when it moves or stacks. |
| **Tooltip** | `--ink` fill, `--on-ink` `c-12`, `--r-control`, 6 × 8 px padding. |
| **Focus** | `outline: 1.5px solid var(--focus); outline-offset: 2px` on `:focus-visible`, everywhere. |
| **Icons** | Phosphor regular (thin outline, the house weight) at 16 px in rows and buttons, 20 px standalone; `-fill` for status marks; `-bold` only at 12 px or less. Colour `--ink-3`, `--ink` when active. |
| **Avatars** | Circle; 24 / 32 / 40 px; a 2 px `--fill-slab` ring when they overlap. |

---

## 7. Motion

**The base site is consistent; components choose their own easing and timing.**

| Token | Value | Use (site) |
| ----- | ----- | ---------- |
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default site curve |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Things arriving: modal, menus, toasts |
| `--t-fast` | `150ms` | Colour, background, border, shadow on hover and press |
| `--t-base` | `200ms` | Opacity, small moves |
| `--t-slow` | `280ms` | Modal open and close, wall filter re-layout |

- Site controls give **tonal** feedback (colour and shadow, 150 ms), not bounces.
- The modal opens with a 280 ms fade and an 8 px rise on `--ease-out`; closing is 200 ms.
- `prefers-reduced-motion`: the site drops movement and keeps fades of 150 ms or less.
- Components may use springs, `linear()` curves and their own durations, as their specs say. Their **hover colour transitions** still use `--t-fast` / `--ease` so the site feels the same everywhere.

---

## 8. Mapping old spec values

The specs were written before this file. When building, translate:

**Radius by role, not by number:**

| In the spec | Becomes |
| ----------- | ------- |
| A card, tile, image, media frame, stage, chart bar (any value) | `--r-card` 4 |
| A row, input, small control, keycap, highlight inside a menu (any value under 10) | `--r-control` 6 |
| A panel, menu, popover, toast, dialog, the component's own body (any value 10 to 24) | `--r-panel` 10 |
| 999 / 9999 / "pill" / "fully round" on a rectangle | `--r-pill` |
| Circles | stay circles |

**Type size:** 10–11 → `c-11`; 12 → `c-12`; 12.5–13 → `c-13`; 13.5–15 → `c-14`; 15.5–17 → `c-16`; 18–23 → `c-20`; 24–34 → `c-28`; 35+ → `c-40`. **Weights** 600 and 700 → 500. Display sizes (28+) → 300 unless the spec's look depends on weight (a bold counter word, a heavy digit roll), in which case 500.

**Colour:** `--pick` is now blue (it was the old light blue); `--danger`, `--ok`, `--warn` (`--ember`) take the values above; fixed chart, tag or thermal colours → the material hues or a ramp of one hue; `--fill-on` mixes for tints stay as written. White on images stays.

**Shadows:** any spec shadow → `--shadow-raised` (resting) or `--shadow-float` (floating or dragged).

**Spacing:** round to the nearest 4 px step (odd values like 17.5 or 22.4 do not exist here).

**Layout:** a spec that reserves space for an open state or anchors the component at the top or bottom of its box ("the root reserves the open panel's height") becomes a centred, visible-size box (see "Components whose size changes stay centred" in section 4).

**Sound:** there is no `settle` sound any more (removed 2026-11-18). A spec moment that plays `settle` is silent.

Say in the build report which values were mapped where the result looks noticeably different from the spec.

---

## 9. Applying this to the site

**Done on 2026-11-17.** This is what was changed, for reference when the design changes again:

1. `src/lab/tokens.css`: the light and dark values, new tokens (`--hairline`, `--pick-soft`, `--danger`, `--warn`, `--hue-*`, `--r-*`, `--shadow-*`, `--stage-edge`, `--ease*`, `--t-*`, `--font-code`), `--ember` aliased to `--warn`.
2. `src/layouts/Layout.astro`: Inter Tight weights `300..600`; `--font-ui` to the stack above.
3. `src/layouts/site.css`: canvas, rails and joint dots, header, intro, wall cards at `--r-card`, chips, modal at `--r-panel`, shadows, focus rings and motion tokens. Replace the existing hard-coded radii (28, 16, 12, 10) and font sizes with the tokens and recipes.

Check light and dark with screenshots after applying, and compare against this file.
