# Hold to delete

- **Slug:** `hold-to-delete` (URL `/hold-to-delete`)
- **Number:** 5 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** a Pinterest video pin by MetalForge (https://ca.pinterest.com/pin/1090293391088883577/). Only the idea and layout are used; no code comes from it, so no `adaptedFrom`.

## Summary

A destructive button that only works if you hold it. Hold until the red fill crosses it to delete, then undo before the countdown ring runs out.

## Look

**Idle.** A pill reading "Delete project" with a trash icon (`ph:trash-bold`), about 210 × 56 px by default.

- Surface `--surface-2` with a 1 px `--pane-edge` outline and a 4 px outer ring in `--fill-slab` with a soft shadow, as in the reference.
- Text in `--fill-on`, 17 px, weight 600; icon in `--ink-4`.
- `radius` sets the corner radius (full pill by default).

**Filling.** A fill layer in the `fill` colour grows across the pill. A second copy of the label and icon, in white, sits exactly over the first and is clipped to the same area as the fill (`clip-path: inset(...)`). The text therefore turns white precisely where the fill covers it, letter by letter, as in the reference. The fill's leading edge is rounded, so it looks like a growing pill rather than a hard wipe.

**Deleted.** The full pill turns `fill`-coloured and shows "✓ Deleted" (`ph:check-bold`) in white.

**Undo pair.** The pill splits into two pills side by side with an 8 px gap, both inside the white outer ring:

- A soft chip reading "✓ Deleted" in the `fill` colour on a tint of it (`color-mix(in srgb, var(--danger) 12%, var(--fill-slab))`).
- A dark pill reading "Undo" (`--fill-on` background, `--fill-slab` text) with a countdown ring at its left: an SVG circle, 2 px stroke, depleting.

**Hint.** "Hold to delete" in `--ink-4` at 12 px, under the pill, shown only after an early release.

**Colours.** `fill` options:

- **Danger** uses a new `--danger` token. Add it to `src/lab/tokens.css` at build time: light `#e5484d`, dark `#ff6369`. Say so when adding it.
- **Accent** uses `--pick`.
- **Ink** uses `--fill-on`, with the overlay text in `--fill-slab`.

**Light and dark.** Tokens only.

**Stroke on.** The 1 px outline is drawn more strongly in `--pane-edge` at double strength; otherwise the look is unchanged.

## Behaviour

- **Hold.** Pointer down starts the fill. Progress goes from 0 to 1 over `hold` seconds, shaped by `easing`:
  - **Linear.**
  - **Build-up** (ease-in: slow start, then rushes, so it feels like pressure building).
  - **Ease-out.**

  It is driven by `requestAnimationFrame`. The pill also scales down very slightly (to 0.98) while held.
- **Early release.** Letting go before 1 drains the fill back to 0 over about 300 ms with a springy ease. The pill shakes sideways (3 cycles, ±4 px, 300 ms), and the hint "Hold to delete" fades in under it for 2 s. Pressing again mid-drain resumes from the current progress.
- **Complete.** At 1:
  1. The fill locks and the label morphs: the text cross-fades from "Delete project" to "Deleted", the trash icon morphs to a check, and the pill's width animates to fit.
  2. `crunch` plays and the haptic fires.
  3. After 500 ms the pill splits. The deleted part shrinks into the soft chip, and the dark "Undo" pill slides out to its right and grows from 0 width, with springs written in CSS `linear()`.
- **Undo window.** The ring depletes over `undo` seconds. Hovering the Undo pill shows the seconds left in a small tooltip above it.
  - **Undo** reverses the split: the Undo pill collapses into the chip, the chip grows back into the full pill, the colour drains back to idle, and the label returns to "Delete project". `pop` plays.
  - **Timeout:** the same merge back to idle happens by itself, and `collapse` plays.

## Interaction

- **Pointer.** Hold on the pill with pointer down. Pointer leave, up or cancel counts as release; pointer capture is set so a slight drag does not cancel. Press Undo during the window.
- **Keyboard.**
  - The pill is a `button` labelled "Delete project, hold to confirm".
  - Holding Space or Enter fills it; key repeat is ignored and keyup releases.
  - Undo is a button labelled "Undo delete, 4 seconds left", with the seconds updating.
  - Focus moves to Undo when it appears and back to the pill after undo or timeout.
- **Touch.** Same as pointer. `touch-action: none` and `user-select: none` on the pill, and `-webkit-touch-callout: none`, so a long press does not open the system menu.
- **Haptic** (if `haptic` is on). Calls `navigator.vibrate(30)` on complete and `navigator.vibrate([10, 40, 10])` on early release, where supported (it does nothing on desktop and iOS Safari).
- **Reduced motion.**
  - The fill still progresses, since it is the meaning, but without springs.
  - There is no shake; the hint shows instead.
  - The split and merge become cross-fades.
  - The ring depletes linearly, as before.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| label | Label | text | up to 24 chars | "Delete project" | Button text |
| doneLabel | Done label | text | up to 16 chars | "Deleted" | Text once deleted |
| hold | Hold (s) | range | 0.5–3, step 0.1 | 1.2 | How long to hold |
| easing | Fill easing | select | Linear, Build-up, Ease-out | Build-up | How the fill progresses |
| undo | Undo window (s) | range | 2–10, step 0.5 | 5 | How long Undo is offered |
| fill | Fill colour | select | Danger, Accent, Ink | Danger | Fill and deleted colour |
| radius | Corner (px) | range | 6–28 | 28 | Corner radius (28 = full pill at default size) |
| haptic | Haptic | toggle | | true | Vibrate on delete and early release, where supported |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| While holding | `charge` | new (loop) | Soft warm sustained hum | volume 0 → 0.6 and pitch 0.8 → 1.6 following progress; fades out in 80 ms on release or complete | one instance |
| Deleted | `crunch` | new | Paper crumple into a bin, soft thud | volume 0.9 | once |
| Early release | `swipe` | reuse | Quick soft swish | volume 0.35, pitch 0.85 | once |
| Undo pressed | `pop` | reuse | Bubbly pop | volume 0.7 | once |
| Undo window expires | `collapse` | reuse | Soft whoosh falling | volume 0.5 | once |

**Shell requirement.** `charge` needs looping playback with live pitch and volume. When the sound plumbing is built (see AGENTS.md 3b), `play` must support `{ loop: true }` and return a handle with `stop(fadeMs)`, `setPitch(n)` and `setVolume(n)`. The component's `onSound` signature becomes `onSound(name, o) => handle | void`. If the plumbing already exists without this, extend it and say so.

New sounds:

**`charge`**
- **ElevenLabs prompt:** "A soft steady warm synth hum with a gentle airy shimmer, smooth sustained interface tone building tension, seamless loop, no attack, no reverb"
- **duration_seconds:** 2.0 · **prompt_influence:** 0.6 · **loop:** true
- **Trim to:** keep the full 2 s loop; only level it, do not trim silence (it must loop seamlessly)

**`crunch`**
- **ElevenLabs prompt:** "A short satisfying crumple of a paper ball dropped into a trash can with a soft thud, dry, close, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.7 · **loop:** false
- **Trim to:** about 300 ms

## Dependencies

- `@iconify/react`, for the trash and check icons, per the house icon rule.
- No animation library: the fill and clip are driven by `requestAnimationFrame`, and the springs are CSS `linear()`.
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 7 seconds; ends where it started. Use `undo: 5` (the default) so the demo presses Undo well before the timeout.

1. The cursor appears below the pill.
2. It glides onto the pill (500 ms) and presses for 400 ms, then releases. The fill gets about a third of the way, drains back, the pill shakes, "Hold to delete" appears, and `swipe` plays softly.
3. It waits 600 ms.
4. It presses and holds for the full `hold` time plus 100 ms. The fill crosses and the text turns white letter by letter as `charge` rises. At full it shows "✓ Deleted" and `crunch` plays. It releases.
5. It waits 800 ms while the pill splits into "✓ Deleted" and "Undo" with the ring depleting.
6. It glides to "Undo" (400 ms) and presses. The pair merges back to "Delete project" and `pop` plays.
7. It glides away (500 ms).

The demo's long hold needs the runner to keep the pointer down; `{ wait: ms }` between `{ down: true }` and `{ up: true }` does this.

## Card fit and hit areas

Only the pill reacts, or the chip and Undo pill when split. The chip is not interactive, so it falls through, and the gap between the chip and Undo is empty. The root is an inline-flex sized to content, so empty card space falls through to the card link. Check `elementFromPoint` just outside the rounded ends in both idle and split states.

## Accessibility and edge cases

- A live region announces "Project deleted. Undo available for 5 seconds", "Delete undone" and "Undo expired".
- If `hold` changes mid-hold, the fill continues at the new rate from the current progress.
- Holding again during the undo window is not possible, since the pill is split.
- Losing focus or the window losing visibility mid-hold counts as release.
- Very short `hold` (0.5 s) still shows the fill clearly.
- If `label` is long, the pill grows; the white overlay copy must match its width exactly (it uses the same element structure).
- `charge` must stop on unmount.

## Acceptance checklist

- [ ] Looks right in light and dark with all three fill colours; `--danger` token added
- [ ] Text turns white exactly under the fill's edge, letter by letter
- [ ] Early release drains, shakes and shows the hint; resuming mid-drain continues
- [ ] Complete morphs to "✓ Deleted", splits into chip + Undo, and the ring depletes over `undo`
- [ ] Undo and timeout both merge back to idle
- [ ] Every knob visibly changes it, including easing, the text labels and haptic (checked via a stubbed `navigator.vibrate`)
- [ ] `charge` loops and follows progress, then stops cleanly; `crunch`, `swipe`, `pop` and `collapse` play at their moments; all respect `sound` and `volume`
- [ ] Keyboard hold with Space/Enter works, key repeat is ignored, and focus moves to Undo and back; reduced motion behaves
- [ ] Demo runs short hold → full hold → undo and ends in the starting state

## Decisions log

- After the undo window: reset to the button, as in the reference. (User)
- Early release: the fill drains with a shake and a "Hold to delete" hint. (User)
- Undo ring: a countdown ring, with seconds left on hover. (User)
- Sound: new looping `charge` following the fill, new `crunch` on delete; reuse `swipe`, `pop` and `collapse`. (User; sounds suggested by agent)
- Play demo: short hold, full hold, undo. (User)
- Extra knobs: haptic and fill easing; the user did not pick fill direction or show icon. (User)
- Decided by agent:
  - the `--danger` token values;
  - a soft tint for the chip;
  - the done label as a text knob;
  - Build-up as the default easing;
  - looping sound handles in the sound plumbing;
  - pointer capture so slight drags do not cancel;
  - icons via Iconify (house rule).
