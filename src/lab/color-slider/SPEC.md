# Color slider

- **Slug:** `color-slider` (URL `/color-slider`)
- **Number:** 22 / 60
- **Tag:** Slide
- **Status:** spec
- **Design reference:** `~/Downloads/inso/12.gif`, the "Color Slider" tile (a pale-to-vivid cyan gradient track filling the tile, a ring thumb, and a rainbow colour-wheel button at the right). Uses the shared editor-control look from `value-slider` (#21). Only the idea is used.

## Summary

A shade slider with a hue strip tucked behind a colour wheel. Drag along the gradient to pick a shade; press the wheel to open a hue row underneath and change the colour family.

## Look

The shared tile (see `value-slider`, "Shared editor-control look"), with:

- **Shade track:** a pill 28 px tall filling the tile's width minus the wheel button and gaps, with a gradient from a pale tint to the vivid colour of the current hue (`linear-gradient(to right in oklch, oklch(0.9 0.04 h), oklch(0.72 0.14 h))`; default hue cyan, h = 215).
- **Thumb** (`thumb`):

  | Thumb | Look |
  | ----- | ---- |
  | Ring (default, the gif) | a 22 px circle with a 2.5 px white border, its inside filled with the exact colour under it |
  | Solid | the shared 22 px white thumb |
  | Loupe | a ring thumb plus, while dragging, a 40 px magnified circle above it showing the colour with a white border and a small pointer (overflows the tile top) |

- **Wheel button:** at the right, a 22 px circle filled with a conic rainbow (`conic-gradient(in oklch longer hue, oklch(0.75 0.15 0), oklch(0.75 0.15 360))`) with a 2 px white ring when the hue row is open.
- **Hue row** (when open): the tile grows from 56 to 96 px tall, and a second pill 20 px tall appears under the shade track, spanning the same width, with a full rainbow gradient (`linear-gradient(to right in oklch longer hue, …)` at the same lightness and chroma as the vivid end) and its own small ring thumb at the current hue.
- **Readout** (`readout`): while dragging either track, a small pill above the thumb on `--fill-on` with `--fill-slab` text, 11 px, monospace digits: Off, Hex ("#3FB8D4"), or HSL ("hsl 195 62% 54%").

**Light and dark.** The tile and readout use tokens; the gradients are the colours being picked.

## Behaviour

- **Drag the shade.** Pressing anywhere on the shade track jumps the thumb there and drags. The ring's inside shows the colour under it; the value is 0 to 1 along the track. `tick` plays every 5% (pitch follows the position).
- **Open the hue row.** Pressing the wheel button spins it 180° (300 ms) and grows the tile; the hue row fades in and slides down 6 px. `expand` plays. The wheel keeps a white ring while open.
- **Drag the hue.** Dragging the hue row changes the hue live: the shade track's gradient and the ring colour re-tint as you drag. `tick` every 10° of hue.
- **Close.** Pressing the wheel again spins it back, the hue row fades, the tile shrinks. `collapse` plays. It also closes on Escape or after a press outside the tile.
- **Release.** Releasing either thumb plays `settle`.
- The component reports `onChange({ hue, shade, hex })`.

## Interaction

- **Pointer.** Drag either track; press the wheel. Pointer capture; `touch-action: none` and `user-select: none` on the tracks.
- **Keyboard.** The shade track and the hue row are `slider`s ("Shade", "Hue") with arrows ±1% / ±5° (Shift ×10), Home/End. The wheel is a `button` with `aria-expanded` and `aria-controls` pointing to the hue row, labelled "Change hue".
- **Touch.** Same as pointer.
- **Reduced motion.** No wheel spin or slide: the hue row appears and the tile height changes without animation.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| readout | Readout | select | Off, Hex, HSL | Off | The value shown above the thumb while dragging |
| thumb | Thumb | select | Ring, Solid, Loupe | Ring | Thumb style |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Four knobs: the user kept only these. Also takes `hue` (default 215), `shade` (default 0.15, near the pale end, as the gif starts), `title` and `onChange`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Shade crosses a 5% step, or hue a 10° step | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.85 + 0.4 × position | 1 per 30 ms |
| Hue row opens / closes | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.45 | none |
| Release | `settle` | reuse | Soft lock-in click | volume 0.5 | none |

No new sounds.

## Dependencies

- None. CSS gradients in OKLCH (supported in current browsers; fall back to sRGB `hsl()` gradients via `@supports not (color: oklch(0 0 0))`), colour maths for the hex readout (OKLCH → sRGB, about 25 lines).
- No icons (the wheel is a gradient swatch, not an icon).

## Play demo

Agreed with the user. About 6 seconds; ends with a violet track and the hue row closed.

1. The cursor appears below the tile ([0.3, 1.4], instant).
2. It glides to the ring thumb near the pale end (500 ms), presses and drags right to about 80% of the shade track (800 ms): the ring fills with deeper cyan, ticks play. It releases: `settle`.
3. It glides to the wheel button (400 ms) and presses: the wheel spins, the tile grows the hue row; `expand`.
4. It glides to the hue row's thumb (400 ms), presses and drags right to violet (h ≈ 290) (700 ms): the shade track re-tints live. It releases.
5. It glides to the wheel (400 ms) and presses: the hue row closes; `collapse`.
6. It glides away (500 ms).

Coordinates are worked out at build time from the real layout (the tile grows during the demo, so steps 4 and 5 measure the open layout).

## Card fit and hit areas

Shared look: only the tile reacts. The tile grows downward when open; the root's box grows with it. Check `elementFromPoint` on the title and beside the tile (card link), and on both tracks and the wheel (component).

## Accessibility and edge cases

- The ring's inside colour always matches the exported `hex`.
- Hue wrap: dragging to either end of the hue row stops at 0 or 360, not wrapping mid-drag.
- Very pale shades make the ring thumb's inside nearly white; the white ring keeps a 1 px dark shadow edge so it stays visible.

## Acceptance checklist

- [ ] Looks right in light and dark; matches the shared look; stroke outlines the tile
- [ ] Dragging the shade fills the ring with the colour under it; the readout shows Hex or HSL
- [ ] The wheel opens the hue row (tile grows) and closes it; dragging the hue re-tints the shade track live
- [ ] All three thumb styles work (the loupe overflows the tile cleanly)
- [ ] Every knob visibly changes it (readout, thumb)
- [ ] `tick`, `expand`, `collapse`, `settle` respect `sound` and `volume`
- [ ] Both sliders and the wheel button work by keyboard; reduced motion removes the spin and slide
- [ ] Demo drags the shade, opens the hue row, picks violet and closes it

## Decisions log

- Behaviour: drag picks the shade; the wheel button opens a hue row. (User)
- Hue row: the tile grows a second row. (User)
- Knobs: readout and thumb style (four in total with sound and volume). (User)
- Sound: `tick`, `expand`/`collapse`, `settle`. (User)
- Play demo: drag the shade, open the hue row, pick violet, close. (User)
- Decided by agent:
  - the slug `color-slider` and the tag Slide;
  - OKLCH gradients with an sRGB fallback;
  - the default hue (cyan, 215) and shade (0.15);
  - the hue row closes on Escape or an outside press;
  - the wheel is a conic gradient swatch, not an icon.
