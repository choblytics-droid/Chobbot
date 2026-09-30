---
name: medium-lens-film
description: Plan and build a code-rendered film in which one moment is shown through many human art media ("lenses"), each medium a separate GLSL shader with its own researched "bible" — the method behind the Bilibili film 《光先到》 (Light Arrives First, 28 media, ~27k lines of GLSL, no image assets). Use when asked to make a multi-style / many-art-styles video, a "same moment in N styles" montage, a medium-by-medium shader film, a style reference library, or to review/upgrade the art direction of a shader video. Covers the world-state + lens-contract architecture, a 30-entry style library with palettes and defect lists, a frame-accurate transition catalogue, sound design, prompts, templates and QA.
---

# Medium-lens film (the 《光先到》 method)

## What this skill is

A study of 《光先到》 ("Light Arrives First", Bilibili BV1jyaA6QEoH, 42 s, portrait 720×960). A man
slumped in his chair sees a nuclear flash on his screen. In the 24.4 s between the light (3.2 s) and
the sound (27.6 s), the same mushroom cloud is shown in **28 human media, from cave painting to source
code**, then as a photoreal cloud, in his eye, in his window, in a city of windows. It uses no images
and no footage: 38 GLSL files, ~27,100 lines, plus sound synthesized in code. It was made with Claude
Opus 5.5 over ~16 hours, with a ~30 GB working folder.

This skill turns that film into a repeatable method.

## Quality bar — do this first on any new video

Every project starts with a quality level (1–10, `references/07_quality_levels.md`, Opus 5.5 table)
and the protocol in `references/08_quality_bar_protocol.md`:
- **The user set a level** ("level 6", `/medium-lens-film level 4`): check it fits the brief, show the plan card, wait for a go.
- **No level given:** estimate one from runtime, sections, references, hero shots and sound, and propose it with the plan card, a one-down and a one-up option.
- Downgrade drops the cheapest-to-lose items first. Upgrade happens only when the gain is visible on screen.
- Anti-waste: work maps to visible items; calibrate on one style first; stop and ask at >30% overrun; lines and hours are results, never targets.

## Read in this order

1. `references/01_film_breakdown.md`: the idea, second-by-second structure, pacing, the five devices,
   why it cost 16 h / 30 GB, and what "他写了数十个着色器" means.
2. `references/02_architecture.md`: the reverse-engineered system: one physical world state; one
   lens contract `vec3 lens(vec2 fc)`; three lens families (reproduction / painterly / iconographic);
   the medium-bible header; the sequencer; the cost model.
3. `references/03_style_library.md`: **the style reference library**. 30 media + 4 real shots, each
   with observed details, a sampled palette, signature traits, a defect list, in-world text, a build
   recipe and transitions.
4. `references/04_transitions.md`: 30 transitions read frame by frame at 30 fps, and the patterns.
5. `references/05_sound_design.md`: the measured soundtrack: absolute silence at the flash, the heartbeat,
   the 7.4 kHz "light" tone, **the title hidden in the spectrogram**, the boom synced to the frame collapse.
6. `references/06_playbook_and_prompts.md`: the 9-step method, the medium-bible template, the agent
   loop, copy-paste prompts for a local model, QA checklists, cost planning.
7. `references/07_quality_levels.md`: the 10-level cost scale (lines, agent hours, requests, tokens)
   and how to measure your own plan's percentage per level.
8. `references/08_quality_bar_protocol.md`: how a level is set by the user or proposed by the model,
   the plan card, downgrade and upgrade rules, and anti-waste rules.
9. `templates/`: GLSL starting points: `state.glsl` (world state + blackbody), `lens_template.glsl`
   (the contract with the 4-stage structure), `mosaic.glsl` (any lens in any rectangle),
   `transition_template.glsl` (burn, ink bleed, shatter). All compile with glslangValidator (GLSL ES 3.00).
10. `scripts/study_video.py`: turns any reference video into study sheets (10 fps timeline grids, a
   frame after every cut, labelled per-style frames, palettes, audio levels, spectrograms). Frames of the
   film aren't committed; regenerate them into `assets/` from your copy (see `assets/README.md`).

## The method in one screen

1. **One moment, one state.** Describe the moment as a physical state that is a function of `tau`
   (size, height, temperature → blackbody colour, soot, rings, wind). Every file reads it.
2. **One contract.** `vec3 lens(vec2 fc)`: local coordinates in, display colour out. A lens works
   full-frame, as a mosaic tile, as a window in a building or as a flying card, unchanged.
3. **One file per medium, with a bible header first.** Name the specific object, era and process; list
   8–15 defects by their trade names; translate the thesis into the medium's own writing genre; sign it
   the medium's way.
4. **Know the family.**
   - A, reproduction: records the real render; cheap, e.g. the wireframe lens is 77 lines.
   - B, painterly: marks sample the colour; costs k samples per pixel.
   - C, iconographic: redraws the moment in the culture's motifs; the most code, up to 1,318 lines.
5. **Lock the composition** across all media so the fastest cuts (3 frames per medium) still read as one
   object changing material.
6. **Every medium is an object in light:** vase, plate, newspaper under a magnifier, hoop, TV, film strip.
7. **Transitions made of material:** crack, tear, bleed, slice, print, burn, paint, glass. Align the bright
   feature across the cut. Accelerate: 12 frames early, 1–3 frames late.
8. **Structure:** slow material montage → accelerating cuts → mosaic → a long hold on the "real" →
   nested pull-back (pupil → eye → window → city) → proof (source code, wall of all media, A/B split).
9. **Sound:** silence at the biggest visual, a sonic thread for the key element, a heartbeat as the clock,
   one enormous synced hit, a hidden signature in the spectrum.

## Conclusion: "他写了数十个着色器" — what it means, and how we implement it

**Meaning.** "他写了数十个着色器" = "he wrote dozens of shaders". Not one shader with dozens of presets:
dozens of **independent renderers**, one per medium, each a researched document plus its code, all
answering the same question ("what does *this* medium show at *this* instant?") from **one shared
physical state**. The number of shaders *is* the content of the film. The closing card makes it the
thesis: 每一种媒介 = 一段着色器, "each medium = one shader".

**Why it took so long:** ~27k lines verified one still at a time; a written bible and a defect list per
medium; hand-built iconography (vase, murals, saints, woodblock figures); photoreal volumetric shots;
reprise frames that evaluate dozens of lenses at once; lossless masters (~24 MB/frame).

**How we implement it (for our Venmar × Quest engine in `app/`).** The engine already has what the
method needs: deterministic time, a scene contract, a post chain and adaptive motion blur. We add:

1. **`app/src/lenses/state.ts` + `state.glsl`:** the song moment as state: beat, bar and section
   phase; energy envelopes; the characters' pose parameters; the rift's width and glow. It's computed
   once per frame and exposed as uniforms to every lens. (Our "explosion" is the rift opening and the
   two characters. Every lens depicts *that*.)
2. **Render the 3D scene into buffers, not only a picture:** colour, depth, normals, object ID
   (Venmar / Quest / him / city / sky), UV. Family A and B lenses sample these (much cheaper than the
   film's re-evaluation of the volume); family C lenses redraw from the state and IDs.
3. **`app/src/lenses/*.glsl`, one file per medium, bible header first**, contract `vec3 lens(vec2 fc)`.
   Suggested first set (ordered from old to new, like the film):
   - rust etching (family B)
   - ink wash with seal (C)
   - Dunhuang-style mural of the two as apsaras (C)
   - ukiyo-e with a printing reveal (C)
   - stained-glass rift (B/C)
   - newspaper halftone "号外" (A)
   - constructivist poster (C)
   - VHS/CRT (A, already half there)
   - 8-bit game, which our sprites already are (C)
   - thermal (A)
   - papercut (C)
   - crayon (C)
   - voxel diorama (A, we already have voxels)
   - wireframe/code (A)
4. **A lens sequencer tied to the music:** a lens change on section boundaries in the verses; lens
   cycling every beat (then every half-beat) in the chant; a mosaic of all lenses on the final chorus
   hit. It uses the existing beat grid, so cuts land on the music.
5. **Material transitions** from `templates/transition_template.glsl` (burn, bleed, shatter, printing),
   synced to kicks and cowbell hits.
6. **Sound-synced silence and one big hit:** our track is fixed, so we mirror the idea visually:
   white-out plus "silence" (the visuals freeze) on the break, and a column-collapse datamosh on the
   biggest drop.
7. **Proof ending:** a wall of every lens tile, a split screen of 3D vs lens, and the file list with
   line counts.

Budget honestly: ~14 lenses at the film's depth is ~8–14 hours of authoring, and final 1080p60/4K
renders need a GPU machine. Start with 3 lenses (one per family) to calibrate the cost per lens.

## QA before calling any lens done

It reads as the medium in 3 frames; it reads as an object at full size; every bible defect is visible
at 1:1; the silhouette matches the locked composition; the in-world text is in the medium's genre;
renders are deterministic; it's inside the time budget. Full checklists are in
`references/06_playbook_and_prompts.md` §E.
