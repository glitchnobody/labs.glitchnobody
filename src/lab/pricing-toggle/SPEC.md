# Pricing toggle

- **Slug:** `pricing-toggle` (URL `/pricing-toggle`)
- **Number:** 41 / 60
- **Tag:** Select
- **Status:** spec
- **Design reference:** `~/Downloads/inso/29.mp4` (a white pricing card for a made-up product with a Monthly / Yearly (−20%) toggle; switching rolls the price between $24 and $19, swaps the line under it between "Billed monthly" and "$228 billed yearly · save $60", and lights up a yearly-only "Early access" feature row; a black CTA button). The product here is glitchnobody labs Pro. Only the layout and idea are used.

## Summary

A pricing card for glitchnobody labs Pro. Flip between monthly and yearly: the price rolls, the billing line changes and the yearly-only perk lights up.

## Look

**Card.** About 280 px wide, radius 18, on `--fill-slab`, padding 18, soft shadow in light mode, `--pane-edge` hairline in dark.

**Header.**

- The labs favicon as a 20 px logo (inlined in the `.tsx` as a data URI, the same user-approved exception as `profile-card`) and "glitchnobody labs **Pro**", 14 px, `--fill-on` ("Pro" in `--ink-3`).
- A line: "60 small interactive components with sound. Copy the prompt, make it yours." in `--ink-3`, 12 px, line height 1.45.

**Toggle** (`toggle`):

| Style | Look |
| ----- | ---- |
| Segmented (default, the video) | a 32 px track on `color-mix(in srgb, var(--fill-on) 6%, var(--fill-slab))`, radius 9, two halves "Monthly" and "Yearly" with a small "−20%" chip in `--ok`; a sliding thumb on `--fill-slab` with a soft shadow under the active half |
| Switch | "Monthly", a 36 × 20 switch, "Yearly −20%" |
| Tabs | two text tabs with a 2 px `--fill-on` underline that slides |

**Price.** "$24" in `--fill-on`, 44 px weight 700, tabular figures, then "/ month" in `--ink-3`, 13 px. Under it the billing line, 12 px: "Billed monthly" in `--ink-3`, or "**$228** billed yearly · save $60" with the amount in `--fill-on`.

**Features** (the first `features` rows, default 4), 8 px apart: an 18 px icon tile, the feature name (12 px weight 500, `--fill-on`) and a note on the right (11 px, `--ink-4`):

| Feature | Icon | Note | Plan |
| ------- | ---- | ---- | ---- |
| Full source | `ph:code-bold` | Every line is yours | both |
| Sound files | `ph:speaker-high-bold` | Every click and pop | both |
| New every week | `ph:calendar-plus-bold` | Ships every Monday | both |
| Early access | `ph:lightning-bold` | 7 days before all | yearly only |
| Copy prompt | `ph:copy-bold` | One click to your agent | both |
| Lifetime updates | `ph:infinity-bold` | Never pay twice | yearly only |

Yearly-only rows are dimmed (40% opacity, note "Yearly only") when Monthly is on.

**CTA** (`cta`): Solid (default): a full-width 40 px button on `--fill-on` with `--fill-slab` text, "Get labs Pro", 13 px weight 600, radius 10 (a button in inverted ink, approved by the user; not a surface band). Outline: transparent with a 1 px `--fill-on` border and `--fill-on` text. Below it, "Cancel anytime · 14-day refund" in `--ink-4`, 11 px, centred.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the card.

## Behaviour

- **Prices.** Monthly price from `price` (default 24). Yearly per-month price = `price × (1 − discount / 100)`, rounded to a whole number (24 × 0.8 = 19.2 → $19); billed yearly = that × 12 ($228); saving = `price × 12 − billed` ($60). The chip shows "−`discount`%".
- **Currency** (`currency`): USD $ (default), EUR € (× 0.92), GBP £ (× 0.79), INR ₹ (× 84), applied to the monthly price and rounded before the yearly maths, formatted with `Intl.NumberFormat`.
- **Switch plan.** Pressing the other option: the thumb slides (CSS `linear()` spring); each price digit rolls to its new value (odometer, 300 ms, rolling down for cheaper, up for dearer), and on Yearly the old monthly price appears small and struck through to the price's right for 1.2 s, then fades; the billing line cross-fades with a slight vertical slide; yearly-only rows animate from dimmed to full with a small scale pop. `tick` plays on press; `tick` at low volume per rolling digit; `pop` when a yearly-only row lights up.
- **CTA.** Press animation (scale 0.97) and `settle`; calls optional `onCheckout(plan)`.

## Interaction

- **Pointer.** Press the toggle options and the CTA.
- **Keyboard.** The toggle is a `radiogroup` ("Billing period") with Left/Right; in Switch style it is a `switch` labelled "Yearly billing". The CTA is a `button`. A live region announces "Yearly, 19 dollars a month, billed 228 dollars yearly".
- **Touch.** Same.
- **Reduced motion.** No roll or spring: the price and line swap with a 120 ms fade; rows change opacity without the pop.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| price | Monthly price | range | 5–99 | 24 | Monthly price (in USD before conversion) |
| discount | Yearly discount (%) | range | 0–50, step 5 | 20 | Yearly saving |
| currency | Currency | select | USD, EUR, GBP, INR | USD | Currency and symbol |
| toggle | Toggle | select | Segmented, Switch, Tabs | Segmented | Billing toggle style |
| features | Features | range | 2–6 | 4 | How many feature rows |
| cta | Button | select | Solid, Outline | Solid | CTA style |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `plan` (default "Monthly") and `onCheckout`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Toggle pressed | `tick` | reuse | Tiny dry tick | volume 0.5 | none |
| A price digit rolls | `tick` | reuse | Tiny dry tick | volume 0.25, pitch 1.2 | 1 per 40 ms |
| A yearly-only row lights up | `pop` | reuse | Bubbly pop | volume 0.45 | none |
| CTA pressed | `settle` | reuse | Soft lock-in click | volume 0.55 | none |

No new sounds.

## Dependencies

- None. CSS transitions for the thumb and rows; a per-digit roll for the price.
- `@iconify/react` for the feature icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends on Yearly.

1. The cursor appears to the right of the toggle ([1.1, 0.3], instant).
2. It glides to "Yearly" (500 ms) and presses: the thumb slides, $24 rolls to $19, the billing line changes, Early access lights up.
3. It waits 1000 ms, glides to "Monthly" (400 ms) and presses: back to $24, Early access dims.
4. It waits 800 ms, glides to "Yearly" (400 ms) and presses.
5. It waits 800 ms and glides away (500 ms).

## Card fit and hit areas

The card is a solid rounded rectangle; it is the component. To keep the modal reachable, on the wall the card root is `pointer-events: none` with `auto` on the toggle, the CTA and the text (selectable). Check `elementFromPoint` in the card padding (card link), on the toggle and the CTA (component). The card (about 280 × 400 px) scales to fit the stage.

## Accessibility and edge cases

- A 0% discount hides the chip and the "save" part of the line.
- INR prices are whole rupees; the digit count can change (e.g. ₹2,016 → ₹1,613), so the roll handles columns appearing and disappearing.
- Price text uses the currency's grouping separators.

## Acceptance checklist

- [ ] Looks right in light and dark; the CTA is inverted ink; stroke outlines the card
- [ ] Switching rolls the price digits, shows the struck old price briefly, swaps the billing line and lights or dims yearly-only rows
- [ ] All three toggle styles work; prices recompute from price, discount and currency
- [ ] Every knob visibly changes it (price, discount, currency, toggle, features, button)
- [ ] `tick`, `pop`, `settle` respect `sound` and `volume`
- [ ] Keyboard radiogroup/switch and the live region work; reduced motion fades
- [ ] Demo toggles Yearly, Monthly, Yearly

## Decisions log

- Product: glitchnobody labs Pro. (User)
- Price change: digit roll. (User)
- Sound: `tick`, `settle`, `pop`. (User)
- Play demo: Yearly, Monthly, Yearly. (User)
- Knobs: price and discount, currency, toggle style, features shown and CTA style. (User)
- CTA: inverted ink button is fine. (User)
- Decided by agent:
  - the slug `pricing-toggle` and the tag Select;
  - the copy, features and notes;
  - the favicon logo inlined, as approved for `profile-card`;
  - currency conversion rates and rounding;
  - the struck-through old price on Yearly.
