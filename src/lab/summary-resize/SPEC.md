# Summary resize

- **Slug:** `summary-resize` (URL `/summary-resize`)
- **Number:** 42 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/30.mp4` (a small text card with a handle on its right edge, "Drag the edge to summarize"; dragging snaps through stops on a ruler above, In short, Short and Full with word counts, and the text rewrites itself shorter or longer while the card resizes). The text here is about glitchnobody labs. Only the idea is used.

## Summary

A paragraph you resize to summarise. Drag the card's edge narrower and the text rewrites itself shorter; drag it wider for the full story, or click a stop on the ruler.

## Look

**Ruler.** Above the card, right-aligned with the card's widest size: three stops, "In short", "Short", "Full", each a label (11 px, `--fill-on` for the active stop, `--ink-4` otherwise) with the word count under it (10 px, `--ink-4`), over a 1 px `--pane-edge` line with a small tick per stop and a 6 px `--fill-on` dot on the active stop that slides between stops.

**Card.** On `--fill-slab`, radius 12, padding 12 14, soft shadow in light mode, `--pane-edge` hairline in dark. Its width depends on the length: In short 150 px, Short 190 px, Full 250 px.

- Header row: the length name ("In short" / "Short" / "About") on the left in `--ink-3`, 10 px, and the reading time on the right ("5 secs", "10 secs", "20 secs") in `--ink-4`, 10 px.
- Body: 12 px, line height 1.5, `--fill-on`.
- **Handle:** on the card's right edge, vertically centred, a 6 × 22 px rounded bar in `color-mix(in srgb, var(--fill-on) 20%, transparent)`, darkening to `--pick` on hover and while dragging (the video's blue handle); cursor `ew-resize`.

Under the card, "Drag the edge to summarize" in `--ink-4`, 10 px.

**Texts:**

| Stop | Words | Text |
| ---- | ----- | ---- |
| In short | 10 | "Small interactive components with sound. Play, then copy the prompt." |
| Short | 23 | "glitchnobody labs is a wall of small interactive components with sounds. Play with the knobs, then copy the prompt into your own project." |
| Full | 55 | "glitchnobody labs is a growing wall of small interactive components, each with its own sounds and settings. Open a card to play with it, tweak every knob, and read how it works. When you like one, copy the prompt and paste it into your own project. A new component lands every week, sixty in all." |

**Light and dark.** Tokens only (the user asked for no knobs beyond light/dark, sound and volume).

**Stroke on.** 1 px `--pane-edge` around the card (adds one in light mode).

## Behaviour

- **Drag.** Pressing the handle and dragging changes the card's width freely between 150 and 250 px (1:1 with the pointer, with a slight rubber band past the ends). The active stop is the nearest one to the current width; the ruler dot slides to it and, when it changes, the text rewrites (below) and `tick` plays.
- **Release.** The card springs to the active stop's exact width; `settle` plays.
- **Click a stop.** Pressing a stop's label on the ruler springs the card to that width and rewrites the text; `tick` then `settle`.
- **Word diff morph.** The old and new texts are diffed by words (longest common subsequence). Words in both stay and glide to their new positions (FLIP: measure before and after, animate the translation, 260 ms); removed words blur (4 px) and fade out in place (160 ms); new words blur in (160 ms, starting 80 ms in). The card's height animates to the new text's height. The header label and reading time cross-fade.

## Interaction

- **Pointer.** Drag the handle; click ruler stops. Pointer capture; `touch-action: none` on the handle.
- **Keyboard.** The handle is a `slider` ("Summary length", `aria-valuetext` "Short, 23 words") with Left/Right moving between stops; the ruler stops are buttons. The body is a live region (`aria-live="polite"`) so the new text is read out.
- **Touch.** Same.
- **Reduced motion.** No FLIP or blur: the text cross-fades (120 ms) and the width snaps.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Only these two knobs, plus the modal's built-in Fill (light/dark) and Stroke: the user asked to keep this one to light and dark mode. Also takes `texts` (an object with `short`, `medium`, `full`) and `length` (default "Short").

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The active stop changes | `tick` | reuse | Tiny dry tick | volume 0.45, pitch 0.9 / 1.0 / 1.1 by stop | 1 per 80 ms |
| The card snaps to a stop | `settle` | reuse | Soft lock-in click | volume 0.45 | 1 per 200 ms |

No new sounds.

## Dependencies

- None. A small word LCS diff (about 25 lines), FLIP with CSS transforms, a rAF spring for the width.
- No icons.

## Play demo

Agreed with the user. About 6 seconds; ends on Full.

1. The cursor appears to the right of the card ([1.1, 0.6], instant).
2. It glides to the handle (500 ms) and presses.
3. It drags left to the In short width (700 ms): the ruler dot steps Short → In short, the text rewrites with ticks. It releases: the card snaps; `settle`.
4. It waits 700 ms, presses the handle again (at its new place) and drags right to the Full width (900 ms): the text grows back in two rewrites. It releases.
5. It waits 700 ms and glides away (500 ms).

## Card fit and hit areas

The ruler, card and hint sit in a column with empty space to the left of the narrow card. On the wall the root is `pointer-events: none` with `auto` on the card (text is selectable), the handle and the ruler stops. Check `elementFromPoint` to the left and right of the narrow card and on the hint (card link), and on the handle, card and a ruler stop (component).

## Accessibility and edge cases

- Dragging fast across all stops rewrites only to the final stop's text once the pointer pauses for 60 ms, so it never flickers through every version.
- Custom `texts` with very different words still morph (most words fade out and in).
- The card never gets narrower than its longest word.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the card
- [ ] Dragging the edge resizes the card and switches the text at the nearest stop; release snaps
- [ ] Clicking ruler stops animates the size and text
- [ ] The word diff morph keeps shared words and blurs others in and out; the height animates
- [ ] `tick` and `settle` respect `sound` and `volume`
- [ ] Slider keyboard works and the new text is announced; reduced motion cross-fades
- [ ] Demo drags to In short, then to Full

## Decisions log

- Content: three versions of a description of glitchnobody labs. (User)
- Morph: word diff. (User)
- Sound: `tick` at stops and `settle` on snap. (User)
- Play demo: drag to In short, then to Full. (User)
- Knobs: none beyond light/dark (plus the required sound and volume). (User)
- Ruler stops are clickable. (User)
- Decided by agent:
  - the slug `summary-resize` and the tag Drag;
  - the three texts and their widths;
  - free resizing with a snap on release;
  - the 60 ms pause before rewriting during fast drags.
