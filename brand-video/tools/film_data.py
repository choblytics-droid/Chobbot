"""Timing data the renderer reads, from the master audio (pipeline step 4 → build).

    python3 tools/film_data.py <film-id> --models <dir>

Reads films/<id>/audio/<master> (named in data/lyrics_master.json) and data/lyrics_master.json
(the written lyric lines with their start/end in master time). Writes:
  data/audio.json   tempo grid (beats, downbeats), sections, onsets (kick/snare/hat/bell),
                    envelopes at 100 fps (rms, low, mid, high, bell), the master file name
  data/scope.bin    48-band log spectrum (100 fps) + min/max waveform (1 kHz)
  data/lyrics.json  the WRITTEN lyric, word by word: each word timed from the sung words
                    (Parakeet on the vocal stem), unmatched words spread inside their line
"""
import argparse, difflib, json, re
from pathlib import Path
import numpy as np, soundfile as sf, librosa, sherpa_onnx as s

ap = argparse.ArgumentParser(); ap.add_argument("film"); ap.add_argument("--models", required=True)
a = ap.parse_args()
FD = Path(__file__).resolve().parent.parent / "films" / a.film
LM = json.loads((FD / "data/lyrics_master.json").read_text())
master = FD / LM["audio"]
M = a.models.rstrip("/") + "/"
FPS = 100

x, sr = sf.read(master, dtype="float32", always_2d=True)
dur = len(x) / sr

# ---- stems (Spleeter)
sp = M + "sherpa-onnx-spleeter-2stems/"
sep = s.OfflineSourceSeparation(s.OfflineSourceSeparationConfig(model=s.OfflineSourceSeparationModelConfig(
    spleeter=s.OfflineSourceSeparationSpleeterModelConfig(vocals=sp + "vocals.onnx", accompaniment=sp + "accompaniment.onnx"), num_threads=4)))
r = sep.process(sr, np.ascontiguousarray(x.T))
voc, acc = (np.array(st.data).mean(0) for st in r.stems); ssr = r.sample_rate

# ---- beat grid: straight line through the tracked beats (Suno keeps a constant tempo)
acc22 = librosa.resample(acc, orig_sr=ssr, target_sr=22050)
_, bt = librosa.beat.beat_track(y=acc22, sr=22050, units="time", tightness=400)
per = float(np.median(np.diff(bt)))
k = np.round((bt - bt[0]) / per); t0, per = np.linalg.lstsq(np.vstack([np.ones_like(k), k]).T, bt, rcond=None)[0]
t0 = t0 - per * np.floor(t0 / per + 0.06)  # first beat at 0 (or up to 30 ms before: clamped to 0)
beats = [max(0.0, round(t0 + i * per, 4)) for i in range(int((dur - t0) / per) + 1)]
fd = LM.get("first_downbeat", beats[0])
ph = int(round((fd - t0) / per)) % 4
downbeats = beats[ph::4]

# ---- envelopes + onsets
y = librosa.to_mono(x.T); y = librosa.resample(y, orig_sr=sr, target_sr=22050)
hop = 22050 // FPS
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)) ** 2
f = librosa.fft_frequencies(sr=22050, n_fft=2048)
def band(lo, hi):
    e = S[(f >= lo) & (f < hi)].sum(0); e = np.sqrt(e); return e / (np.percentile(e, 99) + 1e-9)
n = int(dur * FPS) + 1
fit = lambda v: np.clip(np.pad(v, (0, max(0, n - len(v))))[:n], 0, 1)
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]; rms = rms / (np.percentile(rms, 99) + 1e-9)
feats = {"rms": fit(rms), "low": fit(band(20, 150)), "mid": fit(band(150, 2500)), "high": fit(band(5000, 11000)), "bell": fit(band(1500, 4500))}
ya = acc22
def ons(lo, hi, thr):
    Sa = np.abs(librosa.stft(ya, n_fft=2048, hop_length=hop)); m = (f >= lo) & (f < hi)
    env = librosa.onset.onset_strength(S=librosa.amplitude_to_db(Sa[m] + 1e-6), sr=22050, hop_length=hop)
    env = env / (env.max() + 1e-9)
    pk = librosa.util.peak_pick(env, pre_max=6, post_max=6, pre_avg=10, post_avg=10, delta=thr, wait=8)
    return [[round(p / FPS, 3), round(float(env[p]), 3)] for p in pk]
onsets = {"kick": ons(30, 120, 0.12), "snare": ons(150, 400, 0.12), "hat": ons(6000, 11000, 0.1), "bell": ons(1500, 4500, 0.12)}
loud = np.convolve(feats["rms"], np.ones(FPS) / FPS, "same")
secs = [{"name": k2, "start": v[0], "end": v[1]} for k2, v in LM["sections"].items() if isinstance(v, list)]
out = {"duration": round(dur, 3), "bpm": round(60 / per, 3), "fps": FPS, "beats": beats, "downbeats": downbeats,
       "sections": secs, "features": {k2: [round(float(v), 3) for v in arr] for k2, arr in feats.items()},
       "onsets": onsets, "drop": LM["sections"].get("chorus", [0])[0], "breaks": [LM["sections"]["break"][0]] if "break" in LM["sections"] else [],
       "song_offset": 0, "audio": LM["audio"],
       "scope": {"file": "data/scope.bin", "specFrames": n, "specBands": 48, "specFps": FPS, "waveRate": 1000, "waveLen": int(dur * 1000)}}
(FD / "data/audio.json").write_text(json.dumps(out))

# ---- scope.bin
mel = librosa.feature.melspectrogram(y=y, sr=22050, n_fft=2048, hop_length=hop, n_mels=48)
mdb = librosa.power_to_db(mel, ref=np.max); spec = np.clip((mdb + 80) / 80, 0, 1).T
spec = np.pad(spec, ((0, max(0, n - len(spec))), (0, 0)))[:n]
mono = x.mean(1); wl = int(dur * 1000); step = sr / 1000
mn = np.array([mono[int(i * step):int((i + 1) * step)].min() for i in range(wl)])
mx = np.array([mono[int(i * step):int((i + 1) * step)].max() for i in range(wl)])
(FD / "data/scope.bin").write_bytes(np.concatenate([(spec * 255).astype(np.uint8).ravel(), ((mn + 1) * 127.5).clip(0, 255).astype(np.uint8), ((mx + 1) * 127.5).clip(0, 255).astype(np.uint8)]).tobytes())

# ---- lyrics: written words, timed from the sung words
pk = M + "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/"
rec = s.OfflineRecognizer.from_transducer(encoder=pk + "encoder.int8.onnx", decoder=pk + "decoder.int8.onnx", joiner=pk + "joiner.int8.onnx", tokens=pk + "tokens.txt", model_type="nemo_transducer", num_threads=4)
st = rec.create_stream(); st.accept_waveform(16000, librosa.resample(voc, orig_sr=ssr, target_sr=16000)); rec.decode_stream(st)
sung = []
for tk, ts in zip(st.result.tokens, st.result.timestamps):
    if tk.startswith((" ", "▁")) or not sung: sung.append([tk.strip("▁ "), ts])
    else: sung[-1][0] += tk
norm = lambda w: re.sub(r"[^a-z']", "", w.lower())
lines = []
for L in LM["lines"]:
    ws = L["text"].split()
    cand = [w for w in sung if L["start"] - 0.6 <= w[1] <= L["end"] + 0.3]
    sm = difflib.SequenceMatcher(a=[norm(w) for w in ws], b=[norm(c[0]) for c in cand], autojunk=False)
    tt = [None] * len(ws)
    for blk in sm.get_matching_blocks():
        for i in range(blk.size): tt[blk.a + i] = cand[blk.b + i][1]
    tt[0] = tt[0] if tt[0] is not None else L["start"]
    # fill gaps by spreading between known neighbours (and the line end)
    known = [(i, v) for i, v in enumerate(tt) if v is not None] + [(len(ws), L["end"])]
    for (i0, v0), (i1, v1) in zip(known, known[1:]):
        for j in range(i0 + 1, i1): tt[j] = v0 + (v1 - v0) * (j - i0) / (i1 - i0)
    words = []
    for j, w in enumerate(ws):
        e = tt[j + 1] if j + 1 < len(ws) else L["end"]
        words.append({"w": w, "start": round(tt[j], 3), "end": round(max(tt[j] + 0.08, min(e, tt[j] + 0.9)), 3)})
    lines.append({"id": f"l{L['n']}", "text": L["text"], "start": words[0]["start"], "end": L["end"], "words": words})
(FD / "data/lyrics.json").write_text(json.dumps({"lines": lines}, indent=1))
print(f"bpm {60/per:.2f}, beats {len(beats)}, downbeats from {downbeats[0]:.3f}, onsets " + ", ".join(f"{k2} {len(v)}" for k2, v in onsets.items()))
for l in lines: print(f"{l['start']:6.2f} {l['text']}  | " + " ".join(f"{w['w']}@{w['start']:.2f}" for w in l["words"][:4]))
