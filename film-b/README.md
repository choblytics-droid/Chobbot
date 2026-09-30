# Code Film — version B (vertical, 40 s)

A code-rendered music video for **"Ferrugem Na Fenda x Cowbell Infection Tribute (Mashup)"**
(venmar_lupus_et_vulpes), 1080×1920 at 60 fps. It's the "pure generic" take: no lyrics and no
story. Every image is the song's own data (waveform, 48-band spectrum, the detected
kick/clap/hat/cowbell hits and the beat grid), set in one palette and one type system, with every
cut on a downbeat.

The method and most of the engine come from
[mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT, see `LICENSE.pdoom-video`),
the project the `code-film` skill was distilled from. It is adapted here from landscape to portrait,
from lyric-driven to audio-driven, and from a local GPU to a headless SwiftShader box.

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

| plate | clip time | idea |
|---|---|---|
| `riser` | 0 → 3.61 | count-in: the spark climbs a meter one tick per beat; the numeral 8 → 1 condenses and gets heavier |
| `scope` | 3.61 → 10.83 | **the drop**: a portrait oscilloscope drawing the real waveform, time running down; one instrument setting per bar (1-beat sweep, 1-bar sweep, FFT, 1/8 sweep ×2 gain), strobing to paper |
| `grid` | 10.83 → 18.05 | bone paper: the detected pattern as a step-sequencer sheet, cells stamped as they sound, width = velocity, the cowbell the only orange; blacked out from the top on the last beat |
| `rings` | 18.05 → 25.26 | the spark emits a ring every 25 ms shaped by that instant's spectrum; kick rings burn orange, each clap snaps a 1/16 turn; flat / cone / inward / spin, then the break collapses it |
| `slam` | 25.26 → 32.48 | a hit log in kinetic type (KICK / CLAP / BELL with timestamp and velocity), one page per bar, ink → bone → signal → ink |
| `infect` | 32.48 → 39.70 | a 9×16 field infected one ring per bell/kick, the count rolling up to 100 %, strobing, shrinking, pulled into the spark at the break |
| `end` | 39.70 → 40.00 | the last downbeat detonates the spark; under the flash is frame 0, so the video loops |

## Run it

```sh
# analysis (numpy, scipy, soundfile + ffmpeg): writes data/audio.json, data/scope.bin, audio/clip.wav
python3 analysis/analyze.py

cd app && bun install
bunx vite                                  # preview at http://localhost:5173 (space, ←/→, [ ], l, h)
bun scripts/render.ts stills --t 5,12,20 --only scope,grid,rings --out ../out/stills
bun scripts/render.ts video --samples 4 --shutter 0.3 --out ../out/film-b.mp4
```

Without a local GPU, set `CHROME=/path/to/chromium` to render through SwiftShader WebGL2. That is
about 0.4 s per frame here, so render long ranges as parallel `--from/--to` segments and
concatenate them. `FFMPEG=` points at a specific ffmpeg binary.
