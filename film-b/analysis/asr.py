"""Rough lyric transcription with Whisper-small (sherpa-onnx, GitHub-hosted weights).
Decodes overlapping windows so every line gets an approximate time. -> analysis/work/asr.json"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf, sherpa_onnx
ROOT = Path(__file__).resolve().parent.parent
M = Path("/home/user/models/sherpa-onnx-whisper-small")
lang = sys.argv[1] if len(sys.argv) > 1 else ""
win, hop = float(sys.argv[2]) if len(sys.argv) > 2 else 8.0, float(sys.argv[3]) if len(sys.argv) > 3 else 4.0
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(M / "small-encoder.int8.onnx"), decoder=str(M / "small-decoder.int8.onnx"),
                                                tokens=str(M / "small-tokens.txt"), language=lang, task="transcribe", num_threads=4)
y, sr = sf.read(ROOT / "analysis/work/song.wav", dtype="float32")
y16 = np.interp(np.arange(0, len(y), sr / 16000), np.arange(len(y)), y).astype(np.float32)
out = []
t = 0.0
while t < len(y16) / 16000:
    seg = y16[int(t * 16000):int((t + win) * 16000)]
    s = rec.create_stream(); s.accept_waveform(16000, seg); rec.decode_stream(s)
    txt = s.result.text.strip()
    print(f"[{t:6.1f}-{t+win:6.1f}] {s.result.lang if hasattr(s.result,'lang') else ''} {txt}", flush=True)
    out.append(dict(start=t, end=t + win, text=txt))
    t += hop
(ROOT / "analysis/work/asr.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
