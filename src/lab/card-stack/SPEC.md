# Card stack

- **Slug:** `card-stack` (URL `/card-stack`)
- **Number:** 55 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** none (described by the user as "card stack"; design proposed by the agent).

## Summary

An endless deck of picture cards. Drag or flick the top card away and it tucks under the pile, bringing the next one forward.

## Look

**Cards.** `count` cards (default 5), portrait 200 × 260 px by default (`width` knob; height = width × 1.3), radius `radius` (default 18). Each is a full-bleed image (`object-fit: cover`) with a bottom scrim (`linear-gradient` from transparent to `color-mix(in srgb, black 55%, transparent)`) carrying a title (15 px, weight 600, white) and a caption (12 px, white 75%). White text on the scrim is a deliberate exception to tokens: the image is the surface.

- **Images:** site only. Defaults have no URLs: each card's fill is a gradient made from a hash of its title (two hues, `linear-gradient(160deg, …)`). The site passes `siteProps: { images: ["/lab/demoimages/1.png", …] }`.
- **Titles:** made-up places, e.g. "Meadow road", "River bend", "Fox hollow", "Swan lake", "Hare field", "Wolf ridge", "Flamingo bay", "Deer glade".

**Pile.** The cards behind sit offset upward by `offset` px each (default 10) and scaled down 5% each, so their tops peek out above; each step back is also dimmed (`filter: brightness(0.92)` per step, a darker overlay in dark mode via `--fill-slab` mix). Only the top 4 are visible; the rest hide behind the fourth.

**Shadow.** The top card has a soft shadow (`0 12px 30px color-mix(in srgb, var(--fill-on) 18%, transparent)`).

**Light and dark.** Tokens for shadow and dimming; the cards are images in both.

**Stroke on.** 1 px `--pane-edge` ring on every card.

## Behaviour

- **Drag.** The top card follows the pointer 1:1 and tilts with the horizontal offset (`rotate = dx × tilt / 100`, `tilt` knob default 12 → up to about 12° at 100 px). The card behind grows slightly toward the top position as the drag goes further (preview of what's next).
- **Release.**
  - If the drag passed `threshold` px (default 90) horizontally **or** the flick was faster than 0.5 px/ms, the card is **thrown**: it keeps its velocity and flies off that side (up to 1.2 × card width), then sweeps back behind the pile (it moves to the bottom of the z-order at the far point and slides into the last slot). The rest of the pile steps forward one place on a spring. Total ~550 ms.
  - Otherwise it springs back to the top position with a small overshoot (a jelly settle).
- **Springs.** Stiffness and damping come from `bounce` (Low, Medium, High) so the step forward and the snap back are tight or loose.
- **Loop.** It's endless: the order is a rotating list, nothing is removed.
- Reports `onChange(topIndex)`.

## Interaction

- **Pointer.** Drag the top card only (cards behind ignore the pointer). Pointer capture; `touch-action: none`, `user-select: none`, images `draggable=false`.
- **Keyboard.** The stack is a focusable group "Card stack, card 1 of 5: Meadow road". Left / Right throw the top card that way; the live region announces the new top card.
- **Touch.** Same.
- **Reduced motion.** No flight or tilt: a throw cross-fades the top card to the back (150 ms), snap back is instant.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| count | Cards | range | 3–8 | 5 | Cards in the deck |
| width | Width (px) | range | 140–260 | 200 | Card size (height follows) |
| radius | Corner (px) | range | 0–32 | 18 | Card corners |
| offset | Peek (px) | range | 0–24 | 10 | How far each card behind peeks out |
| tilt | Tilt | range | 0–30 | 12 | How much a dragged card rotates |
| threshold | Throw at (px) | range | 40–160 | 90 | Drag distance that throws the card |
| bounce | Bounce | select | Low, Medium, High | Medium | Spring looseness of throws and snap-backs |
| captions | Captions | toggle | | true | Shows the title and caption scrim |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A card is thrown | `swipe` | reuse | Quick paper swish | volume 0.5, pitch 0.9–1.15 by throw speed | none |
| It tucks in at the back | `slide` | reuse | Soft paper slide | volume 0.35 | none |
| Snap back | `jelly` | reuse | Soft wobbly boing | volume 0.3 | 1 per 200 ms |

No new sounds.

## Dependencies

- `motion` (domMax), chosen by the user: shared with the other motion components (~25 kB gz once for the site). Its drag gesture, velocity and springs do the throw, tuck and snap back. The option not chosen: hand-written rAF springs (0 kB, ~60 more lines).
- `install`: `npm install motion`.

- Icons: none.

## Play demo

Agreed with the user. About 5 seconds; ends with a different card on top (the deck is endless, so any card on top is a clean state).

1. The cursor appears below the stack ([0.5, 1.15], instant).
2. It glides to the middle of the top card (500 ms) and presses.
3. It drags right and slightly up to [0.95, 0.42] (350 ms): the card tilts and the next one grows; releases. The card flies off right and tucks behind; `swipe`, then `slide`.
4. Wait 600 ms.
5. It glides back to the middle of the new top card (400 ms) and presses.
6. It flicks left to [0.1, 0.55] (180 ms) and releases: thrown left and tucked; `swipe`, `slide`.
7. Wait 600 ms, then it glides away (500 ms).

## Card fit and hit areas

The root is the pile's box (the card plus the peek above it). On the wall the root is `pointer-events: none` with `auto` on the top card only. Check `elementFromPoint` on the peeking tops of the cards behind (card link: they do not react), in the margin beside the stack, and on the top card (component). A thrown card flies past the root's box; `overflow` stays visible so it can leave the card stage briefly (the wall card clips it at its edge).

## Accessibility and edge cases

- Images have `alt` = the title; the scrim text is real text.
- A new drag during a throw finishes the throw instantly first.
- `count` changes reset the order.
- Vertical drags do nothing past a small tilt; only horizontal distance or speed throws.

## Acceptance checklist

- [ ] Looks right in light and dark, captions on and off
- [ ] Drag tilts and previews the next card; a throw tucks the card to the back; a short drag snaps back
- [ ] Flicks throw by speed, not only distance
- [ ] Every knob visibly changes it
- [ ] `swipe`, `slide`, `jelly` respect `sound` and `volume`
- [ ] Arrow keys throw; reduced motion cross-fades
- [ ] Demo throws right, then left

## Decisions log

- Mechanic: drag the top card away and it tucks under the pile (endless deck), to differ from event-stack's dismiss. (User)
- Content: filler paintings with title and caption. (User)
- Pile: offset and scaled. (User)
- Play demo: two throws. (User)
- Dependency: motion (domMax). (User)
- Sounds: `swipe`, `slide`, `jelly`. (User)
- Decided by agent:
  - the slug `card-stack` and the tag Drag;
  - white caption text on the scrim (exception: the image is the surface);
  - only the top card reacts; arrow keys throw.
