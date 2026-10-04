# Content plan: three series, one system

## Confirmed structure (2026-10-03)

| # | Section | Versions | Method |
|---|---|---|---|
| 1 | **Streamer Stories** | Music video | Reddit story (n8n Story Fisher, [`STORY_FISHER.md`](STORY_FISHER.md)) → script → music → video |
| 2 | **Brand · Generic** (pain → need → function) | **A** majestic technical (score + statements) · **B** music video (song) | Script first ([`PIPELINE.md`](PIPELINE.md)) |
| 3 | **Brand · Master** (one film) | **A** majestic technical · **B** music video | Script first; built last |

The working plan is the spreadsheet [`../plan/Chobbot_Media_Plan_v0.1.xlsx`](../plan/Chobbot_Media_Plan_v0.1.xlsx):
one tab per section, plus shared assets. The "Vision track" below is what the A versions are.

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
| The companion: one design that **evolves** stage by stage (spark → spark with a memory ring → full form) | Art styles: each film mixes a style deck (home + 3–5 switch styles from the A tier in [`STYLE_DECK.md`](STYLE_DECK.md)), switching on the music; no anime/cartoon humans |
| Palette: the brand accent is the only colour that glows | Music genre per episode or season |
| Type system: one display font, one mono "machine voice" | Camera grammar and set per story |
| Motion grammar: cuts on downbeats, hold then snap | Emotion: funny, cringe, wholesome, triumphant |
| Sonic logo: a 2-second sound that ends every **brand** video | Platform format: 16:9, 9:16, 1:1 |
| End card (brand films only) and frame template (safe areas, title position, episode tag) | |
| Pain = cold, broken, glitch; solution = warm, clean, spring | |

Rule of thumb: **the world can be anything; the companion, the colour that glows, the type and the
end card are always ours** (in the brand films; Streamer Stories carry no brand, see below).

## Series 1: Streamer Stories (music videos)

- **What:** real stories streamers share online, retold as short music videos. It replaces the
  `goignon` attempt, which stopped because the quality was too low.
- **Format:** 30–60 s, 9:16 first (TikTok, Shorts, Reels), with a 16:9 cut for YouTube. One story per
  episode.
- **The song:** written from the story (each line = one moment), with the same structure every time so
  the engine reuses the timeline logic: hook → story → twist → drop.
- **Where variety goes:** each episode has a **style deck** (a home style + 3–5 switch styles from
  the A tier in [`STYLE_DECK.md`](STYLE_DECK.md)) and switches styles on the music, faster in the
  chorus. People are pixel/voxel sprites or silhouettes; no anime or cartoon humans.
- **The hook (every Story, owner rule 2026-10-04):** the song starts at once (no silent or spliced
  intro). **“Based on a true story”** pops on as a sticker over the first shot on frame 1 (never a
  plain black card, which makes people scroll away):
  - On screen **2.5–3 s** (5 words ≈ 2 s to read on a phone + 0.5 s to notice it); it overshoots in,
    holds, and pops off just after the first cut, so it carries across it.
  - It sits in its own place (a third of the way down), clear of the lyric subtitle, which starts
    with the first sung word.
  - At the end, a small credit: “Story shared by a streamer on Reddit, retold with permission” (or
    “anonymised” if we could not reach the author).
  - Only for real stories (section 1). The brand films are not labelled true stories.
- **No brand (owner rule, 2026-10-04): a Story is not a brand video.** No end card, no logo, no
  tagline, no sonic logo, no companion cameo. The film ends on the story itself (its last fact) with
  the small credit line, and the song's own ending. The channel it is posted on is the only link to us.
- **Rights:** stories posted online belong to their authors. Ask permission, or retell an anonymised
  version; never show usernames, platform logos or a copy of the site's UI.
- **Level:** Level 3–4 per episode (one deep style, ~5–7 agent-hours for the first, ~2–3 h for later
  episodes because the engine, sets and type are reused).
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

## Parallel track: Vision films (majestic, score instead of song)

Every master and product film also gets a **Vision** version alongside the song version: same
approved script beats and the same assets, but a different sound and pace.

- **What it says:** not one pain point but the innovation itself. A new era: everyone gets a second
  brain, a real companion, a supporter.
- **Sound:** an instrumental score (orchestral + electronic, building to one peak) with sparse
  statements on screen and optionally a voice-over. No lyrics.
- **Look:** majestic, technical, universal. Slow, precise camera moves; scale shifts from one desk to a
  planet of lit windows; technical cutaways of the system (exploded, blueprint-like views of
  Live → stream data → Insights → memory → companion); lots of negative space; one light, the
  companion's. The depth path, level 7–8 (light, atmosphere, film pipeline, 1–2 hero shots).
- **Avoid:** AI clichés (brains made of circuits, robots, code rain). The "second brain" is the
  companion's memory ring growing into a constellation, not a literal brain.
- **Keep it true:** every promise ("remembers", "supports", "grows with you") has to match what the
  product actually does at launch.

### Draft structure (60–90 s, five movements, for discussion)

| Movement | Picture | Statement (draft) |
|---|---|---|
| 1. Alone | One streamer, one screen in the dark; pull back through the window to a city, then a planet of lit windows | "Every night, millions create alone." |
| 2. The spark | One window gets a warm light: the companion is born, free and open to everyone | "Until now." |
| 3. The architecture | A majestic flythrough of the system: the live chat, the stream's data, the reports, the memory | "It listens. It learns. It remembers." |
| 4. The second brain | The memory ring grows into a constellation around the streamer, years of streams in it | "Not a tool. A second brain." |
| 5. A new era | The planet again: window after window lights warm; the logo | "A companion for every creator." |

The same five movements can be cut per product: **Live** (the spark, free and open), **Insights**
(the second brain), **Companion** (the supporter that grows with you).

## Order of work

Every film follows [`PIPELINE.md`](PIPELINE.md): brief → script → music → analysis → style frames →
assets → animatic → build. **Nothing is built before its script is approved and its audio exists.**

1. `goignon` overview (your local model, prompt in `PROMPT_goignon_overview.md`).
2. Briefs for a first slate of three: `stories-01` (from the goignon report), `pain-01-hello` (use case
   U1), `vision-01-second-brain`.
3. Scripts for the slate ([`SCRIPT_TEMPLATE.md`](SCRIPT_TEMPLATE.md)), for your approval.
4. Music written to the approved scripts.
5. Then style frames, assets, animatic and build, film by film.
