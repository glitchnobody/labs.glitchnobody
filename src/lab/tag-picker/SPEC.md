# Tag picker

- **Slug:** `tag-picker` (URL `/tag-picker`)
- **Number:** 52 / 60
- **Tag:** Select
- **Status:** spec
- **Design reference:** `~/Downloads/inso/40.mp4` (a "Tags" field holding Node, Express and Typescript, with available tags Javascript, Vue, Next, Svelte, Gatsby, Html and React in a box below; clicking an available tag flies it up into the field, and × on a selected tag flies it back to its old spot while the others re-flow). Only the idea is used.

## Summary

A tag picker where tags fly between lists. Click a tag to send it up into the field, × to send it home, type to filter or make a new one, and drag selected tags to reorder.

## Look

**Label.** "Tags", 12 px weight 600, `--fill-on`.

**Field.** About 280 px wide, min 40 px tall, radius 12, on `--fill-slab` with a soft shadow in light mode and a `--pane-edge` hairline in dark; padding 6. Selected tags wrap inside it, followed by a text input (placeholder "Add a tag", `--ink-4`, 12 px) that takes the rest of the line.

**Available box.** 6 px below, the same width, radius 12, on `color-mix(in srgb, var(--fill-on) 3%, var(--fill-slab))` with a hairline, padding 8; available tags wrap inside it.

**Tags** (`tagStyle`):

| Style | Selected | Available |
| ----- | -------- | --------- |
| Pill (default) | fully rounded, `color-mix(in srgb, var(--fill-on) 7%, var(--fill-slab))`, text `--fill-on` 12 px weight 500, a small × in `--ink-4` | fully rounded, transparent with a hairline, text `--ink-3` |
| Square | radius 6, same colours | radius 6 |
| Outline | 1 px `--fill-on` border, no fill | 1 px `--pane-edge` border |

Tags are 26 px tall, padding 0 10, 6 px apart.

**Max reached.** When `max` > 0 and the field is full, the available box dims to 50% and a small "Max 5" note shows at the field's right in `--ink-4`.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the field and the available box (the field adds one in light mode).

## Behaviour

- **Lists.** Selected: Node, Express, Typescript. Available: Javascript, Vue, Next, Svelte, Gatsby, Html, React, Css. Each tag keeps its home index in the available list.
- **Add.** Clicking an available tag flies it (shared `layoutId`, spring from `speed` and `bounce`) from its spot to the end of the selected tags; the available tags re-flow to close the gap, and the field grows if needed. `pop` plays when it lands.
- **Remove.** Clicking × (or pressing Backspace in an empty input, which removes the last tag) flies the tag back to its home spot in the available list (created tags go to the end); the selected tags re-flow. `swipe`.
- **Filter.** Typing in the input filters the available tags (case-insensitive substring); non-matching ones shrink and fade out with layout re-flow. Enter adds the first match; if there is no match and `create` is on, Enter creates a new tag with the typed text (it pops in at the end of the field). `tick` per keystroke (soft).
- **Reorder.** Selected tags can be dragged within the field (`motion`'s `Reorder` group, horizontal and wrapping); others move aside as one is dragged over them. `tick` when the order changes.
- **Max.** With `max` > 0, adding beyond it shakes the tag in place and plays `collapse` at low pitch; it stays available.

## Interaction

- **Pointer.** Click available tags, × on selected tags; type; drag selected tags. `touch-action: none` on selected tags while dragging; a click without movement on a selected tag does nothing (only × removes).
- **Keyboard.** The input is a `combobox` whose `listbox` is the available tags (arrow keys move through them, Enter adds). Selected tags are a `list`; each has a remove `button` ("Remove Node"). Selected tags can be reordered with Alt+Left/Right when focused. A live region announces "Added Css", "Removed Node", "Moved Express to position 1".
- **Touch.** Same; long-press to start dragging a selected tag.
- **Reduced motion.** No flights or springs: tags appear and disappear with a 120 ms fade; reordering moves without animation.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| max | Max tags | range | 0–8 | 0 | Limit on selected tags (0 = no limit) |
| create | Allow create | toggle | | true | Enter creates new tags |
| tagStyle | Tag style | select | Pill, Square, Outline | Pill | Tag shape and look |
| speed | Flight speed | range | 0–100 | 60 | How fast tags fly |
| bounce | Bounce | range | 0–100 | 25 | Spring bounce of flights |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `selected`, `available` and `onChange(tags)`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A tag lands in the field | `pop` | reuse | Bubbly pop | volume 0.5, pitch 1 ± 4% random | none |
| A tag is removed | `swipe` | reuse | Quick paper swish | volume 0.45 | none |
| A key is typed, or the order changes | `tick` | reuse | Tiny dry tick | volume 0.25 | 1 per 40 ms |
| Max reached | `collapse` | reuse | Soft whoosh falling, lower | volume 0.35, pitch 0.8 | 1 per 300 ms |

No new sounds.

## Dependencies

- `motion` (the user's choice) for shared-layout flights and `Reorder`. Import `motion/react` with `LazyMotion` + `domMax`.
- `@iconify/react` for the × icons (`ph:x-bold`) (house rule).
- Set `install: "npm install motion @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends with Express, Typescript, Css, React selected (a fine state).

1. The cursor appears below the available box ([0.5, 1.15], instant).
2. It glides to "Css" (500 ms) and clicks: it flies up into the field; `pop`.
3. It glides to "React" (400 ms) and clicks: it flies up; `pop`.
4. It glides to Node's × (500 ms) and clicks: Node flies back to its spot; `swipe`; the field re-flows.
5. It waits 600 ms and glides away (500 ms).

## Card fit and hit areas

The label, field and box form a column with gaps. On the wall the root is `pointer-events: none` with `auto` on the field and the available box. Check `elementFromPoint` on the label and in the gap between field and box (card link), and on a tag and the input (component).

## Accessibility and edge cases

- Creating a tag that already exists (any case) adds the existing one instead.
- Very long created tags are capped at 24 characters.
- Removing a filtered-out tag sends it home but keeps it hidden until the filter is cleared.

## Acceptance checklist

- [ ] Looks right in light and dark in all three tag styles; stroke outlines the field and box
- [ ] Tags fly up on click and back home on ×, with both lists re-flowing
- [ ] Typing filters; Enter adds the first match or creates a new tag (when allowed)
- [ ] Dragging reorders selected tags; max limit shakes extra picks
- [ ] Every knob visibly changes it (max, allow create, tag style, flight speed, bounce)
- [ ] `pop`, `swipe`, `tick`, `collapse` respect `sound` and `volume`
- [ ] Combobox keyboard, remove buttons, Alt+arrows and announcements work; reduced motion fades
- [ ] Demo adds Css and React and removes Node

## Decisions log

- Behaviour: fly between lists, type to filter or create, drag to reorder, a max limit. (User)
- Motion: `motion` layout with `domMax`. (User)
- Sound: `pop` in, `swipe` out (plus `tick` and the low `collapse` for max). (User)
- Play demo: add two, remove one. (User)
- Knobs: max tags, allow create, tag style, flight speed and bounce. (User)
- Removed created tags join the available list. (User)
- Decided by agent:
  - the slug `tag-picker` and the tag Select;
  - "Css" added to the available list (it appears in the video);
  - Backspace removes the last tag; Alt+arrows reorder;
  - the duplicate and length rules for created tags.
