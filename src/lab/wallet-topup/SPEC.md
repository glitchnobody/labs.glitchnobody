# Wallet top-up

- **Slug:** `wallet-topup` (URL `/wallet-topup`)
- **Number:** 47 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/35.mp4` (a wallet widget: collapsed, "Wallet $34.00" with an "Add Cash" button; pressing it grows the card while the button travels to the bottom, revealing Payment mode with two saved cards as radio rows and "Add card", Cash chips $50 / $100 / $300, and Add Cash; × collapses). Only the idea is used; no card brand marks.

## Summary

A wallet that tops itself up. Open it, pick a card and an amount, press Add Cash, and watch it fold away while the balance rolls up with a burst of coins.

## Look

**One surface** following the theme: the card on `--fill-slab`, radius 16, soft shadow in light mode, `--pane-edge` hairline in dark.

**Collapsed** (about 260 × 56 px): a 32 px icon tile (`ph:wallet-fill` on `color-mix(in srgb, var(--fill-on) 6%, var(--fill-slab))`), "Wallet" in `--ink-3`, 11 px, over the balance "$34.00" in `--fill-on`, 16 px weight 700, tabular; and the "Add Cash" button at the right (34 px tall, fully rounded, on `--fill-on` with `--fill-slab` text, `ph:plus-bold` and the label, 12 px weight 600; an inverted-ink button, as approved for `pricing-toggle`).

**Open** (about 260 × 250 px):

- The header row as above with a × button (`ph:x-bold`) in place of Add Cash.
- "Payment mode" (12 px weight 600) with a small "Add card" chip on the right (`ph:credit-card`, 10 px text, `--ink-3`, hairline border; press animation only).
- `cards` saved-card rows (default 2), 32 px each, radius 8, 1 px `--pane-edge` border: a radio dot, `ph:credit-card` 14 px and "•••• 6756" (then 4632, 1190) in 12 px tabular; the selected row has a 1.5 px `--fill-on` border and a filled radio, as in the video.
- "Cash" (12 px weight 600) and three amount chips side by side (each 32 px, radius 8, hairline border, 12 px weight 600); the selected chip is `--fill-on` with `--fill-slab` text.
- The Add Cash button at the bottom left (the same button that was in the header).

**Amount chips** (`chips`): Small $10 / $20 / $50; Medium $50 / $100 / $300 (default, the video); Large $100 / $500 / $1,000.

**Coins** (when `burst` is on): 8 small `ph:coin-fill` icons in `--fill-on` at 60% that burst up from the balance and fade.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the card (adds one in light mode).

## Behaviour

- **Open.** Pressing Add Cash (collapsed): the card grows with a `motion` layout animation; the Add Cash button travels from the header's right to the bottom-left (shared `layoutId`), and the × fades in where it was. Sections fade and rise in, staggered 40 ms. `expand` plays. The first card and no amount are selected.
- **Pick.** Pressing a card row or an amount chip selects it (the selected border or fill animates in); `tick`.
- **Add Cash (open).** With no amount picked, the chips shake gently and `tick` plays low. With an amount: the button shows `ph:circle-notch-bold` spinning for 600 ms, then the card collapses (the button travels back to the header), and the balance rolls up digit by digit to the new amount ($34.00 → $134.00) while the coins burst; `coins` plays. Calls optional `onTopUp({ amount, card })`.
- **Close.** × or Escape collapses without changes; `collapse`.
- **Reset.** With `reset` above 0, the balance rolls back to $34.00 that many seconds after a top-up (default 5), so the card returns to its starting state.

## Interaction

- **Pointer.** Press Add Cash, rows, chips, ×.
- **Keyboard.** Add Cash is a `button` with `aria-expanded`. Open, the cards are a `radiogroup` ("Payment card") and the chips a `radiogroup` ("Amount"), each with arrow keys; focus moves to the first card on open and returns to Add Cash on close. A live region announces "Added $100. Balance $134.00".
- **Touch.** Same.
- **Reduced motion.** No layout morph or burst: a cross-fade between collapsed and open; the balance swaps without rolling.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| chips | Amounts | select | Small, Medium, Large | Medium | The three amount chips |
| cards | Saved cards | range | 1–3 | 2 | How many saved cards |
| burst | Coin burst | toggle | | true | Coins burst from the balance on top-up |
| reset | Reset after (s) | range | 0–20 | 5 | Seconds before the balance returns to its start (0 = never) |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `balance` (default 34), `currency` (default "USD") and `onTopUp`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Opens / closes | `expand` / `collapse` | reuse | Soft whoosh up / down | volume 0.5 | none |
| A card or amount is picked | `tick` | reuse | Tiny dry tick | volume 0.4 | none |
| Balance rises | `coins` | new | Soft coin jingle | volume 0.55 | none |

New sound:

- **Name:** `coins`
- **ElevenLabs prompt:** "A short soft jingle of a few small coins dropping into a pile, bright and pleasant, close, clean, dry, no reverb"
- **duration_seconds:** 0.6 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** about 400 ms

## Dependencies

- `motion` (the user's choice) for the card and travelling-button layout animation. Import `motion/react` with `LazyMotion` + `domMax`.
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install motion @iconify/react"`.

## Play demo

Agreed with the user. About 7 seconds; the balance resets 5 s after.

1. The cursor appears below the card ([0.6, 1.8], instant; positions measured at build time for the open layout).
2. It glides to Add Cash (500 ms) and presses: the card opens, the button travels down; `expand`.
3. It glides to the second card row (500 ms) and presses: it becomes selected; `tick`.
4. It glides to $100 (400 ms) and presses; `tick`.
5. It glides to Add Cash (400 ms) and presses: spinner, the card collapses, the balance rolls to $134.00 with coins; `coins`.
6. It waits 800 ms and glides away (500 ms).

## Card fit and hit areas

The root is the morphing card; it grows downward from a header-sized anchor (absolute positioning) so the wall layout does not jump. On the wall the open card's padding falls through: the card is `pointer-events: none` with `auto` on the buttons, rows and chips. Check `elementFromPoint` beside the collapsed card and in the open card's padding (card link), and on a chip and a row (component).

## Accessibility and edge cases

- Balances format with `Intl.NumberFormat` and two decimals; the roll handles a new digit column ($34 → $1,034).
- Pressing Add Cash twice quickly does not double the top-up (the button is disabled during the spinner).
- Changing `cards` while open rebuilds the rows and keeps the first selected.

## Acceptance checklist

- [ ] Looks right in light and dark; one surface; stroke outlines it
- [ ] Add Cash opens the card with the button travelling to the bottom; × collapses it back
- [ ] Picking rows and chips works; Add Cash without an amount shakes the chips
- [ ] Add Cash with an amount spins, collapses, rolls the balance up and bursts coins; the balance resets after `reset` seconds
- [ ] Every knob visibly changes it (amounts, saved cards, coin burst, reset)
- [ ] `expand`, `collapse`, `tick`, `coins` respect `sound` and `volume`
- [ ] Radiogroups and focus handling work; reduced motion cross-fades
- [ ] Demo opens, picks card 2 and $100, adds, and the balance rolls up

## Decisions log

- Add Cash: the balance rolls up and the card collapses. (User)
- Motion: `motion` layout with `domMax`. (User)
- Sound: `expand`/`collapse`, `tick`, a new `coins` jingle. (User)
- Play demo: open, pick card 2, $100, Add Cash. (User)
- Knobs: amount chips, saved cards, coin burst and balance reset. (User)
- Card marks: a generic card icon and the last four digits, no brand names. (User)
- Decided by agent:
  - the slug `wallet-topup` and the tag Press;
  - the amount chip sets;
  - the shake when no amount is picked;
  - the inverted-ink Add Cash button (as approved for `pricing-toggle`);
  - the 600 ms simulated processing spinner.
