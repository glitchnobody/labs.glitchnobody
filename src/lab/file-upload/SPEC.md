# File upload

- **Slug:** `file-upload` (URL `/file-upload`)
- **Number:** 45 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/33.mp4` (a file upload row: a PDF icon, "2024-my-portfolio.pdf", a red progress bar with "11.8 MB of 12.6 MB" and a percentage, turning green with "✓ Completed" and growing Change and Remove buttons). A drop zone and two draggable demo files are added. The animation effects follow `~/Downloads/inso/42.mp4` at the user's request (a liquid progress bar with a travelling bulge during "Processing", the bar's tip pinching off into a droplet that morphs into a check mark, and rolling "2 s left" text). Only the ideas are used.

## Summary

A one-file upload drop zone with two sample files to drag in. Drop one and watch it upload to Completed; drop the other and it's refused: one file only.

## Look

**Drop zone.** 280 × 92 px, radius 14, a 1.5 px dashed border in `--pane-edge` on `color-mix(in srgb, var(--fill-on) 3%, var(--fill-slab))`, centred `ph:upload-simple-bold` 18 px in `--ink-3` and "Drop a file here" in `--ink-3`, 12 px. While a file is dragged over it, the border turns solid `--pick`, the background takes a `--pick` tint and it scales to 1.02.

**Demo files** under the zone, 10 px below, side by side: two chips, 30 px tall, radius 8, on `--fill-slab` with a hairline and a soft shadow, cursor `grab`:

| Chip | Icon | Size |
| ---- | ---- | ---- |
| portfolio.pdf | `ph:file-pdf-fill` in `--danger` | 12.6 MB |
| cover.png | `ph:file-image-fill` in `--pick` | 3.4 MB |

A chip whose file is in the zone is dimmed (40%) and not draggable.

**Upload row** (replaces the zone's empty content once a file is in): padding 12; the file icon (28 px); the name in `--fill-on`, 12 px weight 600; at the right the time left and percentage (`--ink-3`, 11 px) or the drawn ✓ and "Completed" (in `--ok`, 11 px weight 500); a 4 px progress bar drawn as an SVG path (so it can turn liquid), round caps, in the uploading colour (`color`: Danger `--danger` default, the video's red; Pick; Ink) turning `--ok` on complete; under it "11.8 MB of 12.6 MB" in `--ink-4`, 11 px (shown when `details` is on, together with the percentage). When complete, two small buttons appear under the bar: "Change" (on `color-mix(in srgb, var(--fill-on) 6%, var(--fill-slab))`) and "Remove" (on `color-mix(in srgb, var(--danger) 12%, var(--fill-slab))`, text `--danger`), 11 px, radius 6. The zone's border becomes solid `--pane-edge` while it holds a file.

**Failed** (only with `fail` > 0): the bar stops and turns `--danger`, with `ph:warning-circle-fill` "Failed" and a "Retry" button.

**Limit error.** A toast-like line inside the zone's top edge, "File limit reached · one file only", in `--danger`, 11 px, for 1.6 s, and the zone shakes.

**Light and dark.** Tokens only (`--danger` is added by `hold-to-delete` if not built yet).

**Stroke on.** 1 px `--pane-edge` around the chips (the zone already has a border).

## Behaviour

- **Drag a demo chip.** Pressing a chip and moving lifts a copy of it under the pointer (pointer events, so the demo runner can drive it): it scales to 1.05, tilts 3°, and casts a larger shadow; the original stays dimmed. Releasing over the zone drops it in; releasing elsewhere flies it back (spring) to its place.
- **Real files.** Files dragged from the desktop (HTML5 drag and drop) are accepted the same way, with their real name and size. Nothing is uploaded anywhere: the progress is simulated.
- **Upload.** On drop, the zone morphs into the upload row (height animates). Progress runs at `speed` MB/s (default 5, so the PDF takes about 2.5 s) with gentle random variation; the bar and numbers update every frame. Next to the percentage, a time estimate ("2 s left") whose digits roll as it counts down (from `42.mp4`). The `charge` loop plays, its pitch rising from 0.8 to 1.3 with progress.
- **Processing** (from `42.mp4`). At 100% the status reads "Processing · making preview" for 900 ms and the bar turns liquid: it is drawn as an SVG path whose thickness swells in a soft bulge (about 2.5× the bar height) that travels from left to right along it, like a drop of ink running down a line, with the ends tapering.
- **Droplet check** (from `42.mp4`). When processing ends, the bulge reaches the bar's right end, pinches off into a round droplet (the neck thins and snaps with a small wobble), and the droplet hops up to the status spot at the right, where it stretches and morphs into a ✓ check stroke (the check is an SVG path drawn in with `stroke-dashoffset` as the droplet shrinks into its start point). The bar settles back to a straight, thicker line, and its colour cross-fades to `--ok`. "Completed" fades in next to the check, Change and Remove slide in; the loop stops and `join` plays.
- **Rolling text** (from `42.mp4`). Status text changes ("Uploading" → "Processing" → "Completed") roll vertically (old line slides up and blurs out, new line rises in).
- **Fail chance.** With `fail` set (0–50%), an upload may stop at a random point between 30 and 90%: the failed state shows, the loop stops, `collapse` plays at pitch 0.8. Retry restarts it.
- **Change.** Restarts the same file's upload from 0 (bar back to the uploading colour). `tick`.
- **Remove.** The row collapses back into the empty drop zone; the chip returns to full opacity. `collapse`.
- **Second file.** Dropping another file while one is in (uploading or completed): it is refused; the dragged chip flies back, the zone shakes, the limit error shows, `collapse` plays at pitch 0.8.

## Interaction

- **Pointer.** Drag chips into the zone; press Change, Remove, Retry. Pointer capture on the dragged chip; `touch-action: none` on chips.
- **Keyboard.** Chips are `button`s ("Add portfolio.pdf, 12.6 MB"); Enter adds the file as if dropped. The zone is also a `button` ("Choose a file") that opens the system file picker. Progress is a `progressbar` with `aria-valuenow`. A live region announces "Uploading portfolio.pdf", "Upload complete", "File limit reached".
- **Touch.** Chips drag with a finger.
- **Reduced motion.** No tilt or fly-back spring (chips snap back), no shake; the row appears without the height animation; the bar still fills.

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| speed | Upload speed (MB/s) | range | 1–20 | 5 | How long uploads take |
| fail | Fail chance (%) | range | 0–50, step 5 | 0 | Chance an upload fails part-way |
| color | Progress | select | Danger, Pick, Ink | Danger | Uploading bar colour |
| details | Size and percent | toggle | | true | The MB line and the percentage |
| sound | Sound | toggle | | true | Turns its sounds on or off |
| volume | Volume | range | 0–100 | 70 | Loudness of its sounds |

Also takes `onUpload(file)` and `onRemove`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| While uploading | `charge` | reuse (from `hold-to-delete`), looping | Soft warm hum | `play("charge", { loop: true })` at upload start, `setPitch` 0.8 → 1.3 with progress, volume 0.35; `stop(200)` on complete, fail or remove | continuous |
| Completed | `join` | reuse | Warm rising chime | volume 0.5 | none |
| Change pressed | `tick` | reuse | Tiny dry tick | volume 0.45 | none |
| Removed | `collapse` | reuse | Soft whoosh falling | volume 0.5 | none |
| Refused or failed | `collapse` | reuse | Soft whoosh falling, lower | volume 0.4, pitch 0.8 | 1 per 300 ms |

No new sounds.

## Dependencies

- None. Pointer-event dragging with a rAF spring for the fly-back; HTML5 drag events for real files; the liquid bar, droplet and check are SVG paths driven by rAF (the bar's outline is rebuilt each frame from a thickness function with a travelling Gaussian bulge; the droplet pinch is a metaball-style neck between the bar end and a circle).
- `@iconify/react` for the icons (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 11 seconds (over the usual 8, because it waits on the real upload twice); ends with the zone empty.

1. The cursor appears below the chips on the left ([0.2, 1.15], instant).
2. It glides to "portfolio.pdf" (500 ms), presses, and drags it up into the zone (700 ms): the zone highlights. It releases: the upload starts, the hum rises.
3. It waits for the upload, processing and droplet check (about 3.6 s): green bar, `join`, Change and Remove appear.
4. It glides to Change (400 ms) and presses: the upload restarts.
5. It waits for Completed again (3.6 s), glides to Remove (300 ms) and presses: the row collapses back to the empty zone; `collapse`.
6. It glides away (500 ms).

## Card fit and hit areas

The column holds the zone and the chips with a gap between them and space beside the chips. On the wall the root is `pointer-events: none` with `auto` on the zone and the chips. Check `elementFromPoint` between and beside the chips and in the gap under the zone (card link), and on the zone and a chip (component).

## Accessibility and edge cases

- Real files of 0 bytes complete instantly; very large real files are capped to a 6 s simulated upload.
- Dropping onto the zone while the dragged chip is the file already in it does nothing.
- Changing `speed` mid-upload applies immediately.

## Acceptance checklist

- [ ] Looks right in light and dark; stroke outlines the chips
- [ ] Chips drag with a lifted copy; dropping into the zone starts an upload; dropping elsewhere flies back
- [ ] Progress fills with MB, percent and rolling time left; Processing shows a travelling liquid bulge; the tip pinches into a droplet that morphs into the check; Completed, Change and Remove appear
- [ ] Change restarts; Remove empties the zone; a second file is refused with "File limit reached" and a shake
- [ ] Fail chance produces a failed state with Retry
- [ ] Every knob visibly changes it (speed, fail chance, progress colour, size and percent)
- [ ] The `charge` loop follows progress; `join`, `tick`, `collapse` play; all respect `sound` and `volume`
- [ ] Keyboard add and the file picker work; announcements; reduced motion snaps
- [ ] Demo drags the PDF in, changes, removes

## Decisions log

- Start: a drop zone with two demo files under it to drag in; one file at a time, a second drop reads "File limit reached". (User)
- Change re-uploads; Remove clears. (User)
- Sound: `charge` loop, `join`, `collapse` (plus `tick` on Change). (User)
- Play demo: drag the PDF in, wait, Change, Remove. (User)
- Animation effects from `42.mp4`: liquid processing bar, droplet-to-check, rolling status text and time left. (User)
- Knobs: upload speed, fail chance, progress colour, size and percent. (User)
- Decided by agent:
  - the slug `file-upload` and the tag Drag;
  - the demo files portfolio.pdf (12.6 MB) and cover.png (3.4 MB);
  - chips drag with pointer events (so the demo runner can drive them), real files with HTML5 drag and drop;
  - real files are accepted too, with a simulated upload;
  - the limit error copy and shake.
