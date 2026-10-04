# ST-01 · QA log (docs/QA.md)

## Run 1 · 2026-10-04 · after the owner's note "very lazy detail, not level 6" (the castle)

| Check | Result before | Fix | Result after |
|---|---|---|---|
| QA-1 facts | invented `· reconnected ·` line (found earlier) | removed | pass |
| QA-2 detail (G-buffer FLAT objects, 13 → 20 frames) | **153 flat objects** (castle, hill, every house wall, train body, canopy, carriage wall/seats, the whole desk room) | materials library (`kit/materials.ts`), castle rebuilt (`sets/castle.ts`), houses, huts, carousel, station, carriage, desk rebuilt; ambient occlusion in the light pass | **0 flat objects** over 20 frames |
| QA-3 safe zones | desk caption + morning `LIVE` in the top bar; train + thank-you lyrics, station chat and the credit in the caption zone; station lyric, "End stream?" and the chat scrim under the right buttons | moved up/in; lyrics in the buttons band wrap narrower; scrim fades before the buttons; automatic `text.json` check | **0 text in UI zones** |
| QA-3 contrast | station lyric partly over the bright snowy ridge | (see review) | open |
| QA-5 independent review | see below | in progress | — |

### QA-5 review (independent agent, 13 frames, run 1): findings and decisions

Verdict: only the town set is close to level 6. The carriage, station, desk, neon frame and the
morning shot are below it. Note: frame 24.5 s was mislabelled by me as the phone macro (it is the hero
shot in the v0.8+ cut); the macro is at 20.9 s.

| # | Finding | Decision |
|---|---|---|
| 1 | Station lyric unreadable over the snowy ridge | fix: soft dark plate behind every lyric line (all scenes) |
| 2 | Three near-identical carriage shots | fix: the hero shot becomes a POV through the window (window fills the frame, more speed cues) |
| 3 | Neon frame: flat mauve fills, blown phone, empty ground | fix: near-black fills, glow falloff, wet ground reflecting the neon, phone exposure down |
| 4 | Station outside the carriage window reads as a lake | fix: canopy columns, bench, sign, tactile edge, glass reflection |
| 5 | Morning reads as night with lamps off; smeared clouds | fix: low warm key light, bright snow, stepped pixel clouds, plate behind the credit |
| 6 | Desk: chair a black slab, stock wallpaper on the monitor, mushy window | fix: rim/fill light, seams, a game on the monitor, a snowy street outside |
| 7 | Plaza cobbles flat, bright tiles read as a glitch, no people | fix: rounded stones, snow drifts instead of single tiles, footprints. People: owner decision (ST-01 has none) |
| 8 | Globe: noise lights, no Earth, arc end in the buttons column | fix: recognisable coastlines, lights along coasts, markers at both ends, arc end x < 900 |
| 9 | Front page: grey bars, masthead in the top zone, flat paper | fix: glyph lines, standfirst, fold, shading, masthead y ≥ 170 |
| 10 | Thank-you macro: stock bokeh, header in the top zone, long lyric | fix: phone bezel and reflection, header removed, lyric higher |
| — | "3 people watching" sung while the badge says 1 | fix: the counter reaches 3 on "Three" |
| — | "LIVE · 3 watching" right after "signal lost" implies a reconnect (QA-1) | fix: header removed in the thank-you shot |
| — | Signal lost is a plain black frame | fix: frozen, datamoshed last frame instead of black |
| — | Outro chat card covers the castle keep | fix: card moved left |
| — | QA tool missed text drawn inside the scene (masthead, macro header) | fix: QA-3 checks the final frame for text-like content too; masthead and header moved |

## Run 2 · independent review round 2

Verdict: not level 6 yet. Town frames pass; the train block (18.9–33.4 s) and the abstract beats
(33–41 s) at level 4–5. Top asks: three distinct hero POV shots; readability (morning grade, credit,
lyric handover); a textured globe close-up, a true datamosh, phone macros with a real background.

## Run 3 · 2026-10-04 · fixes for round 2

| Area | Fix |
|---|---|
| Train | Three distinct shots: city POV (back towers, setbacks, rooftops, street lamps, glass reflections), fields POV (tight, feathery frost growing from the glass edges), phone close-up (the phone films the view, its own LIVE pill and signal bars dropping to 0). Station view rebuilt (brick building, paving in perspective, tactile strip, yellow line). Far hills and the window frame textured. |
| Signal lost | P-frame datamosh: macroblocks smear the frozen picture along the last motion, stale blocks, chroma bleed, a tear line sliding down, light draining; "signal lost" on a plate, larger. |
| Macros | A real phone: rounded body, punch-hole camera, side buttons, frame glare; the carriage far out of focus behind it (lamp strip, window band, passing lights as bokeh). "keep" is tight, "thanks" is pulled back and pushes in. Messages in the middle third. |
| Globe | Terrain at two scales, rivers, northern snow, clouds, city lights inland too, the link's light spilling on the ground under it, the arc bows sideways so it reads as a curve. |
| Neon | Wider inward glow, faint wall fill (glowing interiors), rippled vertical reflection streaks. |
| Front page | Body copy built only from the post's facts (no placeholder bars), folded-back corner with its shadow, stronger centre fold. |
| Smaller | Lyric handover fade; hook sticker lower; lyric plate; desk chair quilting, sheen, stitching; headphones prop; dawn grade; credit plate; stream chat and input clear of the caption zone. |

Automated gate (21 frames): **0 flat objects, 0 text in UI zones.**

## Runs 4–7 · 2026-10-04 · independent review rounds 3–6

| Round | Verdict | Main fixes that followed |
|---|---|---|
| 3 | not level 6 (train 5, abstract beats 4–5) | credit stops claiming permission; thank-you shown as a received message after the drop; city on a viaduct; smooth snow drifts; phone close-up pushed in; macros with a real phone and carriage behind; globe from the limb; night outro, closer framing; morning snow; stepped pixel clouds |
| 4 | close (town, outro, front page, city POV at 6) | "first proper IRL" (the poster had test streams before); no invented stream time; station hill under the lyric and a real push-in; consistent chat order; pop-in messages, no cursor; globe arc faces the camera; original desk game (the old one resembled a famous platformer) |
| 5 | most blocks at 6 | morning tripod, footprints, gable caps; globe night side, no lights on the ice; macro table and frosted window; `reconnecting…` on the phone; city lamp pools and facades vary |
| 6 | **meets level 6**, one must-fix | the desk chair read as see-through (quilting rows lined up with the floor planks): diamond quilting, outline, lighter fabric; polish: hook higher, arc 30 px further from the buttons, soft street glow, calmer neon ripples |

Final automated gate (21 frames): **0 flat objects, 0 text in UI zones.** Reviewer levels after round 6:
desk 5.5 → fixed, town 6.5, neon 6, station 6, train 6, signal lost 6, macros 5.5–6, front page 6,
globe 6–6.5, outro 6.5, morning 6.

Polish left for the level-8 build: the macro phone is smooth (not pixel art), pixel snow on the
morning square, platform furniture at the station, a lit window cluster at the globe's end marker.
