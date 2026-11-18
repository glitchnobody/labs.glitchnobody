# Warp carousel

- **Slug:** `warp-carousel` (URL `/warp-carousel`)
- **Number:** 27 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/14.jpg` (glowing cards on a curved track; the centre card faces forward, the side cards bend away like the inside of a cylinder, seen mirrored from behind, their far edges stretched and streaked into motion-blur smears). Only the carousel is used, not the card content. The step player under it follows an image the user supplied in chat (a dark pill with step dots, the active one an elongated bar, and a separate round play button).

## Summary

A carousel of paintings wrapped around a cylinder. Drag or flick it and the cards bend away and smear as they turn; click a side card, use the step player, or let it play by itself.

## Look

**Stage.** About 340 × 240 px: the carousel (about 340 × 190) and the step player below it, 14 px apart.

**Cards.** `count` cards (3–6, default 5), each `cardWidth` px wide (default 150) with a 3:4 ratio, radius 16, placed around the inside of a cylinder whose curvature comes from `bend`. The centre card faces the viewer; cards to the sides turn away and are seen from behind, so they appear mirrored, as in the image.

- On the site: filler paintings via `siteProps.images` (one per card), `object-fit: cover`.
- Exported code: no images; each card is a glowing gradient (two or three hues from a hash of its index, radial blobs on a deep base, like the image's blue, magenta and violet cards), rendered to a canvas texture (see AGENTS.md, "Filler images").

**Smear.** Side cards stretch along the direction of travel: their far edge streaks into horizontal motion-blur lines that fade out (the image's smeared edges), strength from `smear`. The streaks grow with angle from the centre and with the carousel's speed, so a fast flick smears everything and a resting carousel only smears the outer cards slightly.

**Step player** (under the carousel, centred, from the user's image):

- A dark pill, 36 px tall, on `color-mix(in srgb, var(--fill-on) 10%, var(--fill-slab))`, padding 0 12 px, holding one indicator per card, 8 px apart:
  - inactive steps: 8 px dots in `color-mix(in srgb, var(--fill-on) 22%, transparent)`;
  - the active step: an elongated bar, 44 × 8 px, fully rounded, in the same colour, with a fill in `color-mix(in srgb, var(--fill-on) 55%, transparent)` that grows left to right over the autoplay interval while playing (static and full when paused).
  - Dots and the bar morph into each other as the active step changes (width transition, 260 ms).
- A separate round button, 36 px, the same background, 8 px to the right of the pill, with `ph:play-fill` (paused) or `ph:pause-fill` (playing), 16 px in `--fill-on`.

**Light and dark.** The step player uses tokens; the cards are images or gradients.

**Stroke on.** 1 px `--pane-edge` around the player pill and button.

## Behaviour

- **Rendering.** One WebGL canvas. Each card is a quad subdivided into about 24 vertical strips, bent onto the cylinder in the vertex shader (angle = card offset × spacing, curvature from `bend`), with perspective. The fragment shader samples the card texture with a horizontal blur kernel whose length grows with the strip's angle and the carousel's angular velocity, plus a stretch along the travel direction near the far edge, producing the streaks. Back-facing cards are drawn mirrored (no culling), slightly darker.
- **Position.** A continuous `offset` (in cards). Rest positions are whole numbers; the centre card is `round(offset)`, wrapping (an endless loop).
- **Drag.** Pressing anywhere on the carousel and dragging sideways moves `offset` 1:1 with the pointer (one card width per card). On release it continues with the release velocity, decays by `momentum`, and snaps to the nearest card with a spring.
- **Click a side card.** A press without dragging (under 6 px) on a side card spins the carousel so that card is in the centre (the shorter way round).
- **Wheel and arrows.** Horizontal wheel scrolls (snapping after 150 ms of quiet); Left and Right step one card.
- **Autoplay.** On by default: every `interval` seconds it steps one card to the left (spring). Any drag, click, wheel or key pauses it, and it resumes by itself after 4 s without interaction (the active bar shows an empty, waiting state meanwhile). Pressing the play button to pause stops it for good until play is pressed again; pressing play resumes at once; the active bar's fill shows the time to the next step.
- **Step dots.** Clicking a dot goes to that card (shortest way).
- **Sounds.** Each time a card crosses the centre, `whoosh` plays (pitch and volume follow speed); when the carousel snaps to rest, `settle`.

## Interaction

- **Pointer.** Drag, flick, click side cards, click dots, press play. Pointer capture; `touch-action: pan-y` on the carousel so vertical page scroll still works.
- **Keyboard.** The carousel is a focusable region (`role="region"`, `aria-roledescription="carousel"`, label "Paintings"); Left/Right step, Home/End go to the first and last card. The dots are a `tablist`-like group of buttons ("Card 3 of 5"), the play button is a `button` with `aria-pressed` and label "Autoplay". A live region announces "Card 3 of 5". Autoplay pauses while the carousel has focus.
- **Touch.** Swipe sideways; tap side cards.
- **Reduced motion.** No autoplay (the button starts paused), no momentum (release snaps), no smear streaks (bend stays); steps use a 200 ms ease.
- **No WebGL.** A flat row of cards with CSS `rotateY` on a cylinder (no smear), same controls.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| bend | Bend | range | 0–100 | 60 | How strongly the track curves |
| smear | Smear | range | 0–100 | 55 | How much side cards streak and stretch |
| count | Cards | range | 3–6 | 5 | How many cards |
| cardWidth | Card width (px) | range | 100–200 | 150 | Card size |
| interval | Autoplay (s) | range | 1.5–8, step 0.5 | 3 | Seconds between autoplay steps |
| momentum | Momentum | range | 0–100 | 50 | How far a flick carries |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Card count is capped at 6 (the user's choice). Side cards are always shown mirrored, as in the image (no knob).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A card crosses the centre | `whoosh` | new | Airy whoosh | volume 0.25 + 0.4 × min(speed, 1), pitch 0.9 + 0.3 × min(speed, 1) | 1 per 70 ms |
| The carousel snaps to rest | `settle` | reuse | Soft lock-in click | volume 0.45 | 1 per 200 ms |
| Play / pause pressed | `tick` | reuse | Tiny dry tick | volume 0.5 | none |

New sound:

- **Name:** `whoosh`
- **ElevenLabs prompt:** "A short airy whoosh of a large glossy card sweeping past close to the ear, smooth wind swish, soft attack, quick fade, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** about 260 ms

## Dependencies

- None. WebGL 1 (one program, strip-subdivided quads, a blur kernel in the fragment shader), about 200 lines; momentum and springs in rAF. Images are uploaded as textures once loaded (CORS-safe since they are same-origin); gradients are drawn to an offscreen canvas.
- `@iconify/react` for the play and pause icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 7 seconds. Autoplay pauses while the cursor interacts and resumes 4 s after; the demo ends with autoplay paused by the button.

1. The cursor appears below the carousel on the right ([0.9, 0.95], instant).
2. It glides onto the centre card ([0.5, 0.4], 500 ms), presses, flicks left ([0.2, 0.4], 250 ms) and releases. The cards spin and smear, whooshes play, and it snaps two or three cards along with `settle`.
3. It waits 600 ms, glides to the right side card ([0.85, 0.4], 400 ms) and clicks. That card spins to the centre.
4. It waits 600 ms, glides to the play button (500 ms) and presses: autoplay resumes at once, and the active bar starts filling.
5. It waits until one autoplay step happens (about 3 s at the default), presses the play button again to pause, and glides away (500 ms).

## Card fit and hit areas

The carousel canvas covers a rectangle, but its top and bottom corners outside the bent cards are empty. On the wall the root is `pointer-events: none` with `auto` on the canvas, the player pill and the play button. The canvas catches presses across its whole box, so size it tightly to the cards' vertical extent (the cards fill most of it); the space beside and below the player falls through. Check `elementFromPoint` beside the player and below the canvas (card link), on the canvas and the player (component).

## Accessibility and edge cases

- The cards are images with `alt` text carried in the live region ("Card 3 of 5"); the canvas is `aria-hidden`.
- `count` changed while running: cards rebuild and the offset clamps to the new count.
- Fewer than 3 visible side cards at low bend: spacing adapts so cards do not overlap the centre card.
- WebGL context loss: stop the loop, restore on `webglcontextrestored`; create the context lazily when visible (`IntersectionObserver`), as with `heat-text`.
- Tab hidden: autoplay pauses (`visibilitychange`).

## Acceptance checklist

- [ ] Looks like the image: a forward centre card, mirrored bending side cards with smeared edges; player matches the supplied image
- [ ] Drag is 1:1; flicks carry and snap; side-card clicks and dots go the short way round; it loops endlessly
- [ ] Autoplay steps on the interval with the bar filling; interaction pauses it; the button toggles it
- [ ] Wheel and arrows work
- [ ] Every knob visibly changes it (bend, smear, cards, width, autoplay, momentum)
- [ ] Copied code has no `/lab/demoimages/` URLs; gradient cards show without `siteProps`
- [ ] `whoosh`, `settle` and `tick` respect `sound` and `volume`
- [ ] Keyboard and live region work; reduced motion disables autoplay and smear; no-WebGL fallback works
- [ ] Demo flicks, clicks a side card, plays one step and pauses

## Decisions log

- Only the carousel from the image, not the tone-slider card. (User)
- Rendering: WebGL. (User)
- Cards: the filler paintings. (User)
- Control: drag with momentum, click a side card, wheel and arrows, autoplay, and a step player with buttons as in the user's image. (User)
- Sound: a new `whoosh` per card passing centre, `settle` on snap. (User)
- Knobs: bend and smear, card count (max 6) and width, autoplay interval and momentum. (User)
- Play demo: flick, click a side card, press the player. (User)
- Autoplay resumes by itself 4 s after the last interaction, unless paused with the button. (User)
- Decided by agent:
  - the slug `warp-carousel` and the tag Drag;
  - side cards are always mirrored (the mirror knob was not picked);
  - the player's active bar fills with autoplay progress;
  - `tick` for the play button;
  - gradient cards in exported code drawn to a canvas texture;
  - a CSS 3D fallback when WebGL is missing.
