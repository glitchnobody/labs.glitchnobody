# Dropdown

- **Slug:** `dropdown` (URL `/dropdown`)
- **Number:** 57 / 60
- **Tag:** Select
- **Status:** spec
- **Design reference:** none (described by the user as "dropdown"; design proposed by the agent).

## Summary

A select that grows out of its own trigger. Open it, filter by typing, glide over grouped options and pick one (or several), and the trigger rolls to the new value.

## Look

**Trigger (closed).** A pill-ish button `width` px wide (default 220), 40 px tall, radius `radius` (default 12): `--fill-slab` with a 1 px `color-mix(in srgb, var(--fill-on) 12%, transparent)` edge and a small shadow. Left: the selected option's icon (16 px, `--ink-3`) and label (14 px, `var(--font-ui)`, `--fill-on`). Right: `ph:caret-down-bold` 12 px in `--ink-3`, which turns 180° when open. A small `--ink-3` caption above the trigger: "Sort by" (11 px), from `label`.

**Open: one surface.** The trigger itself stretches downward into the panel (same background, edge and radius; its height animates). It is never a second floating panel.

- **Top row:** with `search` on, the trigger row becomes a search field in place (icon swaps to `ph:magnifying-glass`, the label becomes the placeholder "Search…", caret at the start); with it off, the trigger row stays as it is.
- **A 1 px divider**, then the list (max `rows` visible, default 7; more scroll).
- **Groups** (`groups` on): small 10 px uppercase `--ink-4` headers ("Date", "Popularity", "Name", "Price") with 6 px space and a hairline between groups. Off: one flat list.
- **Rows:** 34 px, radius 8, 8 px inset from the panel edge: icon 16 px `--ink-3`, label 13.5 px `--fill-on`, and on the right a `ph:check-bold` 13 px in `--pick` on the selected row. With `multi` on, the right side is instead a 16 px checkbox (rounded 4 px, `--pick` fill + white check when on).
- **Highlight:** one pill (`color-mix(in srgb, var(--fill-on) 7%, transparent)`) that **slides** to the row under the pointer or the keyboard cursor (transform, 140 ms ease-out), instead of each row lighting up.
- **No results:** "No matches" in `--ink-4`, centred.

**Options (default).**

| Group | Label | Icon |
| ----- | ----- | ---- |
| Date | Newest | `ph:clock-counter-clockwise` |
| Date | Oldest | `ph:clock-clockwise` |
| Popularity | Most popular | `ph:fire` |
| Popularity | Most viewed | `ph:eye` |
| Name | A to Z | `ph:sort-ascending` |
| Name | Z to A | `ph:sort-descending` |
| Price | Low to high | `ph:trend-up` |
| Price | High to low | `ph:trend-down` |

Default selection: Newest. Options are a prop (`options: { label, icon?, group? }[]`); the knobs don't edit them.

**Multi trigger text.** "Newest" for one; "Newest +2" for three (the "+2" is a small `--ink-3` count chip); "None" in `--ink-4` for zero.

**Light and dark.** Tokens only.

**Stroke on.** The trigger/panel edge becomes `--pane-edge`.

## Behaviour

- **Open** (click, Enter, Space, Down): the surface grows from 40 px to its full height on a spring (`speed` knob: Snappy 220 ms, Smooth 320 ms, Slow 480 ms; `linear()` spring with a small overshoot); rows fade and drop 4 px in, staggered 18 ms. The highlight starts on the selected row. `expand`.
- **Close** (pick in single mode, Escape, click outside, Tab away): the surface shrinks back to 40 px, rows fade first. `collapse`.
- **Pick (single).** The check jumps to the row (scale 0.6 → 1), the panel closes, and the trigger's label and icon **roll** to the new value (old slides up and out, new slides up in, 200 ms). `settle`.
- **Pick (multi).** The checkbox toggles (check draws in, 120 ms), the panel stays open, and the trigger text updates live. `tick` (higher pitch on, lower off).
- **Search.** Typing filters rows by label (case-insensitive substring; matching letters in weight 600); group headers with no rows left hide; the panel height animates to fit. The highlight goes to the first match. Clearing restores the list. Search clears on close.
- Reports `onChange(value | values[])`.

## Interaction

- **Pointer.** Click the trigger; hover moves the highlight; click a row to pick.
- **Keyboard.** WAI-ARIA combobox pattern: the trigger (or search input) is `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant`; the list is a `listbox` (`aria-multiselectable` in multi mode) with `option`s in `group`s labelled by their headers. Up/Down move the highlight (wrapping), Home/End, Enter picks, Escape closes, typing searches (or, with `search` off, jumps to the first option starting with that letter).
- **Touch.** Same; hover highlight follows the touch on press.
- **Reduced motion.** No spring, stagger or roll: the panel appears and disappears, the label swaps.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| multi | Multi-select | toggle | | false | Checkboxes and "+n" trigger text |
| search | Search | toggle | | true | The trigger row becomes a filter field when open |
| groups | Groups | toggle | | true | Section headers and dividers |
| icons | Icons | toggle | | true | Icons on rows and trigger |
| width | Width (px) | range | 160–300 | 220 | Trigger and panel width |
| rows | Visible rows | range | 4–10 | 7 | Rows shown before the list scrolls |
| radius | Corner (px) | range | 4–20 | 12 | Trigger and panel corners |
| speed | Speed | select | Snappy, Smooth, Slow | Smooth | Open and close spring |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Open | `expand` | reuse | Soft rising whoosh | volume 0.4 | none |
| Close | `collapse` | reuse | Soft falling whoosh | volume 0.35 | none |
| Highlight moves to a new row | `tick` | reuse | Tiny dry tick | volume 0.15, pitch 1.1 | 1 per 50 ms |
| Pick (single) | `settle` | reuse | Soft lock-in click | volume 0.45 | none |
| Toggle (multi) | `tick` | reuse | Tick | volume 0.35, pitch 1.2 on / 0.9 off | none |

No new sounds.

## Dependencies

- None. The height morph is a CSS transition on a measured height with a `linear()` spring; the highlight and roll are transforms.
- Icons via `@iconify/react`: `ph:caret-down-bold`, `ph:magnifying-glass`, `ph:check-bold`, and the option icons above (all checked to exist).

## Play demo

Agreed with the user. About 6.5 seconds; ends on Newest (as it started) and closed.

1. The cursor appears to the right of the trigger ([0.95, 0.1], instant).
2. It glides to the trigger (500 ms) and clicks: the surface grows down; `expand`.
3. It glides down over Oldest, Most popular, Most viewed (900 ms): the highlight slides along with soft ticks.
4. It clicks Most viewed: check jumps, panel closes, trigger rolls to "Most viewed"; `settle`.
5. Wait 600 ms.
6. It clicks the trigger again (opens on Most viewed), glides up to Newest (600 ms) and clicks it: closes and rolls back to "Newest".
7. It glides away (500 ms).

## Card fit and hit areas

The root's box reserves the open panel's height (trigger at the top, panel space below) so the open list stays on the card. On the wall the root is `pointer-events: none`, with `auto` on the trigger and, while open, on the panel. Check `elementFromPoint` in the reserved space below the closed trigger, beside it and above the caption (card link), and on the trigger and open rows (component). Clicking empty card space while open closes the panel and opens the modal; that is acceptable.

## Accessibility and edge cases

- With `multi` off, switching from multi keeps only the first selected value.
- Long labels truncate with an ellipsis; the full label is in `title`.
- Rapid open/close reverses the spring from its current height.
- Search keeps the selected rows' checks; picking a filtered row works as usual.

## Acceptance checklist

- [ ] Looks right in light and dark; groups, icons and search each on and off
- [ ] The trigger grows into the panel (one surface) and shrinks back
- [ ] The highlight slides between rows with pointer and keys
- [ ] Single pick rolls the trigger label; multi toggles checkboxes and shows "+n"
- [ ] Search filters, hides empty groups and resizes the panel
- [ ] Every knob visibly changes it
- [ ] Sounds respect `sound` and `volume`
- [ ] Combobox keyboard pattern works; reduced motion swaps instantly
- [ ] Demo picks Most viewed, then Newest, and ends closed

## Decisions log

- Open: morph from the trigger. (User)
- Content: icon and label rows, a "Sort by" list. (User)
- Extras: sliding highlight, type-ahead search, multi-select, groups. (User)
- Play demo: open, glide, pick, then pick the original back. (User)
- Morph detail: the panel grows downward from the trigger and the trigger row becomes the search field; no lining up of the selected row over the trigger. (User)
- Decided by agent:
  - the slug `dropdown` and the tag Select;
  - the option list is a prop, not a knob;
  - reusing `expand`, `collapse`, `tick`, `settle`.
