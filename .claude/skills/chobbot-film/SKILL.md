---
name: chobbot-film
description: Make a Chobbot film (Streamer Story music video, Brand · Generic or Brand · Master) end to end, the way ST-01 "The train ride" was made - story from Reddit via n8n, script, Suno song, audio analysis, style frames, assets, animatic, level 6-10 build, post description. Use whenever the user wants a new Chobbot / brand-video film, a Streamer Story, a Suno song brief for a film, style frames, an animatic or a render in brand-video/.
---

# Chobbot film workflow (captured from ST-01, 2026-10-04)

Everything lives in `brand-video/` (never mixed with other projects). Read first:
`docs/PIPELINE.md` (the gates), `docs/SERIES.md` (the three sections), `docs/STYLE_DECK.md`,
`docs/SUNO_GUIDE.md`, `docs/SCRIPT_TEMPLATE.md`. The worked example is ST-01:
`docs/scripts/ST-01_train-ride.md` and `films/ST-01_train-ride/`.

## Owner rules (never break these)

1. **Gates.** Nothing is built before the step before it is approved. No audio, no build. Script
   before song. Changes flow down, never up.
2. **Quality band level 6–10** (`docs/TIER_LIST.md`). 6 is the floor; push each film as high as it allows.
3. **Stories: only facts the poster stated** (post, the poster's comments, the poster's later posts).
   Never invent lines, chat messages, endings or beats. Open stories stay open ("to be continued").
   Background chat may only be neutral reactions (`<3`, `o/`, `:)`).
4. **People:** only blank humans (faceless, featureless) or simple pixel art; never 3D models, cartoon
   or anime humans, faces or expressions. No people at all (an object as protagonist) is a strong option.
5. **Nobody sings on screen.** The song is background; lyrics appear as subtitles, chat, kinetic type.
6. **Streamer Stories carry no brand:** no end card, logo, tagline, sonic logo or companion. The
   channel's avatar and name already carry the brand. Brand films use the end card (`app/src/kit/endcard.ts`).
   **Exception (owner, 2026-10-04): the series cover** carries pixel Chob ("STORY TIME" + number), see step 9.
7. **Stories open on the song at once** (no intro, no splice), with the hook sticker
   **"Based on a true story"** popping on over the first shot for 2.5–3 s, across the first cut.
8. **Subtitles show the written lyric.** Small sung slips are accepted; a new take only if a line is
   missing or the meaning changes.
9. **Songs ≥ 45 s**, catchy (hook in the first seconds, 120–140 BPM, repeated story-true phrase).
10. **Every film ships with its story summary** (step 9, `DESCRIPTION.md`).
11. Mixed art styles from tier A only, switching on the music; cuts and transitions on the beat.
12. Do not spend kie Suno credits via n8n unless the owner says so. The owner makes songs in Suno.
13. **QA gate before anything reaches the owner** (`docs/QA.md`): facts, detail audit at 100%
    (0 FLAT objects), safe zones (0 text in platform UI zones), timing, an independent reviewer
    agent, technical. Log it in `films/<id>/QA.md`. Never judge detail on a full-frame thumbnail.
14. **Build every surface from `app/src/kit/materials.ts`** (plaster, stone, slate, wood, metal,
    fabric, snow, hillside): ≥ 4 tones, texture, form shading, silhouette breakup, grounding.

## Steps

| # | Step | Do | Deliverable | Gate |
|---|---|---|---|---|
| 0 | Story (Stories only) | n8n **Story Fisher** `JuU4QgIrT1o10zO1` (manual run) → table `reddit_streamer_stories` `A4EYkpvK6yRL66kK`, `status=new`; then **Story Context** `ZaJiPe77HucfhKC1` for comments + follow-ups | row with `story_start/end`, `arc_status`, `script_facts` | owner picks the story |
| 1 | Brief | film id, section, persona, one message, length, level (6–10) | brief table in the script | owner |
| 2 | Script | copy `docs/SCRIPT_TEMPLATE.md` → `docs/scripts/<id>.md`: beat sheet, **story coverage table** (Text column alone tells the story), story summary | script | owner approves |
| 3 | Music | paste-ready Suno blocks (Styles, Exclude, Lyrics with tags; settings in `SUNO_GUIDE.md`) | owner sends the WAV in chat | file received |
| 4 | Audio analysis | see below | `data/ANALYSIS.md`, `lyrics_master.json`, `audio.json`, `lyrics.json` | sung-as-written check |
| 5 | Style frames | one still per scene from the real film code; **QA gate first** (below) | `frames/*.jpg`, contact sheets, `STYLE_FRAMES.md`, `QA.md` | owner approves the look |
| 6 | Assets | sets, materials, UI in the kit | code | (with 5) |
| 7 | Animatic | full film, 30 fps, 1 sample, on the master audio | `animatic/<id>_animatic_vN_540p.mp4` | owner approves timing |
| 8 | Build | level 6–10, 60 fps, adaptive motion blur, 4K on a GPU machine | master + cut-downs | final review |
| 9 | Post package | TikTok description = hook line + story summary start to end (facts only, the feeling of the backstory, human-copy-voice) + credit + hashtags; link/name only with the author's permission. Cover: `python tools/cover.py --num NN --title "..."` (one series design). Pack it as `ready-to-post/<ID>_<name>/` (repo root, next to `brand-video/`) with `_video.mp4`, `_cover.png`, `_description.txt` (naming in `ready-to-post/README.md`) | `DESCRIPTION.md` + the ready-to-post folder | owner approves, then posts |

## Step 4 in detail (audio)

1. Save the WAV as `films/<id>/audio/song.wav`, **commit and push at once** (the session is temporary).
2. Models (Hugging Face is blocked in cloud sessions; GitHub releases work), into the scratchpad:
   ```bash
   B=https://github.com/k2-fsa/sherpa-onnx/releases/download
   for f in source-separation-models/sherpa-onnx-spleeter-2stems asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 asr-models/sherpa-onnx-whisper-medium.en; do
     curl -sSL $B/$f.tar.bz2 | tar xj; done
   pip install sherpa-onnx soundfile librosa pillow
   ```
3. `python3 tools/analyze_audio.py films/<id>/audio/song.wav films/<id>/data --models <dir>` → word
   timings + beat grid. Spot-check unclear lines with Whisper on short windows of the vocal stem
   (both models agreeing on a different word = flag it). Write `data/ANALYSIS.md` (tempo, sections,
   line-by-line sung-as-written table).
4. Write `data/lyrics_master.json`: `audio`, `first_downbeat`, `sections`, and every **written** lyric
   line with its start/end (see ST-01's file for the format).
5. `python3 tools/film_data.py <id> --models <dir>` → `audio.json` (beats, downbeats, onsets,
   envelopes), `scope.bin`, `lyrics.json` (written words timed from the sung words).

## The engine and the kit (`brand-video/app`, pdoom-video derived)

- `src/films/<id>/timeline.ts`: entries `{ id, load, start, end, params, trans, inBeats }` on the bar
  grid `B(bar, beat)` (bar 0 = first downbeat). Transitions (`engine.ts`): `fade pixel scan ink flash
  dip`, centred on the cut, length in beats. Same scene continuing = no transition.
- `src/kit/pixel.ts`: lit pixel art. `PixelCanvas` (art grid = frame/4; `rect poly disc line sprite
  px glow erase screen`, materials `{a, n, d, e, ei, id}`), `PixelLight.render(r, out, {lights, sunEl,
  sunAz, skyExp, ambient, ambNear, bands, horizonY, fov, haze, snow, wet, groundY, hazeCol})`
  (physical sky, point lights with soft shadows, bounce, haze, reflections, lit snow), `renderNeon`.
  `screen()` copies part of the picture onto a phone screen in the scene.
- `src/kit/overlay.ts`: `lyric` (word-lit subtitle, balanced rows), `hook` (the pop-on sticker),
  `caption`, `title`, `chat`, `streamUI` (generic LIVE / viewers / chat / "End stream?"), `spark` (brand only).
- `src/kit/macro.ts` (phone-screen macro: LCD subpixels, shallow focus, bokeh), `src/kit/glitch.ts`,
  `src/kit/endcard.ts` (brand films only).
- ST-01 sets to reuse: `sets/town.ts` (old town, 3 times of day, carousel, phone on tripod),
  `sets/station.ts`, `sets/carriage.ts` (window + parallax world), `sets/desk.ts`; scenes
  `chat.ts`, `frontpage.ts` (halftone), `globe.ts` (pixel globe + arc).

### QA gate (run before every delivery)

```bash
bun scripts/render.ts stills --film <id> --qa --t <one time per shot, 15-20 frames> --out <qa-dir>   # no grain/CA, + .gbuf.json + .text.json
python3 ../tools/qa_frames.py <qa-dir> <qa-dir>/out        # FLAT objects, text in UI zones, zoom sheets at 100%
```
Fix until `0 flat; 0 text-in-zone`, then send the zoom sheets and `docs/QA.md` to an independent
reviewer agent (general-purpose, "find what is weak, 10 weakest spots ranked") and fix its findings.
Name objects with `pc.names` so the report is readable.

### Commands (from `brand-video/app`, `bun install` once)

```bash
export CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome   # cloud box; omit on a GPU machine
bunx tsc --noEmit -p .                                              # typecheck
bun scripts/render.ts stills --film <id> --t 3.2,8.9 --samples 12 --out <dir>   # style frames (motion blur)
bun scripts/render.ts sheet  --film <id> --times a,b,c --cols 6 --out cuts.png  # check transitions
bun scripts/render.ts video  --film <id> --fps 30 --crf 20 --preset fast --out ../films/<id>/out/<id>_animatic.mp4
bun scripts/render.ts video  --film <id> --fps 60 --samples auto --scale 2 --out ../films/<id>/out/<id>_4k.mp4   # build, GPU
python3 ../tools/contact_sheet.py sheet.png 5 "f.png|label" ...
```
Review copies: scale to 540×960 with ffmpeg and commit to `films/<id>/animatic/`; `films/*/out/` is
not committed. Send files to the owner with SendUserFile.

## Measured on ST-01 (this cloud container, CPU / SwiftShader)

- A still: 3–7 s (12 motion-blur sub-frames: ~10 s). 1080p frame at 1 sample: ~0.6 s.
- Animatic (55–61 s at 30 fps): ~21–27 min. A postable 1080p60 build with 4 motion-blur samples:
  ~2.8 s/frame, ~2.6 h for 55 s; render it in two `--from/--to` halves with `--noaudio` (each fits a
  2 h background job), join with ffmpeg concat (`-c:v copy`) and mux `audio/song.wav`. Re-encode at
  CRF 19 / maxrate 20M for posting (~75 MB) and keep it in `films/<id>/release/` (the box is
  temporary). Files over ~50 MB don't send in chat: send a ~25 MB two-pass copy.
  The 4K level-8 build with adaptive motion blur needs a GPU machine.

## Measured on the owner's PC (RTX 4070 SUPER, Chrome on the GPU, 2026-10-04)

- Still with 12 sub-frames: ~4 s incl. browser start. 1080p frame: 0.27 s at 1 sample, 1.0 s at 4;
  4K (`--scale 2`) 0.38 s at 1 sample. Still CPU-bound (one Chrome thread), not GPU-bound.
- **`--samples auto` uncapped is unusable on fast shots**: the train POV hits 324 sub-frames, ~79 s
  per frame at 1080p. Always pass `--max-samples 36` (or 12) on a full build; 4K60 at cap 36 ≈ 10–12 h.
- `render.ts perf` prints nothing until the whole range is done: measure 0.25 s ranges, not seconds.
- Agent time is the owner's usage bar: note it before and after each film to calibrate `docs/TIER_LIST.md`.

## Lessons from ST-01

- Suno ignores `[Intro]`; don't fight it (rule 7).
- Human figures drawn freehand looked bad → objects as protagonist; if people are needed, blank or pixel (rule 4).
- I invented filler chat lines and a "reconnected" beat; both were removed. Check every on-screen word against the full picture before showing frames.
- Put lyrics where the frame is empty (the sky in the town, the seats in the train), keep a line in the same place across a cut.
- Phone UI, stream UI and the chat explain a situation faster than any character.
- Check transitions with a `sheet` of mid-cut frames before rendering a whole animatic.
- **Lazy detail slipped through once** (a flat-box castle) because frames were only checked as
  thumbnails. Hence the QA gate: G-buffer object stats, zoom sheets at 100%, an independent reviewer.
- Text placed at the bottom sat under TikTok's caption; text at the right edge under its buttons.
  Lyrics in the band y 700–1700 wrap narrower automatically.
- Sky exposure that worked: blue hour `sunEl -0.045, skyExp 3.2`; night `sunEl -0.1, skyExp 4.5`; morning front-lit `sunEl 0.12, sunAz 2.3, skyExp 0.42`.

- GLSL reserved words broke whole scenes silently (`out`, `half`): a scene that renders as the
  previous scene or black means a shader compile error. Grep the browser log with `grep -a`.
- `pc.screen()` copies what is already painted: paint the screen before the phone body over it.
- Object ids are per canvas and shared by every painter: give each new object its own id and name,
  or the QA stats merge unrelated things (far hills hid a flat window frame under id 2).
- A credit must not claim permission before the author has said yes.
- After the signal drops, nothing may look live again (no input row, cursor or live header).
- Each hero beat needs its own staging: the reviewer flags any two frames with the same framing.
  `PixelLight.render({ zoom: [k, fx, fy] })` gives a closer framing of a set without moving text.

Update this skill after every film with anything learned.
