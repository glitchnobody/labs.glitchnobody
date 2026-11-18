# Liquid word

- **Slug:** `liquid-word` (URL `/liquid-word`)
- **Number:** 31 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/18.mp4` (a walkthrough of an animated SVG-filter word, "PRO": a moving striped gradient fills the letters, a lighting filter turns it into chrome, a colour lookup table maps the greys to a thermal palette from navy through blue, orange and pink to white, then blur and grain soften it into liquid; "That's the whole file, ~3 KB"). Only the technique and look are used.

## Summary

A word made of flowing liquid chrome. Move over it and the flow bends toward you; press and hold to melt the letters together.

## Look

**Word.** The `word` (default "LABS") in heavy capitals, `var(--font-ui)` at weight `weight` (default 900), sized to fit about 300 px wide (font size computed from the word's length, roughly 96 px for four letters), centred. It is an SVG `<text>` element so the filters apply to it; the stage is about 320 × 150 px.

**Filter chain** (all SVG, applied to the text):

1. **Stripes:** the fill is a repeating linear gradient of white → black → white bands, `stripe` px wide, moved continuously along its axis (the flow).
2. **Chrome:** a lighting stage (`feGaussianBlur` on the alpha, then `feSpecularLighting` with a distant light, blended over the stripes with `feComposite arithmetic` and `feBlend overlay`), strength from `chrome`, which gives the grey bands a rounded, metallic depth.
3. **Colour:** an `feComponentTransfer` with `type="table"` per channel maps the greys to the palette.
4. **Blur and grain:** an `feGaussianBlur` of `blur` (softens the bands into liquid) and an `feTurbulence` noise layer blended at `grain` strength.

**Palettes** (`palette`), dark → light grey mapping:

| Palette | Table |
| ------- | ----- |
| Thermal (default, the video) | navy `#0a0f3c` → blue `#1f5bff` → cyan `#6ad5ff` → orange `#ff7a29` → pink `#ff6ad5` → white |
| Chrome | no colour map (the grey chrome itself) |
| Sunset | deep plum → crimson → orange → gold → cream |
| Mint | deep teal → green → mint → pale aqua → white |

These are fixed colours: they are the effect (like `heat-text`'s thermal palette).

**Light and dark.** The stage is transparent on the card; the word looks the same in both themes. Chrome stays readable on dark because its highlights reach white and its shadows reach black.

**Stroke on.** Nothing to outline; harmless.

## Behaviour

- **Drift.** At rest the stripes flow slowly along a 30° axis at `speed`.
- **Bend (hover).** The pointer's position over the word steers the flow: the gradient's angle eases toward the direction from the word's centre to the pointer, and its speed rises with pointer movement speed (up to 3× `speed`), easing back to the drift over about 1 s once the pointer stops or leaves. The gradient is driven by `gradientTransform` from a rAF loop (not SMIL), so it can respond.
- **Melt (press and hold).** While held, the blur rises toward `blur + 10` over 900 ms and an alpha threshold (`feComponentTransfer` on alpha, table "0 0 1 1") keeps edges crisp, so the letters swell and merge into blobs like the video's close-ups. Releasing springs the blur back (small overshoot, 500 ms).
- **Loop.** The rAF loop pauses when the card is off screen (`IntersectionObserver`) and when the tab is hidden.

## Interaction

- **Pointer.** Hover bends the flow; press and hold melts. Pointer capture during the hold.
- **Keyboard.** The word is a focusable `img` with `aria-label` equal to the word; holding Space or Enter while focused melts it.
- **Touch.** Dragging a finger bends the flow; press and hold melts.
- **Reduced motion.** No drift or bend: a static frame of the stripes and filter; press-and-hold still melts but without the spring (a 200 ms ease each way).

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| word | Word | text | up to 8 chars | LABS | The word |
| weight | Weight | range | 600–900, step 100 | 900 | Font weight |
| speed | Flow speed | range | 0–100 | 35 | How fast the stripes move at rest |
| stripe | Stripe (px) | range | 20–200 | 90 | Width of the flowing bands |
| blur | Blur | range | 0–12, step 0.5 | 4 | Resting softness |
| grain | Grain | range | 0–100 | 25 | Film-noise amount |
| chrome | Chrome | range | 0–100 | 60 | Lighting depth |
| palette | Palette | select | Thermal, Chrome, Sunset, Mint | Thermal | Colour mapping |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| While the flow is bent or melting | `heat` | reuse (from `heat-text`), looping | Soft warm sizzle | `play("heat", { loop: true })` on the first bend or press; `setVolume` follows max(pointer speed, melt amount) × 0.5; `setPitch` 0.8 + 0.4 × melt; `stop(400)` when both return to rest | continuous |

No new sounds. The resting drift is silent.

## Dependencies

- None. Inline SVG filters and a rAF loop updating the gradient transform and blur.
- No icons.

## Play demo

Agreed with the user. About 6 seconds.

1. The cursor appears above the word on the left ([0.05, 0.1], instant).
2. It swirls across the letters in a loose S from left to right (2000 ms): the flow bends after it, the sizzle rises.
3. It moves back to the middle of the word (400 ms), presses and holds 1200 ms: the letters melt and merge.
4. It releases: they spring back to crisp liquid.
5. It waits 500 ms and glides away (500 ms).

## Card fit and hit areas

The SVG's box is a rectangle around the word; the space between and around letters should still react (bending is a field effect), but the stage margins beyond the word's bounding box should fall through. Size the root to the word's measured bounding box plus 8 px. Check `elementFromPoint` beside the word (card link) and between two letters (component).

## Accessibility and edge cases

- Long words (8 chars) shrink to fit the width.
- Filters are GPU-heavy on large areas; the filter region is limited to the text's bounding box.
- Safari renders `feTurbulence` slowly at high resolution: grain uses a low `baseFrequency` tile and `feTile` if needed.
- The heat loop never starts from the resting drift alone.

## Acceptance checklist

- [ ] The thermal liquid look matches the video; all four palettes work
- [ ] Hover bends the flow's angle and speed, easing back to drift
- [ ] Press and hold melts and merges the letters; release springs back
- [ ] Every knob visibly changes it (word, weight, speed, stripe, blur, grain, chrome, palette)
- [ ] The `heat` loop follows bending and melting and respects `sound` and `volume`
- [ ] Space/Enter melt when focused; reduced motion shows a static frame
- [ ] The loop pauses off screen
- [ ] Demo swirls, melts, releases

## Decisions log

- Interaction: the pointer bends the flow; press and hold melts. (User)
- Palette: Thermal plus presets, fixed colours. (User)
- Sound: reuse the `heat` loop. (User)
- Play demo: swirl over the word, press to melt. (User)
- Knobs: word and weight, flow speed and stripe width, blur and grain, chrome depth (plus palette). (User)
- Default word: LABS. (User)
- Decided by agent:
  - the slug `liquid-word` and the tag Hover;
  - the Sunset and Mint palettes;
  - the gradient is driven by a rAF loop rather than SMIL so it can respond to the pointer;
  - the alpha threshold during melt so blobs keep crisp edges;
  - pausing off screen.
