# Code Film — version B (vertical, 40 s)

A code-rendered music video for **"Ferrugem Na Fenda x Cowbell Infection Tribute (Mashup)"**
(venmar_lupus_et_vulpes), 1080×1920 at 60 fps. It's built from the song itself: the cover art's
world (a rainy neon alley at night, a rusted door in a cracked stone wall, a small sheet ghost) and
the words actually sung, synced word by word. Every cut lands on a downbeat, and the percussion
drives the motion.

The method and most of the engine come from
[mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT, see `LICENSE.pdoom-video`),
the project the `code-film` skill was distilled from. It is adapted here from landscape to portrait
and from a local GPU to a headless SwiftShader box. The first, lyric-less data-panel take is still
in the code: `?cut=generic` / `--cut generic`.

## What was taken from pdoom-video

- **Every frame is a pure function of time.** Scenes are `render(f: Frame, out)` with no state.
  Randomness is `hash()`/`mulberry32`, and per-frame flicker uses `frameIdx(t)`. So the preview,
  a still and the export are the same image, and motion blur can average sub-frames in any order.
- **The analysis drives the edit.** A constant-tempo grid is fitted to onset flux, with the phase
  refined on kick attacks. Downbeats come from where the breakdown and drop land. The timeline
  (`app/src/timeline.ts`) cuts on the analysed phrase map, never on hand-typed times.
- **One engine, many plates.** `app/src/engine/` is pdoom's engine: an HDR linear render target,
  `FSPass`, `Layer2D`, `LineBatch` GPU capsules, and the post chain (bloom pyramid, halation, CA,
  tone shoulder, grain, vignette, flash/shake/zoom). Each plate has its own idiom but shares the
  palette (ink / bone / signal orange), the type (Archivo widths × weights, IBM Plex Mono as the
  machine voice) and the recurring **spark**.
- **The treatment rules.** Big changes land on the beat: hard cuts on downbeats, slams on hits,
  strong eases (`outExpo`) with holds and snaps. Colour is restrained, and only the signal colour
  blooms. No outlined type. The mono annotations keep a deadpan, instrument-panel voice.
- **The offline renderer.** `app/scripts/render.ts` drives headless Chromium and streams raw RGBA
  over a WebSocket into ffmpeg (x264, BT.709 tags), with `stills`, `sheet`, `perf` and `video`
  modes.

## The edit (clip = song 35.975 s → 75.975 s, 133.0 BPM)

| plate | clip time | lyric | image |
|---|---|---|---|
| `alley` | 0 → 3.61 | …king of the shadows in his broken heart / He told me everything | dolly down the cover's alley; each sung word lights its own blade sign (BROKEN buzzes, HEART cracks) |
| `door` | 3.61 → 10.83 | oh, I hope he was the worst / I'm the ghost in his mind, I'm the beautiful curse | **the drop lands on "oh"**: the wall cracks from the rusted door, ghost light leaks out; the ghost slips out through the slit on "ghost"; rust spreads across the stones on "curse" |
| `legend` | 10.83 → 18.05 | yeah, keep the legend alive / I hope I'm the reason he can barely survive | LEGEND lights letter by letter, ALIVE snaps on; SURVIVE buzzes and dies tube by tube through the held note |
| `puddle` | 18.05 → 25.26 | (instrumental) | top-down puddle reflecting the signs and the ghost; every kick and cowbell hit is a drop; time freezes at the break |
| `wall` | 25.26 → 32.48 | He's talking loud, keep spreading the infection / Building a wall, seeking protection | TALKING LOUD sized by the song's loudness; the infection spreads brick by brick per cowbell/kick; a new wall stacks up one course per 8th; the ghost sits on top |
| `toxic` | 32.48 → 39.70 | And he tells you I'm toxic, he tells you I'm the end / Burning every bridge, losing every friend / But, but, but every word… | the lyric as neon: TOXIC drips, THE END slams, a neon bridge burns and falls, FRIEND's letters drop, three BUTs; power cut at the break |
| `loop` | 39.70 → 40.00 | …speaks | SPEAKS flashes on the last downbeat over frame 0, so the video loops |

## Lyrics and timing

- `analysis/analyze.py`: beat grid, downbeats, drop, phrase map, onsets (kick / clap / hat / cowbell),
  spectrum and waveform (`data/audio.json`, `data/scope.bin`, `audio/clip.wav`).
- `analysis/vocals_asr.py`: vocal stem (`audio-separator`, UVR-MDX-NET-Voc_FT), then
  Parakeet-TDT-0.6B (sherpa-onnx, token timestamps) and Whisper-small as a text cross-check. Models
  come from GitHub releases, because Hugging Face is blocked in this environment.
- `analysis/lyrics.py`: the corrected lines, matched word by word to the recogniser's timestamps
  (88/88 matched) → `data/lyrics.json`. One phrase no model agreed on ("…of you," after "curse") is
  left out. If you have the official lyrics, edit `LINES` there and rerun.

## Run it

```sh
# analysis (numpy, scipy, soundfile + ffmpeg): writes data/audio.json, data/scope.bin, audio/clip.wav
python3 analysis/analyze.py
# lyrics (audio-separator, sherpa-onnx + models in /home/user/models): data/lyrics.json
python3 analysis/vocals_asr.py && python3 analysis/lyrics.py

cd app && bun install
bunx vite                                  # preview at http://localhost:5173 (space, ←/→, [ ], l, h)
bun scripts/render.ts stills --t 5,12,20 --only door,legend,puddle --out ../out/stills
bun scripts/render.ts video --samples 2 --shutter 0.3 --out ../out/film-b.mp4
bun scripts/render.ts video --cut generic --out ../out/film-b-generic.mp4   # the first take
```

Without a local GPU, set `CHROME=/path/to/chromium` to render through SwiftShader WebGL2. That is
about 0.4 s per frame here, so render long ranges as parallel `--from/--to` segments and
concatenate them. `FFMPEG=` points at a specific ffmpeg binary.
