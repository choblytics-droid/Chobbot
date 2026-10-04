# One-shot prompt for the next session (local Claude Code, Windows)

Start Claude Code in `D:\APP` (or any folder) and paste everything between the lines.

---

Set up and continue my Chobbot video production on this Windows PC. Do the steps in order and report after each one.

1. Get the project. If D:\APP\CHOB_AD_VIDEO_PRODUCTION_2026_10_04 doesn't exist or is empty, run:
   git clone -b claude/epic-davinci-nrw2em https://github.com/choblytics-droid/Chobbot.git D:\APP\CHOB_AD_VIDEO_PRODUCTION_2026_10_04
   The repo is private. If git asks for a login, tell me to sign in (Git Credential Manager, or `gh auth login`) and wait. If the folder already has files, show me what's there and ask before touching anything. Then work only inside that folder; everything lives in brand-video\.

2. Read, in this order: brand-video\HANDOFF.md, the skill .claude\skills\chobbot-film\SKILL.md, brand-video\docs\PIPELINE.md, brand-video\docs\QA.md, brand-video\films\ST-01_train-ride\QA.md. Use the chobbot-film skill for all film work and follow every owner rule in it. The key ones:
   - Quality level 6–10; 6 is the floor.
   - Each step is approved before the next (script before song, no audio no build).
   - Only facts from the Reddit post and the poster's own comments and later posts. No invented lines, beats or chat, only neutral reactions like <3, o/, :).
   - Nobody sings on screen. People only as blank faceless humans or simple pixel art.
   - Streamer Stories carry no brand at all.
   - The song starts at once with the "Based on a true story" sticker. Subtitles show the written lyric.
   - Every film ships with its story summary.
   - Don't spend kie Suno credits via n8n unless I say so. The Story Fisher is manual-trigger only.
   - Run the full QA gate before showing me anything.

3. Check the tools: git, bun, Google Chrome, ffmpeg, Python 3.11+ with sherpa-onnx, soundfile, librosa, pillow and openpyxl. List what's missing with the install command for each (bun: powershell -c "irm bun.sh/install.ps1 | iex"; ffmpeg: winget install Gyan.FFmpeg). Ask me before installing system software; pip and bun packages you may install yourself.

4. Test the engine. This PC has a GPU, so do NOT set the CHROME environment variable. Run:
   cd brand-video\app
   bun install
   bunx tsc --noEmit -p .
   bun scripts/render.ts stills --film ST-01_train-ride --t 23.5 --samples 12 --out ..\films\ST-01_train-ride\out\test
   bun scripts/render.ts perf --from 22 --to 23 --samples auto
   Show me the still and report the speed. Estimate how long the 4K 60 fps level-8 build will take: render.ts video with --fps 60 --samples auto --scale 2.

5. Summarise where we are: ST-01 "The train ride" is built at 1080p60 in brand-video\films\ST-01_train-ride\release\ and is in my review. List the open items from HANDOFF.md:
   - my review of the video
   - the permission DM to the Reddit author
   - approving DESCRIPTION.md
   - optional level-8 polish and the 4K build
   - next films ST-02 to ST-10 from the media plan
   Ask me which to do first. Commit with clear messages and push to branch claude/epic-davinci-nrw2em whenever a step is done.

---
