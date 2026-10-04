# ST-01 · Audio analysis (pipeline step 4)

Source: `audio/song.wav`, Suno take of 2026-10-04 (id `4d9b3f54…`), 54.80 s, 48 kHz stereo.
Tool: `tools/analyze_audio.py` (Spleeter vocal stem → Parakeet word timings, Whisper medium.en as a
second opinion, librosa beat grid). Raw output: `words.json`, `beats.json`.

## Tempo and grid

- **123 BPM**, steady (beat 0.488 s, bar 1.95 s). The prompt asked for 120; 123 is fine.
- First beat at 0.44 s. Downbeats used below: 0.44, 37.50, 41.40.

## The intro problem and the proposed fix

Suno skipped the 2-bar instrumental intro: **the vocal starts at 0.8 s**, so there is no room for
the "Based on a true story" card.

Proposed fix, no new take needed: `audio/song_with_intro.wav` (58.26 s). The song's own wordless
"oh-oh" hook (37.50–40.96 s, after the chorus) is placed in front of the song, so the film opens on
its catchiest sound and the verse starts exactly 2 bars later (3.90 s). Checked: the beat grid runs
on without a jump across the splice, and the splice is no louder than a normal transient (no click).
**Owner to listen and approve** (`check_new_intro.mp3`). With it, add **+3.46 s** to every time below.

## Sung-as-written check

Every line is sung, in order. Two lines differ or are unclear on both models:

| # | Line as written | Original time | Heard | Status |
|---|---|---|---|---|
| 1 | Took the stream out for Christmas in town | 0.80–3.9 | as written | ✓ |
| 2 | Market lights, a castle, a carousel | 4.72–7.6 | as written | ✓ |
| 3 | Three people watching, that's my crowd | 8.56–10.7 | as written | ✓ |
| 4 | Talking to the street out loud | 10.96–12.6 | as written | ✓ |
| 5 | Train to catch, I'll say goodbye | 12.80–14.6 | as written | ✓ |
| 6 | "Wait, I've never been on a train" | ~15.1–17.3 | "Wait" is soft (only Whisper hears it) | ✓ |
| — | *[Break]* | 17.3–19.6 | instrumental | ✓ |
| 7 | "Can you keep it on?" | 19.60–21.2 | as written | ✓ |
| 8 | Keep it on, keep it on, till the signal's gone | 21.60–25.2 | as written | ✓ |
| 9 | You watched the city turn to **fields** | 25.36–27.2 | both models hear "fuse" | **owner to listen** |
| 10 | Your first train, it **moved** so fast | 27.36–29.3 | "it moves so fast" | on-screen text follows the vocal: "moves" |
| 11 | Keep it on, keep it on, till the signal's gone | 29.52–33.0 | as written | ✓ |
| 12 | Said it was amazing, from the other side of the world | 33.12–37.0 | as written | ✓ |
| — | *wordless "oh-oh" hook (added by Suno)* | 37.5–41.2 | no lyrics | becomes the intro too |
| 13 | Like showing a visitor my town | 41.20–44.8 | as written | ✓ |
| — | *"oh" ad-libs* | 44.8–47.1 | no lyrics | ✓ |
| 14 | I saw it like a tourist too | 47.12–50.6 | as written (Whisper) | ✓ |
| 15 | That's why it's worth it | 51.52–53.4 | as written | ✓ |
| — | end | 54.80 | clean ending (`[End]` respected) | ✓ |

## Sections (original times)

| Section | Time | Loudness | Script beats |
|---|---|---|---|
| Verse | 0.8–17.3 | medium; dips at 14–16 s ("Wait…") | 1b–4 |
| Break | 17.3–19.6 | quiet | 5 (the held breath) |
| Pre-chorus | 19.6–21.2 | rising | 5 |
| Chorus | 21.6–37.0 | loudest | 6–9 |
| Hook | 37.5–41.2 | loud, wordless | 9 (globe pull-back) |
| Outro | 41.2–53.4 | loud, then falls from 49 s | 10 |
| Ending | 53.4–54.8 | tail | end card |

Takes checklist (`SUNO_GUIDE.md`): vocal clear ✓ · tempo steady ✓ · structure ✓ (except the
missing intro, fixed above) · sung as written: 13 of 15 lines ✓, 2 to confirm · ≥ 45 s ✓.
