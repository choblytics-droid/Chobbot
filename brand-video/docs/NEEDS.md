# What we need to reach the top tier

## From you

| # | Item | Why | Needed for |
|---|---|---|---|
| 1 | **Product functions**: the 3–6 features to show, one sentence each, in priority order | Each becomes one beat of the drop (scene 6) | any tier |
| 2 | **Pain points**: the real ones from streamers, in their words if possible | They become the verse scenes and the song lyrics | any tier |
| 3 | **The song**: MP3/WAV + the exact lyric text, ideally with vocal/instrumental **stems** | Word-level sync and the beat grid come from it | any tier |
| 4 | **Brand tokens**: colours (hex), fonts (files + licences), logo as SVG, product name/URL | One palette file drives every shot | any tier; UI shots can use stand-ins until the web design is finished |
| 5 | **Web design screens** when ready (Figma export or screenshots) | Product UI shots switch from stand-ins to the real design | B and up |
| 6 | **Mascot or character art**, if there is one (a sprite sheet or turnaround) | Makes Chobbot a 3D character instead of a spark | optional |
| 7 | **The level you approve** (or "go" on the proposed Level 6 mixed) | The skill's protocol: no build before a go | before building |
| 8 | **Review notes by timestamp** after each checkpoint | I can't hear the audio; timing is checked from the analysis | every checkpoint |
| 9 | **Where it goes**: platforms and aspect ratios (16:9, 9:16, 1:1), max length | Safe areas and cut-downs are planned from the start | before building |

## From the machine

| Need | This container | For the top tier |
|---|---|---|
| GPU | None: SwiftShader on 4 CPU cores, ~0.5 s per 1080p frame | A Mac with Apple silicon or a PC with a recent GPU: ~50–100× faster. 4K60 with adaptive motion blur and ray-marched shots is only practical there. |
| Stem separation / alignment models | Hugging Face is unreachable here (the Venmar film had to use Spleeter + PocketSphinx) | Demucs `htdemucs_ft` + Whisper/CTC alignment (the pdoom pipeline), or stems exported from the song tool |
| Tools | bun, ffmpeg, node, python, uv are installed | Same, plus Chrome on the render machine |
| Disk | Fixed per-session allowance | ~10–15 GB per 4K60 master (grain is expensive to encode) |

**Plan that works today:** build and review everything here (stills, contact sheets, 1080p drafts),
then run one command on a GPU machine for the 4K60 master:

```sh
bun scripts/render.ts video --scale 2 --samples auto --shutter 0.2 --out ../out/hero-4k.mp4
```

## Order of work

See [`PIPELINE.md`](PIPELINE.md): brief → script → music → analysis → style frames → assets →
animatic → build. Nothing is built before the script is approved and the audio exists.
