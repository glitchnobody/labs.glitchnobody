# Tool dock

- **Slug:** `tool-dock` (URL `/tool-dock`)
- **Number:** 30 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/17.mp4` (a dark pill dock of six tools, Move, Pen, Text, Shapes, Image and Ask AI; one round highlight slides between tools on hover, and one tooltip above follows, its label and shortcut sliding sideways like a ticker while its width morphs; Ask AI has a green sparkle). Only the idea is used.

## Summary

A tool dock with one sliding highlight and a ticker tooltip. Glide across it and the highlight and label slide with you; press a tool to select it.

## Look

**Dock.** A pill on `--fill-slab` with a soft shadow in light mode and a `--pane-edge` hairline in dark (one surface, following the theme), padding 6 px. Tool buttons by `size`: S 32 px, M 40 px (default), L 48 px, 2 px apart. Icons 18 / 20 / 24 px, regular weight, in `--ink-3`.

**Tools** (the first `tools` are shown; Ask AI is always last when shown):

| Tool | Icon | Key |
| ---- | ---- | --- |
| Move | `ph:cursor` | V |
| Pen | `ph:pen-nib` | P |
| Text | `ph:text-t` | T |
| Shapes | `ph:shapes` | R |
| Image | `ph:image` | I |
| Ask AI | `ph:sparkle` (`ph:sparkle-fill` when selected), in `--pick` | ⌘ J |

With fewer than 6, tools are taken from the start of the list and Ask AI is kept as the last one (so 3 = Move, Pen, Ask AI).

**Hover highlight.** One shape behind the hovered tool, `color-mix(in srgb, var(--fill-on) 8%, transparent)`, the tool's size; `shape` Circle (default, the video) or Rounded (radius 10). The hovered icon turns `--fill-on`.

**Selected tool.** A second, steadier background `color-mix(in srgb, var(--fill-on) 13%, transparent)` with the icon in `--fill-on` (Ask AI stays `--pick`). The default selection is Move.

**Tooltip.** One pill above the dock, 8 px gap, on `--fill-slab` with a `--pane-edge` hairline and shadow, radius 8, height 28: the label (13 px, `--fill-on`) and, when `badges` is on, the key badge(s) after it (11 px, `--ink-3`, in small 18 px rounded squares with a 1 px `--pane-edge` border; "⌘" and "J" as two badges). Its content is a horizontal strip of every tool's label in order, clipped to the pill; the pill's width and horizontal position follow the hovered tool.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the dock (adds one in light mode).

## Behaviour

- **Hover.** Entering the dock fades the highlight and tooltip in at the hovered tool. Moving to another tool slides the highlight there with a spring (bounce from `bounce`). The tooltip moves its centre over the new tool and morphs its width to the new label, while the strip inside slides sideways so the new label scrolls in from the side of travel (moving right scrolls the strip left, as in the video, where "ve V | Pe" shows mid-slide). Both use the same spring. `tick` plays as the hovered tool changes.
- **Leave.** The highlight and tooltip fade out (120 ms) where they are; re-entering fades them in at the new tool without sliding from the old spot (if more than 300 ms have passed; otherwise they slide).
- **Press.** The pressed tool becomes selected: its selected background scales in from 0.8 (spring); the previous selection fades. `pop` plays. Ask AI also bursts six tiny `--pick` sparkles from its icon (CSS, 400 ms) and plays `pop` at pitch 1.3.
- **Shortcuts.** With `badges` on, the letter keys (and ⌘/Ctrl+J for Ask AI) select tools, moving the highlight and showing the tooltip briefly (800 ms). They work **only while the pointer is inside this component's block**: on the wall, the card (the area whose empty space opens the modal); in the modal, the stage. Outside it, key presses are ignored, so two components on the wall never fight over the same letter. How: listen to `keydown` on `window`, and track `pointerenter`/`pointerleave` on the nearest ancestor with `data-shortcut-scope` (the site sets it on each wall card and on the modal stage; `Block.tsx` gains this attribute when the first shortcut component is built). With no such ancestor (exported code), the scope is the component's own root. Keyboard focus inside the dock also enables them, for keyboard users.
- Reports `onChange(tool)`.

## Interaction

- **Pointer.** Hover to explore; press to select.
- **Keyboard.** The dock is a `toolbar` ("Tools") of `button`s with `aria-pressed` for the selected one and labels like "Pen (P)". Left/Right move focus (focus shows the highlight and tooltip like hover); Enter/Space select; letter shortcuts as above.
- **Touch.** Tap selects; the highlight and tooltip show at the tapped tool for 800 ms.
- **Reduced motion.** The highlight and tooltip jump instead of sliding; the strip swaps without scrolling; no sparkles.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| tools | Tools | range | 3–6 | 6 | How many tools (Ask AI stays last) |
| size | Size | select | S, M, L | M | Button and icon size |
| bounce | Bounce | range | 0–100 | 25 | Spring bounce of the highlight and tooltip |
| shape | Highlight | select | Circle, Rounded | Circle | Highlight shape |
| badges | Shortcuts | toggle | | true | Key badges in the tooltip and keyboard shortcuts |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Hovered tool changes | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 1 + 0.04 × index | 1 per 35 ms |
| A tool is selected | `pop` | reuse | Bubbly pop | volume 0.55 (Ask AI pitch 1.3) | none |

No new sounds.

## Dependencies

- None. A tiny rAF spring drives the highlight's x, the tooltip's x and width, and the strip's offset together; sparkles are CSS keyframes.
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends with Ask AI selected (a fine state; the card shows a selection either way).

1. The cursor appears below the dock on the left ([0.05, 1.6], instant).
2. It glides onto Move (500 ms): the highlight and tooltip appear.
3. It glides right across Pen, Text, Shapes, Image to Ask AI (1400 ms): the highlight slides and the tooltip's label ticks along with ticks.
4. It glides back to Text (500 ms) and presses: Text is selected, `pop`.
5. It glides to Ask AI (500 ms) and presses: sparkles burst, `pop` higher.
6. It waits 500 ms and glides away (500 ms).

## Card fit and hit areas

The dock is a pill; the tooltip floats above it and is `pointer-events: none`. The root is the dock itself. Check `elementFromPoint` just outside the dock's rounded ends and where the tooltip shows (card link), and on a tool (component).

## Accessibility and edge cases

- The tooltip is `aria-hidden` (labels are on the buttons).
- Changing `tools` while hovering re-measures and re-targets the highlight.
- ⌘J is intercepted only inside the shortcut scope (pointer in the block, or focus in the dock), so it never steals the browser shortcut elsewhere.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines the dock
- [ ] One highlight slides between tools; the tooltip moves, morphs width and ticker-scrolls its label in the travel direction
- [ ] Pressing selects with a scale-in; Ask AI sparkles in `--pick`
- [ ] Every knob visibly changes it (tools, size, bounce, highlight, shortcuts)
- [ ] `tick` and `pop` respect `sound` and `volume`
- [ ] Toolbar keyboard works; shortcuts fire only with the pointer in the block (or focus in the dock) and are ignored elsewhere; reduced motion jumps
- [ ] Demo glides across, selects Text, then Ask AI

## Decisions log

- Press selects a tool. (User)
- Tooltip: ticker slide with width morph. (User)
- Sound: `tick` and `pop`. (User)
- Play demo: glide across, pick Text, pick Ask AI. (User)
- Knobs: tools and size, highlight spring and shape, shortcut badges. (User)
- Ask AI accent: `--pick`. (User)
- Shortcuts work only while the pointer is inside the component's block (the card on the wall, the stage in the modal). (User)
- Decided by agent:
  - the slug `tool-dock` and the tag Hover;
  - one surface following the theme (the video is dark-only);
  - Ask AI stays last at any tool count;
  - re-entering after 300 ms fades in rather than sliding;
  - the shortcut letters (V, P, T, R, I, ⌘J);
  - a six-sparkle burst for Ask AI.
