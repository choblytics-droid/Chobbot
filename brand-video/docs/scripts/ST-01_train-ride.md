# ST-01 · “The train ride” · script v0.9 (approved 2026-10-03; v0.4 fact fixes, v0.5 full picture, v0.6 catchier song, v0.7 timed to the real song, v0.8 no intro + hook sticker, no people, v0.9 no brand end card; 54.8 s)

**Status:** song done, style frames approved (2026-10-04). v0.8: the song starts at once, the hook pops on over the first shot (master `song.wav`). Next: animatic approval. Earlier: v0.4 corrects lyrics and pictures to the full post text (no rain, no phone, no night; added the real details: the viewer's first train, city to farmland, the other side of the world). Next: the song.

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
| Length / format | 54.8 s, the song's length; no end card (minimum 45 s) · 9:16 first, 16:9 cut |
| Audio | A short song, played as background. **Nobody sings on screen.** Lyrics appear as on-screen text and chat messages |
| Quality level | **6 (the minimum for every film)**: two dressed sets (the street with Christmas lights, the train carriage); lit pixel art with soft shadows and bounce light; haze and volumetric light around the market lights and the carousel; a physical winter sky at dusk; window reflections and speed on the train; lit particles (market lights, sparks of the carousel bulbs); 60 fps adaptive motion blur; one hero shot (beat 4: through the train window the city falls away into open farmland, fast) |
| Style deck | Home: **pixel art** · switches: **neon line**, **halftone** |
| Characters | **No people on screen (this film's choice; the series allows blank humans or simple pixel art, `STYLE_DECK.md`).** The phone is the protagonist (on its tripod, propped at the train window, the stream's own screen); the chat is the second character; no brand and no companion (a Story is not a brand video). Style frames: `films/ST-01_train-ride/STYLE_FRAMES.md` |

## Beat sheet (v0.8, timed to the master audio `films/ST-01_train-ride/audio/song.wav`)

123 BPM · 1 bar = 1.95 s · downbeats at 0.41 + n × 1.95 s. The song starts at once (no intro): the
hook “Based on a true story” pops on over the first shot. Film = song, 54.8 s: no brand end card (a Story
is not a brand video); the last shot carries the closing fact and the credit, and fades with the song. No people on screen (the phone is the protagonist).
Subtitles always show the **written** lyric. Lyric times: `data/lyrics_master.json`.

| # | Time (s) | Music | Picture | On-screen text | Lyric (background) | Style |
|---|---|---|---|---|---|---|
| 1 | 0.00–2.36 | Verse, pickup + bar 1 | The game desk: the monitor goes dark, the door opens on warm light, the phone on the desk wakes up LIVE on “stream” | Hook sticker **`Based on a true story`** (0.05–2.75, pops on/off) · `first real IRL` → `LIVE · IRL` · lyric 1 | “Took the stream out for Christmas in town” | Pixel interior |
| 2 | 2.36–8.22 | Verse, bars 2–4 | The town at Christmas: market, castle, carousel; the phone on its tripod, its screen showing the carousel | lyrics 1–2 (hook sticker pops off at 2.75) | “…for Christmas in town / Market lights, a castle, a carousel” | Pixel (flash cut) |
| 3 | 8.22–12.13 | Verse, bars 5–6 | The same square as neon lines; the viewer counter climbs `1 → 3`; one regular's name keeps lighting up (reactions only) | `3 watching` + lyrics 3–4 | “Three people watching, that's my crowd / Talking to the street out loud” | **Neon line** (scan) |
| 4 | 12.13–17.99 | Verse, bars 7–9 | The station seen through the stream UI; “End stream?” comes up, then the real chat line lands | `End stream?` · `wait, I've never been on a train` · lyrics 5–6 | “Train to catch, I'll say goodbye / ‘Wait, I've never been on a train’” | Pixel + stream UI (pixel dissolve) |
| 5 | 17.99–19.94 | **Break** | The train pulls out past the platform lamps; the phone propped at the window | — | (instrumental) | Pixel interior (dip) |
| 6 | 19.94–21.90 | Pre-chorus | Macro of the phone screen: the words type in on the vocal | `can you keep it on?` | “Can you keep it on?” | Screen macro (pixel dissolve) |
| 7 | 21.90–29.71 | Chorus, bars 1–4 | **Hero shot:** the city falls away into open farmland, fast; signal bars dropping | lyrics 8–10 | “Keep it on… / You watched the city turn to fields / Your first train, it moved so fast” | Pixel, motion blur (flash) |
| 8 | 29.71–33.62 | Chorus, bars 5–6 | Same shot; on “gone” (33.06) it pixelates, freezes on `reconnecting…`, one beat of black | lyric 11 → `signal lost` | “Keep it on, keep it on, till the signal's gone” | **Glitch** → black |
| 9 | 33.62–37.52 | Chorus, bars 7–8 | Macro of the screen, warm: the real thank-you | `thanks for being so chill. amazing stream` + lyric 12 | “Said it was amazing, from the other side of the world” | Screen macro (scan) |
| 10a | 37.52–39.48 | Hook, bar 1 | Front page slams in on the downbeat | `3 VIEWERS. ENOUGH.` | (wordless hook) | **Halftone** |
| 10b | 39.48–41.43 | Hook, bar 2 | Pull back over the globe; a line of light from the train to one lit window on the other side | `the other side of the world` | (wordless hook) | Pixel globe (ink) |
| 11 | 41.43–49.24 | Outro, bars 1–4 | Back in town like a visitor (handheld drift); the real message remembered | lyrics 13–14 | “Like showing a visitor my town / I saw it like a tourist too” | Pixel warm (pixel dissolve) |
| 12 | 49.24–54.80 | Outro end | The next morning, `LIVE · IRL`; fades out with the song's last note | lyric 15 → `They kept streaming IRL.` (from 53.15) · credit `Story shared by a streamer on Reddit` (+ `, retold with permission` once the author says yes) | “That's why it's worth it” | Pixel morning (ink) |

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

- Brand colours: until the design lands, the warm accent is a placeholder amber.

## Permission message to the author (draft, send from your Reddit account)

> Hi! Your post about the Christmas IRL and the viewer on their first train really stuck with us.
> We make short animated music videos about real streamer moments and would love to retell yours
> (anonymised: no username, no channel, no place names). Would that be OK with you? Happy to send
> you the video before it goes out, and to credit you if you'd like.
