# Staggered countdown

- **Slug:** `staggered-countdown` (URL `/staggered-countdown`)
- **Number:** 1 / 60
- **Tag:** Press
- **Status:** spec

## Summary

A big number whose digits roll like an odometer, one after another, when the value changes. Press it to count down to a lower number; at zero, press again to roll back up to the start.

## Look

- One line of large, tabular numerals, centred on the card, at its natural size (about 56 px type by default, roughly 300 × 80 px for six digits). Reference: `987654$` with the `$` in the accent colour.
- Text in `--fill-on` on the transparent stage, `var(--font-ui)`, weight 600, `font-variant-numeric: tabular-nums` so every digit slot is the same width.
- Prefix and suffix sit tight against the digits in `--pick` (the accent), or in `--fill-on` when `accent` is off. They do not roll.
- Separators (comma, dot, space) are static characters in `--fill-on` at `--ink-3` strength, so the digits lead.
- Light and dark: tokens only, nothing else differs.
- Stroke on: nothing to outline; no effect.

## Behaviour

- **Value change.** Each digit is a slot holding a vertical strip `0 1 2 … 9`, clipped to one digit's height. Changing the value moves each strip with `transform: translateY` to its new digit, rolling through the digits in between. Counting down rolls the strip downward (digits come in from above); counting up rolls upward.
- **Stagger.** Each slot starts `stagger` ms after the previous one, in the order set by `direction`: right to left (ones digit first, like an odometer carrying over), left to right, or from the centre outwards. Unchanged digits do not move but still take their place in the order.
- **Roll.** Each slot rolls for `duration` ms with the chosen `easing`: Smooth `cubic-bezier(.2,.7,.2,1)`, Overshoot `cubic-bezier(.34,1.56,.64,1)` (lands slightly past and settles), Linear. With `blur` on, a slot gets a vertical motion blur (`filter: blur()` on Y via a small SVG filter, or a CSS fallback of `blur(0.6px)`) while moving, cleared when it lands.
- **Digit count changes** (1,000 → 999). The leading slot rolls to blank and its width collapses to 0 over the same duration, so the number slides together and stays centred. Gaining a digit does the reverse: a slot opens from width 0 and rolls in. Separators that are no longer needed fade and collapse with their group.
- **Settle.** When the last slot lands, the number has settled (fires the settle sound).
- **Interrupting.** A new value while rolling retargets each strip from where it is now; no jump.
- Formatting: `separator` groups thousands; `decimals` (0–2) shows a fractional part using the other mark as the decimal point (comma separator → dot decimal, dot separator → comma decimal, space or none → dot decimal). The decimal digits roll like the rest.

## Interaction

- Pointer: pressing the number counts down by `drop`. At 0, the next press rolls back up to `value`. Hover: the number lifts to full ink (`--fill-on`) from `--ink` at rest, no motion, so it reads as pressable.
- Keyboard: the number is a `button` labelled "Count down, now 987,654 dollars" (label reflects prefix/suffix). Enter and Space press it. Arrow Down counts down by `drop`, Arrow Up counts up by `drop`.
- Screen readers: digit strips are `aria-hidden`; a visually hidden `aria-live="polite"` region announces the formatted value once it settles, not each digit.
- Touch: same as pointer; `touch-action: manipulation`, `user-select: none`.
- Reduced motion: no roll and no blur; digits cross-fade to the new value over 150 ms, stagger kept at a third of its value so the order is still visible. Sounds still play (one tick per changed digit, then settle).

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| value | Start value | range | 0–9,999,999, step 1 | 987654 | The number it starts at and resets to |
| drop | Count down by | select | Random, 1, 10, 100, 1,000 | Random | How far each press goes; Random drops 1–15% of the current value |
| prefix | Prefix | text | up to 3 characters | "" | Text before the number |
| suffix | Suffix | text | up to 3 characters | "$" | Text after the number |
| accent | Accent affixes | toggle | | true | Prefix and suffix in the accent colour |
| separator | Separator | select | None, Comma, Dot, Space | None | Thousands grouping mark |
| decimals | Decimals | range | 0–2 | 0 | Digits after the decimal mark |
| direction | Stagger from | select | Right, Left, Centre | Right | Which digit moves first |
| stagger | Stagger (ms) | range | 0–150, step 5 | 40 | Delay between one digit and the next |
| duration | Roll (ms) | range | 200–1500, step 50 | 600 | How long each digit rolls |
| easing | Easing | select | Smooth, Overshoot, Linear | Overshoot | How each digit lands |
| blur | Motion blur | toggle | | true | Vertical blur while a digit moves |
| size | Size (px) | range | 24–96 | 56 | Type size |
| weight | Weight | select | Regular, Medium, Semibold, Bold | Semibold | Type weight |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

**Shell change needed:** `prefix` and `suffix` need a `text` knob type, which the site does not have (only range, select, toggle). In the build phase add `{ type: "text"; maxLength?: number; default: string }` to `Knob` in `src/lab/index.ts` and a text input in `Detail.tsx`'s knob renderer, and say so when doing it.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A digit lands | `tick` | new | A tiny dry mechanical tick | pitch `1 + 0.04 × position in stagger order`, volume 0.6 | at most one every 25 ms; unchanged digits are silent |
| Whole number settles | `settle` | new | A soft muted lock-in click | pitch 1, volume 0.9 | once per change |

New sounds:

- **Name:** `tick`
- **ElevenLabs prompt:** "A single very short soft mechanical tick, like one plastic gear tooth clicking past a pawl, dry and close-miked, no reverb, no tail"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.7 · **loop:** false
- **Trim to:** about 40 ms
- Meant as the library's general-purpose tick: later components with small discrete steps should reuse it.

- **Name:** `settle`
- **ElevenLabs prompt:** "A soft muted click of a small mechanism locking into place, a gentle low thunk with a tiny bright click on top, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** about 150 ms

## Dependencies

None. The roll is CSS transforms and transitions driven by React state; the stagger is per-slot `transition-delay`; the width collapse is a transition on the slot's width. Timing for sounds uses `transitionend` per slot (or timers matching the delays).

## Play demo

Agreed with the user. About 6 seconds.

1. Cursor appears off to the right of the number.
2. Glides onto the middle of the number (600 ms).
3. Presses: the number drops, digits roll right to left and land with the overshoot; ticks rise in pitch, then the settle click.
4. Waits for it to settle (about 1 s).
5. Presses twice quickly (about 150 ms apart): the second press interrupts the first roll and the digits retarget mid-roll without jumping.
6. Waits for the settle (about 1.2 s).
7. Glides away off the number (600 ms).

Leaves a lower number on the card, which is a fine resting state.

## Card fit and hit areas

Only the number (prefix, digits, suffix) reacts. The root is an inline-flex button sized to the text, so the card's empty space falls through to the card link. Check with `elementFromPoint` just outside the text's left and right edges, since width animates.

## Accessibility and edge cases

- Button label and live region use the formatted value with prefix and suffix spelled out where sensible ("$" → "dollars" is not guessed; read the raw suffix).
- `value` changed from the knob while idle rolls to the new start value.
- Drop larger than the current value clamps at 0.
- `decimals` > 0 with Random drop keeps the fractional part random too.
- Very fast pressing: rolls retarget, ticks stay rate-limited, settle plays only when the final value lands.
- Seven digits plus separators at 96 px may exceed the card: the root scales down to fit its container (`max-width: 100%`, font-size clamped by a container query) rather than overflow.

## Acceptance checklist

- [ ] Looks right in light and dark; accent affixes use `--pick`
- [ ] Every knob visibly changes it, including text prefix and suffix
- [ ] Digits roll through intermediate values, staggered in each direction
- [ ] Losing and gaining a digit animates width and stays centred
- [ ] Comma, dot, space and decimals format correctly (1,234.50 / 1.234,50 / 1 234.50)
- [ ] Interrupting a roll retargets without jumps
- [ ] `tick` per landed digit with rising pitch, `settle` once at the end; both respect `sound` and `volume`
- [ ] Keyboard (Enter, Space, arrows) works; live region announces once; reduced motion cross-fades
- [ ] Demo shows count-downs including an interruption and leaves a clean state

## Decisions log

- Trigger: value changes (press to count down), not a live timer. (User)
- Digit motion: vertical odometer roll through intermediate digits. (User)
- Stagger direction: a knob, default right to left. (User)
- Sound: tick per digit plus a settle click. (User; sounds suggested by agent)
- Format: separator knob (none, comma, dot, space) plus decimals 0–2, decimal mark is the opposite of the separator. (User)
- Affixes: text inputs, accent colour by default with a toggle; default suffix "$" as in the reference. (User)
- Digit count change: animate width so the number slides together. (User)
- Play demo: press once, then a quick double press that interrupts and retargets. (User)
- Decided by agent: press at 0 resets to the start value; Random drop is 1–15%; Overshoot easing as default; motion blur on; reduced motion cross-fades; `text` knob type added to the shell.
