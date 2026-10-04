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
