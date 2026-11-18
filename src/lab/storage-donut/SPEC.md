# Storage donut

- **Slug:** `storage-donut` (URL `/storage-donut`)
- **Number:** 20 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** `~/Downloads/inso/11.jpg` (a segmented donut of thin coloured arcs, blue, violet, green, amber and grey, each with a soft tinted band inside it; the hovered blue segment has dropped its band and the centre reads "Financial Objections · 184 [64%]"). The data here is storage usage instead. Only the idea is used.

## Summary

A storage breakdown as a segmented ring. Hover a segment: its soft band slides into the arc, the others dim, a note plays and the centre rolls to that category's size.

## Look

**Ring.** 260 px across at the default, centred in a 300 px square. Each segment is drawn as two SVG arcs with round caps:

- **Arc:** the outer line, `arcWidth` px wide (default 6), in the segment colour.
- **Band** (when `band` is on): just inside the arc, a wider (`bandWidth` px, default 34) arc with fully rounded ends, filled with the segment colour at 18% over `--fill-slab` and a 1 px edge of the colour at 30%, as in the image.

Segments are separated by `gap` degrees (default 6), measured between the arcs' round caps. They start at the top (−90°) and run clockwise, largest first.

**Segments** (the first `segments` are shown; when fewer than 5, the rest merge into "Other"):

| Segment | Size | Colour (Colour palette) |
| ------- | ---- | ----------------------- |
| Photos | 72 GB | `#3b82f6` blue |
| Video | 54 GB | `#6366f1` violet |
| Apps | 31 GB | `#10b981` green |
| Documents | 18 GB | `#f59e0b` amber |
| Other | 9 GB | `#737373` grey |

Total used: 184 GB of 256 GB. After the used segments comes a **Free** segment (72 GB): a faint dashed arc (`--ink-5`, `arcWidth` px, dash 2 × 6, round caps) with no band. Percentages are of the full 256 GB (Photos 28%).

**Palette** (`palette`):

- Colour (default): the fixed hues above, picked to read on both fills. This is the user-approved exception to the token rule for this component.
- Mono: segments in steps of `--fill-on` (100%, 75%, 55%, 38%, 24% over `--fill-slab`), bands at 10%.

**Centre readout.**

- Idle: "Storage used" in `--ink-3`, 15 px, and below it "184 GB of 256 GB" in `--fill-on`, 30 px weight 400, tabular figures.
- Hovering: the segment name in `--ink-3` with "● " in its colour before the number, and the number in the format from `readout`:

  | Readout | Shows |
  | ------- | ----- |
  | Value + % (default, the image) | "72 GB [28%]" |
  | Value | "72 GB" |
  | % | "28%" |

  Units from `unit`: GB (default) or MB ("73,728 MB").

**Light and dark.** Tokens for the text and Mono palette; the Colour palette is fixed.

**Stroke on.** Nothing extra (the bands already have edges).

## Behaviour

- **Hover a segment.** Hit testing is by angle and radius from the centre: anywhere over a segment's arc or band (with 8 px of slack outside the arc) counts.
  - Its band slides out into the arc: the band's inner radius grows until it merges with the arc and fades (220 ms ease-out), so the hovered segment becomes a single clean line, as in the image.
  - Its arc thickens by 2 px and moves 4 px outward.
  - The other segments dim to 45% opacity.
  - The centre label cross-fades (120 ms) and the number rolls (per-digit odometer, 260 ms) from the previous value.
  - `blip` plays, pitched per segment (pentatonic: Photos root, Video +2, Apps +4, Documents +7, Other +9 semitones, Free +12 at half volume).
- **Hover Free.** Its dashes turn solid in `--ink-4` and the centre shows "Free" and "72 GB [28%]"; the other segments dim the same way.
- **Move between segments.** The previous segment's band slides back in as the new one's slides out; the number rolls between values.
- **Leave.** Everything returns; the centre rolls back to the total.
- **Changing knobs.** Segment count changes re-flow the ring: arcs animate their start and end angles (240 ms) and merged "Other" grows or shrinks.

## Interaction

- **Pointer.** Hover only.
- **Keyboard.** The ring is focusable (`role="group"`, label "Storage used, 184 GB of 256 GB"), each segment (including Free) a focusable `img`-role element with a label "Photos, 72 GB, 28 percent", in order via roving tabindex with Left/Right arrows. Focus does what hover does, including the note. A live region repeats the centre text.
- **Touch.** Tap a segment to select it (same as hover); tap the centre or outside to clear.
- **Reduced motion.** The band hides instantly, no arc shift, no rolling (the number swaps).

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| arcWidth | Arc (px) | range | 2–12 | 6 | Outer arc thickness |
| band | Band | toggle | | true | The soft inner band |
| bandWidth | Band (px) | range | 12–48 | 34 | Band thickness |
| gap | Gap (°) | range | 0–16 | 6 | Space between segments |
| segments | Segments | range | 3–5 | 5 | How many segments (the rest merge into Other) |
| palette | Palette | select | Colour, Mono | Colour | Segment colours |
| readout | Readout | select | Value + %, Value, % | Value + % | What the centre shows on hover |
| unit | Unit | select | GB, MB | GB | Size unit |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

The component also takes `data` (`{ label, value }[]`), `total` and `title`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A segment is hovered or focused | `blip` | reuse (from `activity-heatmap`) | Soft marimba note | volume 0.5, pitch `2 ** (semitones / 12)` per segment as above | 1 per 60 ms |

No new sounds.

## Dependencies

- None. SVG arcs from trigonometry; band and arc changes with CSS transitions on custom properties (or rAF tweens for the radius change); the odometer as digit columns.
- No icons.

## Play demo

Agreed with the user. About 5 seconds.

1. The cursor appears outside the ring at the top right ([0.95, 0.1], instant).
2. It glides onto the Photos arc near the top right (400 ms). Photos' band slides out, the centre rolls to "72 GB [28%]", a note plays.
3. It travels clockwise around the ring along the arcs (2800 ms, following the circle: through Video, Apps, Documents, Other and Free), each segment taking its turn with its note.
4. It glides out of the ring to the bottom right (500 ms). The ring returns and the centre rolls back to the total.

## Card fit and hit areas

The ring's box is a square with an empty centre and corners. On the wall the root is `pointer-events: none` with `auto` on the segment paths (both arcs and bands); the hover logic uses the pointer's angle on those paths. The centre text is inert, so clicks in the centre and corners fall through to the card link. Check `elementFromPoint` at the centre, the box corners and in a gap between segments (card link), and on an arc and a band (component).

## Accessibility and edge cases

- Colour is not the only cue: the centre names the segment.
- Tiny segments (under 3% of the total) keep a minimum arc length of 6° so they stay hoverable.
- `gap` 0: arcs touch, caps overlap slightly (acceptable).
- `band` off: hover still thickens and pushes the arc.
- Values are formatted with `Intl.NumberFormat`.

## Acceptance checklist

- [ ] Looks right in light and dark in both palettes; matches the image's arc-and-band look
- [ ] Hovering slides the band out, thickens and pushes the arc, dims the others, rolls the centre
- [ ] Moving between segments transitions both; leaving restores the total
- [ ] Every knob visibly changes it (arc, band, band width, gap, segments, palette, readout, unit)
- [ ] `blip` plays per segment at its pitch and respects `sound` and `volume`
- [ ] Keyboard focus walks the segments and plays notes; touch taps select; reduced motion swaps instantly
- [ ] Hit areas: centre, corners and gaps fall through to the card link
- [ ] Demo traces the ring and leaves

## Decisions log

- Behaviour: hover a segment for the centre readout, with the band sliding out. (User)
- Data: storage usage. (User)
- Colours: the image's five fixed hues plus a Mono palette from tokens. (User)
- Sound: reuse `blip`, pitched per segment. (User)
- Knobs: arc width, band and band width, gap, segments, palette, readout format and unit. (User)
- Idle centre: total used. (User)
- Free space: a faint dashed Free segment; percentages are of the full capacity. (User)
- Play demo: trace the ring. (User)
- Decided by agent:
  - the slug `storage-donut` and the tag Hover;
  - the categories and sizes (184 GB of 256 GB, keeping the image's 184);
  - fewer segments merge into Other;
  - the 6° minimum arc and 8 px hover slack;
  - hit testing on the segment paths so the centre falls through.
