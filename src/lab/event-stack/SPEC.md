# Event stack

- **Slug:** `event-stack` (URL `/event-stack`)
- **Number:** 4 / 60
- **Tag:** Swipe
- **Status:** spec
- **Design reference:** a screenshot the user supplied (a "Camping · Yosemite Park · 5 August" card with two cards peeking behind it and a "Show All ⌄" button).

## Summary

A stack of upcoming events with the next one on top. Show All unstacks them into a list; swipe a card sideways to dismiss it, and Restore brings dismissed cards back.

## Look

**Cards.** Each card is about 480 × 110 px by default, `radius` 20 px, on `--fill-slab` with a soft shadow (stronger in light mode; in dark mode a `--pane-edge` hairline replaces it).

- On the left, an icon tile: a 72 px rounded square (radius 16) holding a Phosphor icon in white at 50% of the tile.
  - `tile` **Dark** is a `--fill-on` background with a `--fill-slab` glyph, as in the reference.
  - **Accent** is a `--pick` background.
  - **Soft** is a `--card` background with an `--ink-2` glyph.
- The title (for example "Camping") in `--fill-on`, 20 px, weight 600.
- The place under the title in `--ink-3`, 19 px.
- The date at the right, baseline-aligned with the place, in `--ink-3`.

**Stacked state.** The top card is at full size. `peek` cards sit behind it, each offset down by `peekOffset` px and scaled by `1 - peekScale%` per level, so only their bottom edges show. They are also slightly faded, which fades their content to 0 and leaves just the surface.

**Button.** "Show All" with `ph:caret-down-bold` sits centred below the stack, as a pill on `--fill-slab` with a hairline and shadow, `--ink-2` text at 17 px weight 500. When expanded it reads "Show Less" and the caret rotates 180°.

**Restore.** A small text button, "Restore" with `ph:arrow-counter-clockwise-bold` in `--ink-4`, appears beside the main button whenever at least one card has been dismissed.

**Light and dark.** Tokens only, apart from the shadow and hairline swap described under Cards.

**Stroke on.** 1 px `--pane-edge` on the cards and the button.

## Behaviour

- **Show All (unstack).** All cards are `motion` layout elements. The top card stays in place and the cards behind slide down into a vertical list with `gap` px between them, growing to full scale and fading their content in. This is staggered by `stagger` ms, top to bottom. Cards beyond `peek`, which were not visible in the stack, fade and slide in from behind the last peeking card. The button rides down below the last card. Each card lands with a spring (`bounce`, `speed`), and each landing fires a `tick`.
- **Show Less (restack).** The reverse, bottom to top. Cards slide back behind the top card, shrinking to their peek scale and offset, and cards beyond `peek` fade out behind.
- **Hover.** The hovered card lifts by 2 px (deeper shadow, `y: -2`), and a small × button (`ph:x-bold`) fades in at its top right, if `dismiss` is on. In the stacked state only the top card is hoverable.
- **Swipe to dismiss** (if `dismiss` is on). A card can be dragged horizontally with `motion`'s `drag="x"`.
  - While dragging, it tilts slightly (up to 4°) and fades as it travels.
  - Released past `threshold`% of its width, or flicked fast, it flies off that side and the list closes the gap with layout animations. In the stack, the next card rises to the top.
  - Released short of that, it springs back.
  - × does the same as a swipe to the right.
- **All dismissed.** An empty state, "All caught up", appears in the card's place with a muted `ph:calendar-check` icon. Restore remains.
- **Restore.** Dismissed cards come back in their original order, sliding in from the side they left on with a stagger. `settle` plays when the last one lands.

## Interaction

- **Pointer.** Press the button to toggle; drag cards sideways to dismiss; press × to dismiss; press Restore to bring cards back. Vertical movement does not start a drag (`dragDirectionLock`), so the page can still scroll on touch.
- **Keyboard.**
  - The button is a `button` with `aria-expanded`, controlling the list. The list is a `ul` of `li` cards with `aria-label` "Camping, Yosemite Park, 5 August".
  - Cards are focusable. Delete or Backspace dismisses the focused card, and focus moves to the next card.
  - × is focusable within the card; Restore is a button.
  - In the stacked state only the top card and the button are in the tab order.
- **Touch.** Swipe works with `touch-action: pan-y` on cards. × is always visible on touch, since there is no hover.
- **Reduced motion.** No sliding or springs. The list cross-fades between stacked and expanded over 150 ms, and dismissed cards fade out. Swiping still works but the card fades instead of flying.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| count | Events | range | 2–7 | 5 | How many events are in the stack |
| peek | Peeking cards | range | 0–4 | 2 | Cards visible behind the top one when stacked |
| peekOffset | Peek offset (px) | range | 4–20 | 10 | How far each peeking card sits below the one above |
| peekScale | Peek shrink (%) | range | 0–10 | 4 | How much smaller each peeking card is |
| gap | List gap (px) | range | 4–24 | 12 | Space between cards in the list |
| radius | Corner (px) | range | 8–28 | 20 | Card corner radius |
| tile | Icon tile | select | Dark, Accent, Soft | Dark | Icon tile colour treatment |
| weight | Icon weight | select | Fill, Bold, Regular, Duotone | Fill | Phosphor weight used for the icons |
| showDate | Show date | toggle | | true | Date on the right of each card |
| dismiss | Swipe to dismiss | toggle | | true | Cards can be swiped away or closed |
| threshold | Swipe distance (%) | range | 20–60 | 35 | How far a card must travel to be dismissed |
| stagger | Stagger (ms) | range | 0–100, step 5 | 40 | Delay between cards as they unstack and restack |
| bounce | Bounce | range | 0–100 | 20 | Spring bounce |
| speed | Speed | range | 0–100 | 60 | How fast the cards move |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

**Events** (the first `count` are used; all icon names checked on Iconify):

| Title | Place | Date | Icon (base name; weight suffix from `weight`) |
| ----- | ----- | ---- | ---- |
| Camping | Yosemite Park | 5 August | `ph:tent` |
| Hiking | Mount Tamalpais | 12 August | `ph:mountains` |
| Flight to Lisbon | SFO → LIS | 20 August | `ph:airplane-tilt` |
| Concert | The Fillmore | 2 September | `ph:music-notes` |
| Birthday dinner | Nopa | 9 September | `ph:cake` |
| Surf lesson | Ocean Beach | 14 September | `ph:waves` |
| Book club | City Lights | 21 September | `ph:book-open` |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Show All | `expand` | reuse | Soft airy whoosh rising | volume 0.6 | once |
| Show Less | `collapse` | reuse | Soft airy whoosh falling | volume 0.5 | once |
| A card lands in the list | `tick` | reuse | Tiny dry tick | volume 0.4, pitch 1 + 0.06 × index | 1 per 30 ms |
| A card is dismissed | `swipe` | new | Quick paper-like swish | volume 0.7, pitch ±6% random | once per card |
| Restore finishes | `settle` | reuse | Soft lock-in click | volume 0.8 | once |

New sound:

- **Name:** `swipe`
- **ElevenLabs prompt:** "A quick light swish of a paper card being flicked sideways off a table, soft and airy, short, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.65 · **loop:** false
- **Trim to:** about 180 ms

## Dependencies

- **`motion`** (user's choice): layout animations for unstack, restack and gap closing, and `drag="x"` for swiping. Import `motion/react` with `LazyMotion` + `domMax`, as in `voice-chat`.
- **`@iconify/react`** with Phosphor icons, per the house icon rule.
- Set `install: "npm install motion @iconify/react"`.

## Play demo

Agreed with the user. About 8 seconds; ends in the starting state.

1. The cursor appears below and to the right.
2. It glides to "Show All" (600 ms) and presses. The cards unstack into a list one by one, the button rides down, and `expand` plus a tick per card play.
3. It glides onto the second card ("Hiking") (400 ms). The card lifts and its × appears.
4. It presses on the card, drags it to the right by 60% of its width (450 ms) and releases. The card flies off with `swipe`, the list closes the gap, and "Restore" appears.
5. It waits 500 ms, then glides to "Show Less" (500 ms) and presses. The cards restack and `collapse` plays.
6. It glides to "Restore" (300 ms) and presses. Hiking slides back into the stack and `settle` plays.
7. It glides away (500 ms).

## Card fit and hit areas

The cards, the button, × and Restore react. The root is a column sized to its content; the stacked height is about 150 px and the expanded height is about 5 × 122 + 60 ≈ 670 px, which would overflow the wall card. On the wall card the list scales to fit the stage height (a transform from the top, recalculated as it expands). The modal stage, which is taller, shows it at full size. Check `elementFromPoint` at the empty corners left and right of the button, which must hit the card link, and between cards in the list, where gaps must also hit the card link.

## Accessibility and edge cases

- A live region announces "Hiking dismissed", "2 events restored", "Showing all 5 events" and "Showing 1 event".
- Dismissing the top card while stacked brings the next card up, and the peek cards shift with layout animations.
- If `count` changes, dismissed cards beyond the new count are forgotten.
- If `peek` is greater than the remaining cards, it shows as many as there are.
- If `dismiss` is turned off while a card is mid-drag, the card springs back.
- Fast toggling of Show All and Show Less reverses smoothly mid-animation (layout handles interruption).
- If the network is down, icons fail to load. The tile still shows, empty; no layout shift, since the tile has a fixed size.

## Acceptance checklist

- [ ] Looks right in light and dark; the shadow swaps for a hairline in dark; stroke outlines the cards and the button
- [ ] Every knob visibly changes it (peek count, offset and shrink, gap, radius, tile, icon weight, date, dismiss, threshold, motion)
- [ ] Unstack and restack are staggered with springs; cards beyond `peek` appear from behind
- [ ] Swipe past the threshold dismisses and closes the gap; short swipes spring back; × dismisses; Restore brings cards back
- [ ] Empty state appears when all are dismissed
- [ ] `expand`, `collapse`, `tick`, `swipe` and `settle` play at their moments and respect `sound` and `volume`
- [ ] Keyboard: toggle, Delete dismisses, focus moves sensibly; reduced motion cross-fades
- [ ] Icons load via `@iconify/react` (Phosphor); Install shows `npm install motion @iconify/react`
- [ ] Demo runs expand → swipe → collapse → restore and ends in the starting state

## Decisions log

- Expand: unstack into a staggered list; the button becomes Show Less. (User)
- Card actions: hover lift and swipe to dismiss, with × on hover and Restore. (User)
- Icons: Iconify via `@iconify/react`, Phosphor set, loaded on demand. This is the house rule for all icon components. (User)
- Motion: `motion` layout animations. (User)
- Sound: reuse `expand`, `collapse`, `tick` and `settle`; one new `swipe`. (User; sounds suggested by agent)
- Play demo: expand, swipe the second card away, collapse, restore. (User)
- Decided by agent:
  - the knob list (the user was not asked about extra knobs for this one);
  - the event list and dates;
  - the tag is Swipe;
  - the "All caught up" empty state;
  - Restore as a small text button that appears once something is dismissed;
  - Delete key to dismiss;
  - the list scales to fit the wall card.
