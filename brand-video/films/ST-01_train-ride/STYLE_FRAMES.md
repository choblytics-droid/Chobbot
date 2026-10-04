# ST-01 · Style frames (pipeline step 5) · **approved by the owner, 2026-10-04**

One still per scene, rendered by the real film code at its moment in the song (9:16, 1080×1920,
12 motion-blur sub-frames). Frames: `frames/` (contact sheets: `contact-sheet-a.jpg`, `-b.jpg`).
Re-render any frame: `cd app && CHROME=<chromium> bun scripts/render.ts stills --samples 12 --t <seconds>`.

## Owner rules applied (2026-10-04)

- **Level 6 minimum.**
- **No people on screen.** The phone is the protagonist (on its tripod, propped at the train window,
  the stream's own screen); scenes explain the situation through objects, the stream UI and the chat.
  The companion appears only as a simple mascot (a warm spark), never as a character.
- **Only facts from the post.** The two real chat lines are used word for word; other chat activity is
  neutral reactions only (`<3`, `o/`, `:)`), no invented messages. Lyrics on screen are the written lyric.

## The frames

| # | Time | Look | What the viewer understands |
|---|---|---|---|
| 1a | 0:00 | Lit pixel art, blue hour | "Based on a true story" over the town at Christmas |
| 1b | 0:03 | Pixel interior | The game-streaming desk: monitor goes dark, door opens, the phone wakes up LIVE (`first real IRL` → `LIVE · IRL`) |
| 2 | 0:04 | Lit pixel art | The tour: market, castle, carousel; the phone on its tripod, its screen showing the carousel |
| 3 | 0:12 | **Neon line** (same composition) | `1 → 3 watching`; one regular's name keeps lighting up in chat |
| 4 | 0:16 | Pixel art seen **through the stream UI** | The train is in; "End stream?" comes up; then `wait, I've never been on a train` |
| 5 | 0:21 | Pixel interior + moving world | The train pulls out past the platform lamps; the phone propped at the window |
| 6 | 0:23 | **Macro of the phone screen** (LCD subpixels, shallow focus, bokeh) | `can you keep it on?` typed on the vocal |
| 7 | 0:25 | Pixel, parallax + motion blur (hero shot) | The city falls away into snowy farmland, fast; signal bars dropping |
| 8 | 0:36 | **Glitch** → black | On "gone": pixelate, tear, freeze `reconnecting…`, one beat of black, `signal lost` |
| 9 | 0:37 | Macro of the screen, warm | `· reconnected ·` then `thanks for being so chill. amazing stream` |
| 10a | 0:41 | **Newspaper halftone** | Front page slams in on the downbeat: `3 VIEWERS. ENOUGH.` |
| 10b | 0:43 | Pixel globe at night | Pull back over the globe; a line of light from the train to one lit window on the other side of the world |
| 11 | 0:45 | Lit pixel art, warm, handheld drift | Back in town like a visitor; the real message remembered, the companion spark beside it for ~1 s |
| 12 | 0:53 | Lit pixel art, morning sun | A new day, `LIVE · IRL`; `They kept streaming IRL.` |
| 13 | 0:58 | Brand end card | Spark, `Chobbot`, `never stream alone` (placeholder), the credit line |

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
| Companion mascot (spark) | built, placeholder until brand tokens land |
| Brand: colours, end-card wordmark, tagline, sonic logo | **placeholders**: waiting for the design |
| Transitions between scenes (material wipes on the beat) | to build in the animatic (step 7) |

## Open points for you

1. The tagline (`never stream alone` is a placeholder) and brand colours.
2. The permission message to the Reddit author (draft in the script).
