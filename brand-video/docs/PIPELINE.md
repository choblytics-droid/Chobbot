# Production pipeline: script first

Nothing is built before the step before it is approved. Each gate is a written deliverable you sign
off; only then does the next step start.

| # | Step | Deliverable | Who | Gate |
|---|---|---|---|---|
| 1 | **Brief** | Which film, which series, audience (persona), the one message, length, formats | you + me | you approve |
| 2 | **Script** | A two-column script ([`SCRIPT_TEMPLATE.md`](SCRIPT_TEMPLATE.md)): every beat with picture, on-screen text, voice/lyric, sound, and the pain point / use case it serves | me drafts, you edit | you approve |
| 3 | **Music** | The song or score written to the approved script (lyrics or VO from the script, structure from its timing) | you | final audio file delivered |
| 4 | **Audio analysis** | Beat grid, sections, word timings from the final audio | me | timings checked against the script |
| 5 | **Style frames + asset list** | 1 still per scene in the chosen look, plus the list of assets to make (characters, sets, UI screens, type, logo) | me | you approve the look |
| 6 | **Assets** | The companion, sets, UI stand-ins or real screens, brand kit | me (+ your design files) | you approve |
| 7 | **Animatic** | A low-res timed cut of the whole film on the real audio | me | you approve the timing |
| 8 | **Build + render** | The full film at the approved quality level, then the cut-downs | me (GPU machine for the 4K master) | final review |

Rules:
- **No audio, no build.** Steps 4–8 need the final audio, because every cut and word is timed to it.
- **Script before song.** The song is written from the script, not the other way round, so the
  message leads and the music serves it.
- **Changes flow down, never up.** A change to an approved script reopens steps 3–8; a change to a
  style frame reopens 5–8 only.
- **Stories: full picture first.** Before a Story script, run Story Context (post + comments +
  the poster's follow-ups). Only facts the poster stated are used; open or continued stories stay open.
- **After the first finished film (ST-01): capture the workflow as a skill** in
  `.claude/skills/chobbot-film/SKILL.md` (every step, rules, n8n workflow IDs, file layout, commands,
  and the measured cost per film), so every later film follows it exactly. Update it after each film
  with anything learned.
- **Minimum quality level 6 for every film** (owner rule, 2026-10-03). The level (`TIER_LIST.md`)
  is chosen at step 1 (6 or higher) and confirmed at step 5. No lower-level tests or drafts for release.

## Standard workflow: step 4, audio analysis (set after ST-01, owner 2026-10-04)

1. **Store the song.** The owner sends the Suno WAV in the chat (or uploads it on GitHub). It is
   saved as `films/<film-id>/audio/song.wav` and pushed straight away, so it outlives the session.
   The owner downloads everything later with **Code → Download ZIP** on the branch.
2. **Analyse.** `python3 tools/analyze_audio.py films/<film-id>/audio/song.wav films/<film-id>/data/ --models <dir>`
   gives the vocal stem, word timings (`words.json`) and the beat grid (`beats.json`). Then
   `data/ANALYSIS.md`: tempo, sections, and the sung-as-written table, line by line.
3. **Missing intro → splice, don't regenerate.** If Suno skips the instrumental intro (the opening card
   needs about 3–4 s), put the song's own wordless hook (or another instrumental passage) in front,
   exactly 2 bars, cut on downbeats so the beat grid runs on, and check the join for clicks.
   Result: `audio/song_with_intro.wav`. The owner listens to a short clip (`check_new_intro.mp3`) and
   approves.
4. **Changed or unclear words → keep the song, correct with subtitles.** If a line is sung
   differently (mumbled, a word swapped, a tense changed) but the meaning stays close to the written
   lyric, the take is accepted and the **on-screen subtitle shows the written lyric**. A new take
   is needed only when a line is missing or the sung words change the story's meaning.
5. **Master timing.** The approved audio is the master; every line's start and end in master time
   goes to `data/lyrics_master.json`, and the script's beat sheet is retimed to the real bars.
