# Liquid toggle

- **Slug:** `liquid-toggle` (URL `/liquid-toggle`)
- **Number:** 49 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/37.mp4` (a red → pink → blue gradient pill with a white-outlined lens; the lens moves end to end, stretching like a liquid capsule on the way and settling round, and the gradient stays sharp inside the lens and blurred outside). Used as an on/off toggle, at the user's request. Only the idea is used.

## Summary

An on/off toggle with a liquid lens. Click it and the lens stretches across the gradient and settles round at the other end; or grab the lens and fling it.

## Look

**Track.** A pill, size by `size` (S 64 × 28, M 92 × 40 default, L 120 × 52 px), filled with the palette gradient left to right. Outside the lens the gradient is blurred by `blur` px (default 10) and slightly extends beyond the pill (a soft glow, as in the video); inside the lens it is sharp.

**Palettes** (`palette`), left (off) → right (on):

| Palette | Gradient |
| ------- | -------- |
| Red → Blue (default, the video) | `#e8343a` → `#f09cc4` → `#3d7fe0` |
| Sunset | `#ff5e3a` → `#ffb347` → `#8f5bff` |
| Mint | `#9aa3ad` → `#7fe0c3` → `#1fb38a` |
| Mono | `--ink-4` → `--ink-3` → `--fill-on` |

The first three are fixed colours (they are the effect); Mono reads the tokens.

**Lens.** A circle the track's height minus 6 px, with a 2 px white ring and a faint inner shadow, showing the sharp gradient beneath it (the same gradient drawn sharp, clipped to the lens). Off: at the left end; on: at the right end.

**Light and dark.** The gradients look the same in both; Mono follows the tokens; the white ring has a 1 px dark shadow edge so it reads on light backgrounds.

**Stroke on.** Nothing extra; harmless.

## Behaviour

- **Click.** Pressing anywhere on the toggle (without dragging) flips it. The lens travels to the other end: its leading edge moves first and its trailing edge follows, so it stretches into a capsule (up to `stretch` × the track length, default 0.7) and then the trailing edge catches up and it springs round (bounce from `bounce`). The sharp gradient inside the lens updates as it moves.
- **Drag and fling.** Pressing the lens and dragging moves it along the track (clamped); its shape stretches in the drag direction in proportion to speed. On release it goes to the end in the direction of the release velocity if fast, else to the nearer end, with the same stretch-and-settle.
- **State.** Off at the left, on at the right. Reports `onChange(on)`.
- **Sound.** While the lens moves, `blip` notes play pitched by its position along the track (pentatonic, five steps from left to right), rate-limited; when it settles round, `jelly` plays.

## Interaction

- **Pointer.** Click or drag. Pointer capture; `touch-action: none` and `user-select: none`.
- **Keyboard.** A `switch` with `aria-checked`, labelled by the `label` prop (default "Liquid toggle"); Space/Enter flip it; Left/Right set off/on.
- **Touch.** Same.
- **Reduced motion.** No stretch or bounce: the lens slides end to end in 150 ms.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| size | Size | select | S, M, L | M | Toggle size |
| blur | Outside blur (px) | range | 0–20 | 10 | Blur of the gradient outside the lens |
| stretch | Stretch | range | 0–1, step 0.05 | 0.7 | How long the lens stretches while moving |
| bounce | Bounce | range | 0–100 | 40 | Spring bounce when it settles |
| palette | Palette | select | Red → Blue, Sunset, Mint, Mono | Red → Blue | Gradient colours |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `checked` (default false), `label` and `onChange`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The lens passes each fifth of the track | `blip` | reuse (from `activity-heatmap`) | Soft marimba note | volume 0.35, pitch `2 ** (semitones / 12)` with 0, 2, 4, 7, 9 from left to right | 1 per 50 ms |
| The lens settles round | `jelly` | reuse (from `jelly-slider`) | Soft wobbly boing | volume 0.45 | 1 per 200 ms |

No new sounds. A click from off to on plays a rising run of notes, on to off a falling one.

## Dependencies

- None. The lens is an SVG capsule (a rect with full radius) whose two ends are driven by two springs in rAF; the blurred gradient is a CSS `filter: blur()` layer, the sharp one a clipped copy.
- No icons.

## Play demo

Agreed with the user. About 5 seconds; ends off.

1. The cursor appears below the toggle ([0.2, 1.8], instant).
2. It glides to the lens at the left (500 ms) and presses.
3. It flings right quickly ([0.95, 0.5], 200 ms) and releases: the lens stretches across with rising notes and settles round at blue (on); `jelly`.
4. It waits 800 ms, presses the lens at the right, flings left (200 ms) and releases: back to red (off) with falling notes.
5. It waits 600 ms and glides away (500 ms).

## Card fit and hit areas

The track is a pill but the blurred glow extends beyond it; the glow is `pointer-events: none`. The root is the pill. Check `elementFromPoint` just outside the pill's rounded ends and in the glow (card link), and on the track (component).

## Accessibility and edge cases

- The on and off states differ by position as well as colour.
- Rapid clicks retarget the springs from wherever the lens is.
- With `stretch` 0 the lens slides without stretching but still settles with the bounce.

## Acceptance checklist

- [ ] Looks like the video in the default palette; all palettes work in light and dark
- [ ] Clicking flips it with the stretch-and-settle; drag and fling work and snap to an end
- [ ] Sharp inside the lens, blurred outside
- [ ] Every knob visibly changes it (size, outside blur, stretch, bounce, palette)
- [ ] Rising and falling `blip` runs and `jelly` on settle respect `sound` and `volume`
- [ ] Switch keyboard works; reduced motion slides
- [ ] Demo flings on, then off

## Decisions log

- Purpose: an on/off toggle. (User)
- States: off at the red left end, on at the blue right end. (User)
- Lens: stretches with speed, snaps round. (User)
- Switching: click, or drag and fling. (User)
- Sound: `blip` by position and `jelly` on settle. (User)
- Knobs: size, outside blur, stretch and bounce, palette. (User)
- Play demo: fling right, fling left. (User)
- Decided by agent:
  - the slug `liquid-toggle` and the tag Press;
  - the Sunset, Mint and Mono palettes;
  - the two-spring capsule (leading and trailing edges);
  - five pentatonic steps along the track.
