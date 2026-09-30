# 07 — Quality levels: one master list + an options menu

One scale from 1 to 10. Each level is an **amount of craft effort**. You spend it on **many styles**
(breadth), on **1–2 styles pushed to the limit of rendering** (depth), or a **mix**. It's one skill
with many options, and a project uses only the ones it needs. Lines and hours are results, never
targets (see `08_quality_bar_protocol.md`).

Anchors: Level 1 = our first Venmar × Quest MV (~4k lines, one pass). Level 10 = 《光先到》 (~27k
lines, ~16 h, 28 styles and 4 hero shots).

## Master list (Opus 5.5; % of weekly allowance, including a +30% rework buffer)

| Lvl | Lines | Work time | **Pro** | **Max 5×** | **Max 20×** | Breadth path (many styles) | Depth path (1–2 styles, max render effects) | Mixed example | GPU render (final) |
|---|---|---|---|---|---|---|---|---|---|
| **1** | ~4k | 3–4 h | 20–26% | 4–5% | ~1% | 1 look, one pass per scene | basic lighting + post | our first MV | minutes (1080p) |
| **2** | ~6k | 4–5 h | 26–33% | 5–7% | 1–2% | + 2–3 light styles | + soft shadows, AO, real materials, depth of field | 1 deep look + 1 flash style | low |
| **3** | ~8k | 5–6 h | 33–39% | 7–8% | ~2% | + 5–6 styles, material transitions | + volumetric fog/god rays, rain splashes, wet reflections, secondary motion | 1 deep look + 3 styles on the chorus | low–medium |
| **4** | ~10k | 6–7 h | 39–46% | 8–9% | ~2% | 8 styles with bibles, cuts on the music | + bounce light, PBR bloom, anamorphic flares, lens dirt | 2 deep looks + 3 styles | medium |
| **5** | ~13k | 7–8 h | 46–52% | 9–10% | 2–3% | 10–12 styles, mosaic reprise, each style's own text voice | + 2 fully dressed environments, lit particles | 2 deep looks + 5 styles + mosaic | medium |
| **6** | ~16k | 8–10 h | 52–65% | 10–13% | ~3% | 14 styles + 1 hero shot | + physical sky, volumetric clouds, volumetric rift, 60 fps motion blur | 2 deep looks (D6) + 6 styles | medium–high |
| **7** | ~19k | 10–11 h | 65–72% | 13–14% | 3–4% | 18 styles as real objects in light | + film pipeline: stock grain, halation, gate weave, per-shot grade | 2 deep looks (D7) + 8 styles | high |
| **8** | ~22k | 11–13 h | 72–85% | 14–17% | ~4% | 22 styles, a custom transition every cut, nested pull-back ending | + custom camera choreography and set dressing per shot | 2 deep looks (D8) + 10 styles | high |
| **9** | ~25k | 13–14 h | 85–91% | 17–18% | 4–5% | 26 styles, hidden details, synced sound design | + simulation: cloth, smoke/ink, voxel destruction, crowds | 2 deep looks (D9) + 12 styles | very high |
| **10** | ~27k+ | 14–16 h | 91–104% | 18–21% | ~5% | 28–30 styles, 4 hero shots, sound in code (《光先到》 level) | every shot a hero shot with its own bible, 4K60 path-traced look | 2 deep looks (D10) + 14 styles | very high (20–60+ GPU h at 4K60) |

Name a level with its path: **"level 7"** (let the model pick the path), **"level 7 breadth"**,
**"level 7 depth"** (also written **D7**), or **"level 7 mixed"**.

## Options menu (pick any; the sum of the picks is the level)

Costs are Opus agent-hours before the rework buffer. Convert with: **Pro ≈ 6.5% per hour, Max 5× ≈ 1.3%,
Max 20× ≈ 0.33%** (+30% rework included).

| Group | Option | Hours | What it gives |
|---|---|---|---|
| **Base** (always) | Audio analysis + lyric alignment + timeline + scenes in one look | 3–4 | a complete synced video (Level 1) |
| **Breadth** | Light style (~300 lines: look + 3–5 defects) | 0.25 | a flash in a montage |
| | Medium style (~500–600 lines: bible + 6–8 defects + text voice) | 0.4 | holds 1–3 s on screen |
| | Deep style (~800–1,300 lines: full bible, object in light, 10–15 defects) | 0.7 | holds a whole section |
| | Custom material transition (burn, bleed, shatter, print…) | 0.15 each | cuts that feel made, not wiped |
| | Mosaic / wall-of-styles reprise | 0.3 | the "everything at once" moment |
| **Depth** | Lighting pack (soft shadows, AO, materials, DoF) | 1 | D2 |
| | Atmosphere pack (fog, god rays, rain splashes, wet reflections) | 1 | D3 |
| | Light-transport pack (bounce light, PBR bloom, flares, lens dirt) | 1 | D4 |
| | Environment dressing (props, interiors, signage), per environment | 1.5 | D5 |
| | Sky + volumetrics + 60 fps motion blur | 1.5 | D6 |
| | Film pipeline (stock grain, halation, gate weave, grade) | 1 | D7 |
| | Camera choreography + per-shot set dressing | 1.5 | D8 |
| | Simulation pack (cloth, smoke/ink, destruction, crowds) | 2 | D9 |
| | Hero-shot bible (a shot built like `shot_room`/`shot_eye`), per shot | 1.5 | D10 |
| **Structure** | Nested pull-back ending (frame in frame in frame) | 0.7 | the 《光先到》 ending move |
| | Proof ending (source code, style wall, A/B split) | 0.5 | credits that show the craft |
| | Typography voices (text in each style's own genre) | 0.5 | in-world text |
| **Sound** | Silence + one big hit synced to the picture | 0.3 | the biggest single effect |
| | Synthesized SFX layer (whine, heartbeat, boom, per-style sounds) | 1 | sound design in code |
| | Hidden spectrogram title / easter eggs | 0.3 | a craft signature |

Worked example: Base (3.5) + lighting (1) + atmosphere (1) + film pipeline (1) + 4 medium styles
(1.6) + 4 transitions (0.6) + silence/hit (0.3) = **9 h ≈ Level 6–7 mixed** ≈ **58% of a Pro week**,
12% of Max 5×, 3% of Max 20×.

## How the numbers are estimated

- **Verified lines per agent-hour:** ~1,700–2,000 (write → render stills → look → fix, 2–4 rounds).
- **Tokens:** agent sessions re-send their context on every request, so it's mostly cached input
  plus a small amount of output. Per 1,000 verified lines: ~40–80 requests, ~5–10 M cached input
  tokens, ~60–120 k output tokens. Level 10 ≈ 140–250 M tokens in total, ~2–3 M of them output.
- **Plan assumptions** (not official; Anthropic doesn't publish limits in tokens):
  - A Pro week ≈ 60 Sonnet-hours ≈ **20 Opus agent-hours**.
  - Max 5× ≈ 5 Pro weeks; Max 20× ≈ 20 Pro weeks.
  - A 5-hour window ≈ 2 Opus agent-hours on Pro; on Max you can work the whole window.
- **GPU render time is separate** (no tokens). It grows fastest on the depth path.

## Calibrate to your account (once)

1. Note the weekly bar in claude.ai → Settings → Usage (or `/usage`).
2. Run one option (e.g. one medium style, or the lighting pack).
3. Note the bar again: **your % per hour = % used ÷ hours worked**. Replace the three per-hour rates
   above and every row rescales.

## Saving levers (any path)

- One style or pack per session, `/clear` in between.
- `/effort` lower for routine loops, high for bibles, planning and critique.
- Review with contact sheets, not many full-size stills.
- Write the bible first: it roughly halves the fix rounds.
- Mix cheap "recording" styles (halftone, thermal, CRT, wireframe) with expensive redrawn ones.
- Depth shows in long holds and high resolution. Pace fewer, longer shots, and upload in 4K.
