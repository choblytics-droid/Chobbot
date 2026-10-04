# ST-01 · QA log (docs/QA.md)

## Run 1 · 2026-10-04 · after the owner's note "very lazy detail, not level 6" (the castle)

| Check | Result before | Fix | Result after |
|---|---|---|---|
| QA-1 facts | invented `· reconnected ·` line (found earlier) | removed | pass |
| QA-2 detail (G-buffer FLAT objects, 13 → 20 frames) | **153 flat objects** (castle, hill, every house wall, train body, canopy, carriage wall/seats, the whole desk room) | materials library (`kit/materials.ts`), castle rebuilt (`sets/castle.ts`), houses, huts, carousel, station, carriage, desk rebuilt; ambient occlusion in the light pass | **0 flat objects** over 20 frames |
| QA-3 safe zones | desk caption + morning `LIVE` in the top bar; train + thank-you lyrics, station chat and the credit in the caption zone; station lyric, "End stream?" and the chat scrim under the right buttons | moved up/in; lyrics in the buttons band wrap narrower; scrim fades before the buttons; automatic `text.json` check | **0 text in UI zones** |
| QA-3 contrast | station lyric partly over the bright snowy ridge | (see review) | open |
| QA-5 independent review | — | — | running |
