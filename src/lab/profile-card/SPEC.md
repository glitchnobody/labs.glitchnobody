# Profile card

- **Slug:** `profile-card` (URL `/profile-card`)
- **Number:** 10 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** `~/Downloads/inso/01.jpg` (a still of a brand profile card: grey cover, square logo overlapping the cover edge, social icons, Follow pill, name with a verified badge, handle, bio, Following/Followers counts and a link). Only the layout is used; the brand in the image is not.

## Summary

The glitchnobody labs profile card. Move over it to tilt it and slide the light across the cover, press Follow to watch the follower count roll, and press the link to copy it.

## Look

**Card.** About 320 px wide, corner radius `radius` (default 20), clipped. Two parts:

- **Cover** on top, 130 px tall. Style from `cover`:

  | Cover | Look |
  | ----- | ---- |
  | Metal (default, the image's look) | Soft grey, `color-mix(in srgb, var(--fill-on) 18%, var(--fill-slab))` toward `color-mix(in srgb, var(--fill-on) 28%, var(--fill-slab))`, with a radial light spot (white at about 35% fading out over 180 px) that follows the pointer |
  | Gradient | Two hues from a hash of the name (as the gradient avatars), with the same light spot |
  | Image | A filler painting on the site (`siteProps.images[0]`, `object-fit: cover`); exported code falls back to Gradient |

- **Body** on `--fill-slab`, padding 20, text in `--fill-on`. In dark mode this is the black card of the image; in light mode it is white.

**Logo.** A 96 px tile overlapping the cover's bottom edge by half, at the left, with a 4 px ring in `--fill-slab` so it looks cut out of the body. Shape from `logoShape`: Square (radius 22, the image's look) or Round.

- The labs favicon (`public/lab/avatars/you.svg`) is the default logo **in the component itself and in copied code**, embedded in the `.tsx` as an inline SVG data URI constant (`LOGO`), so it works anywhere without a file. This is a user-approved exception to the people-images rule: it is the user's own brand mark.
- A `logo` prop (image URL) replaces it; with `logo=""` the card shows a gradient tile from the name hash with the initial in white, 600 weight.

**Top row of the body,** to the right of the logo, aligned to the logo's lower half:

- Social icons in `--fill-on`, 20 px, 14 px apart: `ph:x-logo-bold`, `ph:github-logo-bold`, `ph:instagram-logo-bold`. Shown when `socials` is on. Hover lifts an icon 2 px and shows a small tooltip with the network name.
- The Follow pill: 32 px tall, padding 0 16, `--card` background with `--fill-on` text, 13 px weight 600 (the image's light-grey pill on black).

**Text.**

- Name "glitchnobody labs", 22 px weight 700, followed by `ph:seal-check-fill` in `--ink-3` when `verified` is on.
- Handle "@glitchnobody", 14 px `--ink-4`.
- Bio, 14 px `--ink-2`, line height 1.5, 12 px below: "Small interactive components with sound, built one at a time. Copy the prompt, make it yours."
- Stats row (when `stats` is on): "**60** Following" and "**1.2K** Followers"; numbers in `--fill-on` weight 600, labels in `--ink-4`, 20 px apart.
- Link row (when `link` is on): `ph:link-bold` and "labs.glitchnobody.com" in `--ink-3`.

**Following state.** The pill shows `ph:check-bold` and "Following" on a transparent background with a 1 px `--pane-edge` border, text `--fill-on`. Hovering it while following shows "Unfollow" in `--danger` (the token added by `hold-to-delete`; if this is built first, it adds `--danger`).

**Glare.** When `glare` is on, a white radial highlight (about 18% at its centre, `mix-blend-mode: soft-light`) sits over the whole card and moves opposite to the tilt.

**Light and dark.** Tokens only.

**Stroke on.** 1 px `--pane-edge` around the card, and the logo ring becomes `--pane-edge` instead of `--fill-slab`.

## Behaviour

- **Tilt.** While the pointer is over the card, it rotates toward the pointer, up to `tilt` degrees on each axis (`perspective(900px) rotateX rotateY`), eased with a critically damped spring in rAF (about 150 ms to settle). Leaving springs it back to flat. The glare and the cover's light spot follow the same pointer position.
- **Cover light.** The light spot tracks the pointer across the cover; when the pointer is on the body, the spot stays at the nearest point on the cover's bottom edge, so the cover still reacts. Without a pointer it rests at the top right, as in the image.
- **Follow.**
  1. Press Follow: the pill width animates to fit "Following" (measured), the plus-less label cross-fades, and the check pops in with a small spring (CSS `linear()`). `pop` plays.
  2. At the same moment the Followers number expands from "1.2K" to the exact "1,248", the last digits roll up to "1,249" (odometer columns, 350 ms, each changing digit plays `tick`), then after 1.4 s it collapses back to the compact "1.2K". If the compact form changes (for example 999 → "1K"), it rolls to the new compact value.
  3. Press again (shown as "Unfollow" on hover): the pill shrinks back to "Follow", the count rolls down by one the same way, and `collapse` plays.
- **Copy link.** Pressing the link copies `https://labs.glitchnobody.com` with `navigator.clipboard.writeText`; the link text cross-fades to "Copied" with a check for 1.2 s, and `tick` plays. If the clipboard is refused, it shows "Press Ctrl+C" and selects the link text.
- **Social icons.** Links to `#` by default (props `socialLinks` override); hover lifts and shows the tooltip, no sound.

## Interaction

- **Pointer.** Hover tilts the card and moves the lights. Press Follow, the link and the social icons. Text stays selectable.
- **Keyboard.**
  - Follow is a `button` with `aria-pressed`, labelled "Follow glitchnobody labs" / "Unfollow glitchnobody labs". Enter and Space toggle it.
  - The link is a `button` labelled "Copy link labs.glitchnobody.com".
  - Social icons are links labelled with the network name.
  - Keyboard focus inside the card tilts it slightly toward the focused element (half of `tilt`), so keyboard users see the effect too.
  - A live region announces "Following, 1,249 followers" and "Link copied".
- **Touch.** No tilt or moving light on touch (no hover); pressing works the same.
- **Reduced motion.** No tilt, no glare movement, the light spot stays at rest. The count swaps without rolling; the pill swaps without the width animation.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| tilt | Tilt (°) | range | 0–15 | 8 | Maximum tilt toward the pointer; 0 turns it off |
| glare | Glare | toggle | | true | The moving highlight over the card |
| cover | Cover | select | Metal, Gradient, Image | Metal | Cover style |
| logoShape | Logo | select | Square, Round | Square | Logo tile shape |
| verified | Verified | toggle | | true | The badge after the name |
| socials | Socials | toggle | | true | The social icons |
| stats | Stats | toggle | | true | Following and Followers row |
| link | Link | toggle | | true | The link row |
| radius | Corner (px) | range | 0–32 | 20 | Card corner radius |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Content props (not knobs, defaults as above): `name`, `handle`, `bio`, `following` (60), `followers` (1248), `url`, `socialLinks`, `logo` (image URL; defaults to the inline favicon, `""` for the gradient tile).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Follow | `pop` | reuse | Bubbly pop | volume 0.7, pitch 1.05 | none |
| Unfollow | `collapse` | reuse | Soft whoosh falling | volume 0.5 | none |
| A follower digit rolls | `tick` | reuse | Tiny dry tick | volume 0.35, pitch 1 + 0.06 × digit index | 1 per 40 ms |
| Link copied | `tick` | reuse | Tiny dry tick | volume 0.5, pitch 1.2 | none |

No new sounds.

## Dependencies

- No animation library: tilt and light in rAF with a small spring, the pill and the check with CSS transitions and `linear()` springs, the count with a small odometer column per digit.
- `@iconify/react` for the social, verified, check and link icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends unfollowed and flat.

1. The cursor appears at the cover's top left, inside the card ([0.1, 0.1], instant).
2. It drifts across the cover to the top right (1000 ms): the card tilts and the light spot follows.
3. It glides down to the Follow pill (500 ms) and presses. The pill becomes "✓ Following", `pop` plays, the count expands to 1,248 and rolls to 1,249 with ticks.
4. It waits 1600 ms (the count collapses back to 1.2K).
5. It presses the pill again (it shows "Unfollow" on hover). The pill returns to "Follow", the count rolls down, `collapse` plays.
6. It waits 600 ms and glides off the card (500 ms); the card springs back to flat.

## Card fit and hit areas

The card is a solid rectangle with rounded corners, so the whole card reacts (hover tilts it). Clip the root with `border-radius` and `overflow: hidden` and check `elementFromPoint` just outside each rounded corner (card link) and just inside (component). Tilting changes the visual corners; hit testing follows the transformed box, which is fine. About 320 × 380 px at default; on the wall it scales to fit the stage height (transform from the centre) when taller than the stage.

## Accessibility and edge cases

- Text contrast: `--ink-4` on `--fill-slab` meets 4.5:1 for the handle in both themes (check at build time; use `--ink-3` if not).
- Follow pressed rapidly: each press flips the state; the count roll retargets from where it is.
- `followers` large (for example 23,300): compact "23.3K", exact "23,300" → "23,301".
- All of `socials`, `stats` and `link` off: the card shrinks smoothly; the Follow pill stays in the top row.
- Long names wrap to two lines; the badge stays attached to the last word.
- Missing logo image: the gradient tile renders, no layout shift.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the card and logo ring
- [ ] The card tilts toward the pointer and springs back; the cover light and glare follow
- [ ] Follow morphs to "✓ Following", the count expands, rolls by one and collapses; Unfollow reverses it
- [ ] Copy link shows "Copied" and the clipboard holds the URL (stubbed); the fallback selects the text
- [ ] Every knob visibly changes it (tilt, glare, cover, logo, verified, socials, stats, link, corner)
- [ ] Copied code has no `/lab/avatars/` or `/lab/demoimages/` URLs; the favicon logo is inline in the `.tsx`; `logo=""` shows the gradient tile
- [ ] `pop`, `collapse` and `tick` play at their moments and respect `sound` and `volume`
- [ ] Keyboard works (`aria-pressed`, focus tilt, live region); reduced motion turns off tilt and rolls
- [ ] Demo runs cover hover → Follow → Unfollow and ends flat and unfollowed

## Decisions log

- Behaviour: Follow morph with the count roll, a cover light that follows the pointer, card tilt, copy link. (User)
- Identity: the default brand is glitchnobody labs with the favicon as its logo. (User)
- Play demo: cover hover, Follow, Unfollow. (User)
- Sound: reuse `pop`, `collapse` and `tick`; no new sounds. (User)
- Knobs: tilt and glare, cover style, logo shape and verified, socials/stats/link and corner. (User)
- Theme: tokens both ways (black body in dark, white in light). (User)
- Content: handle, bio, link and counts as suggested. (User)
- Logo export: the favicon ships in copied code, an exception to the people-images rule. (User)
- Socials: X, GitHub, Instagram (the image had LinkedIn instead of GitHub). (User)
- Decided by agent:
  - the slug `profile-card` and the tag Press;
  - the favicon is inlined as a data URI in the `.tsx`;
  - the count expands to the exact number while rolling, then returns to compact;
  - "Unfollow" in `--danger` on hover while following;
  - keyboard focus tilts the card at half strength;
  - no tilt on touch.
