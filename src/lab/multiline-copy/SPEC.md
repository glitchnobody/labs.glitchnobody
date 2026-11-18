# Multi-line copy

- **Slug:** `multiline-copy` (URL `/multiline-copy`)
- **Number:** 8 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** a post on X by @dev_ya, "Copy that shows what it copied" (https://x.com/dev_ya/status/2121770157895008630). It shows a code block whose Copy button paints a selection highlight over the copied lines one after another. Simplified at the user's request to a heading, a paragraph and a copy button, with no code view or tabs. Only the idea is used.

## Summary

A short message with a copy button that shows exactly what it copied: a highlight and an underline sweep through each line, then fade. Press Copy to try it.

## Look

**Block.** About 340 px wide on the wall card, on `--fill-slab` with radius 16 and padding 20, with a soft shadow in light mode and a `--pane-edge` hairline in dark mode.

**Top row.**

- The heading on the left: "Share your invite", in `--fill-on`, 16 px, weight 600.
- The copy button on the right: a small pill on `--card` with `ph:copy-bold` and "Copy" in `--ink-3`, 13 px.

**Paragraph.** Below, in `--ink-2`, 14 px, line height 1.6, wrapping naturally to 3–4 lines at the default width. Default text:

> Hey! I'm using Labs to keep my projects in one place. Here's my invite link so you can join the workspace: labs.example/join/9F3K. It expires in 7 days, so jump in when you can.

**Highlight.** One rounded box per wrapped line, behind the text, sized to that line's text (not the full width). It is drawn in the `highlight` colour at about 22% opacity:

| Option | Colour |
| ------ | ------ |
| Selection | the `--pick` blue, as in the post |
| Accent | also `--pick` |
| Ok | `--ok` green |
| Ink | `--fill-on` |

Selection and Accent are both `--pick` today; they are kept as separate options in case `--pick` changes later. Corner radius is `radius`.

**Underline.** A bar of `underlineWidth` px under each line, in the full-strength highlight colour, travelling with the sweep's leading edge.

**Copied state.** The button shows `ph:check-bold` and "Copied" in `--pick`, on a tint of `--pick` (`color-mix(in srgb, var(--pick) 12%, var(--card))`).

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` on the block and on the button.

## Behaviour

1. **Press Copy.** Copies the heading and paragraph as plain text, joined with a blank line, with `navigator.clipboard.writeText`.
2. **Measure.** Measures the wrapped lines of both the heading and the paragraph with `Range.getClientRects()` on the text nodes, merging rects on the same line, so every visual line gets its own box.
3. **Sweep.** For each line in order, top to bottom:
   - Its highlight box grows from width 0 to the line's width (`transform: scaleX` from the left), over a time set by `speed`.
   - Its underline grows at the same moment, slightly ahead of the highlight's edge, so the underline leads and the highlight follows.
   - Each line starts `stagger` ms after the previous one.
   - When a line's highlight lands, `tick` plays, with pitch rising slightly line by line.

   The heading counts as the first line.
4. **Copied.** When the last line lands, the button morphs: the copy icon rotates and scales out, the check scales in with a small spring (CSS `linear()`), and the text cross-fades to "Copied". `settle` plays.
5. **Hold, then fade.** After `hold` seconds, all highlights and underlines fade out together over 300 ms. The button returns to "Copy" 1.6 s after "Copied" first appeared, or when the fade ends, whichever is later.
6. **Press again mid-way.** Restarts the sweep from the first line. Boxes snap to 0 and grow again, with no stacking; the button stays "Copied" and its timer restarts.
7. **Resize or text change.** If the block is resized or the text changes while idle, lines are re-measured on the next copy. During a sweep, a resize re-measures and the sweep continues on the new lines.

## Interaction

- **Pointer.** Press Copy. The text itself is normal selectable text: selecting part of it by hand still works and is not affected.
- **Keyboard.**
  - Copy is a `button` labelled "Copy message"; Enter and Space press it.
  - After copying, a live region announces "Copied heading and message".
- **Touch.** Same as pointer.
- **Clipboard failure** (permissions, insecure context). The sweep still plays to show what would be copied, then the button shows "Press Ctrl+C" for 2 s and the text is left selected (`Selection.selectAllChildren`) so the person can copy it themselves.
- **Reduced motion.** No growing: every line's highlight and underline fade in at once (150 ms), hold, and fade out. The button swaps instantly. Ticks still play in line order, faster, followed by `settle`.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| heading | Heading | text | up to 40 chars | "Share your invite" | Heading text (copied too) |
| text | Text | text | up to 300 chars | (see above) | Paragraph text (copied) |
| speed | Sweep (ms per line) | range | 120–900, step 20 | 320 | How long each line takes to fill |
| stagger | Line delay (ms) | range | 0–300, step 10 | 90 | Delay between one line and the next |
| hold | Hold (s) | range | 0.3–3, step 0.1 | 1.2 | How long highlights stay before fading |
| highlight | Highlight | select | Selection, Accent, Ok, Ink | Selection | Highlight and underline colour |
| radius | Highlight corner (px) | range | 0–10 | 4 | Rounding of the line highlights |
| underline | Underline | toggle | | true | The travelling underline |
| underlineWidth | Underline (px) | range | 1–4 | 2 | Underline thickness |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`). The paragraph knob should render as a multi-line textarea, so the `text` knob type gets an optional `multiline: true`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A line's highlight lands | `tick` | reuse | Tiny dry tick | volume 0.45, pitch 1 + 0.05 × line index | 1 per 30 ms |
| "Copied" shows | `settle` | reuse | Soft lock-in click | volume 0.8 | once per copy |

No new sounds.

## Dependencies

- No animation library (the user's choice). Lines are measured with `Range.getClientRects()`; highlight and underline boxes are absolutely positioned elements animated with CSS transitions and per-line delays.
- `@iconify/react` for the copy and check icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds. The demo stubs nothing; the runner's click calls the real button, so the clipboard write may be refused in headless tests, and the fallback path is acceptable.

1. The cursor appears below and to the right of the block.
2. It glides to the Copy button (500 ms) and presses. The highlight and underline sweep the heading and each paragraph line in turn with rising ticks, the button morphs to "✓ Copied", and `settle` plays.
3. It waits for the hold and the start of the fade (about 1.6 s).
4. It presses Copy again while the highlights are still fading. The sweep restarts cleanly from the first line and "Copied" stays.
5. It waits for the sweep to finish (about 1.5 s).
6. It glides away (500 ms). The highlights fade out on their own and the button returns to "Copy".

## Card fit and hit areas

Only the Copy button and the text (for selecting) react. The block's padding and the space around it fall through to the card link. On the wall the block is `pointer-events: none` with `auto` on the button and the paragraph and heading text. Check `elementFromPoint` in the block's padding (card link), on the button and on the paragraph text.

## Accessibility and edge cases

- The highlight boxes are `aria-hidden` and pointer-transparent, so they never block text selection.
- With a very long paragraph (300 chars at narrow widths, about 8 lines), the total sweep time is about 8 × stagger + speed. Keep the defaults so it stays under 1.5 s.
- An empty heading: the sweep starts at the paragraph and the copy contains only the paragraph.
- RTL text: the highlight grows from the right (read `direction` from computed style).
- Font loading after the first measure: re-measure on `document.fonts.ready`.
- Changing `text` mid-sweep cancels the sweep and resets.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the block and the button
- [ ] Each wrapped line gets its own highlight sized to its text; the underline leads the sweep
- [ ] The heading and paragraph are both highlighted and copied (check with a stubbed clipboard)
- [ ] The button morphs to "✓ Copied" and back; pressing again mid-fade restarts cleanly
- [ ] The clipboard fallback selects the text and shows "Press Ctrl+C"
- [ ] Every knob visibly changes it (heading, text, speed, line delay, hold, colour, radius, underline, thickness)
- [ ] `tick` per line with rising pitch and `settle` on Copied respect `sound` and `volume`
- [ ] Keyboard works; the live region announces; reduced motion fades instead of sweeping
- [ ] Demo runs copy → copy again and ends in the idle state

## Decisions log

- Simplified to a heading, a paragraph and a copy button, with no code view or tabs. (User)
- Highlight: a line-by-line sweep plus an underline that travels with the sweep. (User)
- Text: the heading and paragraph are both highlighted and copied, and both are editable. (User)
- Button: top right, morphing to "Copied". (User)
- Sound: `tick` per line and `settle` on Copied; no new sounds. (User)
- Play demo: copy, then copy again mid-fade. (User)
- Library: none. (User)
- Extra knobs: underline on/off and thickness, highlight radius. (User)
- Decided by agent:
  - the slug `multiline-copy`;
  - the invite text;
  - the highlight colour options;
  - the clipboard-failure fallback;
  - a multi-line textarea for the text knob;
  - RTL support;
  - re-measuring after fonts load.
