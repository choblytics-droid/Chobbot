# Style deck: mixed art styles, only the ones we render well

Every film mixes art styles and switches between them on the music. Each film gets a **style deck**:
one *home* style plus 3–5 *switch* styles, all picked from the A-tier list below.

## Why mixed styles work for us

- The songs are fast, so a style can hold for a bar or less. Short holds hide weaknesses and make
  the switch itself the effect (the 《光先到》 / `medium-lens-film` method on the
  `claude/zealous-newton-7zpeja` branch).
- **The composition stays locked across styles**: the companion, the streamer and the chat box keep
  the same place and silhouette, so a cut reads as "the same moment in a new material", not a new
  scene. That keeps it consistent while the look changes constantly.

## Characters: what to use, what to avoid

| Use | Avoid |
|---|---|
| **The companion**: a simple mascot shape (spark → ring → bubble with two eyes) | Anime / cartoon humans |
| **Pixel or voxel people** (32×32 or 64×64 sprites, the proven Venmar × Quest approach) | Faces, hands, lip-sync, expressive acting |
| **Silhouettes** from behind (hoodie, headset), rim-lit | Realistic or semi-realistic humans |
| **The chat itself as a character**: messages, usernames, emotes, typing dots | Many characters on screen at once |

**Owner rule (2026-10-04): no people unless they are simple.** If a human figure can't be drawn
well, use none: the object is the protagonist (ST-01: the phone on its tripod, at the train window,
the stream's own screen), or a simple pixel prop or the mascot. Scenes explain the situation through
objects, the stream UI and the chat. In the brand films the companion is always a simple mascot (a warm
spark), never a character; Streamer Stories have no companion and no brand at all.

**Nobody sings on screen.** The song plays in the background like a soundtrack. No character
performs it, mouths it or lip-syncs. The lyrics reach the screen as kinetic type, chat messages or
on-screen text timed to the words, and the picture tells the story while the song carries the mood.

On the Venmar branch, four attempts at an anime cel style made no progress (its session notes say
"diminishing returns"). That is why anime stays off the list.

## Style tiers (what I can render well in code)

| Tier | Styles | Why |
|---|---|---|
| **A, use freely** | Pixel art · Voxel diorama · CRT / VHS / glitch · LED dot-matrix · Terminal / ASCII · Blueprint / technical drawing · Engraving / line hatching · Oscilloscope / vector glow · Newspaper halftone · Papercut (flat layers) · Stained glass · Neon line · Thermal camera · Data / UI / charts · Kinetic typography · Particles / constellations · Abstract raymarched objects (non-human) | Geometry, light, pattern and type: deterministic, sharp at 4K, and every frame can be checked |
| **B, short holds or backgrounds only** | Ukiyo-e waves and patterns (no figures) · Ink wash (abstract, no figures) · Watercolor washes · Crayon texture on simple shapes · Isometric rooms · Clay-like soft 3D on simple shapes | The texture works; complex figures don't |
| **C, avoid** | Anime / cartoon humans · Realistic faces · Photoreal people · Character acting | Inconsistent and slow to fix; it reads as "AI-made" |

## Switching cadence (default, tuned per song)

| Song part | Switch | Notes |
|---|---|---|
| Intro / verse | Home style; one switch every 4–8 bars | Let the story read |
| Pre-chorus | Every 2 bars | Build tension |
| Chorus | Every bar, bursts of one style per beat on the hook | The switching is the energy |
| Drop / biggest hit | Mosaic: every style of the deck at once, then back to home | The "wall of styles" moment |
| Outro / end card | Home style | Brand films: the end card is always the same brand style. Stories: no end card, they end on the story |

Transitions are made of material (burn, ink bleed, shatter, print, glitch, pixel dissolve), timed to
kicks and snares, with the brightest point aligned across the cut.

## Example decks

| Use | Home | Switch styles |
|---|---|---|
| Wholesome story (e.g. the train ride IRL) | Pixel art | Papercut · Neon line · Constellations · Halftone |
| Triumphant story (the speedrunner raid) | Voxel diorama | CRT / VHS · LED dot-matrix · Kinetic type · Stained glass |
| Sad / lonely story | Engraving / line hatching | Blueprint · Thermal · Terminal / ASCII |
| Brand · Generic A (majestic technical) | Abstract raymarched + blueprint | Constellations · Data / UI · Engraving |
| Brand · Generic B (music video) | Pixel or voxel streamer room | CRT · Halftone · Kinetic type · Neon line |
