# Split button

- **Slug:** `split-button` (URL `/split-button`)
- **Number:** 58 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** none (described by the user as "button with dropdown"; design proposed by the agent).

## Summary

A Publish button with a caret that opens more actions. Pick one and it becomes the main button; press it to watch it load and finish.

## Look

**Button.** One pill split into two halves by a 1 px divider: the **main** half (icon + label) and the **caret** half (`ph:caret-down-bold`, 34 px wide). Height by `size`: Small 32, Medium 38, Large 44 px; label 13 / 14 / 15 px weight 600, `var(--font-ui)`. Radius `radius` (default 10; the halves share the outer corners).

`variant`:
- **Solid:** inverted ink: `--fill-on` background, `--fill-slab` text and icon; divider `color-mix(in srgb, var(--fill-slab) 25%, transparent)`.
- **Outline:** transparent with a 1 px `--fill-on` 30% edge, `--fill-on` text.
- **Soft:** `color-mix(in srgb, var(--pick) 14%, var(--fill-slab))` with `--pick` text.

Press feedback: the pressed half squishes to scale 0.97 (80 ms).

**Menu.** A separate panel under the button, aligned to its right edge (`align` knob: Right or Left), 8 px gap, min width 220 px, radius `radius` + 2, `--fill-slab` background with a 1 px `color-mix(in srgb, var(--fill-on) 12%, transparent)` edge and a soft shadow. Compact rows, 32 px, radius 7, inset 4 px:

| Icon | Label | Shortcut | Busy text | Done text |
| ---- | ----- | -------- | --------- | --------- |
| `ph:paper-plane-tilt` | Publish | ⌘↵ | Publishing… | Published |
| `ph:calendar-blank` | Schedule | ⌘⇧S | Scheduling… | Scheduled |
| `ph:floppy-disk` | Save draft | ⌘S | Saving… | Saved |
| `ph:copy` | Duplicate | ⌘D | Duplicating… | Duplicated |

Icon 15 px `--ink-3`, label 13.5 px `--fill-on`, shortcut on the right in `--ink-4` 11.5 px (`ui-monospace`), with ⌘ shown as "Ctrl" off Apple platforms. The current main action's row carries a `ph:check-bold` in `--pick` before its shortcut. A single sliding highlight pill (`color-mix(in srgb, var(--fill-on) 7%, transparent)`) follows the pointer or keyboard cursor.

Actions are a prop (`actions: { label, icon?, shortcut?, busy?, done? }[]`).

**Light and dark.** Tokens only (Solid is always the inverse of the surface).

**Stroke on.** Solid and Soft get a 1 px `--pane-edge` ring; the menu edge becomes `--pane-edge`.

## Behaviour

- **Press main.** The button runs the current action: the label and icon swap to a `ph:spinner-gap` (spinning) and the busy text, and a progress fill (`color-mix` of the variant's ink at 18%) sweeps left to right across the **whole** button over `duration` ms (default 900). Then the spinner pops into `ph:check-bold` and the done text, held 800 ms, then rolls back to the idle label. The caret is disabled while busy. `onAction(label)`.
- **Open menu.** Caret press (or Down / Alt+Down on the main half): the panel scales from 0.96 and fades in from its top corner (160 ms, spring), rows unstaggered; the caret icon turns 180°. `expand`.
- **Pick (with `swap` on).** The menu closes and the main half's icon and label **roll** to the picked action (old slides up and out, new slides up in, 200 ms); the button's width animates to the new label's width. It does not run the action. `settle`.
- **Pick (with `swap` off).** The main action stays; the picked action runs once (the button shows its busy and done states, then returns to the main label).
- **Close.** Escape, click outside, Tab away, or pick. `collapse`.
- **Shortcut hints** (`shortcuts` on) are text only: they do not bind keys, so the browser's own ⌘S and ⌘D are never taken over. Off hides them.

## Interaction

- **Pointer.** Click main to run; click caret to open; hover moves the highlight; click a row to pick.
- **Keyboard.** Main half: a `button`. Caret: a `button` with `aria-haspopup="menu"`, `aria-expanded`, label "More actions". The panel is a `menu` of `menuitemradio`s (`aria-checked` on the main action) when `swap` is on, or `menuitem`s when off. Up/Down move (wrapping), Home/End, Enter/Space pick, Escape closes and returns focus to the caret. The busy state is announced in a polite live region ("Publishing", then "Published").
- **Touch.** Same.
- **Reduced motion.** No sweep, roll or scale: busy shows the spinner (static dots instead of spinning) and the fill appears at once at the end; labels swap.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| variant | Style | select | Solid, Outline, Soft | Solid | Button look |
| size | Size | select | Small, Medium, Large | Medium | Button height and text |
| radius | Corner (px) | range | 0–22 | 10 | Button and menu corners |
| swap | Swap action | toggle | | true | Picking makes it the main action, or runs it once |
| duration | Busy (ms) | range | 300–3000, step 100 | 900 | How long the progress sweep takes |
| align | Menu align | select | Right, Left | Right | Which edge the menu lines up with |
| shortcuts | Shortcut hints | toggle | | true | Shows the shortcut hints in the menu |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Main press | `tick` | reuse | Tiny dry tick | volume 0.4, pitch 1 | none |
| Done | `pop` | reuse | Bubbly pop | volume 0.45, pitch 1.1 | none |
| Menu opens | `expand` | reuse | Soft rising whoosh | volume 0.35 | none |
| Menu closes | `collapse` | reuse | Soft falling whoosh | volume 0.3 | none |
| Highlight moves | `tick` | reuse | Tick | volume 0.15, pitch 1.1 | 1 per 50 ms |
| Pick (swap) | `settle` | reuse | Soft lock-in click | volume 0.45 | none |

No new sounds.

## Dependencies

- None. CSS transitions and transforms; width animates from measured label widths.
- Icons via `@iconify/react`: `ph:caret-down-bold`, `ph:check-bold`, `ph:spinner-gap`, and the action icons above (all checked to exist).

## Play demo

Agreed with the user. About 7 seconds; ends with Publish as the main action, idle, menu closed.

1. The cursor appears below the button ([0.3, 1.6], instant).
2. It glides to the main half (500 ms) and clicks: "Publishing…" sweep, then "Published" ✓; `tick`, `pop`.
3. Wait 1700 ms.
4. It glides to the caret (300 ms) and clicks: the menu opens; `expand`.
5. It glides down to Schedule (400 ms) and clicks: the main half rolls to "Schedule"; `settle`.
6. It glides to the main half (300 ms) and clicks: "Scheduling…", then "Scheduled" ✓.
7. Wait 1700 ms.
8. It clicks the caret, glides up to Publish (400 ms) and clicks: rolls back to "Publish".
9. It glides away (500 ms).

## Card fit and hit areas

The root reserves the menu's height below the button so the open menu stays on the card. On the wall the root is `pointer-events: none`, with `auto` on the two halves and, while open, the menu. Check `elementFromPoint` in the reserved space below the closed button and beside it (card link), and on both halves and the open rows (component).

## Accessibility and edge cases

- Pressing during busy is ignored; picking from the menu during busy is disabled.
- Switching `swap` off resets the main action to the first action.
- Long labels: the button grows up to 260 px, then the label truncates.

## Acceptance checklist

- [ ] Looks right in light and dark, all three styles and sizes
- [ ] Main press sweeps, shows done, and returns to idle
- [ ] Picking rolls the main label and resizes the button (swap on), or runs once (swap off)
- [ ] Menu opens and closes; highlight slides; check marks the main action
- [ ] Shortcut hints show ⌘ or Ctrl by platform and bind no keys
- [ ] Every knob visibly changes it
- [ ] Sounds respect `sound` and `volume`
- [ ] Menu keyboard pattern works; reduced motion swaps instantly
- [ ] Demo publishes, swaps to Schedule, schedules, and restores Publish

## Decisions log

- Pattern: split button whose picked action becomes the main action. (User)
- Press: loading sweep, then done. (User)
- Menu: compact rows with shortcut hints. (User)
- Play demo: press, swap, press, restore. (User)
- Shortcut hints are text only, no key bindings. (User)
- Slug `split-button`. (User)
- Decided by agent:
  - the tag Press;
  - the four actions and their shortcut hints;
  - the menu pops as a separate panel (unlike the dropdown's morph), aligned right;
  - a `swap` knob for the fixed-main variant;
  - reusing `tick`, `pop`, `expand`, `collapse`, `settle`.
