# Duration chip

- **Slug:** `duration-chip` (URL `/duration-chip`)
- **Number:** 51 / 60
- **Tag:** Type
- **Status:** spec
- **Design reference:** `~/Downloads/inso/39.mp4` (a compact chip "2 Hr. 30 Min. ✎"; pressing the pencil splits it into two editable pills, hours and minutes, and the pencil turns into a ✓ in its own pill; ✓ merges them back). Only the idea is used.

## Summary

A duration chip that splits open to edit. Press the pencil: the numbers slide apart into their own fields; type new values and press ✓ to fold them back into one chip.

## Look

**One surface** following the theme: chips and pills on `color-mix(in srgb, var(--fill-on) 5%, var(--fill-slab))`, radius 10, 38 px tall.

**Compact.** One chip, padding 0 12: "**2** Hr. **30** Min." (numbers in `--fill-on`, 14 px weight 700, tabular; unit labels in `--ink-4`, 13 px) and `ph:pencil-simple-fill` 14 px in `--ink-3` at the right.

**Editing.** Separate pills, 6 px apart: one per unit, each 72 px wide, with the number as an input on the left (`--fill-on`, 14 px weight 700) and the unit label on the right (`--ink-4`); then a 38 px square pill with `ph:check-bold` in `--fill-on`. The focused pill has a 1.5 px `--fill-on` ring.

**Units** (`units`): Hr + Min (default, the video), Min + Sec, Hr + Min + Sec. Labels "Hr.", "Min.", "Sec.".

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the chip and each pill.

## Behaviour

- **Split.** Pressing the pencil (or the chip): a `motion` layout animation splits the chip into the pills. Each number and label travels from its place in the chip to its pill (shared `layoutId`s), the chip's background divides into the pill backgrounds, and the pencil cross-fades (with a 90° turn) into the ✓ in its own pill. The first input is focused with its text selected. `expand` plays.
- **Type.** Inputs accept digits only (`inputmode="numeric"`), up to 2 digits for minutes and seconds (clamped to 59) and 3 for hours (clamped to 999). `tick` per accepted keystroke; a rejected key (non-digit, or over the limit) shakes the pill slightly. Tab and Shift+Tab move between pills; Enter confirms.
- **Confirm.** Pressing ✓ or Enter normalises the values (e.g. 0 hours shows "0 Hr."; empty becomes 0), then merges the pills back into the compact chip (reverse layout animation) with the new values. `settle` plays. Calls optional `onChange({ hours, minutes, seconds })`.
- **Cancel.** Escape merges back without changes; `collapse`.
- **Blur.** Clicking outside while editing confirms (like the video, which keeps edits).

## Interaction

- **Pointer.** Press the pencil or chip; click into pills; press ✓.
- **Keyboard.** The compact chip is a `button` ("Edit duration, 2 hours 30 minutes"); the pills are labelled number inputs ("Hours", "Minutes", "Seconds"); ✓ is a `button` "Save duration". Focus returns to the chip after merging. A live region announces the saved duration.
- **Touch.** The numeric keyboard appears.
- **Reduced motion.** No travel: a 120 ms cross-fade between compact and editing.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| units | Units | select | Hr + Min, Min + Sec, Hr + Min + Sec | Hr + Min | Which units the chip shows and edits |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Three knobs: the user kept only Units. Also takes `value` (default `{ hours: 2, minutes: 30, seconds: 0 }`) and `onChange`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Split open | `expand` | reuse | Soft whoosh rising | volume 0.45 | none |
| A digit is typed | `tick` | reuse | Tiny dry tick | volume 0.3 | 1 per 30 ms |
| Confirmed | `settle` | reuse | Soft lock-in click | volume 0.5 | none |
| Cancelled | `collapse` | reuse | Soft whoosh falling | volume 0.4 | none |

No new sounds.

## Dependencies

- `motion` (the user's choice) for the split and merge layout animation. Import `motion/react` with `LazyMotion` + `domMax`.
- `@iconify/react` for the pencil and check (house rule).
- Set `install: "npm install motion @iconify/react"`.

## Play demo

Agreed with the user, simplified: the demo cannot type and there is no drag-to-change (typing only), so it splits and confirms. About 4 seconds; ends compact with the same values.

1. The cursor appears below the chip ([0.8, 1.8], instant).
2. It glides to the pencil (500 ms) and presses: the chip splits into pills, the pencil becomes ✓; `expand`.
3. It waits 1200 ms (the first input is focused and selected).
4. It glides to ✓ (400 ms) and presses: the pills merge back; `settle`.
5. It glides away (500 ms).

## Card fit and hit areas

The root grows from the compact chip's left edge (anchored left; absolute positioning so the wall layout does not jump). In editing, the gaps between pills fall through: the root is `pointer-events: none` with `auto` on the chip and each pill. Check `elementFromPoint` beside the chip, in the gaps between pills (card link), and on a pill and ✓ (component).

## Accessibility and edge cases

- Pasting "1:45" into the hours input fills hours and minutes.
- Units changed while editing merges first, then switches.
- Values over the limits clamp on confirm, with the clamp visible in the merged chip.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines the chip and pills
- [ ] The pencil splits the chip into pills with numbers travelling; ✓ merges them back with the new values
- [ ] Typing accepts digits with limits; rejected keys shake; Tab, Enter and Escape work; click outside confirms
- [ ] All three unit sets work
- [ ] `expand`, `tick`, `settle`, `collapse` respect `sound` and `volume`
- [ ] Labels, focus return and announcements work; reduced motion cross-fades
- [ ] Demo splits and confirms

## Decisions log

- Editing: type in the pills (no drag or steppers). (User)
- Motion: `motion` layout with `domMax`. (User)
- Sound: `expand`/`collapse`, `tick`, `settle`. (User)
- Play demo: split and confirm (typing only, so no value change). (User)
- Knobs: units only (three in total with sound and volume). (User)
- Decided by agent:
  - the slug `duration-chip` and the tag Type;
  - digit limits and clamping;
  - clicking outside confirms;
  - pasting "h:mm" fills both fields.
