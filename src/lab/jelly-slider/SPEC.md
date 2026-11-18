# Jelly slider

- **Slug:** `jelly-slider` (URL `/jelly-slider`)
- **Number:** 12 / 60
- **Tag:** Slide
- **Status:** spec
- **Design reference:** `~/Downloads/inso/03.gif` (a dark pill progress bar whose value jumps between 16, 60, 15, 46 and 96%; the fill's leading edge flashes white, the pill wobbles like jelly and the digits blur into their new values). Only the idea is used; the fill here is a single accent colour rather than the gif's colour-by-value.

## Summary

A percentage slider made of jelly. Drag or click the track to set the value: the fill snaps there with a white flash, the number blurs into place and the whole pill wobbles before it settles.

## Look

**Pill.** 300 × 52 px, fully rounded, drawn as one SVG path (so its edges can ripple). The track is `color-mix(in srgb, var(--fill-on) 14%, var(--fill-slab))` (the gif's dark grey on black in dark mode, a light grey in light mode).

**Fill.** From the left end to the value, clipped to the same path, in the `accent` colour:

| Accent | Colour |
| ------ | ------ |
| Pick (default) | `--pick` |
| Ok | `--ok` |
| Danger | `--danger` (the token added by `hold-to-delete`; if this is built first, it adds `--danger`) |
| Ink | `--fill-on` |

Inside the fill, a soft horizontal gradient from the accent to a lighter mix (`color-mix(in srgb, var(--accent) 70%, white)`) toward the leading edge, as in the gif. The fill's right edge is a straight vertical cut, like the gif.

**Number.** Inside the fill's left end: the value in white, 26 px weight 800 with tabular figures, and "%" at 13 px weight 700 just after it, baseline-aligned. When the fill is narrower than the number, the number stays where it is and sits partly over the track, still white (the gif does this at 15%).

**Flash.** When `flash` is on and the value changes, a white radial glow (about 60 px wide, blurred) appears at the fill's leading edge and fades over 400 ms, as in the gif.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` outline on the pill path.

## Behaviour

- **Setting the value.** Dragging on the track sets the value continuously to the pointer's position (whole numbers, 0 to 100). Clicking jumps straight there.
- **Fill motion.** While dragging, the fill follows the pointer exactly. On a click jump, the fill springs to the new value (stiff spring, small overshoot).
- **Jelly wobble.** The pill's top and bottom edges are each a smooth curve through 7 control points. After a jump or a release, the edges ripple: points near the fill's leading edge get pushed out (bulge) and a damped wave travels along the pill, so it narrows and bulges as in the gif. The wave's height comes from `wobble` and how quickly it calms from `damping`. A jump's wobble scales with the jump distance (a 1% change barely moves; 80% rings fully). During a drag, the pill squashes slightly in the drag direction in proportion to drag speed, then rings on release.
- **Digit blur.** When `blur` is on, each changing digit cross-fades to its new digit with a short vertical blur (`filter: blur(4px)` to 0 over 180 ms) and a slight scale. While dragging, digits change instantly (no blur) so they stay readable.
- **Settle.** When the wobble's energy drops below a threshold, the edges snap to the clean pill and the rAF loop stops.

## Interaction

- **Pointer.** Press anywhere on the pill to jump; keep the pointer down to drag. Pointer capture keeps the drag going outside the pill. `touch-action: none` and `user-select: none` on the pill.
- **Keyboard.** The pill is a `slider` (`role="slider"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow`, `aria-valuetext="46 percent"`, label "Progress"). Left/Down −1, Right/Up +1, Page Up/Down ±10, Home 0, End 100. Each key press triggers a small wobble.
- **Touch.** Same as pointer.
- **Reduced motion.** No wobble, no spring: the fill moves with a 150 ms ease, the number swaps without blur, the flash is a simple fade.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| value | Value (%) | range | 0–100 | 16 | Starting value |
| wobble | Wobble | range | 0–100 | 60 | How much the pill ripples |
| damping | Damping | range | 0–100 | 45 | How quickly the ripple calms |
| flash | Flash | toggle | | true | White glow at the leading edge on change |
| blur | Digit blur | toggle | | true | Digits blur into their new values |
| accent | Accent | select | Pick, Ok, Danger, Ink | Pick | Fill colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

The component also takes `onChange(value)`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The number changes while dragging or with keys | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.85 + 0.4 × value / 100 | 1 per 35 ms |
| The pill wobbles after a jump or release | `jelly` | new | Soft wobbly boing | volume 0.3 + 0.5 × jump size, pitch 1.1 − 0.2 × jump size | 1 per 200 ms |

New sound:

- **Name:** `jelly`
- **ElevenLabs prompt:** "A soft short wobbly jelly boing, a squishy rubbery wobble that quickly settles, cute and gentle interface sound, dry, no reverb"
- **duration_seconds:** 0.6 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** about 350 ms

## Dependencies

- None. The pill is an SVG path rebuilt each frame from spring-driven control points in rAF; the digit blur is CSS.
- No icons.

## Play demo

Agreed with the user. About 6 seconds; ends at 96%, which is a fine resting state (the value knob resets it).

1. The cursor appears below the pill on the right ([0.9, 1.3], instant).
2. It glides to the fill's leading edge at 16% ([0.16, 0.5], 500 ms) and presses.
3. It drags right to 60% ([0.6, 0.5], 700 ms): the fill follows, ticks rise in pitch. It releases: the pill wobbles and `jelly` plays.
4. It waits 600 ms, then glides to 15% ([0.15, 0.5], 400 ms) and clicks: the fill springs back with a flash and wobble.
5. It waits 600 ms, then glides to 96% ([0.96, 0.5], 500 ms) and clicks: a big jump, a big wobble.
6. It waits 800 ms and glides away (500 ms).

## Card fit and hit areas

The pill fills its box apart from the rounded ends and the extra 12 px above and below that the wobble can bulge into. On the wall the root is `pointer-events: none` with `auto` on the SVG path (`pointer-events: visiblePainted`), so the corners outside the rounded ends fall through. Check `elementFromPoint` just outside each rounded end, above and below the pill (card link), and on the track and the fill.

## Accessibility and edge cases

- The white number on a light `--pick` fill must stay readable; add a faint text shadow (`0 1px 2px rgb(0 0 0 / 25%)`).
- Value 0: no fill; the number sits over the track in `--fill-on` instead of white.
- Value 100: the fill's right end follows the pill's rounded end.
- `wobble` 0: no ripple, the fill still springs.
- Changing `value` from the knob animates like a click jump.
- Rapid clicks: the spring retargets; wobble energy adds up but is capped.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the pill
- [ ] Drag follows exactly, click springs with a flash, release and jumps wobble like jelly in proportion to the distance
- [ ] Digits blur into new values on jumps, change instantly while dragging
- [ ] Every knob visibly changes it (value, wobble, damping, flash, blur, accent)
- [ ] `tick` while dragging and `jelly` on settle respect `sound` and `volume`
- [ ] Slider role and keys work; reduced motion removes wobble and blur
- [ ] Hit areas: the rounded ends' corners fall through to the card link
- [ ] Demo drags up, clicks low, clicks high

## Decisions log

- Control: drag or click the track (a slider). (User)
- Colour: a single accent colour, not colour-by-value. (User)
- Wobble: SVG path with springs, no library. (User)
- Sound: new `jelly` on settle, `tick` while dragging. (User)
- Knobs: wobble and damping, flash and digit blur, accent. (User)
- Play demo: drag up, click low, click high. (User)
- Decided by agent:
  - the slug `jelly-slider` and the tag Slide;
  - the starting value 16 (the gif's first value);
  - the wobble scales with jump size and drag speed;
  - no digit blur while dragging;
  - the number stays put and overlaps the track when the fill is narrow, as in the gif;
  - the keyboard steps.
