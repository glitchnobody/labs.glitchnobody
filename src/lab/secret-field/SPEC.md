# Secret field

- **Slug:** `secret-field` (URL `/secret-field`)
- **Number:** 33 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/20.mp4` (a card-number field; while revealed, the copy button carries a green ring counting down; when it runs out, the middle digits scramble into "×××× ××××" and the button becomes an eye; the eye scrambles the digits back and restarts the countdown; copy shows a check). Only the idea is used.

## Summary

A card number that hides itself. Copy it while it's showing; when the ring runs out the middle digits scramble away, and the eye scrambles them back.

## Look

**Field.** About 260 × 40 px, radius 10, on `--fill-slab` with a 1 px `--pane-edge` border and a soft shadow in light mode. Padding 0 6 0 12.

**Number.** "6969 0420 6767 0420" in `--fill-on`, 15 px weight 500, tabular figures, letter spacing 0.02 em. Grouped in fours with a 0.5 em gap when `grouping` is on; one run when off. Masked digits show `maskChar` (× default, • or *) in `--ink-3`.

**Button** at the right: 28 × 28 px, radius 8.

- **Revealed:** `ph:copy-fill` 15 px in the `ring` colour on a tint of it (`color-mix(in srgb, var(--ring) 16%, var(--fill-slab))`), with a 2 px progress ring tracing the button's rounded-square outline (an SVG `rect` with `pathLength` and `stroke-dashoffset`) that empties over `reveal` seconds, as in the video.
- **Copied:** a solid `ring`-colour square with a white `ph:check-bold`, for 1.2 s.
- **Masked:** `ph:eye-fill` in `--pick` on a `--pick` tint, no ring.

**Ring colour** (`ring`): Ok (`--ok`, default, the video's green), Pick (`--pick`), Ink (`--fill-on`).

**Light and dark.** Tokens only.

**Stroke on.** The border is already a hairline; harmless.

## Behaviour

- **Masking.** Digits other than the first and last `visible` (default 4 at each end) are hidden when masked. With `visible` 0, all digits hide.
- **Scramble.** When masking or revealing, each hidden digit cycles through random characters (digits and a few symbols) every 40 ms, starting left to right 30 ms apart, and lands on its target (the mask character or the real digit) after `scramble` ms (default 420). A soft `tick` plays per landed digit (rate-limited) with rising pitch.
- **Countdown.** Revealing starts the ring at full and empties it linearly over `reveal` seconds (default 6). At zero the field masks (scramble), the button morphs into the eye (icon cross-fade and colour change, 200 ms), and `settle` plays.
- **Copy.** While revealed, pressing the button copies the full number (digits only, no spaces) with `navigator.clipboard.writeText`, shows the check for 1.2 s and plays `pop`; the countdown keeps running underneath (and restarts from full, giving the user time to paste). If the clipboard is refused, the number text is selected for manual copy and the button shows a small "Ctrl+C" for 1.2 s instead.
- **Reveal.** While masked, pressing the eye scrambles the digits back to real values, the eye morphs into the copy button, and the ring restarts full. `settle` plays when the scramble lands.
- **Start state.** `masked` sets whether it starts masked (eye) or revealed (counting down).

## Interaction

- **Pointer.** Press the button. The number text is selectable only when revealed (masked text is `user-select: none`).
- **Keyboard.** The button is a `button` labelled "Copy card number" (revealed) or "Show card number" (masked). The number is in a `span` with `aria-label` "Card ending 0420" when masked and the full number when revealed, and the masked characters are `aria-hidden`. A live region announces "Card number copied" and "Card number hidden".
- **Touch.** Same as pointer.
- **Reduced motion.** No scramble: digits swap at once; the ring still counts down (it is information) but without easing.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| reveal | Reveal (s) | range | 2–20 | 6 | How long the number stays visible |
| masked | Start masked | toggle | | false | Start hidden (eye) or revealed |
| visible | Visible digits | range | 0–4 | 4 | Digits left showing at each end when masked |
| maskChar | Mask | select | ×, •, * | × | Character for hidden digits |
| scramble | Scramble (ms) | range | 0–900, step 30 | 420 | How long digits scramble |
| ring | Ring | select | Ok, Pick, Ink | Ok | Countdown ring and copy colour |
| grouping | Group in 4s | toggle | | true | Spaces between groups of four |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `value` (default "6969042067670420") and `label`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A scrambling digit lands | `tick` | reuse | Tiny dry tick | volume 0.25, pitch 1 + 0.05 × index | 1 per 25 ms |
| Masked or revealed (scramble done) | `settle` | reuse | Soft lock-in click | volume 0.5 | none |
| Copied | `pop` | reuse | Bubbly pop | volume 0.6 | none |

No new sounds.

## Dependencies

- None. A timer per scramble, an SVG rect ring with `stroke-dashoffset` driven by rAF (so it can restart cleanly), CSS cross-fades.
- `@iconify/react` for the copy, eye and check icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 9 seconds at the default reveal time; the demo sets nothing, so it waits for the real countdown, and it lands in the revealed state.

1. The cursor appears below the field ([0.5, 1.8], instant). The field is revealed with the ring counting down.
2. It glides to the button (500 ms) and presses: check, `pop`. The ring restarts.
3. It glides off slightly below (400 ms) and waits for the countdown (6 s at the default): the digits scramble into × and the eye appears, `settle`.
4. It glides to the eye (400 ms) and presses: the digits scramble back, the ring restarts.
5. It waits 500 ms and glides away (500 ms).

(The demo is about 9 s, over the usual 8, because it waits on the real timer.)

## Card fit and hit areas

The field is a rounded rectangle; only the button acts, but the number text is selectable, so the whole field is `auto`. Check `elementFromPoint` just outside the field's corners (card link) and on the number and button (component).

## Accessibility and edge cases

- The default number is the user's joke placeholder. It happens to pass the Luhn check, so it is a made-up demo value only; the component never validates or submits it.
- `reveal` changed mid-countdown restarts the ring with the new length.
- Pressing the eye mid-scramble (masking) reverses to revealed from wherever each digit is.
- Values that are not 16 digits group in fours from the left; the last group may be shorter.

## Acceptance checklist

- [ ] Looks right in light and dark; the ring traces the button's rounded outline
- [ ] The ring empties over `reveal` seconds, then digits scramble into the mask and the eye appears
- [ ] Copy copies digits only (stubbed clipboard), shows the check and restarts the ring; the fallback selects the text
- [ ] The eye scrambles the digits back and restarts the countdown
- [ ] Every knob visibly changes it (reveal, start masked, visible digits, mask, scramble, ring, grouping)
- [ ] `tick`, `settle`, `pop` respect `sound` and `volume`
- [ ] Screen-reader labels hide masked digits; reduced motion swaps without scramble
- [ ] Demo copies, waits for the mask, reveals

## Decisions log

- Content: a card number. (User)
- Scramble: per-digit. (User)
- Sound: `tick` per digit, `settle`, `pop`. (User)
- Play demo: copy, wait for the mask, reveal. (User)
- Knobs: reveal time and start masked, visible digits, mask character and scramble speed, ring colour and grouping. (User)
- Number: 6969 0420 6767 0420. (User)
- Decided by agent:
  - the slug `secret-field` and the tag Press;
  - copying restarts the countdown;
  - copy copies digits without spaces;
  - the ring keeps counting in reduced motion;
  - the demo runs about 9 s because it waits on the real timer.
