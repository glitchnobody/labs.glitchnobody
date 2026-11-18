# Notify me

- **Slug:** `notify-me` (URL `/notify-me`)
- **Number:** 38 / 60
- **Tag:** Type
- **Status:** spec
- **Design reference:** `~/Downloads/inso/26.mp4` (a "🔔 Notify Me" pill that blurs and grows to the left into an email field, the button sliding to the right end as a white pill; clicking away folds it back). Only the idea is used.

## Summary

A "Notify me" button that opens into an email field. Type an address and press Enter: a wrong one shakes, a good one folds into "You're on the list".

## Look

**One surface** following the theme: the pill and field on `color-mix(in srgb, var(--fill-on) 7%, var(--fill-slab))`; the button on `--fill-slab` with a soft shadow.

**Closed.** A 44 px pill, padding 0 16: `ph:bell-fill` 15 px and "Notify me", 14 px weight 600, `--fill-on`.

**Open.** A 260 × 44 px pill: an email input on the left (placeholder "Email" in `--ink-4`, text 14 px `--fill-on`, caret in `--fill-on`, no border or outline of its own) and the button at the right end, 38 px tall, radius 19, "Notify me" 13 px weight 600. The bell is hidden while open.

**Invalid.** A hint under the pill, "Enter a valid email", 12 px in `--danger` (added by `hold-to-delete` if not yet built), and the pill gets a 1 px `--danger` ring for 1.5 s.

**Sending.** The button's label is replaced by `ph:circle-notch-bold` spinning.

**Success.** A 44 px pill: `ph:check-circle-fill` in `--ok` and "You're on the list", 14 px weight 600.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the pill.

## Behaviour

- **Open.** Pressing the closed pill: its content blurs out (`blur` px, default 8) while the pill grows to the left (its right edge stays put, as in the video); the button pill appears at the right end where "Notify me" was, and the input blurs in with the caret focused. Duration from `speed` (CSS transition, a `linear()` spring). `expand` plays.
- **Type.** `tick` per keystroke at low volume (rate-limited).
- **Submit.** Enter or the button:
  - **Invalid** (empty or not like `name@domain.tld`, checked with the input's built-in `type="email"` validity plus a dot in the domain): the pill shakes (three quick horizontal moves, 300 ms), the hint and ring show, `collapse` plays at low pitch.
  - **Valid:** the button shows the spinner for 700 ms (simulated, no network), then the pill blurs and shrinks into the success pill; `join` plays. Calls optional `onSubmit(email)`.
- **Close.** Clicking outside or Escape while open (and not sent) folds back to the closed pill (reverse morph); `collapse`. Typed text is kept for the next open.
- **Reset.** The success pill returns to the closed "Notify me" pill after 4 s (so the card resets), or when pressed.

## Interaction

- **Pointer.** Press the pill; type; press the button; click away to close.
- **Keyboard.** The closed pill is a `button` with `aria-expanded`; opening focuses the input (`type="email"`, `aria-label="Email"`, `autocomplete="email"`); Enter submits; Escape closes and returns focus to the pill. The hint is linked with `aria-describedby` and announced; success is announced by a live region.
- **Touch.** Same; the mobile keyboard shows the email layout.
- **Reduced motion.** No blur, spring or shake: cross-fades; invalid shows only the hint and ring.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| blur | Blur (px) | range | 0–20 | 8 | Blur during the morph |
| speed | Speed | range | 0–100 | 60 | Morph speed |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Four knobs: the user kept only these. Also takes `label`, `successText` and `onSubmit`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Opens / closes | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.5 | none |
| A key is typed | `tick` | reuse | Tiny dry tick | volume 0.2, pitch 1 ± 4% random | 1 per 30 ms |
| Valid email sent | `join` | reuse | Warm rising chime | volume 0.55 | none |
| Invalid email | `collapse` | reuse | Soft whoosh falling | volume 0.35, pitch 0.8 | 1 per 300 ms |

No new sounds.

## Dependencies

- None. CSS transitions for the morph and shake; the input's built-in email validity.
- `@iconify/react` for the bell, spinner and check (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. The demo runner cannot type or safely click outside (a click on empty card space opens the modal), so it closes the field by letting an empty field fold back on its own. About 5 seconds.

1. The cursor appears below the pill ([0.5, 1.6], instant).
2. It glides to the pill (500 ms) and presses: it grows left into the email field with the caret; `expand`.
3. It waits 1000 ms.
4. It presses the button with the field empty: the pill shakes and the hint shows.
5. It glides away (500 ms). The empty field folds back to "Notify me" 2 s later; `collapse`.

## Card fit and hit areas

The root is the morphing pill, growing left from a right-anchored position (absolute from a pill-sized anchor so the wall layout does not jump). Check `elementFromPoint` beside the closed pill and beside the open field (card link), and on the input and button (component). The hint below the pill is `pointer-events: none`.

## Accessibility and edge cases

- An empty open field folds back by itself 2 s after the pointer leaves and focus leaves (no typed text is lost because there is none).
- Pasting an address works; whitespace is trimmed before checking.
- No data is sent anywhere by default.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines it
- [ ] The pill grows left into the field with blur; click away or Escape folds it back; an empty field folds back on its own after 2 s away
- [ ] Invalid emails shake with a hint; valid ones spin, then fold into "You're on the list", which resets after 4 s
- [ ] Every knob visibly changes it (blur, speed)
- [ ] Sounds play at their moments and respect `sound` and `volume`
- [ ] Keyboard, labels and announcements work; reduced motion cross-fades
- [ ] Demo opens, shakes on an empty submit, leaves, and the field folds back

## Decisions log

- Submit: validate, then a success pill; no network. (User)
- Sound: `expand`/`collapse`, `tick` on typing, `join` on success. (User)
- Play demo: open and close. (User; it closes by pressing the button on an empty field and letting the empty field fold back, since the demo can neither type nor click outside safely)
- Knobs: blur and speed (four in total with sound and volume). (User)
- Decided by agent:
  - the slug `notify-me` and the tag Type;
  - the pill grows left, as in the video;
  - an empty open field folds back 2 s after the pointer and focus leave;
  - the success pill resets after 4 s;
  - the simulated 700 ms sending spinner.
