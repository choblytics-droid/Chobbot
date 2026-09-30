"""Word-level transcription of the whole song (faster-whisper) -> analysis/work/words.json"""
import json, sys
from pathlib import Path
from faster_whisper import WhisperModel
ROOT = Path(__file__).resolve().parent.parent
model = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else "small", device="cpu", compute_type="int8")
segs, info = model.transcribe(str(ROOT / "analysis/work/song.wav"), word_timestamps=True, vad_filter=False, beam_size=5)
print("language", info.language, info.language_probability)
out = []
for s in segs:
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}")
    out.append(dict(start=s.start, end=s.end, text=s.text, words=[dict(w=w.word, start=w.start, end=w.end, p=w.probability) for w in (s.words or [])]))
(ROOT / "analysis/work/words.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
