# Invites inbox

- **Slug:** `invites-inbox` (URL `/invites-inbox`)
- **Number:** 36 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/24.mp4` (an "Invites 2" pill that blurs open into a panel listing Sonora Repository, Design Tokens, Motion Kit and Build Tools, two with unread dots, and folds back on ×). The morph is like `create-menu` (#28); this component's own idea is accepting and declining invites. Only the idea is used.

## Summary

An invites pill with a live count. Open it, accept or decline invites row by row, and watch the badge count down to "All caught up".

## Look

**One surface** following the theme: `color-mix(in srgb, var(--fill-on) 5%, var(--fill-slab))` for the pill and panel, rows on `--fill-slab`.

**Pill (closed).** 40 px tall, fully rounded, padding 0 8 0 16: "Invites" in `--fill-on`, 15 px weight 500, and the badge (`badge`):

- Number (default): a 22 px circle in `--fill-on` with the unread count in `--fill-slab`, 12 px weight 600.
- Dot: an 8 px `--fill-on` dot.
- None.

No badge shows when there are no unread invites.

**Panel (open).** About 220 px wide, radius 20, padding 8:

- Header: "Invites" 16 px weight 600 and a round × button (`ph:x-bold`).
- Rows, 6 px apart: each 52 px, radius 12, on `--fill-slab`. A 32 px rounded icon tile (`color-mix(in srgb, var(--fill-on) 6%, var(--fill-slab))`, icon 16 px in `--ink-2`), with an unread dot (6 px, `--fill-on`) at its top-right when unread; the title (13 px weight 600, `--fill-on`) and a line under it (11 px, `--ink-3`).
- Row actions: on hover (or always on touch), two 26 px round buttons slide in at the row's right: accept (`ph:check-bold` on `color-mix(in srgb, var(--ok) 15%, var(--fill-slab))`, icon in `--ok`) and decline (`ph:x-bold` on `color-mix(in srgb, var(--fill-on) 8%, var(--fill-slab))`).
- Empty state: `ph:check-circle-fill` in `--ok` and "All caught up" in `--ink-3`, centred, 60 px tall.

**Invites** (the first `count`; the first `unread` are unread):

| Title | Line | Icon |
| ----- | ---- | ---- |
| Sonora Repository | Contribute to the code repository | `ph:folder-simple-fill` |
| Design Tokens | Collaborate on design tokens | `ph:compass-tool-fill` |
| Motion Kit | Contribute to motion components | `ph:lightning-fill` |
| Build Tools | Explore build tools & pipeline | `ph:hammer-fill` |
| Icon Library | Help shape the icon set | `ph:shapes-fill` |
| Docs Site | Review the new docs | `ph:book-open-fill` |

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the pill and panel.

## Behaviour

- **Open / close.** The pill blurs and grows into the panel, as in the video: contents blur out (`blur` px, default 10), the element's width, height and radius transition (CSS, a `linear()` spring, duration from `speed`), contents blur in, rows rising 4 px with a 30 ms stagger. × or Escape or an outside press reverses it. `expand` / `collapse`.
- **Accept.** Pressing ✓: the row tints `color-mix(in srgb, var(--ok) 10%, var(--fill-slab))`, its icon tile swaps to a check with a pop, then (after 250 ms) it slides right 40 px and fades while its height collapses to 0 and the rows below move up (300 ms). `join` plays. If it was unread, the badge count rolls down (per-digit roll, 220 ms) with `tick`.
- **Decline.** Pressing ×: the row slides left 40 px and fades, its height collapses. `swipe` plays. Badge as above.
- **Empty.** When the last row leaves, the empty state fades in and the panel height animates down to fit.
- **Auto refill.** With `refill` on, after the panel closes, handled invites come back as new, unread ones 2 s later: the badge rolls up with `tick`, so the card returns to its starting state. With it off, handled invites stay gone until the knobs change.
- Calls optional `onAccept(invite)` and `onDecline(invite)`.

## Interaction

- **Pointer.** Press the pill, row actions and ×.
- **Keyboard.** The pill is a `button` with `aria-expanded` and a label "Invites, 2 unread". Open, focus moves to the first row; rows are a `list`; each row's actions are buttons ("Accept Sonora Repository", "Decline …") reachable with Tab (they show on focus-within). Escape closes and returns focus to the pill. A live region announces "Accepted Sonora Repository. 1 unread."
- **Touch.** Row actions are always visible on touch devices (`@media (hover: none)`).
- **Reduced motion.** No blur or spring: cross-fades; rows disappear with a 120 ms fade and the list closes the gap instantly.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| count | Invites | range | 1–6 | 4 | How many invites |
| unread | Unread | range | 0–6 | 2 | How many are unread (capped at Invites) |
| blur | Blur (px) | range | 0–20 | 10 | Blur during the open/close morph |
| speed | Speed | range | 0–100 | 60 | Morph speed |
| refill | Auto refill | toggle | | true | Handled invites come back after closing |
| badge | Badge | select | Number, Dot, None | Number | How the unread count shows on the pill |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Opens / closes | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.5 | none |
| Invite accepted | `join` | reuse (from `voice-chat`) | Warm rising chime | volume 0.5 | none |
| Invite declined | `swipe` | reuse | Quick paper swish | volume 0.5 | none |
| Badge number rolls | `tick` | reuse | Tiny dry tick | volume 0.3 | 1 per 60 ms |

No new sounds.

## Dependencies

- None. CSS transitions for the morph, row exits and height collapse (measured heights); a small digit roll for the badge.
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 7 seconds; ends closed, with the invites refilling 2 s later.

1. The cursor appears to the right of the pill ([1.3, 0.5], instant; positions measured at build time for the open panel too).
2. It glides to the pill (500 ms) and presses: the panel opens; `expand`.
3. It glides onto the first row (400 ms): the actions slide in. It moves to ✓ (200 ms) and presses: the row turns green, slides away; `join`; the badge rolls 2 → 1.
4. It glides onto the new first row (Design Tokens) (400 ms), moves to × (200 ms) and presses: it slides left and goes; `swipe`; the badge rolls 1 → 0.
5. It glides to the header × (400 ms) and presses: the panel folds into "Invites" with no badge; `collapse`.
6. It glides away (500 ms). Two seconds later the badge rolls back to 2.

## Card fit and hit areas

The root is the morphing element; it grows from a pill-sized anchor (absolute positioning) so the wall layout does not jump. Check `elementFromPoint` beside the closed pill and beside the open panel (card link), and on a row and the × (component). The open panel with 4 invites is about 220 × 280 px; with 6, it scales to fit the stage.

## Accessibility and edge cases

- Accepting or declining quickly in a row queues the exits; each row animates on its own.
- Changing `count` or `unread` while open rebuilds the list without animation.
- The badge caps at "9+".
- Focus moves to the next row after an action, or to × when the list is empty.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines it
- [ ] The pill blurs open into the panel and folds back
- [ ] Row actions appear on hover/focus (always on touch); accept and decline animate out and the list closes the gap
- [ ] The badge rolls down; "All caught up" shows when empty; auto refill brings invites back after closing
- [ ] Every knob visibly changes it (invites, unread, blur, speed, auto refill, badge)
- [ ] `expand`, `collapse`, `join`, `swipe`, `tick` respect `sound` and `volume`
- [ ] Keyboard and live region work; reduced motion cross-fades
- [ ] Demo opens, accepts one, declines one, closes, and the card resets

## Decisions log

- Angle: accept and decline invites, with the badge counting down. (User)
- Motion: accepted rows tint and slide right, declined rows slide left; the list closes the gap. (User)
- Knobs: invite count and unread, morph blur and speed, auto refill, badge style. (User)
- Sound: `expand`/`collapse`, `join` for accept, `swipe` for decline (plus `tick` for the badge). (User)
- Play demo: open, accept one, decline one, close. (User)
- Decided by agent:
  - the slug `invites-inbox` and the tag Press;
  - the two extra invites (Icon Library, Docs Site) and the icons;
  - auto refill brings handled invites back 2 s after the panel closes;
  - row actions always visible on touch;
  - the badge caps at 9+.
