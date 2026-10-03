# Research: `mexicat/pdoom-video`, and what it means for brand videos

## What it is

[mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT) is the full source of the music
video "I'm Upping My P(doom)", designed and coded with Claude in Claude Code. It is not a Claude skill
(there is no `SKILL.md`). It is an **engine plus a method**:

| Layer | What it does |
|---|---|
| Timing data | Demucs stems, CTC forced alignment cross-checked with Whisper → word and syllable timings (`data/lyrics.json`); beats, downbeats, sections, kick/snare/hat/vocal onsets and 8 loudness envelopes (`data/audio.json`). |
| Renderer | TypeScript + three.js in the browser (bun + Vite). Every frame is a pure function of song time `t`, so the live preview, a still and the export are the same image. |
| Scenes ("plates") | 17 modules, ~19.6k lines. Each one fully overwrites an HDR linear render target and returns post overrides. Several are ray-marched 3D in GLSL (shoggoth, paperclips, the Ilya room). |
| Timeline | Cuts are anchored to lyric lines and snapped to the beat grid. Nothing is hand-timed. |
| Post (渲染) | Bloom pyramid, halation, chromatic aberration, tone shoulder, film grain, vignette, flash, shake, zoom, invert. |
| Typography | Real kerning (opentype.js), animated Archivo width and weight, single-stroke plotter fonts, per-word karaoke sync. |
| Export | Headless Chrome → raw frames over WebSocket → ffmpeg. Adaptive motion blur: 4 → 324 sub-frames per frame until the error is under 3/255. Output is 1080p60 or a true 4K60. |
| Art direction | `docs/TREATMENT.md`, a style bible: one palette, one type system, one recurring motif (the spark), hard cuts on downbeats, and an explicit "not slop" list. |

The 4K render of the whole song took about 2.5 h on an M5 Pro, as two parallel pipelines of about
9 GB each.

## Why it looks expensive

1. **Exact music data.** Every hit, cut and word lands on the audio because it comes from analysis.
2. **The determinism contract.** Any frame can be re-rendered, supersampled and checked as a still.
3. **A written bible that every scene obeys.** Each plate looks different, but all of them share the
   palette, the type and the humour.
4. **Strong motion grammar.** Holds, then snaps (`outExpo`, springs). Cuts land on downbeats. Nothing
   floats like a screensaver.

## What this repo already has (other branches, for reference only)

- `claude/zealous-newton-7zpeja`: the Venmar × Quest music video built on pdoom's engine. It adds
  voxel 3D characters with a hip-hop move library, a rift city world kit, god rays, rain and puddles,
  set dressing, VHS/CRT/dither/light-leak post, and an anime cel key frame. It also holds the
  **`medium-lens-film` skill**, which has the quality levels (`references/07_quality_levels.md`) and
  the approval protocol (`references/08_quality_bar_protocol.md`). **That is the "design level"
  skill.** The tier list in this folder follows its levels and plan card.
- `film-b` (removed on 30 Sep at your request): a 40 s vertical test on the same engine.

The brand project reuses the **engine and method**, not those films' characters, palette or scenes.

## What changes for brand videos (vs. a music video)

| Music video | Brand video |
|---|---|
| The lyrics are the content | The **product functions and the pain points** are the content. The song carries them. |
| Any length | A 45–60 s hero film, plus 15 s and 6 s cut-downs in 9:16 and 1:1 |
| A free palette | **Brand tokens**: colours, fonts and logo from the web design, applied through one palette file, so a late redesign is a one-file change |
| Invented UI is fine | Product UI has to be **recognisably ours**. While the web design is unfinished, UI shots are built as code stand-ins that read the tokens, so they update when the design lands. |
| Story first | The message has to read **without sound** (social autoplay). Key words are on screen, not only sung. |

Rules carried over from pdoom's bible, because they fit a brand:
- No imitation of real platforms' UIs or logos (Twitch, YouTube, Kick). Chat and streams are drawn
  generically, in our own style.
- No stock "AI" imagery (glowing brains, Matrix rain, purple/cyan neon soup).
- Only the brand's accent colour blooms. Type stays crisp and is never haloed.
