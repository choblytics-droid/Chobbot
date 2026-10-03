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
- Run 3: see the latest execution in n8n.

## Using it

Open the workflow in n8n → **Execute workflow**. Then open the data table and filter `status = new`.
Copy a chosen story's link and logline into tab **1 Streamer Stories** of the media plan, and set its
status in the table to `shortlisted` (or `used` once a film is made).
