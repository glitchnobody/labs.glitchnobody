# glitchnobody labs: design system

The look of the site and the defaults of every component: colours, corner radius, type, spacing, depth and base motion. Built from three references (2026-11-17), kept only as ideas, no names, art or copy:

- **ElevenLabs** sets the voice: light-weight headings, sentence case, soft surfaces nested in each other, hairline edges, shallow shadows, colour kept inside the objects instead of across the page.
- **Atlas** adds the drafting details: faint dashed rails (no joint dots), small uppercase utility labels, and a charcoal ground for dark mode.
- **Cursor** sets the rounding: almost-square cards, softer panels, pill actions.

The palette is **neutral** (true greys, no warm tint) in light and dark. The only brand colour is **blue**. Other colours are adapted from ElevenLabs' material colours and only appear where they mean something (state, data, tags).

**Precedence.** This file wins over any `SPEC.md` for colour, radius, type size and weight, spacing and shadows. When building a component, map each spec value to the nearest step here using the tables in "Mapping old spec values". Animation easing and timing stay per component. The base site follows "Motion" below.

---

## 0. Base site vs components (2026-11-20)

The site has **two styles**, deliberately kept apart:

- **The base site** (header, search, Settings dropdown, Ctrl K menu, wall cards, filter chips, modal frame, settings panel, sounds page, internal library) follows **Cosmos** (cosmos.so). It reads only the `--s-*` tokens defined at the top of `src/site.css`.
- **The 60 components** keep sections 1 to 7 of this file and read `src/lab/tokens.css`. Nothing in the Cosmos change touches them. `.card-block`, `.stage-block` and `.sfx-example` reset their text colour to the component `--ink`, so no shell value leaks in.

The `--s-*` tokens are declared under `:root, [data-theme="light"]`, `[data-theme="dark"]` and the system dark preference, like `tokens.css`, so the modal stage's own light/dark button flips them too.

### Shell colour

Taken from **cosmos.so's own CSS tokens** (pasted by the user and checked against the live site's computed styles on 2026-11-20). Cosmos's greys are **warm**, and these values replace the zinc estimates from the first brief.

| Token | Light | Dark | Cosmos token | Use |
| ----- | ----- | ---- | ------------ | --- |
| `--s-bg` | `#FFFFFF` | `#141414` | background-primary | Page canvas, drawer sheet |
| `--s-card` | `#FCFBFA` | `#212020` | background-light-elevation | Wall cards, modal stage, sound cards |
| `--s-surface` | `#F2F1F0` | `#323131` | background-elevation / button-secondary | Search pill, segmented track, text inputs |
| `--s-surface-hover` | `#E8E6E4` | `#3E3D3D` | hover-secondary | Hover on filled controls and menu rows |
| `--s-outline-hover` | `#E8E6E4` | `#212020` | hover-secondary / light-elevation (measured on hover) | Hover fill on outlined pills, chips and outlined icon buttons |
| `--s-elevated` | `#FCFBFA` | `#212020` | light-elevation (measured on Cosmos's menus) | Settings dropdown, search panel, settings panel |
| `--s-border` | `rgb(13 13 13 / .12)` | `rgb(247 245 243 / .12)` | border-primary (12%) | Every hairline, **0.5px** wide |
| `--s-border-strong` | `rgb(92 87 84 / .18)` | `rgb(248 245 242 / .2)` | hover-border (measured) | Hover and focus border, selected choice, switch off |
| `--s-ink` | `#0D0D0D` | `#FFFFFF` | text-primary | Primary text and icons |
| `--s-ink-2` | `#6E6A69` | `#AEABAB` | text-secondary | Labels, descriptions, nav links, ghost buttons |
| `--s-ink-3` | `#9A9796` | `#918F8F` | text-tertiary | Placeholders, hints, units |
| `--s-cta` / `--s-cta-hover` / `--s-cta-ink` | `#0D0D0D` / `#232323` / `#FFFFFF` | `#FFFFFF` / `#E8E6E4` / `#0D0D0D` | button-primary, hover-primary | Solid pill, active chip, active segment |
| `--s-shadow-menu` | `0 10px 28px rgba(0,0,0,.08)` | `0 12px 32px rgba(0,0,0,.32)` | | Menus and popovers only |

There is no accent in the shell. Cosmos's blue (`#0700FF`) and its status colours are not used.

Measured in the logged-in Cosmos app on 2026-11-20, in **both dark and light** (Cosmos switched to light in the account for the light pass), and added to the shell:

| Token | Light | Dark | Use |
| ----- | ----- | ---- | --- |
| `--s-border-soft` | `rgb(13 13 13 / .1)` | `rgb(255 255 255 / .1)` | Button hairlines (Cosmos's Create button uses 10%; surfaces use 12%) |
| `--s-inset` (unused) | `inset 0 1px 1.5px rgb(255 255 255 / .7), inset 0 -1px 1.5px rgb(0 0 0 / .03)` | `inset 0 1px 1.5px rgb(255 255 255 / .055), inset 0 -1px 1.5px rgb(0 0 0 / .2)` | The search bar's soft top highlight |
| `--s-shadow-menu` | `0 1px 8px rgb(0 0 0 / .05)` | same | Menus float on their hairline, with only a whisper of shadow |

### Shell type

The font is unchanged. Cosmos's scale and weights, all at **−2% tracking** (`html { letter-spacing: -0.02em }`, reset to `normal` inside components):

| Role | Size / line | Weight | Where |
| ---- | ----------- | ------ | ----- |
| Caption | 12 / 14 | 400, `--s-ink-3` | Menu-row descriptions, units, credits, hints |
| Body | 14 / 20 | 400 | Panel description (`--s-ink-2`), settings labels, search text, inputs |
| Body medium | 14 / 20 | 500 | Menu rows, chips, card name, values |
| Control | 15 / 22 | 500, −0.01875em | Buttons, the brand, nav-style links |
| Title | 26 / 30 | **400** | Modal panel heading (Cosmos sets titles regular, not bold) |
| Badge | 10 / 14 | 500 | Counts |

Filter chips are sentence case now (no uppercase), 32 px high.

### Shell shape

| Element | Radius |
| ------- | ------ |
| Every text button, the search bar, chips, segmented control, switches, text inputs, select rows, choice buttons | full pill (`--r-pill`) |
| Icon buttons (Settings gear, close, card play and settings, stage light/dark) | circle (`50%`) |
| Menus and popovers (`--s-r-menu`) | 12 px |
| Menu rows (`--s-r-row`) | 8 px |
| Settings panel (`--s-r-panel`) | 12 px |
| Wall cards and the modal stage, which are media (`--s-r-media`) | 8 px |

### Shell buttons

| Variant | Rest | Hover | Where |
| ------- | ---- | ----- | ----- |
| **Outlined pill** (`.pill`, `.pill.outline`) | transparent, `0.5px --s-border`, `--s-ink` 500 text | fill `--s-outline-hover`, border `--s-border-strong` | Sounds, Share, library Reset |
| **Solid pill** (`.pill.solid`) | `--s-cta` fill, `--s-cta-ink` text | `--s-cta-hover` | Copy prompt, Export JSON: one per view |
| **Icon button** (`.icon`) | 36 px circle, transparent, a 0.5px `--s-border-soft` ring, `--s-ink` icon | fill `--s-outline-hover`, ring `--s-border-strong` | Header gear (like Cosmos's Activity button) |
| **Icon button on a surface** (`.card-tools`, `.stage-bar`, `.panel`) | `--s-elevated` with a `0.5px --s-border` ring | `--s-surface-hover` | Card play and settings, stage light/dark, panel close |
| **Chip** | transparent, `0.5px --s-border`, `--s-ink-2` | fill `--s-outline-hover`, border `--s-border-strong`, ink text | Wall filters; active = `--s-cta` fill and text |

Every button presses to `scale: 0.97`.

### Shell inputs

- **Search:** a flat 280 × 40 pill on `--s-card` with a 0.5px `--s-border` (no inset highlight: Cosmos's skeuomorphic inner shadow was dropped on 2026-11-20), a leading `ph:magnifying-glass` (16 px), the "Search" label in `--s-ink-3` as a placeholder, and the `Ctrl K` hint at the far right. Hover lifts the label to `--s-ink-2`.
- **Text fields** (settings text knob, library fields): a pill, `--s-surface`, `0.5px --s-border`, placeholder `--s-ink-3`. Focus switches the border to `--s-border-strong`, with no coloured ring.
- **Choices:** four or fewer options are outlined pills (transparent, `0.5px --s-border`); the chosen one gets `--s-border-strong` and `--s-surface-hover`. Longer lists are one outlined pill row with the value and a chevron over a native select.
- **Switch:** track `--s-border-strong` off and `--s-ink` on; knob `--s-elevated` with a 1 px soft shadow.

### Tab toggles

Block/Code, the Theme switch and the library tabs use a **sliding pill**: the chosen option's inverted pill (`--s-cta`) glides to the new option over 320 ms on `--s-ease-expand`, matching its width. A small script in `__root.tsx` measures the chosen option into `--seg-x/y/w/h`, and CSS draws the pill as `::before`. The first placement is instant. Until a toggle is measured, the chosen option paints its own background, so it never looks empty. Reduced motion turns the slide off.

### Shell menus

- **Container:** `--s-elevated`, a 0.5px `--s-border` ring, **20 px** corners, 4 px inset, `--s-shadow-menu`. The Settings dropdown is 240 px wide and opens from its top right corner with a 120 ms fade and scale (`cubic-bezier(0, 0, 0.2, 1)`).
- **Rows:** 44 px high, **16 px** corners, 16 px side padding, 14 / 500. They highlight to `--s-surface` (Cosmos's elevation grey). A Cosmos row (`.menu-row`) is a leading 18 px Phosphor icon in `--s-ink-2`, a 14 px / 500 title, a 12 px description in `--s-ink-2`, and the shortcut on the right. **Settings** follows Cosmos's account menu: a **Theme** row with a three-way switch (an `--s-surface` pill of 24 px circles for `ph:sun` / `ph:moon` / `ph:circle-half` = light, dark, system; the chosen one is inverted to `--s-cta`), and a **Mute sounds** row with its shortcut and a `ph:speaker-high` icon on the right. Row icons are full `--s-ink`; only descriptions and shortcuts are faint. A 1 px `--s-surface` divider, inset 16 px, separates groups. Alt D still toggles the theme.

### Search dropdown

Clicking the search bar, or pressing Ctrl K, opens the search the way Cosmos does:
- The bar **widens in place** from 280 to 440 px over 500 ms on `--s-ease-expand` (`cubic-bezier(0.22, 1, 0.36, 1)`). The open input is a clip-path reveal of a full-width pill drawn exactly over the closed one, and the magnifier slides with its edge.
- The results drop in as a **panel 8 px below** the bar: same width, 24 px corners, 8 px inset, `--s-elevated`, a 0.5px ring and the menu shadow. It fades in and scales up from **98%** over 120 ms on `cubic-bezier(0, 0, 0.2, 1)`, from its top centre.
- The page behind dims with a **40% ink scrim** (`rgb(13 13 13 / .4)`) that fades in over 150 ms.
- The open bar's placeholder lifts from `--s-ink-3` to `--s-ink-2`.
- Rows are 44 px with 16 px corners, a 14 / 500 name and a 12 px tag in `--s-ink-3`.

### Shell motion

| Token | Value | Use |
| ----- | ----- | --- |
| `--s-ease-ui` | `cubic-bezier(0.4, 0, 0.2, 1)` (measured on cosmos.so's buttons) | Every control transition: colour, border, shadow, press scale, switch knob, slider morph |
| `--s-ease-popover` | `cubic-bezier(0, 0, 0.2, 1)` over 120 ms (`--s-dur-menu`), measured on Cosmos's menus | Menus and the search panel |
| `--s-ease-expand` | `cubic-bezier(0.22, 1, 0.36, 1)` over 500 ms, measured on Cosmos's search bar | The search bar widening |
| `--s-dur-fast` | `150ms` (cosmos.so) | Hover, press, switch |
| `--s-dur-med` | `180ms` | Menu enter, slider dot-to-pill morph, fades |

Fast and understated, with **no overshoot and no springs on the shell** (the springs and goo were removed on 2026-11-20). The modal opens in 420 ms (card lift), the panel slides in over 300 ms after 100 ms, and the drawer rises in 360 ms. Closing keeps its ease-in. The settings slider's wake is decay physics, not a spring, and stays. Components may still use the `--ease-spring*` tokens in `tokens.css`.

---

## 1. Colour

**These are the component values** (sections 1 to 7). The base site has its own palette in section 0. Components only ever read token **names** (see `AGENTS.md`). The values below go into `src/lab/tokens.css`, which already handles light, dark, `[data-theme]` and the modal's Fill switch.

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
| `--ink-5` | `#d4d4d4` | Strong lines: slider track, dotted card outlines in the library |
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
- **The site chrome has its own palette** (section 0, Cosmos, 2026-11-20). It never reads `--pick` or the status colours; those belong to the components.
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
| `hero` | `clamp(80px, 19vw, 240px)` / 0.8 | 500 | -0.06em | The big page title on the wall and the sounds page (chosen 2026-11-17; weight raised from 300 to 500 on 2026-11-18) |
| `display` | 48 / 52 | 300 | -0.02em | Large headings elsewhere |
| `heading` | 24 / 30 | 500 | -0.02em | Modal title (the settings panel's component name), page sections. Smaller and heavier since 2026-11-18 |
| `title` | 20 / 28 | 400 | -0.005em | Section headings in the code view |
| `body` | 16 / 24 | 400 | 0.005em | Descriptions, paragraphs |
| `support` | 15 / 22 | 400 | 0.005em | Card copy, "How it works" |
| `ui` | 14 / 20 | 400 | 0 | Navigation, buttons, inputs, menus |
| `caption` | 13 / 18 | 400 | 0 | Card name pill, hints, meta |
| `label` | 11 / 14 | 500 | 0.06em, uppercase | Utility labels: tag chips, knob group titles, section eyebrows (the Atlas detail) |

### Text colour (changed 2026-11-18)

- Paragraphs, labels and all secondary text are **subtle**: `--ink-3`. Value readouts and the current choice are `--ink` at 500. The faintest text (section labels, hints, credits) is `--ink-4`. Headings are `--ink`.
- Component descriptions are **under 180 characters**, two short sentences at most: what it is, then how to play with it.

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

- **Canvas:** `--s-bg`, one colour top to bottom, no alternating bands.
- **Page margin:** on desktop and tablet (above 640 px) the whole site sits 24 px in from the left and right screen edges (`--edge`, 12 px until 2026-11-19). Below 640 it is 0.
- **Rails** (Atlas): the wall sits in a centred column (max 1920 px, 12 px side padding) bordered by 1 px **dashed** `--s-border` vertical rails, inset by the page margin. No joint dots. Rails stay faint; no graph-paper grids.
- **Header:** 64 px, transparent over `--s-bg`, with a 1 px dashed `--s-border` bottom rule running edge to edge past the rails. On the left: the **logo** (the favicon, 24 px, a link home) followed by the pages as plain text links, **Components** (`/components`) and **Sounds** (`/sounds`), in Cosmos's nav style (15 / 500, `--s-ink-2`, `--s-ink` on hover and on the current page). There is no wordmark text. The search pill is in the centre. On the right are two outlined circles: **mute** (`ph:speaker-high` / `ph:speaker-slash`) and the **Settings gear**, which holds the Theme switch.
- **Pages:**
  - `/` is the **home page**: the `labs` hero, then two sections. **Components** shows the six newest components (by number in `COMPONENTS.md`) as wall cards. **Sounds** shows the six newest sounds (the last rows of the sound library table) as two rows of three. Each section has a 26 / 400 heading and an outlined **View all** pill that goes to its page.
  - `/components` is the full wall with its filter chips, under a `components` hero.
  - `/sounds` is the full sound library.
  - `/components/<slug>` opens a component's modal and `/sounds/<name>` opens a sound's window, each over the page you came from (home, the wall or the sound library). Closing returns there. Old `/<slug>` links redirect (301) to `/components/<slug>`, and the sound pages no longer use `#name`.
- **Intro:** `hero` title left, a one-line `body` explanation in `--ink-3` to its right on wide screens, stacked on narrow; 120 px above, 40 px below.
- **Wall grid:** at most **3 columns** on desktop, with Cosmos-like gutters: **32 px** from 1180 px up, 24 px on tablet (720 px up, 2 columns) and 16 px on phones (1 column), the same horizontally and vertically; cards on `--s-surface` with 8 px corners and a 1 px `--s-border` inset edge. Name pill (`caption`) bottom left, play and settings buttons bottom right.
- **Filter chips:** `label` recipe in pills, 28 px high, outlined (section 0); the active chip is `--s-cta` fill with `--s-cta-ink` text.
- **Modal (desktop):** the stage on `--s-surface` with 8 px corners, and the settings panel on `--s-elevated` with 12 px corners and a 1 px `--s-border` ring. It opens by lifting the clicked card into the stage and pushing the settings panel out from under it (see Motion).
- **Modal (320 px panel):** the panel holds the component name (`heading`), its description in `--s-ink-2`, then the component's settings with a hairline divider (`--s-border`) between each. There is no group label. The **light/dark preview button** is a circular icon button (`ph:moon` / `ph:sun`) in the stage's top right corner, shown only on the Block tab; on the Code tab that spot holds Copy prompt. The Stroke switch was removed on 2026-11-20.
- **Modal (small screens, 820 px and below):** a **bottom drawer** over the dimmed wall (45% black): a sheet up to 92 dvh high, 16 px top corners, `--s-bg` fill, a 36 × 4 grip bar at the top. Drag the grip down to close (far or fast dismisses, short springs back). The stage is 60 dvh, the settings follow under it.
- **Footer:** a 1 px `--s-border` rule, `caption` text in `--s-ink-3`, 96 px above.
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
| **Segmented control** | `--r-pill`, flat `--surface-2` track with no border; active segment solid `--ink` fill with `--on-ink` text (no shadow); inactive labels `--ink-3`. Changed 2026-11-18 to be simpler. |
| **Toggle** | Track 36 × 20 `--r-pill`; knob 16 px. In components: off `--surface-3`, on `--pick`. The site chrome's switch is in section 0. |
| **Slider** | In components: track 4 px `--r-pill` `--ink-5`, fill `--pick`; handle 16 px circle `--fill-slab` with `--shadow-raised`. The site chrome's slider is described below the table. |
| **Checkbox / radio** | 16 px, `--r-control` 4 px / circle, on `--pick` with white mark. |
| **Chip / tag** | 24 px high, `--r-pill`, `--surface-2` fill, `c-12`; selected `--pick-soft` with `--pick` text. |
| **Card inside a component** | `--fill-slab` (or `--card` on a raised body), `--r-card`, `--shadow-raised` only when it moves or stacks. |
| **Tooltip** | `--ink` fill, `--on-ink` `c-12`, `--r-control`, 6 × 8 px padding. |
| **Focus** | `outline: 1.5px solid var(--focus); outline-offset: 2px` on `:focus-visible`, everywhere. |
| **Icons** | Phosphor regular (thin outline, the house weight) at 16 px in rows and buttons, 20 px standalone; `-fill` for status marks; `-bold` only at 12 px or less. Colour `--ink-3`, `--ink` when active. |
| **Avatars** | Circle; 24 / 32 / 40 px; a 2 px `--fill-slab` ring when they overlap. |

---

**The settings slider (site chrome).** At rest it is a thin `--s-border` line with a 9 px `--s-ink` dot and an `--s-ink-2` fill up to it. On hover, focus or drag it shows one tick per allowed value (at most 47, about 6 px apart). The ticks are 60% of the 26 px field, `--s-ink` up to the value and `--s-ink-3` beyond it. The dot stretches into a 3 px full-height pill, the last tick and the handle in one. Everything stands on the bottom edge and grows upward. Dragging leaves a **wake**: each tick the handle passes jumps toward the full height by how fast it was dragged, then falls back exponentially, as in the wake slider.

## 7. Motion

**The base site is consistent; components choose their own easing and timing.**

| Token | Value | Use (site) |
| ----- | ----- | ---------- |
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default site curve |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Things arriving: modal, menus, toasts |
| `--t-fast` | `150ms` | Colour, background, border, shadow on hover and press |
| `--t-base` | `200ms` | Opacity, small moves |
| `--t-slow` | `280ms` | Modal open and close, wall filter re-layout |

- **The base site's motion is in section 0 (Cosmos, 2026-11-20):** `--s-ease-ui` / `--s-ease-popover`, 120 / 180 ms, no springs. The `--ease`, `--t-*` and `--ease-spring*` tokens above remain for the components.
- **Modal:** a component's code and code view are warmed up while the pointer is over its card, and the wall's CSS animations pause while the modal is open, so the first open never waits.
- `prefers-reduced-motion`: the site drops movement (no card lift, no press scale, no menu enter, no slider wake) and keeps fades of 150 ms or less.
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

---

## 10. Changes since 2026-11-17 (summary)

For a quick read of what moved on 2026-11-18 and 2026-11-19: dashed rails with no joint dots; an edge-to-edge dashed header rule; a 24 px page margin; the header split into brand, centred search (up to 280 px) and a Sounds link plus a Settings icon dropdown; the `hero` title at 500; a flat segmented control with an `--ink` selected segment; a fully neutral chrome; the redesigned settings rows and tile colours; subtler text; descriptions under 180 characters; the spring easings, press squash and gooey modal; the mobile bottom drawer; and the internal component library below. **On 2026-11-20** the base site moved to its own Cosmos-derived style (section 0): `--s-*` tokens taken from cosmos.so's own warm-grey palette, pill buttons and circular icon buttons, hairline borders on every surface, Cosmos menu rows, 8 px media and 12 px panel corners, and plain `--s-ease-ui` / `--s-ease-popover` motion in place of the springs. The Stroke switch went away, and the light/dark preview moved to the stage corner.

---

## 11. Internal component library

Route `/insider-tools/internal-component-library` (not in the navbar, `noindex`). An editor for the site's own UI pieces, not the lab components. Added 2026-11-18.

- **Layout:** a left settings panel (300 px) and a canvas, 12 px apart. The panel stays on the site theme; the canvas wears the edited theme and palette.
- **Panel tabs:** *Component* (the selected piece's fields, plus corner and font-size overrides; 0 = unchanged) and *Colors* (the shell's `--s-*` light and dark tokens, read from `site.css` and grouped Canvas and surfaces, Ink, Borders, Solid button, Shadows, for the palette picked by the Light/Dark switch). Reset and Export JSON sit at the bottom.
- **Tiles:** transparent, a 1 px dashed `--ink-4` outline; the selected tile has a solid 1 px `--ink` outline. Labels and hints use `--ink-2` for contrast in light mode.
- **JSON export:** only what differs from the defaults: `{ colors: { light, dark }, components: { <id>: { prop: value } } }`. Edits live in the page only; nothing writes back to `site.css`.
