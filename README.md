# Ferrugem Na Fenda x Cowbell Infection — Venmar × Quest music video

A generative, code-rendered cinematic music video for *Ferrugem Na Fenda x Cowbell Infection Tribute
(Mashup)* by venmar_lupus_et_vulpes, starring **Venmar** (singer A, the blue one) and **Quest** (singer B,
the orange one) as 3D voxel pixel characters. Every frame is a deterministic function of song time, so
the browser preview and the offline export match exactly.

Built on the engine of [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT, see
`LICENSE.pdoom-video`). What that project is, what was built here, and what "max level" would take:
**[docs/RESEARCH.md](docs/RESEARCH.md)**. Scene-by-scene plan: **[docs/TREATMENT.md](docs/TREATMENT.md)**.

## Layout

- `audio/song.mp3` — the track (its lyrics are embedded in the MP3's `lyrics-eng` tag).
- `analysis/analyze.py` — beat grid, downbeats, envelopes, kick/snare/hat/**cowbell**/vocal onsets → `data/audio.json`.
- `analysis/align/` — word-level lyric alignment (Spleeter vocals + PocketSphinx, forward/backward passes, bar-grid prior) → `data/lyrics.json`.
- `data/sections.json` — hand-labelled song sections.
- `app/` — the renderer (TypeScript + three.js, bun + Vite).
  - `src/sprites/sprites.ts` — Venmar, Quest and "him" as 32×32 pixel sprites with pose patches and moving parts.
  - `src/engine/voxel.ts` — voxel characters (inflated extrusion, hinged wings/tail/arms, ghost/dissolve/glitch shader), prop boxes, billboards.
  - `src/engine/world.ts` — sky with the rift, rusted city, wet streets, rain, embers, speed lines.
  - `src/engine/kinetic.ts`, `pixelfont.ts` — word-synced lyric typography (slams, karaoke, JRPG dialogue box, stacks) and a 5×7 pixel font.
  - `src/engine/post.ts` — bloom, halation, CA, RGB split, VHS glitch, CRT scanlines, pixelate, dither, grade, light leak, letterbox, grain.
  - `src/scenes/*.ts` — the 17 scenes; `src/timeline.ts` — cuts anchored to lyric lines on the beat grid.

## Preview

```sh
cd app
bun install
bunx vite
```

Open http://localhost:5173 (`?t=60` starts at 60 s; `&scale=0.5` for a faster half-res preview).
Keys: space play/pause, ←/→ seek, `,`/`.` frame step, `[`/`]` previous/next scene, `l` loop scene, `h` hide UI.

## Render

```sh
cd app
# what this repo's render used (GPU-less container, SwiftShader): 1080p30, 2 motion-blur sub-frames
bun scripts/render.ts video --fps 30 --samples 2 --shutter 0.5 --crf 18 --preset medium --out ../out/ferrugem-na-fenda.mp4
# max quality on a machine with a GPU: 4K60 with adaptive motion blur
bun scripts/render.ts video --scale 2 --samples auto --shutter 0.2 --out ../out/ferrugem-na-fenda-4k.mp4
```

Stills and contact sheets for checking work: `bun scripts/render.ts stills --only run --t 12,15.6`,
`bun scripts/render.ts sheet --from 60 --to 80 --n 12`. Needs bun, ffmpeg, and Chrome/Chromium
(`CHROME_PATH` to override).

## Regenerate the analysis

```sh
pip install librosa soundfile numpy scipy pocketsphinx
python3 analysis/analyze.py --vocals stems/song/vocals.wav --accomp stems/song/accompaniment.wav
```

See `analysis/align/README.md` for the stem separation and alignment steps.

## Credits

Song and characters: venmar_lupus_et_vulpes (made with Suno). Engine: mexicat/pdoom-video (MIT).
Fonts: Archivo, IBM Plex Mono, Cormorant Garamond (SIL OFL); Hershey/EMS stroke fonts.
