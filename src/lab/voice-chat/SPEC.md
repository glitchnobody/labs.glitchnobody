# Voice chat

- **Slug:** `voice-chat` (URL `/voice-chat`)
- **Number:** 2 / 60
- **Tag:** Press
- **Status:** spec
- **Design reference:** a Pinterest video pin by Anton Kalimanov (https://ca.pinterest.com/pin/1108941108258190086/). Only the idea and layout are used; no code or images come from it, so no `adaptedFrom`.

## Summary

A pill showing who is in a voice chat: a waveform badge, a few overlapping avatars and "+3". Press it to morph it into a card with everyone named and speaking; join, toggle your mic, and close it back into the pill.

## Look

**Pill (collapsed)** — rounded capsule on `--fill-slab` with a soft shadow, roughly 260 × 64 px at default size.

- A small dark circle badge with a waveform glyph sits over the pill's top-left edge (`--fill-on` background, `--fill-slab` glyph).
- `visible` avatars (default 4) in a row, slightly overlapping, each with a 2 px ring in `--fill-slab` so overlaps read cleanly.
- After them, "+N" and a chevron-down in `--ink-3`, where N is the hidden count. Hidden when everyone fits.

**Card (open)** — about 300 × 300 px, same surface, radius 20 px.

- Header: title "Voice Chat" centred in `--ink-3`, 13 px; close X at the right in `--ink-4`.
- Grid of all `people` avatars, `columns` per row, names under them in `--ink-2`, 12 px (when `names` is on).
- Speaking people get a small bars badge on the avatar's top-right and a soft ring pulse.
- Full-width primary button "Join Now" (`--fill-on` background, `--fill-slab` text, radius 10 px).
- Note under it, "Mic will be muted initially." in `--ink-4`, 11 px.

**Other**

- Avatars: on the site, photos from `/lab/avatars/NN.webp` passed through `siteProps` (default seven: Oğuz, Ashish, Mariana, Mika, Ana, Nathan and Afshin, using 01, 03, 06, 12, 15, 21 and 24), shown as circles. In the exported code (code view, Copy prompt) the component has no image URLs: every person is a gradient circle generated from a hash of their name, with their initial. See AGENTS.md, "People images".
- Light and dark: tokens only. Shadow is stronger in light, replaced by a `--pane-edge` hairline in dark.
- Stroke on: 1 px `--pane-edge` outline on the pill and the card.

## Behaviour

- **Open (morph).** One shared container animates from the pill's size and radius to the card's (framer-motion `layout`). Each avatar is a shared `layoutId` element that flies from its spot in the row to its spot in the grid, staggered by `stagger` ms in reading order. Hidden avatars (beyond `visible`) fade and scale in from the "+N" position. Names, the title, the button and the note fade in after the avatars are mostly there. "+N" and the chevron fade out. The waveform badge moves from the pill's corner to the card's top-left corner.
- **Close.** The reverse: names and the button fade first, avatars fly back into the row, hidden ones shrink into "+N", the container shrinks to the pill.
- **Spring.** Spring physics with `bounce` (0–100 mapped to framer's bounce 0–0.6) and `speed` (0–100 mapped to visual duration 0.7 s to 0.25 s).
- **Speaking.** With `speaking` on, every `turn` seconds (± 30%) one or two random people (never you while muted) speak for 1–3 s. A speaker shows the bars badge (three bars animating with CSS keyframes), and their avatar ring pulses softly in `--ok`. The pill's waveform badge animates while anyone speaks; in the pill only visible avatars show the ring.
- **Join.** "Join Now" adds you: the site favicon (`/lab/avatars/you.svg`, via `siteProps.me`; a gradient in exported code) with the name "You" pops into the last grid spot (scale 0 → 1 with the spring) with a muted-mic badge. The button row becomes a mic toggle (icon button, muted by default) plus a "Leave" button. Leave removes you (scale out) and restores "Join Now". When you are joined, the collapsed pill shows a 2 px `--ok` ring around the waveform badge and counts you in "+N".
- **Mic.** Toggling unmutes you, and you can then be picked as a speaker. The badge changes between mic and mic-off.

## Interaction

- **Pointer.** Pressing the pill opens it, or hovering opens it when `hoverOpen` is on, closing again on pointer leave after 300 ms. In the card:
  - the X closes it;
  - pressing outside the card (on the card's own stage, not the wall) closes it;
  - Join, Mic and Leave are buttons;
  - avatars show their name in a tooltip on hover when `names` is off.
- **Keyboard.**
  - The pill is a button with `aria-expanded`, labelled "Voice chat, 7 people, 2 speaking".
  - Enter or Space opens it. Focus moves to the close button and is trapped within the card while open.
  - Esc closes it and returns focus to the pill.
  - Tab order: close, avatars (not focusable unless `names` is off), Join or Mic/Leave.
- **Touch.** Same as press; `hoverOpen` is ignored on touch (`pointerType !== "mouse"`).
- **Reduced motion.** No flying avatars or springs; the pill and card cross-fade over 150 ms, the speaking bars are static, and the pulse is replaced by a steady ring.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| people | People | range | 3–12 | 7 | How many people are in the chat |
| visible | In the pill | range | 2–6 | 4 | Avatars shown before "+N" |
| columns | Grid columns | range | 3–5 | 4 | Avatars per row in the card |
| overlap | Overlap (%) | range | 0–40 | 10 | How much pill avatars overlap |
| size | Avatar (px) | range | 28–56 | 40 | Avatar size (card avatars are 1.2× this) |
| names | Show names | toggle | | true | Names under avatars in the card |
| title | Title | text | up to 24 chars | "Voice Chat" | Card title |
| button | Button | text | up to 16 chars | "Join Now" | Join button label |
| note | Note | text | up to 40 chars | "Mic will be muted initially." | Line under the button (empty hides it) |
| speaking | Speaking | toggle | | true | Live speaking indicators |
| turn | Speaker change (s) | range | 1–6, step 0.5 | 2.5 | How often speakers change |
| bounce | Bounce | range | 0–100 | 25 | Spring bounce of the morph |
| speed | Speed | range | 0–100 | 60 | How fast the morph is |
| stagger | Stagger (ms) | range | 0–80, step 5 | 25 | Delay between avatars as they fly |
| hoverOpen | Open on hover | toggle | | false | Open on hover instead of press |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Needs the `text` knob type (introduced by `staggered-countdown`; add it if that one is not built yet).

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| Card opens | `expand` | new | Soft airy whoosh rising | volume 0.7 | once per open |
| Card closes | `collapse` | new | Soft airy whoosh falling | volume 0.6 | once per close |
| You join | `join` | new | Warm two-note rising chime | volume 0.8 | once |
| You leave | `leave` | new | Warm two-note falling chime | volume 0.7 | once |
| Mic toggled | `tick` | reuse | Tiny dry tick | pitch 1.15 unmuting, 0.9 muting | none |

New sounds:

**`expand`**
- **ElevenLabs prompt:** "A soft short airy whoosh rising upward, like a light card sliding open in an app, gentle UI transition, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** about 250 ms

**`collapse`**
- **ElevenLabs prompt:** "A soft short airy whoosh falling downward, like a light card folding closed in an app, gentle UI transition, dry, no reverb"
- **duration_seconds:** 0.5 · **prompt_influence:** 0.6 · **loop:** false
- **Trim to:** about 220 ms

**`join`**
- **ElevenLabs prompt:** "A warm gentle two-note rising chime, soft marimba-like tones, friendly app sound for joining a voice call, clean, short tail"
- **duration_seconds:** 1.0 · **prompt_influence:** 0.7 · **loop:** false
- **Trim to:** about 450 ms

**`leave`**
- **ElevenLabs prompt:** "A warm gentle two-note falling chime, soft marimba-like tones, app sound for leaving a voice call, clean, short tail"
- **duration_seconds:** 1.0 · **prompt_influence:** 0.7 · **loop:** false
- **Trim to:** about 450 ms

## Dependencies

The user chose **framer-motion layout animations** (`layout`, `layoutId`, `AnimatePresence`) over a hand-written FLIP or a simple cross-fade.

- Install `motion` (the current package name; import from `motion/react`).
- Use `LazyMotion` with `domMax` and the `m` component to keep it near 30 kB gzipped instead of the full bundle.
- Add `install: "npm install motion"` to `meta.ts`.

## Play demo

Agreed with the user. About 8 seconds. It ends collapsed and joined, a valid resting state; the next play or a press can leave again.

1. Cursor appears below and to the right of the pill.
2. It glides to "+3 ⌄" (600 ms) and presses. The pill morphs open, avatars fly into the grid, names fade in, and `expand` plays.
3. It waits 700 ms; speaking badges are visible.
4. It glides to "Join Now" (500 ms) and presses. Your avatar pops into the grid muted, the button row becomes Mic and Leave, and `join` plays.
5. It waits 600 ms, then glides to the mic button (300 ms) and presses. The badge switches to unmuted and `tick` plays.
6. It waits 800 ms, then glides to the X (500 ms) and presses. The card morphs back into the pill, the `--ok` ring appears around the waveform badge, and `collapse` plays.
7. It waits 600 ms and glides away (500 ms).

If the demo starts while already joined, step 4 presses Leave and then Join again, so the joined state is visible each time.

## Card fit and hit areas

On the wall only the pill reacts, and the card when open. The component root must be sized to the current shape; empty stage around it falls through to the card link. When open, the card is about 300 × 300 px. It must fit inside the wall card's stage, so `size` and `people` are clamped on the wall card (or the card scales down to fit). Check with `elementFromPoint` just outside the pill's rounded ends and outside the open card's corners.

## Accessibility and edge cases

- The live speaking changes are not announced. The pill's label count updates when the speaker set changes, at most every 5 s.
- When `people` ≤ `visible`, there is no "+N" and the chevron stays as the only hint.
- When `people` changes while open, avatars enter and leave with the spring.
- Pressing Join twice quickly does nothing extra; button states are guarded.
- Interrupting the morph (closing mid-open) reverses smoothly, which framer handles.
- With `hoverOpen`, the play demo still clicks, which works since a click also opens.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the pill and the card
- [ ] Every knob visibly changes it, including the text knobs
- [ ] Avatars fly between row and grid with stagger, both ways, and interruptions reverse smoothly
- [ ] Speaking badges and pulse change speakers on the `turn` interval
- [ ] Join adds "You", Mic toggles, Leave removes; joined ring shows on the pill
- [ ] `expand`, `collapse`, `join`, `leave` and `tick` play at their moments and respect `sound` and `volume`
- [ ] Keyboard: open, focus trap, Esc closes and returns focus; reduced motion cross-fades
- [ ] Demo runs open → join → unmute → close and ends cleanly
- [ ] Copied code and Usage contain no `/lab/avatars/` URLs; gradients render without `siteProps`
- [ ] Bundle: only `motion`'s `domMax` features loaded

## Decisions log

- Avatars: the user's photo set in `public/lab/avatars/` on the site only; exported code uses random gradients so the photos are not copied. Your own avatar is always the site favicon. (User)
- Morph: framer-motion layout animations, chosen over a hand-written FLIP. (User)
- Join: adds you to the grid, with a mic toggle and Leave; a joined ring on the pill. (User)
- Speaking: live random speakers with bars badge and ring pulse. (User)
- Sound: expand/collapse whooshes, join/leave chimes, `tick` reused for the mic. (User; sounds suggested by agent)
- Play demo: open, join, unmute, close; ends collapsed and joined. (User)
- Extra knobs: grid columns, avatar overlap, show names, open on hover. (User)
- Decided by agent:
  - the default names and avatar picks;
  - the `motion` package with `LazyMotion` + `domMax`;
  - the note text is a knob;
  - pressing outside the card closes it;
  - `hoverOpen` is ignored on touch.
