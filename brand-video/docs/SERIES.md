# Content plan: three series, one system

## The product as the videos will show it (working model)

Chobbot is a full AI streamer companion system:

| Part | What it is | Price | In the videos |
|---|---|---|---|
| **Live app** | Open-source chat bot app; download, install, use it to raise engagement during the stream | Free | The companion is **born**: a spark in chat |
| **Insights (back end)** | After the stream, it gathers the data and builds reports, dashboards, and an analyst chat bot you can ask questions | Subscription | The companion **remembers**: it carries the night's data |
| **Companion (merged)** | The same bot lives through the whole ecosystem: it knows what happened live, learns from the reports, and evolves with the streamer | Subscription | The companion **grows**: a new form that keeps its history |
| **Standalone Insights app** | The back end used on its own, without the live bot | Subscription | Optional: a bot that "arrives after the stream" |

### Structure recommendation (open question in the brief)

One account, one bot identity, modules that switch on:

- **Free Live app → Insights subscription → Companion** is one path. "Merged" is a switch inside the
  subscription ("link your live bot"), not a third product.
- The "extra app for individual use" works best as **the same Insights web app** with an import path
  (connect a platform account or upload chat logs or VODs), not a separate app. Three apps would mean
  three brands to explain in every video. One companion with three stages is one story.
- The free, open-source part is the funnel and the trust signal ("you can read the code"). The paid
  value is **memory**: a companion that knows you over months is the thing a free bot can't copy.

This is a recommendation, not a decision. The videos below work either way: they show stages of one
companion, not a price list.

## The consistency system: what never changes, what always changes

| Never changes (the brand) | Always changes (the variety) |
|---|---|
| The companion: one design that **evolves** stage by stage (spark → spark with a memory ring → full form) | Art style per Stories episode (from the 30-style library: anime, papercut, CRT, ukiyo-e, crayon, voxel…) |
| Palette: the brand accent is the only colour that glows | Music genre per episode or season |
| Type system: one display font, one mono "machine voice" | Camera grammar and set per story |
| Motion grammar: cuts on downbeats, hold then snap | Emotion: funny, cringe, wholesome, triumphant |
| Sonic logo: a 2-second sound that ends every video | Platform format: 16:9, 9:16, 1:1 |
| End card and frame template (safe areas, title position, episode tag) | |
| Pain = cold, broken, glitch; solution = warm, clean, spring | |

Rule of thumb: **the world can be anything; the companion, the colour that glows, the type and the
end card are always ours.**

## Series 1: Streamer Stories (music videos)

- **What:** real stories streamers share online, retold as short music videos. It replaces the
  `goignon` attempt, which stopped because the quality was too low.
- **Format:** 30–60 s, 9:16 first (TikTok, Shorts, Reels), with a 16:9 cut for YouTube. One story per
  episode.
- **The song:** written from the story (each line = one moment), with the same structure every time so
  the engine reuses the timeline logic: hook → story → twist → drop.
- **Where variety goes:** each episode takes **one art style** from the style library (the breadth
  path, one style per episode instead of 28 in one film).
- **The brand:** the companion appears as a **cameo**, never a sales pitch: a spark in the chat that
  catches the moment the story turns. A 2-second end card.
- **Rights:** stories posted online belong to their authors. Ask permission, or retell an anonymised
  version; never show usernames, platform logos or a copy of the site's UI.
- **Level:** Level 3–4 per episode (one deep style, ~5–7 agent-hours for the first, ~2–3 h for later
  episodes because the engine, type and end card are reused).
- **Can start now:** yes. Inputs: 3–5 stories (the `goignon` report will list candidates) and a song
  per story.

## Series 2: Pain → Need → Function (brand explainers)

- **What:** one pain point per episode, turned into a need, answered by one product function.
- **Structure (20–45 s):** the pain (cold, glitch, 2–3 words on screen) → the need, said plainly →
  the function, shown in the product (warm, clean) → the stage of the companion it belongs to → end card.
- **Episodes:** one per use case U1–U8 in [`USE_CASES.md`](USE_CASES.md), ordered by the
  validated pain-point ranking. Each follows the six persuasion steps there (recognition → cost →
  need → use case → proof → ease).
- **Look:** the depth path (one consistent look, Level 5–6). UI shots are code stand-ins that read
  the brand tokens, so they switch to the real design when it's ready.
- **Can start now:** the pain and need halves, yes. The function halves wait for the design, or ship
  with stand-ins and get re-rendered later at no token cost.

## Series 3: Master brand film

- **What:** the ecosystem in one 60–90 s film: one streamer, one companion, months of streams.
  Born in the free app (live) → remembers (after the stream) → grows (the merged companion).
- **Built last.** It reuses the companion, sets, type and transitions from series 1 and 2, so it
  costs less and matches them.
- **Level:** 6–8 (the concept in `CONCEPT.md`, extended with the evolution arc).
- **Waits for:** the final design, the product structure decision and the song.

## Order of work

1. `goignon` overview (your local model, prompt in `PROMPT_goignon_overview.md`).
2. **Brand kit in code:** the companion's three stages, palette, type, end card and sonic logo
   placeholder. Every series uses it, so it comes first.
3. Series 1, episode 1 (calibration of cost and look) and series 2, episode 1, in parallel.
4. More episodes; then the master film once the design lands.
