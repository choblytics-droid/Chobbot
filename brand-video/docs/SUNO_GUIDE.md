# Making the songs in Suno (how we do it)

Every film's song or score is written from its **approved script**. The prompt and lyrics for each
film are in the media plan, tab **Story & Song**.

## Length

- **At least 45 s for every film.** Targets: Streamer Stories and Brand · Generic **50–60 s**,
  Brand · Master **75–90 s**.
- Set the target with the **Duration slider** (v5.5). If Suno runs long, send the full track and we
  cut the section that matches the script's structure.
- Lyrics must fit the length: about **8–12 short sung lines** for 50–60 s, 16–20 for 75–90 s. Too
  many lines makes Suno rush or drop words, which breaks the word-synced text.

## Settings

| Setting | Value |
|---|---|
| Mode | **Custom** (we supply lyrics and style) |
| Model | v5.5 (or the newest) |
| Duration | per film (see tab Story & Song) |
| Instrumental | **On** for every A version (majestic technical), off for B versions and Stories |
| Style influence | high (we want the style obeyed); Weirdness in the middle, raised only if takes sound generic |
| Takes | generate 2–4, pick by the checklist below |

## The Style field (what it should sound like)

- **4–7 descriptors, most important first**, in this order: genre and subgenre → mood/energy → key
  instruments → vocal → production → tempo (BPM). For example: `warm lo-fi indie pop, gentle and
  hopeful, glockenspiel and felt piano, soft clear vocal, intimate dry production, 120 BPM`.
- Descriptive tags, not sentences. **No artist or song names** (Suno blocks them; they are also a
  rights risk).
- **No negatives in the Style field** ("no drums" can add drums). Put unwanted things in **Exclude**.

## The Lyrics field (what happens when)

- **Section tags** on their own lines: `[Intro]`, `[Verse]`, `[Pre-Chorus]`, `[Break]`, `[Chorus]`,
  `[Outro]`, `[End]`. Notes per section go inside the tag: `[Verse: soft vocal, piano only]`.
- **Get to the hook fast.** No long intro, no bridge in short songs. Exception: **Streamer Stories need
  an instrumental intro of 2 bars** (about 3–4 s) to hold the “Based on a true story” card; tag it
  `[Intro: 2 bars, instrumental]`.
- **`[Break]`** before the chorus gives our "silence" moment (signal lost, the freeze before the
  answer). `[End]` closes the song cleanly instead of fading on.
- **Short, plain lines** with concrete words. They go on screen word by word, so they must read
  well as text too. Our copy rules apply (human-copy-voice / stop-slop: no hype words, no clichés,
  concrete beats vague).
- For **instrumental A versions**: Instrumental on; the lyrics field holds only structure tags with
  notes (`[Intro: solo felt piano]`, `[Build: strings enter]`, `[Climax: full orchestra]`), and the
  film's statements appear as on-screen text, not in the song.

## Making sure the song tells the story

- The lyrics come from the script's **story coverage table**: song structure follows the story
  (intro = setup, verse = what happened, pre-chorus = the turn, break = the held breath, chorus =
  the payoff, outro = what it meant). Facts the song can't fit go to on-screen text or the picture.
- After picking a take, the vocal is **transcribed during word timing and compared line by line**
  with the lyrics. Any skipped or changed line → generate a new take.

## Picking a take (checklist)

1. The vocal is **clear and up front** (we sync every word on screen).
2. The **tempo is steady** (cuts land on the beat grid).
3. The structure matches the script: the break where the script needs silence, the chorus where
   the answer lands.
4. Every lyric line is sung **as written** (no skipped or invented words).
5. It ends cleanly (`[End]` respected) and is at least 45 s.

Download the **WAV** (and stems if your plan has them: the vocal stem makes word timing much more
accurate) and drop it in the chat or in `films/<film-id>/audio/`.

## House rules

- The song plays in the background. **Nobody sings on screen.**
- The brand's sonic logo is added at the end in the edit, so every film ends on the same sound.

## Sources

- [Suno Guide: Tags, Meta Tags & Prompts (V5.5)](https://blakecrosley.com/guides/suno-ai-music-generation)
- [Suno's Style Field and Style Influence Slider, Explained](https://blakecrosley.com/blog/suno-style-field-style-influence)
- [Suno v5.5 Duration slider guide](https://jackrighteous.com/blogs/guides-using-suno-ai-music-creation/suno-duration-slider-song-length-guide)
- [Complete Suno AI prompt guide 2026](https://roo.beehiiv.com/p/complete-suno-ai-prompt-guide-2026-301-styles-the-exact-formula-and-why-your-outputs-sound-random)
