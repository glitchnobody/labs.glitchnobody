# Meeting picker

- **Slug:** `meeting-picker` (URL `/meeting-picker`)
- **Number:** 9 / 60
- **Tag:** Select
- **Status:** spec
- **Design reference:** a screenshot the user supplied. It shows:
  - a month calendar with prev and next arrows;
  - a selected day, unavailable days struck through, and a dot under today;
  - a scrolling column of 15-minute slots;
  - a footer reading "Your meeting is booked for Thursday, June 12 at 10:00." with a Continue button.

## Summary

Pick a day and a time for a meeting: highlights slide to your choice and the sentence below updates word by word. Continue folds it into a confirmation card; Change opens it again.

## Look

**Panel.** About 500 × 380 px in the side-by-side layout. It sits on `--fill-slab` with a 1 px `--pane-edge` border and corner radius `radius`. Light mode adds a soft shadow.

**Calendar (left).** Laid out top to bottom:

- **Header.** The month and year ("June 2026") centred in `--fill-on`, 16 px, weight 600. Prev and next buttons sit at the ends (`ph:caret-left-bold` and `ph:caret-right-bold` in `--ink-4`).
- **Weekday row.** Abbreviations in `--ink-4`, 13 px, starting on Sunday or Monday (`weekStart`).
- **Day grid.** Seven columns of day numbers in `--fill-on`, 15 px.
  - **Unavailable days** are struck through and in `--ink-5`.
  - **Today** has a 4 px dot under its number.
  - **Days before today** are dimmed and unselectable.
  - **The selected day** sits on a highlight square (`--fill-on` background, `--fill-slab` text, radius `radius × 0.6`).

**Time slots (right).** Separated from the calendar by a 1 px `--pane-edge` divider. A vertically scrolling column of slot buttons:

- Each slot is a rounded rectangle on `--surface-2` with a 1 px `--pane-edge` border and corner radius `radius × 0.6`. The time is centred in `--fill-on`, 15 px, weight 600.
- The selected slot sits on the slot highlight (`--fill-on` background at 85%, `--fill-slab` text).
- The column fades out at its top and bottom edges with a mask.

**Footer.** Under a full-width divider:

- The sentence "Your meeting is booked for **Thursday, June 12** at **10:00**." in `--ink-2`, with the date and time in `--fill-on`, weight 600.
- A "Continue" button (`--surface-2` with a border, `--fill-on` text, weight 600) at the right.
- With nothing selected yet, the sentence reads "Pick a day and a time." and Continue is disabled.

**Stacked layout.** Instead of a side column, the slots are a horizontal scrolling strip of pills under the calendar. The panel narrows to about 340 px and the footer stacks: the sentence above a full-width Continue.

**Confirmation card.** About 340 × 120 px on the same surface, containing:

- `ph:check-circle-fill` in `--ok`;
- "Meeting booked" (16 px, weight 600);
- "Thursday, June 12 · 10:00 – 10:30" in `--ink-3`, where the end time comes from `length`;
- a "Change" text button in `--pick`.

**Light and dark.** Tokens only. The reference is the dark version.

**Stroke on.** Borders become `--pane-edge` at double strength.

## Behaviour

- **Dates.** Dates are real, using `Date` and `Intl.DateTimeFormat` with the browser's locale for month and weekday names (always shown in English on the site for consistency, via `en-US`).
  - The calendar opens on the current month.
  - Today is real.
  - Unavailable days are picked with a seeded random per month, `unavailable` per month. With `weekendsOff` on, weekends are unavailable too.
  - Days before today cannot be selected.
- **Defaults.**
  - The day is the next available day after today.
  - The slot is the first one at or after 10:00.
- **Slots.** Generated from `dayStart` to `dayEnd`, every `interval` minutes, as long as the meeting (`length`) fits before `dayEnd`.
  - A few slots per day are seeded as already taken. They are hidden, not struck through, so the column stays tidy.
  - Times are shown in 24-hour or 12-hour format (`clock`: "09:00" or "9:00 AM").
- **Select a day.**
  1. The day highlight square slides from the old day to the new one, as one element moved with `transform`.
  2. The slot column refreshes: the old slots fade and the new ones fade in, staggered by 15 ms.
  3. If the selected time still exists on the new day, it stays selected and the column scrolls to it. Otherwise the first slot is selected.
  4. The footer's date words roll to the new value.
- **Select a time.** The slot highlight slides vertically to the new slot (horizontally in the stacked layout), and the footer's time rolls.
- **Rolling words.** Only the parts of the sentence that change move. Each changed word slides up out of a clipped line as the new word slides up in (200 ms, staggered 30 ms per word). This applies to the weekday, the month name, the day number and the time.
- **Change month.**
  - The grid slides out to the side of the arrow pressed and the new month slides in from the other side (250 ms).
  - The header text slides with it.
  - The selection is kept if the selected day is in the new month's view; otherwise the highlight is hidden until a day is picked.
  - Months before the current month cannot be opened, so prev is disabled on the current month.
- **Continue (fold).**
  1. The calendar and slots fade and scale to 0.96.
  2. The panel's height and width animate down to the confirmation card's size, measured and done with a CSS transition.
  3. The footer sentence turns into the card's text.
  4. The check icon scales in with a spring (CSS `linear()`).
  5. `join` plays.
- **Change (unfold).** The reverse, landing with the same selection, and `collapse` plays.

## Interaction

- **Pointer.** Press days, slots, arrows, Continue and Change. The slots column scrolls with the wheel or by dragging on touch.
- **Keyboard.**
  - The calendar is a `grid`, following the date-grid pattern:
    - arrow keys move by day and week;
    - PageUp and PageDown change month;
    - Home and End go to the start and end of the week;
    - Enter and Space select.
  - Unavailable days are `aria-disabled`.
  - The slots are a `listbox`: Up and Down move and select, and the column scrolls the focused slot into view.
  - Continue and Change are buttons.
  - A live region speaks the footer sentence after each change, once per change.
- **Touch.** Same as pointer. The slot column scrolls natively with momentum.
- **Reduced motion.**
  - The highlights jump instead of sliding.
  - The month cross-fades.
  - The footer words swap without rolling.
  - The fold and unfold are cross-fades.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| layout | Layout | select | Side by side, Stacked | Side by side | Slots beside the calendar or as a strip under it |
| interval | Slot every | select | 15 min, 30 min, 60 min | 15 min | Spacing of time slots |
| length | Meeting length | select | 15 min, 30 min, 45 min, 60 min | 30 min | Meeting duration (affects the last slot and the end time) |
| dayStart | First slot | range | 6–12, step 0.5 (hours) | 9 | Earliest slot |
| dayEnd | Last slot ends | range | 13–22, step 0.5 (hours) | 17 | Latest end time |
| clock | Clock | select | 24-hour, 12-hour | 24-hour | Time format |
| weekStart | Week starts | select | Sunday, Monday | Sunday | First column of the calendar |
| unavailable | Unavailable days | range | 0–10 | 3 | Random struck-through days per month |
| weekendsOff | Weekends off | toggle | | false | Makes Saturdays and Sundays unavailable |
| radius | Corner (px) | range | 4–24 | 16 | Rounding of the panel; days and slots use 60% of it |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

The hour range knobs label their value as a time ("9:00") if the shell allows a value formatter; otherwise they show the number of hours. Add an optional `format` to the range knob type if it is cheap to do.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| A day is selected | `tick` | reuse | Tiny dry tick | volume 0.5, pitch 1.0 | none |
| A slot is selected | `tick` | reuse | Tiny dry tick | volume 0.5, pitch 1.15 | none |
| The month changes | `swipe` | reuse | Quick soft swish | volume 0.5, pitch 1.1 next / 0.9 prev | 1 per 150 ms |
| Continue (booked) | `join` | reuse | Warm two-note rising chime | volume 0.8 | once |
| Change (reopen) | `collapse` | reuse | Soft whoosh falling | volume 0.5 | once |

No new sounds. Keyboard navigation that only moves focus is silent; sounds play on selection.

## Dependencies

- No animation library (the user's choice).
- The highlights are single absolutely positioned elements moved with CSS transitions on `transform`.
- Month slides and rolling words use CSS transitions.
- The fold uses measured size transitions.
- Dates use the built-in `Date` and `Intl`.
- `@iconify/react` for the caret and check icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 8 seconds. It ends unfolded, with a different day and time selected, which is a fine resting state.

1. The cursor appears below and to the right of the panel.
2. It glides to an available day two or three days after the selected one (600 ms) and presses.
   - The day highlight slides there.
   - The slots refresh.
   - The footer's weekday and date roll.
   - `tick` plays.
3. It glides onto the slot column (400 ms) and scrolls it down by 2 slots with a wheel event.
4. It presses a slot, for example 10:30.
   - The slot highlight slides.
   - The footer time rolls.
   - `tick` plays.
5. It waits 600 ms, then glides to Continue (500 ms) and presses.
   - The panel folds into "Meeting booked · Friday, June 15 · 10:30 – 11:00".
   - `join` plays.
6. It waits 1.2 s, then glides to "Change" (400 ms) and presses.
   - The panel unfolds with the selection kept.
   - `collapse` plays.
7. It glides away (500 ms).

The demo runner needs a `{ wheel: dy }` step for step 3 if it does not have one. If adding it is not worth it, skip the scroll and pick a visible slot.

## Card fit and hit areas

- The panel is fully interactive inside its border; empty space outside it falls through to the card link.
- At about 500 × 380 px, the side-by-side panel is wider than a wall card's stage. On the wall card the component scales down to fit (a transform from the centre).
- Check `elementFromPoint` outside the panel's corners (card link) and on the gaps between day cells. Those are inside the panel and should hit the panel, not the card link, so a stray click between days does not open the modal.

## Accessibility and edge cases

- Labels:
  - Each day is labelled "Thursday, June 12, 2026"; unavailable days add ", unavailable".
  - Slots are labelled "10:00 to 10:30".
- If `length` is longer than the day allows, no slots are shown. The slot column shows "No times this day" and Continue is disabled.
- If changing `interval`, `dayStart` or `dayEnd` removes the selected slot, the nearest remaining slot is selected and the footer rolls.
- With `weekendsOff` on and a weekend day selected, the next available day is selected.
- Near the end of a month, the "next available day after today" may be in the next month, so the calendar opens on that month.
- Around midnight and across time zones, "today" is the local date.
- The seeded unavailable days and taken slots stay stable per month, so the demo coordinates hold. The demo measures days by their label, not by a fixed position.

## Acceptance checklist

- [ ] Looks right in light and dark in both layouts; stroke strengthens the borders
- [ ] Today has a dot, unavailable days are struck through, past days are dimmed
- [ ] The day and slot highlights slide; the slot column refreshes per day and keeps the time when possible
- [ ] Only the changed words in the footer roll
- [ ] The month slides in the direction of the arrow; prev is disabled on the current month
- [ ] Continue folds into the confirmation card with the correct end time; Change unfolds with the selection kept
- [ ] Every knob visibly changes it (layout, interval, length, hours, clock, week start, unavailable, weekends, radius)
- [ ] `tick`, `swipe`, `join` and `collapse` play at their moments and respect `sound` and `volume`
- [ ] Keyboard date grid and slot listbox work; the live region speaks the sentence; reduced motion swaps without motion
- [ ] Demo runs day → time → Continue → Change

## Decisions log

- Continue: folds into a confirmation card; Change unfolds it. (User)
- Motion: sliding day and slot highlights, sliding months, rolling footer words. (User)
- Library: none. (User)
- Sound: all reused (`tick`, `swipe`, `join`, `collapse`). (User)
- Play demo: pick a day, pick a time, Continue, Change. (User)
- Extra knobs: unavailable days and weekends off, day hours, layout, corner radius. (User)
- Decided by agent:
  - the slug `meeting-picker`;
  - real dates starting at today, with English names on the site;
  - taken slots are hidden rather than struck through;
  - past days and months cannot be selected;
  - the default selection (next available day, first slot at or after 10:00);
  - the confirmation card's content;
  - the optional value formatter for hour knobs;
  - an optional `wheel` demo step;
  - the component scales to fit the wall card.
