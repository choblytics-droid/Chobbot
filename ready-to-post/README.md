# Ready to post

One folder per finished film. Everything in it is final: open the folder, upload, paste, done.

```
ready-to-post/
  ST-01_train-ride/
    ST-01_train-ride_video.mp4         the film (1080x1920, 60 fps)
    ST-01_train-ride_cover.png         the cover (1080x1920)
    ST-01_train-ride_description.txt   paste into the TikTok caption as it is
  ST-02_.../
```

## Naming

`<ID>_<name>_<part>.<ext>`

| Piece | Rule | Examples |
|---|---|---|
| `ID` | the film's id from the media plan | `ST-01` … `ST-10` (Streamer Stories), `GN-U1A` (Brand · Generic), `MA-A` (Brand · Master) |
| `name` | short English name, lowercase, words joined with `-` | `train-ride`, `raid-from-the-hero` |
| `part` | always one of three | `video`, `cover`, `description` |

The folder is called `<ID>_<name>`, the same as the film's working folder in `films/`.

## The cover (one series design, only number and title change)

"STORY TIME", the episode number in yellow, the title on a yellow bar, "Based on a true story", pixel
Chob in the streamer's room. Everything sits inside TikTok's 3:4 grid crop. Make a new one with:

```
cd brand-video
python tools/cover.py --num 02 --title "The raid from the hero" --out ../ready-to-post/ST-02_raid-from-the-hero/ST-02_raid-from-the-hero_cover.png
```

## When posting (TikTok)

1. Upload `_video.mp4`, pick `_cover.png` as the cover (Edit cover → Upload).
2. Paste `_description.txt` into the caption.
3. More options → turn on **AI-generated content** (the song is made with Suno).
4. Streamer Stories: no link or name of the Reddit author unless they said yes.
