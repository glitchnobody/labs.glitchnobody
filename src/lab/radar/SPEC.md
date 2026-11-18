# Radar

- **Slug:** `radar` (URL `/radar`)
- **Number:** 6 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** a screenshot the user supplied (a green phosphor radar: concentric rings, a crosshair, a rotating sweep line with a fading wedge, a centre dot, one blip, one highlighted inner ring).

## Summary

A nearby-people radar whose sweep pings each blip as it passes. Press a blip to see who it is and how far away; press empty radar to drop a new one.

## Look

**Overall.** A circle at `size` px (default 300 px on the wall card), made of three layers:

1. Background disc in a dark surface in dark mode (`--surface-2`). In light mode it is pale (`--surface-3`) with deeper-coloured lines.
2. SVG with `rings` concentric rings: 1 px, in `color-mix(in srgb, var(--fill-on) 10%, transparent)`. The crosshair (if `crosshair` is on) is a horizontal and a vertical hairline through the centre, in the same colour at 6%.
3. The sweep: a line from the centre to the edge in the radar colour (2 px, slightly glowing), plus the wedge behind it. The wedge is a `conic-gradient` from the radar colour at 45% opacity, at the line, to transparent at `wedge` degrees behind it, clipped to the disc. A brighter 2 px arc runs along the wedge's outer edge, as in the reference.

**Centre.** A solid dot in the radar colour, about 9% of the diameter.

**Blips.** Small dots, 2.5% of the diameter, in the radar colour, each with a faint halo ring. A blip is dim (opacity 0.15) until the sweep passes. It then flashes to full brightness with its halo expanding once, and fades back over `afterglow` seconds.

**Selected blip.** It grows into a circular avatar, 11% of the diameter, with a 2 px radar-colour ring. A label pill beside it reads "Mika · 12 m" (on `--fill-slab` with a hairline, `--fill-on` text, 12 px; flips to the left side when near the right edge). The ring at its distance (a full circle through the blip) glows in the radar colour, like the reference's highlighted inner ring.

**Avatars.** On the site, photos come from `/lab/avatars/` via `siteProps`. In exported code they are gradient circles from the name hash (see AGENTS.md, "People images").

**Colour** (`color`). The colours are defined in the component's CSS as a light/dark pair each, following the Fill switch:

| Option | Dark | Light |
| ------ | ---- | ----- |
| Phosphor | `#3ddc84` | `#18934d` |
| Amber | `#ffb020` | `#b7791f` |
| Accent | `--pick` | `--pick` |
| Ink | `--fill-on` | `--fill-on` |

**Light and dark.** As above.

**Stroke on.** A 1 px `--pane-edge` outline around the disc.

## Behaviour

- **Sweep.** The sweep rotates continuously at `speed` (one turn every 8 s at 0, every 1.5 s at 100; default about 4 s). It runs clockwise and is driven by `requestAnimationFrame` with a CSS custom property `--angle` that feeds both the line's rotation and the conic gradient, so they stay locked together.
- **Ping detection.** Each frame, any blip whose angle the sweep crossed since the last frame gets pinged: it flashes, its halo expands once, and the `ping` sound plays.
- **Blips.** `blips` blips are placed with a seeded random angle and a distance (20–95% of the radius), so they are the same on every load. Each has a name and a distance in metres (radius = 50 m). With `moving` on, each blip drifts slowly (a few px per second, smooth noise) and stays within the disc. Selection and labels follow it.
- **Select.** Pressing a blip selects it: it scales up into the avatar with a spring, the label fades in, and its distance ring draws in (stroke-dashoffset, 300 ms). Pressing it again, pressing another blip, or pressing Esc deselects it. The avatar shrinks back into a dot.
- **Drop.** Pressing empty radar inside the disc drops a new blip there: it pops in at full brightness, then dims and waits for the sweep. It gets the next name from the list. Up to 12 blips; the oldest dropped one is removed beyond that.
- **Offscreen.** The rAF loop pauses when the component is offscreen (IntersectionObserver) or the tab is hidden.

## Interaction

- **Pointer.** Press a blip to select it, press empty disc to drop a blip, press outside the disc to do nothing (it falls through to the card link on the wall).
- **Keyboard.**
  - The radar is a `group` labelled "Nearby radar, 4 people".
  - Blips are buttons labelled "Mika, 12 metres". Tab cycles through them in order of distance.
  - Enter or Space selects; Esc deselects.
  - Pressing N drops a blip at a random spot (announced).
- **Touch.** Same as pointer, with `touch-action: manipulation`. Blip hit targets are at least 24 px regardless of the drawn dot size.
- **Reduced motion.**
  - The sweep does not rotate. Instead, all blips softly pulse in turn (one at a time, on the same timing a sweep would give), so pings and sounds still happen in order.
  - The wedge is hidden and the line is drawn faintly.
  - Selection has no spring.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| speed | Sweep speed | range | 0–100 | 50 | How fast the sweep turns (8 s to 1.5 s per turn) |
| wedge | Wedge (°) | range | 0–120 | 60 | Width of the fading wedge behind the line |
| afterglow | Afterglow (s) | range | 0.3–4, step 0.1 | 1.6 | How long a blip stays lit after a ping |
| rings | Rings | range | 2–8 | 5 | Number of distance rings |
| blips | People | range | 0–8 | 4 | Starting number of blips |
| moving | Moving blips | toggle | | false | Blips drift slowly like moving people |
| crosshair | Crosshair | toggle | | true | Horizontal and vertical lines through the centre |
| color | Colour | select | Phosphor, Amber, Accent, Ink | Phosphor | Radar colour |
| size | Size (px) | range | 200–420 | 300 | Diameter |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

**People** (in order; distances are computed from placement):

| Name | Avatar (site only) |
| ---- | ------------------ |
| Mika | 12 |
| Ana | 15 |
| Nathan | 21 |
| Oğuz | 01 |
| Mariana | 06 |
| Afshin | 24 |
| Ashish | 03 |
| June | 30 |
| Theo | 37 |
| Sana | 44 |
| Leo | 50 |
| Ines | 18 |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The sweep crosses a blip | `ping` | new | Soft sonar ping | pitch 1.4 (centre) → 0.8 (edge) by distance; volume 0.7 → 0.3 by distance | 1 per 60 ms; a blip pings at most once per turn |
| A blip is dropped | `pop` | reuse | Bubbly pop | volume 0.7 | once |
| A blip is selected or deselected | `tick` | reuse | Tiny dry tick | pitch 1.2 selecting, 0.9 deselecting | none |

Pings only play while the radar is on screen and the tab is visible. On the wall, with many cards, that keeps it from pinging in the background.

New sound:

- **Name:** `ping`
- **ElevenLabs prompt:** "A soft clean sonar ping, a single gentle pure tone with a short shimmering tail, like a submarine radar detecting something, subtle, no reverb wash"
- **duration_seconds:** 0.8 · **prompt_influence:** 0.7 · **loop:** false
- **Trim to:** about 450 ms (keep a little of the tail, with a fade-out)

## Dependencies

None. SVG and CSS conic-gradient are driven by a `requestAnimationFrame` loop. Selection springs use CSS `linear()`.

## Play demo

Agreed with the user. About 7 seconds; ends in the starting state.

1. The cursor appears below and to the right of the radar while it sweeps.
2. It glides onto the blip nearest the top right (600 ms) and presses. The blip grows into an avatar, "Mika · 12 m" appears, its ring glows, and `tick` plays.
3. It waits 1 s while the sweep keeps pinging the others.
4. It glides to an empty spot in the lower left of the disc (500 ms) and presses. A new blip pops in and `pop` plays.
5. It waits until the sweep pings the new blip (about 1.5 s at the default speed).
6. It glides back to the selected blip (500 ms) and presses. It deselects and `tick` plays.
7. It glides away (500 ms). The dropped blip fades out over 600 ms at the end of the demo (the component exposes a reset for the demo, or the demo's last step is a long press on it; choose at build).

The demo coordinates must use the seeded blip positions; measure them in the browser.

## Card fit and hit areas

Only the disc reacts; the square corners around it must fall through to the card link. On the wall, clip the root with `clip-path: circle(50%)`, or use `border-radius: 50%` with hit testing on the disc element only. Blip buttons and the label sit inside the disc; the label may overhang the edge slightly but is pointer-transparent. Check `elementFromPoint` at the four corners of the bounding box (card link), just inside the edge (disc) and at a blip (blip button).

## Accessibility and edge cases

- Pings are not announced, which would be too noisy. Selecting announces "Mika, 12 metres"; dropping announces "Added June, 30 metres".
- `blips` set to 0 is an empty radar, still sweeping; dropping still works.
- Lowering `blips` removes the starting blips beyond the count (and deselects one if it was removed).
- Blips near the centre dot are not placed within 15% of the radius, so the dot never hides them.
- At very high speed, the crossing check uses the angle travelled since the last frame, so no blip is skipped.
- With `moving` on, a selected blip keeps its label attached and its ring follows its distance.

## Acceptance checklist

- [ ] Looks right in light and dark for all four colours; stroke outlines the disc
- [ ] The sweep line and wedge rotate locked together; the outer arc is brighter
- [ ] Blips flash when crossed and fade over `afterglow`
- [ ] Selecting shows the avatar (photo on the site, gradient in the copied code), the label and the glowing distance ring
- [ ] Dropping adds a blip that gets pinged on the next pass
- [ ] Every knob visibly changes it (speed, wedge, afterglow, rings, people, moving, crosshair, colour, size)
- [ ] `ping` pitch and volume follow distance; `pop` and `tick` play; all respect `sound` and `volume`; silent when offscreen
- [ ] Keyboard: Tab through blips, Enter selects, Esc deselects, N drops; reduced motion pulses blips in turn
- [ ] Corners of the card fall through to the modal link
- [ ] Demo runs select → drop → deselect and ends in the starting state

## Decisions log

- Purpose: a nearby scanner with continuous sweep, pinged blips, select and drop. (User)
- Rendering: SVG and a CSS conic-gradient wedge. (User)
- Colour: a knob (Phosphor, Amber, Accent, Ink), default green, with light/dark pairs. (User)
- Sound: new `ping` per blip pitched by distance; reuse `pop` for drop and `tick` for select. (User; sounds suggested by agent)
- Selection: avatar, name and distance, with a glowing distance ring. (User)
- Play demo: select, drop, deselect. (User)
- Extra knobs: afterglow, crosshair, moving blips, sweep speed. (User)
- Decided by agent:
  - clockwise only (direction was not picked);
  - the radius represents 50 m;
  - the name list and avatar picks;
  - a maximum of 12 blips;
  - the N key drops a blip;
  - silent and paused when offscreen;
  - reduced motion pulses blips in turn instead of sweeping;
  - the colour hex values.
