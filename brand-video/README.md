# Chobbot brand videos

Code-rendered, music-driven brand films for Chobbot: product functions and the pain points of
streamers, cut to our own song. This folder is separate from the Venmar × Quest music video
(branch `claude/zealous-newton-7zpeja`) and from any other experiment: nothing here depends on them,
and nothing there is changed by work here.

**Status:** research and planning. No song yet, and the website design is still in production.

## Read first

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
  docs/          research, tier list, concept, per-film treatments
  brand/         design tokens (colours, fonts, logo SVG) exported from the web design
  films/<name>/  one folder per film: audio/, data/, app/ (engine + scenes), out/ (renders, not committed)
```

Each film gets its own folder so cut-downs (16:9 hero, 9:16 social, 1:1) and later films never mix.
