# Color palette

- **Slug:** `color-palette` (URL `/color-palette`)
- **Number:** 24 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/12.gif`, the "Color Palette" tile (three wide swatches side by side, white, grey and teal, then cream, sage and green, and a refresh button at the right). Uses the shared editor-control look from `value-slider` (#21). Only the idea is used.

## Summary

A palette generator in a tile. Press refresh to roll new colours in like slot reels, press a swatch to copy its hex, and hold one to lock it through the next shuffle.

## Look

The shared tile (see `value-slider`, "Shared editor-control look"), with:

- **Swatches:** `count` (default 3) swatches in a row filling the space left of the button, 32 px tall, no gaps, the row clipped to radius 8 (only the outer corners are round, as in the gif).
- **Refresh button** at the right: `ph:arrows-clockwise-bold`.
- **Hex labels** (`labels`): Always, On hover (default), or Never. A label is the hex in 10 px weight 600 monospace digits, centred at the swatch's bottom, in black or white by contrast against the swatch.
- **Lock:** a locked swatch shows `ph:lock-simple-fill` (12 px) in its top-right corner, in black or white by contrast, and a 2 px inner ring of the same colour at 40%.

**Light and dark.** The tile uses tokens; swatches are the generated colours.

## Behaviour

- **Palette generation** (OKLCH, so colours look evenly balanced), by `harmony`:

  | Harmony | Rule |
  | ------- | ---- |
  | Random | random hues, lightness 0.45–0.95, chroma 0.02–0.15, with at least one light and one darker swatch |
  | Analogous (default) | a base hue, the others within ±30°, lightness spread from light to mid |
  | Complementary | base hue and base + 180°, filled out with tints of each |
  | Triad | hues 120° apart |
  | Monochrome | one hue, lightness steps from 0.95 to 0.45 |

  Locked swatches are kept and the rest are generated around them (the first locked swatch's hue becomes the base). The first palette is the gif's: near-white, grey, teal (`#EEF0F2`, `#6B7178`, `#2BB5B8`).
- **Shuffle** (press refresh): the icon spins one turn (400 ms). Unlocked swatches change, left to right, 60 ms apart, by the `motion` knob's style:
  - **Roll** (default): each swatch is a reel; the old colour slides up and out while the new one slides up from below (240 ms, slight overshoot), with a quick motion blur of two in-between colours, so it reads like a slot reel.
  - **Flip:** each swatch flips 180° on its horizontal axis to reveal the new colour (`perspective(400px) rotateX`).
  - **Tween:** colours blend smoothly to the new ones in place (OKLCH interpolation, 300 ms).

  `shuffle` plays at the start; `tick` as each swatch lands (rising pitch).
- **Copy** (a short press on a swatch, released under 350 ms): copies the hex with `navigator.clipboard.writeText`; the swatch's label briefly shows "Copied" (even if labels are set to Never) for 900 ms. `settle` plays. If the clipboard is refused, the label shows the hex selected for manual copy.
- **Lock** (hold a swatch for 350 ms): a ring fills around the press point during the hold; at 350 ms the swatch locks (or unlocks if already locked) with a small scale bounce; `pop` plays. Releasing after a lock does not copy.

## Interaction

- **Pointer.** Press the refresh button; press or hold swatches. `user-select: none` on the swatches.
- **Keyboard.**
  - Refresh is a `button` "Shuffle palette"; R also shuffles while the tile is focused.
  - Each swatch is a `button` labelled "#2BB5B8, copy" with `aria-pressed` for the lock state described in the label ("locked"); Enter copies, L (or Space) toggles the lock.
  - A live region announces "New palette: …" and "Copied #2BB5B8".
- **Touch.** Same as pointer; long-press locks (and the context menu is suppressed on swatches).
- **Reduced motion.** All motion styles become a 120 ms colour cross-fade; the icon does not spin.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| count | Swatches | range | 3–5 | 3 | How many swatches |
| harmony | Harmony | select | Random, Analogous, Complementary, Triad, Monochrome | Analogous | How new palettes are built |
| labels | Hex labels | select | Always, On hover, Never | On hover | When hex codes show |
| motion | Motion | select | Roll, Flip, Tween | Roll | How new colours arrive |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `title`, `palette` (initial hex list) and `onChange(hexes)`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Refresh pressed | `shuffle` | reuse (from `view-switcher`) | Soft card riffle | volume 0.6, pitch ±4% random | 1 per 200 ms |
| Each swatch lands | `tick` | reuse | Tiny dry tick | volume 0.35, pitch 1 + 0.08 × index | none |
| Hex copied | `settle` | reuse | Soft lock-in click | volume 0.5 | none |
| Swatch locked or unlocked | `pop` | reuse | Bubbly pop | volume 0.5, pitch 1.15 lock / 0.9 unlock | none |

No new sounds.

## Dependencies

- None. The reels are two stacked colour layers per swatch animated with CSS transitions and per-swatch delays (the Roll motion needs no library); Flip uses CSS 3D transforms; Tween uses CSS `transition` on `background-color` with `color-interpolation` in OKLCH where supported. OKLCH ↔ hex conversion is about 30 lines.
- `@iconify/react` for the refresh and lock icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; the middle swatch is left unlocked at the end.

1. The cursor appears below the tile ([0.5, 1.3], instant).
2. It glides to the refresh button (500 ms) and presses. The swatches roll to a new palette; `shuffle` and ticks.
3. It waits 500 ms, glides to the middle swatch (400 ms), presses and holds 500 ms (the hold ring fills, the lock appears, `pop`), and releases.
4. It glides to refresh (400 ms) and presses. The outer swatches roll; the locked middle one stays.
5. It glides back to the middle swatch (400 ms), holds 500 ms to unlock it, and releases.
6. It glides away (500 ms).

## Card fit and hit areas

Shared look: only the tile reacts. Check `elementFromPoint` on the title and beside the tile (card link), and on a swatch and the refresh button (component).

## Accessibility and edge cases

- Label colour (black or white) is chosen by OKLCH lightness > 0.65 → black.
- All swatches locked: refresh only spins the icon and plays `tick`; the live region says "All colours are locked".
- `count` raised: new swatches roll in at the right, generated around the existing ones; lowered: the rightmost roll out.
- Harmony change shuffles immediately.

## Acceptance checklist

- [ ] Looks right in light and dark; matches the shared look; stroke outlines the tile
- [ ] Refresh rolls unlocked swatches with stagger in all three motion styles
- [ ] Short press copies (stubbed clipboard) and shows "Copied"; hold locks with a ring and the lock survives shuffles
- [ ] Every knob visibly changes it (swatches, harmony, hex labels, motion)
- [ ] `shuffle`, `tick`, `settle`, `pop` respect `sound` and `volume`
- [ ] Keyboard (Enter copy, L lock, R shuffle) and the live region work; reduced motion cross-fades
- [ ] Demo shuffles, locks the middle, shuffles, unlocks

## Decisions log

- Behaviour: shuffle, copy on press, hold to lock. (User)
- Motion: staggered vertical roll by default, with Flip and Tween as a knob. (User)
- Knobs: swatch count, harmony, hex labels, motion style. (User)
- Sound: `shuffle`, `tick`, `settle`, `pop`. (User)
- Play demo: shuffle, lock the middle, shuffle. (User)
- Decided by agent:
  - the slug `color-palette` and the tag Press;
  - OKLCH generation rules per harmony;
  - the first palette matches the gif;
  - the 350 ms hold threshold with a filling ring;
  - the demo unlocks the middle swatch at the end so the card resets;
  - no animation library (the roll is CSS).
