# <Name>

<!-- Copy to src/lab/<slug>/SPEC.md and fill every section. Delete these comments. -->

- **Slug:** `<slug>` (URL `/<slug>`)
- **Number:** <n> / 60
- **Tag:** <one of Hover, Press, Drag, Slide, Swipe, Type, Select, Loading, or a new one>
- **Status:** spec

## Summary

One or two sentences: what it is, then how to play with it. This becomes the `description` in `meta.ts`.

## Look

- Shape, layout and size at its natural size on a wall card (cards are roughly 360 × 300 px of usable stage).
- Typography, surfaces, borders and the tokens used, all from the scales in `DESIGN.md` (component type steps, radius roles `--r-card` / `--r-control` / `--r-panel` / `--r-pill`, shadows) (`--fill-slab`, `--fill-on`, `--ink` … `--ink-5`, `--pane-edge`, `--card`, `--pick`, `--ok`).
- Light mode and dark mode: anything that differs beyond the tokens swapping.
- Stroke on: what gets the hairline, or "nothing".

## Behaviour

States (idle, hover, active, done, error, …) and what moves between them. Describe motion: what animates, how long, which easing, any spring or physics.

## Interaction

- Pointer: what hover, press, drag and release do.
- Keyboard: focus, keys and what they do; roles and labels.
- Touch: anything different on touch.
- Reduced motion: what replaces the motion.

## Configuration (knobs)

Every knob is a prop of the same name. Aim for 6 to 12. Always include `sound` and `volume`.

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| sound | Sound | toggle | | true | Turns the component's sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |

For each **new** sound:

- **Name:** `<name>`
- **ElevenLabs prompt:** "<prompt>"
- **duration_seconds:** <0.5 or more> · **prompt_influence:** <0–1> · **loop:** false
- **Trim to:** <ms>

## Dependencies

"None" (preferred), or the options offered and the one the user chose, with size and reason.

## Play demo

What pressing the card's play button shows, agreed with the user: the pretend cursor's script as numbered steps (where it goes, what it presses or drags, what the viewer sees at each step), how it leaves the component in a clean state, and the total length (4 to 8 seconds).

## Card fit and hit areas

What part of the component should react on the wall card, and where the empty space is (which must fall through to open the modal).

## Accessibility and edge cases

Screen reader text, focus order, very small or very large knob values, rapid input, resizing.

## Acceptance checklist

- [ ] Looks right in light and dark
- [ ] Every knob visibly changes it
- [ ] Every listed sound plays at its moment, respects `sound` and `volume`
- [ ] Keyboard works; reduced motion respected
- [ ] Demo shows the main interaction and leaves a clean state
- [ ] <component-specific checks>

## Decisions log

Questions asked and the user's answers, and anything decided on the user's behalf.
