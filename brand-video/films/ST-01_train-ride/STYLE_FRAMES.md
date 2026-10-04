# ST-01 · Style frames (pipeline step 5) · **approved by the owner, 2026-10-04**

One still per scene, rendered by the real film code at its moment in the song (9:16, 1080×1920,
12 motion-blur sub-frames). Frames: `frames/` (contact sheets: `contact-sheet-a.jpg`, `-b.jpg`).
Re-render any frame: `cd app && CHROME=<chromium> bun scripts/render.ts stills --samples 12 --t <seconds>`.

## Owner rules applied (2026-10-04)

- **Level 6 minimum.**
- **No people on screen** (this film's choice; the series rule allows blank humans or simple pixel art). The phone is the protagonist (on its tripod, propped at the train window,
  the stream's own screen); scenes explain the situation through objects, the stream UI and the chat.
  The companion appears only as a simple mascot (a warm spark), never as a character.
- **Only facts from the post.** The two real chat lines are used word for word; other chat activity is
  neutral reactions only (`<3`, `o/`, `:)`), no invented messages. Lyrics on screen are the written lyric.

## The frames (v4, after QA rounds 1–7, 2026-10-04)

The first set was approved by the owner; the owner then flagged lazy detail (the castle). These are
the rebuilt frames after the QA gate (0 flat objects, 0 text in platform UI zones) and seven rounds
of independent review (final verdict: level 6, see `QA.md`). Times are seconds into the song.

| # | Time | Look | What the viewer understands |
|---|---|---|---|
| 01 | 1.2 | Pixel interior | The game-streaming desk (an original game on the monitor), `first real IRL`, the hook sticker |
| 02 | 4.0 | Lit pixel art, blue hour | The Christmas tour: market, castle, carousel; the phone on its tripod |
| 03 | 10.5 | **Neon line** | `3 watching`; neutral reactions in chat |
| 04a/b | 13.5 / 16.5 | Pixel through the **stream UI** | The train is in, "End stream?", then the real line `wait, I've never been on a train`; a push in |
| 05 | 18.9 | Pixel interior | The carriage at the platform, the phone propped at the window |
| 06 | 20.8 | **Phone-screen macro** | `can you keep it on?` pops in (received, no cursor) |
| 07a | 23.5 | Pixel POV, parallax | Through the city on a viaduct: roofs, chimneys, lit windows below, towers behind |
| 07b | 28.0 | Pixel POV, frost | Open farmland, frost growing on the glass: "Your first train, it moved so fast" |
| 08a | 31.5 | Pixel close-up | The phone at the window: signal bars to zero, LIVE greys out, `reconnecting…` |
| 08b | 33.3 | **Datamosh** | On "gone" the frozen picture smears apart: `signal lost` |
| 09a/b | 34.5 / 36.8 | Macro, warm | The chat log after the drop, then `thanks for being so chill. amazing stream` |
| 10a | 38.6 | **Newspaper halftone** | `3 VIEWERS. ENOUGH.` (copy from the post's facts only) |
| 10b/c | 39.7 / 40.8 | Pixel globe at night | From the train's lights out to the whole Earth; an arc to the other side of the world |
| 11a/b | 43.0 / 47.3 | Lit pixel art, night, closer | Back in town: the thank-you remembered |
| 12a/b | 51.0 / 54.0 | Lit pixel art, morning | Fresh snow, the phone back on its tripod, `LIVE · IRL`, `They kept streaming IRL.`, the credit |

## Level 6 checklist (TIER_LIST.md)

| Item | Where |
|---|---|
| Two dressed sets | The old town (houses, castle, huts, carousel, string lights) and the train carriage; plus the station, the desk |
| Lit pixel art: soft shadows, bounce light | Every pixel lit by point lights with soft shadows and bounce from every glowing pixel |
| Haze and volumetric light | Haze lit by the bulbs and windows; glow and halation in post |
| Physical sky at dusk | Single-scattering sky (blue hour, the next morning, the train's night) with lit clouds |
| Window reflections and speed | Lamp reflection on the train glass; parallax layers + real motion blur |
| Lit particles | Snow lit by the lights around it; carousel bulbs chasing |
| 60 fps adaptive motion blur | Engine sub-frame sampling (stills: 12 sub-frames) |
| One hero shot | Frame 7: through the window the city falls away into farmland |

## Assets (step 6) — what is built and what is left

| Asset | Status |
|---|---|
| Lit pixel-art renderer (G-buffer, sky, lights, bounce, haze, reflections, snow) | built (`app/src/kit/pixel.ts`) |
| Sets: town (3 times of day), station, carriage + moving world, desk | built (`sets/`) |
| Materials: neon line, glitch, newspaper halftone, phone-screen macro, pixel globe | built |
| Stream UI (our own generic design), chat, lyric subtitles, captions | built (`app/src/kit/overlay.ts`) |
| Transitions between scenes (material wipes on the beat) | built (`engine.ts`) |
| QA gate (G-buffer detail stats, safe-zone text check, zoom sheets) | built (`tools/qa_frames.py`, `docs/QA.md`) |

## Open points for you

1. The permission message to the Reddit author (draft in the script); `retold with permission` goes into the credit only after a yes.
2. Defaults taken on the owner's "go" (2026-10-04), each easy to change: "Reddit" stays in the
   credit as a source credit (the no-brand rule covers our own brand); `can you keep it on?` stays as
   the viewer's message (approved script v0.9); the front-page body copy is set soft and grey so it
   reads as page texture under the platform caption.

## Change after approval (owner, 2026-10-04)

The spliced intro is gone: the song starts at once and frames 1a + 1b merge into one opening shot
(the desk), with **“Based on a true story” popping on as a sticker** over it (0.05–2.75 s, carried
across the first cut into the town). Frame 9 lost its invented `· reconnected ·` line. Timings:
script v0.8.

## Change: no brand (owner, 2026-10-04)

A Story is not a brand video: frame 13 (end card) and the companion spark in frame 11 are removed.
The film ends on frame 12 with `They kept streaming IRL.`, the credit line and a fade with the song
(54.8 s). Brand placeholders (tagline, colours, sonic logo) no longer apply to this film.
