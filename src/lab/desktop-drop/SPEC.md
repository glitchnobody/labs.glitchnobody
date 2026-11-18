# Desktop drop

- **Slug:** `desktop-drop` (URL `/desktop-drop`)
- **Number:** 40 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/28.mp4` (a mini desktop with a Docs folder and three files; the files are selected, dragged as a stack with a "3" badge onto the folder and dropped in, then coloured tag pills, Planning, Notes and Research, pop up and stack above the folder). Built without the marquee selection, at the user's request. Only the idea is used.

## Summary

A tiny desktop where files go into a folder. Drag the files onto Docs: they gather into a stack, drop in, and their tags pop up above the folder. Double-click the folder to pour them back out.

## Look

**Desktop.** About 320 × 200 px, transparent on the card. A row: the Docs folder on the left, then `files` file icons (default 3) spaced evenly, all aligned on a baseline.

**Folder.** `ph:folder-fill` at `iconSize` px (default 44) in `color-mix(in srgb, var(--fill-on) 55%, var(--fill-slab))`, label "Docs" under it. While a stack hovers over it, it swaps to `ph:folder-open-fill` and scales to 1.1.

**Files.** `ph:file-text-fill` at 80% of `iconSize`, in `color-mix(in srgb, var(--fill-on) 30%, var(--fill-slab))`, with labels under them (when `labels` is on) in `--fill-on`, 11 px, up to two lines, centred:

| File | Tag | Tag colour |
| ---- | --- | ---------- |
| Project brief | Planning | `--pick` |
| Research notes | Research | violet `#8b7bff` |
| Next steps | Notes | `--ok` |
| Moodboard | Design | `--danger` |
| Budget | Finance | amber `#f59e0b` |

While dragged, the labels get a selection pill in the `accent` colour (Pick `--pick` default, as in the video; Ink `--fill-on`) with white text.

**Stack.** Dragged files pile on top of each other under the pointer, each slightly rotated (−4°, 3°, −2°, …) and offset 3 px, with a count badge ("3", 18 px circle in the accent with white 11 px text) at the top-right of the stack.

**Tags** (`tags`): after a drop, the dropped files' tags appear above the folder:

- Pills (default, the video): small pills (11 px, padding 2 × 8, fully rounded) on a tint of the tag colour with a dot and the tag name in the colour, stacked vertically above the folder, 4 px apart.
- Dots: small 8 px coloured dots in a row above the folder.
- None.

Violet and amber are the only fixed colours (tag colours); the rest are tokens.

**Light and dark.** Tokens only (apart from the two tag colours).

**Stroke on.** Nothing to outline; harmless.

## Behaviour

- **Drag.** Pressing any file and moving more than 4 px starts a drag of **all files still on the desktop** (there is no selection step): the pressed file follows the pointer directly, and the others fly in to join it as a stack with a lagging spring each (the further away, the more lag), their labels turning into accent pills. The badge counts them. `slide` plays as the stack lifts.
- **Hover the folder.** When the stack's centre is within the folder's box (plus 12 px), the folder opens and scales up.
- **Drop on the folder.** The stack shrinks (scale 0.2) and slides into the folder over 260 ms, files one after another 40 ms apart; the folder closes with a little bounce. `settle` plays. Then the tags pop up above the folder one by one (scale from 0.5 with a spring, 80 ms apart), each with `pop` at rising pitch.
- **Drop elsewhere.** Files spring back to their places on the desktop and labels lose their pills.
- **Pour out.** Double-clicking the folder (or pressing Enter when it is focused): the tags fade and drop back into the folder, then the files pop out of it and fly back to their places with springs, staggered. `slide` plays.
- **Partial drags.** If some files are already in the folder, only the remaining ones are dragged.

## Interaction

- **Pointer.** Drag files; double-click the folder. Pointer capture during the drag; `touch-action: none` and `user-select: none` on the desktop.
- **Keyboard.** Files and the folder are focusable buttons. Space on a file "picks up" all files (stack appears next to the folder); Enter or Space on the folder drops them in; Escape cancels; Enter on the folder when it holds files pours them out. A live region announces "3 files moved to Docs" and "Files restored".
- **Touch.** Same as pointer; double-tap the folder to pour out.
- **Reduced motion.** No spring lag, rotation or pop: files move as a group without easing, the drop and pour-out are 150 ms fades; tags appear without the pop.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| files | Files | range | 2–5 | 3 | How many files are on the desktop |
| iconSize | Icon size (px) | range | 28–64 | 44 | Folder and file icon size |
| labels | Labels | toggle | | true | File and folder names |
| tags | Tags | select | Pills, Dots, None | Pills | What pops up after a drop |
| accent | Selection | select | Pick, Ink | Pick | Badge and dragged-label colour |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A file joins the stack | `tick` | reuse | Tiny dry tick | volume 0.35, pitch 1 + 0.06 × index | 1 per 40 ms |
| The stack lifts / files pour out | `slide` | reuse (from `photo-folder`) | Soft paper slide | volume 0.55 | 1 per 250 ms |
| Files drop into the folder | `settle` | reuse | Soft lock-in click | volume 0.5 | none |
| Each tag pops up | `pop` | reuse | Bubbly pop | volume 0.4, pitch 1 + 0.1 × index | none |

No new sounds.

## Dependencies

- None. Hand-written rAF springs (the user's choice) for the stack, the drop and the pour-out.
- `@iconify/react` for the folder and file icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user, without the selection box (no marquee). About 7 seconds; ends with the files back on the desktop.

1. The cursor appears below the files on the right ([0.9, 0.95], instant).
2. It glides to "Next steps" (500 ms) and presses; it drags left a little (200 ms): the other files fly in to form a stack with a "3" badge; `slide`, ticks.
3. It drags the stack onto Docs (700 ms): the folder opens.
4. It releases: the files drop in, `settle`; the tags pop up above the folder.
5. It waits 1000 ms, glides to the folder (300 ms) and double-clicks (down, up, down, up within 250 ms): the files pour back out to their places; `slide`.
6. It waits 600 ms and glides away (500 ms).

## Card fit and hit areas

The desktop row has gaps between icons. On the wall the root is `pointer-events: none` with `auto` on the folder and each file (icon and label), and the stack while dragging. Check `elementFromPoint` between icons and above the row (card link), and on a file and the folder (component). The tags above the folder are `pointer-events: none`.

## Accessibility and edge cases

- Changing `files` while some are in the folder resets everything to the desktop.
- Dropping a partial set adds their tags to the existing pills (no duplicates).
- Double-clicking an empty folder bounces it and plays `tick`.

## Acceptance checklist

- [ ] Looks right in light and dark
- [ ] Dragging any file gathers the rest into a lagging stack with a count badge
- [ ] The folder opens on hover; dropping sucks the files in and pops the tags; dropping elsewhere springs them back
- [ ] Double-clicking the folder pours the files back out
- [ ] Every knob visibly changes it (files, icon size, labels, tags, selection)
- [ ] `tick`, `slide`, `settle`, `pop` respect `sound` and `volume`
- [ ] Keyboard pick-up and drop work; reduced motion removes springs
- [ ] Demo drags the stack in, shows the tags, pours them out

## Decisions log

- Scope: drag the stack into the folder, tags pop from the folder, double-click to pour out; no marquee selection. (User)
- Sound: `tick`, `slide`, `pop` (plus `settle` for the drop). (User)
- Play demo: drag in, tags, pour out (without the marquee). (User)
- Knobs: file count, icon size and labels, tag style, selection colour. (User)
- Motion: hand-written springs. (User)
- Decided by agent:
  - the slug `desktop-drop` and the tag Drag;
  - dragging any file drags all remaining files (no selection step);
  - the two extra files (Moodboard, Budget) and their tags;
  - violet and amber as fixed tag colours;
  - keyboard pick-up with Space.
