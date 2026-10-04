# Handoff · Chobbot brand videos · end of cloud session 2026-10-04

Everything from this session is in the Git branch `claude/epic-davinci-nrw2em` of
`github.com/choblytics-droid/Chobbot`. The cloud container is temporary; the branch is the copy that
lasts. Local folder: `D:\APP\CHOB_AD_VIDEO_PRODUCTION_2026_10_04`.

## Get it onto the PC

**Option A · Git (recommended, keeps history and lets you push back):**

```powershell
git clone -b claude/epic-davinci-nrw2em https://github.com/choblytics-droid/Chobbot.git D:\APP\CHOB_AD_VIDEO_PRODUCTION_2026_10_04
```

(The target folder must be empty or not exist yet.)

**Option B · ZIP (no Git needed):** download
`https://github.com/choblytics-droid/Chobbot/archive/refs/heads/claude/epic-davinci-nrw2em.zip`
(about 117 MB, log in to GitHub first: the repo is private), unzip, and move the *contents* of the
inner folder `Chobbot-claude-epic-davinci-nrw2em` into `D:\APP\CHOB_AD_VIDEO_PRODUCTION_2026_10_04`
so that `.claude\` and `brand-video\` sit directly in it. (`.claude` is a hidden folder: turn on
"Hidden items" in Explorer to see it. It holds the film skill; don't leave it behind.)

## What is where

| Path | What |
|---|---|
| `.claude/skills/chobbot-film/SKILL.md` | **The workflow as a skill**: 14 owner rules, steps 0–9, commands, QA gate, lessons. A local Claude Code session opened in the folder loads it. |
| `brand-video/README.md`, `docs/` | Plan and rules: `PIPELINE.md` (gates), `SERIES.md`, `STYLE_DECK.md`, `SUNO_GUIDE.md`, `TIER_LIST.md`, `QA.md` (QA rubric), `SCRIPT_TEMPLATE.md`, `STORY_FISHER.md` |
| `CLAUDE.md` (repo root) | **How a local session works**: the "go" protocol, setup, git rules. Loaded automatically by Claude Code. |
| `brand-video/plan/STREAMER_STORIES.md` | The Story Fisher picks ST-01…ST-10, readable copy |
| `brand-video/plan/Chobbot_Media_Plan_v0.1.xlsx` | The working media plan (Streamer Stories ST-01…ST-10, Brand Generic A/B, Brand Master A/B, Story & Song, status) |
| `brand-video/docs/scripts/ST-01_train-ride.md` | ST-01 script v0.9 (approved), story coverage, permission DM draft |
| `brand-video/films/ST-01_train-ride/` | The first film: `audio/song.wav` (master), `data/` (analysis, lyrics timing), `frames/` (20 style frames + 2 contact sheets), `animatic/` (v3, v4 540p), **`release/ST-01_train-ride_1080p60.mp4` (the finished video, 75 MB)**, `DESCRIPTION.md` (caption, story summary, credits, hashtags), `STYLE_FRAMES.md`, `QA.md` (all QA rounds) |
| `brand-video/app/` | The render engine (Bun + Vite + three.js): `src/kit/` (lit pixel-art renderer, materials, overlay, macro, glitch), `src/films/ST-01_train-ride/` (timeline, scenes, sets), `scripts/render.ts` |
| `brand-video/tools/` | Python: `analyze_audio.py`, `film_data.py`, `qa_frames.py` (QA gate), `contact_sheet.py` |

Not kept (re-creatable): the 425 MB CRF-16 master and the two render halves (`films/*/out/` is
ignored by Git; the 75 MB release is visually the same), the speech models (download command in the
skill), `node_modules` (`bun install`).

## Status

**ST-01 "The train ride"** (Streamer Story, 54.8 s, level 6):

| Step | State |
|---|---|
| 0–4 story, brief, script, song, audio analysis | approved / done |
| 5–6 style frames, assets | done; QA gate 0 flat objects, 0 text in UI zones; independent review: level 6 |
| 7 animatic v4 | **approved by the owner** |
| 8 build | 1080p60 with 4-sample motion blur done on the cloud CPU box: `release/`. **In owner review.** 4K level-8 build: needs a GPU machine (this PC). |
| 9 post description | `DESCRIPTION.md` drafted; owner to approve |

**Open items:**

1. Owner: review the 1080p60 video.
2. Owner: send the permission DM to the Reddit author (draft in the script). After a yes, add
   `, retold with permission` to the credit (`app/src/films/ST-01_train-ride/town.ts`, the
   `credit` string) and to `DESCRIPTION.md`, then re-render.
3. Owner: approve `DESCRIPTION.md`, then post (TikTok, Shorts, Reels).
4. Defaults taken on "go" (changeable): "Reddit" stays in the credit as the source; the line
   `can you keep it on?` stays as the viewer's message; the front-page body copy is soft texture.
5. Optional level-8 polish before a 4K build: the macro phone as pixel art, station platform
   furniture and lamp pools, a lit-window cluster at the globe's end marker, ice shading.
6. Next films: ST-02…ST-10 are in the media plan (tab 1). The Story Fisher (n8n, manual trigger
   only) can fish more stories, including "bad stories" on the owner's say-so.

## Task queue (what "go" does, top first; see `CLAUDE.md`)

| # | Task | Gate / needs owner | State |
|---|---|---|---|
| 1 | Setup on the PC: tools, `bun install`, typecheck, smoke still, `perf` speed, note it here | system installs only | **done 2026-10-04** (speeds below) |
| 2 | ST-01 level-8 polish: pixel-art phone in the macros, station platform furniture and lamp pools, lit-window cluster at the globe's end marker, shading on the ice; QA gate + reviewer | none | todo |
| 3 | ST-01 4K 60 fps build (`--samples auto --max-samples 36 --scale 2`, ~10–12 h overnight, see speeds); keep the master in `out/`, a posting copy < 100 MB in `release/` | owner approves the final video | todo |
| 4 | ST-01 credit: add `, retold with permission` once the author says yes (town.ts `credit`, DESCRIPTION.md), re-render the last shot / rebuild | owner sends the DM (draft in the script) and reports the answer | waiting |
| 5 | ST-02 "The raid from the hero": run Story Context on the post, brief + script draft (`docs/SCRIPT_TEMPLATE.md`), Suno blocks | owner approves the script, then makes the song in Suno and sends the WAV | todo |
| 6 | ST-02 steps 4–9 once the WAV arrives (analysis, frames, QA, animatic, build, description) | gates per step | todo |
| 7 | ST-03 … ST-10 the same way, in order (`plan/STREAMER_STORIES.md`) | gates per step | todo |

## The PC (set up 2026-10-04)

RTX 4070 SUPER 12 GB, 20 threads, Chrome 154 on the GPU (ANGLE D3D11; `render.ts gpu` prints it),
Bun 1.4.2 (`%USERPROFILE%\.bun\bin`; a portable copy also sits in `D:\APP\CHOB_FILM\tools`), ffmpeg in
`C:\Users\Administrator\bin`, Python 3.13 with all packages. The skill is also copied to
`%USERPROFILE%\.claude\skills\chobbot-film` so sessions started in `D:\APP` load it (re-copy after edits).

Speed on ST-01 (train POV at 22 s, one of the heaviest shots), ms per frame incl. readback:

| Setting | 1080p | 4K (`--scale 2`) |
|---|---|---|
| 1 sample | 266 | 375 |
| 4 samples | 1 011 | ~1 500 |
| `--samples auto` (uncapped) | **79 000** (hits 324 sub-frames) | ~110 000 |

The film is 3 288 frames at 60 fps: 1080p60 with 4 samples ≈ 55 min; 4K60 with 4 samples ≈ 1.5 h;
4K60 auto capped at 36 ≈ 10–12 h at worst; uncapped auto ≈ days (never use it on a whole film). The
cost is CPU-bound (one Chrome thread; the GPU idles at 10–40 %), so `--scale 2` only adds ~40 %.

## Decisions from the chat (not recorded elsewhere)

- 4K build cap: `--max-samples 36` (taken on "go", 2026-10-04; uncapped auto would take days).
  Raise it per shot only where streaks still look stepped.

- Stories "also can be bad stories" (sad, open-ended): ST-05 and ST-10 are in the picks. Adding
  "bad story" search phrases to the Story Fisher was offered, not confirmed: ask before changing it.
- ST-01 has no people (approved that way). Faceless background figures in the market and on the
  platform are allowed by the rule but were never answered: default **no**.
- The outro uses a closer, night framing (the owner's "different angle" question, resolved by QA).
- Defaults taken on "go": "Reddit" stays in the credit as the source; `can you keep it on?` stays as
  the viewer's message (approved script v0.9); the front-page body copy is soft page texture.
- The owner makes songs in Suno and sends the WAV in chat; no kie Suno credits via n8n.
- The owner wants everything downloadable to the PC: keep the branch complete and pushed.

## Run it locally (Windows)

Install once: **Git**, **Bun** (`powershell -c "irm bun.sh/install.ps1 | iex"`), **Google Chrome**
(the renderer uses your installed Chrome and its GPU when `CHROME` is not set), **FFmpeg**
(`winget install Gyan.FFmpeg`), **Python 3.11+** with `pip install sherpa-onnx soundfile librosa pillow openpyxl`.

```powershell
cd D:\APP\CHOB_AD_VIDEO_PRODUCTION_2026_10_04\brand-video\app
bun install
bunx tsc --noEmit -p .
# one still (check the GPU path works)
bun scripts/render.ts stills --film ST-01_train-ride --t 23.5 --samples 12 --out ..\films\ST-01_train-ride\out\test
# QA gate
bun scripts/render.ts stills --film ST-01_train-ride --qa --t 1.2,4,10.5,13.5,16.5,18.9,20.8,23.5,28,31.5,33.3,34.5,36.8,38.6,39.7,40.8,43,47.3,51,54 --out ..\films\ST-01_train-ride\out\qa
python ..\tools\qa_frames.py ..\films\ST-01_train-ride\out\qa ..\films\ST-01_train-ride\out\qa\out
# 4K level-8 build (GPU): adaptive motion blur, 2x scale
bun scripts/render.ts video --film ST-01_train-ride --fps 60 --samples auto --scale 2 --crf 16 --out ..\films\ST-01_train-ride\out\ST-01_4k.mp4
```

Do not set `CHROME` locally (it switches to the slow software renderer used in the cloud).
