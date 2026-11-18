# Photo folder

- **Slug:** `photo-folder` (URL `/photo-folder`)
- **Number:** 11 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/02.gif` (an off-white folder whose four photos pop up out of the pocket one after another with a springy overshoot). Only the idea is used.

## Summary

A folder with photos tucked in its pocket. Hover it and the photos slide up out of the pocket and fan out; move away and they sink back in.

## Look

**Folder.** About 220 × 140 px, built from two layers so the photos sit between them:

- **Back panel** with a tab at the top left (when `tab` is on): a rounded rectangle (radius 18) plus a tab about 40% of the width with a smooth S-curve shoulder, drawn as one SVG path or `clip-path`.
- **Photos** between the layers.
- **Front pocket:** a rounded rectangle (radius 18) covering the lower 60% of the folder, with a soft inner top highlight (1 px lighter line) and a faint shadow cast upward onto the photos, so they look tucked in.

**Folder style** (`folderStyle`):

| Style | Back panel | Pocket |
| ----- | ---------- | ------ |
| Paper (default, the gif's look) | `color-mix(in srgb, var(--fill-on) 5%, var(--fill-slab))` | `--fill-slab` with a soft shadow |
| Tinted | `color-mix(in srgb, var(--pick) 30%, var(--fill-slab))` | `color-mix(in srgb, var(--pick) 18%, var(--fill-slab))` |
| Dark | `color-mix(in srgb, var(--fill-on) 80%, var(--fill-slab))` | `color-mix(in srgb, var(--fill-on) 70%, var(--fill-slab))` |

**Photos.** `count` photos (default 4), each about 64 × 56 px, radius 8, a 2.5 px white border (`--fill-slab`) and a small shadow. At rest only their top third peeks out of the pocket, overlapping left to right, each with a small resting tilt (−6°, +4°, −3°, +5°, −4°, +3°), as in the gif.

- On the site: filler paintings via `siteProps.images` (`object-fit: cover`).
- Exported code: gradient fills from a hash of each photo's index and title (see AGENTS.md, "Filler images").

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` on the back panel and the pocket.

## Behaviour

- **Rest.** Photos peek out of the pocket.
- **Hover (rise and fan).** The photos slide up out of the pocket by `rise` px (default 34), one after another (40 ms stagger, left to right), with a springy overshoot like the gif. As they rise they fan: each rotates away from the centre up to `fan` degrees (outermost photos the most) and spreads sideways a little, pivoting near its bottom edge. The new `slide` sound plays once as they start.
- **Leave (sink).** They sink back to rest in reverse order (right to left), with a softer spring; `slide` plays at lower pitch and volume.
- **Interrupting.** Hovering again mid-sink retargets from the current positions (motion springs handle this).
- **Appear.** On mount the photos rise from fully hidden into the resting peek with the staggered pop (the gif's motion), silently.

## Interaction

- **Pointer.** Hover only. Hovering the folder's visible shape (back panel, tab, pocket or a photo) triggers the rise.
- **Keyboard.** The folder is focusable (`tabindex=0`, `role="img"` with `aria-label="Folder with 4 photos"`); focus rises and fans it like hover, blur sinks it.
- **Touch.** A tap toggles risen and rest.
- **Reduced motion.** No springs or stagger: the photos fade to the risen and fanned pose over 150 ms and back.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| count | Photos | range | 2–6 | 4 | How many photos are in the folder |
| rise | Rise (px) | range | 10–60 | 34 | How far photos slide up on hover |
| fan | Fan (°) | range | 0–30 | 14 | How far the outer photos rotate when fanned |
| folderStyle | Folder | select | Paper, Tinted, Dark | Paper | Folder colours |
| tab | Tab | toggle | | true | The folder tab on the back panel |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Seven knobs; the user picked these and left out spring and stagger knobs and the idle peek.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Photos rise | `slide` | new | Soft paper sliding out of an envelope | volume 0.6, pitch 1 ± 3% | 1 per 250 ms |
| Photos sink | `slide` | reuse (same file) | Same, lower | volume 0.4, pitch 0.85 | 1 per 250 ms |

New sound:

- **Name:** `slide`
- **ElevenLabs prompt:** "A soft short slide of glossy photo prints being pulled up out of a paper envelope, light papery friction, gentle, dry, close, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** about 250 ms

## Dependencies

- `motion` (the user's choice) for the staggered, interruptible springs. Import `motion/react` with `LazyMotion` and `domAnimation` (about 15 kB gz): this component needs no layout or drag features, so the smaller `domAnimation` bundle is enough; switch to `domMax` only if a later change needs layout.
- No icons.
- Set `install: "npm install motion"`.

## Play demo

Agreed with the user (hover only). About 3 seconds.

1. The cursor appears below and to the right of the folder ([0.95, 0.95], instant).
2. It glides onto the pocket's centre (500 ms). The photos rise and fan with the stagger; `slide` plays.
3. It holds for 1500 ms.
4. It glides away (500 ms). The photos sink back; `slide` plays lower.

## Card fit and hit areas

The folder's box includes the empty space above the pocket to the right of the tab, and the space the risen photos move into. On the wall the root is `pointer-events: none`, with `auto` on the back panel shape (clipped to the tab outline with `clip-path`), the pocket and the photos. Because the risen photos leave the back panel, hover is tracked on the root's visible parts with a short leave delay (80 ms) so moving from the pocket onto a risen photo does not sink them. Check `elementFromPoint` to the right of the tab above the panel (card link), on the tab, on the pocket and on a peeking photo.

## Accessibility and edge cases

- The photos are decorative (`aria-hidden`); the folder's label states the count.
- `count` changed while risen: new photos enter at the risen pose, removed ones sink and fade.
- `fan` 0: photos rise straight with their small resting tilts only.
- Missing images: gradient fills, no layout shift.
- The filler PNGs are large; use `loading="lazy"` and `decoding="async"` (see the note in COMPONENTS.md).

## Acceptance checklist

- [ ] Looks right in light and dark in all three folder styles; stroke outlines the folder
- [ ] Photos peek at rest, rise and fan on hover with stagger and overshoot, sink in reverse on leave
- [ ] The mount pop matches the gif's staggered pop
- [ ] Every knob visibly changes it (photos, rise, fan, folder, tab)
- [ ] Copied code has no `/lab/demoimages/` URLs; gradients show without `siteProps`
- [ ] `slide` plays on rise and lower on sink, respecting `sound` and `volume`
- [ ] Focus rises it, tap toggles it on touch; reduced motion fades
- [ ] Demo hovers and leaves, ending at rest

## Decisions log

- Behaviour: hover rises and fans the photos; no press action. (User)
- Motion: `motion` with the `domAnimation` bundle. (User)
- Sound: a new paper-slide sound. (User)
- Play demo: hover only. (User)
- Knobs: photo count, rise, fan, folder style with tab. (User)
- Decided by agent:
  - the slug `photo-folder` and the tag Hover;
  - the sink plays the same `slide` lower and quieter (confirmed by the user afterwards);
  - the folder style colours;
  - the silent mount pop;
  - tap toggles on touch, focus works like hover;
  - the 80 ms leave delay so moving onto a risen photo does not sink them.
