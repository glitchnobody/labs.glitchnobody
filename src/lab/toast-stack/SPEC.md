# Toast stack

- **Slug:** `toast-stack` (URL `/toast-stack`)
- **Number:** 60 / 60
- **Tag:** Hover
- **Status:** spec
- **Design reference:** none (described by the user as "toast stack"; design proposed by the agent, shaped by the user's answers).

## Summary

A neat pile of notifications. Hover it and the toasts unfold into a list; swipe one away or close it, or press × to clear them all and watch the stack refill.

## Look

**Toast.** `width` px wide (default 300), auto height (about 60 px), radius `radius` (default 14), `--fill-slab` background, 1 px `color-mix(in srgb, var(--fill-on) 10%, transparent)` edge, soft shadow (`0 6px 20px color-mix(in srgb, var(--fill-on) 12%, transparent)`). Inside, 12 px padding: a 18 px icon in its kind's colour, then the title (13.5 px weight 600, `--fill-on`) over a description (12.5 px, `--ink-3`), one line each, ellipsised.

With `tint` on, each toast's background gets 8% of its kind's colour (`color-mix(in srgb, <kind> 8%, var(--fill-slab))`) and the edge 25%.

**Kinds and default toasts** (newest first, front of the pile):

| Kind | Icon | Colour | Title | Description |
| ---- | ---- | ------ | ----- | ----------- |
| Success | `ph:check-circle-fill` | `--ok` | Changes saved | Your profile is up to date. |
| Info | `ph:info-fill` | `--pick` | New comment | Mira replied to your post. |
| Warning | `ph:warning-fill` | `--ember` | Storage almost full | 92% of 5 GB used. |
| Error | `ph:x-circle-fill` | `--danger` | Upload failed | meadow.png is over 10 MB. |
| Success | `ph:check-circle-fill` | `--ok` | Invite sent | Jonas will get an email. |
| Info | `ph:info-fill` | `--pick` | Update ready | Restart to install 2.4. |

The first `count` (default 4) are shown. Toasts are a prop (`toasts: { kind, title, description? }[]`). (`--danger` is added by `hold-to-delete` if not built yet.)

**Pile (collapsed).** The front toast sits at the anchor; each one behind is offset by `peek` px (default 10) toward the stack's far side and scaled down 5% per step, so a sliver of each peeks out. Only 3 are visible; the rest hide behind the third. Behind toasts hide their text (opacity 0) so the slivers read as clean edges.

**Expanded list.** All toasts at full size, in a column with `gap` px between them (default 8), the newest nearest the anchor.

**Position** (`position`): Bottom (default; the anchor is at the bottom, slivers peek above, the list unfolds upward) or Top (mirrored).

**Clear-all ×.** A 24 px round button (`--fill-slab`, 1 px edge, `ph:x-bold` 11 px `--ink-3`) sitting on the far top corner of the front toast (top-left in Bottom position, slightly outside the toast, as on macOS notification stacks). Labelled "Clear all". In the expanded list it stays on the top corner of the **topmost** toast.

**Per-toast ×.** In the expanded list each toast shows a small `ph:x-bold` button (12 px, `--ink-4`) at its right edge while hovered.

**Light and dark.** Tokens only.

**Stroke on.** Each toast's edge becomes `--pane-edge` at full strength.

## Behaviour

- **Hover to expand** (`hover` on): when the pointer enters the pile, the toasts unfold into the list (each moves to its list position and scales to 1; text fades in; 300 ms, `linear()` spring); when it leaves the list area (including the gaps), they fold back into the pile after 150 ms. `expand` / `collapse`. With `hover` off, a click on the pile toggles it instead (and Escape folds it).
- **Swipe to dismiss.** Drag any toast sideways (the front one when collapsed, any one when expanded): it follows 1:1, fading with distance. Past 80 px or a flick faster than 0.4 px/ms it flies off that way (200 ms) and the others close the gap on a spring; otherwise it springs back. `swipe`.
- **Close one.** The per-toast × collapses it: it fades and shrinks out (180 ms), the others close the gap. `swipe` at lower volume.
- **Clear all.** The × sends every toast flying off sideways, one after another from the front (40 ms stagger, 220 ms each). `whoosh`.
- **Refill.** Whenever the stack becomes empty (after Clear all, or after the last toast is dismissed), it waits 1 s and the original toasts drop back in one at a time, oldest first, each sliding in from the anchor side and pushing the pile back (180 ms apart). `pop` for each, pitch rising slightly.
- **No timers.** Toasts stay until dismissed.
- Reports `onDismiss(index)` and `onClear()`.

All positions are computed from measured toast heights and set as CSS transforms with transitions; no library.

## Interaction

- **Pointer.** Hover the pile to expand (or click with `hover` off); drag a toast sideways to dismiss; × buttons close. Toasts: `touch-action: pan-y` (vertical scroll still works on touch), `user-select: none`.
- **Keyboard.** The stack is a `region` labelled "Notifications, 4". Focus inside it expands the list (same as hover). Each toast is a focusable `status`-styled item (`role="group"`, label = title); Delete or Backspace dismisses the focused toast; each × is a real `button` ("Dismiss: Changes saved", "Clear all"). Arrow Up/Down move between toasts.
- **Touch.** A tap on the pile expands it (no hover); a tap outside folds it.
- **Reduced motion.** No springs or flights: expand and collapse cross-fade between layouts, dismissed toasts fade out, refill fades in.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| count | Toasts | range | 2–6 | 4 | How many toasts are in the stack |
| position | Position | select | Bottom, Top | Bottom | Which way the pile peeks and the list unfolds |
| peek | Peek (px) | range | 0–20 | 10 | How far each toast behind peeks out |
| gap | Gap (px) | range | 0–20 | 8 | Space between toasts in the list |
| width | Width (px) | range | 240–340 | 300 | Toast width |
| radius | Corner (px) | range | 4–24 | 14 | Toast corners |
| tint | Tinted | toggle | | false | Kind-coloured backgrounds |
| hover | Expand on hover | toggle | | true | Hover to expand, or click |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Expand | `expand` | reuse | Soft rising whoosh | volume 0.3 | 1 per 300 ms |
| Collapse | `collapse` | reuse | Soft falling whoosh | volume 0.25 | 1 per 300 ms |
| Swipe away | `swipe` | reuse | Quick paper swish | volume 0.45, pitch by flick speed | none |
| Close one (×) | `swipe` | reuse | Swish | volume 0.3, pitch 1.1 | none |
| Clear all | `whoosh` | reuse | Airy whoosh | volume 0.45 | none |
| Each toast refills | `pop` | reuse | Bubbly pop | volume 0.25, pitch 0.95 + 0.05 × i | none |

No new sounds.

## Dependencies

- None. Measured heights, CSS transforms and transitions with `linear()` springs, pointer events for the swipe.
- Icons via `@iconify/react`: `ph:check-circle-fill`, `ph:info-fill`, `ph:warning-fill`, `ph:x-circle-fill`, `ph:x-bold` (all checked to exist).

## Play demo

Agreed with the user: just hover. About 4 seconds; ends collapsed with all toasts.

1. The cursor appears beside the pile ([1.05, 0.95], instant).
2. It glides onto the front toast ([0.6, 0.92], 600 ms): the pile unfolds upward into the list; `expand`.
3. It drifts up over the toasts to [0.6, 0.35] (1500 ms), a slow read down the list (each toast's × appears as it passes).
4. Wait 500 ms.
5. It glides away to [1.05, 0.6] (500 ms): the list folds back into the pile; `collapse`.

## Card fit and hit areas

The root reserves the expanded list's height (anchored at the bottom in Bottom position). On the wall the root is `pointer-events: none`, with `auto` on the visible toasts and the clear-all ×; while expanded, a hover zone covering the list's box (gaps included) is also `auto` so moving between toasts does not collapse the list. Check `elementFromPoint` in the reserved space above the collapsed pile and beside it (card link), on the front toast, the slivers and the × (component), and in the gaps of the expanded list (component, by design).

## Accessibility and edge cases

- `count` changes rebuild the stack (no animation).
- Hover leaving during a swipe keeps the list expanded until the swipe finishes.
- Clear all during a refill cancels the refill and starts it again after 1 s.
- Dismissing the front toast in the collapsed pile brings the next one forward.
- Long titles and descriptions truncate with an ellipsis; the full text is in the accessible label.

## Acceptance checklist

- [ ] Looks right in light and dark, tinted and not, Bottom and Top
- [ ] Hover unfolds the pile into a list and folding back works, gaps included
- [ ] Swipe dismisses by distance or flick; short drags spring back
- [ ] Per-toast × closes one; clear-all × throws them all, then they refill one by one
- [ ] Dismissing the last toast also refills
- [ ] Every knob visibly changes it
- [ ] Sounds respect `sound` and `volume`
- [ ] Focus expands; Delete dismisses; reduced motion cross-fades
- [ ] Demo hovers, reads down the list and leaves it collapsed

## Decisions log

- Stacking: collapsed pile that expands on hover. (User)
- Trigger: none; a fixed stack whose × clears all and resets it. (User)
- Features: swipe to dismiss, per-toast close ×. (User)
- Hover opens a vertical list. (User)
- Reset: after clearing (or when empty) the toasts refill one by one after about 1 s. (User)
- No timers. (User)
- Play demo: just hover. (User)
- Clear-all × on the outer top corner of the front toast, moving to the topmost toast when expanded. (User)
- Decided by agent:
  - the slug `toast-stack` and the tag Hover;
  - the six default toasts and their kinds; `--ember` for warnings;
  - focus expands the list like hover; a `hover` knob for click-to-expand;
  - reusing `expand`, `collapse`, `swipe`, `whoosh`, `pop`.
