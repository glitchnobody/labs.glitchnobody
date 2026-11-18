# Input box

- **Slug:** `input-box` (URL `/input-box`)
- **Number:** 59 / 60
- **Tag:** Type
- **Status:** spec
- **Design reference:** none (described by the user as "input box"; design proposed by the agent).

## Summary

A username field with a floating label and live checks. Focus it and the border draws itself around the box; type and the rules tick off one by one while a ring counts your characters.

## Look

**Field.** `width` px wide (default 280), height by `size` (Small 40, Medium 48, Large 56 px), radius `radius` (default 12). Background `--fill-slab`; at rest a 1 px border in `color-mix(in srgb, var(--fill-on) 16%, transparent)`. Text 15 px `var(--font-ui)` `--fill-on`, 14 px left padding.

**Floating label.** The `label` text ("Username") sits inside the field as a placeholder (15 px, `--ink-3`). On focus or when the field has text, it floats up to sit **on** the top border (scale 0.8, `--pick` when focused, `--ink-3` otherwise), with a gap cut in the border behind it.

**Focus ring.** An SVG rounded-rectangle path over the field, 2 px, `--pick`, that **draws itself** on focus: it starts at the right end of the label's gap and runs clockwise round the box to the left end of the gap (`stroke-dashoffset` from full length to 0 over `ring` ms, default 450, ease-out). The gap matches the floated label's measured width plus 8 px. On blur the ring un-draws backwards (half the time), leaving the resting border (also drawn as a path with the same gap while the label is floated).

**Right side, inside the field.**
- **Counter ring** (`counter` on): an 18 px circle that fills clockwise with `length / max`, `--ink-3` track at 15%, fill `--fill-on`; in the last 3 characters the remaining number ("3", "2", "1") appears inside it, and at the limit it turns `--danger` (the `--danger` token is added by `hold-to-delete` if not built yet).
- **Clear button**: `ph:x-circle-fill` 16 px `--ink-4`, shown when there is text; hover `--ink-2`.
- **Status:** while checking availability, a `ph:spinner-gap` spinning 14 px; then `ph:check-circle-fill` in `--ok` or `ph:warning-circle-fill` in `--danger`.

**Rules list** (`rules` on). Under the field, 8 px gap, 12 px text, one row each with a 12 px dot that becomes a check:

1. 3 to `max` characters
2. Letters, numbers and underscores
3. Starts with a letter
4. Available (only when `check` is on)

A rule that's not yet met is `--ink-4` with a hollow dot; met is `--ok` with `ph:check-bold` drawn in (stroke animation, 160 ms); broken (text present and it fails) is `--danger` with `ph:x-bold`. "Available" shows "Checking…" while checking, then "Available" or "Taken: try jonas_k2".

**Light and dark.** Tokens only.

**Stroke on.** The resting border becomes `--pane-edge` at full strength.

## Behaviour

- **Focus.** The label floats (180 ms, spring), the ring draws, `tick` (low).
- **Typing.** Up to `max` characters (extra input is refused and the counter ring shakes 3 px once). Rules re-evaluate on every input; each rule that newly passes draws its check with a `tick` (rising pitch by rule index).
- **Availability** (`check` on): 500 ms after typing stops and when rules 1–3 pass, a simulated check runs for 600 ms (spinner), then compares against a small taken list (`admin`, `root`, `glitch`, `nobody`, `jonas`, `mira`, `user`, plus the `taken` prop). Available → `pop`; taken → `error` and the suggestion (name + first free number). Editing cancels a running check.
- **Clear.** Empties the field (text fades left, 120 ms), keeps focus, resets rules; `swipe`.
- **Blur.** The ring un-draws; if empty, the label drops back inside.
- Reports `onChange(value)` and `onValid(boolean)` (all rules pass, including availability when on).

## Interaction

- **Pointer.** Click anywhere on the field to focus; clear button clears.
- **Keyboard.** A real `<input>` with `<label>`, `autocomplete="username"`, `spellcheck=false`, `maxlength = max`. The rules list is linked by `aria-describedby`; `aria-invalid` when a rule is broken; a polite live region announces "Username available" / "Username taken". The clear button is a `button` "Clear". Escape clears.
- **Touch.** Same.
- **Reduced motion.** The ring appears without drawing; the label moves without the spring; checks appear without drawing.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| label | Label | text | up to 20 chars | Username | The floating label |
| max | Max length | range | 8–32 | 16 | Character limit (and rule 1) |
| size | Size | select | Small, Medium, Large | Medium | Field height and text |
| width | Width (px) | range | 200–340 | 280 | Field width |
| radius | Corner (px) | range | 0–24 | 12 | Field corners (the ring follows) |
| ring | Ring draw (ms) | range | 0–1000, step 50 | 450 | How long the focus ring takes to draw |
| rules | Rules | toggle | | true | The live rules list |
| counter | Counter | toggle | | true | The character ring |
| check | Availability | toggle | | true | The simulated taken/available check |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Focus | `tick` | reuse | Low tick | volume 0.3, pitch 0.8 | none |
| A rule passes | `tick` | reuse | Rising tick | volume 0.35, pitch 1.05 + 0.1 × rule index | 1 per 60 ms |
| Available | `pop` | reuse | Bubbly pop | volume 0.4 | none |
| Taken | `error` | reuse (new in `otp-input`) | Soft low double buzz | volume 0.4 | none |
| Clear | `swipe` | reuse | Quick paper swish | volume 0.35 | none |

No new sounds. Keystrokes themselves are silent.

## Dependencies

- None. An SVG path for the ring (`getTotalLength` for the dash), CSS transitions.
- Icons via `@iconify/react`: `ph:x-circle-fill`, `ph:spinner-gap`, `ph:check-circle-fill`, `ph:warning-circle-fill`, `ph:check-bold`, `ph:x-bold`.

## Play demo

Agreed with the user (focus, a short type, clear). Uses the `type` step added by `otp-input`. About 5 seconds; ends empty.

1. The cursor appears below the field ([0.5, 1.3], instant).
2. It glides to the field (500 ms) and clicks: the label floats and the ring draws; `tick`.
3. `{ type: "mira_k", ms: 700 }`: rules tick off; the counter ring fills.
4. Wait 1400 ms: "Checking…", then "Available" ✓; `pop`.
5. It glides to the clear button (400 ms) and clicks: the text fades, rules reset; `swipe`.
6. It glides away (500 ms). The field stays focused with the label floated until something else takes focus (the next demo or a click elsewhere), which is a clean state.

## Card fit and hit areas

The root holds the field and the rules list. On the wall the root is `pointer-events: none`, with `auto` on the field (input + clear button). The rules list is `pointer-events: none`. Check `elementFromPoint` on the rules text, beside the field and in the margin (card link), and on the field and clear button (component).

## Accessibility and edge cases

- Rule 1 text follows `max` ("3 to 24 characters").
- A paste longer than `max` is truncated, with the counter shake.
- With `check` off, rule 4 is hidden and validity ignores it.
- With `rules` off, the status icon still shows availability.
- `radius` larger than half the height is clamped so the ring path stays valid.

## Acceptance checklist

- [ ] Looks right in light and dark, all sizes
- [ ] The ring draws from the label gap round the box and un-draws on blur
- [ ] The label floats into the border gap
- [ ] Rules tick off live; availability checks after a pause; taken shows a suggestion
- [ ] The counter ring fills and warns near the limit
- [ ] Every knob visibly changes it
- [ ] Sounds respect `sound` and `volume`
- [ ] Label, description and live region work with a screen reader; reduced motion respected
- [ ] Demo focuses, types, shows Available, and clears

## Decisions log

- Concept: floating label with live checks (username). (User)
- Focus: the ring draws itself round the box from the label. (User)
- Play demo: focus, a short type, clear. (User)
- Keystrokes are silent. (User)
- Counter warns with `--danger` only at the limit, no amber. (User)
- Decided by agent:
  - the slug `input-box` and the tag Type;
  - the four rules, the simulated availability check and its taken list;
  - reusing `tick`, `pop`, `error`, `swipe`;
  - the demo types "mira_k" (available) and leaves the field focused and empty.
