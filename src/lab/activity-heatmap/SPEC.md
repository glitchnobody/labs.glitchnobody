# Activity heatmap

- **Slug:** `activity-heatmap` (URL `/activity-heatmap`)
- **Number:** 19 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/10.jpg` (a dark card with a contribution heatmap: columns of weeks, seven day rows, green cells in four or five levels, and month labels Feb to Jul above). Only the idea is used.

## Summary

A contribution heatmap that plays a note for every cell you pass. Sweep across it: each cell shows its day in a tooltip, the cells around it light up in a ripple, and busier days play higher notes.

## Look

**Card.** On `--fill-slab`, radius 16, padding 20, with a soft shadow in light mode and a `--pane-edge` hairline in dark. Width follows the grid: about 340 px at the defaults.

**Grid.** `weeks` columns (default 22) × 7 rows (Sunday to Saturday), each cell `cell` px (default 11) with `gap` px (default 3) between them. Columns run oldest (left) to newest (right), ending with the current week; days after today in the last column are left out.

**Levels.** `levels` (4 or 5, default 5) colours from the `accent`, as mixes with the card background:

| Level | Colour |
| ----- | ------ |
| 0 (no activity) | `color-mix(in srgb, var(--fill-on) 7%, var(--fill-slab))` |
| 1 | accent at 30% over `--fill-slab` |
| 2 | 50% |
| 3 | 72% |
| 4 | 100% (with 5 levels, level 4 is 100% and level 3 is 80%) |

With 4 levels the steps are 0, 35%, 65%, 100%. The brightest cells in the image glow slightly; level-top cells get a soft `box-shadow` glow in the accent at 40%.

**Accent** (`accent`): Green (`--ok`, default, the image), Pick (`--pick`), Danger (`--danger`, added by `hold-to-delete` if not built yet), Ink (`--fill-on`).

**Cell shape** (`shape`), drawn as SVG so every shape tiles the same grid:

| Shape | Drawing |
| ----- | ------- |
| Square | `rect`, radius 1.5 |
| Rounded (default, the image) | `rect`, radius 30% of the cell |
| Circle | `circle` |
| Diamond | a square rotated 45°, scaled to fit the cell |
| Heart | a heart path fitted to the cell box |
| Star | a five-point star path fitted to the cell box |
| Hexagon | a flat-topped hexagon fitted to the cell box |

**Labels** (`labels`):

- None.
- Months (default): month names in `--ink-3`, 11 px, above the column where each month starts (skipped if closer than 3 columns to the previous label).
- Months + days: also "Mon", "Wed", "Fri" in `--ink-4`, 10 px, to the left of their rows.

**Legend** (when `legend` is on): below the grid on the right, "Less", one sample cell of each level in the chosen shape, "More", in `--ink-4`, 11 px.

**Tooltip.** A small card on `--fill-on` with text in `--fill-slab`, 12 px: "**6 contributions** on Sat, Apr 12" ("No contributions" for level 0), with a 4 px pointer, above the hovered cell, flipping below in the top row and clamped inside the card.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the card (the dark hairline already exists; in light mode it adds one).

## Behaviour

- **Data.** One year of seeded counts (deterministic PRNG, weekdays busier than weekends, a few streaks and quiet weeks), mapped to levels by quantiles; `data` (an array of `{ date, count }`) overrides it.
- **Hover.** The hovered cell scales to 1.25 with a quick spring and gets a 1.5 px ring in `--fill-on`. The tooltip shows its date and count.
- **Ripple.** Cells within `ripple` cells (default 2.5, Euclidean distance on the grid) brighten: their colour mixes toward the accent's top level by `rippleStrength` × (1 − distance / ripple), and they scale up slightly (up to 1.08). The ripple follows the pointer smoothly (each cell eases its brightness over 120 ms), so sweeping leaves a short glowing wake that fades.
- **Notes.** Each time the hovered cell changes, `blip` plays pitched to the cell's level on a major pentatonic scale (level 0 → root, 1 → +2 semitones, 2 → +4, 3 → +7, 4 → +9; with 4 levels: 0, +2, +4, +7). Level 0 cells play the root at half volume. Sweeping across a busy row plays a little melody.
- **No click action.** Hover only (the user's choice); clicks fall through to the card link on the wall unless they land on a cell, where they do nothing.

## Interaction

- **Pointer.** Hover cells. The SVG uses one pointer listener and computes the cell from coordinates (no per-cell listeners).
- **Keyboard.** The grid is a `grid` role with each cell a `gridcell` labelled with its tooltip text, and roving tabindex: arrow keys move between cells (Up/Down change days, Left/Right weeks), Home/End go to the row's ends. The focused cell shows the hover ring, ripple, tooltip and plays its note.
- **Touch.** Pressing and dragging across cells behaves like hovering (`touch-action: none` on the grid while pressed is avoided: use `pan-y` so vertical scroll still works; horizontal drags sweep).
- **Reduced motion.** No scale or ripple motion; the hovered cell gets the ring and the tooltip only.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| weeks | Weeks | range | 12–26 | 22 | How many weeks are shown |
| cell | Cell (px) | range | 8–16 | 11 | Cell size |
| gap | Gap (px) | range | 1–6 | 3 | Space between cells |
| shape | Shape | select | Square, Rounded, Circle, Diamond, Heart, Star, Hexagon | Rounded | Cell shape |
| levels | Levels | select | 4, 5 | 5 | Number of colour levels |
| ripple | Ripple (cells) | range | 0–5, step 0.5 | 2.5 | How far the hover ripple spreads; 0 turns it off |
| rippleStrength | Ripple glow | range | 0–100 | 60 | How bright the ripple gets |
| labels | Labels | select | None, Months, Months + days | Months | Month and weekday labels |
| legend | Legend | toggle | | false | The Less → More legend |
| accent | Accent | select | Green, Pick, Danger, Ink | Green | Cell colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The hovered cell changes | `blip` | new | Soft marimba-like note | volume 0.45 (0.22 for level 0), pitch `2 ** (semitones / 12)` on the pentatonic map above | 1 per 35 ms |

New sound:

- **Name:** `blip`
- **ElevenLabs prompt:** "A single soft wooden marimba note, short and round, gentle mallet attack, clean pitched tone in the middle register, quick natural decay, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.7 · **loop:** false
- **Trim to:** about 220 ms with a natural decay (a pitched note, so check it is a single clear pitch; the pentatonic map assumes one)

## Dependencies

- None. SVG cells, one rAF loop for the ripple easing (stops when the ripple has faded).
- No icons.

## Play demo

Agreed with the user (hover only, so the demo sweeps two rows instead of clicking). About 5 seconds.

1. The cursor appears below the card on the left ([0.05, 1.1], instant).
2. It glides to the first cell of the Tuesday row (500 ms). The tooltip appears.
3. It sweeps right along the row to the last column (1600 ms, linear): the ripple follows, notes play a melody.
4. It drops two rows to Thursday (200 ms) and sweeps back left (1600 ms).
5. It glides away below the card (500 ms). The ripple fades.

## Card fit and hit areas

The card is a solid rounded rectangle; it is the component. Only cells react to hover; the card's padding, labels and legend are inert but part of the component (so clicking the padding does not open the modal). To keep the modal reachable, make the card's padding fall through: on the wall the card root is `pointer-events: none` with `auto` on the grid SVG only. Check `elementFromPoint` in the card padding (card link) and on a cell (component).

## Accessibility and edge cases

- The tooltip text does not rely on colour: it states the count.
- `cell` large with `weeks` 26 overflows the stage: on the wall the card scales to fit (transform from the centre).
- `ripple` 0: only the hovered cell reacts.
- Heart, Diamond and Star are smaller in area than squares; their hover scale is 1.35 to compensate.
- Dates use the browser's locale for month and weekday names; the grid always starts weeks on Sunday, as in the image.

## Acceptance checklist

- [ ] Looks right in light and dark with every accent; stroke harmless
- [ ] All seven shapes tile the grid cleanly; 4 and 5 levels map correctly
- [ ] Hover shows the ring and tooltip (flipping and clamping); the ripple follows and fades
- [ ] Sweeping plays pentatonic notes pitched by level
- [ ] Every knob visibly changes it (weeks, cell, gap, shape, levels, ripple, glow, labels, legend, accent)
- [ ] `blip` respects `sound` and `volume` and is rate-limited
- [ ] Grid keyboard navigation works and plays notes; reduced motion removes the ripple motion
- [ ] Hit areas: card padding falls through to the card link
- [ ] Demo sweeps two rows

## Decisions log

- Behaviour: hover shows a tooltip and a ripple; no click action. (User)
- Colour: accent knob with green default, levels mixed from tokens. (User)
- Sound: a new `blip` note, pitched by level on a pentatonic scale. (User)
- Play demo: sweep two rows (changed from bumping cells, since there is no click action). (User)
- Knobs: weeks, cell size, gap, shape (seven options: Square, Rounded, Circle, Diamond, Heart, Star, Hexagon), levels, ripple radius and strength, labels, legend, accent. (User)
- Decided by agent:
  - the slug `activity-heatmap` and the tag Hover;
  - month and weekday labels merged into one select to stay at 12 knobs;
  - the seeded data shape (busier weekdays, streaks);
  - card padding falls through on the wall, only the grid reacts;
  - a larger hover scale for Heart, Diamond and Star.
