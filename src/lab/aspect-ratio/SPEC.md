# Aspect ratio

- **Slug:** `aspect-ratio` (URL `/aspect-ratio`)
- **Number:** 25 / 60
- **Tag:** Select
- **Status:** spec
- **Design reference:** `~/Downloads/inso/12.gif`, the "Aspect Ratio" tile (square, landscape and portrait buttons and a "…" button, with the selected one highlighted). Uses the shared editor-control look from `value-slider` (#21), with a photo added above that re-crops to the chosen ratio. Only the idea is used.

## Summary

An aspect-ratio picker with a photo that re-crops itself. Press square, landscape or portrait and the photo springs into the new shape; "…" holds more ratios.

## Look

**Column.** A photo stage, then the title, then the tile, 220 px wide.

**Photo stage.** A 220 × 160 px area. The photo sits centred in it at the largest size that fits the current ratio (1:1 → 160 × 160; 16:9 → 220 × 124; 9:16 → 90 × 160; 4:3 → 213 × 160; 3:2 → 220 × 147; 21:9 → 220 × 94; Free → 220 × 160), radius 12, `object-fit: cover`, so changing ratio re-crops it. Nothing is drawn outside the photo: no dimmed surround, no crop frame or handles; the photo's own edges simply morph to the next ratio.

- On the site: a filler painting via `siteProps.images[0]`.
- Exported code: a gradient landscape from a hash (see AGENTS.md, "Filler images").

**Grid lines** (`grid`): Off, Thirds (default; two lines each way at 1/3 and 2/3) or Golden (at 0.382 and 0.618), 1 px white at 55% with a faint shadow. They show while the photo is changing shape and for 800 ms after, and while the pointer is over the photo stage.

**Tile.** The shared tile with four icon buttons spaced evenly:

| Button | Icon | Ratio |
| ------ | ---- | ----- |
| Square | `ph:square-bold` | 1:1 |
| Landscape | `ph:rectangle-bold` | 16:9 |
| Portrait | `ph:rectangle-bold` rotated 90° | 9:16 |
| More | `ph:dots-three-circle-bold` | opens a menu |

The selected button sits on a highlight (`color-mix(in srgb, var(--fill-on) 14%, transparent)`, radius 8, 32 × 32) that slides between buttons. When the ratio is one from the menu, the highlight sits on More and a tiny label under the tile's right end shows it ("4:3").

**More menu.** A small popover above the More button on `--fill-slab` with a `--pane-edge` hairline and shadow, radius 10: "4:3", "3:2", "21:9", "Free", 13 px, the current one with `ph:check-bold`.

**Light and dark.** Tokens only (grid lines stay white over the photo).

## Behaviour

- **Pick a ratio.** The highlight slides to the button (spring). The photo's width and height spring to the new size (a hand-written spring in rAF; `bounce` sets overshoot), staying centred; the image inside re-crops continuously because it is `object-fit: cover`. The grid lines fade in during the morph. `tick` on press, `settle` when the spring comes to rest.
- **More.** Pressing More opens the menu (scale from 0.95 and fade, 140 ms) with `expand`; picking an item closes it with `collapse` and applies the ratio as above. Escape or a press outside closes it with `collapse` and no change.
- **Interrupting.** Picking mid-morph retargets the spring from the current size.

## Interaction

- **Pointer.** Press buttons and menu items; hover the photo to see the grid.
- **Keyboard.** The four buttons are a `radiogroup` ("Aspect ratio") with Left/Right; More is a `button` with `aria-haspopup="menu"`, and the menu is a `menu` with `menuitemradio`s, arrow keys, Enter and Escape. A live region announces "Aspect ratio 16 to 9".
- **Touch.** Same as pointer.
- **Reduced motion.** The photo changes size without a spring (120 ms ease); the highlight jumps.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| ratio | Ratio | select | 1:1, 16:9, 9:16, 4:3, 3:2, 21:9, Free | 1:1 | Starting ratio |
| grid | Grid | select | Off, Thirds, Golden | Thirds | Composition lines over the photo |
| bounce | Bounce | range | 0–100 | 35 | Overshoot of the re-crop spring |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Five knobs: the user picked these. Also takes `title`, `image` and `onChange(ratio)`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A ratio button or menu item is pressed | `tick` | reuse | Tiny dry tick | volume 0.5, pitch 1.1 | none |
| The photo settles in its new shape | `settle` | reuse | Soft lock-in click | volume 0.5 | 1 per 150 ms |
| Menu opens / closes | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.4 | none |

No new sounds.

## Dependencies

- None. A small rAF spring for width and height; CSS for the highlight slide and menu.
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 5 seconds; ends on square (the default).

1. The cursor appears below the tile ([0.5, 1.15], instant).
2. It glides to Landscape (500 ms) and presses. The photo springs wide; grid lines flash.
3. It waits 700 ms, glides to Portrait (300 ms) and presses. The photo springs tall and narrow.
4. It waits 700 ms, glides to Square (300 ms) and presses. The photo springs square.
5. It waits 500 ms and glides away (500 ms).

## Card fit and hit areas

Only the tile reacts (and the menu while open); the photo stage is decorative but shows the grid on hover, so it gets `pointer-events: auto` for hover only and does nothing on click, so it does not open the modal. To keep the modal reachable, the stage area outside the photo's current box falls through: the photo element itself is `auto`, the stage is `none`. Check `elementFromPoint` beside a portrait photo (card link), on the photo (component), on the title (card link) and on the buttons (component). The column is about 220 × 256 px.

## Accessibility and edge cases

- The photo is decorative (`aria-hidden`).
- Free uses the full stage (220 × 160).
- Changing `ratio` from the knob animates like a press.
- Missing image: the gradient landscape re-crops the same way.

## Acceptance checklist

- [ ] Looks right in light and dark; matches the shared look; stroke outlines the tile
- [ ] Each ratio re-crops the photo with a spring and grid lines; mid-morph picks retarget
- [ ] More opens a menu with 4:3, 3:2, 21:9, Free; the highlight moves to More with a small ratio label
- [ ] Every knob visibly changes it (ratio, grid, bounce)
- [ ] Copied code has no `/lab/demoimages/` URLs; the gradient shows without `siteProps`
- [ ] `tick`, `settle`, `expand`, `collapse` respect `sound` and `volume`
- [ ] Radiogroup and menu keyboard work; reduced motion removes springs
- [ ] Demo presses landscape, portrait, square

## Decisions log

- A photo above the tile re-crops to the chosen ratio (the container animates, the image re-crops with `object-fit`). (User)
- Knobs: starting ratio, grid lines, spring bounce. (User)
- Sound: `tick`, `settle`, `expand`/`collapse`. (User)
- Play demo: landscape, portrait, square. (User)
- No dimming or overlay outside the photo; the frame just morphs to the next ratio. (User)
- Decided by agent:
  - the slug `aspect-ratio` and the tag Select;
  - the More menu's ratios (4:3, 3:2, 21:9, Free) and the small ratio label when one is chosen;
  - grid lines show during the morph, after it for 800 ms, and on hover;
  - portrait uses the landscape icon rotated;
  - the photo (not the whole stage) catches the pointer so empty stage falls through.
