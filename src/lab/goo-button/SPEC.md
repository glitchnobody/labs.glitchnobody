# Goo button

- **Slug:** `goo-button` (URL `/goo-button`)
- **Number:** 50 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/38.mp4` (a white "Explore more" pill with a separate round arrow button beside it on a dark page; on hover the circle slides in and fuses with the pill through a liquid bridge and the arrow turns from → to ↗; leaving pulls them apart). Only the idea is used.

## Summary

A call-to-action whose arrow is a drop of liquid. Hover and the arrow bubble melts into the button and turns to point up-right; press and the arrow shoots off.

## Look

**Pill and circle.** Size by `size`:

| Size | Pill height | Circle | Label |
| ---- | ----------- | ------ | ----- |
| S | 30 px | 30 px | 12 px |
| M (default) | 38 px | 38 px | 14 px |
| L | 48 px | 48 px | 16 px |

The pill (fully rounded, padding 0 18, the label in weight 500) and, `gap` px to its right (default 8), the circle with `ph:arrow-right-bold`. Both filled by the `accent`: Ink (default; `--fill-on` fill with `--fill-slab` text and arrow, the video's white button on dark becomes black on light, an inverted-ink button as approved for `pricing-toggle`) or Pick (`--pick` fill, white text).

Both shapes sit inside an SVG goo filter (`feGaussianBlur` then an alpha `feColorMatrix` threshold, then `feComposite` with the source so the label and arrow stay sharp): where they come close, they merge with a liquid neck. `goo` sets the blur radius (how far apart they start to bridge, and how fat the neck is).

**Label.** From `label` (default "Explore more").

**Light and dark.** Tokens only.

**Stroke on.** Nothing extra (an outline would break the goo); harmless.

## Behaviour

- **Hover.** The circle slides left toward the pill until it overlaps the pill's right end by about 30% of its width (spring, 380 ms, slight overshoot); as they approach, the goo filter grows a neck between them, then they fuse into one shape. The arrow rotates −45° to ↗. `jelly` plays as they fuse.
- **Leave.** The circle springs back out to its gap; the neck stretches thin and snaps (with a small wobble on the circle), and the arrow returns to →. `jelly` at lower volume and pitch.
- **Press.** The arrow flies out up-right (translate and fade, 220 ms) and a new arrow slides in from the bottom-left to its place; `whoosh`. Calls `onClick` (no navigation by default; an `href` prop renders it as a link instead).
- Hover starts only on the visible shapes (pill or circle), not on the gap.

## Interaction

- **Pointer.** Hover and press.
- **Keyboard.** One `button` (or link with `href`) labelled by the label text; focus does what hover does; Enter/Space press it with the launch.
- **Touch.** A tap plays fuse and launch together, then un-fuses after 600 ms.
- **Reduced motion.** No slide or goo: on hover the arrow turns only; press launches without the fly-out (a quick fade swap).

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| label | Label | text | up to 24 chars | Explore more | Button text |
| goo | Goo | range | 2–14 | 7 | How liquid the bridge is |
| gap | Gap (px) | range | 0–24 | 8 | Space between pill and circle at rest |
| size | Size | select | S, M, L | M | Button size |
| accent | Colour | select | Ink, Pick | Ink | Fill colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`). Also takes `onClick` and `href`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Fuse on hover | `jelly` | reuse | Soft wobbly boing | volume 0.45 | 1 per 200 ms |
| Pull apart on leave | `jelly` | reuse | Same, softer | volume 0.25, pitch 0.85 | 1 per 200 ms |
| Arrow launches on press | `whoosh` | reuse (from `warp-carousel`) | Airy whoosh | volume 0.45, pitch 1.15 | none |

No new sounds.

## Dependencies

- None. An inline SVG goo filter, the circle's position on a rAF spring, CSS for the arrow.
- `@iconify/react` for the arrows (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 4 seconds; ends apart.

1. The cursor appears below the button ([0.5, 2.0], instant).
2. It glides onto the pill (500 ms): the circle fuses in, the arrow turns; `jelly`.
3. It waits 600 ms and presses: the arrow launches; `whoosh`.
4. It waits 600 ms and glides away (500 ms): they pull apart; `jelly`.

## Card fit and hit areas

The root box spans the pill, gap and circle. On the wall the root is `pointer-events: none` with `auto` on the pill and the circle (not the gap or the filter's blur margin). Check `elementFromPoint` in the gap at rest and around the shapes (card link), and on the pill and circle (component).

## Accessibility and edge cases

- The goo filter region is padded so the blur is not clipped.
- Long labels widen the pill; the circle follows.
- Safari renders SVG filters on HTML content poorly: the shapes are SVG elements (rect and circle) with the label and arrow as HTML laid over them, so only shapes are filtered.

## Acceptance checklist

- [ ] Looks right in light and dark in both colours; label and arrow stay sharp
- [ ] Hover slides the circle in with a liquid neck that fuses; leave stretches and snaps it apart
- [ ] The arrow turns on hover and launches on press
- [ ] Every knob visibly changes it (label, goo, gap, size, colour)
- [ ] `jelly` and `whoosh` respect `sound` and `volume`
- [ ] Focus mirrors hover; touch taps work; reduced motion turns the arrow only
- [ ] Hit areas: the gap falls through to the card link
- [ ] Demo hovers, presses, leaves

## Decisions log

- Press: the arrow launches. (User)
- Goo: SVG goo filter. (User)
- Sound: `jelly` on fuse, `whoosh` on press. (User)
- Play demo: hover, press, leave. (User)
- Knobs: label, goo amount and gap, size and colour. (User)
- Decided by agent:
  - the slug `goo-button` and the tag Hover;
  - the inverted-ink default colour;
  - the shapes are SVG under HTML text so text stays crisp;
  - touch plays fuse and launch on tap.
