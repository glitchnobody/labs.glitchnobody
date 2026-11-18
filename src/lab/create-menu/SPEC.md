# Create menu

- **Slug:** `create-menu` (URL `/create-menu`)
- **Number:** 28 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/15.gif` (a "Create new +" pill that morphs into a panel with a "Create new ×" header and a grid of six items, Project, Notebook, Notes, Goal, Milestone and Event; × morphs it back). The gif mixes a black header with a white body; here the whole thing is one surface, all light or all dark, at the user's request. Only the idea is used.

## Summary

A "Create new" button that grows into a menu. Press it to unfold a grid of things to create, pick one and it folds back into the button with a check.

## Look

**One surface.** The pill and the panel are the same element on `--fill-slab` with `--fill-on` text: white in light mode, dark in dark mode (no black header on a white body). Soft shadow in light mode, `--pane-edge` hairline in dark.

**Pill (closed).** 40 px tall, fully rounded, padding 0 16 px: "Create new" 15 px weight 500 and `ph:plus-bold` 16 px.

**Panel (open).** About 230 px wide, radius 18:

- **Header:** "Create new" (the pill's label, which travels into place) on the left and a `ph:x-bold` close button on the right, 44 px tall, with a 1 px `--pane-edge` divider below.
- **Grid:** `columns` columns (default 3), padding 8; each item a 64 px tall tile, radius 12, with a 20 px Phosphor icon (regular weight, `--ink-2`) above a label (12 px, `--fill-on`). Hover gives the tile `color-mix(in srgb, var(--fill-on) 6%, transparent)`, as in the gif.

**Items** (the first `items` are shown):

| Item | Icon |
| ---- | ---- |
| Project | `ph:folder` |
| Notebook | `ph:notepad` |
| Notes | `ph:copy` |
| Goal | `ph:trophy` |
| Milestone | `ph:flag` |
| Event | `ph:calendar-blank` |
| Task | `ph:check-square` |
| Doc | `ph:file-text` |
| Link | `ph:link` |

**Confirmation.** After a pick, the pill reads "✓ Goal created" with `ph:check-bold` in `--ok`.

**Light and dark.** Tokens only, one surface.

**Stroke on.** 1 px `--pane-edge` around the pill and panel.

## Behaviour

- **Open** (press the pill): the element morphs from pill to panel with a `motion` layout animation (width, height, corner radius; spring from `bounce` and `speed`). Where it grows from depends on `origin`:
  - **Down** (default): the pill's top-left stays put and the panel grows down and right.
  - **Up:** the bottom-left stays put and it grows upward.
  - **Centre:** it grows evenly from the pill's centre.

  The "Create new" label travels to the header (shared `layoutId`), the plus rotates 45° into the × and moves to the header's right. Items fade and rise 6 px in, `stagger` ms apart in reading order, after the panel is 60% open. `expand` plays.
- **Close** (× or Escape or a press outside): items fade out together (100 ms), then the panel morphs back to the pill, the × rotating back into the plus. `collapse` plays.
- **Pick** (press an item): the tile presses in (scale 0.94), items fade, and the panel morphs back to the pill, which shows "✓ Goal created" for 1.4 s, then cross-fades to "Create new +" (the pill's width animates between the two labels). `pop` plays on the pick. Calls optional `onCreate(item)`.
- **Hover items:** `tick` as the hovered item changes.
- **Interrupting:** pressing × mid-open reverses from the current size (layout animations retarget).

## Interaction

- **Pointer.** Press the pill, items and ×.
- **Keyboard.** The pill is a `button` with `aria-expanded` and `aria-haspopup="menu"`. Open, focus moves to the first item; the grid is a `menu` of `menuitem`s with arrow keys moving in two dimensions, Home/End, Enter picks, Escape closes and returns focus to the pill. A live region announces "Goal created".
- **Touch.** Same as pointer.
- **Reduced motion.** No morph spring: a 120 ms cross-fade between pill and panel; items appear without stagger.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| items | Items | range | 3–9 | 6 | How many items are in the menu |
| columns | Columns | range | 2–4 | 3 | Grid columns |
| bounce | Bounce | range | 0–100 | 25 | Morph spring bounce |
| speed | Speed | range | 0–100 | 60 | Morph speed |
| stagger | Stagger (ms) | range | 0–80, step 5 | 25 | Delay between items appearing |
| origin | Opens | select | Down, Up, Centre | Down | Which way the panel grows from the pill |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Opens | `expand` | reuse | Soft whoosh rising | volume 0.5 | none |
| Closes (× or outside) | `collapse` | reuse | Soft whoosh falling | volume 0.5 | none |
| Hovered item changes | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 1 + 0.04 × index | 1 per 40 ms |
| Item picked | `pop` | reuse | Bubbly pop | volume 0.6 | none |

No new sounds.

## Dependencies

- `motion` (the user's choice) for the layout morph and shared label. Import `motion/react` with `LazyMotion` + `domMax` (layout animations need `domMax`).
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install motion @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends back on "Create new +".

1. The cursor appears to the right of the pill ([1.3, 0.5], instant; fractions of the closed pill's box are worked out at build time from the open layout too).
2. It glides to the pill (500 ms) and presses. The panel unfolds; items stagger in; `expand`.
3. It glides over Project (400 ms), Notebook (300 ms) and Milestone (400 ms): tiles highlight with ticks.
4. It glides to Goal (300 ms) and presses. The panel folds back into "✓ Goal created"; `pop`.
5. It waits 1600 ms (the pill returns to "Create new +") and glides away (500 ms).

## Card fit and hit areas

The root is the morphing element itself, so its box is the pill when closed and the panel when open; nothing empty around it catches the pointer. With `origin` Down, reserve no space (the panel may overflow the root's flow box; use `position: absolute` from a pill-sized anchor) so the card layout does not jump. Check `elementFromPoint` beside the closed pill (card link), and beside the open panel (card link), on the pill and on an item (component). The open panel (about 230 × 210) fits the stage.

## Accessibility and edge cases

- Items in a partial last row align left.
- `items` 3 with 4 columns: the grid uses 3 columns.
- Pressing the pill during the confirmation opens the menu at once.
- Outside presses close the menu but do not trigger the card link on the wall (the first outside press only closes).

## Acceptance checklist

- [ ] One surface in light and in dark (no mixed header); stroke outlines it
- [ ] Pill morphs to panel and back with the label travelling and plus rotating into ×, in all three origins
- [ ] Picking folds into "✓ Goal created" then back
- [ ] Every knob visibly changes it (items, columns, bounce, speed, stagger, opens)
- [ ] `expand`, `collapse`, `tick`, `pop` respect `sound` and `volume`
- [ ] Menu keyboard works, focus returns to the pill; reduced motion cross-fades
- [ ] Demo opens, hovers, picks Goal, and returns to the pill

## Decisions log

- Pick: the panel folds back into a confirmation in the pill. (User)
- Motion: `motion` layout with `domMax`. (User)
- Sound: `expand`, `collapse`, `tick`, `pop`. (User)
- Play demo: open, hover items, pick Goal. (User)
- Knobs: items and columns, bounce, speed and stagger, open direction. (User)
- Theme: one surface, fully light or fully dark like the other components; no dark header on a light body. (User)
- Decided by agent:
  - the slug `create-menu` and the tag Press;
  - the three extra items (Task, Doc, Link) for counts up to 9;
  - the confirmation lasts 1.4 s;
  - the first outside press only closes the menu.
