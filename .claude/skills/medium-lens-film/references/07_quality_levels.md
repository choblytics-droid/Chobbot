# 07 — Quality levels: lines, effort, tokens, and plan usage

A standard scale for ordering a shader film at a known cost.
- **Level 1** is our first Venmar × Quest music video: ~4,000 lines of scene code, one pass.
- **Level 10** is 《光先到》: ~27,000 lines, ~16 hours, ~30 GB.

## How the numbers are estimated

- **Verified lines per agent-hour:** ~1,700–2,000. Code is written, rendered to stills, looked at and
  fixed, usually 2–4 times per block. The fast lines in a level are cheap; the verified ones cost the time.
- **Tokens:** an agent session re-sends its whole context on every request. That is mostly **cached
  input** (billed/limited at a fraction of fresh input), plus a small amount of **output** (the code,
  plus thinking). Rough rates for this kind of work, per 1,000 verified lines:
  - requests: ~40–80 (edit, render, view stills, fix)
  - cached input read: ~5–10 M tokens (context of 80–200 k × requests; images of stills add a lot)
  - output (code + reasoning): ~60–120 k tokens
- **Rendering time is separate.** It costs machine time (GPU hours), not tokens, except for the few
  stills the agent looks at.

## The levels

| Level | Lines (≈) | What you get | Media / lenses | Agent hours (≈) | Requests (≈) | Tokens (≈ total, mostly cached) | Output tokens (≈) |
|---|---|---|---|---|---|---|---|
| **1** | 4 k | One visual language, 1 pass per scene, post FX, lyric sync (our first MV) | 0 lenses (1 look) | 3–4 h | 200–300 | 25–40 M | 0.3–0.5 M |
| **2** | 6 k | + 2 review passes per scene, better character poses, cleaner typography | 2–3 light lenses (~300 lines) | 4–5 h | 300–450 | 35–55 M | 0.4–0.7 M |
| **3** | 8 k | + material transitions (burn, bleed, shatter), shared state for "the moment" | 5–6 light lenses | 5–6 h | 400–550 | 45–75 M | 0.5–0.9 M |
| **4** | 10 k | + medium bibles (6–8 defects each), locked composition, music-synced lens cuts | 8 medium lenses (~500 lines) | 6–7 h | 450–650 | 55–90 M | 0.6–1.1 M |
| **5** | 13 k | + mosaic reprise, per-lens in-world text, one silence/hit sync moment | 10–12 medium lenses | 7–8 h | 550–800 | 70–120 M | 0.8–1.4 M |
| **6** | 16 k | + one hero "real" shot (volumetric or detailed 3D), lens families A/B/C mixed | 14 lenses | 8–10 h | 650–950 | 85–150 M | 1.0–1.7 M |
| **7** | 19 k | + full bibles (10–15 defects), objects photographed in light (vase, plate, paper) | 18 lenses | 10–11 h | 750–1,100 | 100–175 M | 1.2–2.0 M |
| **8** | 22 k | + 2 hero shots, bespoke transition for every cut, nested pull-back ending | 22 lenses | 11–13 h | 850–1,250 | 115–200 M | 1.4–2.3 M |
| **9** | 25 k | + 3 hero shots, hidden dates/numbers across media, sound design synced | 26 lenses | 13–14 h | 950–1,400 | 130–230 M | 1.6–2.6 M |
| **10** | 27 k+ | 《光先到》 level: 28–30 lenses at 350–1,300 lines, 4 hero shots, all-bespoke transitions, synthesized sound with a hidden spectrogram, proof ending | 28–30 lenses | 14–16 h | 1,000–1,500 | 140–250 M | 1.7–2.8 M |

Rendering on top (not tokens): Level 1–3 at 1080p is minutes to ~1 hour on a GPU. Level 8–10 at
4K with motion blur is 5–14 GPU hours, and on a CPU-only machine it's days.

## Plan usage: how to get *your* percentage

Anthropic doesn't publish plan limits in tokens. Pro has a rolling 5-hour window plus a weekly
cap, and Opus draws the allowance much faster than Sonnet. So measure once and scale:

1. Open **claude.ai → Settings → Usage** (or `/usage` in Claude Code) and note the weekly bar.
2. Run a **calibration task**: one lens at full depth (~500–800 lines, bible + defects + review), or a
   Level 1 scene set.
3. Note the weekly bar again. `P = % used`, `L = verified lines produced`.
4. **Your cost for level N ≈ P × (lines of level N ÷ L).** Weeks needed ≈ that ÷ 100%.

Worked example with made-up numbers (replace with yours): if a 600-line calibration lens used 4% of
the week, Level 4 (10 k) ≈ 4% × 10,000/600 ≈ 67% of a week, and Level 10 (27 k) ≈ 180%, i.e. about two
weeks on that plan.

Practical expectations:
- **Pro:** Level 1–3 fit in a week, spread over several 5-hour windows. Continuous heavy agent work tends
  to hit the 5-hour window before the 5 hours are up, especially on Opus.
- **Pro, Level 7–10:** plan for several weeks, or a Max plan.
- **Sonnet vs Opus:** use Opus for bibles, architecture and critique (fewer, high-value requests). Use
  Sonnet for the long write-render-fix loops. That stretches any plan a lot.

## Ways to buy quality with fewer tokens

- Keep sessions focused: one lens per session (`/clear` between lenses). A small context makes every
  request cheaper.
- Review stills as small contact sheets (one image, many frames) instead of many full-size images.
- Write the bible first. A precise bible cuts the fix-it rounds roughly in half.
- Family A lenses (sampling the real render) cost 3–10× less code than family C (redrawn iconography).
  Mix them to hit a level cheaply.
