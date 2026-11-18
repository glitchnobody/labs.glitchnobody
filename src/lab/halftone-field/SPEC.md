# Halftone field

- **Slug:** `halftone-field` (URL `/halftone-field`)
- **Number:** 44 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/32.mp4` (a grid of small dots in which the dots near the pointer swell into large dots that merge into a dark blob, like a halftone print of a soft light; the field also flips between dark-on-light and light-on-dark). No flip here; a click ripple instead. Only the idea is used.

## Summary

A halftone dot field that swells under your pointer. Move across it and the dots grow and melt together behind you; click to send a ripple of big dots outward.

## Look

**Panel.** 320 × 220 px, radius 16, with a 1 px `--pane-edge` border, so it reads as a bounded field on the card.

**Dots.** A square grid, 14 px apart, each dot at rest 2.5 px across. Shape from `shape`: Circle (default), Square, Diamond. Colour: `--fill-on` dots on transparent (default), or with `inverted` on, the panel fills with `--fill-on` and the dots are `--fill-slab` (the video's light-on-dark look).

**Swell.** Near the pointer, dots grow up to `strength` × the spacing (default 1.15, so neighbours overlap and merge into a blob), falling off smoothly with distance over `radius` px (default 70). The merge is drawn in the shader so overlapping dots join with smooth necks (a smooth-min of distance fields), as in the video's blob.

**Light and dark.** Tokens only (read at mount and when the Fill switch changes, as in `heat-text`).

**Stroke on.** The panel already has a hairline; harmless.

## Behaviour

- **Rendering.** One WebGL fragment shader over the panel: for each pixel, find the nearest grid dot, compute that dot's radius from the influence field, and shade by its signed distance (anti-aliased with `fwidth`), with a smooth-min across the 4 nearest dots for merging. Influence is the sum of a pointer blob and any active ripples.
- **Trail.** The blob's centre follows the pointer with lag: it eases toward the pointer each frame by a factor from `lag` (0 = glued to the pointer, 100 = slow and floaty), so fast moves leave a stretched trail of swollen dots. When the pointer leaves, the blob shrinks away over 400 ms.
- **Ripple.** A click sends a ring outward from the click point at about 300 px/s: dots in the ring swell (to 0.9 × spacing) and shrink behind it; the ring fades after crossing the panel. Several ripples can overlap. `jelly` plays.
- **Fast sweeps.** When the pointer moves faster than about 1,200 px/s, `whoosh` plays (rate-limited).
- **Loop.** Stops when there is no blob and no ripple; pauses off screen; the WebGL context is created lazily when visible.

## Interaction

- **Pointer.** Hover to swell; click to ripple.
- **Keyboard.** The panel is focusable (`role="img"`, label "Halftone dot field"); Enter or Space sends a ripple from the centre.
- **Touch.** Dragging a finger swells the dots under it (`touch-action: pan-y` so vertical scroll works); tap ripples.
- **Reduced motion.** No trail lag (the blob sits under the pointer) and ripples are replaced by a single 200 ms swell at the click point.
- **No WebGL.** A Canvas 2D version that draws plain circles (no merging necks), same behaviour.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| radius | Swell radius (px) | range | 20–160 | 70 | How far from the pointer dots grow |
| strength | Swell strength | range | 0.3–1.6, step 0.05 | 1.15 | Largest dot size, as a share of the spacing |
| lag | Trail lag | range | 0–100 | 45 | How far the blob lags behind the pointer |
| shape | Dot shape | select | Circle, Square, Diamond | Circle | Dot shape |
| inverted | Inverted | toggle | | false | Light dots on a dark field |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A fast sweep | `whoosh` | reuse (from `warp-carousel`) | Airy whoosh | volume 0.25 + 0.3 × min(speed / 3000, 1) | 1 per 400 ms |
| A click ripple | `jelly` | reuse (from `jelly-slider`) | Soft wobbly boing | volume 0.45, pitch 1 ± 5% random | 1 per 150 ms |

No new sounds. Slow hovering is silent.

## Dependencies

- None. WebGL 1, one fragment shader and a full-panel quad, uniforms for the blob and up to 6 ripples; about 120 lines.
- No icons.

## Play demo

Agreed with the user (sweep only). About 4 seconds.

1. The cursor appears to the left of the panel ([-0.05, 0.3], instant).
2. It sweeps across the panel in a gentle curve to the right and down ([1.05, 0.7], 2200 ms): dots swell and merge behind it with the trailing lag.
3. It curves back to the middle and out the bottom ([0.5, 1.1], 900 ms).
4. The blob shrinks away.

## Card fit and hit areas

The panel is a rounded rectangle and it is the component. Check `elementFromPoint` just outside its corners (card link) and inside (component). The stage around the panel opens the modal.

## Accessibility and edge cases

- Decorative (`role="img"`).
- High-DPI: the canvas uses `devicePixelRatio` up to 2.
- WebGL context loss: stop and restore.
- Inverted mode with Stroke: the border sits outside the filled panel.

## Acceptance checklist

- [ ] Looks right in light and dark, normal and inverted, in all three shapes
- [ ] Dots swell and merge smoothly near the pointer; the blob trails with the lag setting
- [ ] Clicks send ripples that overlap cleanly
- [ ] Every knob visibly changes it (swell radius, strength, trail lag, shape, inverted)
- [ ] `whoosh` on fast sweeps and `jelly` on ripples respect `sound` and `volume`
- [ ] Enter/Space ripples; reduced motion removes lag and ripples; no-WebGL fallback draws
- [ ] Demo sweeps across

## Decisions log

- Behaviour: the pointer swells dots; clicks ripple. No flip. (User)
- Rendering: WebGL shader. (User)
- Sound: `whoosh` on fast sweeps, `jelly` on ripples. (User)
- Play demo: sweep only. (User)
- Knobs: swell radius and strength, trail lag, dot shape and inverted. (User)
- Decided by agent:
  - the slug `halftone-field` and the tag Hover;
  - the 14 px grid and 2.5 px resting dots (not knobs);
  - smooth-min merging of neighbouring dots;
  - a bordered panel so the card keeps empty space;
  - a Canvas 2D fallback.
