# Audio clip

- **Slug:** `audio-clip` (URL `/audio-clip`)
- **Number:** 34 / 60
- **Tag:** Drag
- **Status:** spec
- **Design reference:** `~/Downloads/inso/22.mp4` (an audio clip card: play/pause, a file name "Mom.mp3", seconds left, a waveform with the played part dark and the rest light, and a tall pin-shaped playhead you drag to scrub). Only the idea is used.

## Summary

A playable audio clip with a waveform you can scrub. Press play, then grab the playhead and drag: the rain follows your hand, thunder and all.

## Look

**Card.** About 260 × 64 px, radius 12, on `color-mix(in srgb, var(--fill-on) 6%, var(--fill-slab))` with a 1 px `--pane-edge` border (one surface).

- **Top row** (24 px): a play/pause button (`ph:play-fill` / `ph:pause-fill`, 12 px, `--fill-on`), the file name "Rain.mp3" in `--fill-on`, 12 px weight 500, and at the right the time (`time`: Left "9s", Elapsed "0:03", Both "0:03 / 0:12") in `--ink-3`, 12 px, tabular figures, with a speed chip before it ("1×", 11 px, `--ink-3`, a small rounded chip that cycles 1× → 1.5× → 2×).
- **Waveform** (32 px): on `--fill-slab`, radius 8, inset 4 px; `bars` vertical bars (default 64), `barWidth` px wide (default 2) with gaps filling the width, rounded, heights from the real audio's peak levels. Played bars in the `accent` colour (Ink `--fill-on` default, Pick, Ok); unplayed bars in `color-mix(in srgb, var(--fill-on) 25%, transparent)`.

**Playhead** (`handle`):

| Handle | Look |
| ------ | ---- |
| Pin (default, the video) | a 2 px `--fill-on` line from 10 px above the card to 6 px below it, topped by a 12 × 14 px shield-shaped handle in `--fill-on` with a soft shadow |
| Line | the 2 px line only, within the waveform |
| Dot | a 10 px `--fill-on` dot on the waveform's centre line |

**Light and dark.** Tokens only.

**Stroke on.** The card already has a hairline; harmless.

## Behaviour

- **Audio.** The component plays its own clip with Web Audio (this is content, not a UI sound): it fetches `src` (default `/sounds/rain-clip.mp3`), decodes it once, computes `bars` peak levels from the decoded buffer for the waveform, and plays it through a gain node. Until it loads, the waveform shows flat placeholder bars.
- **Play / pause.** Plays from the playhead; the playhead moves continuously and bars turn the accent as it passes. At the end it stops, the button returns to play and the playhead returns to the start after 600 ms.
- **Speed.** The chip cycles 1×, 1.5×, 2× (`playbackRate`; the time display accounts for it).
- **Scrub.** Dragging the playhead (or anywhere on the waveform: pressing jumps there and drags) moves the position. While dragging, short grains of the audio (60 ms, crossfaded) play at the playhead position whenever it moves, so the sound follows the hand; holding still is silent. On release, playback resumes if it was playing, else it stays paused at the new position.
- **Click to seek.** A press-and-release on the waveform without dragging seeks there.
- **Bars react.** While playing, the bars within about 6 bars of the playhead bounce slightly (up to +20% height) with the live output level (an `AnalyserNode`), easing back as the playhead moves on.
- **Volume and sound.** `volume` sets the clip's gain; `sound` off mutes the clip (the waveform and scrubbing still work). It also respects the site mute (`<html data-muted>`).

## Interaction

- **Pointer.** Press play/pause and the speed chip; drag the playhead or the waveform. Pointer capture; `touch-action: none` and `user-select: none` on the waveform.
- **Keyboard.** Play/pause is a `button` ("Play Rain.mp3" / "Pause"); Space toggles it when the card is focused. The waveform is a `slider` ("Position", `aria-valuetext` "3 of 12 seconds"); Left/Right ±1 s, Home/End. The speed chip is a `button` ("Playback speed 1×").
- **Touch.** Same as pointer.
- **Reduced motion.** No bar bounce; the playhead still moves (it shows progress).

## Configuration (knobs)

| Prop | Label | Type | Range / options | Default | What it changes |
| ---- | ----- | ---- | --------------- | ------- | --------------- |
| bars | Bars | range | 24–120 | 64 | Number of waveform bars |
| barWidth | Bar width (px) | range | 1–4, step 0.5 | 2 | Bar thickness |
| handle | Playhead | select | Pin, Line, Dot | Pin | Playhead style |
| time | Time | select | Left, Elapsed, Both | Left | Time display |
| accent | Played | select | Ink, Pick, Ok | Ink | Played bars colour |
| sound | Sound | toggle | | true | Mutes or unmutes the clip |
| volume | Volume | range | 0–100 | 70 | Clip loudness |

Also takes `src`, `name` (default "Rain.mp3") and `onEnded`.

## Sound

| Moment | Sound name | Reuse or new | What it sounds like | Volume / pitch variation | Rate limit |
| ------ | ---------- | ------------ | ------------------- | ------------------------ | ---------- |
| The clip plays and scrubs | `rain-clip` | new (content clip) | Soft steady rain on a window with one distant thunder roll | volume from `volume`; `playbackRate` from the speed chip | grains while scrubbing: one per 40 ms of movement |

No UI sounds (the user's choice): the clip is the sound.

New sound:

- **Name:** `rain-clip`
- **ElevenLabs prompt:** "Soft steady rain falling on a window pane, close and calm, with one low distant thunder roll about seven seconds in, then the rain continues, natural ambience, no music"
- **duration_seconds:** 12 · **prompt_influence:** 0.5 · **loop:** false
- **Processing:** not a UI sound, so no trimming to a short length: keep 12 s, fade in 80 ms and out 400 ms, `loudnorm` to the same target as the library, mono mp3 44.1 kHz at about 96 kbps, saved as `public/sounds/rain-clip.mp3`. List it in `sounds` in `meta.ts` so the code view's Sound section offers it for download.

**Exception to the sound rule:** this component plays its clip with its own small Web Audio player (decode, play, grains, analyser) rather than through `onSound`, because it needs seeking, scrubbing and level analysis. It still respects the site mute.

## Dependencies

- None. Web Audio (`AudioContext`, `AudioBufferSourceNode`, `GainNode`, `AnalyserNode`), created on the first press (browsers require a gesture).
- `@iconify/react` for play and pause (house rule).
- Set `install: "npm install @iconify/react"`.

## Play demo

Agreed with the user. About 6 seconds; ends paused.

1. The cursor appears below the card ([0.5, 1.6], instant).
2. It glides to play (500 ms) and presses: the rain plays, the playhead moves.
3. It waits 800 ms, glides to the playhead's handle (400 ms) and presses.
4. It drags right to about 65% (thunder) (800 ms): the audio scrubs along. Then back left to 45% (500 ms). It releases: playback resumes.
5. It waits 800 ms, glides to pause (400 ms) and presses.
6. It glides away (500 ms).

## Card fit and hit areas

The Pin handle extends above the card. On the wall the root is `pointer-events: none` with `auto` on the card and the handle. Check `elementFromPoint` just outside the card's corners and beside the handle above the card (card link), and on the waveform, handle and buttons (component).

## Accessibility and edge cases

- Autoplay never happens; audio starts only on a press.
- Leaving the card on the wall while playing keeps playing; opening another component's modal or hiding the tab pauses it.
- Two clips on a page: starting one pauses any other (a module-level "current player").
- Decode failure: the waveform stays flat and the play button is disabled with a tooltip "Couldn't load audio".

## Acceptance checklist

- [ ] Looks right in light and dark; the pin handle overflows cleanly
- [ ] Play, pause, end and speed work; the time display matches the speed
- [ ] Dragging scrubs with audible grains; click-to-seek works; playback resumes after a drag if it was playing
- [ ] The waveform matches the real clip (thunder visible near 7 s); bars bounce near the playhead
- [ ] Every knob visibly changes it (bars, bar width, playhead, time, played colour); `sound` mutes and `volume` sets the clip loudness
- [ ] Site mute silences it; keyboard slider and Space work
- [ ] Demo plays, scrubs forward and back, pauses

## Decisions log

- Audio: a generated clip, rain on a window with a thunder roll. (User)
- Scrubbing: dragging scrubs with audio, click to seek, bars react to playback, a speed button. (User)
- UI sounds: none; the clip is the sound. (User)
- Play demo: play, scrub forward and back, pause. (User)
- Knobs: bars and bar width, playhead style, time display, played colour. (User)
- Decided by agent:
  - the slug `audio-clip` and the tag Drag;
  - the file name "Rain.mp3" and a 12 s clip;
  - the component has its own Web Audio player (an exception to the `onSound` rule) and respects the site mute;
  - 60 ms grains for scrubbing;
  - only one clip plays at a time.
