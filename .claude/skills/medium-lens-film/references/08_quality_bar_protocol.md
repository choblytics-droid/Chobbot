# 08 — Quality bar protocol (how a target level is set, proposed, changed and kept honest)

Levels come from `07_quality_levels.md`. A level is a **promise about craft depth**: how many
media, how deep each bible goes, how many hero shots, how bespoke the transitions and sound are.
**Line counts and hours are consequences, never targets.** Nothing is added to reach a number.

## Track: Breadth (B), Depth (D) or Mixed

Every level has a path, all in one master list (`07_quality_levels.md`). **Breadth** = many media (the
《光先到》 montage). **Depth** = 1–2 styles pushed to the limit of rendering (light, atmosphere, materials,
simulation, camera, film look). **Mixed** = 1–2 deep styles plus a short multi-media moment. Same level =
same effort and token cost; Depth costs more GPU render time. Options are picked from the **options menu**
in 07; a project uses only what it needs. The plan card lists the chosen options with their hours.
Triggers: "level D8", "depth track level 10", "keep only the voxel style but max quality" → Depth.
If the user gives few styles but asks for a high level, propose the Depth track instead of adding styles.

## Mode 1 — The user sets the bar

Triggers: "level 6", "/medium-lens-film level 4", "quality bar 8", "make it level 10".

1. Read the level's promise (07 table + "What each level adds").
2. Check that the brief can hold it: enough distinct moments or segments for the number of styles, and
   a runtime long enough to show them. If not, say so (see "Fit check") and propose the nearest level
   that fits.
3. Reply with the **plan card** (below) and wait for a go. Then start with the calibration step.

## Mode 2 — The model proposes the bar

When no level is given, estimate one from the brief and propose it with the plan card, and a
one-step-down and one-step-up option.

**Estimation rubric.** Score each factor; the proposal is the level the brief *naturally supports*.

| Factor | Pushes the level down | Pushes the level up |
|---|---|---|
| Runtime | < 30 s: few styles can register | 2–3 min: room for many media and reprises |
| Structure | one continuous shot, one idea | distinct sections (verses, breaks, chant) |
| References | "make it cool" | named media, eras, artists' techniques, sample frames |
| The moment | abstract, hard to depict consistently | one clear physical moment every medium can show |
| Characters/assets | new characters must be designed | characters exist (e.g. Venmar & Quest sprites) |
| Realism asked | stylised only | photoreal hero shots (each +1 level of effort) |
| Sound | fixed track, sync only | sound design / synthesis requested |
| Deadline / budget | "this week, part of my allowance" | "take the time it needs" |

Rule of thumb: **number of meaningful styles ≈ number of distinct sections × 1–3**. The level is the
row of the 07 table whose "Styles" column matches, bumped by +1 for each hero shot or synthesized sound
design, and by −1 if references are vague and must be researched from scratch.

## The plan card (always shown before work starts)

```
QUALITY BAR — proposed Level N, track B/D/Mixed  (Opus 5.5)
What you get:   <chosen options from the 07 menu, each with its hours: styles, depth packs, structure, sound>
Why this level: <2–3 reasons from the brief: runtime, sections, references>
Estimated:      ~<lines>k lines · <h> agent-hours · Pro <a>% · Max 5× <b>% · Max 20× <c>% of a week (incl. +30% rework)
Render:         <resolution/fps> on <GPU / this container>, ~<time>
Checkpoints:    1) calibration lens + stills  2) half of the lenses  3) full cut preview  4) final render
Options:        Level N−1: <what is dropped, saves ~a%>    Level N+1: <what is gained, costs ~b%>
```

## Downgrade (user asks for a lower level)

Drop in this order, cheapest loss of quality first:
1. Remove the weakest / most redundant styles (keep the ones that carry the story).
2. Replace family-C redrawn styles with family-A "recording" styles (halftone, thermal, CRT) that reuse
   the main render.
3. Simplify transitions to the 3–4 reusable material ones (burn, bleed, shatter, glass).
4. Drop a hero shot; the stylised world is the "real universe".
5. Reduce defects per bible from 10–15 to the 5–6 most visible.

State what is lost in one line each, and the new estimate.

## Upgrade (user asks "can it reach a higher level?")

Say yes **only if the extra effort is visible on screen**. Answer with one of:
- **Yes, worthwhile:** name the concrete additions (e.g. "+4 styles for the chant, material transitions
  on every cut, one hero shot of the rift") and the extra cost.
- **Yes, but diminishing:** the brief can't show more (runtime too short, styles would flash by
  unseen). Suggest what would make the higher level meaningful: a longer cut, more sections, a
  reprise, a second video.
- **No:** explain why (for example, the extra hero shots need a GPU render that isn't available).

Never raise a level by padding: no extra lines for their own sake, no near-duplicate styles, no
unseen detail, no re-rendering unchanged work.

## Anti-waste rules (apply at every level)

1. **Every block of work maps to a visible item** in the plan card. If it doesn't, it isn't done.
2. **Calibrate first.** Build one style at full depth, measure the real cost (Usage page), rescale
   the estimate, and report before building the rest.
3. **Check at every checkpoint.** If spend runs >30% over the estimate for that stage, stop and ask:
   continue, simplify, or drop items.
4. **One style per session** (`/clear` between); review with contact sheets, not many full-size
   stills; high effort only for bibles, architecture and critique.
5. **Reuse before rebuilding:** existing sprites, voxel world, post chain and beat grid.
6. **Stop when the checklist passes.** Polish beyond the level's QA list belongs to the next level,
   and needs the user's go.

## Fit check (when the requested level doesn't fit the brief)

- Too high for the runtime: "Level 9 means ~26 styles; in 40 s each would get ~0.3 s after the story
  beats, below what reads. Level 6 fits; or extend to ~90 s for Level 9."
- Too low for the ambition: "You asked for 20 styles and a photoreal hero shot; that's Level 8 work.
  Level 5 can do 10–12 styles without the hero shot."
