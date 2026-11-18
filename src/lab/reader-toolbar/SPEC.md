# Reader toolbar

- **Slug:** `reader-toolbar` (URL `/reader-toolbar`)
- **Number:** 15 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/06.gif` (a white reader toolbar pill with a back arrow, a book cover, title and author, and a "…" button; pressing "…" blurs the back arrow and title away and blurs in Pin, Share and Close buttons; Close blurs them back). The gif shows a real book; this uses a made-up one. Only the idea is used.

## Summary

A reader's toolbar pill. Press "…" and the title blurs away into Pin, Share and Close; press Close to bring the title back.

## Look

**Pill.** Height from `size` (S 40, M 48 default, L 56 px), fully rounded, on `--fill-slab` with a soft shadow (`0 4px 16px rgb(0 0 0 / 8%)` in light mode, a `--pane-edge` hairline in dark), padding 4 px. About 260 px wide at M.

**Reading state** (left to right):

- Back button: `ph:caret-left-bold`, 16 px in `--fill-on`, a circular button the pill's height minus 8 px.
- Cover: a book cover the pill's height minus 12 px tall, 1:1, shape from `coverShape` (Square radius 4, Rounded radius 8 default, Round), with a 1 px `--pane-edge` edge.
  - On the site: a filler painting via `siteProps.images[0]` (`object-fit: cover`).
  - Exported code: a gradient from the title hash with the title's initials in white, 10 px weight 700 (see AGENTS.md, "Filler images").
- Title "Field Notes on Making" in `--fill-on`, 14 px weight 600 (13 at S), and the author "Ada Moreno" under it in `--ink-4`, 12 px. One line each, ellipsis if too long.
- "…" button: `ph:dots-three-bold` in a circular button on `color-mix(in srgb, var(--fill-on) 6%, transparent)`.

**Actions state:** the cover stays at the left. On the right, the actions as circular buttons with the same size as the "…" button, 8 px apart, icons 16 px in `--fill-on`:

| `actions` | Buttons |
| --------- | ------- |
| 2 | Pin, Close |
| 3 (default, the gif) | Pin, Share, Close |
| 4 | Pin, Share, Bookmark, Close |

Icons: Pin `ph:push-pin-fill`, Share `ph:export-fill`, Bookmark `ph:bookmark-simple-fill`, Close `ph:x-bold`. Close has the same faint background as "…" had; the others have no background until hovered.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the pill.

## Behaviour

- **Open** (press "…"):
  1. The back button, title and author blur out: `filter: blur(blur px)`, opacity to 0, a 6 px slide left, over `speed` ms.
  2. The "…" button blurs out where it is.
  3. The actions blur in from `blur` px to sharp, opacity 0 → 1, each `stagger` ms after the previous, left to right, with a 6 px slide from the right.
  4. With `fitWidth` on, the pill's width animates (measured, CSS transition on `width`) to fit the cover plus actions; with it off, the pill keeps its reading width and the actions sit at the right, as in the gif.
  5. `expand` plays.
- **Close** (press Close): the reverse. The actions blur out right to left with the same stagger, the title and back button blur back in, the width returns. `collapse` plays.
- **Pin, Share, Bookmark.** Press animation only (scale 0.9 and back, with a CSS `linear()` spring); `tick` plays. They call optional `onPin`, `onShare` and `onBookmark` props.
- **Back.** Press animation only and `tick`; calls optional `onBack`.
- **Interrupting.** Pressing Close mid-open reverses from the current state (CSS transitions retarget).

## Interaction

- **Pointer.** Press "…", the actions and back. Each button has a hover background (`color-mix(in srgb, var(--fill-on) 8%, transparent)`).
- **Keyboard.**
  - Every control is a `button` with an `aria-label` ("Back", "More actions", "Pin", "Share", "Bookmark", "Close actions").
  - "…" has `aria-expanded` and `aria-controls` pointing at the actions group.
  - After opening, focus moves to the first action; after closing, focus returns to "…". Escape closes the actions.
  - The hidden state's controls are `inert` so Tab skips them.
- **Touch.** Same as pointer.
- **Reduced motion.** No blur or slide: a 120 ms cross-fade, and the width snaps.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| blur | Blur (px) | range | 0–16 | 8 | How blurry items get as they leave and enter |
| speed | Speed (ms) | range | 120–600, step 20 | 260 | Morph duration |
| stagger | Stagger (ms) | range | 0–120, step 10 | 40 | Delay between actions as they appear |
| fitWidth | Fit width | toggle | | false | The pill shrinks to fit the actions |
| actions | Actions | range | 2–4 | 3 | How many actions appear (Close is always last) |
| coverShape | Cover | select | Square, Rounded, Round | Rounded | Cover shape |
| size | Size | select | S, M, L | M | Pill height |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Content props (not knobs): `title`, `author`, `cover` (image URL, none by default).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Actions open | `expand` | reuse | Soft whoosh rising | volume 0.5 | none |
| Actions close | `collapse` | reuse | Soft whoosh falling | volume 0.5 | none |
| Pin, Share, Bookmark or Back pressed | `tick` | reuse | Tiny dry tick | volume 0.5, pitch 1.1 | none |

No new sounds.

## Dependencies

- None. CSS transitions with `filter`, `opacity`, `transform` and `width`, with per-item delays.
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 5 seconds; ends in the reading state.

1. The cursor appears below the pill on the right ([0.9, 1.6], instant).
2. It glides to "…" (500 ms) and presses. The title blurs away, Pin, Share and Close blur in; `expand` plays.
3. It waits 500 ms, glides to Pin (400 ms) and presses. Pin bounces; `tick` plays.
4. It waits 400 ms, glides to Close (400 ms) and presses. The actions blur out and the title returns; `collapse` plays.
5. It waits 600 ms and glides away (500 ms).

## Card fit and hit areas

The pill is a rounded rectangle; the whole pill can react. With `fitWidth` on, the root box must follow the pill's animated width (the root is the pill, not a wider wrapper). Check `elementFromPoint` just outside the rounded ends (card link) and on the pill between buttons (component, no action).

## Accessibility and edge cases

- Long titles ellipsize; the full title is in the cover's `alt` and the pill's `aria-label`.
- `actions` changed while open: actions enter or leave with the same blur.
- `blur` 0: plain fade and slide.
- Missing cover image: the gradient cover with initials, no layout shift.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the pill
- [ ] "…" blurs the title into the actions with stagger; Close reverses it; mid-way presses retarget
- [ ] Fit width shrinks and restores the pill
- [ ] Every knob visibly changes it (blur, speed, stagger, fit width, actions, cover, size)
- [ ] Copied code has no `/lab/demoimages/` URLs; gradient cover without `siteProps`
- [ ] `expand`, `collapse` and `tick` play at their moments and respect `sound` and `volume`
- [ ] Focus moves correctly, Escape closes, hidden controls are inert; reduced motion cross-fades
- [ ] Demo opens, presses Pin, closes, ending in the reading state

## Decisions log

- Content: a made-up book with a filler-painting cover. (User)
- Actions: only Close does something; Pin, Share and Bookmark press-animate and call optional props. (User)
- Motion: blur cross-fade with width, CSS only. (User)
- Play demo: open, press Pin, close. (User; Pin only press-animates since actions are Close-only)
- Knobs: blur, speed, stagger, fit width, actions count, cover shape, size. (User)
- Sound: `expand`, `collapse`, `tick`. (User)
- Decided by agent:
  - the slug `reader-toolbar` and the tag Press;
  - the title "Field Notes on Making" and author "Ada Moreno";
  - Close is always the last action and the action sets per count;
  - Fit width defaults off (the gif keeps its width);
  - focus handling and Escape.
