# 05 — Sound design (measured from the soundtrack)

The closing card says the sound is also synthesized in code (声音也由代码合成 · 100% code). Measured from
the uploaded file (AAC, mono analysis at 22.05 kHz, RMS in 0.1 s windows, spectrograms).

## Timeline

| Time (s) | Level (RMS dBFS) | Content |
|---|---|---|
| 0.0–3.0 | −30 to −37 | **Room tone** (broadband noise, pink-ish); faint low **"lub-dub" double thumps** at ~0.8/1.1, 1.7/2.0, 2.5/2.8 (a heartbeat, ~67 bpm); a thin **7.4 kHz whine** (the monitor), growing |
| 3.0–3.3 | falls | The whine **swells to a point** as the cursor collapses (an audio mirror of the shrinking bar) |
| **3.2–4.3** | **digital zero (−180)** | **Absolute silence** at the flash. Labelled in the end waveform "3.2s 光到达（绝对静音）" |
| 4.4–14.4 | −20 to −31, rising | **The montage**: a distinct sonic texture per medium (see below), accelerating with the cuts, a crescendo to −16 dB max at 14.0 |
| **14.5–16.1** | **digital zero** | Silence again at the white-out |
| 16.2–26 | −94 → −36 | The **7.4 kHz tone returns**, pulsing every ~0.58 s and slowly swelling. At **23.0–25.6 s the characters 光先到 are drawn into the spectrogram** between ~6.1 and 8.9 kHz. They're inaudible as text and visible only in a spectrogram |
| 20.3–26 | rising | A **heartbeat** (lub-dub pairs at 100–250 Hz) enters with the eye shot: ~83 bpm, getting louder, then **accelerating to ~100 bpm** from ~26 s with rising broadband noise (the approaching wave) |
| **27.5–29.0** | **−10 (loudest)** | **The boom**: dense low-frequency energy (centroid falls to ~900 Hz), a long decay. Synced to the visual collapse and datamosh at 27.63. Labelled "27.6s 声音到达" |
| 29–31.5 | decays to −79 | Tail |
| 32–37 | −20 to −25 | Credits: a reprise of the montage sound |
| 37–38 | digital zero | Silence |
| 38.5–42 | −94 → −56 | The rising 7.4 kHz tone again, under the waveform card (the soundtrack is replayed as its own visualisation) |

## The montage's per-medium sounds (spectrogram, 4.2–14.2 s)

The texture changes at the visual cuts. What is visible:
- **Tonal partials that change with each medium:** clean horizontal lines at specific frequencies
  (bell- and chime-like partials around the porcelain; stacked harmonics like an organ around the
  stained glass).
- **Broadband noise bursts** exactly at the material transitions (the rock breaking, the tear, the
  burn).
- **A staircase of rising pitches** as the cuts accelerate (~7.5–8.5 s into the montage), then dense
  ticks: a riser.
- **A crescendo** into a hard cut to silence at 14.4.

Which sound belongs to which medium is inferred from alignment with cuts. The measured facts are
the per-segment changes in partials, bursts at transitions, the rising staircase, the crescendo and
the hard cut.

## Design principles to extract

1. **Silence is the special effect.** Digital zero at the two biggest visual moments (the flash, the
   white-out). Silence after sound is louder than any hit.
2. **A sonic thread for "light":** a high thin tone (7.4 kHz) represents light and screens. It connects
   the monitor, the flash, and the approach, and it carries the hidden title.
3. **The body as the clock:** a heartbeat in the room and under the eye, accelerating as the sound
   approaches.
4. **Sync the one big sound to the one big visual:** the boom and the frame collapse happen on the same
   frame (27.6 s). It is the loudest point of the film by ~10 dB.
5. **Steganography as craft signature:** the title painted into the spectrum. Only people who look
   closely will find it. That's the same idea as the hidden dates in the images.
6. **The soundtrack is also a visual:** the last shot draws the waveform, labelled with the physics.

## How to synthesize in code (recipes)

- **Room tone:** white noise → low-pass ~2 kHz → gentle band-pass; very low level.
- **Heartbeat:** two decaying sine bursts (60–80 Hz fundamental, pitch drop), 120 ms apart; period =
  60/bpm, with bpm as a function of story time.
- **Monitor whine:** a sine at 7.4 kHz with slight amplitude jitter.
- **Spectrogram text:** render the text into a (time × frequency) bitmap; for each column (time
  step), sum sines at the frequencies of lit pixels (6–9 kHz band), with Hann windowing across columns.
  A classic technique (as in Aphex Twin's hidden spectrogram face).
- **Boom:** filtered noise burst (low-pass sweeping down from 2 kHz to 80 Hz) + a sub sine drop (50 →
  25 Hz), long exponential decay, soft clip.
- **Per-medium textures:**
  - porcelain: sine partials with inharmonic ratios (bell)
  - stained glass: stacked harmonic organ
  - paper: filtered noise crackle
  - CRT: 15.7 kHz flyback whine + hum
  - game: square waves
  - thermal/UI: beeps
