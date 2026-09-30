# Research: `mexicat/pdoom-video` — what it is, and what "max level" takes

## What it is (it's not a Claude "skill" — it's a code-rendered music-video engine)

[mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) is the full source of a music video
("I'm Upping My P(doom)") that was designed and coded with Claude in Claude Code. There is no
`SKILL.md` or prompt pack: the "skill" is the **method and the engine**:

| Layer | What pdoom-video does |
|---|---|
| **Timing data** | Demucs stems + CTC forced alignment cross-checked with Whisper → `data/lyrics.json` (word/syllable timings); beat/downbeat/section/onset analysis → `data/audio.json` (132 BPM grid, kick/snare/hat/vocal onsets, 8 envelopes at 100 fps). |
| **Renderer** | TypeScript + three.js in the browser (bun + Vite). Every frame is a **pure function of song time `t`**, so the live preview and the offline export are identical. |
| **Scenes** | One module per "plate" (`src/scenes/*.ts`), each a class with `render(frame, target)` that fully overwrites an HDR linear render target and returns post overrides. |
| **Timeline** | `src/timeline.ts` anchors scene cuts to lyric lines and snaps them to the beat grid — nothing is hand-timed. |
| **Post** | Bloom pyramid, halation, chromatic aberration, tone shoulder, film grain, vignette, fades/flash/shake/zoom. |
| **Typography** | Real kerning (opentype.js), Archivo width/weight animation, single-stroke plotter fonts, per-word karaoke sync. |
| **Export** | `scripts/render.ts` drives headless Chrome, streams raw frames over a WebSocket into ffmpeg (x264), with **adaptive motion blur** (4 → 324 sub-frames per frame until the error < 3/255). 1080p60 or true 4K60. |

Its quality comes from three things working together: **(1) exact music data**, **(2) a strict
determinism contract** (so every frame can be re-rendered, sampled, and checked), and **(3) an
art-direction bible** (`docs/TREATMENT.md`) that every scene obeys.

## What I built from it for this song

This repo forks the engine (MIT, credited in `LICENSE.pdoom-video`) and replaces everything
song-specific:

- **Audio + lyric analysis for "Ferrugem Na Fenda x Cowbell Infection"** (132.9 BPM, 2:46) — `analysis/`.
  The container has no Hugging Face / PyTorch access, so Demucs/Whisper were impossible; instead:
  Spleeter vocal stem (weights from GitHub) + PocketSphinx forced alignment run forward and backward,
  with the song's 2-bar line grid resolving disagreements (`analysis/align/README.md`). Added a
  **cowbell onset track** (`bell`) because this is phonk: the cowbell drives flashes, glitches, lightning.
- **Voxel characters** — Venmar and Quest rebuilt from the 32×32 pixel sheet and extruded into 3D
  ("inflated" depth), with hinged wings/tail/arms, blink and mouth poses, and shader effects: ghost
  hologram, dissolve, glitch, flash, rim lights (`app/src/engine/voxel.ts`, `app/src/sprites/sprites.ts`).
- **World kit** — camera-aware sky with the burning rift, instanced rusted city with procedural windows
  and an "infection" spread, wet streets, rain, embers, speed lines (`app/src/engine/world.ts`).
- **Render effects (渲染)** added to the post chain: RGB split, VHS/datamosh glitch, CRT scanlines +
  slot mask, pixelate, Bayer dither, colour grade (gain/lift/saturation/contrast), light leak, frame roll,
  letterbox, camcorder REC overlay, singer tag (`app/src/engine/post.ts`, `hud.ts`).
- **17 scenes** synced to the aligned lyrics (see `docs/TREATMENT.md`).
- **Performance work for a GPU-less machine**: fractional preview scales, post-FX compiled per active
  feature set, quarter-res bloom, software-backed UI canvas, 1/3-res sky — about 0.45–0.7 s per 1080p
  frame on 4 CPU cores (SwiftShader).

## What "max level" needs — the honest gap list

What limits the current render, roughly in order of impact:

1. **A real GPU.** Everything here renders on the CPU (SwiftShader). On a Mac/PC with a GPU the same
   code runs ~50–100× faster, which unlocks the rest of this list. To use it, run the renderer on your
   machine (see README): `bun scripts/render.ts video --samples auto --shutter 0.2 --scale 2`.
2. **60 fps + adaptive motion blur + 4K.** This render is 1080p30 with 2 sub-frames. pdoom-video's
   max setting is 3840×2160 at 60 fps with up to 324 sub-frames per frame (`--scale 2 --samples auto`).
   All scenes here are stateless, so adaptive sampling works as-is.
3. **Better stems and alignment.** With network access to model hubs: Demucs `htdemucs_ft` + a
   mel-band-roformer karaoke model for the lead vocal, then Whisper/CTC word alignment (the pdoom
   `analysis/` pipeline). The current PocketSphinx alignment is solid for dense verses but rough on
   held notes and the sparse outro.
4. **Hand review against the audio.** I can't listen to the song, so timing was verified from the
   analysis rather than by ear. A human pass in the preview (`bunx vite`, space to play, `[`/`]` to jump
   scenes, `l` to loop one) will find the moments to nudge.
5. **Character art depth.** The voxel models come from 32×32 sprites. For a bigger level-up: 64×64
   sprites (more facial detail), a few hand-drawn pose frames (run cycle, sit, point, roar), or proper
   low-poly 3D models of both characters.
6. **More scene-specific shaders.** pdoom's best plates use ray-marched 3D and custom GLSL per scene.
   Candidates here: a ray-marched rift interior for the intro, volumetric light in the throne, fluid
   ink for the "painted me dark" brush.
7. **An art-direction pass with you.** Colour grade per section, how much glitch, how often the
   characters appear. Everything is data-driven: each scene returns its post overrides, so changes are
   quick.

## What I need from you to go further

- **Listen to the render and give me timestamps** of anything off (a cut, a lyric, a hit).
- **Confirm the singer mapping**: I assumed singer A = Venmar and singer B = Quest (the artist tag is
  `venmar_lupus_et_vulpes`).
- **Optional:** higher-res character art or pose sheets, and whether "him" (the hooded shadow with red
  eyes I invented for the lyrics' antagonist) should look different.
- **To go 4K60:** run the render on a machine with a GPU (a one-line command, see README).
