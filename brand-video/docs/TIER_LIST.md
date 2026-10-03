# Quality tier list (brand videos)

These tiers map one-to-one to the levels in the `medium-lens-film` skill
(`.claude/skills/medium-lens-film/references/07_quality_levels.md` on branch
`claude/zealous-newton-7zpeja`). Use "tier A" or "level 6" interchangeably. Following the skill's
protocol, a level is a **promise about craft**: lines and hours are what it costs, never targets.

There are three paths at every level:
- **Breadth:** many art styles (the 《光先到》 "same moment in 28 media" montage).
- **Depth (D):** 1–2 styles pushed to the limit of rendering: light, atmosphere, materials, camera, film.
- **Mixed:** one or two deep looks plus a short multi-style moment.

**For a 45–60 s brand film, depth or mixed is the right path.** Breadth needs runtime: at 28 styles,
each would be on screen for a fraction of a second, and the product message would get lost.

**Owner rule (2026-10-03): level 6 (tier A) is the minimum for every film.** Lower levels below
are reference only.

## The tiers

| Tier | Level | What it looks like | Rendering (渲染) effects added at this tier | Opus agent-hours | GPU final render |
|---|---|---|---|---|---|
| **D** | 1 | A clean synced motion-graphics video in one look | Bloom, grain, vignette, flash/shake/zoom on hits, word-synced kinetic type | 3–4 h | minutes (1080p) |
| **C** | 2–3 | Simple 3D, lit properly | + soft shadows, ambient occlusion, real materials (glass, brushed metal, screen glass), depth of field. + volumetric fog, god rays, rain and wet reflections, secondary motion (hair, cables, headset) | 4–6 h | low |
| **B** | 4–5 | Looks like a studio ad | + bounce light (monitor glow spilling onto faces and walls), PBR bloom, anamorphic flares, lens dirt. + 2 fully dressed environments (streamer room, "stream city") and lit particles | 6–8 h | medium |
| **A** | 6 | Cinematic | + physical sky, volumetric clouds and light, 60 fps adaptive motion blur (up to 324 sub-frames). + one hero shot (e.g. the camera through the monitor) | 8–10 h | medium–high |
| **A+** | 7 | Feels shot on film | + film pipeline: stock grain, halation, gate weave, per-shot colour grade, light leaks | 10–11 h | high |
| **S** | 8 | Directed | + custom camera choreography per shot (crane, dolly, whip, orbit), per-shot set dressing, a material transition on every cut (shatter, ink bleed, burn, glass), nested pull-back ending | 11–13 h | high |
| **S+** | 9–10 | 《光先到》 / pdoom 4K tier | + simulation (cloth, smoke/ink, voxel destruction, crowds of chat bubbles), synthesized sound design, hidden details. Every shot is a hero shot with its own bible; true 4K60 with a path-traced look | 13–16 h | very high (20–60+ GPU-hours at 4K60) |

Weekly plan cost (from the skill's master list, +30% rework included):

| Level | Pro | Max 5× | Max 20× |
|---|---|---|---|
| 4 (B) | 39–46% | 8–9% | ~2% |
| 6 (A) | 52–65% | 10–13% | ~3% |
| 8 (S) | 72–85% | 14–17% | ~4% |
| 10 (S+) | 91–104% | 18–21% | ~5% |

These figures are the skill's estimates, not measurements. Calibrate them on the first scene: note
your usage bar before and after one option, and rescale.

## Effects that are always on, at any tier

- Every cut lands on a downbeat; every slam lands on a kick or snare; every word lights as it's sung.
- Deterministic frames: any moment can be re-rendered, checked as a still and supersampled.
- Brand tokens drive every colour and font.

## The 渲染 shopping list (pick per shot)

| Light | Atmosphere | Lens / camera | Film / screen | Motion | Material |
|---|---|---|---|---|---|
| Key + rim + monitor spill | Volumetric fog | Depth of field (rack focus) | Film grain | Adaptive motion blur | Glass, screen reflections |
| Bounce light / AO | God rays through blinds | Anamorphic flares | Halation | Whip pans, crash zooms | Brushed metal, plastic |
| Soft shadows | Dust motes in light | Lens dirt, breathing | Chromatic aberration | Springs, squash and stretch | Fabric (hoodie, cable) |
| Emissive screens and LEDs | Rain on the window | Rolling shutter, shake | CRT / LED sub-pixel close-ups | Particle bursts on hits | Voxel / toy plastic |
| HDR bloom (accent only) | Volumetric clouds | Nested pull-back (eye → screen → city) | Datamosh glitch on the pain points | Cloth / smoke sim | Ink, paper |

## Proposed level for the first film (the skill's plan card)

```
QUALITY BAR — proposed Level 6, Mixed track  (Opus 5.5)
What you get:   Base: audio + lyric analysis + timeline + scenes (3.5 h)
                Lighting pack: soft shadows, AO, materials, DoF (1 h)
                Atmosphere pack: fog, god rays, rain on glass, dust (1 h)
                Light transport: monitor bounce light, PBR bloom, flares, lens dirt (1 h)
                Sky + volumetrics + 60 fps adaptive motion blur (1.5 h)
                4 medium styles for the "chat chaos" montage: CRT, halftone, thermal, wireframe (1.6 h)
                4 material transitions: shatter, glass, ink bleed, print (0.6 h)
                Silence + one big synced hit at the product reveal (0.3 h)
Why this level: 45–60 s needs depth more than breadth; two strong environments (the room and the
                stream city) carry the story; the product reveal is one hero moment.
Estimated:      ~17k lines · ~10.5 agent-hours · Pro ~68% · Max 5× ~14% · Max 20× ~3.5% of a week
Render:         1080p60 for review in this container (CPU only, ~0.5 s per frame and
                sub-frame: ~30 min per minute of footage without motion blur, several
                hours with it); 4K60 final on a machine with a GPU (about 1–3 h)
Checkpoints:    1) calibration: one shot at full depth + stills
                2) half the shots  3) full cut preview  4) final render
Options:        Level 5 (B): drop the hero shot and volumetric sky; saves ~15%
                Level 8 (S): + per-shot camera choreography, a transition on every cut, and the
                nested pull-back ending; costs ~+25%
```

Waiting for your go, or a different level.
