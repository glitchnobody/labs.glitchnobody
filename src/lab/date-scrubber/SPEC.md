# Date scrubber

- **Slug:** `date-scrubber` (URL `/date-scrubber`)
- **Number:** 26 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/13.gif` (a date ruler at the bottom of a phone screen: day ticks growing taller near a red centre marker, a red date pill "Sun • Oct 27" while dragging, and a "← Today" / "Today →" pill to jump back). Built as the control only, without the phone, and without the gif's "+" button. Only the idea is used.

## Summary

A date picker you flick like a ruler. Drag or flick the day ticks under the marker; it glides, snaps to a day, and a Today pill brings you back.

## Look

**Strip.** About 320 × 92 px, transparent (it sits on the card's surface), content centred:

- **Pills row** on top: the date pill in the centre, the Today pill to its left or right.
- **Ruler** below: a row of day ticks with the marker in the centre.
- The ruler's edges fade out over 40 px on each side (a CSS mask), as in the gif.

**Ticks.** One per day, `spacing` px apart (default 9), 1.5 px wide, rounded, in `--ink-4`. Height and darkness depend on distance from the marker (fisheye, strength from `fisheye`): 26 px and `--ink-2` at the marker, falling off smoothly (a Gaussian over about 6 days at default strength) to 8 px and `--ink-5` far away. With `fisheye` 0 they are all 10 px.

- **Accents:** Mondays get +3 px; the 1st of each month gets +6 px and full `--ink-3` at any distance.
- **Month labels** (when `months` is on): a tiny month name ("Nov") in `--ink-4`, 9 px, under each 1st.

**Marker.** A 3 px wide, 30 px tall rounded bar in the accent colour, fixed at the centre, over the ticks.

**Date pill.** Centred above the marker: the date in the chosen `format`, 12 px weight 600, padding 5 × 12, fully rounded. While dragging or gliding: accent background, white text. Idle: `color-mix(in srgb, var(--fill-on) 8%, var(--fill-slab))` background, `--fill-on` text. It cross-fades between the two over 200 ms, 600 ms after motion stops.

**Today pill.** When the selected day is not today: "← Today" to the left of the date pill if today is earlier, "Today →" to the right if today is later; 12 px weight 500, `--ink-3` on `color-mix(in srgb, var(--fill-on) 6%, var(--fill-slab))`, fully rounded. It fades and slides in from its side.

**Accent** (`accent`): Danger (`--danger`, default, the gif's red; added by `hold-to-delete` if not yet built), Pick (`--pick`), Ink (`--fill-on`).

**Format** (`format`): "Sun • Oct 27" (default), "27 Oct 2026", "Oct 27". Names from `Intl.DateTimeFormat` in English.

**Light and dark.** Tokens only.

**Stroke on.** Nothing to outline (no surface); harmless.

## Behaviour

- **Range.** Days from today − `range` to today + `range` (default ±90). The ruler starts on today.
- **Drag.** Pressing anywhere on the ruler and dragging moves it 1:1 (dragging right moves to earlier days). `tick` plays each time a day crosses the marker.
- **Momentum.** On release, the ruler continues with the release velocity and decelerates by `friction` (exponential decay per frame, time-corrected). When it slows below a threshold it snaps to the nearest day with a small spring. At the range ends it stops with a soft rubber-band bounce.
- **Snap.** When it lands, `settle` plays and the date pill turns idle after 600 ms.
- **Wheel and trackpad.** Horizontal wheel (or Shift + vertical wheel) scrolls the ruler; after 150 ms without wheel input it snaps.
- **Today.** Pressing the Today pill glides the ruler back to today (spring, duration scaled with distance, capped at 700 ms), ticking through days at a capped rate; `swipe` plays at the start. The Today pill fades out on arrival.
- Reports `onChange(date)` when it lands on a day.

## Interaction

- **Pointer.** Drag or flick the ruler; press the Today pill. Pointer capture; `touch-action: none` and `user-select: none` on the ruler.
- **Keyboard.** The ruler is a `slider` labelled "Date" with `aria-valuetext` ("Sunday, October 27, 2026"). Left/Right ±1 day, Page Up/Down ±7 days, Home/End the range ends, T jumps to today. The Today pill is a `button` "Jump to today".
- **Touch.** Same as pointer; flicks feel native.
- **Reduced motion.** No momentum or spring: release snaps to the nearest day immediately; Today jumps without gliding; the fisheye stays (it is static layout).

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| range | Range (days) | range | 30–365, step 15 | 90 | Days available before and after today |
| spacing | Tick spacing (px) | range | 5–16 | 9 | Distance between day ticks |
| fisheye | Fisheye | range | 0–100 | 60 | How much ticks grow near the marker |
| friction | Momentum | range | 0–100 | 50 | How far a flick carries (0 = stops at once) |
| accent | Accent | select | Danger, Pick, Ink | Danger | Marker and active pill colour |
| format | Format | select | Sun • Oct 27, 27 Oct 2026, Oct 27 | Sun • Oct 27 | Date pill format |
| months | Month labels | toggle | | false | Month names under the 1st |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A day crosses the marker | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.9 + min(speed, 1) × 0.3 (faster = higher) | 1 per 25 ms |
| It lands on a day | `settle` | reuse | Soft lock-in click | volume 0.45 | 1 per 200 ms |
| Today pill pressed | `swipe` | reuse | Quick paper swish | volume 0.5 | none |

No new sounds. (`pop` was planned for the "+" button, which was dropped; landing uses `settle` instead.)

## Dependencies

- None. The ruler is one canvas-free row of absolutely positioned ticks (or a single SVG), only the visible window (about 50 ticks) rendered and recycled; momentum and springs in rAF.
- No icons (the arrows in the Today pill are text arrows "←" "→", as in the gif).

## Play demo

Agreed with the user. About 5 seconds; ends on today.

1. The cursor appears below the ruler on the left ([0.2, 1.2], instant).
2. It glides onto the ruler left of centre ([0.3, 0.75], 400 ms) and presses.
3. It drags right quickly ([0.75, 0.75], 300 ms) and releases: the ruler flicks into the past with momentum, ticks racing then slowing, the date pill red; it snaps to a day with `settle`. "Today →" appears on the right.
4. It waits 600 ms (the pill turns idle grey).
5. It glides to "Today →" (500 ms) and presses: the ruler glides back to today, `swipe`, ticks; the Today pill fades.
6. It waits 500 ms and glides away (500 ms).

## Card fit and hit areas

The strip has empty space beside the pills. On the wall the root is `pointer-events: none` with `auto` on the ruler, the date pill (inert, but avoids accidental modal opens on the readout) and the Today pill. Check `elementFromPoint` beside the pills (card link), on the ruler (component) and on the Today pill (component).

## Accessibility and edge cases

- Very long flicks are capped at the range end with a bounce.
- Changing `range` while far out clamps the selection to the new range.
- Today changes at midnight while open: today's tick and the Today pill update on the next render (check the date each minute).
- Spacing 5 with fisheye 100: ticks may overlap visually near the marker; cap tick width at spacing − 1.

## Acceptance checklist

- [ ] Looks right in light and dark with each accent; the fisheye and accents match the gif's ruler
- [ ] Drag is 1:1; flicks carry with momentum and snap to a day; range ends bounce
- [ ] The date pill turns red while moving and grey when idle; the Today pill appears on the correct side and glides back
- [ ] Wheel and trackpad scrolling work and snap
- [ ] Every knob visibly changes it (range, spacing, fisheye, momentum, accent, format, month labels)
- [ ] `tick`, `settle`, `swipe` respect `sound` and `volume`
- [ ] Slider keyboard works (including T); reduced motion snaps instantly
- [ ] Demo flicks back and returns to today

## Decisions log

- Just the control, no phone frame. (User)
- Feel: momentum with snap to day, fisheye ticks, week and month accents, wheel and trackpad scroll. (User)
- No "+" button; it is only a date slider. (User)
- Idle: the date pill stays, turning grey when idle. (User)
- Sound: `tick` per day, `swipe` for Today. (User; `pop` dropped with the "+" button and `settle` added for landing)
- Knobs: range and tick spacing, fisheye and momentum, accent and format, month labels. (User)
- Play demo: flick back, press Today. (User)
- Decided by agent:
  - the slug `date-scrubber` and the tag Drag;
  - dragging right goes to earlier days;
  - the Today pill's side follows where today is;
  - only visible ticks are rendered;
  - `settle` on landing.
