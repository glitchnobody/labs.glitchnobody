# ASCII bloom

- **Slug:** `ascii-bloom` (URL `/ascii-bloom`)
- **Number:** 46 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/34.mp4` (a time-lapse of a dahlia-like flower blooming, rendered entirely as tiny ASCII and dither characters in grey on near-black). The footage is not used; the flower here is drawn in code. Only the idea is used.

## Summary

A flower made of text characters. Drag down to fold it into a bud, drag up to make it bloom; let go and it slowly opens again by itself.

## Look

**Stage.** A 280 × 260 px panel, radius 16, transparent on the card with a 1 px `--pane-edge` border (a bounded field), the flower centred near the bottom with its stem running to the bottom edge.

**Glyphs.** The whole panel is a grid of character cells `cell` px (default 7) high, each cell showing one glyph whose density matches the brightness of the flower at that spot. Character sets (`charset`):

| Charset | Glyphs, dark → bright |
| ------- | --------------------- |
| Classic (default) | ` .:-=+*#%@` |
| Blocks | ` ░▒▓█` |
| Binary | ` 01` (0 for mid tones, 1 for bright) |

Glyph colour from `ink`: Ink (`--fill-on`, default, the video's grey-white), Pick (`--pick`), Ok (`--ok`), drawn at an opacity that also follows brightness so dark areas fade into the background. Background cells are empty.

**Flower.** Drawn procedurally: a stem, two leaves, and three layers of petals (outer 14, middle 12, inner 10), each petal an elongated teardrop with a soft gradient from base to tip and a darker centre crease, plus a dense, darker disc at the centre. A light from the upper left gives the petals shading (brighter edges, darker undersides), so the ASCII reads as the video's grainy relief.

**Light and dark.** The glyph colour comes from the tokens (read at mount and when the Fill switch changes, as in `heat-text`); the panel is transparent.

**Stroke on.** The panel already has a hairline; harmless.

## Behaviour

- **Bloom amount.** A value from 0 (a closed bud: petals folded upright and overlapping, small) to 1 (fully open: petals spread flat and wide, the flower about 1.8× the bud's size). Each petal layer opens on its own curve (outer first, inner last), and the flower grows as it opens, like the time-lapse.
- **Drag.** Pressing anywhere on the panel and dragging up increases the bloom (one full bloom per 160 px of drag), dragging down decreases it; it follows the pointer directly. The `rustle` loop's volume follows the drag speed.
- **Release and drift.** On release it keeps a little momentum, then drifts slowly back toward fully open at `drift` (bloom per second, default 0.12, about 8 s from bud to bloom). At full bloom it holds 3 s, then gently closes to 0.75 and opens again (a slow breathing loop), so the card is never still for long.
- **Rendering.** One WebGL fragment shader: for each cell, the flower's brightness is evaluated at the cell centre from signed-distance petals (no first pass), then the glyph is sampled from a glyph atlas texture built at mount by drawing the charset into an offscreen canvas in `ui-monospace`. Pauses off screen; context created lazily when visible.

## Interaction

- **Pointer.** Drag up or down. Pointer capture; `touch-action: none` on the panel.
- **Keyboard.** The panel is a `slider` ("Bloom", 0–100%) with Up/Down ±5%, Home (bud), End (full bloom).
- **Touch.** Same as pointer.
- **Reduced motion.** No drift or breathing loop: the flower stays where it is put; drag still works.
- **No WebGL.** A Canvas 2D version drawing glyphs with `fillText` at a larger cell size (10 px), same behaviour.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| cell | Cell (px) | range | 4–14 | 7 | Character size (smaller is finer) |
| charset | Characters | select | Classic, Blocks, Binary | Classic | Glyph set |
| drift | Drift | range | 0–0.5, step 0.02 | 0.12 | How fast it opens by itself after release (0 = stays put) |
| ink | Ink | select | Ink, Pick, Ok | Ink | Glyph colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| While the bloom changes by drag | `rustle` | new, looping | Soft petal rustle | `play("rustle", { loop: true })` on drag start; `setVolume` follows drag speed (0 to 0.5), `setPitch` 0.9 opening / 0.8 closing; `stop(300)` when the drag ends | continuous |

The slow drift and breathing are silent.

New sound:

- **Name:** `rustle`
- **ElevenLabs prompt:** "A soft continuous rustle of delicate flower petals and leaves brushing together, gentle papery movement, quiet and close, seamless loop, no wind gusts, no reverb"
- **duration_seconds:** 2 · **prompt_influence:** 0.6 · **loop:** true
- **Trim to:** a clean 2 s loop (keep the API's loop seam; only level it)

## Dependencies

- None. WebGL 1, one fragment shader with petal SDFs and a glyph atlas; about 180 lines.
- No icons.

## Play demo

Agreed with the user. About 5 seconds; ends opening by itself.

1. The cursor appears beside the panel ([1.05, 0.5], instant).
2. It glides onto the flower ([0.5, 0.45], 400 ms) and presses.
3. It drags down 120 px (900 ms): the flower folds into a bud, the rustle follows.
4. It drags up 200 px (1200 ms): the flower blooms wide.
5. It releases and glides away (500 ms); the flower settles and keeps breathing.

## Card fit and hit areas

The panel is a rounded rectangle and it is the component. Check `elementFromPoint` just outside its corners (card link) and inside (component).

## Accessibility and edge cases

- Decorative apart from the slider role.
- The glyph atlas is rebuilt when `charset` or `cell` changes.
- High-DPI: the canvas uses `devicePixelRatio` up to 2 and the atlas is drawn at that scale.
- WebGL context loss: stop and restore.

## Acceptance checklist

- [ ] Looks like the video's ASCII relief in light and dark; all three charsets and ink colours work
- [ ] Dragging up blooms and down closes, layers opening in order; release drifts open and breathes
- [ ] Every knob visibly changes it (cell, characters, drift, ink)
- [ ] The `rustle` loop follows drag speed and respects `sound` and `volume`
- [ ] Slider keyboard works; reduced motion stops drifting; no-WebGL fallback works
- [ ] Demo closes to a bud, then blooms

## Decisions log

- Source: a procedural flower (the video's footage is not used). (User)
- Control: drag up and down; it drifts open after release. (User)
- Rendering: WebGL ASCII shader. (User)
- Sound: a new looping `rustle` that follows drag speed. (User)
- Knobs: cell size and charset, drift speed, ink colour. (User)
- Play demo: drag down to close, up to open. (User)
- Decided by agent:
  - the slug `ascii-bloom` and the tag Drag;
  - the flower's petal layers and lighting;
  - the slow breathing loop at full bloom;
  - one shader pass with brightness evaluated per cell;
  - a Canvas 2D fallback.
