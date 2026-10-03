# Story Fisher: real streamer stories from Reddit (n8n)

Workflow **"Story Fisher · Reddit streamer stories"** (`JuU4QgIrT1o10zO1`) in the team n8n. Manual
trigger for now; a schedule can be added later. Results go to the n8n data table
**`reddit_streamer_stories`** (`A4EYkpvK6yRL66kK`).

## How it works

1. **Queries.** 8 queries per run, rotating daily through a pool of 16 story phrasings
   (`site:reddit.com twitch "happened on stream"`, `… "first raid"`, `… "almost quit"` …).
   Path-scoped searches like `site:reddit.com/r/Twitch` return almost nothing on Brave, so the
   subreddit goes into the query words instead.
2. **Brave Search** (the community node, credential "Brave Search account"), **one request at a time
   with a 1.5 s pause**: the free plan allows 1 request per second and 2,000 per month.
3. **Keep only Reddit posts** (`/r/<sub>/comments/<id>`), drop duplicates, and skip any post already
   in the table, so a post is never fetched or judged twice.
4. **Full text from PullPush** (`api.pullpush.io`, no login). reddit.com blocks the server, which is
   why the earlier harvest used PullPush too. If PullPush has nothing, the Brave snippet is kept and
   marked `brave_snippet`.
5. **DeepSeek judges** each post: is it a first-person story, quality 1–10, emotion, pain tags (the 16
   pains in `USE_CASES.md`), a one-line logline **from facts in the post only**, why it would work,
   and content flags.
6. **Saved to the table.** Status `new` = story with quality ≥ 6 (the shortlist); `rejected` =
   everything else (kept so it is never re-fetched).

Privacy and tone: usernames are never stored, the post text is kept verbatim, and nothing is
rewritten by the AI. Scripts made from a story go through the human-copy-voice / stop-slop rules,
and the author is asked for permission or the story is anonymised (see `SERIES.md`).

## Test runs (2026-10-03)

- Run 1: hit Brave's 1 request/second limit → fixed with the one-at-a-time loop.
- Run 2: pipeline worked end to end (9 posts, full text from PullPush for 9/9, judged, saved), but
  all 9 were how-to questions from one subreddit and were correctly rejected. Cause: path-scoped
  `site:` queries. Fixed with the new query pool.
- Run 3 (new query pool): 134 Reddit posts found, full text from PullPush for 64 (70 kept the Brave
  snippet), **12 stories shortlisted** (`status = new`, two scored 9/10), 122 rejected. Runtime about
  10 minutes, mostly PullPush at ~4 s per post.

## Next improvements

- **Comments.** "Ask" threads ("Who was the viewer you can't forget?") hold the best stories in their
  comments. Add a PullPush comment fetch (`/reddit/search/comment/?link_id=<id>&sort_type=score`)
  for posts the judge marks as a question thread, and judge the top comments as stories.
- **Speed.** Skip PullPush for posts whose snippet already shows a question or tip list.
- **Freshness.** Add a Brave freshness filter once the node's parameter name is confirmed in the n8n UI.

## Story Context (the full picture)

Workflow **"Story Context · comments + follow-ups"** (`ZaJiPe77HucfhKC1`), run manually after the
Fisher. For every story with `status = new` and no context yet it:

1. fetches the post, its **top 100 comments**, and the **poster's own posts from 60 days before to
   one year after** (backstory and follow-ups), all from PullPush;
2. marks the poster's replies as **OP** and anonymises everyone else (usernames are used only inside
   the run, to recognise the poster, and are never stored);
3. has DeepSeek write the full picture into the same table row: `story_start`, `story_end`,
   `arc_status` (complete / to_be_continued / open_ended / unknown), `op_additions` (facts the poster
   added in comments), `follow_ups`, `audience_reaction`, `script_facts` (each with its source:
   post, OP comment, follow-up post) and `doubts`.

**Rule:** no Story is scripted until its full picture is checked. Only facts the poster stated
(post, OP comments, follow-up posts) go into lyrics and pictures; commenters' guesses never do. If
`arc_status` is `to_be_continued` or `open_ended`, the film says so (for example a "to be continued"
card) instead of inventing an ending.

### First run (2026-10-03, 12 shortlisted stories, ~5 min)

- 9 complete, 3 open-ended (a regular who vanished; an accidental live stream; a TikTok viewer drop),
  0 to be continued. 5–100 comments per story.
- ST-01 confirmed and enriched: the test streams before the tour, the poster's own line about
  feeling like a tourist in their town, and later posts showing they kept streaming IRL.
- ST-02 enriched: the raid was 450 viewers, while the poster chased a personal best with 4 watching.
- 1t4d8fc (accidental live stream) has contradictions and private content: not suitable.

## Using it

Open the workflow in n8n → **Execute workflow**. Then open the data table and filter `status = new`.
Copy a chosen story's link and logline into tab **1 Streamer Stories** of the media plan, and set its
status in the table to `shortlisted` (or `used` once a film is made).
