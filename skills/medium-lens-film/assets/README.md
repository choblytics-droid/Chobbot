# Assets — visual references (not committed)

The study sheets are frames of the film 《光先到》 (Bilibili BV1jyaA6QEoH), which belongs to its author, so
they are **not stored in git**. Regenerate them locally from your own copy of the video:

    python3 scripts/study_video.py path/to/video.mp4 assets --times "$(cat scripts/guangxiandao_times.txt)"

This writes: `timeline_XX-YYs.png` (whole film at 10 fps), `cuts_sheet.png` (a frame after each of the 59
cuts), `styles_N.png` (one labelled frame per medium, film order), `palettes.txt`, `audio_levels.txt`
and three spectrograms (`spectrogram_high.png` shows the hidden 光先到 title at 6–9 kHz, 23.0–25.6 s).
Feed the sheets to a vision-capable local model alongside `references/03_style_library.md`.
