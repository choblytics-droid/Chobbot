# Prompt for the next session (local Claude Code)

Open Claude Code in `D:\APP\CHOB_AD_VIDEO_PRODUCTION_2026_10_04` (the folder that contains `.claude\`
and `brand-video\`) and paste this:

---

We are continuing the Chobbot brand video production. This folder is a checkout of branch
`claude/epic-davinci-nrw2em` of github.com/choblytics-droid/Chobbot. Everything lives in
`brand-video/`; never mix it with other projects.

First read, in this order: `brand-video/HANDOFF.md` (status and open items), the skill
`.claude/skills/chobbot-film/SKILL.md` (owner rules, steps, commands, QA gate, lessons), then
`brand-video/docs/PIPELINE.md`, `docs/QA.md` and `films/ST-01_train-ride/QA.md`. Use the
chobbot-film skill for all film work.

The owner rules in the skill always apply. The most important: level 6 to 10 quality, 6 is the floor;
gates (script before song, no audio no build, each step approved before the next); only facts from
the Reddit post and the poster's own comments and later posts, no invented lines, beats or chat (only
neutral reactions like `<3`, `o/`, `:)`); nobody sings on screen; people only as blank faceless
humans or simple pixel art, never 3D, cartoon or anime; Streamer Stories carry no brand at all (no end
card, logo, tagline, sonic logo, companion); the song starts at once with the "Based on a true story"
sticker; subtitles show the written lyric; every film ships with its story summary; songs at least
45 s and catchy; don't spend kie Suno credits via n8n unless I say so; the Story Fisher is manual
only; run the QA gate (0 flat objects, 0 text in platform UI zones, zoom sheets at 100%, an
independent reviewer agent) before showing me anything, and never judge detail on thumbnails.

This machine has a GPU, so do NOT set the `CHROME` environment variable (that is the cloud's software
renderer). Before any work:

1. Check the tools: git, bun, Chrome, ffmpeg, python (with sherpa-onnx, soundfile, librosa, pillow,
   openpyxl). Tell me what is missing and how to install it; don't install system software without
   asking.
2. `cd brand-video/app`, `bun install`, `bunx tsc --noEmit -p .`, then render one still of ST-01 at
   23.5 s and measure a few frames with `bun scripts/render.ts perf --from 22 --to 23 --samples auto`.
   Report the speed and estimate the 4K 60 fps level-8 build time.

Where we are: ST-01 "The train ride" is built at 1080p60
(`films/ST-01_train-ride/release/ST-01_train-ride_1080p60.mp4`) and is in my review; the animatic v4
is approved. Open items are in HANDOFF.md (my review, the permission DM to the Reddit author, approving
DESCRIPTION.md, the optional level-8 polish and 4K build, then the next Streamer Stories ST-02 to
ST-10 from the media plan).

Then ask me which of these to do first. Commit with clear messages and push to the same branch when a
step is done.

---
