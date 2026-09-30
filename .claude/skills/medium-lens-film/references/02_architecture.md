# 02 — Architecture: how 《光先到》 is built (reverse-engineered)

Evidence available: the source-browser page (38 file names and line counts; the header comment and
contract line of `lens_halftone.glsl`; the page UI: player, scrubber, "当前段落: 8-bit 游戏",
"正在计算这一帧的文件: lens_pixelgame.glsl" at 11.845 s), ~20 lines of `shot_nuke`-style code visible in
the credits (32–34 s), and 1,260 frames of output. Everything marked **[E]** is directly visible;
**[I]** is inference, with the reasoning given.

## 1. File map [E]

| Group | File | Lines | Role |
|---|---|---|---|
| Core | `common.glsl` | 174 | Shared helpers (hash/noise, colour, probably `blackbody()`, maybe the state struct) [I] |
| | `post.glsl` | 439 | Global film look: grain, bloom, flare, vignette, afterimage [I] |
| | `mosaic.glsl` | 151 | Tiles the frame into N rectangles and calls lenses in local coordinates [I from the contract + the grid sequences] |
| | `final.glsl` | 986 | The sequencer: which shot or lens at time t, all transitions, text, credits, waveform [I] |
| Shots ("real universe") | `shot_room.glsl` | 1,505 | Man in chair, desk, monitor, room light |
| | `shot_eye.glsl` | 1,503 | Macro eye: iris, pupil reflection, lids, lashes, blink |
| | `shot_nuke.glsl` | 1,008 | Photoreal volumetric mushroom cloud driven by physical parameters |
| | `shot_flash.glsl` | 235 | The flash: point, star flare, white-out, afterimage |
| Lenses (media) | 30 × `lens_*.glsl` | 21,128 | One complete renderer per medium |
| **Total** | 38 files | **≈27,130** | 100% GLSL, zero image assets |

Lens sizes, sorted: porcelain 1,318 · windows 1,233 · dunhuang 1,112 · cubism 1,068 · ukiyoe 1,067 ·
stainedglass 1,033 · ink 937 · cave 886 · impasto 884 · glitch 854 · anime 773 · cyanotype 773 ·
etching 747 · voxel 695 · crt 677 · halftone 657 · pixelgame 643 · thermal 608 · popart 603 ·
code 568 · daguerreotype 523 · negative 516 · oscilloscope 514 · papercut 477 · pointillism 450 ·
constructivist 439 · embroidery 349 · crayon 337 · pixels 310 · wireframe 77.

## 2. The lens contract [E]

From the header of `lens_halftone.glsl`:

```
// Contract: vec3 lens(vec2 fc) -> display sRGB. fc is local to the …   (line cut off on screen)
```

- **Input:** only a fragment coordinate, local to whatever rectangle the lens is drawn into.
- **Output:** final display sRGB. Not linear HDR, not "a layer to composite": the lens owns the whole
  look of its pixel, including paper, lighting, lens distortion and grain.
- **Implication [I]:** time and the explosion's state come from globals/uniforms shared by every file,
  not through the function signature. So any lens can run full-frame, as one tile of a 48-tile mosaic,
  inside a window of the building, as a card flying past the camera, or as the right half of a split
  screen, without knowing which.

## 3. One world state, many renderers [E + I]

The credits show code that builds a state struct `s` from a time parameter `tau` [E]:

- `s.tau = tau`, an age parameter `ag = max(tau − 2.4, 0)`
- cap radius `R = 172·(1 − exp(−1.3·tau^0.72)) + 34·ag + 0.6·ag²`, with a floor `R ≥ 0.3`
- a comment: the dome hugs the ground (the centre sinks from the tower top to the ground), then rises;
  `cy = 30·(1 − smoothstep(0, 0.9, tau)) + 140·a²/(a + 2.2)`
- centre `C = vec3(windX(cy), cy, 0)`: a wind-shear function bends the column with height
- `morph = smoothstep(4, 10, tau)`: fireball → mushroom morph; `sq`, `Rv = morph + 0.55·R`, `Rroll = 0.6·R`
  (vortex-ring roll radius)
- `Tc = 1400 + 7400·exp(−max(tau − 0.8, 0)/…)`: core temperature in kelvin, decaying
- `Lpk = 1000·exp(−tau/0.28) + 30·exp(−tau/…)`: luminous peak (the flash, then a long tail)
- `skinT`, `soot = smoothstep(2.6, 8, tau)`, `boil = 0.16·tau`, `mott = 1 − smoothstep(2.4, 4.6, tau)`
- `Ienv = π·Lpk·R²·mix(1, 0.35, soot)`: "intensity of the glowing ball"
- `Lcol = blackbody(Tc·mix(0.97, 0.85, soot))`: the colour comes from a blackbody at the core temperature

What this means:
1. **The explosion is a physical model, not an animation.** Radius growth (fast early, sub-linear), the
   fireball sinking then rising, soot darkening, temperature cooling through blackbody colours, wind
   shear on the stem. One function of `tau` yields every quantity a renderer needs.
2. **Every lens reads the same `s`.** That is why the cloud has the same size, height and phase in all
   28 media at the same instant: the state is shared, only the drawing differs.
3. **Physics shows up as design detail.** The cyanotype prints `Ø3.35 km`, a `CONDENSATION RING` label
   and G.I. Taylor's blast-wave law `R = (E·t²/ρ)^(1/5)` (the scaling famously used to estimate the
   Trinity yield from photographs). The thermal camera shows `Bx1 Max 1670.5 °C`. These numbers can be
   printed because they exist in the state.

## 4. Three families of lenses [I: from the visuals + line counts]

The 30 lenses fall into three families that differ in *how they get the cloud*. Line counts back it up:

| Family | How the cloud is obtained | Members | Typical size |
|---|---|---|---|
| **A. Reproduction** (the medium *records* reality) | Sample the photoreal `shot_nuke` render (luminance / colour / depth / ray-march internals) and pass it through a recording process | halftone, cyanotype, negative, daguerreotype, thermal, crt, pixels, oscilloscope, glitch, code, wireframe, voxel | 77–854 |
| **B. Painterly** (an artist *interprets* what they see) | Sample the colour of the real (or a simplified) cloud through the medium's marks: strokes, dots, facets, cells, stitches, hatching | impasto, pointillism, cubism, stainedglass, embroidery, etching | 349–1,068 |
| **C. Iconographic** (a culture *redraws* the idea) | Redraw the cloud from state parameters (R, height, stem width, cap shape) as the medium's own motifs: scallop clouds, flame mandorla, auspicious-cloud scrolls, circles, blobs | cave, dunhuang, ink, porcelain, ukiyoe, papercut, popart, anime, pixelgame, crayon, constructivist | 337–1,318 |

Evidence for the split:
- **`lens_wireframe` is 77 lines**, yet it shows a detailed wireframe with debug views labelled
  `WIREFRAME / NORMALS / STEPS` and a colour ramp. That is only possible if it calls the photoreal ray
  marcher and visualises its normals and step counts. Reproduction lenses are cheap to write because
  the expensive image already exists.
- **Family A images contain the exact billow detail of the real cloud** (halftone photo, cyanotype,
  negative, daguerreotype, thermal). Family C clouds are rebuilt from motifs (ukiyo-e scallops,
  pixel-game circles, crayon stripes, porcelain cloud scrolls) but keep the same proportions.
- **The largest files are all family C or B with heavy iconography**: porcelain (vase geometry, glaze,
  painted bands, reflections), dunhuang (apsaras, mandorla, rows of seated Buddhas, flaking plaster),
  ukiyoe (block-printing, figures, cartouche), stained glass (rose window tracery, four saint lancets),
  cubism (facets, collage scraps, wood grain). The iconography has to be modelled by hand.

## 5. Each lens renders an *object*, not a filter [E]

Almost every medium is shown as a physical thing in a space, photographed:
- porcelain: a meiping vase on a dark background, turning, a window reflection sliding on the glaze
- halftone: a newspaper lying on a table, lit by a raking window light, a magnifying glass on it
- daguerreotype: a plate in a brass oval mat inside a maroon velvet case, tilting, iridescent tarnish
- embroidery: fabric in a gold hoop; voxel: a diorama on a cut-away soil base; crt: a TV set in a dark room
- negative: a film strip with sprocket holes; cyanotype: paper with deckled, brush-coated edges
- etching: a plate impression with a platemark and caption on cream paper
- impasto: a canvas whose paint edge curls off the underlying plate

So each lens really has two stages: **(1) the medium's image**, then **(2) the photograph of the object
that carries it** (surface normal, specular, lens distortion, lighting, vignette). The `lens_halftone`
header spells out stage 2: a magnifier with pincushion distortion and lateral colour, cockle under a
raking window light.

## 6. The medium "bible" header [E]

`lens_halftone.glsl` opens with a paragraph, not code:

> the HALFTONE universe of 《光先到》. A 1945 Chinese newspaper extra (号外), photographed where it
> lies…, a magnifying glass resting over the picture. One sheet of cheap groundwood newsprint.
> Two-colour letterpress: a vermilion wood-type banner 原子弹爆炸 set [right-to-left by period]
> convention, beside a knocked-out 号外 block; in black, a coarse 45° [halftone] wirephoto of the
> detonation (retouched by the photo desk), a deck [of] type set from the film's own 43 sorts.
> Everything is simulated as…: rag, slur, wicking, squash rims and salting; wood grain and pinholes;
> forme out of register; show-through of the mirrored reverse page; …cracked; cockle under a raking
> window light; tanned edges, foxing; [the glass] magnifies with pincushion distortion and lateral
> colour…

(Bracketed words are where the screenshot is cut off.) Observations:
- It names a **specific object**, not a style: one sheet, one year, one paper stock, one press.
- It lists the **process** (two-colour letterpress; wood type; 45° screen; photo retouching).
- It lists **defects by their trade names** (slur, wicking, squash, salting, show-through, cockle,
  foxing, tanning). Each is a visual feature a shader can implement and a reviewer can check.
- **"the film's own 43 sorts"**: the type is set only from the 43 distinct characters the film uses,
  as a real compositor would have a limited case of sorts. This detail means the lens has its own
  glyph set for exactly those characters.
- The headline is **set right-to-left** (the frame reads 炸爆弹子原 for 原子弹爆炸), the period
  convention for horizontal Chinese type. Historical accuracy down to reading direction.

## 7. The sequencer (`final.glsl`) [I]

986 lines is the right size for: a timeline table (segment → shot/lens + start/end), per-segment
camera moves on the *object* (tilts, rotations, cards flying past), ~26 bespoke transitions (see
`04_transitions.md`), the typed text, the credits (code scroll, the poster wall, the split screen
with a scanning white line), and the final waveform. The source browser's "当前段落 / 正在计算这一帧的文件"
readout implies a **segment table with human names** ("8-bit 游戏") and a file per segment.

## 8. Transitions use the medium's own material [E]

Transitions are not generic wipes. Each one is made of the outgoing or incoming medium's physics:
rock cracks and falls away (cave → mural beneath), a mural tears open, ink bleeds into cobalt, a curved
blade slices porcelain, a woodblock prints colour by colour, a burn hole spreads from the fireball,
paint smears across a plate, glass cracks over a poster. Several are **content-aligned**: the fireball
of one medium becomes the key feature of the next (fireball → rose window; fireball → cobalt bloom →
the painted cloud on the vase; the cloud's rectangle → the pupil reflection).

## 9. Render pipeline and cost model [I, with arithmetic]

- **Resolution and storage.** Output is 720×960 on Bilibili; the master was probably much larger.
  30 GB / 1,260 frames ≈ **24 MB per frame**. That is consistent with 16-bit PNG at ~2160×2880, or
  8-bit PNG plus per-shot intermediate passes, and with noise-heavy content (paper, grain) that
  compresses badly.
- **Per-frame cost.**
  - Family A frames cost one photoreal cloud evaluation (volumetric ray march) plus the effect.
  - Family B frames cost k samples of the cloud colour per pixel (k ≈ 4–50: dot/cell/stroke
    neighbourhoods).
  - Family C frames cost the iconography plus a few shape evaluations.
  - Mosaic frames (up to ~48 tiles), window frames (hundreds of windows, many showing a medium) and
    poster-wall frames cost roughly the sum of the lenses they show.
  - The photoreal shots (room, eye, nuke) are volumetric/SDF scenes with soft lighting.
- **Time.** The ~16 h is plausibly half authoring and half rendering:
  - **Authoring:** 27k lines written by an agent in a render-look-fix loop.
  - **Rendering:** 1,260 frames at 15–40 s each for the heavy ones, with supersampling for clean
    hatching, dots and fine lines, is 5–14 h on one GPU.

## 10. Summary diagram

```
               tau(t) ──► state s {R, C, cy, Rv, Rroll, Tc, Lpk, soot, boil, mott, Ienv, Lcol…}
                                     │  (shared by every file)
          ┌──────────────────────────┼────────────────────────────────────┐
     shot_room / shot_eye       shot_nuke (photoreal)             shot_flash
                                     │ sampled by
         ┌───────────────────────────┼───────────────────────────┐
   A. reproduction lenses    B. painterly lenses       C. iconographic lenses (redraw from s)
   (record the render)       (marks sample colour)     (motifs + composition from s)
         └──────────────┬────────────┴───────────────┬───────────┘
                vec3 lens(vec2 fc)  — same contract, local coords, display sRGB
                        │
     mosaic.glsl (any rectangle, any count)   final.glsl (timeline, transitions, text, credits)
                        │
                     post.glsl (grain, bloom, flare, afterimage) ──► frames ──► video
```
