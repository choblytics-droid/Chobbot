"""Word timings for the sung lyrics.

Vocal stem (UVR-MDX-NET-Voc_FT via audio-separator) -> phrases split on vocal silences ->
each phrase decoded by Parakeet-TDT (token timestamps) and Whisper-small (text cross-check).
Writes analysis/work/vocal_words.json: [{start,end,parakeet,whisper,words:[{w,start,end}]}]
"""
import json
from pathlib import Path
import numpy as np, soundfile as sf, sherpa_onnx
ROOT = Path(__file__).resolve().parent.parent
W = ROOT / "analysis/work"
voc, sr = sf.read(next((W / "stems").glob("*Vocals*.wav")), dtype="float32")
if voc.ndim > 1: voc = voc.mean(1)
v16 = np.interp(np.arange(0, len(voc), sr / 16000), np.arange(len(voc)), voc).astype(np.float32)
# vocal activity: 20 ms RMS, gate relative to the loud level
h = 320
rms = np.sqrt(np.convolve(v16 ** 2, np.ones(h) / h, "same")[::h])
db = 20 * np.log10(rms + 1e-6)
act = db > np.percentile(db, 95) - 28
# phrases: active runs, merging gaps < 0.35 s, dropping blips < 0.25 s
runs, i = [], 0
while i < len(act):
    if act[i]:
        j = i
        while j < len(act) and act[j]: j += 1
        runs.append([i * 0.02, j * 0.02]); i = j
    else: i += 1
ph = []
for a, b in runs:
    if ph and a - ph[-1][1] < 0.35: ph[-1][1] = b
    else: ph.append([a, b])
ph = [p for p in ph if p[1] - p[0] > 0.25]
M = Path("/home/user/models")
pk = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=str(M / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/encoder.int8.onnx"),
    decoder=str(M / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/decoder.int8.onnx"),
    joiner=str(M / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/joiner.int8.onnx"),
    tokens=str(M / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/tokens.txt"), model_type="nemo_transducer", num_threads=4)
wh = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(M / "sherpa-onnx-whisper-small/small-encoder.int8.onnx"),
    decoder=str(M / "sherpa-onnx-whisper-small/small-decoder.int8.onnx"), tokens=str(M / "sherpa-onnx-whisper-small/small-tokens.txt"),
    language="en", task="transcribe", num_threads=4)
out = []
for a, b in ph:
    a0, b0 = max(0, a - 0.15), b + 0.15
    seg = v16[int(a0 * 16000):int(b0 * 16000)]
    s = pk.create_stream(); s.accept_waveform(16000, seg); pk.decode_stream(s)
    toks, ts = s.result.tokens, s.result.timestamps
    words = []
    for tok, tt in zip(toks, ts):
        if tok.startswith("▁") or tok.startswith(" ") or not words:
            words.append({"w": tok.replace("▁", "").strip(), "start": round(a0 + tt, 3)})
        else:
            words[-1]["w"] += tok
    for k, w in enumerate(words):
        w["end"] = round(words[k + 1]["start"] if k + 1 < len(words) else b, 3)
    s2 = wh.create_stream(); s2.accept_waveform(16000, seg); wh.decode_stream(s2)
    out.append(dict(start=round(a, 3), end=round(b, 3), parakeet=s.result.text.strip(), whisper=s2.result.text.strip(), words=words))
    print(f"[{a:6.2f}-{b:6.2f}] P: {s.result.text.strip()}\n                W: {s2.result.text.strip()}", flush=True)
(W / "vocal_words.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
