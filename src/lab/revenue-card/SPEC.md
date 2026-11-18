# Revenue card

- **Slug:** `revenue-card` (URL `/revenue-card`)
- **Number:** 13 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/04.jpg` (four dark revenue cards with the same layout: "Revenue", "$20,560", "+4.2%", "vs. $19,432 last", a chart of this period against last period with a "$345" tooltip, and a "View More / Download" footer; the four differ only in chart style: jagged with area, step, smooth, jagged lines). Built as one card whose chart style is a knob; only the layout is used.

## Summary

A revenue card with a chart of this period against the last. Move across the chart to scrub it: a dot follows the line, the tooltip shows the day, and the total rolls to the running total up to that day.

## Look

**Card.** 300 × 300 px, radius 16, on `--fill-slab`, padding 18 (20 in the footer), soft shadow in light mode, `--pane-edge` hairline in dark.

**Header.**

- "Revenue" in `--ink-3`, 12 px weight 500. While scrubbing it changes to "Revenue to Nov 12".
- The total "$20,560" in `--fill-on`, 24 px weight 600, tabular figures.
- The change "↗ 4.2%" in `--ok` with `ph:trend-up-bold` (or `--danger` with `ph:trend-down-bold` when negative), 12 px weight 600.
- "vs. $19,432 last" in `--ink-4`, 12 px.

**Chart.** Full card width (bleeding to the card edges, as in the image), about 110 px tall:

- **This period:** a line in the `accent` colour, `stroke` px wide, round joins. With `area` on, a vertical gradient below it from the accent at 28% to 0%.
- **Last period** (when `compare` is on): a second line in a muted companion colour (the accent mixed 45% with `--ink-4`), 1 px thinner, no area.
- **Dots** (when `dots` is on): 3 px dots on every point of the main line.
- Curve shape from `curve`: Linear (straight segments), Step (horizontal-then-vertical, `step-after`), Smooth (monotone cubic, never overshooting the data).

**Accents** (`accent`), each readable on both fills:

| Accent | Colour |
| ------ | ------ |
| Pink (default, the first card) | `#ff5c8a` |
| Green | `--ok` |
| Blue | `--pick` |
| Violet | `#8b7bff` |

Pink and Violet are component-local custom properties (`--rc-accent`), the only fixed colours, picked to read on both `--fill-slab` values; the user approved this exception to the token rule.

**Tooltip.** A small pill on `--fill-on` with text in `--fill-slab`, 12 px weight 600, radius 6, with a 4 px pointer below, sitting above the hovered point (the image's black "$345" bubble). Hidden when not scrubbing.

**Scrub marker.** A 1 px dashed vertical line in `--pane-edge` through the hovered point, and a 7 px dot in the accent with a 2 px `--fill-slab` ring.

**Footer.** A 1 px `--pane-edge` divider, then "View More" with `ph:caret-right-bold` on the left and `ph:download-simple-bold` with "Download" on the right, 13 px weight 500 in `--fill-on`. Both are buttons with hover backgrounds (`color-mix(in srgb, var(--fill-on) 6%, transparent)`) and no other action (they call optional `onViewMore` and `onDownload` props).

**Light and dark.** Tokens only (apart from the two accent colours above).

**Stroke on.** 1 px `--pane-edge` around the card.

## Behaviour

- **Data.** 30 daily points for this period and 30 for last, generated from a fixed seed (a small deterministic PRNG with a gentle upward trend and noise), scaled so this period sums to $20,560 and last to $19,432, matching the image. `points` resamples to 12–48 points across the same 30 days. Props `data` and `previous` (arrays of numbers) override them.
- **Scrub.** Pointer over the chart: the marker snaps to the nearest point by x (no easing on the snap, a 60 ms ease on the dot's y so steps glide). The tooltip shows that point's value ("$345") and follows, flipping below the point when there is no room above and clamping inside the card horizontally.
- **Running total.** While scrubbing, the big number rolls (per-digit odometer, 220 ms) to the running total from day 1 to the hovered day, the label says "Revenue to <date>", and "vs. $X last" and the percentage update to last period's running total for the same day. Leaving the chart rolls everything back to the full totals.
- **Draw.** Changing `curve`, `points` or `accent` animates the path: the old and new paths cross-fade over 200 ms (paths with different point counts cannot morph cleanly).

## Interaction

- **Pointer.** Hover or drag across the chart to scrub. On touch, pressing and dragging scrubs; lifting the finger ends the scrub. `touch-action: pan-y` on the chart so vertical page scroll still works.
- **Keyboard.** The chart is focusable (`role="img"` with a label summarising the data, plus `aria-describedby` a live region). With focus, Left and Right step the marker point by point, Home and End jump to the ends, Escape clears it; the live region reads "Nov 12, $345, running total $9,880".
- **Reduced motion.** The number swaps without rolling; the dot moves without easing; style changes swap without cross-fade.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| curve | Curve | select | Linear, Step, Smooth | Linear | Line shape |
| area | Area | toggle | | true | Gradient fill under the main line |
| compare | Last period | toggle | | true | The faint last-period line |
| accent | Accent | select | Pink, Green, Blue, Violet | Pink | Line, area, dot colour |
| points | Points | range | 12–48, step 6 | 30 | How many data points are drawn |
| stroke | Line (px) | range | 1–3, step 0.5 | 2 | Main line width |
| dots | Dots | toggle | | false | Dots on every point |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

The four cards in the image are: Linear + area + Pink; Step + no area + Violet (with a muted orange compare line in the image, here the accent-mixed companion); Smooth + no area + Green; Linear + no area + Blue.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The scrub marker moves to another point | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.8 + 0.5 × (value − min) / (max − min) | 1 per 30 ms |
| Leaving the chart (totals roll back) | `settle` | reuse | Soft lock-in click | volume 0.4 | 1 per 400 ms |

No new sounds.

## Dependencies

- None. The chart is hand-written SVG (path builders for linear, step and monotone cubic, about 40 lines); the odometer is a small per-digit column.
- `@iconify/react` for the trend, caret and download icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 5 seconds.

1. The cursor appears below the card on the left, over the footer area's side ([0.05, 1.05], instant).
2. It glides into the chart near the left edge ([0.08, 0.6], 500 ms): the marker, dot and tooltip appear; the total rolls to day 1's running total.
3. It scrubs slowly to the right edge ([0.94, 0.55], 2800 ms, linear): the dot follows the line, the tooltip updates, ticks play with pitch following the value, and the total climbs.
4. It holds 400 ms.
5. It glides away off the card (500 ms): the marker disappears, totals roll back, `settle` plays.

## Card fit and hit areas

The card is a solid rounded rectangle; the whole card catches the pointer, which is right (it is one surface). Check `elementFromPoint` just outside each rounded corner (card link) and inside. About 300 × 300 px, fits the stage at natural size.

## Accessibility and edge cases

- Colour is not the only cue: the last-period line is thinner and muted, and the live region reads both totals.
- Negative change (custom data): the percentage turns `--danger` with the down icon.
- `points` 12: the scrub snaps across fewer, wider steps; ticks play less often.
- Very small chart range (flat data): the y-scale pads ±10% so the line is not stuck to an edge.
- Currency is fixed to USD formatting via `Intl.NumberFormat` (a `currency` prop exists but is not a knob).

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the card
- [ ] All three curves draw correctly; Smooth never overshoots; area and compare toggle
- [ ] Scrubbing snaps the marker, moves the tooltip (flipping and clamping at edges) and rolls the running total; leaving rolls back
- [ ] Every knob visibly changes it (curve, area, last period, accent, points, line, dots)
- [ ] `tick` while scrubbing and `settle` on leave respect `sound` and `volume`
- [ ] Keyboard stepping and the live region work; reduced motion removes rolling
- [ ] Demo scrubs left to right and leaves, ending on the full totals

## Decisions log

- One card with a chart-style knob, not four components. (User)
- Behaviour: scrub tooltip only (no draw-in, range tabs or download action). (User)
- Sound: reuse `tick` and `settle`. (User)
- Play demo: scrub across and leave. (User)
- Knobs: curve, area, last period, accent, points, line width, dots. (User)
- Theme: tokens both ways; Pink and Violet as fixed accent colours approved. (User)
- While scrubbing, the big number shows the running total to that day. (User, confirmed)
- Decided by agent:
  - the slug `revenue-card` and the tag Hover;
  - the seeded data matching the image's totals;
  - the last-period line uses a muted mix of the accent rather than the image's separate colours;
  - cross-fade rather than morph when the curve or point count changes;
  - View More and Download are buttons with no built-in action.
