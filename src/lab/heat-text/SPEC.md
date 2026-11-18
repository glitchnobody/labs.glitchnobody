# Heat text

- **Slug:** `heat-text` (URL `/heat-text`)
- **Number:** 14 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/05.jpg` (thin mono capitals, "COLOR CHANGES EVERYTHING DEPENDING ON HOW LIGHT TOUCHES IT", one word per line and centred, with a thermal-camera blob in blue, red, pink and yellow painted over the middle and swallowing letters). Only the idea is used.

## Summary

Words that heat up under your pointer. Move across the text and you leave a thermal-camera trail that blooms from blue to red to yellow, swallows the letters, and cools away.

## Look

**Text.** The default words "COLOR CHANGES EVERYTHING DEPENDING ON HOW LIGHT TOUCHES IT", one word per line, centred, in the site font (`var(--font-ui)`, Inter, weight 300), capitals, `fontSize` px (default 30) with line height 1.05 and `tracking` letter spacing, in `--fill-on` on `--fill-slab`. About 300 × 340 px at the default size. The text is real DOM text (selectable, readable by screen readers).

**Heat.** A WebGL canvas exactly over the text block (with 16 px bleed). Where there is heat, it paints an opaque blob coloured by temperature; where there is none, it is transparent. Blob edges are soft-gooey, set by `goo`.

**Palettes** (`palette`), cold → hot:

| Palette | Ramp |
| ------- | ---- |
| Thermal (default, the image) | `#3d7bff` blue → `#c2185b` deep red → `#ff9ec4` pink → `#fff36b` yellow → `#ffffff` white core |
| Infrared | `#3b0000` → `#c81e1e` → `#ff7a1a` → `#ffe9b0` → white |
| Ink | `--fill-on` at 30% → `--fill-on` → `--ink-3`, so it reads as a grey smudge in either theme |
| Pick | `--pick` mixed to `--fill-slab` → `--pick` → `color-mix(in srgb, var(--pick) 40%, white)` |

Thermal and Infrared are fixed colours (they are the effect); Ink and Pick read the tokens at mount and when the Fill switch changes (watch the tokens with a `MutationObserver` on the `data-fill`/`data-theme` attributes and re-read with `getComputedStyle`).

**Light and dark.** The text and background use tokens; the thermal palettes stay the same in both.

**Stroke on.** Nothing to outline (the text sits on the card's surface).

## Behaviour

- **Heat field.** A simulation on a low-res float texture (about 128 × 144, aspect-matched), ping-ponged between two framebuffers each frame:
  1. **Add.** For each pointer movement since the last frame, a soft Gaussian splat of radius `brush` px is added along the segment (several splats spaced at half the radius, so fast moves leave a continuous line). Its strength is `heat` scaled by pointer speed (clamped), so fast strokes run hotter.
  2. **Spread.** A light 5-tap blur, so heat diffuses outward a little and blobs merge.
  3. **Cool.** Multiply by a decay factor computed from `cooling` (seconds for heat to fall to 5%), adjusted for frame time.
- **Display pass.** Heat → colour through the palette ramp (a 1D gradient texture). Below a threshold the pixel is transparent; `goo` sets how sharp the threshold edge is (0 = soft fog, 100 = hard metaball edge), giving the image's blobby outlines. The hottest areas reach yellow and white.
- **Idle drift.** When `drift` is on and nobody has touched it for 3 s, a faint warm spot wanders slowly over the text on a smooth noise path (low heat, so it stays blue to red) and stops the moment the pointer enters.
- **Rest.** When total heat falls to zero and drift is off, the rAF loop stops; it restarts on the next pointer move.

## Interaction

- **Pointer.** Hover paints heat; no press needed. Pointer events on the text block (so text selection still works underneath: the canvas is `pointer-events: none` and the listener sits on the block).
- **Keyboard.** Not interactive by keyboard; the text is plain text. The block has `aria-label` equal to the text and the canvas is `aria-hidden`.
- **Touch.** Dragging a finger paints; `touch-action: pan-y` so page scroll still works vertically. (Horizontal drags paint; vertical drags scroll.)
- **Reduced motion.** No drift. Heat still follows the pointer (it is a direct response) but cools twice as fast.
- **No WebGL.** The text renders on its own with no effect; nothing else changes.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| text | Text | text (multiline) | up to 80 chars | the default words | The words; one word per line |
| fontSize | Font size (px) | range | 16–48 | 30 | Text size |
| tracking | Letter spacing (em) | range | 0–0.2, step 0.01 | 0.04 | Letter spacing |
| brush | Brush (px) | range | 10–60 | 26 | Heat splat radius |
| heat | Heat | range | 10–100 | 60 | How much heat each movement adds |
| cooling | Cooling (s) | range | 0.5–6, step 0.1 | 2.2 | How long heat takes to fade |
| palette | Palette | select | Thermal, Infrared, Ink, Pick | Thermal | Heat colours |
| goo | Goo | range | 0–100 | 70 | How blobby and hard-edged the heat is |
| drift | Idle drift | toggle | | true | A warm spot wanders when untouched |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type with `multiline: true` (introduced by `staggered-countdown` and `multiline-copy`).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| While there is heat on screen | `heat` | new, looping | Soft warm sizzle | `play("heat", { loop: true })` starts on the first heat; `setVolume` follows total heat (0 to 0.6 × volume), `setPitch` 0.9 + 0.2 × pointer speed; `stop(300)` when heat reaches zero | continuous |

Drift heat is quiet enough that the loop stays near silent (volume capped at 0.1 while drifting).

New sound:

- **Name:** `heat`
- **ElevenLabs prompt:** "A soft steady warm sizzle, like a gentle hiss of heat shimmer over a warm pan, smooth airy texture, no crackle peaks, seamless loop, no reverb"
- **duration_seconds:** 2 · **prompt_influence:** 0.6 · **loop:** true
- **Trim to:** a clean 2 s loop (keep the API's loop seam; only level it)

## Dependencies

- None. WebGL 1 with the `OES_texture_half_float` extension for the heat texture (fallback to `UNSIGNED_BYTE` with slightly banded heat if it is missing). Three small shaders (splat, blur-and-decay, display), about 150 lines total.
- No icons.

## Play demo

Agreed with the user. About 5 seconds.

1. The cursor appears above the text on the right ([0.75, 0.2], instant).
2. It moves left along the third line ("EVERYTHING") to about [0.3, 0.3] (500 ms): heat trails behind it.
3. It curves down and right through "DEPENDING" and "ON" to [0.62, 0.48] (500 ms).
4. It sweeps left along "LIGHT" to [0.25, 0.58] (500 ms).
5. It curves down and right through "TOUCHES" to [0.55, 0.78] (500 ms), finishing an S like the image.
6. It glides away to the bottom right (500 ms). The trail blooms to yellow where it overlapped and cools away over about 2 s.

## Card fit and hit areas

The text block is a rectangle but the words have ragged edges. Painting is the point, so the whole text block (including the gaps between short words) should react: keep the block's box as the hit area, but trim it to the text's actual width (fit-content, centred) so the card's side margins fall through. Check `elementFromPoint` to the left of the block (card link) and on a short word's side gap (component). On the wall, scale the block to fit the stage height if the text is taller.

## Accessibility and edge cases

- Text stays real and selectable; the effect never replaces it.
- Long words at large sizes wrap mid-word with `overflow-wrap: anywhere` rather than overflow.
- Resize: the canvas resizes with a `ResizeObserver` and the heat texture is cleared.
- WebGL context loss: stop the loop, restore on `webglcontextrestored`.
- Many components with WebGL on one page: create the context lazily when the card first becomes visible (`IntersectionObserver`) and release it when far off screen.
- High-DPI: the display canvas uses `devicePixelRatio` up to 2; the heat texture stays low-res.

## Acceptance checklist

- [ ] Text looks right in light and dark; the thermal blob looks like the image
- [ ] Hovering paints a continuous trail, faster strokes are hotter, overlaps bloom to yellow, heat cools in `cooling` seconds
- [ ] `goo` goes from soft fog to hard blobs; idle drift wanders and stops on touch
- [ ] Every knob visibly changes it (text, size, spacing, brush, heat, cooling, palette, goo, drift)
- [ ] The `heat` loop fades in and out with the amount of heat and respects `sound` and `volume`
- [ ] Text remains selectable; no WebGL shows plain text; reduced motion disables drift
- [ ] Demo scribbles an S and the heat cools away by itself

## Decisions log

- Behaviour: the pointer paints heat by hovering; it cools by itself. (User)
- Rendering: WebGL shader. (User)
- Sound: a new looping `heat` sizzle whose volume follows the amount of heat. (User)
- Play demo: scribble an S. (User)
- Knobs: brush and cooling, palette, text and font size, goo and idle drift. (User)
- Theme: text uses tokens, the thermal palette stays fixed colours. (User)
- Font: the site font (Inter, light), not the image's monospace. (User)
- Decided by agent:
  - the slug `heat-text` and the tag Hover;
  - one word per line, centred, like the image;
  - letter spacing as an extra knob alongside font size;
  - heat strength follows pointer speed;
  - the Ink and Pick palettes re-read the tokens when the Fill switch changes;
  - no WebGL means plain text, with no Canvas 2D fallback;
  - the WebGL context is created lazily when visible.
