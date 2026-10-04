# Chobbot · project instructions for Claude Code

This repo is the owner's Chobbot video production: code-rendered music videos (Streamer Stories,
Brand · Generic A/B, Brand · Master A/B). Everything lives in `brand-video/`. The working method is
the skill `.claude/skills/chobbot-film/SKILL.md`; use it for all film work and obey every owner rule
in it (quality level 6–10, approval gates, facts only from the post, no brand in Stories, the QA gate
before showing anything).

## How the owner works with you: "go"

The owner does not want to read long reports or make small decisions. When the owner says **go**
(or anything like it), do this:

1. If this is the first time on this machine (no `brand-video/app/node_modules`), run **Setup**
   below first.
2. Open `brand-video/HANDOFF.md`, section **Task queue**, take the first item that is not done, and do
   it fully: build, QA gate, independent reviewer agent, fixes, commit, push.
3. Stop only at an **approval gate** (script, song, style frames, animatic, final video, post
   description) or when you need something only the owner can do (a login, a Suno song file, a
   Reddit DM, installing system software). Then say in **one or two short lines** what you need and
   what you recommend, so a plain "go" means "yes, do your recommendation".
4. When an item is done, mark it done in the Task queue, add anything learned to the skill's
   lessons, commit and push to `claude/epic-davinci-nrw2em`, and continue with the next item until a
   gate.
5. Keep `brand-video/HANDOFF.md` current at the end of every session (status, decisions, queue).

Defaults when the owner doesn't answer a question: take the recommendation you gave, note it under
"Decisions" in HANDOFF.md, and keep it easy to reverse.

## Setup (Windows PC with a GPU)

- Tools: git, bun, Google Chrome, ffmpeg, Python 3.11+ (`pip install sherpa-onnx soundfile librosa
  pillow openpyxl`). Install Python/bun packages yourself; ask once before installing system software
  (`winget install Gyan.FFmpeg`, `powershell -c "irm bun.sh/install.ps1 | iex"`).
- `cd brand-video/app && bun install && bunx tsc --noEmit -p .`
- **Never set the `CHROME` env var here** (that is the cloud's slow software renderer); unset, the
  renderer uses the installed Chrome and the GPU.
- Smoke test: `bun scripts/render.ts stills --film ST-01_train-ride --t 23.5 --samples 12 --out ../films/ST-01_train-ride/out/test`
  and `bun scripts/render.ts perf --from 22 --to 23 --samples auto`; note the speed in HANDOFF.md.
- Story work needs the n8n MCP connector (Story Fisher, Story Context). If it isn't connected, say so
  in one line and work on build items meanwhile.

## Git

- Branch `claude/epic-davinci-nrw2em`; commit small, clear messages; push after each finished step.
- Never commit `brand-video/films/*/out/` or any file over 100 MB (GitHub refuses them). Keep big
  renders in `out/`; put a posting copy under 100 MB in `films/<id>/release/`.
