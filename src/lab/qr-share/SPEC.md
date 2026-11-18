# QR share

- **Slug:** `qr-share` (URL `/qr-share`)
- **Number:** 35 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/23.mp4` (a "Show QR Code" pill that blurs and grows into a card with a dotted QR code with rounded finder corners, a "Copy Link" button and a ×; copying morphs the text to "Copied Link"; × blurs it back into the pill). Only the idea is used.

## Summary

A share button that blooms into a scannable QR code. Press it to reveal the code rippling in dot by dot, copy the link, or close it back into a pill.

## Look

**Pill (closed).** 40 px tall, fully rounded, on `color-mix(in srgb, var(--fill-on) 6%, var(--fill-slab))`, padding 0 16 px: `ph:qr-code-bold` 16 px and "Show QR code", 14 px weight 500, `--fill-on`.

**Card (open).** About 200 px wide, radius 24, the same surface as the pill, padding 10:

- **QR plate:** a `size` px square (default 170) on `--fill-slab`, radius 16, with `quiet` modules of margin (default 2) around the code.
- **QR code:** the link encoded by `qrcode-generator` (error correction M). Data modules drawn as dots (`dots`: Round default, Square, Diamond) at 78% of the module size; the three finder patterns drawn as one shape each (`finders`: Rounded default, the video's look; Square; Circle) with a rounded inner eye. Colour from `accent`: Ink (`--fill-on`, default) or Pick (`--pick`).
- **Buttons row,** 8 px below: "Copy link" (a pill on `--fill-slab`, `ph:link-bold` and the label, 13 px weight 500) filling the width, and a round × button (`ph:x-bold`) at the right.

**Light and dark.** Tokens only, one surface. In dark mode the code is light dots on a dark plate (an inverted QR); the phone cameras on current iOS and Android read inverted codes. With the Pick accent, contrast is lower; keep `--pick` at least 3:1 against `--fill-slab` (check at build time).

**Stroke on.** 1 px `--pane-edge` around the pill and card.

## Behaviour

- **Open.** Pressing the pill: the pill's contents blur out (blur `blur` px, default 10, and fade) while the element grows to the card's size and radius (CSS transition on width, height, border-radius, 320 ms, a `linear()` spring); the card's contents blur in from `blur` to sharp. With `ripple` on, the QR's modules appear from the centre outward: each module fades and scales in from 0.3 with a delay proportional to its distance from the centre, the whole ripple taking `rippleSpeed` ms (default 500). Finders scale in last with a small overshoot. `expand` plays.
- **Copy.** Pressing "Copy link" copies `url` (default `https://labs.glitchnobody.com`) with `navigator.clipboard.writeText`. The label morphs letter by letter from "Copy link" to "Copied link" (shared letters stay; new letters blur in; the label's width animates), and `settle` plays. After 2 s it morphs back. If the clipboard is refused, the label shows "Press Ctrl+C" and the URL is placed in a visually hidden selected input.
- **Close.** Pressing × or Escape: the reverse morph (contents blur out, card shrinks to the pill, pill contents blur in). `collapse` plays.
- **Interrupting.** Pressing × mid-open reverses from the current size.

## Interaction

- **Pointer.** Press the pill, Copy link and ×.
- **Keyboard.** The pill is a `button` with `aria-expanded`; open, focus moves to Copy link; Escape closes and returns focus to the pill. The QR is an `img` with `alt` "QR code for labs.glitchnobody.com". A live region announces "Link copied".
- **Touch.** Same as pointer.
- **Reduced motion.** No blur, ripple or spring: a 120 ms cross-fade between pill and card; the label swaps without morphing.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| dots | Dots | select | Round, Square, Diamond | Round | Data module shape |
| finders | Finders | select | Rounded, Square, Circle | Rounded | Corner marker style |
| ripple | Ripple | toggle | | true | Modules ripple in from the centre on open |
| rippleSpeed | Ripple (ms) | range | 150–1200, step 50 | 500 | How long the ripple takes |
| blur | Blur (px) | range | 0–20 | 10 | Blur during the morph |
| size | QR size (px) | range | 120–220 | 170 | Code size |
| quiet | Margin (modules) | range | 0–4 | 2 | Quiet zone around the code |
| accent | Dots colour | select | Ink, Pick | Ink | Code colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `url` and `label`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Opens | `expand` | reuse | Soft whoosh rising | volume 0.5 | none |
| Closes | `collapse` | reuse | Soft whoosh falling | volume 0.5 | none |
| Link copied | `settle` | reuse | Soft lock-in click | volume 0.55 | none |

No new sounds.

## Dependencies

- `qrcode-generator` (the user's choice; MIT, version 2.x, about 6 kB gzipped once tree-shaken to the encoder) to compute the module matrix; the drawing is our own SVG. Import only `qrcode(typeNumber 0, "M")` and read `isDark(r, c)`.
- `@iconify/react` for the QR, link and close icons (house rule).
- Set `install: "npm install qrcode-generator @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends closed.

1. The cursor appears below the pill ([0.6, 1.8], instant; fractions of the closed pill, measured at build time for the open card too).
2. It glides to the pill (500 ms) and presses: it blooms into the card, the dots ripple in; `expand`.
3. It waits 700 ms, glides to Copy link (400 ms) and presses: "Copied link"; `settle`.
4. It waits 900 ms, glides to × (400 ms) and presses: it folds back into the pill; `collapse`.
5. It waits 400 ms and glides away (500 ms).

## Card fit and hit areas

The root is the morphing element (pill or card), so its box matches what is visible; it grows from the pill's centre (positioned absolutely from a pill-sized anchor so the wall layout does not jump). Check `elementFromPoint` beside the closed pill and beside the open card (card link), and on the QR plate and buttons (component).

## Accessibility and edge cases

- Long URLs increase the QR version (more modules); the module size shrinks to fit `size`. Above about 150 characters, show a warning in development only.
- `quiet` 0 can hurt scanning; it is allowed (user setting).
- Check scanning at build time with a phone in both themes and both accents.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines it
- [ ] The pill blooms into the card with blur and the dots ripple from the centre; × reverses
- [ ] The QR scans with a phone (light and dark) and opens labs.glitchnobody.com
- [ ] Copy link morphs to "Copied link" and copies (stubbed); the fallback works
- [ ] Every knob visibly changes it (dots, finders, ripple, ripple speed, blur, size, margin, colour)
- [ ] `expand`, `collapse`, `settle` respect `sound` and `volume`
- [ ] Focus handling and Escape; reduced motion cross-fades
- [ ] Demo opens, copies, closes

## Decisions log

- QR: real and scannable, using `qrcode-generator`. (User)
- Link: labs.glitchnobody.com. (User)
- Motion: blur morph with a dot ripple, CSS only. (User)
- Sound: `expand`, `collapse`, `settle`. (User)
- Knobs: dot shape and finder style, ripple and blur, size and margin, dot colour. (User)
- Play demo: open, copy, close. (User)
- Decided by agent:
  - the slug `qr-share` and the tag Press;
  - error correction level M;
  - an inverted QR in dark mode rather than a white plate (keeps one surface, per the single-surface rule);
  - the letter-by-letter label morph;
  - copied state lasts 2 s.
