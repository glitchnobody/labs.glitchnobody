# White balance

- **Slug:** `white-balance` (URL `/white-balance`)
- **Number:** 23 / 60
- **Tag:** Slide
- **Status:** spec
- **Design reference:** `~/Downloads/inso/12.gif`, the "White Balance" tile (a blue-to-yellow gradient track with a ring thumb and a crosshair button at the right). Uses the shared editor-control look from `value-slider` (#21), with a photo added above at the user's request so the change is visible. Only the idea is used.

## Summary

A white balance control with a photo that warms and cools as you drag. Slide toward yellow for golden light, toward blue for cold light, or press the crosshair to snap back to neutral.

## Look

**Column.** A photo, then the title, then the tile, about 220 px wide.

**Photo.** 220 × 140 px, radius 14, `object-fit: cover`, 10 px above the title.

- On the site: a filler painting via `siteProps.images[0]`.
- Exported code: a neutral landscape gradient (a pale sky band over a green-grey ground band, hues from a hash) so the colour shift is still visible (see AGENTS.md, "Filler images").

The colour shift is applied with an SVG `feColorMatrix` filter (see Behaviour). A small Kelvin badge sits in the photo's bottom-left corner: "6500K" in white, 11 px weight 600, on `rgb(0 0 0 / 35%)` with radius 6.

**Tile.** The shared tile, with:

- **Temperature track:** a 28 px pill with a gradient from cool blue to warm yellow (`linear-gradient(to right in oklch, oklch(0.7 0.12 250), oklch(0.85 0.03 100), oklch(0.82 0.13 85))`, the middle near-neutral, as in the gif), and a ring thumb (22 px, 2.5 px white border, inside filled with the colour under it).
- **Crosshair button** at the right: `ph:crosshair-bold`.
- **Tint track** (when `tint` is on): the tile grows to 92 px and a 16 px pill appears under the temperature track, from green (`oklch(0.75 0.12 145)`) through neutral to magenta (`oklch(0.7 0.14 340)`), with a smaller ring thumb (16 px).

**Light and dark.** The tile, title and badge use tokens (badge stays white on dark glass); the gradients are the colours being represented.

## Behaviour

- **Temperature.** The track maps to Kelvin over `range` (2000–10000K or 2500–9000K, default 2500–9000), nonlinearly so that neutral 6500K sits at the track's centre (piecewise linear: low half 2500→6500, high half 6500→9000). Dragging moves the thumb; the photo's filter updates live; the badge shows the value rounded to 50K. Dragging toward the warm end (higher Kelvin on the slider, photographers' convention: setting a higher white balance makes the photo warmer) warms the photo.
- **Filter.** The Kelvin value is turned into RGB multipliers with the standard blackbody approximation (Tanner Helland's formula), normalised so 6500K is (1, 1, 1), and inverted (the setting compensates the light: a higher setting multiplies red up and blue down). Tint adds a green/magenta shift (green channel ×(1 ± 0.15 × tint)). The result is written into a `feColorMatrix type="matrix"` diagonal; the filter is referenced by `filter: url(#wb-<id>)` on the photo.
- **Auto (crosshair).** Pressing the crosshair spins its icon one turn (500 ms) while both thumbs glide (spring, 450 ms) to neutral (6500K, tint 0); `ping` plays as they land. Pressing it while already neutral just spins and ticks.
- **Release.** `settle` plays.
- Reports `onChange({ kelvin, tint })`.

## Interaction

- **Pointer.** Drag either track (press jumps there); press the crosshair. Pointer capture; `touch-action: none` and `user-select: none` on the tracks.
- **Keyboard.** "Temperature" and "Tint" are `slider`s (`aria-valuetext="5200 kelvin"`, "Tint plus 12"). Arrows ±50K / ±1 (Shift ×10), Home/End. The crosshair is a `button` "Auto white balance".
- **Touch.** Same as pointer.
- **Reduced motion.** The auto glide jumps; the crosshair does not spin.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| kelvin | Temperature (K) | range | 2000–10000, step 50 | 6500 | Starting temperature |
| range | Range | select | 2500–9000K, 2000–10000K | 2500–9000K | Track span |
| tint | Tint track | toggle | | false | The green ↔ magenta track |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Five knobs: the user picked these. The starting value is clamped to the chosen range.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Temperature crosses a 250K step (tint a step of 5) | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.8 + 0.5 × track position | 1 per 30 ms |
| Release | `settle` | reuse | Soft lock-in click | volume 0.5 | none |
| Auto lands on neutral | `ping` | reuse | Soft sonar ping | volume 0.5, pitch 1.1 | none |

No new sounds.

## Dependencies

- None. An inline SVG filter with a computed matrix; OKLCH gradients with an sRGB fallback.
- `@iconify/react` for the crosshair (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends neutral.

1. The cursor appears below the tile ([0.4, 1.1], instant).
2. It glides to the thumb at the centre (500 ms), presses, and drags right toward warm (800 ms): the photo turns golden, the badge counts up, ticks play. It releases: `settle`.
3. It presses again and drags all the way left to cool (1000 ms): the photo turns blue. It releases.
4. It glides to the crosshair (400 ms) and presses: the icon spins, the thumb glides to the centre, the photo returns to neutral, `ping` plays.
5. It waits 500 ms and glides away (500 ms).

## Card fit and hit areas

The column is photo, title, tile. The photo is not interactive: on the wall the root is `pointer-events: none` with `auto` on the tile only, so the photo and title fall through to the card link. Check `elementFromPoint` on the photo, the title and beside the tile (card link), and on the track and crosshair (component). The column is about 220 × 236 px (276 with the tint track).

## Accessibility and edge cases

- The photo is decorative (`aria-hidden`); the slider value text carries the information.
- The filter must not clip the image: `color-interpolation-filters="sRGB"` and a filter region equal to the image box.
- Very warm or cool extremes keep at least 25% of each channel so the photo never turns monochrome.
- Missing image: the gradient landscape still shows the shift.

## Acceptance checklist

- [ ] Looks right in light and dark; matches the shared look; stroke outlines the tile
- [ ] Dragging warms and cools the photo live with a correct Kelvin badge; 6500K sits at the track's centre
- [ ] The tint track appears and shifts green/magenta
- [ ] Auto glides both thumbs to neutral with a spinning crosshair and `ping`
- [ ] Every knob visibly changes it (temperature, range, tint)
- [ ] Copied code has no `/lab/demoimages/` URLs; the gradient landscape shows without `siteProps`
- [ ] `tick`, `settle`, `ping` respect `sound` and `volume`
- [ ] Keyboard sliders and button work; reduced motion removes the spin and glide
- [ ] Demo warms, cools, then auto-resets

## Decisions log

- Behaviour: dragging tints a photo above the tile; the crosshair is auto, gliding to neutral. (User)
- Photo: a cover image above the tile to show the change. (User)
- Knobs: temperature and range, the tint track. (User)
- Sound: `tick`, `settle`, `ping`. (User)
- Play demo: warm, cool, auto. (User)
- Decided by agent:
  - the slug `white-balance` and the tag Slide;
  - the SVG colour-matrix filter with the blackbody approximation;
  - higher Kelvin on the slider makes the photo warmer (photographers' convention);
  - 6500K fixed at the centre of the track with a piecewise mapping;
  - the Kelvin badge on the photo;
  - the tint track is off by default.
