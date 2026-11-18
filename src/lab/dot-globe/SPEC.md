# Dot globe

- **Slug:** `dot-globe` (URL `/dot-globe`)
- **Number:** 32 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/19.mp4` (a slowly rotating Earth drawn as a grid of small dots on a blue field, lighter dots for land, dimmer for sea). Colours here come from the tokens instead of the blue field. Only the idea is used.

## Summary

A spinning globe made of dots. Hover it to swell the dots under a lens, or grab it and flick it spinning; it coasts back to its slow turn.

## Look

**Globe.** A sphere about 240 px across, centred in a 280 × 280 stage, drawn with WebGL points:

- **Land dots** in the `accent` colour (Ink `--fill-on` default, Pick `--pick`, Ok `--ok`), `dotSize` px (default 2.4).
- **Sea dots** (when `sea` is on) in `color-mix(in srgb, var(--fill-on) 16%, transparent)`, 70% of the land dot size.
- Dots on the far side are hidden; dots near the limb fade and shrink slightly (by the cosine of the angle to the viewer) so the sphere reads as round. No outline or shading beyond that.

The dots sit on a latitude-longitude grid with density from `density` (default about 2,400 dots on the full sphere at 100 rows), spaced evenly by area (fewer dots per row toward the poles) so there is no polar crowding.

**Land data.** A low-resolution land mask (equirectangular, 256 × 128 bits, about 4 kB packed and base64-encoded in the component), generated once at build time from Natural Earth's public-domain 1:110m land polygons. Note the source in a comment at the top of the file.

**Lens.** Under the pointer, dots within `lens` px (default 46) grow by up to `lensStrength` (default 1.8×) with a smooth falloff and turn fully opaque; the lens eases in and out over 150 ms.

**Light and dark.** Tokens only: the canvas is transparent on the card and reads the token colours at mount and when the Fill switch changes (a `MutationObserver` on the theme attributes, as in `heat-text`).

**Stroke on.** Nothing to outline; harmless.

## Behaviour

- **Idle spin.** Rotates about its axis at `speed` (degrees per second, default 8), with the axis tilted by `tilt` degrees (default 18) toward the viewer.
- **Drag.** Pressing on the globe and dragging rotates it like a trackball (horizontal drag spins around the axis, vertical drag tilts within ±60°). The idle spin stops while held.
- **Flick.** Releasing keeps the angular velocity, which decays (friction about 2.5 per second) back toward the idle spin; the tilt eases back to `tilt`. A flick faster than 180°/s plays `whoosh`. When the motion settles into the idle spin, `settle` plays.
- **Hover lens.** Without pressing, moving over the globe shows the lens. It hides while dragging.
- **Render loop.** Pauses when off screen (`IntersectionObserver`) or the tab is hidden; the WebGL context is created lazily when first visible.

## Interaction

- **Pointer.** Hover for the lens; drag or flick to spin. Pointer capture; `touch-action: none` on the canvas.
- **Keyboard.** The globe is focusable (`role="img"`, label "Spinning globe"); Left/Right nudge the spin by 30°/s with a decay like a flick, Up/Down tilt.
- **Touch.** Drag and flick work; no lens (no hover).
- **Reduced motion.** No idle spin (a static view centred on 0° longitude); dragging still rotates directly, but releasing stops at once with no coasting.
- **No WebGL.** A static Canvas 2D drawing of the dots at the current angle, no lens.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| density | Dots | range | 40–160 (rows) | 100 | How fine the dot grid is |
| dotSize | Dot size (px) | range | 1–5, step 0.2 | 2.4 | Dot size |
| speed | Spin (°/s) | range | 0–40 | 8 | Idle rotation speed |
| tilt | Tilt (°) | range | 0–40 | 18 | Axis tilt toward the viewer |
| lens | Lens (px) | range | 0–100 | 46 | Magnifier radius; 0 turns it off |
| lensStrength | Lens strength | range | 1–3, step 0.1 | 1.8 | How much dots grow under the lens |
| accent | Land | select | Ink, Pick, Ok | Ink | Land dot colour |
| sea | Sea dots | toggle | | true | Show faint dots over the oceans |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A fast flick (over 180°/s) | `whoosh` | reuse (from `warp-carousel`) | Airy whoosh | volume 0.3 + 0.4 × min(speed / 720, 1), pitch 0.9 + 0.3 × the same | 1 per 300 ms |
| Spin settles back to idle | `settle` | reuse | Soft lock-in click | volume 0.35 | 1 per 600 ms |

No new sounds; no pings (the user's choice).

## Dependencies

- None. WebGL 1 with one point-sprite program (round dots via `gl_PointCoord`), positions precomputed once per density, rotation and lens as uniforms; about 150 lines. A build-time script (not shipped) packs the Natural Earth land mask.
- No icons.

## Play demo

Agreed with the user (flick only). About 4 seconds.

1. The cursor appears to the left of the globe ([0.05, 0.5], instant).
2. It glides onto the globe's left side ([0.3, 0.5], 400 ms) and presses.
3. It drags right quickly ([0.75, 0.48], 200 ms) and releases: the globe spins fast, `whoosh` plays.
4. It glides away (500 ms) while the globe coasts back to the idle spin (about 2 s), and `settle` plays.

## Card fit and hit areas

The canvas is square but the globe is round; the corners must fall through. Clip the canvas element with `clip-path: circle(50%)` (sized to the globe), so hit testing follows the circle. Check `elementFromPoint` at the stage corners and just outside the globe's edge (card link), and just inside the edge and at the centre (component).

## Accessibility and edge cases

- The globe is decorative (`role="img"` with a short label).
- Density 160 with large dots: dots overlap into a solid; acceptable at the user's setting.
- High-DPI: point size scales with `devicePixelRatio` (capped at 2).
- WebGL context loss: stop and restore, as in `heat-text`.

## Acceptance checklist

- [ ] Recognisable continents in dots; looks right in light and dark with each land colour
- [ ] Idle spin with tilt; drag rotates like a trackball; flicks coast back to idle
- [ ] The hover lens swells dots smoothly and hides while dragging
- [ ] Every knob visibly changes it (dots, dot size, spin, tilt, lens, lens strength, land, sea dots)
- [ ] `whoosh` on fast flicks and `settle` on return respect `sound` and `volume`
- [ ] Keyboard nudges work; reduced motion is static until dragged; no-WebGL fallback draws
- [ ] Hit area is the circle; corners fall through
- [ ] Demo flicks and coasts back

## Decisions log

- Behaviour: drag to spin with momentum; hover magnifies dots. No city pings. (User)
- Rendering: WebGL points. (User)
- Colours: tokens. (User)
- Sound: `whoosh` on flicks, `settle` on return; no `ping`. (User)
- Knobs: dot density and size, spin speed and tilt, lens size and strength, land colour and sea dots. (User)
- Play demo: flick only. (User)
- Decided by agent:
  - the slug `dot-globe` and the tag Drag;
  - the land mask from Natural Earth (public domain), packed into the component;
  - area-even dot spacing;
  - trackball dragging with tilt limited to ±60°;
  - a Canvas 2D static fallback without WebGL;
  - the circular clip for hit testing.
