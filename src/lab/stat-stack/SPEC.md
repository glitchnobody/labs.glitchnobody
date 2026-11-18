# Stat stack

- **Slug:** `stat-stack` (URL `/stat-stack`)
- **Number:** 18 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/09.jpg` (two dark stat tiles stacked: "Impressions 117K +10%" with a line chart and a tooltip "Dec 6 · 12,947 Impressions", and "Engagements 12.8K −5%" with a bar chart whose bars have bright caps; the hovered tile has a bright ring; each says "Period: 28D"). Only the layout is used. Differs from `revenue-card` (#13) by linking the scrub across tiles and switching periods.

## Summary

Stacked stat tiles that share one timeline. Scrub any chart and a date marker moves through every tile at once; press the period to switch between 7, 28 and 90 days.

## Look

**Stack.** `tiles` tiles (default 2) in a column, 10 px apart, each 340 × 120 px (Regular) or 340 × 92 px (Compact), radius `radius` (default 12), on `--fill-slab` with a 1 px `--pane-edge` border and a soft shadow in light mode.

**Tile.** Two halves:

- **Left (stats),** padding 16: the metric name in `--ink-3`, 13 px; the value in `--fill-on`, 20 px weight 500, tabular figures, with the change next to it (`+10%` in `--ok`, `−5%` in `--danger`), 13 px; and at the bottom "Period: 28D" in `--ink-4`, 12 px, which is a button.
- **Right (chart),** an inset panel taking 55% of the tile's width, inset 6 px, radius `radius − 4`, on `color-mix(in srgb, var(--fill-on) 5%, var(--fill-slab))` with a 1 px `--pane-edge` border.

**Tiles** (the first `tiles` are shown):

| Tile | Chart | Default value | Change |
| ---- | ----- | ------------- | ------ |
| Impressions | Line, 1.5 px `--fill-on`, with a fill below in `color-mix(in srgb, var(--fill-on) 8%, transparent)` | 117K | +10% |
| Engagements | Bars in `color-mix(in srgb, var(--fill-on) 14%, transparent)`, 2 px gaps, each with a 2 px cap in `--fill-on` when `caps` is on | 12.8K | −5% |
| Clicks | Area, smooth, the same colours as Impressions but filled at 14% | 4.1K | +3% |

**Focus ring.** With `ring` on, the hovered or focused tile gets a 1.5 px `--fill-on` ring with 3 px offset (the image's bright outline), fading in over 120 ms.

**Marker and tooltip.** A 1 px dashed vertical line in `--ink-3` through each chart at the scrubbed day, a 6 px dot on the line or a brightened bar, and a tooltip card (on `--fill-on`, text in `--fill-slab`; date in 11 px, value 13 px weight 700, metric 11 px at 70%) next to the dot, as in the image. The tooltip appears in the tile under the pointer; with `linked` on, the other tiles show the marker and a smaller tooltip (value only).

**Light and dark.** Tokens only.

**Stroke on.** The tiles already have a hairline; Stroke on darkens it to `--ink-4` (subtle, harmless).

## Behaviour

- **Data.** Each metric has 90 days of seeded data (deterministic PRNG with a trend). Periods show the last 7, 28 or 90 days: lines and areas use daily points; bars group days (7D: 7 daily bars; 28D: 14 two-day bars; 90D: 15 six-day bars). Values and changes are computed from the data (totals over the period and change vs the previous period of the same length); the defaults land near the image's numbers at 28D.
- **Scrub.** Pointer over any chart: the marker snaps to the nearest day (or bar) by x. With `linked` on, every tile's marker moves to the same day; with it off, only the hovered tile's. The tooltip flips to the left of the dot near the right edge. `tick` plays when the day changes. Leaving the charts hides the markers.
- **Period.** Pressing any tile's "Period" label cycles 7D → 28D → 90D → 7D for all tiles together. Lines and areas morph: the old and new series are resampled to the same 64 x-positions and their y values tween over `morph` ms (ease-out). Bars tween heights; bars that appear grow from 0, bars that leave shrink to 0 and the widths re-flow. Values roll (per-digit odometer). `swipe` plays.
- **Ring.** Follows hover and keyboard focus.

## Interaction

- **Pointer.** Hover or drag across a chart to scrub; press "Period" to cycle.
- **Keyboard.** Each chart is focusable (`role="img"` with a summary label and a live region). Left/Right step the shared marker, Home/End jump, Escape clears; the live region reads "Dec 6: Impressions 12,947, Engagements 1,204". "Period" is a `button` labelled "Period 28 days, change".
- **Touch.** Press and drag on a chart scrubs (`touch-action: pan-y`); tap Period to cycle.
- **Reduced motion.** No morph or rolling: data swaps with a 120 ms cross-fade.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| tiles | Tiles | range | 2–3 | 2 | How many tiles (the third is Clicks) |
| caps | Bar caps | toggle | | true | Bright caps on the bars |
| linked | Linked scrub | toggle | | true | One marker moves through every tile |
| ring | Focus ring | toggle | | true | The bright ring on the hovered tile |
| period | Period | select | 7D, 28D, 90D | 28D | Starting period |
| morph | Morph (ms) | range | 0–900, step 50 | 450 | How long the period change morph takes |
| density | Density | select | Regular, Compact | Regular | Tile height |
| radius | Corner (px) | range | 4–20 | 12 | Tile corner radius |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The marker moves to another day | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.85 + 0.4 × (hovered value − min) / (max − min) | 1 per 30 ms |
| The period changes | `swipe` | reuse | Quick paper swish | volume 0.5 | 1 per 200 ms |

No new sounds.

## Dependencies

- None. Hand-written SVG for the line, area and bars; morphs in rAF; the odometer as small digit columns.
- No icons.

## Play demo

Agreed with the user. About 6 seconds; ends on 90D (a fine resting state).

1. The cursor appears to the right of the top tile ([1.05, 0.2], instant).
2. It glides into the Impressions chart's left side ([0.5, 0.25], 500 ms). Markers appear in both tiles.
3. It scrubs right across the chart ([0.95, 0.22], 1800 ms): both markers move together, ticks play, the top tooltip updates.
4. It glides to the top tile's "Period: 28D" ([0.12, 0.4], 600 ms) and presses. Both charts morph to 90D, the values roll; `swipe` plays.
5. It waits 900 ms and glides away (500 ms).

## Card fit and hit areas

The gap between tiles must fall through to the card link. On the wall the root column is `pointer-events: none` with `auto` on each tile. Check `elementFromPoint` in the 10 px gap between tiles (card link), on a tile's stats half (component, no action apart from Period) and on a chart. Two tiles are about 340 × 250 px; three tiles (about 380 px tall) scale to fit the stage.

## Accessibility and edge cases

- Change colour is backed by the sign (+/−) for colour-blind readers.
- `linked` off: other tiles show no marker; keyboard stepping moves only the focused chart's marker.
- Switching period mid-scrub: markers re-snap to the nearest day in the new period.
- `morph` 0: data swaps instantly.
- Number formatting via `Intl.NumberFormat` with `notation: "compact"`.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke harmless
- [ ] Scrubbing moves a shared marker through all tiles (linked) or only one (unlinked); the tooltip flips at edges
- [ ] Period cycles for all tiles with morphing lines and bars and rolling values
- [ ] The focus ring follows hover and focus
- [ ] Every knob visibly changes it (tiles, caps, linked, ring, period, morph, density, corner)
- [ ] `tick` and `swipe` respect `sound` and `volume`
- [ ] Keyboard stepping and the live region work; reduced motion cross-fades
- [ ] Demo scrubs the top chart and switches to 90D

## Decisions log

- Angle: a stack of tiles with a linked scrub, to differ from `revenue-card`. (User)
- Period: press "Period" to cycle 7D, 28D, 90D. (User)
- Sound: `tick` and `swipe`. (User)
- Play demo: scrub the top chart, switch period. (User)
- Knobs: tiles and bar caps, linked scrub and ring, starting period and morph speed, density and corner. (User)
- Theme: tokens both ways. (User)
- Decided by agent:
  - the slug `stat-stack` and the tag Hover;
  - the third tile, Clicks, as a smooth area;
  - bar grouping per period;
  - resampling to 64 points so lines morph between periods;
  - other tiles show a smaller value-only tooltip when linked;
  - Period changes all tiles together.
