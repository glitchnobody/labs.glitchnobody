# Value slider

- **Slug:** `value-slider` (URL `/value-slider`)
- **Number:** 21 / 60
- **Tag:** Slide
- **Status:** spec
- **Design reference:** `~/Downloads/inso/12.gif`, the "Value Slider" tile (a dark rounded tile with a thin grey track, a blue fill and a white round thumb). The gif shows nine photo-editor controls; each is its own component (#21 to #29), sharing the look below. Only the idea is used.

## Shared editor-control look (used by #21 to #29)

The nine editor controls from `12.gif` share one look so they read as a family on the wall. The other eight specs refer to this section.

- **Title** above the tile, centred, "Value Slider" style: `--fill-on`, 12 px weight 600, 8 px above the tile. Shown when the component's `title` prop is non-empty (default: the control's name).
- **Tile:** 220 × 56 px, radius 14, on `color-mix(in srgb, var(--fill-on) 9%, var(--fill-slab))` (the gif's dark grey on black in dark mode, a light grey in light mode), padding 0 14 px, content vertically centred.
- **Accent:** `--pick` (the gif's blue) for fills and active states.
- **Thumb:** a 22 px circle, white (`#fff` in both themes, with a soft `0 1px 3px rgb(0 0 0 / 30%)` shadow so it reads on light tracks).
- **Icon buttons** at the tile's right end: 28 px circles, Phosphor icons 18 px in `--fill-on`, hover background `color-mix(in srgb, var(--fill-on) 10%, transparent)`.
- **Segmented controls:** segments in `--ink-3`, 12 px weight 500; the selected one on `color-mix(in srgb, var(--fill-on) 14%, transparent)` with `--fill-on` text, radius 8, sliding between options.
- **Stroke on:** 1 px `--pane-edge` around the tile.
- **Light and dark:** tokens only, apart from the white thumb and any gradient a control defines.
- **Card fit:** the title and tile form a 220 × 76 px column; on the wall the column is `pointer-events: none` with `auto` on the tile, so the title and the space around fall through to the card link.
- **Sound family:** `tick` for steps, `settle` for releases and commits, `pop` for picks, reusing the library.

## Summary

A value slider with a thumb that swells as you drag and a bubble that shows the number. Drag it past the ends to feel it stretch, or click the track to glide there.

## Look

The shared tile (above), with:

- **Track:** 4 px tall, fully rounded, spanning the tile minus padding, in `color-mix(in srgb, var(--fill-on) 16%, transparent)`.
- **Fill:** from the left to the thumb, in the `accent` colour: Pick (`--pick`, default), Ok (`--ok`), Ink (`--fill-on`).
- **Thumb:** the shared 22 px white thumb.
- **Bubble** (when `bubble` is on): while pressed, a small pill above the thumb on `--fill-on` with text in `--fill-slab`, 11 px weight 600, tabular figures, showing the value; it rises 6 px and fades in, and overflows the tile's top (not clipped).

## Behaviour

- **Press the thumb.** The thumb scales to 1.25 with a quick spring (CSS `linear()`), and the bubble rises.
- **Drag.** The value follows the pointer, snapped to `step`. The fill and thumb move with it directly.
- **Rubber-band ends.** Dragging past either end moves the thumb only a fraction of the overshoot (`overshoot × 0.25`, at most 14 px) and stretches the track and fill by the same amount on that side (scaleX from the opposite end). Releasing springs everything back.
- **Click the track.** Pressing the track away from the thumb glides the thumb there with a spring (200 to 300 ms, small overshoot) and the value counts along; if the pointer stays down after the glide, dragging continues from there.
- **Release.** The thumb shrinks back; the bubble falls and fades after 300 ms; `settle` plays.

## Interaction

- **Pointer.** Press anywhere on the tile's track area to drag or glide. Pointer capture; `touch-action: none` and `user-select: none` on the tile.
- **Keyboard.** `role="slider"` with `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow`, label from the title. Arrows ±`step`, Page Up/Down ±10, Home/End. Keys show the bubble briefly and tick.
- **Touch.** Same as pointer.
- **Reduced motion.** No spring or rubber band: the thumb does not scale, the glide is a 120 ms ease, the bubble appears without rising.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| value | Value | range | 0–100 | 0 | Starting value |
| step | Step | select | 1, 5, 10 | 1 | Value increments |
| bubble | Value bubble | toggle | | true | The number above the thumb while dragging |
| accent | Accent | select | Pick, Ok, Ink | Pick | Fill colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Six knobs. Also takes `title` and `onChange`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The value crosses a multiple of 5 (or each step if `step` ≥ 5) | `tick` | reuse | Tiny dry tick | volume 0.35, pitch 0.85 + 0.4 × value / 100 | 1 per 30 ms |
| Release | `settle` | reuse | Soft lock-in click | volume 0.5 | none |

No new sounds.

## Dependencies

- None. Pointer events, CSS transforms, and a tiny rAF spring for the glide and rubber-band return.
- No icons.

## Play demo

Agreed with the user. About 5 seconds; ends at 40.

1. The cursor appears below the tile on the left ([0.05, 1.3], instant).
2. It glides to the thumb at 0 ([0.08, 0.62], 500 ms) and presses: the thumb swells, the bubble shows 0.
3. It drags right to the end and 30 px past it ([1.08, 0.62], 900 ms): ticks rise, the track stretches at the end.
4. It releases: the stretch springs back, `settle` plays.
5. It waits 400 ms, glides to 40% of the track ([0.4, 0.62], 400 ms) and clicks: the thumb glides back to 40.
6. It waits 600 ms and glides away (500 ms).

(Coordinates are fractions of the title-plus-tile column; the tile occupies roughly y 0.26 to 1.0.)

## Card fit and hit areas

See the shared look: only the tile reacts. Check `elementFromPoint` on the title, beside the tile, and just outside its rounded corners (card link), and on the track and thumb (component). The bubble is `pointer-events: none`.

## Accessibility and edge cases

- The white thumb on a light tile in light mode keeps a visible shadow edge.
- `step` 10: ticks play on every step.
- Value changes from the knob glide like a click.

## Acceptance checklist

- [ ] Looks right in light and dark; matches the shared tile look; stroke outlines the tile
- [ ] Thumb swells on press with the bubble; drag snaps to step; rubber-band past both ends springs back
- [ ] Clicking the track glides the thumb and drag continues
- [ ] Every knob visibly changes it (value, step, bubble, accent)
- [ ] `tick` and `settle` respect `sound` and `volume`
- [ ] Slider keyboard works; reduced motion removes springs
- [ ] Demo drags past the end, releases and glides to 40

## Decisions log

- The nine controls in `12.gif` are nine components with one shared look, defined here. (User)
- Behaviour: the thumb grows with a value bubble, rubber-band ends, click to glide. (User)
- Sound: `tick` by step and `settle` on release. (User)
- Play demo: drag past the end, release, click at 40%. (User)
- Knobs: value, step, bubble, accent. (User)
- Decided by agent:
  - the slug `value-slider` and the tag Slide;
  - the shared tile measurements, the white thumb in both themes, and the sound family;
  - rubber-band strength (25%, at most 14 px).
