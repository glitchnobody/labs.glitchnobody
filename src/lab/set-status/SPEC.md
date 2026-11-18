# Set status

- **Slug:** `set-status` (URL `/set-status`)
- **Number:** 3 / 60
- **Tag:** Select
- **Status:** spec
- **Design reference:** a screenshot the user supplied (a "Set Status" pill, a row of round emoji options, a thought-bubble label "Be Right Back").

## Summary

A "Set Status" pill that pops up a row of emoji statuses. Hover them to see each label in a thought bubble, then pick one to send it into the pill; × clears it.

## Look

**The pill** — "Set Status" on `--card` (a soft grey surface), radius fully round, about 230 × 64 px at default size. Contents:

- A dashed ring icon (an SVG circle with `stroke-dasharray` and a small dot in the middle) in `--ink-4`.
- The label in `--fill-on`, `var(--font-ui)`, 24 px, weight 600.

**The options row** — a capsule above the pill (or below when `direction` is Down), on `--fill-slab` with a 1 px `--pane-edge` outline and padding 8 px. Inside:

- `count` round buttons, each 60 px by default, on `--card`, gap 8 px.
- Each button holds a native emoji at about 50% of the button size.

**The thought bubble** — floats above the hovered option. It is a rounded label in `--card` with `--ink-2` text, 22 px, weight 600, with two small circles trailing down towards the option (large, then small), like a thought bubble.

**Set state** — the pill shows the emoji in place of the dashed ring, the status label as its text (or only the emoji when `showLabel` is off), and a small × button at its right end in `--ink-4`.

**Light and dark** — tokens only.

**Stroke on** — 1 px `--pane-edge` on the pill and the bubble; the row already has one.

## Behaviour

- **Open.** Pressing the pill pops the row out from the pill's centre. The capsule scales from 0.9 and fades in, then each option scales from 0 to 1 with a spring, staggered by `stagger` ms from the centre outwards. Springs are CSS `linear()` easing curves generated from `bounce` (0–100), so there is no animation library.
- **Bubble.** The bubble appears over the first hovered option. Moving to another option glides it horizontally with a small requestAnimationFrame spring (critically damped plus `bounce`). Its text cross-fades, and its width animates to fit the new label. The trailing dots lag a few frames behind the bubble, so they wobble slightly as it moves. The bubble hides 150 ms after the pointer leaves the row.
- **Hover on an option.** The option lifts (scale 1.08, background to `--fill-slab` with a soft shadow), and the emoji tilts by a few degrees.
- **Pick.** The picked emoji flies from its option into the pill's icon slot along a short arc (rAF tween about 450 ms, with a small spin and a scale overshoot on landing). Meanwhile the row closes: the options shrink in reverse stagger and the capsule fades. The pill's text cross-fades from "Set Status" to the label as the pill's width animates to fit. The landing fires the `pop` sound and a small squash on the pill.
- **Clear.** × shrinks the emoji out, the dashed ring scales back in, and the text cross-fades back to `buttonLabel`.
- **Reopen while set.** Pressing the pill reopens the row with the current status shown as selected (a 2 px `--pick` ring). Picking another status swaps it: the old emoji drops out of the pill as the new one flies in.
- **Close without picking.** Esc, pressing the pill again, or pressing outside reverses the open animation.

## Interaction

- **Pointer.** Press the pill to toggle the row, or hover to open it when `hoverOpen` is on (it closes 300 ms after the pointer leaves both the pill and the row). Hover an option to see its bubble; press it to set the status. × clears.
- **Keyboard.**
  - The pill is a button with `aria-haspopup="listbox"` and `aria-expanded`, labelled "Set status" or "Status: Be Right Back".
  - The row is a `listbox` and the options are `option`s with `aria-label` = the status label.
  - Opening focuses the current or first option. Left and Right move between options, and the bubble follows focus. Enter or Space picks. Esc closes and returns focus to the pill.
  - × is a button labelled "Clear status".
- **Touch.** Press opens; a press on an option shows its bubble for 600 ms while the pick plays. `hoverOpen` is ignored on touch.
- **Reduced motion.** No springs, no flight and no bubble glide. The row fades in, the bubble appears in place, and the pill cross-fades to the new status.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| set | Option set | select | Work, Mood, Travel | Work | Which statuses are offered (see below) |
| count | Options | range | 3–7 | 5 | How many statuses from the set |
| buttonLabel | Button | text | up to 20 chars | "Set Status" | Pill label when no status is set |
| showLabel | Label in pill | toggle | | true | Set status shows emoji and label, or the emoji only |
| bubble | Thought bubble | toggle | | true | Labels in a bubble over the hovered option |
| direction | Open | select | Up, Down | Up | Which side of the pill the row opens on |
| size | Option size (px) | range | 40–80 | 60 | Diameter of the round options |
| gap | Gap (px) | range | 0–20 | 8 | Space between options |
| stagger | Stagger (ms) | range | 0–80, step 5 | 30 | Delay between options popping |
| bounce | Bounce | range | 0–100 | 40 | Spring bounce of the pops, the bubble and the landing |
| hoverOpen | Open on hover | toggle | | false | Open on hover instead of press |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`).

**Option sets** (the first `count` are used):

| Set | Statuses |
| --- | --- |
| Work (from the reference) | 🌴 On Vacation · 🤒 Feeling Sick · 🗓️ In a Meeting · 👟 Be Right Back · 🚌 Commuting · 🍔 Out for Lunch · 🎧 Focusing |
| Mood | 😊 Feeling Good · 😴 Sleepy · ☕ Need Coffee · 🥳 Celebrating · 🧘 Calm · 🤯 Overloaded · 🔥 On Fire |
| Travel | ✈️ Flying · 🚆 On a Train · 🏖️ At the Beach · 🏔️ In the Mountains · 🚗 Driving · 🏨 At the Hotel · 🗺️ Exploring |

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Row opens | `expand` | reuse | Soft airy whoosh rising | volume 0.6 | once per open |
| Row closes without a pick, or status cleared | `collapse` | reuse | Soft airy whoosh falling | volume 0.5 | once |
| Bubble moves to another option | `tick` | reuse | Tiny dry tick | volume 0.35, pitch 0.9 → 1.3 from left to right | 1 per 40 ms; not on the first hover |
| Emoji lands in the pill | `pop` | new | Bubbly cheerful pop | volume 0.8, pitch ±5% random | once per pick |

New sound:

- **Name:** `pop`
- **ElevenLabs prompt:** "A short bubbly cheerful pop, like a soap bubble bursting in a playful app, bright and round, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.7 · **loop:** false
- **Trim to:** about 120 ms

## Dependencies

None, as the user chose. Springs are CSS `linear()` curves computed from `bounce`. The bubble glide and the emoji flight are small requestAnimationFrame loops. Width changes use CSS transitions on measured widths.

## Play demo

Agreed with the user. About 7 seconds; ends exactly where it started.

1. The cursor appears below the pill.
2. It glides onto "Set Status" (500 ms) and presses. The options pop up one by one and `expand` plays.
3. It glides onto 🌴 (400 ms). The bubble appears: "On Vacation".
4. It glides to 🤒 (350 ms), then 🗓️ (350 ms). The bubble glides along, the text changes to "Feeling Sick" and then "In a Meeting", and a tick plays on each move.
5. It glides to 👟 (350 ms): "Be Right Back". It presses, and the sneaker flies into the pill with a squash. The pill reads "👟 Be Right Back", the row closes and `pop` plays.
6. It waits 1 s, then glides to × (500 ms) and presses. The status clears back to "Set Status" and `collapse` plays.
7. It glides away (500 ms).

## Card fit and hit areas

Only the pill, the open row, the bubble (which is pointer-transparent) and × react. The root holds the pill and an absolutely positioned row, so on the wall the root is `pointer-events: none` with `pointer-events: auto` on the pill, the row capsule and ×. Empty space above, below and beside the pill falls through to the card link. With the row open, the gaps between options belong to the row capsule, so they do not open the modal. Check `elementFromPoint` just outside the pill's rounded ends and the capsule's ends.

## Accessibility and edge cases

- Emoji are `aria-hidden`; labels carry the meaning.
- A live region announces "Status set: Be Right Back" or "Status cleared".
- If `count` is reduced below the index of the current status, the status stays set (it is kept even if no longer offered).
- If `set` changes while a status is set, the status is cleared.
- At the largest `size` with 7 options, the row is about 620 px wide and would overflow the wall card. On the wall card the row scales down to fit (a CSS transform from the pill's centre).
- Fast hovering across options: the bubble retargets smoothly and ticks are rate-limited.
- Pressing an option during the open stagger works.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the pill and the bubble
- [ ] Every knob visibly changes it, including the three option sets and the text label
- [ ] Options pop in with stagger and bounce; the bubble glides and resizes; the dots trail
- [ ] Picking flies the emoji into the pill and morphs the text and width; × clears it
- [ ] Direction Down opens below with the bubble still above the options
- [ ] `expand`, `collapse`, `tick` and `pop` play at their moments and respect `sound` and `volume`
- [ ] Keyboard listbox works (arrows, Enter, Esc); reduced motion cross-fades
- [ ] Demo runs open → browse → pick → clear and ends in the starting state

## Decisions log

- Pick: the pill becomes the status (the emoji flies in, the text morphs), and × clears it. (User)
- Icons: native emoji. (User)
- Motion: spring pop with stagger and a gliding thought bubble. (User)
- Library: none; CSS `linear()` springs and requestAnimationFrame. (User)
- Sound: reuse `expand`, `collapse` and `tick`; one new `pop` when the emoji lands. (User; sounds suggested by agent)
- Play demo: open, browse three options, pick "Be Right Back", clear. (User)
- Extra knobs: option set, item size and gap, open on hover, show label in pill. (User)
- Decided by agent:
  - the option sets and labels, with Work matching the reference;
  - the tag is Select;
  - the stagger runs from the centre outwards;
  - the dots trail the bubble;
  - a reopened row marks the current status;
  - changing the set clears the status;
  - the row scales down to fit the wall card.
