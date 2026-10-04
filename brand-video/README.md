# Chobbot brand videos

Code-rendered, music-driven brand films for Chobbot: product functions and the pain points of
streamers, cut to our own song. This folder is separate from the Venmar × Quest music video
(branch `claude/zealous-newton-7zpeja`) and from any other experiment: nothing here depends on them,
and nothing there is changed by work here.

**Status (2026-10-04):** the first film, ST-01 "The train ride", is built at 1080p60
(`films/ST-01_train-ride/release/`) and in owner review. **Start with [`HANDOFF.md`](HANDOFF.md)**
(status, open items, local setup) and [`NEXT_SESSION_PROMPT.md`](NEXT_SESSION_PROMPT.md). The film
workflow is the skill `.claude/skills/chobbot-film/SKILL.md`.

## Read first

- [`plan/Chobbot_Media_Plan_v0.1.xlsx`](plan/Chobbot_Media_Plan_v0.1.xlsx): **the working plan.** One tab per
  section (Streamer Stories · Brand Generic A/B · Brand Master A/B), shared assets, status dropdowns.
- [`docs/SUNO_GUIDE.md`](docs/SUNO_GUIDE.md): how we make the songs in Suno (settings, style field, lyrics tags,
  length ≥ 45 s, picking a take). Per-film prompts and lyrics: tab **Story & Song** in the plan.
- [`docs/STYLE_DECK.md`](docs/STYLE_DECK.md): mixed art styles per film, only the ones we render well; characters as
  pixel/voxel sprites, silhouettes or the mascot.
- [`docs/STORY_FISHER.md`](docs/STORY_FISHER.md): the n8n workflow that collects real streamer stories from Reddit.
- [`docs/SERIES.md`](docs/SERIES.md): **the plan.** Four sections (Streamer Stories MVs, Brand · Generic A
  majestic explainers, Brand · Generic B music videos, the master brand film), the parallel Vision track (majestic, score instead of
  song), the product model they show, and the consistency system.
- [`docs/PIPELINE.md`](docs/PIPELINE.md): **the work order.** Brief → script → music → analysis →
  style frames → assets → animatic → build, with an approval gate at each step.
- [`docs/SCRIPT_TEMPLATE.md`](docs/SCRIPT_TEMPLATE.md): the two-column script every film starts from.
- [`docs/USE_CASES.md`](docs/USE_CASES.md): **why streamers need it.** Personas, 16 pain points
  across the streamer's journey, needs, 8 use cases as scenes, objections, proof to collect, and how
  to validate the pain points.
- [`docs/PROMPT_goignon_overview.md`](docs/PROMPT_goignon_overview.md): a prompt for a local model to
  audit the earlier `goignon` project on your PC.
- [`docs/RESEARCH.md`](docs/RESEARCH.md): what `mexicat/pdoom-video` is, how it reaches its quality,
  and what this repo already has from it.
- [`docs/TIER_LIST.md`](docs/TIER_LIST.md): the quality tier list (D → S+), the rendering (渲染)
  effects at each tier, costs, and the proposed level for our first film.
- [`docs/CONCEPT.md`](docs/CONCEPT.md): the proposed film: character, camera angles, scenes, and the
  song brief to write the track against.
- [`docs/NEEDS.md`](docs/NEEDS.md): what we need from you, and what the machine needs, to reach the
  top tier.

## Planned layout (created when production starts)

```
brand-video/
  docs/          research, tier list, concept, pipeline
  docs/scripts/  one approved script per film
  plan/          the media plan spreadsheet
  brand/         design tokens (colours, fonts, logo SVG) exported from the web design
  docs/inputs/   reports and material from you (e.g. the goignon overview)
  kit/           the shared brand kit in code: companion stages, palette, type, end card
  films/<name>/  one folder per film: audio/, data/, app/ (engine + scenes), out/ (renders, not committed)
                 e.g. films/ST-01_train-ride (named like its script in docs/scripts/)
```

Each film gets its own folder so cut-downs (16:9 hero, 9:16 social, 1:1) and later films never mix.
