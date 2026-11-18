# Components

The master list and to-do list for the labs: 60 components, each specified in `src/lab/<slug>/SPEC.md` before it is built. See `AGENTS.md` for the workflow.

Status: `spec` (SPEC.md written) → `built` (component, meta.ts and sounds done and checked).

## Components (60 / 60)

| # | Slug | Name | Tag | Sounds | Dependencies | Status |
| - | ---- | ---- | --- | ------ | ------------ | ------ |
| 1 | `staggered-countdown` | Staggered countdown | Press | tick | none | built |
| 2 | `voice-chat` | Voice chat | Press | expand, collapse, join, leave, tick | motion (domMax) | built |
| 3 | `set-status` | Set status | Select | expand, collapse, tick, pop | none | built |
| 4 | `event-stack` | Event stack | Swipe | expand, collapse, tick, swipe | motion (domMax), @iconify/react | built |
| 5 | `hold-to-delete` | Hold to delete | Press | charge, crunch, swipe, pop, collapse | @iconify/react | built |
| 6 | `radar` | Radar | Press | ping, pop, tick | none | built |
| 7 | `view-switcher` | View switcher | Select | tick, shuffle, pop, collapse | motion (domMax), @iconify/react | built |
| 8 | `multiline-copy` | Multi-line copy | Press | tick | @iconify/react | built |
| 9 | `meeting-picker` | Meeting picker | Select | tick, swipe, join, collapse | @iconify/react | built |
| 10 | `profile-card` | Profile card | Press | pop, collapse, tick | @iconify/react | built |
| 11 | `photo-folder` | Photo folder | Hover | slide | motion (domAnimation) | built |
| 12 | `jelly-slider` | Jelly slider | Slide | tick, jelly | none | built |
| 13 | `revenue-card` | Revenue card | Hover | tick | @iconify/react | built |
| 14 | `heat-text` | Heat text | Hover | heat | none | built |
| 15 | `reader-toolbar` | Reader toolbar | Press | expand, collapse, tick | @iconify/react | built |
| 16 | `position-inspector` | Position inspector | Drag | tick, expand, collapse | @iconify/react | built |
| 17 | `radial-toolkit` | Radial toolkit | Drag | expand, tick, pop, collapse | @iconify/react | built |
| 18 | `stat-stack` | Stat stack | Hover | tick, swipe | none | built |
| 19 | `activity-heatmap` | Activity heatmap | Hover | blip | none | built |
| 20 | `storage-donut` | Storage donut | Hover | blip | none | built |
| 21 | `value-slider` | Value slider | Slide | tick | none | built |
| 22 | `color-slider` | Color slider | Slide | tick, expand, collapse | none | built |
| 23 | `white-balance` | White balance | Slide | tick, ping | @iconify/react | built |
| 24 | `color-palette` | Color palette | Press | shuffle, tick, pop | @iconify/react | built |
| 25 | `aspect-ratio` | Aspect ratio | Select | tick, expand, collapse | @iconify/react | built |
| 26 | `date-scrubber` | Date scrubber | Drag | tick, swipe | none | built |
| 27 | `warp-carousel` | Warp carousel | Drag | whoosh, tick | @iconify/react | built |
| 28 | `create-menu` | Create menu | Press | expand, collapse, tick, pop | motion (domMax), @iconify/react | built |
| 29 | `overview-bars` | Overview bars | Hover | tick, expand, collapse, shuffle | @iconify/react | built |
| 30 | `tool-dock` | Tool dock | Hover | tick, pop | @iconify/react | built |
| 31 | `liquid-word` | Liquid word | Hover | heat | none | built |
| 32 | `dot-globe` | Dot globe | Drag | whoosh | none | built |
| 33 | `secret-field` | Secret field | Press | tick, pop | @iconify/react | built |
| 34 | `audio-clip` | Audio clip | Drag | rain-clip | @iconify/react | built |
| 35 | `qr-share` | QR share | Press | expand, collapse | qrcode-generator, @iconify/react | built |
| 36 | `invites-inbox` | Invites inbox | Press | expand, collapse, join, swipe, tick | @iconify/react | built |
| 37 | `coupon-copy` | Coupon copy | Press | pop, tick | @iconify/react | built |
| 38 | `notify-me` | Notify me | Type | expand, collapse, tick, join | @iconify/react | built |
| 39 | `update-button` | Update button | Loading | tick | @iconify/react | built |
| 40 | `desktop-drop` | Desktop drop | Drag | tick, slide, pop | @iconify/react | built |
| 41 | `pricing-toggle` | Pricing toggle | Select | tick, pop | @iconify/react | built |
| 42 | `summary-resize` | Summary resize | Drag | tick | none | built |
| 43 | `search-expand` | Search expand | Type | expand, collapse, tick, shuffle, pop | @iconify/react | built |
| 44 | `halftone-field` | Halftone field | Hover | whoosh, jelly | none | built |
| 45 | `file-upload` | File upload | Drag | charge, join, tick, collapse | @iconify/react | built |
| 46 | `ascii-bloom` | ASCII bloom | Drag | rustle | none | built |
| 47 | `wallet-topup` | Wallet top-up | Press | expand, collapse, tick, coins | motion (domMax), @iconify/react | built |
| 48 | `share-panel` | Share panel | Press | tick, expand, collapse | @iconify/react | built |
| 49 | `liquid-toggle` | Liquid toggle | Press | blip, jelly | none | built |
| 50 | `goo-button` | Goo button | Hover | jelly, whoosh | @iconify/react | built |
| 51 | `duration-chip` | Duration chip | Type | expand, tick, collapse | motion (domMax), @iconify/react | built |
| 52 | `tag-picker` | Tag picker | Select | pop, swipe, tick, collapse | motion (domMax), @iconify/react | built |
| 53 | `split-slider` | Split slider | Slide | tick, pop | none | built |
| 54 | `otp-input` | OTP input | Type | tick, error, join, pop | @iconify/react | built |
| 55 | `card-stack` | Card stack | Drag | swipe, slide, jelly | motion (domMax) | built |
| 56 | `gooey-compare` | Gooey compare | Drag | tick, jelly | @iconify/react | built |
| 57 | `dropdown` | Dropdown | Select | expand, collapse, tick | @iconify/react | built |
| 58 | `split-button` | Split button | Press | tick, pop, expand, collapse | @iconify/react | built |
| 59 | `input-box` | Input box | Type | tick, pop, error, swipe | @iconify/react | built |
| 60 | `toast-stack` | Toast stack | Hover | expand, collapse, swipe, whoosh, pop | @iconify/react | built |

## Sound library

Every sound the site uses. Reuse a sound from here before generating a new one. Files live at `public/sounds/<name>.mp3`.

Status: `planned` (prompt written in a spec) → `generated` (file exists, trimmed and levelled). All UI sounds except `rain-clip` were regenerated on 2026-11-18 (second pass) in a subtle style modelled on bencho.dev/sounds: very soft, quiet, pure and muted, low-passed at 3.2 kHz (loops 2.2 kHz) and levelled to a −30 dB mean (loops −32) with peaks under −12 dB. The prompts below are the current ones (they replace the prompts in the specs); each is followed by ", subtle and delicate, gentle, quiet, close, clean, dry, no reverb". `settle` was removed.

| Name | What it sounds like | ElevenLabs prompt | Length | First used by | Status |
| ---- | ------------------- | ----------------- | ------ | ------------- | ------ |
| `tick` | Tiny dry mechanical tick; the general-purpose step sound | "A tiny very soft muted click, like a felt-tipped tap on a wooden desk, minimal" | ~60 ms | staggered-countdown | generated |
| `expand` | Soft airy whoosh rising; something opening | "A very soft airy rising swish with a faint warm tone, UI transition" | ~280 ms | voice-chat | generated |
| `collapse` | Soft airy whoosh falling; something closing | "A very soft airy falling swish with a faint warm tone, UI transition" | ~260 ms | voice-chat | generated |
| `join` | Warm two-note rising chime | "Two soft pure warm notes rising a fifth, sine-like chime, short fade" | ~550 ms | voice-chat | generated |
| `leave` | Warm two-note falling chime | "Two soft pure warm notes falling a fifth, sine-like chime, short fade" | ~550 ms | voice-chat | generated |
| `pop` | Bubbly cheerful pop; something landing or being placed | "A very soft low bubble pop, muted and round" | ~160 ms | set-status | generated |
| `swipe` | Quick paper-like swish; something dismissed or flicked away | "A very soft short swish of a card sliding sideways, muted" | ~220 ms | event-stack | generated |
| `charge` | Soft warm sustained hum, loops; pitch and volume follow a hold or progress | "A very soft smooth low hum, pure warm tone, steady, seamless loop" (loop: true) | 2 s loop | hold-to-delete | generated |
| `crunch` | Paper crumple into a bin with a soft thud; deleting | "A soft muted paper crumple, short" | ~350 ms | hold-to-delete | generated |
| `ping` | Soft sonar ping with a short shimmer; detection, something found | "A single soft pure warm bell-like tone, round, short fade" | ~550 ms | radar | generated |
| `shuffle` | Soft riffle of thin cards or prints; things rearranging | "A very soft riffle of a few cards, muted" | ~400 ms | view-switcher | generated |
| `slide` | Soft paper slide; photos or sheets pulled out of a sleeve | "A very soft smooth slide of paper on felt, muted" | ~300 ms | photo-folder | generated |
| `jelly` | Soft wobbly boing; something squishy settling | "A very soft low rubbery wobble tone, round and muted" | ~400 ms | jelly-slider | generated |
| `heat` | Soft warm sizzle, loops; volume follows the amount of heat | "A very soft warm low rumble, smooth steady texture, seamless loop" (loop: true) | 2 s loop | heat-text | generated |
| `blip` | Soft marimba note; pitched per item (pentatonic) | "A single soft pure sine-like note, warm and round, short gentle fade" | ~250 ms | activity-heatmap | generated |
| `whoosh` | Airy whoosh; something large sweeping past | "A very soft airy whoosh passing by, muted" | ~300 ms | warp-carousel | generated |
| `rain-clip` | 12 s content clip: soft rain on a window with one distant thunder roll (played and scrubbed, not a UI sound) | "Soft steady rain falling on a window pane, close and calm, with one low distant thunder roll about seven seconds in, then the rain continues, natural ambience, no music" | 12 s | audio-clip | generated |
| `rustle` | Soft petal rustle, loops; volume follows drag speed | "A very soft rustle of delicate petals, papery movement, seamless loop" (loop: true) | 2 s loop | ascii-bloom | generated |
| `coins` | Soft coin jingle; money added | "A very soft delicate jingle of two tiny coins, muted" | ~450 ms | wallet-topup | generated |
| `error` | Soft low double buzz; wrong input, try again | "A soft low two-note falling tone, pure and muted, not harsh" | ~320 ms | otp-input | generated |

## Shared assets

- **Filler images:** `public/lab/demoimages/1.png` to `11.png`, 880 × 1168 portrait paintings (flower meadows with a road or river and an animal or car; 1 car, 2 deer, 3 fox, 4 swan, 5 white horse, 6 giraffe, 7 hare, 8 wolf, 9 swan, 10 horse, 11 flamingos), copied as-is from the user's folder. For every non-person image on the site. Site only: exported code uses random gradients (see AGENTS.md, "Filler images"). They are about 2 MB each (21 MB total); converting them to WebP (about 100–200 kB each) is recommended before the build phase, but has not been done.
- **Icons:** Iconify via `@iconify/react`, Phosphor set (`ph:`), loaded on demand. Every icon component uses it and lists `@iconify/react` in `install` (see AGENTS.md, "Icons").

- **Avatars:** `public/lab/avatars/01.webp` to `53.webp`, 160 px square portrait photos cut from the sheet the user supplied, for every person image on the site. `you.svg` (the site favicon) is always the user's own avatar. Site only: exported code uses random gradients (see AGENTS.md, "People images").
