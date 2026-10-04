# QA gate (owner rule, 2026-10-04: "we need deeper QA checks")

**Nothing reaches the owner before it passes this gate**: style frames, animatics and builds.
Every run is logged in `films/<id>/QA.md` (what was checked, what failed, what was fixed).

## QA-1 · Facts (Stories)
Every word on screen (lyrics, captions, chat, UI text, headlines) traces to the script's full
picture. Background chat is neutral reactions only. No invented beats ("reconnected" was one).

## QA-2 · Detail audit at 100% (the castle rule)
Render QA stills (`render.ts stills --qa`) and run `tools/qa_frames.py`. Look at **every crop of
the zoom sheet at 100%**, never only the full frame. For every asset on screen (anything bigger than
~40 × 40 art px, and every landmark, hero object and prop the story names):

| # | Check | Fails when |
|---|---|---|
| 1 | **Form shading**: at least 3 tones per surface (light side, shadow side, occlusion where parts meet) | one flat colour per shape |
| 2 | **Material texture**: stone courses, plaster noise, wood grain, roof tiles, fabric, metal | a smooth fill |
| 3 | **Silhouette breakup**: the outline has detail (crenellations, chimneys, ledges, snow lumps, aerials) | plain boxes and triangles |
| 4 | **Secondary detail**: windows with frames and sills, doors, signs, lamps, gutters, props | big empty areas |
| 5 | **Grounding**: the object sits in the world (foundations follow the ground, contact shadow, snow at the base) | floats or is cut off straight |
| 6 | **Light interplay**: lit windows spill on walls, rim light from the sky, the scene's lights reach it | lit as if alone |
| 7 | **Scale and perspective** match the neighbours | toy-sized or giant |
| 8 | **Motion**: it does something over time where it should (flags, smoke, lights, snow) | frozen |

`render.ts stills --qa` also writes each frame's G-buffer object stats; `tools/qa_frames.py` flags
**FLAT** objects (area ≥ 250 art px and internal detail < 0.12 or fewer than 4 tones) and boxes them
in magenta. Target: **zero FLAT objects**, or each one justified in `films/<id>/QA.md` (e.g. a thin
pole, a lamp strip).

## QA-3 · Safe zones and text
- 9:16: no text or key action in the platform UI zones (cyan in the flat map): top 150 px, the right
  buttons column (x > 940, y 700–1700), the bottom caption area (y > 1560). Lyrics live in the upper
  two thirds.
- Every text is on screen long enough to read: ≥ 0.3 s per word, ≥ 1.2 s minimum, at its size on a phone.
- Contrast: text readable on every background it crosses (shadow or plate when needed).

## QA-4 · Timing and motion (animatic)
- Cut sheet (`render.ts sheet --times <cuts>`): every transition reads and lands on the beat.
- Lyrics light on the sung word (spot-check 5 lines against the audio).
- No frozen shots: every shot has camera or subject motion.

## QA-5 · Independent review
A reviewer with fresh eyes (a separate agent, no knowledge of how it was made) gets the zoom sheets,
the flat maps and this rubric, scores every frame per check (pass / weak / fail) and lists the ten
weakest spots. It must name problems; "looks good" is not an answer. Every fail is fixed or answered
in `films/<id>/QA.md` before the owner sees the work.

## QA-6 · Technical
Banding in gradients, clipped highlights, aliasing or shimmer on thin lines, flicker between frames,
NaN/black pixels, wrong colour space. Check in the 1080p render, not in a review copy.
