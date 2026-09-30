# 06 — Playbook: how to produce a film like this (method, bible template, prompts, QA)

This is the part to hand a local model. It turns the analysis into a repeatable procedure.

## A. The method in 9 steps

1. **One sentence, one physical moment.** Pick an instant that can be seen in every medium (an
   explosion, a sunrise, a character's leap, a heartbeat). Write the thesis as a sentence with a
   physical truth in it ("light arrives before sound").
2. **Define the world state.** Write down every quantity that describes the moment as a function of
   one time parameter (`tau`): size, position, temperature/colour, secondary features (rings, skirts),
   secondary motion (wind, boil). Units and numbers are real. This struct is the single source of truth.
3. **Build the "real" render first.** The photoreal (or reference-style) version of the moment, driven
   only by the state. Every other medium will be compared to it.
4. **Choose the media list and its order.** Aim for an order with meaning (history of image-making;
   East→West; analogue→digital; childhood→adulthood). Number them (the film printed "SHEET 14 OF 28").
5. **Write a medium bible per medium** (template below) before any code for that medium.
6. **Implement one lens per medium** against one contract: `vec3 lens(vec2 fc)` → display colour, local
   coordinates, reading the shared state. Classify it first (A reproduction / B painterly / C iconographic)
   because that decides how it gets the moment.
7. **Lock the composition.** The moment's key features land on the same screen positions in every
   medium. Check with an overlay of all media at 50% opacity: the silhouettes must stack.
8. **Design the transitions from the media's materials** (crack, tear, bleed, burn, print, glass,
   paint) and align bright features across cuts.
9. **Sequence and reprise.** Slow material transitions → accelerating cuts → everything at once (mosaic)
   → a long hold on the "real" → a nested pull-back → the proof (code, wall of all media, split screen).

## B. Medium bible template (write this as the header comment of each lens file)

```
// =============================================================================================
// lens_<id>.glsl — <medium name in the film's languages> · the <MEDIUM> universe of <film title>
//
// THE OBJECT: <one specific physical artefact, not a style>. <Where it is, what era, who made it,
//   what it is made of, how it is being looked at (lying on a table / hanging in a nave / in a hoop)>.
// THE PROCESS: <how the real thing is made, step by step: inks, blocks, firing, exposure, stitches>.
// THE LOOK OF THE MOMENT: <how this medium would depict the shared moment, using its own motifs;
//   which state fields drive what (R → size of X, Tc → colour of Y, soot → darkness of Z)>.
// IN-WORLD TEXT: <the thesis translated into this medium's native genre of writing + its signature
//   convention + any hidden date/number>.
// MATERIAL & DEFECTS (each one is implemented and checkable):
//   - <defect 1 by its trade name> — <what it looks like>
//   - <defect 2> …  (aim for 8–15)
// THE CAMERA ON THE OBJECT: <lighting (raking window light, candle, backlight), lens effects
//   (magnifier pincushion, depth of field), motion (tilt, turn, slide)>.
// PALETTE: <5–8 named colours with hex, and their role>.
// FAMILY: A reproduction | B painterly | C iconographic — <what it samples and how often per pixel>.
// COST: <expected samples per pixel; anything precomputable>.
//
// Contract: vec3 lens(vec2 fc) -> display sRGB. fc is local to the rectangle the lens is drawn in.
// =============================================================================================
```

Example (reconstructed from the film's halftone lens, abridged): *THE OBJECT: a 1945 Chinese newspaper
extra (号外) on cheap groundwood newsprint, lying on a table under a raking window light, a magnifying
glass resting on the photo. THE PROCESS: two-colour letterpress; a vermilion wood-type headline set
right-to-left; a black 45° halftone wirephoto retouched by the photo desk; body type set from the film's
own 43 sorts. DEFECTS: rag, slur, wicking, squash rims, salting, wood grain, pinholes, forme out of
register, show-through of the reverse page, cockle, tanned edges, foxing; the magnifier's pincushion
distortion and lateral colour.*

## C. The agent loop per lens (what took the hours)

```
1. Write the bible (10–20 lines).             ← research: what does the real thing look like?
2. Write the lens skeleton: object + camera.  ← render a still at 3 key times
3. Add the medium's image of the moment.      ← still; compare silhouette with the "real" render
4. Add defects one by one.                    ← still after each; zoom crops at 1:1
5. Add in-world text.                         ← check readability at the film's display size
6. Performance pass.                          ← time per frame; reduce samples; precompute
7. Review against the bible checklist.        ← every listed defect visibly present?
```

Budget reality: a lens at the film's level is 300–1,300 lines and 20–60 minutes of an agent's
write/render/look loop. 28 lenses + 4 shots + core ≈ 12–20 hours of authoring before rendering.

## D. Prompts for a local model

Use them in order. Replace `<…>`.

**D1 — Media list**
> We are making a short film where one moment — <moment> — is shown in <N> different human media,
> in an order that means something (<ordering idea>). Propose <N+6> candidate media with, for each:
> era/region, the physical object that carries it, how it would depict <moment>, its family (A
> reproduction / B painterly / C iconographic), and one detail only an expert would include. Then pick
> the best <N> and order them.

**D2 — Medium bible**
> Write the medium bible header for lens `<id>` using this template: <paste §B>. Be specific: one
> artefact, one era, the real production process, 8–15 defects by their trade names, how the shared
> state fields <list> drive the depiction, the thesis "<thesis>" translated into this medium's native
> writing genre, and its signature convention. No code yet.

**D3 — Implementation**
> Implement `vec3 lens(vec2 fc)` in GLSL ES 3.0 for this bible: <paste>. Available: `common.glsl`
> (<list helpers>), the state struct `S` (<fields>), `vec3 realScene(vec2 uv)` (the photoreal render,
> family A/B only), uniforms `uTime`, `uRes`. Structure the code as: (1) camera on the object, (2) the
> medium's image of the moment, (3) material and defects, one clearly commented block per defect,
> (4) lighting of the object, (5) return display sRGB. Keep it deterministic in `uTime`.

**D4 — Critique (with a rendered still attached)**
> This is a still of lens `<id>` at t=<t>. Compare it with its bible: <paste>. List (a) which defects
> are missing or unconvincing, (b) whether the moment's silhouette sits at the locked composition
> (cap centre at (0.5, 0.33), ring at 0.47, horizon at 0.58), (c) what a real expert in this medium
> would immediately spot as fake. Be concrete and rank by visual impact.

**D5 — Transition**
> Design the transition from `<A>` to `<B>` using the physical material of one of them (crack, tear,
> bleed, burn, print, fold, melt, shatter, dissolve of pigment…). Duration <n> frames at 30 fps.
> Describe it frame by frame, say which bright feature of A aligns with which feature of B, then write
> it as a GLSL function `vec3 trans(vec2 fc, float k)` that calls `lensA` and `lensB`.

## E. QA checklists

**Per lens**
- [ ] It reads as the medium at 3 frames (0.1 s) of screen time. Check a still at thumbnail size.
- [ ] It reads as the *object* at full size: the surface, the light on it, the edges.
- [ ] Every bible defect is visible in a 1:1 crop.
- [ ] The silhouette matches the locked composition. Check the overlay with the real render.
- [ ] The in-world text is in the medium's genre, correct direction/script, legible at display size.
- [ ] Deterministic: the same frame renders identically twice.
- [ ] Time per frame is within budget at the final resolution.

**Film**
- [ ] The order of media tells a story (can you name it in one phrase?).
- [ ] The transitions accelerate: slow and material early, fast late.
- [ ] At least one moment of total silence, synced to the biggest visual.
- [ ] One long hold after the fastest section.
- [ ] Recurring hidden numbers/dates are consistent across all media.
- [ ] The ending proves the craft (source, wall of all media, A/B split).

## F. Cost planning

| Item | Lines (film's reference) | Authoring | Render cost |
|---|---|---|---|
| Core (state, helpers, post, mosaic, sequencer) | ~1,750 | 1–2 h | low |
| Photoreal shot (volumetric / character SDF) | 1,000–1,500 each | 1–2 h each | high (ray march) |
| Family A lens | 80–850 | 15–40 min | real render + effect |
| Family B lens | 350–1,050 | 30–60 min | real render × k samples |
| Family C lens | 340–1,320 | 40–90 min | iconography (moderate) |
| Transitions (bespoke) | ~20–40 each | 5–15 min each | 2 lenses per pixel |
| Mosaic / wall / windows frames | — | — | sum of all tiles' lenses |

Storage: a 16-bit PNG master at ~2160×2880 is ~20–30 MB/frame. Keep masters only for shots you'll
re-grade; encode the rest straight to a high-bitrate intermediate (ProRes/FFV1).
