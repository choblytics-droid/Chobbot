# Lyric alignment (how data/lyrics.json was made)

No Hugging Face / PyTorch hub access in the build container, so no Whisper/Demucs. Instead:

1. **Vocal stem** — Spleeter 2stems (weights from the deezer/spleeter GitHub release), in a Python 3.10 venv:
   `spleeter separate -p spleeter:2stems -o stems song.wav`, then
   `ffmpeg -i stems/song/vocals.wav -ar 16000 -ac 1 -af "highpass=f=120,lowpass=f=6000,dynaudnorm" voc16.wav`.
2. **Lyrics text** — read from the MP3's own `lyrics-eng` tag into `lyrics.txt` (`[section]` tags skipped).
3. **Forced alignment** — PocketSphinx 5 (`pip install pocketsphinx`, en-us model bundled) with `set_align_text`:
   - `ps_slide.py`: forward pass, two lines per window, keep the first line, advance.
   - `ps_back.py`: the same pass run from the end of the song backwards.
   - `ps_dp.py`: global likelihood segmentation (tried; singing makes the scores unreliable, not used).
   - `ps_final.py`: line slots where both passes agree; where they disagree, the song's 2-bar line grid decides
     (every line starts on a 2-bar slot, melodic transitions add 4 bars), then each line is re-aligned alone
     inside its slot for word timing.
4. Overlaps clamped; `singer` (A/B) comes from the `[singer A]/[singer B]` tags.

Accuracy: line starts within ~0.2 s, word timings good in dense verses, rougher on held notes and the sparse outro.
