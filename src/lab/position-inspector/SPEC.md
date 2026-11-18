# Position inspector

- **Slug:** `position-inspector` (URL `/position-inspector`)
- **Number:** 16 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/07.jpg` (a design-tool inspector: an align toolbar with three groups, and a position panel with X and Y fields, a constraints widget, "Center" and "Top" dropdowns, a rotation field and rotate/flip buttons). Kept as one component, with a mini frame added above so the controls have something to act on. Only the layout is used.

## Summary

A design-tool position inspector driving a shape in a mini frame. Press the align buttons to spring the shape into place, and drag on the X, Y or angle labels to scrub it around.

## Look

**Overall.** A column about 340 px wide: the mini frame (when `frame` is on), then the align bar, then the position panel, 10 px apart. Panels are on `--fill-slab` with radius 16 and padding 8, with a soft shadow in light mode and a `--pane-edge` hairline in dark. Fields and button groups inside are on `color-mix(in srgb, var(--fill-on) 4%, var(--fill-slab))` with radius 10. Text in `--fill-on`, 15 px; labels and inactive icons in `--ink-4`.

**Mini frame.** 340 × 120 px, radius 12, on `color-mix(in srgb, var(--fill-on) 3%, var(--fill-slab))` with a dotted 8 px grid in `--pane-edge`. It stands for a 1200 × 400 unit artboard. Inside, the selected shape (`shape`): a Rectangle (240 × 160 units, radius 12), a Circle (160 units) or Text ("Label", 64 units tall), filled `color-mix(in srgb, var(--accent) 22%, var(--fill-slab))`, with a 1.5 px selection outline in the accent and four 6 px square handles at the corners.

**Align bar.** Three groups of three icon buttons (18 px icons):

| Group | Buttons |
| ----- | ------- |
| Horizontal | `ph:align-left-bold`, `ph:align-center-horizontal-bold`, `ph:align-right-bold` |
| Vertical | `ph:align-top-bold`, `ph:align-center-vertical-bold`, `ph:align-bottom-bold` |
| Distribute | `ph:text-align-justify-bold`, `ph:rows-bold`, `ph:columns-bold` |

The button matching the shape's current alignment (if it is exactly aligned) shows in `--fill-on`; others in `--ink-3`.

**Position panel.** A two-column grid:

- Row 1: "X 480" and "Y 120" fields. The letter label is in `--ink-4`, the value in `--fill-on`.
- Row 2 left: the constraints widget, a box outline with four short lines around it and a centre cross; active lines in the accent (the image shows top and centre active, in blue).
- Row 2 right: two dropdown-looking fields, `ph:arrows-in-line-vertical-bold` rotated (horizontal) with "Center" and a caret, and a vertical-line icon with "Top" and a caret; on `--fill-slab` with a 1 px `--pane-edge` border.
- Row 3 left: the rotation field, `ph:angle-bold` and "0°".
- Row 3 right: three buttons, `ph:arrow-clockwise-bold`, `ph:flip-horizontal-bold`, `ph:flip-vertical-bold`.

**Accent** (`accent`): Pick (`--pick`, default, the image's blue) or Ink (`--fill-on`).

**Density** (`density`): Comfortable (the image: 44 px rows, 8 px gaps) or Compact (34 px rows, 6 px gaps, 13 px text).

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` on both panels and the frame.

## Behaviour

- **Align.** Pressing an align button moves the shape to that edge or centre of the frame (in artboard units). The shape springs there (bounce from `bounce`), the X or Y value counts to the new number in step with the motion, and `settle` plays when it lands. Pressing the button that is already active does a tiny nudge-bounce and `tick`.
- **Scrub.** Pressing and dragging horizontally on the X, Y or angle label (the letter or icon, cursor `ew-resize`) changes the value by `sensitivity` units per pixel (Shift ×10, Alt ×0.1). The shape follows immediately (no spring while scrubbing). With `snap` on, X and Y snap to multiples of 8 units and the angle to 15° steps. Values clamp so the shape stays inside the artboard. `tick` plays each time the displayed value crosses a snap step (or every 8 units without snap).
- **Type.** Clicking a value (not the label) turns it into an input; Enter commits and springs the shape there, Escape cancels.
- **Rotate and flip.** The rotate button adds 90° (spring), the flip buttons mirror the shape on that axis (spring on `scaleX` / `scaleY`); `tick` on press, `settle` on land. The angle field updates.
- **Light controls.** The distribute buttons, the constraints widget's lines and the Center/Top fields highlight on press and play `tick`; the constraints lines toggle their accent colour, and the Center/Top fields open a small menu (Left, Right, Left & right, Center, Scale / Top, Bottom, Top & bottom, Center, Scale) with `expand`, and choosing closes it with `collapse` and updates the field text and the widget's lines. None of them change the shape's position.

## Interaction

- **Pointer.** Press buttons; drag labels to scrub; click values to type. Scrubbing uses pointer capture, `touch-action: none` and `user-select: none` on the labels. The shape in the frame is not draggable (the panel is the point).
- **Keyboard.**
  - Align, rotate, flip and distribute buttons are `button`s with labels ("Align left", "Rotate 90°", …); the align groups are `toolbar`s with arrow-key navigation.
  - The X, Y and angle fields are `spinbutton`s: Up/Down change by 1 (Shift 10), Enter edits.
  - The dropdowns are `button`s with `aria-haspopup="listbox"`, and the menus are listboxes with arrow keys, Enter and Escape.
  - A live region announces "X 960" after an align.
- **Touch.** Same as pointer; scrubbing works with a finger on the label.
- **Reduced motion.** Springs become a 120 ms ease; the counting values jump.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| frame | Preview frame | toggle | | true | The mini frame with the shape |
| shape | Shape | select | Rectangle, Circle, Text | Rectangle | The shape being moved |
| bounce | Bounce | range | 0–100 | 30 | Spring bounce for aligns, rotate and flip |
| snap | Snap | toggle | | true | Snap to 8 units and 15° while scrubbing |
| sensitivity | Scrub (units/px) | range | 1–10 | 4 | How fast scrubbing changes values |
| density | Density | select | Comfortable, Compact | Comfortable | Spacing and text size |
| accent | Accent | select | Pick, Ink | Pick | Colour for the selection and active marks |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A scrubbed value crosses a step | `tick` | reuse | Tiny dry tick | volume 0.3, pitch 0.9 + 0.3 × value / max | 1 per 30 ms |
| A button is pressed | `tick` | reuse | Tiny dry tick | volume 0.5, pitch 1.1 | none |
| The shape lands after an align, rotate or flip | `settle` | reuse | Soft lock-in click | volume 0.6 | 1 per 150 ms |
| A dropdown menu opens / closes | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.4 | none |

No new sounds.

## Dependencies

- None. Springs are a small hand-written spring integrator in rAF (position, angle, scale), shared by all moves.
- `@iconify/react` for all icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 7 seconds; ends centred and at 0°.

1. The cursor appears to the right of the align bar ([1.0, 0.45], instant).
2. It glides to align-right (500 ms) and presses. The shape springs to the right edge, X counts to 960; `settle` plays.
3. It glides to the X label (500 ms), presses, and drags left 60 px (900 ms) and releases. The shape slides left in 8-unit snaps with ticks; X reads 720.
4. It glides to the angle label (400 ms), presses, drags right 4 px past the first 15° snap (500 ms) and releases. The shape tilts to 15°.
5. It glides to align-centre (horizontal) (500 ms) and presses. The shape springs to the centre; `settle` plays.
6. It drags the angle label back to 0° (press, drag left, release, 600 ms total).
7. It glides away (500 ms).

## Card fit and hit areas

The column has a gap between the frame and the panels and between the two panels, and the align bar's panel has gaps between groups. On the wall the root is `pointer-events: none` with `auto` on the two panels and the frame. The frame does not react to clicks, but keep it `auto` so the card does not open when someone pokes the shape (it would feel broken). Check `elementFromPoint` in the gaps between panels (card link). The whole column is about 340 × 400 px; on the wall it scales to fit the stage height (transform from the top).

## Accessibility and edge cases

- Values clamp at the artboard edges; scrubbing past them stops the shape and the ticks.
- Typed invalid input reverts on blur.
- Rotation and flips compose: the angle shows the rotation only; flips are shown by the flip buttons' pressed state (`aria-pressed`).
- Changing `shape` keeps the position (centre point) and re-clamps.
- `frame` off: controls still change values; the column is shorter.

## Acceptance checklist

- [ ] Looks right in light and dark, comfortable and compact; stroke outlines the panels and frame
- [ ] Align buttons spring the shape to each edge and centre; the active one highlights
- [ ] Scrubbing X, Y and angle moves the shape live, with snap and modifiers; typing commits with a spring
- [ ] Rotate and flip animate; light controls highlight, menus open and close
- [ ] Every knob visibly changes it (frame, shape, bounce, snap, sensitivity, density, accent)
- [ ] Sounds play at their moments and respect `sound` and `volume`
- [ ] Keyboard spinbuttons, toolbars and menus work; reduced motion removes springs
- [ ] Demo aligns, scrubs X and the angle, recentres and ends at 0°

## Decisions log

- One inspector, not two components. (User)
- Target: a mini frame with a shape above the panels. (User)
- Main interaction: scrubbing X, Y and angle. (User)
- Other controls: align works, rotate and flip work, the constraints widget and dropdowns are light (highlight and menus only). (User)
- Sound: reuse `tick`, `settle`, `expand` and `collapse`. (User)
- Knobs: frame and shape, spring and snap, scrub sensitivity, density and accent. (User)
- Play demo: align right, scrub X, scrub angle, align centre. (User)
- Decided by agent:
  - the slug `position-inspector` and the tag Drag;
  - a 1200 × 400 unit artboard with default X 480, Y 120;
  - the distribute group is light too (one shape has nothing to distribute);
  - typing a value on click, and Shift/Alt scrub modifiers;
  - the shape is not draggable in the frame;
  - a hand-written spring, no library;
  - a final angle scrub back to 0° so the demo ends clean.
