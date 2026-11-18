# View switcher

- **Slug:** `view-switcher` (URL `/view-switcher`)
- **Number:** 7 / 60
- **Tag:** Select
- **Status:** spec
- **Design reference:** a Pinterest video pin by Oleg Matskov (https://ca.pinterest.com/pin/963559282796104896/). A "Collectibles" header, "List view / Card view / Pack view" chips, and items morphing between rows, a card grid and a fanned pack. Only the idea and layout are used.

## Summary

A small art-print collection that switches between List, Card and Pack views, with every print flying to its new place. Hover the pack to fan it, press it to open the prints into cards.

## Look

**Layout.** About 360 px wide on the wall card, left-aligned:

- Header "Collection" in `--fill-on`, 14 px, weight 600.
- Under it, the three view chips. Each chip has a Phosphor icon and a label:
  - "List view" with `ph:list-bullets-bold`;
  - "Card view" with `ph:squares-four-bold`;
  - "Pack view" with `ph:cards-bold`.
- Under the chips, the items.

**Chip styles** (`chipStyle`):

| Style | Selected chip | Unselected chip |
| ----- | ------------- | --------------- |
| Solid (the pin's look) | `--pick` background, white text | `--card` background, `--ink-4` text |
| Outline | 1 px `--pick` border, `--pick` text | no border |
| Underline | text in `--fill-on` with a 2 px `--pick` bar under it | text in `--ink-4` |

The selection highlight is one shared element that slides between chips (`layoutId`).

**List view.** One row per print:

- A 36 px square thumbnail with radius `radius / 2`.
- The title (`--fill-on`, 13 px, weight 500) with the price under it (`--ink-4`, 12 px).
- The edition at the right ("#209" in `--ink-4` with a small `--pick` dot), shown when `prices` is on.
- 8 px between rows.

**Card view.** A grid of `columns` columns:

- Each card is a square image with radius `radius`.
- The title under it, then the price and edition on one line, when `prices` is on.

**Pack view.** The prints stack centred in one 96 px square: the top print straight, the ones beneath rotated −6°, +5°, −3° and offset slightly, each with a white 3 px border, like physical prints. Under the pack it reads "4 prints" and "$1,240" in total (`--ink-4`; the total is hidden when `prices` is off).

**Images.**

- On the site: the filler paintings from `/lab/demoimages/` via `siteProps.images`, cropped with `object-fit: cover`.
- Exported code: gradient fills from the title hash (see AGENTS.md, "Filler images").

**Light and dark.** Tokens only; the pack's print borders use `--fill-slab`.

**Stroke on.** A 1 px `--pane-edge` outline on thumbnails, cards and pack prints.

## Behaviour

- **Switching.** Each print's image, title, price and edition are `motion` layout elements with stable `layoutId`s. Changing view re-lays them out, and they fly, resize and re-round to their new positions:
  - thumbnails grow into card images;
  - card images collapse into the stacked pack and rotate into their pack angles;
  - titles and prices travel with their images and cross-fade out where a view hides them (Pack hides them in favour of the summary).

  The motion is staggered by `stagger` ms per item, in reading order, with springs from `bounce` and `speed`. The `shuffle` sound plays when the rearrangement starts.
- **Interrupting.** Switching mid-morph retargets from the current positions, which layout handles.
- **Pack hover.** In Pack view, hovering the pack fans the prints out: each rotates further (up to ±18°) and spreads sideways around a pivot near the bottom, like a hand of cards. `pop` plays. Leaving folds them back and `collapse` plays.
- **Pack press.** Pressing the pack switches to Card view (the prints fly out into the grid), and the chip highlight slides to "Card view".
- **Default view.** `view` sets the view on load and when the knob changes.

## Interaction

- **Pointer.** Press chips to switch views. In Pack view, hover the pack to fan it and press it to open it. List rows and cards have a hover lift but no action.
- **Keyboard.**
  - The chips are a `radiogroup` of `radio`s. Left and Right move between them and select, and Home and End jump to the first and last.
  - The pack is a `button` labelled "Open 4 prints". Focus fans it, as hover does.
  - The item list is a `list` with each print a `listitem` labelled "Meadow Run, $320, edition 209".
- **Touch.** Chips work by press. On touch, the first press on the pack fans it and a second press opens it.
- **Reduced motion.** No flying or springs: the views cross-fade over 150 ms, the pack fan is shown as a slightly wider static fan on hover, and the chip highlight jumps.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| view | View | select | List, Card, Pack | List | The current view |
| count | Prints | range | 2–6 | 4 | How many prints are in the collection |
| columns | Card columns | range | 2–4 | 2 | Columns in Card view |
| prices | Show prices | toggle | | true | Price, edition and pack total |
| currency | Currency | select | USD, EUR, GBP, ETH | USD | Price format (ETH shows 3 decimals, like the pin) |
| chipStyle | Chip style | select | Solid, Outline, Underline | Solid | How the view chips look |
| radius | Corner (px) | range | 0–24 | 12 | Corner radius of cards and thumbnails |
| stagger | Stagger (ms) | range | 0–100, step 5 | 35 | Delay between prints as they move |
| bounce | Bounce | range | 0–100 | 20 | Spring bounce |
| speed | Speed | range | 0–100 | 60 | How fast prints move |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

**Prints** (the first `count` are used; images are site only):

| Title | Price (USD) | Edition | Filler image |
| ----- | ----------- | ------- | ------------ |
| Meadow Run | 320 | #209 | 2 (deer on a road) |
| Fox Crossing | 280 | #808 | 3 (fox) |
| Swan River | 410 | #114 | 4 (swan on a river) |
| Tall Grass | 230 | #352 | 6 (giraffe) |
| Wild Gallop | 360 | #077 | 5 (white horse) |
| Night Drive | 190 | #640 | 1 (car) |

Other currencies are rough conversions: EUR × 0.92, GBP × 0.79, ETH ÷ 3000, shown with 3 decimals.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A chip is pressed | `tick` | reuse | Tiny dry tick | volume 0.5, pitch 1.1 | none |
| Prints rearrange into a new view | `shuffle` | new | Soft card riffle | volume 0.7, pitch ±4% random | once per switch; not on load |
| The pack fans open | `pop` | reuse | Bubbly pop | volume 0.5, pitch 1.1 | once per hover |
| The pack folds back | `collapse` | reuse | Soft whoosh falling | volume 0.4 | once per hover-out |

New sound:

- **Name:** `shuffle`
- **ElevenLabs prompt:** "A soft quick riffle of a few thin cards or photo prints being shuffled together on a table, light and papery, short, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.65 · **loop:** false
- **Trim to:** about 350 ms

## Dependencies

- `motion` (the user's choice) for the layout morph and the sliding chip highlight. Import `motion/react` with `LazyMotion` + `domMax`.
- `@iconify/react` for the chip icons (house rule).
- Set `install: "npm install motion @iconify/react"`.

## Play demo

Agreed with the user. About 7 seconds; ends where it started (List view).

1. The cursor appears below and to the right.
2. It glides to "Card view" (500 ms) and presses. The rows grow into the grid and `shuffle` plays.
3. It waits 900 ms.
4. It glides to "Pack view" (400 ms) and presses. The prints stack into the pack and `shuffle` plays.
5. It waits 500 ms, then glides onto the pack (400 ms). The pack fans out and `pop` plays. It holds for 700 ms.
6. It glides to "List view" (500 ms) and presses. The pack folds and the prints fly back into rows, and `shuffle` plays.
7. It waits 700 ms and glides away (500 ms).

## Card fit and hit areas

The chips, the pack, rows and cards react; the gaps between them and the empty space to the right of the list must fall through to the card link. The root holds a column; on the wall it is `pointer-events: none` with `auto` on the chips, rows, cards and the pack. Heights by view: List about 200 px, Card about 400 px with 4 prints in 2 columns, Pack about 220 px. On the wall the component scales to fit the stage height in Card view (a transform from the top). Check `elementFromPoint` between chips, to the right of list rows, and between cards.

## Accessibility and edge cases

- A live region announces "Card view, 4 prints" on each switch.
- `count` changed mid-view: prints enter and leave with layout animations.
- `columns` greater than `count`: the grid uses `count` columns.
- `prices` off: rows and cards shrink in height smoothly; the pack shows only "4 prints".
- Fast chip switching retargets without jumps; the `shuffle` sound plays at most once per 200 ms.
- Missing image (offline, or `siteProps` absent): the gradient fallback renders, with no layout shift.
- The filler PNGs are large (about 2 MB each). Load them with `loading="lazy"` and `decoding="async"`, or use optimized copies (see the note in COMPONENTS.md).

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines images
- [ ] Prints fly between List, Card and Pack with stagger; titles and prices travel and fade correctly
- [ ] The chip highlight slides; all three chip styles work
- [ ] The pack fans on hover and opens into Card view on press
- [ ] Every knob visibly changes it (view, prints, columns, prices, currency, chip style, radius, motion)
- [ ] Copied code has no `/lab/demoimages/` URLs; gradients show without `siteProps`
- [ ] `tick`, `shuffle`, `pop` and `collapse` play at their moments and respect `sound` and `volume`
- [ ] Keyboard radiogroup works; pack focus fans and Enter opens; reduced motion cross-fades
- [ ] Demo runs List → Card → Pack (fan) → List and ends in List view

## Decisions log

- Content: an art-print collection using the filler paintings, with prices in a currency setting. (User)
- Views: List, Card, Pack. (User)
- Morph: `motion` layout animations. (User)
- Sound: new `shuffle` on rearrange; reuse `tick`, `pop` and `collapse`. (User; sounds suggested by agent)
- Pack: hover fans it, press opens it into Card view. (User)
- Play demo: List → Card → Pack (hover fan) → List. (User)
- Extra knobs: card columns, show prices, chip style. (User)
- Filler images: the user's `demoimages` folder, copied to `public/lab/demoimages/`. Site only; exported code uses gradients. (User)
- Decided by agent:
  - the slug `view-switcher` and the tag Select;
  - the header "Collection";
  - the print titles, prices and editions and their image picks;
  - the currency conversions;
  - touch needs two presses on the pack;
  - the component scales to fit the wall card in Card view.
