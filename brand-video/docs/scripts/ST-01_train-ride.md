# ST-01 · “The train ride” · script v0.7 (approved 2026-10-03; v0.4 fact fixes, v0.5 full picture, v0.6 catchier song, v0.7 timed to the real song; ≈61 s)

**Status:** song done (2026-10-04), master audio `song_with_intro.wav` approved; beat sheet retimed to it (v0.7). Next: style frames. Earlier: v0.4 corrects lyrics and pictures to the full post text (no rain, no phone, no night; added the real details: the viewer's first train, city to farmland, the other side of the world). Next: the song.

## Brief

| Field | |
|---|---|
| Film id | `ST-01` (first test of the whole chain: story → script → music → video) |
| Series | 1 · Streamer Stories (music video) |
| Source | Reddit r/Twitch, “Did an IRL, and a viewer made me realise why it’s worthwhile” (Story Fisher, quality 9, wholesome). <https://www.reddit.com/r/Twitch/comments/1pujw7y/> |
| Rights | Retold anonymised: no username, no channel, no real place names. Ask the author before publishing (better: they may share it). |
| Full picture (Story Context: post + 38 comments + the poster's later posts) | **Arc: complete, and it continued.** Start: after a year of desk-bound game streaming, test streams walking to work and back, then a promised “proper” IRL. End: tearful, “it’s really made my Christmas”, eager to do more IRL. Later posts (Jan and May 2026) show they kept streaming IRL around their city. The poster added in comments that it felt “like when you show a visitor around your own town and start to feel like a tourist yourself”. Readers called it wholesome; several raised safety concerns about showing locations (we show a fictional pixel city, no real landmarks). |
| Facts we use (only these, checked against the full post) | A desk-bound game streamer did a proper IRL: a tour of their city at Christmas (Christmas market, a castle, street food, a flea market, a lit-up carousel they let viewers watch). 3 viewers at peak. At the end they had a train to catch and meant to stop, but one chatty viewer wanted to keep watching until the connection dropped: they had **never been on a train** and were surprised how fast it moved. The view went from the city to **open farmland**. The viewer thanked them “for being so chill” and said it had been “an amazing stream”. The streamer was nearly in tears that it resonated with someone **on the other side of the world**. |
| Persona / pains | Starter · pains 8 (loneliness), 15 (stuck small) |
| The one message | Three viewers can be enough. Someone is there. |
| Length / format | ≈61 s: 58.3 s song + end card (minimum 45 s) · 9:16 first, 16:9 cut |
| Audio | A short song, played as background. **Nobody sings on screen.** Lyrics appear as on-screen text and chat messages |
| Quality level | **6 (the minimum for every film)**: two dressed sets (the street with Christmas lights, the train carriage); lit pixel art with soft shadows and bounce light; haze and volumetric light around the market lights and the carousel; a physical winter sky at dusk; window reflections and speed on the train; lit particles (market lights, sparks of the carousel bulbs); 60 fps adaptive motion blur; one hero shot (beat 4: through the train window the city falls away into open farmland, fast) |
| Style deck | Home: **pixel art** · switches: **neon line**, **halftone** |
| Characters | The streamer as a small pixel sprite from behind (hood, phone in hand). The chat as the second character. The companion only as a 1-second cameo at the end |

## Beat sheet (v0.7, timed to the master audio `films/ST-01_train-ride/audio/song_with_intro.wav`)

123 BPM · 1 bar = 1.95 s · downbeats at 3.90 + n × 1.95 s. Song 58.3 s; the end card holds 2.5 s
past the song with the sonic logo → film ≈ 61 s. Lyric times: `data/lyrics_master.json`. Subtitles
always show the **written** lyric (lines 9 and 10 are sung slightly differently, accepted).

| # | Time (s) | Music | Picture | On-screen text | Lyric (background) | Style |
|---|---|---|---|---|---|---|
| 1a | 0.00–2.93 | Intro hook (wordless “oh-oh”), 1.5 bars | Slow push into the pixel city at dusk, Christmas-market lights glowing in haze | **`Based on a true story`** (frame 1, out on beat 3 of bar 2) | (hook) | Pixel |
| 1b | 2.93–3.90 | Intro, last half bar | The pixel desk with a gaming monitor goes dark; the streamer stands up and steps out; a tiny `LIVE` badge blinks on | `first real IRL` → `LIVE · IRL` | (hook) | Pixel |
| 2 | 3.90–11.70 | Verse, bars 1–4 | The tour: market stalls, a castle on the hill, a lit carousel turning (the tripod set down in front of it) | lyrics 1–2 | “Took the stream out for Christmas in town / Market lights, a castle, a carousel” | Pixel |
| 3 | 11.70–15.60 | Verse, bars 5–6 | The viewer counter climbs `1 … 2 … 3`; chat lines pop up beside the carousel, one name lighting up again and again (the regular who chats for an hour) | `3 watching` + lyrics 3–4 | “Three people watching, that's my crowd / Talking to the street out loud” | **Neon line** |
| 4 | 15.60–21.45 | Verse, bars 7–9 | The station; the streamer is about to end the stream. A chat line pops up: `wait, I've never been on a train` | lyric 5 + the chat line | “Train to catch, I'll say goodbye / ‘Wait, I've never been on a train’” | Pixel |
| 5 | 21.45–23.40 | **Break**, 1 bar | The streamer boards; the train pulls out; through the window the city starts to slide away (no text: the picture carries it) | — | (instrumental) | Pixel, carriage set |
| 6 | 23.40–25.35 | Pre-chorus, 1 bar | The chat line fills the frame, typed letter by letter; the phone's signal bars are full | `can you keep it on?` | “Can you keep it on?” | Chat |
| 7 | 25.35–33.15 | Chorus, bars 1–4 | **Hero shot:** through the carriage window the city falls away into open farmland, fast; the signal bars drop one by one | lyrics 8–10 | “Keep it on, keep it on, till the signal's gone / You watched the city turn to fields / Your first train, it moved so fast” | Pixel, motion |
| 8 | 33.15–37.05 | Chorus, bars 5–6 | Fields rush past; on “gone” (≈36.5) the picture pixelates, freezes on `reconnecting…`, then cuts to black for 1 beat | lyric 11 → `signal lost` | “Keep it on, keep it on, till the signal's gone” | Pixel → **glitch** |
| 9 | 37.05–40.95 | Chorus, bars 7–8 | The last chat message, big, as the hero of the frame | `thanks for being so chill. amazing stream` + lyric 12 | “Said it was amazing, from the other side of the world” | Chat |
| 10 | 40.95–44.85 | Hook (wordless), 2 bars | Bar 1: front-page burst on the downbeat. Bar 2: pull back from the train across the fields and over the curve of the globe to one lit window on the other side of the world | `3 VIEWERS. ENOUGH.` → `the other side of the world` | (hook) | **Halftone** → pixel globe |
| 11 | 44.85–52.65 | Outro, bars 1–4 | The streamer back in town, walking the market like a visitor; a small warm spark next to the last chat message (companion cameo, ≈1 s at 50.70) | lyrics 13–14 | “Like showing a visitor my town / I saw it like a tourist too” | Pixel warm |
| 12 | 52.65–58.26 | Outro end, ~3 bars | The carousel lights, then the `LIVE · IRL` badge on a new day | lyric 15 → `They kept streaming IRL.` (from 56.55) | “That's why it's worth it” | Pixel warm |
| 13 | 58.26–60.8 | Sonic logo | End card with a small credit line under it | `Chobbot · never stream alone` (placeholder) · `Story shared by a streamer on Reddit, retold with permission` | — | End card |

Every line above comes from the post. Style switches land on downbeats: pixel → neon line (11.70) →
pixel (15.60) → chat (23.40) → pixel motion (25.35) → glitch (≈36.5) → chat (37.05) → halftone
(40.95) → pixel globe (42.90) → pixel warm (44.85) → end card (58.26).

## Story coverage (does the film tell the whole story?)

Every beat of the full picture must reach the viewer through at least one channel. **Text** = lyrics
shown on screen + on-screen captions (this is what a muted viewer gets, so text alone must tell the
story). **Song** = what is sung. **Picture** = what is shown.

| Story beat (full picture) | Song | Text | Picture |
|---|---|---|---|
| A year as a desk-bound game streamer; first real IRL | — | ✓ `first real IRL` | ✓ the dark gaming desk, stepping out |
| Christmas tour: market, castle, carousel | ✓ verse 1–2 | ✓ (lyrics) | ✓ beat 2 |
| Only 3 viewers | ✓ verse 3 | ✓ `3 watching` | ✓ counter |
| One regular chats for an hour | — | — | ✓ one name lighting up again and again |
| Train to catch, about to end the stream | ✓ verse 5 | ✓ (lyrics) | ✓ the station |
| The viewer has never been on a train, wants to keep watching | ✓ verse 6, pre-chorus, the chorus hook “keep it on” | ✓ chat line | ✓ chat line |
| City turns to farmland until the signal drops | ✓ chorus 1–2 | ✓ `signal lost` | ✓ hero shot, freeze |
| “Thanks for being so chill… amazing stream” | ✓ chorus 5 | ✓ the chat, full frame | ✓ |
| Someone on the other side of the world; nearly tearful | ✓ chorus 5 | ✓ `the other side of the world` | ✓ globe pull-back |
| What it meant: a tourist in your own town; worthwhile | ✓ outro | ✓ (lyrics) | ✓ warm city |
| After: they kept streaming IRL | — | ✓ `They kept streaming IRL.` | — |
| Left out on purpose: the test streams to work, the setup details, safety talk in the comments | | | |

**Three checks before the build:**
1. **Mute test:** read only the text track in order. It must tell the story start to end.
2. **Listen test:** the song alone must give the arc (going out → the train → the thank-you → what it meant).
3. **Sung-as-written check:** the chosen Suno take is transcribed during word timing and compared
   line by line with the lyrics. A skipped line or a changed meaning means a new take; small word
   slips are kept and the subtitle shows the written lyric. ST-01 result: all 15 lines sung, lines 9
   and 10 slightly different, accepted (`films/ST-01_train-ride/data/ANALYSIS.md`).

## Song (Suno, Custom mode, v5.5, Duration 0:52–1:00)

**Style of Music**

```
catchy upbeat indie pop, warm and hopeful, glockenspiel hook from the first second, train-rhythm drums with handclaps, bright felt piano, clear warm vocal up front, singalong chorus, crisp modern production, 120 BPM
```

**Exclude**

```
heavy reverb, autotune, rap verses, spoken word intro, long instrumental intro
```

**Lyrics**

```
[Intro: 2 bars, glockenspiel hook, train-rhythm drums]

[Verse: soft vocal]
Took the stream out for Christmas in town
Market lights, a castle, a carousel
Three people watching, that's my crowd
Talking to the street out loud
Train to catch, I'll say goodbye
"Wait, I've never been on a train"

[Pre-Chorus: rising]
"Can you keep it on?"

[Break]

[Chorus: catchy singalong, full drums, glockenspiel hook]
Keep it on, keep it on, till the signal's gone
You watched the city turn to fields
Your first train, it moved so fast
Keep it on, keep it on, till the signal's gone
Said it was amazing, from the other side of the world

[Outro: soft, glockenspiel hook returns]
Like showing a visitor my town
I saw it like a tourist too
That's why it's worth it

[End]
```

Why it is catchy (and still true): the glockenspiel hook plays from second 0 (TikTok decides in the first
3 s), the break before the chorus is the "hook moment", and the repeated line “keep it on, keep it on,
till the signal's gone” is the viewer's real wish to keep watching until the connection dropped.

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

## Permission message to the author (draft, send from your Reddit account)

> Hi! Your post about the Christmas IRL and the viewer on their first train really stuck with us.
> We make short animated music videos about real streamer moments and would love to retell yours
> (anonymised: no username, no channel, no place names). Would that be OK with you? Happy to send
> you the video before it goes out, and to credit you if you'd like.
