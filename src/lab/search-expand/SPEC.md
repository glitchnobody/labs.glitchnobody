# Search expand

- **Slug:** `search-expand` (URL `/search-expand`)
- **Number:** 43 / 60
- **Tag:** Type
- **Status:** spec
- **Design reference:** `~/Downloads/inso/31.mp4` (a round search button that grows into a search field with a results list; typing filters with the matched letters in bold and the results reshuffle with a blur; × clears, a second × collapses back to the round button). The list here is the labs' own component names. Only the idea is used.

## Summary

A search button that unfolds into a live-filtering list of the labs' components. Type to fuzzy-match, with the matching letters in bold and results sliding into their new order.

## Look

**One surface** following the theme.

**Closed.** A 40 px round button on `--fill-slab` with a soft shadow and `ph:magnifying-glass-bold` 16 px in `--fill-on`.

**Open.**

- **Field:** 240 × 40 px, fully rounded, on `color-mix(in srgb, var(--fill-on) 5%, var(--fill-slab))` with a soft inner shadow, `ph:magnifying-glass-bold` on the left, the input (placeholder "Search components" in `--ink-4`, 13 px), and a × button (`ph:x-bold`) on the right.
- **Results:** a panel 6 px below, 240 px wide, radius 16, on `--fill-slab` with a soft shadow, padding 4. Up to `max` rows (default 4), each 30 px, radius 10, padding 0 10: the name in `--fill-on`, 13 px, with matched letters in weight 700 and unmatched ones in `--ink-3` while a query is typed; with `tags` on, the component's tag (Hover, Press…) on the right in `--ink-4`, 11 px. The highlighted row has `color-mix(in srgb, var(--fill-on) 7%, transparent)` and the highlight slides between rows.
- **No results:** one row, "No components match", in `--ink-4`.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the button, field and panel.

## Behaviour

- **Data.** A built-in list of the labs' component names and tags (taken from `COMPONENTS.md` when the component is built, for example "Staggered countdown · Press", "Voice chat · Press", … "Summary resize · Drag"), so it works the same on the site and in copied code. With an empty query, the list shows the first `max` names.
- **Open.** Pressing the round button: it stretches horizontally into the field (width transition with a `linear()` spring, the icon sliding to the left), the input is focused, and the results panel drops in (fade, 6 px slide, rows staggered 25 ms). `expand` plays.
- **Type.** Fuzzy match: the query's letters must appear in order in the name, case-insensitive. Score: consecutive runs and matches at word starts rank higher; ties keep the list order. Matched letters turn bold. When the result order changes, rows that stay glide to their new places (FLIP, speed from `speed`), rows that leave blur out, new rows blur in (blur from `blur`, default 6 px). `tick` per keystroke (soft); `shuffle` when the order changes (rate-limited).
- **Highlight.** Hovering a row or Up/Down moves the highlight (sliding background); `tick`.
- **Pick.** Clicking a row or Enter fills the field with the name (the user chose no site wiring); the panel shows that one row highlighted; `pop`. Calls optional `onPick(name)`.
- **Clear and close.** × with text clears the query (results return to the default list, morphing). × with an empty query, or Escape, collapses: the panel fades up, the field shrinks back into the round button. `collapse`.
- **Click outside** with an empty query collapses too; with text it keeps the field open.

## Interaction

- **Pointer.** Press the round button, type, hover and click rows, press ×.
- **Keyboard.** The round button is a `button` "Search components". Open, the input is a `combobox` with `aria-expanded`, `aria-controls` the `listbox` of `option`s, `aria-activedescendant` for the highlight; Up/Down move, Enter picks, Escape clears then collapses. A live region announces "3 results".
- **Touch.** Same; the mobile keyboard opens on expand.
- **Reduced motion.** No stretch, FLIP or blur: cross-fades; rows swap instantly.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| max | Results | range | 3–8 | 4 | How many results show |
| blur | Reorder blur (px) | range | 0–16 | 6 | Blur on rows leaving and entering |
| speed | Reorder speed | range | 0–100 | 60 | How fast rows glide to new places |
| tags | Show tags | toggle | | false | Each result's tag on the right |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `items` (`{ name, tag }[]`), `placeholder` and `onPick`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Opens / collapses | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.5 | none |
| A key is typed, or the highlight moves | `tick` | reuse | Tiny dry tick | volume 0.25 | 1 per 30 ms |
| Results reorder | `shuffle` | reuse | Soft card riffle | volume 0.35 | 1 per 300 ms |
| A result is picked | `pop` | reuse | Bubbly pop | volume 0.5 | none |

No new sounds.

## Dependencies

- None. A small fuzzy scorer (about 30 lines), FLIP with CSS transforms, CSS transitions.
- `@iconify/react` for the search and close icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. The demo cannot type, so it opens, hovers, and closes. About 5 seconds.

1. The cursor appears below and right of the round button ([1.4, 1.4], instant; positions measured at build time for the open state).
2. It glides to the button (500 ms) and presses: it stretches into the field, results drop in; `expand`.
3. It glides down over the first result (400 ms), then the second, third and fourth (250 ms each): the highlight slides with ticks.
4. It glides to × (500 ms) and presses (the query is empty, so it collapses); `collapse`.
5. It glides away (500 ms).

## Card fit and hit areas

The root grows from a button-sized anchor (absolute positioning) so the wall layout does not jump. Check `elementFromPoint` beside the closed button and beside the open field and panel (card link), and on the field and a row (component). The 6 px gap between field and panel falls through.

## Accessibility and edge cases

- Very long queries with no match show "No components match".
- The built-in list must be updated when components are added; the build step for this component copies names from `COMPONENTS.md` (note it in the build checklist).
- Typing while collapsed is impossible; focus is only inside when open.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines it
- [ ] The button stretches into the field and back; results drop in with stagger
- [ ] Fuzzy matching ranks well and bolds matched letters; rows glide, blur out and in when reordering
- [ ] Highlight slides on hover and arrows; picking fills the field; × clears then collapses
- [ ] Every knob visibly changes it (results, reorder blur, reorder speed, tags)
- [ ] Sounds play at their moments and respect `sound` and `volume`
- [ ] Combobox keyboard and announcements work; reduced motion cross-fades
- [ ] Demo opens, hovers the results and collapses

## Decisions log

- Data: the labs' own component names. (User; built in as a static list, since site wiring was declined)
- Matching: fuzzy with bold matched letters. (User)
- Sound: `expand`/`collapse`, `tick`, `shuffle` (plus `pop` on pick). (User)
- Play demo: open, hover results, close. (User)
- Knobs: max results, reorder blur and speed, show tags. (User)
- Picking only fills the field; no site wiring. (User)
- Decided by agent:
  - the slug `search-expand` and the tag Type;
  - the fuzzy scoring rules;
  - click outside collapses only when the query is empty.
