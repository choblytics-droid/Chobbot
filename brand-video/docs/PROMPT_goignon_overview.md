# Prompt: overview of the `goignon` folder (for a local model)

Paste everything below the line into the local model (Claude Code on your PC, or any agent that can
read files), run it from the folder that contains `goignon`, and put the report it writes into
`brand-video/docs/inputs/goignon_overview.md` (or paste it back into the chat).

---

You are auditing a local project folder named `goignon` (and any sibling folders it references). It
holds an earlier attempt at short videos based on streamer stories shared online (e.g. Reddit posts),
plus chat logs with other AI assistants. Production stopped because the output quality was too low.
A new team will rebuild this as code-rendered music videos, and needs a precise overview first.

Rules:
- **Read only.** Do not modify, move or delete anything. Do not run builds, installs or renders.
- **No secrets.** If you see API keys, tokens, passwords or .env values, write only "secret found in
  <path>", never the value.
- **No personal data.** Don't copy real usernames, real names or links to individual posts. Describe
  a story by its theme (e.g. "streamer's first raid, 3 viewers → 300").
- Be concrete: paths, file counts, sizes, dates. Say "unknown" instead of guessing.

Write one Markdown report with these sections:

1. **Inventory.** A tree of the folder to depth 3, with file counts and total size per subfolder.
   Name the file types (video, audio, images, scripts, prompts, chat exports, documents).
2. **What was being made.** The goal, format (length, aspect ratio, platform), and the production
   pipeline step by step: where stories came from, how they were selected, written, voiced or set
   to music, visualised, edited and exported. List the tools, apps, models and services used.
3. **The stories.** A table of every story or episode found: id/filename, theme in one line, emotion
   (funny, sad, triumphant, cringe, wholesome), length, status (idea / script / rendered / published),
   and whether it names a pain point a streamer companion bot could solve (which one).
4. **The chats with other AI assistants.** For each chat file: which assistant, date, topic, and the
   decisions, ideas, scripts or prompts worth keeping. Quote the best prompts verbatim (they are our
   own work). List rejected ideas with the reason if stated.
5. **Why quality was low.** Evidence-based: look at the finished outputs, the notes and the chats. Cover
   visuals (resolution, consistency, stock or AI-generated look, typography), audio, pacing and sync,
   story writing, and the workflow (manual steps, time per episode). Quote complaints if written down.
6. **Brand material.** Anything about Chobbot: product descriptions, features, pain points, user
   quotes, names, logos, colours, fonts, mascot or character designs, taglines.
7. **Reusable assets.** What is worth keeping as is (scripts, story lists, music, artwork, research),
   with paths and licences/sources where known (note anything whose rights are unclear, e.g. copied
   posts, stock media, songs).
8. **Open questions.** What you could not determine and who would know.

End with a 10-line executive summary at the top of the report.
