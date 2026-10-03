# Why streamers need Chobbot: pain points, needs, use cases

The videos have one job beyond looking good: **a streamer watches and thinks "that's me", then "that
would fix it".** This file is the source for every script. Each video picks rows from it.

> **Status of the content.** Pain points come from published research (sources at the end) and common
> streamer experience. **Product functions marked (confirm) are assumptions** about what Chobbot does,
> based on the brief: a free live chat bot; after-stream reports, dashboards and an analyst bot; and a
> merged companion. Replace them with the real feature list. Statistics come from search summaries;
> the primary pages were blocked from this machine, so **verify every number before it appears on
> screen**.

## 1. The persuasion path every video follows

| Step | The viewer thinks | On screen |
|---|---|---|
| 1. Recognition | "That's me." | A specific, familiar moment, never a generic "streaming is hard" |
| 2. Cost | "And it's costing me." | What the pain takes away: viewers, money, energy, the reason they stream |
| 3. Need | "What I actually need is…" | The need in the streamer's words, not ours |
| 4. Use case | "Oh, it does *that*." | The function inside a real moment, not a feature list |
| 5. Proof | "It actually works." | A number, a before/after, a real streamer's words |
| 6. Ease | "And I can try it now." | Free, open source, minutes to install |

Short videos (6–15 s) cover steps 1, 4 and 6. Explainers (20–45 s) cover all six. Stories (MVs)
cover 1–2 and let the cameo hint at 4.

## 2. Who we're talking to (personas)

| Persona | Size | Their situation | What they want most |
|---|---|---|---|
| **The Starter** | 0–5 viewers | Streams to an empty or silent chat; talks to nobody for hours | To feel that someone's there; the first regulars |
| **The Grinder** | 5–50, often Affiliate | Plays and runs chat alone; can't read chat while playing; misses newcomers; no time to study VODs | To grow, and to know *what* makes people stay |
| **The Juggler** | 50–500+ | Chat too fast to read; a mod team to coordinate; spam and raids; sponsors want reports | Control, and time back |
| **The Part-timer** | any | A job plus streaming; prep and after-stream admin eat the evenings; burnout | To stream without the admin |
| **The Pro / team** | managers, agencies, VTuber groups | Several channels, sponsor reporting, decisions from data | Reports and dashboards they can hand on |

Most streamers are Starters and Grinders: search summaries put the average at about 26 viewers per
channel, with fewer than 1% of active streamers averaging 15 or more (verify). **The free Live app
speaks to them; Insights speaks to Grinders, Jugglers and Pros.**

## 3. Pain point matrix (by moment in the streamer's journey)

Product layer: **L** = Live app (free), **I** = Insights (subscription), **C** = Companion (merged).

### Before and at the start of the stream

| # | Pain, in their words | What it costs | The need | Chobbot use case | Layer |
|---|---|---|---|---|---|
| 1 | "The first 20 minutes I'm talking to myself." | Early viewers see a dead chat and leave | A chat that's alive from minute one | The bot opens the conversation, asks the question of the day, reacts to the game (confirm) | L |
| 2 | "I never know what to do tonight." | Prep time; inconsistent streams | A plan based on what worked | The analyst bot suggests tonight's game, time and topics from past reports (confirm) | I, C |

### During the stream

| # | Pain, in their words | What it costs | The need | Chobbot use case | Layer |
|---|---|---|---|---|---|
| 3 | "Someone said hi and I didn't see it for 10 minutes." | First-time chatters who aren't answered don't come back (Twitch: viewers who chat on their first visit are ~50% more likely to return, verify) | Never miss a newcomer | The bot greets first-time chatters by name and flags them to the streamer (confirm) | L |
| 4 | "Chat asks the same question 40 times." (specs, schedule, rank) | Interrupts play; repeats | Answers without stopping | The bot answers FAQs in the streamer's own tone (confirm) | L |
| 5 | "I can't read chat and play at the same time." | Questions lost; viewers feel ignored | A filter: what matters right now | The bot surfaces questions and highlights to the streamer (confirm) | L |
| 6 | "Spam, bots and hate raids hit when I'm alone." | Mental health, viewers leave (harassment and hate raids are documented in research) | Protection when no mod is online | Filters and calm responses to raids; logs for later (confirm) | L |
| 7 | "Long quiet stretches kill the vibe." | Retention drops in the slow parts of the game | Energy when it dips | Polls, trivia, callbacks to running jokes on low-chat moments (confirm) | L, C |
| 8 | "It's lonely." | Burnout (search summaries: ~43% of creators feel isolated, verify) | A co-host who's always there | The bot as a sidekick with a personality, not a command list | L, C |

### After the stream

| # | Pain, in their words | What it costs | The need | Chobbot use case | Layer |
|---|---|---|---|---|---|
| 9 | "Why did everyone leave at 1:12?" | Repeating what doesn't work | To see the cause | Retention report: viewer curve aligned with what happened in chat and on stream (confirm) | I |
| 10 | "I'd have to rewatch 4 hours of VOD." | Hours of admin per stream | The best moments, found for me | Highlights and clip-worthy moments from chat spikes (confirm) | I |
| 11 | "I don't know who my regulars are." | Regulars feel unnoticed | To know my community | Community report: regulars, newcomers who returned, top chatters (confirm) | I, C |
| 12 | "Analytics pages are just numbers." | Data never turns into decisions | Answers, not charts | Ask the analyst bot: "What should I change next week?" | I |
| 13 | "A sponsor wants a report by Friday." | Hours in spreadsheets; lost deals | A report I can send | A shareable report (confirm) | I |

### Over months

| # | Pain, in their words | What it costs | The need | Chobbot use case | Layer |
|---|---|---|---|---|---|
| 14 | "Every stream starts from zero." | No continuity; running jokes forgotten | Something that remembers | The companion remembers regulars, jokes, milestones, and brings them up live | C |
| 15 | "I've been stuck at 12 viewers for a year." | Motivation; quitting | To see progress and the next step | Trends over months and one concrete next step per week (confirm) | I, C |
| 16 | "I'm burning out." (search summaries: ~62% of creators report burnout, verify) | Quitting | Less admin, less loneliness, small wins visible | All of the above, framed as time and energy given back | L, I, C |

## 4. Use cases as scenes (each one can be an episode)

| # | Title | Persona | Before | With Chobbot | Proof to show |
|---|---|---|---|---|---|
| U1 | **"Hi?" → "Welcome back, Sam!"** | Starter | A newcomer types "hi", waits, leaves | Greeted in 2 s; returns next week and is remembered | Returning-newcomer count in the report |
| U2 | **The 40th "what rank are you?"** | Grinder | The streamer dies in-game answering it | The bot answers; the streamer clutches the round | Questions answered by the bot this stream |
| U3 | **Raid at 2 AM** | Grinder, Juggler | Spam floods the screen, the streamer freezes | Filtered in seconds; the stream goes on | Messages blocked, time to calm |
| U4 | **The 1:12 mystery** | Grinder | The viewer graph drops; no idea why | The report lines the drop up with a 9-minute loading screen + silent chat | The aligned graph |
| U5 | **4 hours → 4 clips** | Part-timer | Scrubbing VODs at midnight | Highlights ready when the stream ends | Minutes saved |
| U6 | **"What should I change?"** | Grinder, Pro | Staring at dashboards | Asks the analyst bot, gets 3 concrete answers | Next week's numbers vs. this week's |
| U7 | **The running joke** | any | A regular's inside joke forgotten | The companion brings it back on the anniversary | Chat reaction |
| U8 | **Friday sponsor report** | Pro, Juggler | A weekend in spreadsheets | One shareable report | Time from request to sent |

## 5. Objections the videos must answer

| Objection | Answer to show, not say |
|---|---|
| "A bot makes my chat fake." | The bot is clearly labelled and speaks as itself. It **amplifies the streamer, never pretends to be viewers.** |
| "My data, my community." | Open source; you can read what it does. State plainly who owns the data and where it lives (needs the real policy). |
| "Another tool to set up." | Show the install, in real time if it's short. |
| "It'll replace my mods." | It covers the hours when no mod is online and hands logs to the mods. |
| "Why pay for Insights?" | The free bot helps tonight. Insights tells you why, and the companion remembers. Show the difference, not the price. |

**Brand guardrail:** never suggest fake viewers, fake chatters or anything that looks like
view-botting. That breaks platform rules and the trust the open-source part is meant to build.

## 6. Proof we need to collect

The claims are only as convincing as the proof. Ask beta users for:
- before/after numbers (returning chatters, average watch time, time spent on after-stream admin);
- 1–2 sentence quotes, with permission to use their name or channel;
- screen recordings of real moments (the welcome, the raid filter, the report).

Until real proof exists, the videos show the use case and the logic of the outcome, and **don't invent
numbers**.

## 7. Validating the pain points (one week, no budget)

1. **Listen:** collect 50 real posts from streamer communities (r/Twitch, r/smallstreamers, creator
   Discords) and tag each with a pain number from section 3. Count. The top 5 become the first episodes.
2. **Ask:** 10 short interviews with streamers of different sizes:
   - What happens in the first 15 minutes of your stream?
   - When did chat last frustrate you? What happened?
   - What do you do after you press "end stream"? How long does it take?
   - How do you decide what to stream next?
   - What would you never let a bot do on your channel?
   - What would make you pay for a tool?
3. **Rank** pain points by how often they come up and how strongly they're felt, then update section 3.

## 8. How this maps to the three series

- **Series 1, Streamer Stories:** stories chosen because they show a pain from section 3 (the
  `goignon` audit tags each story with a pain number). The cameo hints at the matching use case.
- **Series 2, Pain → Need → Function:** one episode per use case U1–U8, in order of the validated
  ranking. Each one follows the six steps in section 1.
- **Series 3, Master film:** the journey in section 3 in one arc. Start (1, 3), during (5, 6, 8),
  after (9, 12), months (14, 15). The companion grows at each stage.

## Sources (from search summaries; primary pages could not be opened from this machine)

- Twitch Creator Camp, new viewer retention: <https://twitch.tv/creatorcamp/en/paths/establish-your-brand/new-viewer-retention>
- Harvard T.H. Chan School of Public Health, creator mental health study: <https://hsph.harvard.edu/news/content-creators-are-struggling-with-mental-health-study-finds>
- Tubefilter, Creators 4 Mental Health study (Nov 2025): <https://www.tubefilter.com/2025/11/12/creators-4-mental-health-burnout-study-results/>
- Stream Scheme, Twitch statistics: <https://www.streamscheme.com/twitch-statistics/>
- Statista, active streamers on Twitch: <https://www.statista.com/statistics/746173/monthly-active-streamers-on-twitch>
- Research on harassment of marginalized streamers and hate raids (NJIT / NSF PAR): <https://digitalcommons.njit.edu/fac_pubs/4031>, <https://par.nsf.gov/biblio/10569890>
- Tampere University PlayLab, watch time vs. donations: <https://blogs.tuni.fi/playlab/game-research-highlights/watch-time-or-donations-twitch-streamer-choose-one/>
