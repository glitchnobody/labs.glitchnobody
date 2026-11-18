# Update button

- **Slug:** `update-button` (URL `/update-button`)
- **Number:** 39 / 60
- **Tag:** Loading
- **Status:** spec
- **Design reference:** `~/Downloads/inso/27.mp4` (a grey pill button that goes "Update" → a counting percentage "3% … 72% … 100%" → "Install" → shrinks to a circle with a filling ring → "Restart" → ring → back; its letters morph between words and numbers). Here one press runs the whole sequence. Only the idea is used.

## Summary

An update button that does the whole job in one press. It counts the download, installs, restarts and reports "Up to date", morphing its label letter by letter between steps.

## Look

**Pill.** 40 px tall, fully rounded, padding 0 18, on `color-mix(in srgb, var(--fill-on) 8%, var(--fill-slab))`, label 14 px weight 600 in `--fill-on`, tabular figures. Width fits the label and animates between labels.

**Circle.** During install and restart, the pill shrinks to a 40 px circle with a ring inside: a 22 px circle, 2.5 px stroke, track in `color-mix(in srgb, var(--fill-on) 15%, transparent)` and progress in the `accent` colour (Ink `--fill-on` default, Pick `--pick`, Ok `--ok`), filling clockwise from the top.

**Done.** "Up to date" with `ph:check-bold` in the accent.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the pill.

## Behaviour

One press on "Update" runs the enabled steps in order, then resets:

1. **Download** (when `download` is on, 3 s): the label morphs from "Update" to "0%", then counts to "100%" with an ease-in-out curve and small random pauses (so it looks real); the digits roll.
2. **Install** (when `install` is on): the label morphs to "Install" for 500 ms, then the pill shrinks into the circle and the ring fills over 1.5 s.
3. **Restart** (when `restart` is on): the circle grows back into a pill reading "Restart" for 500 ms, then shrinks again and the ring fills over 1.2 s.
4. **Done:** the pill grows to "Up to date ✓" and holds 1.5 s, then morphs back to "Update".

`settle` plays at the end of each step and on done. With every step off, the press goes straight to "Up to date".

**Label morph.** Per character: characters shared between the old and new label (same character at the aligned position) stay; others blur out (6 px, fade, 120 ms) and the new ones blur in, staggered 15 ms left to right. The pill's width transitions to the new label's measured width (CSS `linear()` spring). Pill ↔ circle is a width and padding transition.

**No cancel.** While running, the button is `aria-disabled` and presses are ignored (the user's choice).

## Interaction

- **Pointer.** Press "Update".
- **Keyboard.** A `button` labelled with the current label; Enter/Space start it. A live region announces each step ("Downloading", "Installing", "Restarting", "Up to date") and the download percentage every 25%.
- **Touch.** Same.
- **Reduced motion.** Labels cross-fade without blur; the pill changes size without the spring; the percentage still counts.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| download | Download step | toggle | | true | The counting percentage |
| install | Install step | toggle | | true | The Install label and ring |
| restart | Restart step | toggle | | true | The Restart label and ring |
| accent | Accent | select | Ink, Pick, Ok | Ink | Ring and check colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `onDone`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Press | `tick` | reuse | Tiny dry tick | volume 0.5 | none |
| A step finishes / done | `settle` | reuse | Soft lock-in click | volume 0.45 (0.6 on done) | none |

No new sounds.

## Dependencies

- None. CSS transitions for blur, width and the ring (`stroke-dashoffset`); timers for the steps.
- `@iconify/react` for the check (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user (just the download). About 4.5 seconds; the sequence continues by itself after the cursor leaves and resets about 6 s later.

1. The cursor appears below the button ([0.5, 1.6], instant).
2. It glides to "Update" (500 ms) and presses: the label morphs to "0%".
3. It glides slightly away (400 ms) and waits while the percentage counts to 100% (3 s).
4. It glides away (500 ms). Install, Restart and "Up to date" play out on their own.

## Card fit and hit areas

The pill (or circle) is the root and changes size; it is centred in a fixed-size anchor so the wall layout does not jump. Check `elementFromPoint` beside the pill and beside the circle (card link), and on it (component).

## Accessibility and edge cases

- Toggling step knobs during a run applies to the next run.
- The disabled state during a run keeps the button focusable (`aria-disabled`, not `disabled`) so screen readers hear the progress.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines it
- [ ] One press runs Download (counting %), Install (ring), Restart (ring) and "Up to date", then resets
- [ ] Letters morph per character with the width animating; pill ↔ circle transitions smoothly
- [ ] Every knob visibly changes it (each step toggle, accent)
- [ ] `tick` and `settle` respect `sound` and `volume`
- [ ] Presses are ignored while running; live region announces steps; reduced motion cross-fades
- [ ] Demo presses Update and watches the download

## Decisions log

- Flow: one press runs the whole sequence. (User)
- Morph: per-character blur. (User)
- Sound: `tick` and `settle`. (User)
- Play demo: just the download (the rest finishes after the cursor leaves). (User)
- Knobs: step toggles and accent. (User)
- No cancel. (User)
- Decided by agent:
  - the slug `update-button` and the tag Loading;
  - step timings (3 s download, 1.5 s install, 1.2 s restart, 1.5 s done);
  - an "Up to date ✓" final state;
  - small random pauses in the download count.
