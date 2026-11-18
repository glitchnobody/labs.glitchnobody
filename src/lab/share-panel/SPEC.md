# Share panel

- **Slug:** `share-panel` (URL `/share-panel`)
- **Number:** 48 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/36.mp4` (a Share panel with an "Anyone · Everyone with link can access" toggle and the link with a copy icon; turning the toggle on folds the Invite section away, turning it off brings it back; the video also shows email chips and a people list, which are left out at the user's request). Only the idea is used.

## Summary

A share panel where going public folds the invite list away. Flip "Anyone with the link" on and the Invite section tucks itself under; flip it off and it unfolds again.

## Look

**Panel.** About 260 px wide, radius 16, on `--fill-slab`, padding 14, soft shadow in light mode, `--pane-edge` hairline in dark (one surface).

- **Title:** "Share", 15 px weight 600, `--fill-on`.
- **Access row:** on `color-mix(in srgb, var(--fill-on) 4%, var(--fill-slab))`, radius 12, padding 10: a 28 px round tile with `ph:globe-simple`, "Anyone" (13 px weight 600) over "Everyone with the link can access" (11 px, `--ink-3`), and an iOS-style switch on the right (36 × 20, track `--fill-on` when on, `color-mix(in srgb, var(--fill-on) 18%, transparent)` when off, white knob).
- **Link line:** under the access row, the link text in `--ink-4`, 11 px, ellipsised, with a `ph:copy` icon at the right (visual only).
- **Invite section** (shown when the switch is off): "Invite" (12 px weight 600), then a field (36 px, radius 10, 1 px `--pane-edge` border) with `ph:user-plus` and the placeholder "Enter email to share" in `--ink-4`, and an Invite button inside its right end (28 px tall, on `--fill-on` with `--fill-slab` text, `ph:paper-plane-tilt-fill` and "Invite", 11 px weight 600). The field and button are visual only (the user's choice): the field accepts typing but Invite does nothing beyond a press animation.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the panel (adds one in light mode).

## Behaviour

- **Toggle on (public).** The switch knob slides (CSS `linear()` spring); the Invite section folds away: its content blurs (`blur` px, default 6) and fades while its height animates to 0 and the panel shrinks, at `speed`. `tick` then `collapse`.
- **Toggle off (private).** The switch slides back; the Invite section unfolds: height animates open, content blurs in, rising 4 px. `tick` then `expand`.
- **Start state.** `public` sets the switch on load (default off, so Invite shows).
- **Invite button.** Press animation (scale 0.95) only.

## Interaction

- **Pointer.** Press the switch (or anywhere on the access row).
- **Keyboard.** The switch is a `switch` ("Anyone with the link can access") toggled with Space/Enter; when the Invite section is folded it is `inert`. A live region announces "Link is public" / "Link is private".
- **Touch.** Same.
- **Reduced motion.** No blur or height animation: the section appears and disappears with a 120 ms fade.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| public | Start public | toggle | | false | Switch on at load (Invite folded) |
| speed | Fold speed | range | 0–100 | 60 | How fast the Invite section folds |
| blur | Fold blur (px) | range | 0–16 | 6 | Blur while folding |
| link | Link | text | up to 60 chars | labs.glitchnobody.com/share/453 | The link shown under the access row |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`). Also takes `onChange(isPublic)`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Switch flipped | `tick` | reuse | Tiny dry tick | volume 0.5 | none |
| Invite folds away | `collapse` | reuse | Soft whoosh falling | volume 0.4 | none |
| Invite unfolds | `expand` | reuse | Soft whoosh rising | volume 0.4 | none |

No new sounds (`join` and `pop` from the first plan had no moment once chips and the people list were left out).

## Dependencies

- None. CSS transitions for the switch, height (measured) and blur.
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 4 seconds; ends private (Invite shown).

1. The cursor appears to the right of the panel ([1.15, 0.25], instant).
2. It glides to the switch (500 ms) and presses: public, Invite folds away; `tick`, `collapse`.
3. It waits 1000 ms and presses the switch again (the switch sits above the Invite section, so it has not moved): private, Invite unfolds; `expand`.
4. It waits 600 ms and glides away (500 ms).

## Card fit and hit areas

The panel is a solid rounded rectangle; to keep the modal reachable, on the wall the panel root is `pointer-events: none` with `auto` on the access row, the field and the Invite button. Check `elementFromPoint` in the panel padding and beside the title (card link), and on the switch row and field (component). The panel's height changes; it is anchored at the top so the switch does not move.

## Accessibility and edge cases

- Folding while the field has focus moves focus to the switch.
- Long links ellipsise; the full link is in a `title` attribute.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines it
- [ ] Switching on folds the Invite section with blur and the panel shrinks; switching off unfolds it
- [ ] The switch stays in place while the panel resizes
- [ ] Every knob visibly changes it (start public, fold speed, fold blur, link)
- [ ] `tick`, `collapse`, `expand` respect `sound` and `volume`
- [ ] The switch works by keyboard; the folded section is inert; reduced motion fades
- [ ] Demo toggles on and off

## Decisions log

- Scope: the toggle folds the Invite section; no email chips or people list. (User)
- Invite field and button: visual only. (User)
- Sound: `tick`, `expand`/`collapse`. (User)
- Play demo: toggle on and off. (User)
- Knobs: start public, fold speed and blur, link text. (User)
- Decided by agent:
  - the slug `share-panel` and the tag Press;
  - the default link `labs.glitchnobody.com/share/453`;
  - the panel is anchored at the top so the switch never moves;
  - the copy icon is visual only.
