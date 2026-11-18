# Coupon copy

- **Slug:** `coupon-copy` (URL `/coupon-copy`)
- **Number:** 37 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/25.mp4` (a promo-code pill, "B3E45S7T" with a white "Copy" button; pressing it blurs the pill into "✓ Code Copied!" while a slightly darker fill sweeps across the pill as a timer, then it blurs back to the code). Built exactly as the video, at the user's request. Only the idea is used.

## Summary

A coupon code that copies with a countdown. Press Copy: it blurs into "Code copied!" while a fill sweeps across like a timer, then the code comes back.

## Look

**Pill.** About 230 × 48 px, fully rounded, on `color-mix(in srgb, var(--fill-on) 7%, var(--fill-slab))` (one surface, following the theme).

**Code state.** The code "B3E45S7T" on the left in `--ink-3`, 17 px weight 600, letter spacing 0.04 em, tabular; a "Copy" button on the right: 36 px tall, radius 18, padding 0 16, on `--fill-slab` with a soft shadow, "Copy" in `--fill-on`, 13 px weight 600.

**Copied state.** Centred: a filled check circle (`ph:check-circle-fill`, 16 px) and "Code copied!" in `--fill-on`, 14 px weight 600, both in the `accent` colour for the icon (Ink `--fill-on` default, the video's black; Ok `--ok`; Pick `--pick`).

**Sweep.** A fill behind the copied content, `color-mix(in srgb, var(--fill-on) 5%, transparent)` darker than the pill (with Ok or Pick: `color-mix(in srgb, var(--accent) 12%, transparent)`), growing from the left edge to the right over the hold time, clipped to the pill's rounded shape.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the pill.

## Behaviour

1. **Copy.** Pressing Copy copies the code with `navigator.clipboard.writeText`. The code and button blur out (blur 8 px, fade, 180 ms) while the copied content blurs in at the centre. `pop` plays.
2. **Sweep.** The fill grows left to right over `hold` seconds (default 3), linear.
3. **Return.** When the sweep reaches the right edge, the copied content blurs out and the code and button blur back in (180 ms); the fill fades. `tick` plays.
4. **Press during copied.** The whole pill is a button while copied; pressing it copies again and restarts the sweep from the left (no extra blur).
5. **Clipboard refused.** The copied state reads "Press Ctrl+C" instead and the code (shown in a hidden selected input) can be copied by hand; the sweep and return still happen.

## Interaction

- **Pointer.** Press Copy (or the pill while copied). The code text is selectable in the code state.
- **Keyboard.** Copy is a `button` labelled "Copy code B3E45S7T"; Enter/Space press it. A live region announces "Code copied".
- **Touch.** Same as pointer.
- **Reduced motion.** No blur: a 120 ms cross-fade; the sweep still runs (it shows the time left).

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| hold | Hold (s) | range | 1–8, step 0.5 | 3 | How long "Code copied!" stays (the sweep's length) |
| accent | Accent | select | Ink, Ok, Pick | Ink | Check and sweep colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Four knobs: the user kept only these. Also takes `code` (default "B3E45S7T") and `onCopy`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Code copied | `pop` | reuse | Bubbly pop | volume 0.6 | none |
| Back to the code | `tick` | reuse | Tiny dry tick | volume 0.4 | none |

No new sounds.

## Dependencies

- None. CSS transitions for the blur swap; the sweep is a `transform: scaleX` transition from the left over `hold` seconds.
- `@iconify/react` for the check (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 5 seconds at the default hold.

1. The cursor appears below the pill ([0.5, 1.6], instant).
2. It glides to Copy (500 ms) and presses: "Code copied!", `pop`; the sweep starts.
3. It glides slightly away below (400 ms) and waits for the sweep (3 s).
4. The code blurs back, `tick`. It glides away (500 ms).

## Card fit and hit areas

The pill is the root. Check `elementFromPoint` just outside its rounded ends (card link) and on the code and button (component).

## Accessibility and edge cases

- Long codes (over 12 characters) shrink the font to fit, down to 13 px.
- Changing `hold` during a sweep applies on the next copy.

## Acceptance checklist

- [ ] Looks right in light and dark; matches the video's states
- [ ] Copy blurs into "Code copied!" and the sweep runs for `hold` seconds, then blurs back
- [ ] Pressing during copied restarts the sweep; the clipboard fallback works
- [ ] Every knob visibly changes it (hold, accent)
- [ ] `pop` and `tick` respect `sound` and `volume`
- [ ] Keyboard and live region work; reduced motion cross-fades with the sweep kept
- [ ] Demo copies and waits for the return

## Decisions log

- Made exactly as the video. (User)
- Knobs: hold time and accent (four in total with sound and volume). (User)
- Sound: `pop` on copy, `tick` on return. (User)
- Play demo: copy and wait for the sweep. (User)
- Decided by agent:
  - the slug `coupon-copy` and the tag Press;
  - pressing while copied copies again and restarts the sweep;
  - the sweep still runs in reduced motion.
