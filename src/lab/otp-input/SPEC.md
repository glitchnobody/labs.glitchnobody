# OTP input

- **Slug:** `otp-input` (URL `/otp-input`)
- **Number:** 54 / 60
- **Tag:** Type
- **Status:** spec
- **Design reference:** none (described by the user as "otp input"; design proposed by the agent).

## Summary

A one-time code field with a box per digit. Type or paste a code: digits pop into their boxes, a wrong code shakes and clears, and the right one (424242) ripples green.

## Look

**Row.** `length` boxes (default 6) in a row, split into two groups with a wider gap in the middle when `group` is on (3 + 3; for odd lengths the first group is larger). Box `size` 44 px square by default (40 × 48 feel: width = size, height = size × 1.15), 8 px gap, 16 px middle gap.

- **Box:** `--fill-slab` background, 1 px `color-mix(in srgb, var(--fill-on) 14%, transparent)` edge, digit 22 px `var(--font-ui)` weight 600, tabular, in `--fill-on`. `shape`: Rounded (radius 10), Square (radius 3), Circle (fully round; width = height = size).
- **Active ring:** one 2 px `--pick` ring that **slides** from box to box (it is a single element moved with `transform`, 160 ms ease-out), not a ring per box. The empty active box shows a 2 px × 45% blinking caret in `--fill-on` (1 s steps).
- **Filled box:** edge goes to `--ink-3`.
- **Masked digit** (`mask` on): the digit shows for 600 ms, then shrinks into a 10 px dot in `--fill-on`.
- **Resend line** (when `resend` > 0): 12 px `--ink-3` under the row, centred: "Resend code in 0:30", counting down each second; at 0 it becomes a text button "Resend code" in `--pick`.

**States.**
- **Verifying:** a soft highlight sweeps left to right across the boxes (a `--pick` 10% band, 600 ms).
- **Wrong:** all edges and digits flash `--danger` and the row shakes (±6 px, 3 swings, 400 ms); then the digits drop out one after another, right to left (30 ms stagger), and the ring returns to the first box.
- **Right:** a `--ok` wave passes through the boxes left to right (each box's edge and digit go `--ok` and lift 3 px with an overshoot, 50 ms stagger), and a 14 px `ph:check-circle-fill` in `--ok` appears where the resend line was, with the text "Verified". After 2.5 s it resets to empty.

**Light and dark.** Tokens only.

**Stroke on.** The box edges become `--pane-edge` at full strength.

## Behaviour

- **Typing.** Digits only (`inputmode="numeric"`, other keys ignored). Each digit pops into its box: it rises 8 px with a small overshoot and fades in (180 ms, `linear()` spring), then the ring slides to the next box. `tick`, pitch rising with the slot.
- **Backspace** clears the last digit (it drops out 6 px and fades, 120 ms) and moves the ring back; lower `tick`.
- **Paste** of any text: its digits fill the boxes in a cascade (40 ms stagger, each with the pop and a `tick`); extra digits are ignored.
- **Clicking a box** focuses the field with the ring at the first empty box (or the last box when full). Arrow keys are not needed: an OTP is filled in order.
- **Complete.** When the last box is filled, the field locks and **verifies** after `delay` ms (the sweep). If the digits match `code` → right; otherwise → wrong. `onComplete(value)` fires on fill; `onVerify(ok)` after.
- **Resend.** The countdown starts on mount and when Resend is pressed (which also clears the boxes); `pop` on press. `onResend()`.

## Interaction

- **Pointer.** Click any box to focus. The resend button is a real button.
- **Keyboard.** One real `<input>` (transparent, spanning the row, `autocomplete="one-time-code"`, `maxlength = length`) holds the value, so typing, paste, and the phone's code suggestion all work. Labelled "Verification code, 6 digits". A polite live region announces "Code incorrect" / "Code verified".
- **Touch.** Same; the number keyboard opens.
- **Reduced motion.** No pop, shake, wave or sweep: digits appear, wrong flashes red and clears, right turns green.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| length | Digits | range | 4–8 | 6 | Number of boxes |
| code | Correct code | text | digits | 424242 | The code that verifies (trimmed or padded to `length` with its own digits repeated) |
| shape | Shape | select | Rounded, Square, Circle | Rounded | Box corners |
| size | Box (px) | range | 32–60 | 44 | Box size |
| group | Split in half | toggle | | true | Wider gap in the middle |
| mask | Mask digits | toggle | | false | Digits turn into dots after 600 ms |
| delay | Verify (ms) | range | 0–1500, step 100 | 600 | How long the verify sweep lasts |
| resend | Resend (s) | range | 0–60, step 5 | 30 | Resend countdown; 0 hides the line |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A digit lands | `tick` | reuse | Tiny dry tick | volume 0.35, pitch 0.9 + 0.06 × slot | 1 per 30 ms |
| Backspace | `tick` | reuse | Lower tick | volume 0.3, pitch 0.75 | 1 per 30 ms |
| Wrong code | `error` | **new** | Soft low double buzz | volume 0.5 | none |
| Right code | `join` | reuse | Warm two-note rising chime | volume 0.5 | none |
| Resend pressed | `pop` | reuse | Bubbly pop | volume 0.4 | none |

New sound:

- **Name:** `error`
- **ElevenLabs prompt:** "A soft low double buzz, two quick muted synth blips falling slightly in pitch, a gentle 'try again' interface error sound, not harsh, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** ~280 ms

## Dependencies

- None. CSS transitions and keyframes, one transparent input.
- Icons: `ph:check-circle-fill` via `@iconify/react`.

## Play demo

Agreed with the user. Uses the new `type` step (see "Demo runner change" below). About 7 seconds; ends empty.

1. The cursor appears below the row ([0.5, 1.8], instant).
2. It glides to the first box (500 ms) and clicks: the ring and caret appear.
3. `{ type: "123456", ms: 900 }`: digits pop in one by one with rising ticks.
4. Wait 1000 ms: the sweep, then the row flashes red, shakes and clears; `error`.
5. `{ type: "424242", ms: 900 }`: digits pop in again.
6. Wait 1400 ms: the sweep, then the green wave and "Verified"; `join`.
7. It glides away (500 ms). The field resets to empty 2.5 s after verifying.

## Demo runner change

The runner can only move, press and release, so this component adds a `type` step (a one-time change to the shell, agreed by the user on 2026-11-17):

- `src/lab/index.ts`: add `| { type: string; ms?: number }` to `Step`.
- The demo runner (where the wall plays `demo`): for a `type` step, send each character to `document.activeElement` over `ms` total: `keydown`, then insert the character with the native value setter plus an `input` event (`InputEvent`, `inputType: "insertText"`, `data: char`) so React sees it, then `keyup`. Skip it if the focused element is not inside the playing block.

Earlier Type specs (`search-expand`, `notify-me`, `duration-chip`) wrote demos without typing because this step did not exist. They can be given typing demos when built; say so then.

## Card fit and hit areas

The root holds the row and the resend line. On the wall the root is `pointer-events: none`, with `auto` on the input (spanning the boxes) and the resend button. Check `elementFromPoint` beside the row, under it beside the resend text, and in the margin around the root (card link), and on each box and the resend button (component). The gaps between boxes are covered by the input, which is fine because they sit inside the row.

## Accessibility and edge cases

- `length` change clears the value; `code` shorter than `length` repeats its digits, longer is trimmed.
- Typing while verifying or during the right state is ignored.
- Pasting non-digits is ignored; pasting fewer digits fills what it can.
- The mask is visual only: the input keeps the real digits (so paste and autofill work) and the live region never reads digits out.

## Acceptance checklist

- [ ] Looks right in light and dark, all three shapes, grouped and not
- [ ] The ring slides; digits pop; backspace drops them
- [ ] Paste fills the boxes in a cascade
- [ ] Wrong code shakes and clears; 424242 ripples green and resets
- [ ] Resend counts down and becomes a button that restarts it
- [ ] Every knob visibly changes it
- [ ] `tick`, `error`, `join`, `pop` respect `sound` and `volume`
- [ ] Phone code autofill and reduced motion work
- [ ] The demo types wrong then right and ends empty

## Decisions log

- Look: separate boxes with a sliding ring. (User)
- Result: verify, then pass or fail; the right code is a knob (default 424242). (User)
- Extras: digits pop in, paste fills all, resend timer, mask digits. (User)
- Play demo: wrong then right. (User)
- Demo typing: add a `type` step to the demo runner. (User)
- Sound: new `error` for a wrong code. (User)
- Knobs: all 10 as proposed. (User)
- Decided by agent:
  - the slug `otp-input` and the tag Type;
  - one transparent input instead of one input per box;
  - `join` for success;
  - success resets after 2.5 s; the 3 + 3 grouping on by default.
