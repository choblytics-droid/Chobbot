# ST-01 · “The train ride” · script v0.3 (first film, level 6, 52 s)

**Status:** draft for review. Nothing is built until you approve this script and the audio exists.

## Brief

| Field | |
|---|---|
| Film id | `ST-01` (first test of the whole chain: story → script → music → video) |
| Series | 1 · Streamer Stories (music video) |
| Source | Reddit r/Twitch, “Did an IRL, and a viewer made me realise why it’s worthwhile” (Story Fisher, quality 9, wholesome). <https://www.reddit.com/r/Twitch/comments/1pujw7y/> |
| Rights | Retold anonymised: no username, no channel, no real place names. Ask the author before publishing (better: they may share it). |
| Facts we use (only these) | A streamer who usually streams games from their desk did an IRL stream around their city at Christmas. It peaked at 3 viewers. One viewer kept watching during a train ride until the connection dropped. Afterwards the viewer thanked them and called it amazing. The streamer was close to tears and saw why streaming is worth it. |
| Persona / pains | Starter · pains 8 (loneliness), 15 (stuck small) |
| The one message | Three viewers can be enough. Someone is there. |
| Length / format | 52 s (minimum 45 s) · 9:16 first, 16:9 cut |
| Audio | A short song, played as background. **Nobody sings on screen.** Lyrics appear as on-screen text and chat messages |
| Quality level | **6 (the minimum for every film)**: two dressed sets (the street with Christmas lights, the train carriage); lit pixel art with soft shadows and bounce light; haze and volumetric light around lamps and lights; a physical night sky; rain on the window that refracts the city; lit particles (snow, rain); 60 fps adaptive motion blur; one hero shot (beat 3: the city streaking past the rainy train window, then the signal loss) |
| Style deck | Home: **pixel art** · switches: **neon line**, **halftone** |
| Characters | The streamer as a small pixel sprite from behind (hood, phone in hand). The chat as the second character. The companion only as a 1-second cameo at the end |

## Beat sheet (120 BPM · 1 bar = 2 s · 26 bars = 52 s)

| # | Time | Music | Picture | On-screen text | Lyric (background) | Style |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:04 | Intro, 2 bars | Pixel city at night, Christmas lights in haze; the pixel streamer steps out of a door, phone up. A tiny `LIVE` badge blinks on | `LIVE · IRL` | (glockenspiel, train rhythm) | Pixel |
| 2 | 0:04–0:08 | Verse, bars 1–2 | Snow in the lamp light; the streamer walks past lit windows | lyric as text | “Took the stream outside on Christmas night / Phone in my cold hand, city lights” | Pixel |
| 3 | 0:08–0:12 | Verse, bars 3–4 | Close on the phone: the viewer counter climbs `1 … 2 … 3`; the streamer talks to the street | `3 watching` | “Three people watching, that’s my crowd / Talking to the street out loud” | Pixel → **neon line** on the downbeat |
| 4 | 0:12–0:20 | Verse, bars 5–8 | **Hero shot:** the evening train; inside the carriage, rain streaks the window and the city slides past, refracted in the drops; one chat line ticks on the phone | lyric as text | “Evening train, the windows run / Rain on the glass, still on, still on” | Neon line → pixel |
| 5 | 0:20–0:22 | Pre-chorus, 1 bar | The signal bars fall one by one; the picture pixelates | `signal fading` | “Signal fading” | Pixel → glitch |
| 6 | 0:22–0:24 | **Break**, 1 bar | Freeze, `reconnecting…`, then black and silence | `signal lost` | (silence) | Black |
| 7 | 0:24–0:32 | Chorus, bars 1–4 | The chat appears big, typed word by word, as the hero of the frame | `that was amazing. thank you` | “You stayed till the signal died / Said it was amazing, on a train at night” | Chat (pixel font, lit) |
| 8 | 0:32–0:40 | Chorus, bars 5–8 | Front-page burst on the beat; then back on the platform, the streamer stops and reads the phone | `3 VIEWERS. ENOUGH.` | “Three is not nothing, three is enough / Somebody was there, that’s what it was” | **Halftone** → pixel |
| 9 | 0:40–0:48 | Outro, 4 bars | The city turns warm; in the phone’s chat a small warm spark appears next to the message (companion cameo); pull back over the lit windows | `someone was there` | “That’s why I do this / That’s why I do this” | Pixel (warm grade) |
| 10 | 0:48–0:52 | End, 2 bars | End card | `Chobbot · never stream alone` (placeholder tagline) | (last chord + sonic logo in the edit) | Brand end card |

Style switches land on downbeats: pixel → neon line (0:08) → pixel (0:20) → glitch/black (0:20–0:24)
→ chat (0:24) → halftone (0:32) → pixel warm (0:40) → end card (0:48).

## Song (Suno, Custom mode, v5.5, Duration 0:52–1:00)

**Style of Music**

```
warm lo-fi indie pop, gentle and hopeful, glockenspiel and felt piano, soft synth pads, brushed train-rhythm percussion, soft clear vocal up front, intimate dry production, 120 BPM
```

**Exclude**

```
heavy reverb, autotune, rap verses, spoken word intro, long instrumental intro
```

**Lyrics**

```
[Intro: glockenspiel, train rhythm]

[Verse: soft vocal]
Took the stream outside on Christmas night
Phone in my cold hand, city lights
Three people watching, that's my crowd
Talking to the street out loud
Evening train, the windows run
Rain on the glass, still on, still on

[Pre-Chorus: almost spoken]
Signal fading

[Break]

[Chorus: warm, fuller]
You stayed till the signal died
Said it was amazing, on a train at night
Three is not nothing, three is enough
Somebody was there, that's what it was

[Outro: soft]
That's why I do this
That's why I do this

[End]
```

Pick the take by the checklist in `docs/SUNO_GUIDE.md` (clear vocal, steady tempo, the break before
the chorus, every line sung as written, clean ending, at least 45 s). Send the WAV (and the vocal
stem if available).

## What the test proves

1. The Story Fisher → script → song chain works on a real story.
2. Word-synced lyrics on screen with no singer.
3. Style switches on the beat (pixel → neon → halftone).
4. The real cost of one level-6 film. Note your usage bar before and after: this is the
   calibration for the Effort Levels tab.

## Open questions for you

- The tagline on the end card (`never stream alone` is a placeholder).
- Brand colours: until the design lands, the warm accent is a placeholder amber.
