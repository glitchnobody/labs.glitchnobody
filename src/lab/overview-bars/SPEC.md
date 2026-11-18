# Overview bars

- **Slug:** `overview-bars` (URL `/overview-bars`)
- **Number:** 29 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/16.jpg` (an "Overview" card: "Avg Per month 1,860/3K" with a "50,2% ▲" badge, a "Last Month" dropdown, and a row of hatched bars with a lighter target portion above each; the hovered August bar is dark with a pin dot and a tooltip "August 2025 · 120 pcs"). Only the layout is used.

## Summary

A bar chart card with striped bars. Hover a bar to darken it and pin a tooltip on top; switch the range and the bars re-flow into the new period.

## Look

**Card.** 340 × 250 px, radius 16, on `--fill-slab`, padding 18, soft shadow in light mode, `--pane-edge` hairline in dark. One surface (no inverted bands).

**Header.**

- "Overview" in `--fill-on`, 17 px weight 600.
- The range dropdown at the top right: a button on `color-mix(in srgb, var(--fill-on) 4%, var(--fill-slab))` with a 1 px `--pane-edge` border, radius 10, "Last month" 13 px and `ph:caret-down-bold`.
- "Avg per month" in `--ink-3`, 12 px, then "1,860/3K" in `--fill-on`, 22 px weight 600, tabular figures, and the badge "50.2% ▲" in `--ok` on `color-mix(in srgb, var(--ok) 12%, var(--fill-slab))`, 11 px weight 600, radius 6 (or `--danger` with ▼ when negative).

**Chart.** About 110 px tall, with faint dashed horizontal grid lines (`--pane-edge`, 4 lines). One bar per period, filling the width with `gap` px between (default 10), corner radius `radius` (default 8):

- **Target portion:** the full bar height up to the period's target, in `color-mix(in srgb, var(--fill-on) 4%, var(--fill-slab))` with a 1 px `--pane-edge` edge (the image's light cap).
- **Actual portion:** from the bottom to the actual value, in `color-mix(in srgb, var(--fill-on) 8%, var(--fill-slab))`, with diagonal stripes when `hatch` is on (a `repeating-linear-gradient` at `hatchAngle` degrees, 1 px lines in `color-mix(in srgb, var(--fill-on) 14%, transparent)` every 9 px).
- **Labels** under the bars: period names in `--ink-3`, 12 px ("Apr", "W1", …), thinned to every other one if they would collide.

**Active bar** (hovered): the actual portion turns the accent (`accent`: Ink `--fill-on` default, the image's near-black; Pick; Ok) with the stripes kept in a lighter mix, the target portion's edge turns the accent, and a pin dot (8 px ring, 2 px accent stroke, `--fill-slab` centre) sits on the bar's top.

**Tooltip.** Above the pin: a small card on `--fill-on` with `--fill-slab` text, radius 10, padding 8 × 12, "August 2025" 12 px and "120 pcs" 14 px weight 700, with a pointer. It flips sideways near the card's edges.

**Dropdown menu.** A popover under the button on `--fill-slab` with a hairline and shadow, radius 10: "Last month", "6 months", "Year", the current with `ph:check-bold`.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the card (adds one in light mode).

## Behaviour

- **Data.** Seeded actuals and targets for the last 12 months and the last 4 weeks (deterministic PRNG). The headline shows the average actual over the shown period against the average target ("1,860/3K"), and the badge the change against the previous period of the same length.
- **Ranges.**
  - Last month: 4 weekly bars (W1–W4).
  - 6 months: the last 6 months.
  - Year (default, the image's look): the last 12 months, all 12 bars, narrower, with labels thinned.
- **Hover.** Hovering anywhere in a bar's column (full chart height) activates it: the colour change eases in 120 ms, the pin pops in (scale from 0.6), and the tooltip slides to the bar (it is one element moving between bars with a 140 ms ease, not a new tooltip per bar). `tick` as the active bar changes. Leaving the chart hides the pin and tooltip.
- **Switch range.** Choosing a range in the dropdown re-flows the bars: bars that stay keep their identity and move and resize; bars that leave shrink to 0 height and fade; new bars grow from 0, staggered 25 ms left to right; widths re-flow over 350 ms. The headline numbers roll (per-digit odometer). `shuffle` plays.
- **Dropdown.** Opens with a 140 ms scale-and-fade, `expand`; closes on pick, Escape or outside press, `collapse`.

## Interaction

- **Pointer.** Hover bars; press the dropdown and its items.
- **Keyboard.** The chart is focusable (`role="img"` with a summary label); Left/Right move the active bar (showing the pin and tooltip), Escape clears; a live region reads "August 2025, 120 pieces, target 150". The dropdown is a `button` with `aria-haspopup="listbox"` and a listbox menu with arrows, Enter and Escape.
- **Touch.** Tapping a bar activates it; tapping outside the chart clears.
- **Reduced motion.** No growth or re-flow animation (bars swap with a 120 ms fade), the tooltip jumps, numbers swap.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| hatch | Stripes | toggle | | true | Diagonal stripes on the bars |
| hatchAngle | Stripe angle (°) | range | 0–90, step 15 | 60 | Stripe direction |
| radius | Corner (px) | range | 0–14 | 8 | Bar corner radius |
| gap | Gap (px) | range | 2–20 | 10 | Space between bars |
| accent | Active bar | select | Ink, Pick, Ok | Ink | Hovered bar colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `range` (default "Year"), `unit` (default "pcs"), `data` and `onRangeChange`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The active bar changes | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.85 + 0.4 × value / max | 1 per 30 ms |
| Dropdown opens / closes | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.4 | none |
| Bars re-flow on a range change | `shuffle` | reuse | Soft card riffle | volume 0.5 | 1 per 200 ms |

No new sounds.

## Dependencies

- None. Bars are plain elements with CSS transitions (height, width, transform) and per-bar delays; the stripes are a CSS gradient.
- `@iconify/react` for the caret and check (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user (hover only). About 4 seconds.

1. The cursor appears below the card on the left ([0.05, 1.05], instant).
2. It glides to the first bar's column ([0.08, 0.7], 500 ms): it darkens, the pin and tooltip appear.
3. It sweeps right across all the bars ([0.94, 0.68], 2200 ms, linear): the active bar and tooltip follow with ticks.
4. It glides away below the card (500 ms).

## Card fit and hit areas

The card is a solid rounded rectangle; it is the component. To keep the modal reachable from the card's padding, on the wall the card root is `pointer-events: none` with `auto` on the chart area and the dropdown. Check `elementFromPoint` in the header's empty middle and the card padding (card link), and on a bar column and the dropdown (component).

## Accessibility and edge cases

- Colour is not the only cue for the active bar: the pin and tooltip mark it.
- A bar above its target: the actual portion overflows the target outline by its excess, drawn in the actual colour (no clipping).
- 12 narrow bars at a large gap: the gap is capped so bars stay at least 8 px wide.
- Number formatting with `Intl.NumberFormat` (compact for the target, "3K").

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines the card
- [ ] Hover darkens the bar, pops the pin, slides one tooltip between bars, flipping at edges
- [ ] The dropdown switches between Last month, 6 months and Year with bars re-flowing and numbers rolling
- [ ] Every knob visibly changes it (stripes, angle, corner, gap, active bar)
- [ ] `tick`, `expand`, `collapse`, `shuffle` respect `sound` and `volume`
- [ ] Keyboard bar stepping and listbox work; reduced motion swaps with fades
- [ ] Demo sweeps across the bars

## Decisions log

- Angle: hover tooltip and a working range dropdown. (User)
- Ranges: Last month (4 weekly bars), 6 months, Year. (User)
- Knobs: stripes and angle, corner and gap, active bar colour. (User)
- Sound: `tick`, `expand`/`collapse`, `shuffle`. (User)
- Play demo: hover only. (User)
- Decided by agent:
  - the slug `overview-bars` and the tag Hover;
  - the target portions are always shown (the image's look; the toggle was not picked);
  - Year is the default range, with all 12 months shown;
  - one tooltip that slides between bars;
  - the full column height is the hover target.
