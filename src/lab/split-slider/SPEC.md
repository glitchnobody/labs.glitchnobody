# Split slider

- **Slug:** `split-slider` (URL `/split-slider`)
- **Number:** 53 / 60
- **Tag:** Slide
- **Status:** spec
- **Design reference:** `~/Downloads/inso/41.mp4` (a split slider on black, "COFFEE 71% | 29% MILK": two bars sharing one track with a white divider handle; dragging moves the split and updates both percentages; when a side gets too thin its label hops above the bar and the bars slim down). Only the idea is used.

## Summary

One track split between two things. Drag the divider to change the mix: the percentages roll, and when a side gets too thin its label hops up out of the way.

## Look

**Track.** About 300 px wide. Normal height 34 px; slim height 10 px (when a label has hopped). Two bars, left and right of the divider, each radius 6, with a 4 px gap around the divider.

- **Left bar:** the `color` mix: `color-mix(in srgb, var(--accent) 22%, var(--fill-slab))` with its label and value in the accent (Danger `--danger` default, the video's coffee red-brown; Pick; Ok; Ink `--fill-on`).
- **Right bar:** `color-mix(in srgb, var(--fill-on) 14%, var(--fill-slab))` with its label and value in `--fill-on` / `--ink-3`.
- **Labels** inside each bar, 11 px, letter spacing 0.04 em: the left one at its left ("COFFEE **71%**"), the right one at its right ("**29%** MILK"); values weight 700, tabular. With `mono` on (default, the video's look), labels are uppercase in `ui-monospace, "JetBrains Mono", Menlo, monospace`; off, they use `var(--font-ui)` in sentence case.
- **Divider:** a 3 px wide, 30 px tall white bar (`#fff`, with a 1 px dark shadow so it reads on light backgrounds) with a small grip mark; it overhangs the slim track.

**Hop.** When a side is under `threshold` % (default 18), the track slims to 10 px and **both** labels move above the bar (left label at the left, right label at the right), as in the video; when both sides are above the threshold again, the track grows back and the labels drop back inside.

**Light and dark.** Tokens only (the white divider keeps its shadow edge in light mode).

**Stroke on.** 1 px `--pane-edge` around each bar.

## Behaviour

- **Drag.** Pressing the divider (or anywhere on the track, which jumps the divider there) and dragging moves the split from 0 to 100% in whole percents; both bars resize directly. The values roll per digit (odometer, 160 ms) as they change. `tick` every 5% with pitch rising with the left share.
- **Hop.** Crossing the threshold animates the track height (200 ms, `linear()` spring) and moves the labels with a FLIP slide from inside the bars to above them (or back). `pop` plays.
- **Release.** `settle`.
- Reports `onChange(leftPercent)`.

## Interaction

- **Pointer.** Drag the divider or press the track. Pointer capture; `touch-action: none` and `user-select: none` on the track.
- **Keyboard.** The divider is a `slider` labelled "Coffee and milk split", `aria-valuetext` "Coffee 71 percent, milk 29 percent"; Left/Right ±1, Shift ±10, Home/End.
- **Touch.** Same.
- **Reduced motion.** No roll or spring: values swap; the hop changes height and label position instantly.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| left | Left label | text | up to 12 chars | Coffee | Left side's name |
| right | Right label | text | up to 12 chars | Milk | Right side's name |
| split | Split (%) | range | 0–100 | 71 | Starting share of the left side |
| threshold | Hop below (%) | range | 10–30 | 18 | When labels hop above the bar |
| color | Left colour | select | Danger, Pick, Ok, Ink | Danger | Left bar colour |
| mono | Mono labels | toggle | | true | Uppercase monospace labels |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The split crosses a 5% step | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.85 + 0.4 × left / 100 | 1 per 30 ms |
| Labels hop up or drop back | `pop` | reuse | Bubbly pop | volume 0.4 (pitch 1.15 up, 0.9 down) | 1 per 150 ms |
| Release | `settle` | reuse | Soft lock-in click | volume 0.45 | none |

No new sounds.

## Dependencies

- None. Pointer events, CSS transitions, a per-digit roll, FLIP for the label hop.
- No icons.

## Play demo

Agreed with the user. About 6 seconds; ends at 50%.

1. The cursor appears below the track ([0.6, 2.2], instant).
2. It glides to the divider at 71% (500 ms) and presses.
3. It drags left to 8% (900 ms): values roll with ticks; below 18% the labels hop up and the track slims; `pop`.
4. It drags right to 86% (1200 ms): the labels drop back, then hop up again past 82%.
5. It drags back to 50% (600 ms): the labels drop back. It releases; `settle`.
6. It glides away (500 ms).

## Card fit and hit areas

The root spans the labels' hop space above the track. On the wall the root is `pointer-events: none` with `auto` on the track and the divider. Check `elementFromPoint` above the track where the hopped labels go and beside it (card link), and on both bars and the divider (component).

## Accessibility and edge cases

- At 0% or 100%, the empty side's bar shrinks to a 4 px sliver so the divider still has two sides.
- Long labels truncate with an ellipsis inside the bar; above the bar they show in full.

## Acceptance checklist

- [ ] Looks right in light and dark, mono and site font; stroke outlines the bars
- [ ] Dragging resizes both bars with rolling values; pressing the track jumps
- [ ] Labels hop above and the track slims below the threshold, and drop back above it
- [ ] Every knob visibly changes it (labels, split, hop threshold, left colour, mono)
- [ ] `tick`, `pop`, `settle` respect `sound` and `volume`
- [ ] Slider keyboard works; reduced motion swaps instantly
- [ ] Demo thins coffee, thins milk, returns to 50%

## Decisions log

- Content: custom labels (default Coffee and Milk). (User)
- Extras: labels hop above when thin, digit roll. (User)
- Sound: `tick` per 5%, `pop` on hop (plus `settle` on release). (User)
- Play demo: thin the left, thin the right, back to the middle. (User)
- Knobs: labels, start split, hop threshold, left colour, mono labels. (User)
- Both labels hop together, as in the video. (User, confirmed 2026-11-17)
- White divider in both themes with a shadow edge, a deliberate exception to tokens-only. (User, confirmed 2026-11-17)
- A 4 px sliver at 0% and 100%. (User, confirmed 2026-11-17)
- Decided by agent: the slug `split-slider` and the tag Slide.
