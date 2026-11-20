<!-- intent-skills:start -->
## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:
- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# glitchnobody labs: read this first

## What this project is

A personal showcase site of interactive React components (TanStack Start + TanStack Router, all React; moved from Astro on 2026-11-18, branch `tanstack`). The home page shows the six newest components (as live cards) and the six newest sounds, each with a "View all" link to `/components` (the full wall of cards) and `/sounds` (the sound library); clicking a card opens a modal with the live component, its settings (knobs), and its code with a "Copy prompt" button. The URL `/components/<slug>` is the open component (old `/<slug>` links redirect there), and `/sounds/<name>` is an open sound.

The goal is **60 components**. Work happens in two phases:

1. **Spec phase (current).** For each component the user describes, ask questions, refine the idea, and write `src/lab/<slug>/SPEC.md`. No code. Every spec is listed in [`COMPONENTS.md`](COMPONENTS.md).
2. **Build phase.** Build the components one by one from their `SPEC.md`, using `COMPONENTS.md` as the to-do list, following "Adding a component to the labs" below.

`COMPONENTS.md` is the source of truth for progress: which components exist, their status, and the shared sound library. Read it before doing anything.

## Rules every component follows

These are the user's standing requirements. A spec that breaks one must say why and the user must have agreed.

- **One design system.** [`DESIGN.md`](DESIGN.md) sets the site's and every component's colours, corner radius, type sizes and weights, spacing and shadows (neutral greys, blue accent, Inter Tight, radius 4 / 6 / 10 / pill). It wins over any number in a `SPEC.md`: map spec values with its "Mapping old spec values" section when building. Easing and timing stay per component; the base site uses its Motion tokens. (Chosen by the user on 2026-11-17.)
- **Light and dark mode.** Every component reads colours from the tokens in `src/lab/tokens.css`, so it follows the modal's Dark mode toggle and the site theme. No hard-coded colours.
- **Sound.** Every component makes some sound at its interaction points. Sounds are generated with the ElevenLabs `sound-effects` skill (`.agents/skills/sound-effects/`) and stored as files. No end-of-interaction "settle" click: a release or a finished animation is silent unless the spec gives it a real sound (the `settle` sound was removed on 2026-11-18). Sounds are subtle: very soft, quiet, pure and muted, like bencho.dev/sounds (changed on 2026-11-18 from "deep and dense"); low-pass them and level them to a −30 dB mean with peaks under −12 dB. Simple sounds (a tick, a tap, a soft click) reuse a sound already in the library in `COMPONENTS.md` rather than generating a new one; when it is unclear whether to reuse or generate, ask the user. The agent suggests every sound (what it should sound like and the ElevenLabs prompt) unless the user specifies one.
- **As much configuration as possible.** Every meaningful choice is a prop and a knob: sizes, counts, speeds, easing, shapes, styles, modes, behaviours, sound on/off and volume. Aim for 6 to 12 knobs; fewer only when the component truly has fewer meaningful choices.
- **People images.** On the site, any avatar, profile picture or photo of a person uses the user's set in `public/lab/avatars/01.webp` to `53.webp` (160 × 160 px square portrait photos, supplied by the user on 2026-11-16; round or crop them with CSS). Give people made-up first names. Never use other photos of people.
  - **The user's own avatar** ("You", the signed-in person, the current user) is always the site favicon, `public/lab/avatars/you.svg`.
  - **Exported code never contains these images.** What a person copies (the code view, "Copy prompt", the Usage snippet) must show random gradient avatars instead, so the photos are not copied. Do it like this: the component's own defaults have no image URLs; each person without an image gets a gradient circle made in CSS from a hash of their name (two token-independent hues, `linear-gradient` or `radial-gradient`), optionally with an initial. The site supplies the photos through `siteProps` in `meta.ts` (for example `siteProps: { avatars: ["/lab/avatars/01.webp", …], me: "/lab/avatars/you.svg" }`), which `Block.tsx` passes to the component on the site only and which never appears in Usage or the copied prompt. (`siteProps` is not in the shell yet: the first component that needs it adds `siteProps?: Record<string, unknown>` to `Meta` and spreads it in `Block.tsx`; say so when doing it.)
- **Filler images.** Any card, thumbnail, cover or gallery image that is not a person uses the user's filler set in `public/lab/demoimages/1.png` to `11.png` (880 × 1168 portrait paintings of flower meadows with a road or river and an animal or car; supplied by the user on 2026-11-16). Crop them with `object-fit: cover`. Like the people images, they are **site only**: the component's own defaults have no image URLs and fall back to random gradient fills generated from a hash of the item's title, and the site passes the image URLs through `siteProps` (for example `siteProps: { images: ["/lab/demoimages/1.png", …] }`), which never appears in Usage or the copied prompt.
- **Icons.** Every component that shows icons uses Iconify through `@iconify/react` (`<Icon icon="ph:tent-fill" />`), with **Phosphor** (`ph:`) as the house icon set: `ph:<name>` for regular, `ph:<name>-bold` / `-fill` / `-duotone` / `-light` / `-thin` for the weights. Icons load on demand from the Iconify API and are cached; no icon data is bundled. Put `npm install @iconify/react` in the component's `install` in `meta.ts` (it shows in the code view's Install section). Check icon names exist at https://icon-sets.iconify.design/ph/ before writing them in a spec. Do not hand-draw icons or use other icon packages. (Chosen by the user on 2026-11-16.)
- **Keyboard shortcuts are scoped.** A component's letter or modifier shortcuts work only while the pointer is inside its block (on the wall, the card whose empty space opens the modal; in the modal, the stage) or keyboard focus is inside the component. Elsewhere it ignores key presses, so components never fight over keys. The site marks those areas with `data-shortcut-scope` (added to `Block.tsx` by the first component with shortcuts); without one (exported code) the component's own root is the scope. (Chosen by the user on 2026-11-17.)
- **Minimal dependencies.** React only, no UI SDK, plain CSS. The goal is the least bloat in one self-contained file. If an animation would be much simpler with a library, the spec lists options (for example "hand-written with requestAnimationFrame / CSS", "framer-motion ~ 40 kB gz", "a smaller library") with their cost and trade-off, and the user picks. Never add a library without the user's choice recorded in the spec.

## Spec phase: how to write a component spec

When the user describes a new component:

1. **Read** `COMPONENTS.md` (to avoid duplicates, find reusable sounds, and see the next number), `DESIGN.md` (write sizes, radii and colours from its scale) and `docs/SPEC_TEMPLATE.md`.
2. **Ask questions** with the AskUserQuestion tool, in one or two rounds of up to 4 questions. Ask only what changes the spec, and offer concrete options with a recommended one first. Cover, as needed:
   - Look and feel: shape, layout, motion style, how it sits on a card.
   - Behaviour: states, what each interaction does, edge cases.
   - Configuration: which variants the user cares about most (propose a full knob list and let them trim or add).
   - Sound: which moments make a sound, your suggested sound for each, and reuse vs new where it is not obvious.
   - Dependencies: only if the component needs complex animation; give options with sizes.
   - Play demo: always. The card's play button runs a pretend cursor over the component (see "The play demo" in the build section). Suggest what the demo does, step by step in plain words (where the cursor goes, what it presses or drags, what the viewer sees, how it leaves), and ask the user to confirm or pick between two or three demo ideas. Write the agreed version in the spec's "Play demo" section.
3. **Write** `src/lab/<slug>/SPEC.md` from the template, filling every section. The folder holds only `SPEC.md` until the build phase. (The registry only picks up folders with a `meta.ts`, so a spec-only folder does not appear on the site or break the build.)
4. **Update** `COMPONENTS.md`: add the row (status `spec`), and add any new sounds to the sound library table with status `planned`.
5. **Reply** with a short summary of the spec and anything you decided on the user's behalf.

Slugs are kebab-case and become the URL, so keep them short and descriptive (`magnetic-button`, `pin-input`). Do not generate sounds in the spec phase; the spec records the prompt and settings, and the sound is generated when the component is built.

## Development

Stack (from the TanStack CLI scaffold, `npx @tanstack/cli@latest create … --package-manager pnpm --tailwind --toolchain biome --add-ons tanstack-query`): TanStack Start (SSR, file routes in `src/routes/`), TanStack Router, TanStack Query, Tailwind v4 (without its preflight, see `src/styles.css`), Biome, pnpm, Vite.

```
pnpm install
pnpm dev          # http://localhost:3000 (run it in the background)
pnpm build        # SSR build via Nitro: .output/ locally, .vercel/output/ on Vercel
node .output/server/index.mjs   # serve the production build
pnpm check        # Biome lint + format check (pnpm lint / pnpm format)
```

Shell files:

- `src/routes/__root.tsx`: the document, header, Ctrl/Cmd+K menu, theme, mute and the shell's own sounds. It also turns every `a[data-block]` click into a router navigation to `/<slug>`.
- `src/routes/_wall.tsx`: a pathless layout that keeps the wall (`src/components/Wall.tsx`) and the modal (`src/components/Modal.tsx`) mounted under `/` and `/$slug` (`_wall/index.tsx`, `_wall/$slug.tsx`).
- `src/routes/sounds.tsx`: the sound library page (`src/components/Sounds.tsx`).
- `src/routes/api/code/$slug.ts`: the code view's data (shiki-highlighted files and the how-it-works notes), loaded in `Detail.tsx` with TanStack Query.
- `src/styles.css` imports `src/lab/tokens.css` and `src/site.css` (the shell's CSS).
- `src/routeTree.gen.ts` is generated by the dev server and `pnpm build`; never edit it.

No environment variables are needed to run the site. `.env.local` holds `ELEVENLABS_API_KEY`, used only when generating sounds.

## Adding a component to the labs

This is the build phase. Build from the component's `src/lab/<slug>/SPEC.md`, styled by `DESIGN.md` (already applied to the shell on 2026-11-17): it already holds the decisions (knobs, sounds, dependencies, demo). Follow it, and where it is silent, make sensible choices and say what you chose. When the component is done and checked, set its status in `COMPONENTS.md` to `built` and its sounds to `generated`.

### 1. Build the component

Create `src/lab/<slug>/`. The folder name (kebab-case) is the URL, `/<slug>`.

```text
src/lab/<slug>/
  <Name>.tsx    the component, named export, every prop optional with a default
  <Name>.css    its styles
  meta.ts       how the site shows it
```

Rules for the component:

- **React only.** No UI SDK, no other frameworks. Use a library only if the spec records that the user chose one, and then add `install` to `meta.ts`.
- **Colours come from the tokens** in `src/lab/tokens.css`, never hard-coded: `--fill-slab` (surface), `--fill-on` (ink on it), `--ink`, `--ink-2` to `--ink-5`, `--pane-edge`, `--card`, `--pick`, `--ok`. The modal's Dark mode toggle changes the tokens, so a component that uses them follows light and dark by itself. Use `var(--font-ui)` for text.
- **Stroke** is set as `data-stroke="on"` on an ancestor. If the component has a surface that can carry a hairline, style it: `[data-stroke="on"] .your-surface { box-shadow: 0 0 0 1px var(--pane-edge); }`. Skip it if there is nothing sensible to outline.
- **Pointer input:** use pointer events (not mouse or touch), set `touch-action: none` on anything dragged, `user-select: none`, and handle keyboard use where it makes sense (arrow keys, Enter, Space) with proper roles and labels.
- Respect `prefers-reduced-motion`.
- Put a header comment at the top of the `.tsx` in the house style. The modal's "How it works" section is generated from it, so write it for a reader who wants to know how the effect works:

  ```text
  /* ══ Name ═════════════════════════════════
     One paragraph: what it is and what the person can do.

     ── A HEADING IN CAPITALS ────────────────
     A paragraph on one idea behind how it works.

     ── ANOTHER HEADING ──────────────────────
     Another paragraph. */
  ```

  Paragraphs are separated by blank lines. A line like `── HEADING ───` starts a titled paragraph. Leave the comment out and the section is left out too.
- Images go in `public/lab/` and are referenced as `/lab/<file>`. Use only images made for this site or properly licensed; never copy photographs from other sites. Gradients drawn as SVG are the default placeholder (see `public/lab/1.svg` to `5.svg`).

### 2. Variants and settings (the knobs)

Every setting the person can change is a prop and a knob in `meta.ts`. The modal already adds **Dark mode** (off/on) and **Stroke** (off/on) for every component, so do not add those.

Offer real variants: look for the choices a designer would want to try, such as shape, density, speed, intensity, colour treatment or an on/off behaviour, and expose each as a prop. Aim for 6 to 12 knobs (the spec lists them). Include `sound` (toggle, default true) and `volume` (range 0 to 100) on every component. Choose the type by what it controls:

- `range`: a number, with `min`, `max`, optional `step`, and `default`. Use for sizes, counts, strengths, durations. Name the unit in the label, such as `"Trail (s)"` or `"Corner (px)"`.
- `select`: one of a few named options (`options: ["Bar", "Field"]`). Use for style or mode variants.
- `toggle`: on or off, `default` true or false.

Defaults must match the component's own defaults exactly. Knob `prop` must equal the prop name. Keep labels short and in sentence case.

### 3. `meta.ts`

```ts
import type { Meta } from "..";
import "./Name.css";

export default {
  name: "Display name",
  description: "One or two sentences: what it is, then how to play with it.",
  tag: "Hover", // one interaction: Hover, Press, Drag, Slide, Swipe, Type, Select or Loading
  install: "npm install framer-motion", // only if it needs packages beyond React
  adaptedFrom: "https://…", // only for code taken from elsewhere (see Licensing); omit for original work
  demo: [ /* see section 5 */ ],
  knobs: [
    { prop: "size", label: "Size (px)", type: "range", min: 8, max: 20, default: 10 },
    { prop: "style", label: "Style", type: "select", options: ["Bar", "Field"], default: "Bar" },
    { prop: "auto", label: "Auto", type: "toggle", default: false },
  ],
  load: () => import("./Name").then((m) => m.Name),
} satisfies Meta;
```

Importing the CSS in `meta.ts` is what loads the styles on the wall and in the modal. `tag` also creates the filter chip on the wall if it is new. Nothing else needs editing: the wall, the modal, search (Ctrl/Cmd+K), the code view and the JSON for the code view all read `meta.ts`.

### 3b. Sound

The site's sound plumbing was removed when the project restarted, so **the first component built must restore it** (the only time editing the shell for a component is allowed; say so when doing it):

- `src/lab/sound.ts`: `play(name, { volume?, pitch? })` fetches `/sounds/<name>.mp3` once, decodes it with Web Audio, caches the buffer, and plays it with `playbackRate = pitch` and a gain node for volume. `play(name, { loop: true })` loops the buffer and returns a handle with `stop(fadeMs)`, `setPitch(n)` and `setVolume(n)` for sounds that follow a hold or progress (first needed by `hold-to-delete`). A mute switch kept on `<html data-muted>` and in `localStorage` ("muted") silences everything.
- `src/components/Block.tsx` passes `onSound={play}` to every component; the header and the command menu get a mute button again.
- The code view gets a Sound section listing the component's sounds with Play and Download, and "Copy prompt" can include the sound files' URLs and the `play` helper.

Rules for a component:

- A component never imports sound code. It accepts `onSound?: (name: string, o?: { volume?: number; pitch?: number }) => void` and calls it at its interaction points, scaled by its own `volume` knob and skipped when its `sound` knob is off. Rate-limit continuous input (dragging, scrolling) so it does not machine-gun.
- List every sound name it uses in `sounds: ["tick"]` in `meta.ts` (add `sounds?: string[]` to the `Meta` type when restoring the plumbing).

Generating a sound (one named in the spec as new):

1. Use the `sound-effects` skill. The API key is already in `.env.local` (never open or print that file). Use model `eleven_text_to_sound_v3`, the prompt, `duration_seconds` (minimum 0.5) and `prompt_influence` from the spec. Write the raw output to the scratchpad, not the project.
2. Trim and level it with ffmpeg: cut leading and trailing silence, trim to the length the spec asks for (UI sounds are usually 40 to 300 ms) with a few ms fade-out, low-pass at about 3.2 kHz and level every sound to the same mean (−30 dB, loops −32, peaks capped at −12 dB; measure with `volumedetect` and apply `volume`, since `loudnorm` is unreliable on clips this short), mono, `mp3` 44.1 kHz around 96 kbps. Save as `public/sounds/<name>.mp3`.
3. Listen-check is the user's job; say that the sound was generated and measured but not heard. If the user dislikes it, regenerate with an adjusted prompt and record the final prompt in the spec and in the sound library table.

### 4. The card on the wall: clipping, empty space and the play demo

The card shows the component at its natural size, centred, with the name at the bottom left and a play button and a settings button at the bottom right. Clicking the card's empty space opens the modal; touching the component itself interacts with it. This is the part most likely to go wrong, so do it deliberately.

**How the hit areas work** (all in `src/site.css`, "wall" and the end of the file):

- `.card-open` is a link that fills the whole card and sits under the component. Anything the component does not catch falls through to it and opens the modal.
- `.card-block` (the wrapper around the component) is `pointer-events: none`. Its direct child (the component's root) gets `pointer-events: auto` through a zero-specificity `:where(...)` rule, so a component's own rules win.
- That means the component's root element catches the pointer over its **whole box**. If the box is larger than the visible thing, the empty part would swallow clicks. Fix this for every new component:

  1. Open the wall, and for each visible region that should react, find which element is under the pointer. In headless Chrome, evaluate `document.elementFromPoint(x, y)` at the component's corners, its centre, and a few points just outside the visible shape. Corners and gaps must report the card link (`a[data-block]`); the visible shape must report the component.
  2. If the root box is bigger than the shape, add rules in `site.css` under a "card hit areas" comment:
     - Container that only holds things: `.card .your-root { pointer-events: none; }` and `.card .your-part { pointer-events: auto; }` for each part that reacts (see `.csw`/`.csw-card`, `.wks`/`.wks-track`).
     - One element covering a non-rectangular shape: clip it with `clip-path` so hit testing follows the shape (see `.card .asc`). Trace the polygon from a screenshot of the visible shape, and test points just inside and just outside every edge and corner.
  3. Scope every such rule with `.card` so the modal, where the whole stage is free to react, is unaffected.
- Hover effects that start on the wrapper should start on the visible shape instead, or the wake or highlight will fire in empty space.

**The play demo** (`demo` in `meta.ts`). The play button runs a pretend cursor over the component. It sends real pointer events through `elementFromPoint`, so the demo exercises exactly what a hand would, including the hit areas above (a point in empty space hits the card link and does nothing).

Steps, in coordinates as fractions (0 to 1) of the `.card-block` box (the component's own box, top left is `[0, 0]`):

```ts
demo: [
  { move: [0.95, 0.9], ms: 0 },   // start off to the side; ms: 0 places the cursor instantly
  { move: [0.3, 0.5], ms: 600 },  // glide there, eased
  { down: true },                 // press; a click on a block is down then up
  { move: [0.7, 0.5], ms: 300 },  // drag while pressed
  { up: true },                   // release
  { wait: 800 },                  // let the result play out
  { move: [0.95, 0.9], ms: 600 }, // leave
],
```

Write a demo that shows what the component is for, in 5 to 12 steps and about 4 to 8 seconds: show the hover state or the main press or drag, show each variant of behaviour that matters (a toggled state, a second mode), then leave. Rules:

- Every point must be on the visible component, not in empty space, or nothing will happen there. Work the fractions out from the component's real layout (measure with `getBoundingClientRect` in the browser) rather than guessing.
- To type, click the field first, then `{ type: "424242", ms: 900 }` sends each character to the focused element over `ms` (added by `otp-input`, the first component that needs it; until then the runner has no `type` step).
- Use `{ down: true }` then `{ up: true }` for a click; the runner sends the click for you unless the pointer is on the card's own link.
- Leave a state the component can recover from, or end by undoing it (click the toggle again), so the card looks right when the demo ends.
- A component with no pointer interaction at all (a pure animation) can omit `demo`; the play button is then not shown.

### 5. Check your work

Run these before saying it is done. Use the dev server as described above and a headless Chrome driven over the DevTools protocol; take screenshots and read them.

1. `pnpm exec tsc --noEmit -p .` and `pnpm build` both pass; `pnpm exec biome check` on the files you touched.
2. Wall: the card shows in light and dark. Name pill bottom left, play and settings buttons bottom right, nothing overlapping the component at its natural size. Screenshot it.
3. Hit areas: `elementFromPoint` at the component's corners, the gaps inside its box, and just outside its edges reports the card link; at its visible parts reports the component. Click empty space on the card and confirm the URL becomes `/<slug>` and the modal opens. Click the component and confirm the modal does not open.
4. Play: click play, take screenshots at the start, middle and end, confirm the cursor is visible, the component reacts as intended, the play button turns into a stop button and back, and the component is left in a sensible state.
5. Modal: open `/<slug>`. Block view renders. Every knob changes the component. Fill light and dark both look right. Stroke on does something visible, or is harmless. Code view shows Install, Usage, Code and How it works, and the Usage snippet reflects the knobs.
6. Copy: with the clipboard stubbed in the test page, the code view's "Copy prompt" copies the files and Usage.
7. Console is clean throughout.

Report what was checked and what was not.

### Licensing and credit

Components written for this site need no credit and no `adaptedFrom`. If a component is based on someone else's code, only use it if its licence allows, copy the licence text into `THIRD_PARTY.md` with the files it covers and what was changed, add a one-line credit comment at the top of each file, and set `adaptedFrom` in `meta.ts` to the page it came from. Never use another site's photographs, logos or name.

### Do not

- Do not add a framework other than React, or UI SDK.
- Do not edit `Wall.tsx`, `__root.tsx`, `Modal.tsx`, `Detail.tsx`, or the registry to add a component; if something seems to need that, say so first. (Exception: restoring the sound plumbing, see 3b.)
- Do not write component code during the spec phase.
- Do not commit unless asked.
