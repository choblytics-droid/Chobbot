"""Audio analysis for a film (pipeline step 4): vocal stem, word timings, beat grid.

    pip install sherpa-onnx soundfile librosa
    python3 tools/analyze_audio.py films/<film-id>/audio/song.wav films/<film-id>/data/ --models <dir>

Models come from GitHub releases (Hugging Face is blocked in the cloud sessions), into <dir>:
    B=https://github.com/k2-fsa/sherpa-onnx/releases/download
    $B/source-separation-models/sherpa-onnx-spleeter-2stems.tar.bz2
    $B/asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2   (word timestamps)
    $B/asr-models/sherpa-onnx-whisper-medium.en.tar.bz2                (second opinion on words)
Writes vocals.wav, words.json (one entry per sung word, seconds) and beats.json (beats, bpm, bars).
Word timings are model output: check them against the lyrics (sung-as-written check) by hand.
"""
import json, sys, argparse, numpy as np, soundfile as sf, librosa, sherpa_onnx as s

ap = argparse.ArgumentParser()
ap.add_argument("song"); ap.add_argument("out"); ap.add_argument("--models", required=True)
a = ap.parse_args(); M = a.models.rstrip("/") + "/"

# 1. vocal stem (Spleeter 2 stems); a Suno vocal stem is better when the plan has one
sp = M + "sherpa-onnx-spleeter-2stems/"
sep = s.OfflineSourceSeparation(s.OfflineSourceSeparationConfig(model=s.OfflineSourceSeparationModelConfig(
    spleeter=s.OfflineSourceSeparationSpleeterModelConfig(vocals=sp + "vocals.onnx", accompaniment=sp + "accompaniment.onnx"),
    num_threads=4)))
x, sr = sf.read(a.song, dtype="float32", always_2d=True)
res = sep.process(sr, np.ascontiguousarray(x.T))
voc, acc = (np.array(st.data) for st in res.stems)
sf.write(a.out + "/vocals.wav", voc.T, res.sample_rate)

# 2. word timings (Parakeet TDT on the vocal stem)
v16 = librosa.resample(voc.mean(0), orig_sr=res.sample_rate, target_sr=16000)
pk = M + "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/"
rec = s.OfflineRecognizer.from_transducer(encoder=pk + "encoder.int8.onnx", decoder=pk + "decoder.int8.onnx",
    joiner=pk + "joiner.int8.onnx", tokens=pk + "tokens.txt", model_type="nemo_transducer", num_threads=4)
st = rec.create_stream(); st.accept_waveform(16000, v16); rec.decode_stream(st)
words = []
for t, ts in zip(st.result.tokens, st.result.timestamps):
    if t.startswith((" ", "▁")) or not words: words.append({"w": t.strip("▁ "), "t": round(ts, 2)})
    else: words[-1]["w"] += t
json.dump(words, open(a.out + "/words.json", "w"), indent=0)

# 3. beat grid (on the accompaniment, steadier than the full mix)
y = librosa.resample(acc.mean(0), orig_sr=res.sample_rate, target_sr=22050)
_, beats = librosa.beat.beat_track(y=y, sr=22050, units="time", tightness=400)
per = float(np.median(np.diff(beats)))
json.dump({"bpm": round(60 / per, 2), "beat": per, "bar": 4 * per, "beats": [round(float(b), 3) for b in beats]},
          open(a.out + "/beats.json", "w"), indent=0)
print("bpm", round(60 / per, 2), "| words", len(words), "|", " ".join(w["w"] for w in words))
