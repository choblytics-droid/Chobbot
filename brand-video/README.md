# Chobbot brand videos

Code-rendered, music-driven brand films for Chobbot: product functions and the pain points of
streamers, cut to our own song. This folder is separate from the Venmar × Quest music video
(branch `claude/zealous-newton-7zpeja`) and from any other experiment: nothing here depends on them,
and nothing there is changed by work here.

**Status:** planning. Next step: briefs and scripts (`docs/PIPELINE.md`). Nothing is built until a
script is approved and its audio exists. The website design is still in production.

## Read first

- [`plan/Chobbot_Media_Plan_v0.1.xlsx`](plan/Chobbot_Media_Plan_v0.1.xlsx): **the working plan.** One tab per
  section (Streamer Stories · Brand Generic A/B · Brand Master A/B), shared assets, status dropdowns.
- [`docs/STORY_FISHER.md`](docs/STORY_FISHER.md): the n8n workflow that collects real streamer stories from Reddit.
- [`docs/SERIES.md`](docs/SERIES.md): **the plan.** Three series (Streamer Stories MVs, Pain → Need →
  Function explainers, the master brand film), the parallel Vision track (majestic, score instead of
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
                 e.g. films/stories-01-*, films/pain-01-*, films/master
```

Each film gets its own folder so cut-downs (16:9 hero, 9:16 social, 1:1) and later films never mix.
