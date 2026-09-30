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

## Planning table under stated assumptions (Pro plan)

**Assumptions** (not official; replace once you have calibrated):
- A. Pro weekly allowance ≈ **60 active Sonnet-hours** (middle of the 40–80 h third-party estimates).
- B. Opus draws the allowance **~3× faster** than Sonnet.
- C. Agent hours ≈ active hours. Conservative: the time spent waiting for renders is counted as usage.
- D. The **recommended mix** is Opus for ~25% of the work (bibles, architecture, critique) and Sonnet for
  ~75% (write–render–fix loops), so 1.5× Sonnet cost overall.
- E. One 5-hour window ≈ 4 agent-hours on Sonnet, ≈ 2 on Opus, ≈ 3 on the mix.
- F. Add **+30%** for rework (direction changes, failed ideas).

| Level | Lines | Styles | Agent hours | % of Pro week — all Sonnet | — recommended mix | — all Opus | 5-hour windows (mix) | With +30% rework (mix) |
|---|---|---|---|---|---|---|---|---|
| 1 | ~4k | 0 | 3–4 | 5–7% | 8–10% | 15–20% | 1–2 | 10–13% |
| 2 | ~6k | 2–3 | 4–5 | 7–8% | 10–13% | 20–25% | 2 | 13–16% |
| 3 | ~8k | 5–6 | 5–6 | 8–10% | 13–15% | 25–30% | 2 | 16–20% |
| 4 | ~10k | 8 | 6–7 | 10–12% | 15–18% | 30–35% | 2–3 | 20–23% |
| 5 | ~13k | 10–12 | 7–8 | 12–13% | 18–20% | 35–40% | 3 | 23–26% |
| 6 | ~16k | 14 | 8–10 | 13–17% | 20–25% | 40–50% | 3–4 | 26–33% |
| 7 | ~19k | 18 | 10–11 | 17–18% | 25–28% | 50–55% | 4 | 33–36% |
| 8 | ~22k | 22 | 11–13 | 18–22% | 28–33% | 55–65% | 4–5 | 36–42% |
| 9 | ~25k | 26 | 13–14 | 22–23% | 33–35% | 65–70% | 5 | 42–46% |
| 10 | ~27k+ | 28–30 | 14–16 | 23–27% | 35–40% | 70–80% | 5–6 | 46–52% |

Reading it: a Level 10 film on the recommended mix ≈ half a Pro week including rework, spread
over ~5–6 five-hour windows (e.g. 2 windows a day for 3 days). All-Opus Level 10 ≈ 70–80% of a week
before rework, so it can overflow into a second week. Rendering is extra GPU time and costs no tokens.

## Default for this project: Opus 5.5 only

Same assumptions: Pro week ≈ 60 Sonnet-hours ≈ **20 Opus agent-hours**; one 5-hour window ≈ 2 Opus agent-hours.

| Level | Lines | Styles | Agent hours | % of Pro week | With +30% rework | 5-hour windows |
|---|---|---|---|---|---|---|
| 1 | ~4k | 0 | 3–4 | 15–20% | 20–26% | 2–3 |
| 2 | ~6k | 2–3 | 4–5 | 20–25% | 26–33% | 3 |
| 3 | ~8k | 5–6 | 5–6 | 25–30% | 33–39% | 3–4 |
| 4 | ~10k | 8 | 6–7 | 30–35% | 39–46% | 4–5 |
| 5 | ~13k | 10–12 | 7–8 | 35–40% | 46–52% | 5 |
| 6 | ~16k | 14 | 8–10 | 40–50% | 52–65% | 5–7 |
| 7 | ~19k | 18 | 10–11 | 50–55% | 65–72% | 7 |
| 8 | ~22k | 22 | 11–13 | 55–65% | 72–85% | 7–8 |
| 9 | ~25k | 26 | 13–14 | 65–70% | 85–91% | 8–9 |
| 10 | ~27k+ | 28–30 | 14–16 | 70–80% | 91–104% | 9–10 |

Levels 1–5 fit in one week comfortably. Levels 7–8 are the top that fit in one week with headroom.
Level 10 ≈ a full week: plan it over two (week 1 lenses, week 2 transitions, sound and polish).
Saving levers on Opus: one lens per session + `/clear`; `/effort` lower for routine loops, high for
bibles and critique; contact sheets instead of many stills; bible first; mix cheap family-A lenses
with expensive family-C ones.

## Opus 5.5 only — Pro vs Max (all figures include the +30% rework buffer)

Extra assumption: **Max 5× ≈ 5 Pro weeks, Max 20× ≈ 20 Pro weeks** of allowance (as the plan names say; not
official numbers). On Max the 5-hour window is no longer the bottleneck: the agent can work the whole
window, so windows needed ≈ agent hours × 1.3 ÷ 5.

| Level | Lines | Styles | Agent hours | **Pro** % of week | **Max 5×** % of week | **Max 20×** % of week | Windows (Pro) | Windows (Max) |
|---|---|---|---|---|---|---|---|---|
| 1 | ~4k | 0 | 3–4 | 20–26% | 4–5% | ~1% | 2–3 | 1–2 |
| 2 | ~6k | 2–3 | 4–5 | 26–33% | 5–7% | 1–2% | 3 | 2 |
| 3 | ~8k | 5–6 | 5–6 | 33–39% | 7–8% | ~2% | 3–4 | 2 |
| 4 | ~10k | 8 | 6–7 | 39–46% | 8–9% | ~2% | 4–5 | 2 |
| 5 | ~13k | 10–12 | 7–8 | 46–52% | 9–10% | 2–3% | 5 | 2–3 |
| 6 | ~16k | 14 | 8–10 | 52–65% | 10–13% | ~3% | 5–7 | 3 |
| 7 | ~19k | 18 | 10–11 | 65–72% | 13–14% | 3–4% | 7 | 3 |
| 8 | ~22k | 22 | 11–13 | 72–85% | 14–17% | ~4% | 7–8 | 3–4 |
| 9 | ~25k | 26 | 13–14 | 85–91% | 17–18% | 4–5% | 8–9 | 4 |
| 10 | ~27k+ | 28–30 | 14–16 | 91–104% | 18–21% | ~5% | 9–10 | 4–5 |

Videos per week at each plan (roughly): Level 10: Pro ≈ 1 (tight), Max 5× ≈ 4–5, Max 20× ≈ 18–20.
Level 5: Pro ≈ 2, Max 5× ≈ 10, Max 20× ≈ 40. Calendar time is then limited by working hours and GPU
rendering, not by the allowance.
