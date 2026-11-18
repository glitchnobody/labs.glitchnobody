# Radial toolkit

- **Slug:** `radial-toolkit` (URL `/radial-toolkit`)
- **Number:** 17 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/08.jpg` (a radial tool menu on a grid canvas: a pale ring of tool buttons, Move, Pen, Text, Actions, Comment, Objects and Frame, each with a label pill and a shortcut badge, a blue wedge from the centre circle to the selected Move tool, "More …" at the bottom, and a "Radial Toolkit Alt + W" pill below). Only the idea and layout are used.

## Summary

A radial tool picker on a mini canvas. Press and hold on the canvas to bloom the ring around your pointer, sweep toward a tool and let go to pick it; or tap a letter key.

## Look

**Canvas.** A 340 × 300 px panel, radius 16, on `--fill-slab` with a faint 40 px grid in `--pane-edge`, a 1 px `--pane-edge` border. At rest it shows only the current-tool pill at the bottom centre and a small hint "Hold to pick a tool" in `--ink-4`, 12 px, at the centre.

**Current-tool pill.** At the bottom centre, like the image's "Radial Toolkit" pill: a pill on `--fill-slab` with a 1 px `--pane-edge` border; the picked tool's icon (16 px), its name (13 px weight 500, `--fill-on`), and its key badge ("V") in a small rounded grey chip (`color-mix(in srgb, var(--fill-on) 8%, var(--fill-slab))`, `--ink-3`, 12 px).

**Ring** (shown while open), centred on the press point, clamped so it stays inside the canvas:

- A pale track circle of radius `radius` (default 92 px), 12 px wide, `color-mix(in srgb, var(--fill-on) 6%, transparent)`.
- A centre circle, 64 px, 3 px stroke in the accent, empty inside.
- Tool buttons on the track: 40 px rounded squares (radius 10) on `--fill-slab` with a 1 px `--pane-edge` border and a soft shadow, icons 20 px in `--fill-on`. The selected one has an accent border (2 px) and its icon in the accent.
- Labels (when `labels` is on): pills outside each button on the side away from the centre, on `color-mix(in srgb, var(--fill-on) 7%, var(--fill-slab))`, 14 px `--fill-on`, with the key badge (when `badges` is on) before the name on the left side and after it on the right side, as in the image. The selected tool's label becomes a solid accent pill with white text and a white badge with accent text.
- The wedge (when `wedge` is on): a soft gradient sector from the centre circle to the selected tool, `wedgeWidth` degrees wide, from the accent at 18% near the button to 4% at the centre, with a brighter 3 px arc on the track behind the selected button.
- "More …" at the bottom of the ring: a label pill with "More" and `ph:dots-three-bold`, not interactive.

**Tools** (the first `tools` are placed evenly around the ring's top and sides, leaving the bottom slot for More):

| Tool | Icon | Key |
| ---- | ---- | --- |
| Move Tool | `ph:cursor-fill` | V |
| Pen Tool | `ph:pen-nib-fill` | P |
| Text | `ph:text-t-bold` | T |
| Actions | `ph:squares-four-fill` | (none) |
| Comment | `ph:chat-circle-fill` | C |
| Objects | `ph:shapes-fill` | O |
| Frame | `ph:hash-bold` | F |

With 7 tools the layout matches the image (Move at the top, Pen, Text, Actions down the right, Comment, Objects, Frame up the left).

**Accent** (`accent`): Pick (`--pick`, default, the image's blue) or Ink (`--fill-on`).

**Light and dark.** Tokens only.

**Stroke on.** The canvas border is already a hairline; Stroke on adds a 1 px `--pane-edge` ring around the tool buttons' shadows (harmless).

## Behaviour

- **Open.** Pressing on the canvas and holding for 120 ms (or moving more than 6 px) blooms the ring around the press point. `expand` plays. Bloom style from `bloom`:
  - **Scale:** the whole ring scales from 0.6 and fades in.
  - **Stagger:** the track draws in, then buttons pop out from the centre one after another (clockwise from the top), labels fade in after their buttons.
  - **Spin-in:** buttons fly out from the centre along a slight spiral (rotating 40° as they travel).

  Duration from `speed` (ms for the whole bloom).
- **Aim.** While held, the selection is the tool nearest to the pointer's angle from the centre, once the pointer is more than 24 px from the centre (inside that dead zone, nothing is selected and the wedge hides). The wedge rotates to the selected tool with a quick spring; the label turns solid. `tick` plays each time the selection changes.
- **Pick.** Releasing with a tool selected picks it: the selected button pulses, the ring collapses into the centre (reverse of the bloom, faster), and the current-tool pill swaps its icon, name and badge with a short blur cross-fade. `pop` plays.
- **Cancel.** Releasing inside the dead zone, or pressing Escape, collapses the ring with no change. `collapse` plays.
- **Quick click.** A press released within 120 ms without moving opens the ring pinned at that point; then hovering aims and a click picks; clicking the centre or outside cancels.
- **Shortcuts.** The letter keys pick their tools directly (the pill swaps and `pop` plays, with no ring); Alt+W opens the ring pinned at the canvas centre. They work only while the pointer is inside this component's block (the wall card, or the modal stage) or focus is in the canvas, using the `data-shortcut-scope` mechanism described in `tool-dock`'s spec; elsewhere keys are ignored.

## Interaction

- **Pointer.** Press and hold, sweep, release; or quick click then click. Pointer capture during the hold; `touch-action: none` and `user-select: none` on the canvas.
- **Keyboard.** The canvas is focusable (`role="application"` with `aria-label="Canvas. Hold to pick a tool, or press a tool's letter. Alt+W opens tools."`). Alt+W opens the ring pinned; then the ring is a `menu` of `menuitemradio`s: arrow keys move around the ring (Left/Up anticlockwise, Right/Down clockwise), Enter picks, Escape cancels. Letter keys pick directly. A live region announces "Pen Tool selected".
- **Touch.** Press-hold works the same with a finger; the ring centres above the finger by 40 px so the thumb does not cover the top tools.
- **Reduced motion.** No bloom animation or spring: the ring fades in and out over 100 ms, and the wedge jumps.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| radius | Radius (px) | range | 64–120 | 92 | Ring radius |
| tools | Tools | range | 4–7 | 7 | How many tools are on the ring |
| labels | Labels | toggle | | true | Label pills next to the tools |
| badges | Key badges | toggle | | true | Shortcut letters on the labels |
| bloom | Bloom | select | Scale, Stagger, Spin-in | Stagger | How the ring opens |
| speed | Open (ms) | range | 120–600, step 20 | 280 | How long the bloom takes |
| wedge | Wedge | toggle | | true | The highlighted wedge to the selection |
| wedgeWidth | Wedge width (°) | range | 20–70 | 40 | The wedge's angle |
| accent | Accent | select | Pick, Ink | Pick | Selection colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

The component also takes `value` / `onChange(toolName)` and a `tools` list override is not exposed (the count knob slices the built-in list).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The ring blooms | `expand` | reuse | Soft whoosh rising | volume 0.5 | none |
| The selection moves to another tool | `tick` | reuse | Tiny dry tick | volume 0.4, pitch 0.9 + 0.05 × tool index | 1 per 30 ms |
| A tool is picked | `pop` | reuse | Bubbly pop | volume 0.6 | none |
| Cancelled | `collapse` | reuse | Soft whoosh falling | volume 0.4 | none |

No new sounds.

## Dependencies

- None. Positions from trigonometry, the wedge as an SVG path, bloom with CSS transitions and per-item delays, the wedge rotation with a tiny rAF spring.
- `@iconify/react` for the tool icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 4.5 seconds; ends with Pen selected (a fine resting state).

1. The cursor appears at the canvas's lower right ([0.85, 0.85], instant).
2. It glides to the canvas centre ([0.5, 0.45], 500 ms) and presses, holding. The ring blooms; `expand` plays.
3. It moves to the upper left toward Frame (400 ms): the wedge points to Frame, `tick`.
4. It sweeps clockwise over Move to Pen (700 ms): the wedge follows with ticks.
5. It releases. Pen is picked, the ring collapses, the pill shows "Pen Tool P"; `pop` plays.
6. It waits 800 ms and glides away (500 ms).

## Card fit and hit areas

The canvas panel is the component: the whole panel reacts (pressing anywhere on it opens the ring), so it must look like a bounded panel (border, grid) and be smaller than the card stage, leaving card space around it that opens the modal. The ring is clamped inside the canvas. Check `elementFromPoint` just outside the canvas's rounded corners (card link) and inside the panel (component).

## Accessibility and edge cases

- Holding still at the press point for a long time does nothing more; the ring stays open until release.
- Pointer leaves the canvas while holding: pointer capture keeps aiming; releasing outside picks the aimed tool.
- `tools` 4: the four tools spread over the top and sides at wider angles; the wedge width is capped at the gap between tools.
- `labels` off: the ring is narrower; the selected tool's name still appears in the pill and the live region.
- The canvas loses focus while the ring is pinned: the ring cancels.

## Acceptance checklist

- [ ] Looks right in light and dark; the open ring matches the image's layout with 7 tools
- [ ] Hold blooms the ring at the pointer (clamped), aiming moves the wedge with ticks, release picks, the dead zone cancels
- [ ] Quick click pins the ring; letter keys and Alt+W work
- [ ] The current-tool pill swaps with a blur cross-fade
- [ ] Every knob visibly changes it (radius, tools, labels, badges, bloom, open speed, wedge, wedge width, accent)
- [ ] `expand`, `tick`, `pop` and `collapse` play at their moments and respect `sound` and `volume`
- [ ] Keyboard menu works; reduced motion fades
- [ ] Demo holds, sweeps to Pen, releases, and ends with Pen selected

## Decisions log

- Open and pick: press-hold, drag, release; a quick click pins the ring. (User)
- After picking: the ring collapses and a current-tool pill updates. (User)
- Shortcuts: letter keys pick tools, Alt+W opens the ring; only while the pointer is in the component's block or focus is in it. (User)
- Sound: `expand`, `tick`, `pop`, `collapse`. (User)
- Knobs: radius and tool count, labels and key badges, bloom style and speed, wedge (on/off and width) and accent. (User)
- More: just a label, not interactive. (User)
- Play demo: hold, sweep, release on Pen, and end there (no shortcut step, since the demo runner has no keyboard). (User)
- Decided by agent:
  - the slug `radial-toolkit` and the tag Drag;
  - a bordered mini canvas so the card still has empty space to open the modal;
  - the 24 px dead zone and the 120 ms hold threshold;
  - Actions has no shortcut key, as in the image;
  - the ring centres 40 px above a finger on touch;
  - Stagger as the default bloom.
