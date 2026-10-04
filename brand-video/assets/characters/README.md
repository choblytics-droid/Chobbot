# Chob + Yutoo cutouts (brand films, brand covers)

Source: `D:\APP\KIE AI\posters\recruitment_poster_textless.png`, re-rendered by GPT Image 2.5 Sunburst
(kie, image-to-image, 2K, 2026-10-05, 10 credits) with only the two characters on flat pure green.

| File | What | Use |
|---|---|---|
| `chob_yutoo_green_source.png` | the kie output, 1536x2736, characters on #00FF00 | the master; re-key from it |
| `chob_yutoo_pair.png` | both characters, transparent, clean edges | **use this** |
| `yutoo_cut_from_pair.png` | Yutoo alone (it stands in front, so it is complete) | OK; small holes in the scarf knot |
| `chob_cut_from_pair_has_gaps.png` | Chob alone | gaps where Yutoo covered him (scarf, right side); not for use alone |

Keyed and split by `tools/cut_characters.py` (green key + despill, Yutoo cut along its own outline).
Streamer Stories never use these (no brand); brand films and brand covers do.
