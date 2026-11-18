# Gooey compare

- **Slug:** `gooey-compare` (URL `/gooey-compare`)
- **Number:** 56 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** none (described by the user as "before after image gooey slider"; design proposed by the agent).

## Summary

A before/after image slider with a liquid edge. Drag the handle and the split bulges and wobbles like a curtain of liquid, then settles flat.

## Look

**Frame.** 300 × 220 px by default (`width` knob; `aspect` 4:3, 1:1 or 3:4), radius `radius` (default 16), `overflow: hidden`. Both sides show the **same image** (`object-fit: cover`):

- **After** (right / bottom): full colour.
- **Before** (left / top): the same image under a CSS filter picked by `treatment`: Grayscale (`grayscale(1)`), Sepia (`sepia(0.8) contrast(1.05)`), Blur (`blur(6px)`, scaled with a 1.05 zoom so edges don't show), Duotone (`grayscale(1)` plus a `--pick` `mix-blend-mode: color` overlay).
- **Images:** site only. The default has no URL and uses a gradient from a hash of `title` (two hues, plus a soft radial "sun" so the filters have something to show). The site passes `siteProps: { images: ["/lab/demoimages/3.png"] }` (one image; the fox).

**Edge.** The before layer is clipped by an SVG `clipPath` whose right edge is a curve, not a line: a cubic path through the split point whose middle bulges sideways by `b` px (the wobble state, see Behaviour). At rest `b = 0` and the edge is straight.

**Line and handle.** A 2 px line in white (with a 1 px dark shadow) follows the same curve (a stroked copy of the edge path). A 36 px round handle sits on the curve at the middle: `--fill-slab` with `ph:arrows-left-right-bold` (or `ph:arrows-down-up-bold` vertical) 16 px in `--fill-on`, and a soft shadow. White line is a deliberate exception to tokens: it sits on an image.

**Labels** (`labels` on): "Before" and "After" pills, 11 px, in the top corners on each side (`color-mix(in srgb, var(--fill-slab) 80%, transparent)` with backdrop blur, ink `--fill-on`). Each fades out when the edge covers it.

**Light and dark.** Tokens for the handle and pills; the image is the same in both.

**Stroke on.** 1 px `--pane-edge` ring around the frame and the handle.

## Behaviour

- **Drag.** The split follows the pointer (0–100%, kept 2% from each edge). The bulge `b` is driven by a spring whose target is the drag **velocity**: `target = clamp(v × goo, ±60px)`. Moving right bulges the middle of the edge to the right (the liquid lags at the top and bottom and leads in the middle), so a fast sweep throws a big bulge.
- **Settle.** On release, or when the pointer stops, the target goes to 0 and the spring overshoots once or twice (the wobble) before going flat. Spring stiffness and damping come from `wobble` (Low, Medium, High): High = soft and several swings, Low = one small swing.
- **Click to jump.** Pressing anywhere on the frame (not the handle) moves the split there with a spring (300 ms), and the movement feeds the same bulge, so a jump wobbles too.
- **Orientation.** Vertical swaps axes: before on top, after below, the edge bulges up or down.
- Reports `onChange(percent)`.

The bulge and spring are one number each, updated in `requestAnimationFrame`; the path is rebuilt per frame (one `d` attribute).

## Interaction

- **Pointer.** Drag the handle or anywhere on the frame. Pointer capture; `touch-action: none`, `user-select: none`, images `draggable=false`.
- **Keyboard.** The handle is a `slider` "Before and after comparison", `aria-valuetext` "52 percent before". Left/Right (or Up/Down when vertical) ±2, Shift ±10, Home/End; keyboard moves wobble a little too.
- **Touch.** Same.
- **Reduced motion.** No bulge or wobble: the edge stays straight; jumps are instant.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| treatment | Before | select | Grayscale, Sepia, Blur, Duotone | Grayscale | Filter on the before side |
| orientation | Orientation | select | Horizontal, Vertical | Horizontal | Split direction |
| goo | Goo | range | 0–100 | 60 | How far the edge bulges per speed (0 = straight) |
| wobble | Wobble | select | Low, Medium, High | Medium | How long the edge wobbles before settling |
| split | Start (%) | range | 0–100 | 50 | Starting split |
| width | Width (px) | range | 200–360 | 300 | Frame width |
| aspect | Aspect | select | 4:3, 1:1, 3:4 | 4:3 | Frame shape |
| radius | Corner (px) | range | 0–32 | 16 | Frame corners |
| labels | Labels | toggle | | true | Before and After pills |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The split crosses a 10% step | `tick` | reuse | Tiny dry tick | volume 0.25, pitch 0.85 + 0.3 × split | 1 per 40 ms |
| The edge settles after a bulge over 15 px | `jelly` | reuse | Soft wobbly boing | volume 0.2 + 0.3 × bulge / 60 | 1 per 300 ms |

No new sounds.

## Dependencies

- None. One spring in `requestAnimationFrame`, an SVG `clipPath`, CSS filters.
- Icons: `ph:arrows-left-right-bold`, `ph:arrows-down-up-bold` via `@iconify/react`.

## Play demo

Agreed with the user. About 5.5 seconds; ends at 50%.

1. The cursor appears below the frame ([0.5, 1.15], instant).
2. It glides to the handle at [0.5, 0.5] (500 ms) and presses.
3. It sweeps fast to [0.88, 0.5] (250 ms): the edge bulges right; ticks.
4. Wait 700 ms (still pressed): the edge wobbles and settles flat; `jelly`.
5. It drags slowly back to [0.5, 0.5] (1400 ms): a gentle bulge left that barely wobbles. Releases.
6. Wait 400 ms, then it glides away (500 ms).

## Card fit and hit areas

The root is the frame; it is all reactive, so no extra wall rules are needed beyond checking that just outside the frame's rounded corners reports the card link (clip the root with `border-radius` + `overflow: hidden`, and test the corner cut-outs).

## Accessibility and edge cases

- The image has `alt` = `title`; the before copy is `aria-hidden`.
- The bulge is clamped so the edge never crosses the frame side at 2% / 98%.
- `goo` 0 keeps a straight edge with no wobble (a plain compare slider).
- Resizing keeps the split in percent.

## Acceptance checklist

- [ ] Looks right in light and dark, all four treatments, both orientations
- [ ] Fast drags bulge the edge; it wobbles and settles when stopped
- [ ] Clicking the frame jumps with a wobble
- [ ] Labels fade as the edge covers them
- [ ] Every knob visibly changes it
- [ ] `tick` and `jelly` respect `sound` and `volume`
- [ ] Slider keyboard works; reduced motion keeps a straight edge
- [ ] Demo sweeps fast, wobbles, returns slowly to 50%

## Decisions log

- Goo: a liquid wave edge that bulges with drag speed and wobbles back flat. (User)
- Sides: one image; the before side is a CSS filter treatment (knob). (User)
- Orientation: knob, horizontal default. (User)
- Play demo: sweep and wobble. (User)
- Slug `gooey-compare`; sounds `tick` and `jelly`. (User)
- Decided by agent:
  - the tag Drag;
  - the fox painting on the site;
  - white edge line (exception: it sits on an image);
  - no library: one rAF spring is short enough.
