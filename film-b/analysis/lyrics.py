"""Clip lyrics -> data/lyrics.json (word-level, clip time).

Text: the lines as sung (Parakeet-TDT on the UVR vocal stem, cross-checked with Whisper-small;
the one phrase neither model agrees on, "... of you," between "curse" and "yeah", is left out).
Timing: each corrected word is matched to Parakeet's word timestamps (difflib on normalised
words); unmatched words are interpolated between their matched neighbours. Word ends are the next
word's start, except where the vocal stem goes quiet sooner (held line endings are measured on
the stem's energy).

Run after vocals_asr.py:  python3 analysis/lyrics.py
"""
import difflib
import glob
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
W = ROOT / "analysis/work"
audio = json.loads((ROOT / "data/audio.json").read_text())
T0, DUR = audio["song_offset"], audio["duration"]

LINES = [
    "I'm the king of the shadows in his broken heart",
    "He told me everything, oh, I hope he was the worst",
    "I'm the ghost in his mind, I'm the beautiful curse",
    "yeah, keep the legend alive",
    "I hope I'm the reason he can barely survive",
    "He's talking loud, keep spreading the infection",
    "Building a wall, seeking protection",
    "And he tells you I'm toxic, he tells you I'm the end",
    "Burning every bridge, losing every friend",
    "But, but, but every word he speaks is a tribute to my name",
]

norm = lambda s: re.sub(r"[^a-z']", "", s.lower().replace("’", "'"))

rec = json.loads((W / "vocal_words.json").read_text())
pw = [w for p in rec for w in p["words"] if w["w"].strip()]
# the hook's "ghost" is heard as "boss"/"boast" by the recogniser: normalise before matching
alias = {"boss": "ghost", "boast": "ghost"}
pn = [alias.get(norm(w["w"]), norm(w["w"])) for w in pw]

words = []  # (line index, text)
for li, line in enumerate(LINES):
    for w in line.split():
        words.append((li, w))
wn = [norm(w) for _, w in words]

# anchor the search window around the clip (the verse repeats elsewhere in the song)
lo = next(i for i, w in enumerate(pw) if w["start"] > T0 - 8)
hi = next(i for i, w in enumerate(pw) if w["start"] > T0 + DUR + 6)
sm = difflib.SequenceMatcher(a=wn, b=pn[lo:hi], autojunk=False)
start = [None] * len(words)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        start[a + k] = pw[lo + b + k]["start"]
matched = sum(s is not None for s in start)
print(f"matched {matched}/{len(words)} words")
# interpolate the gaps
idx = [i for i, s in enumerate(start) if s is not None]
for i in range(len(start)):
    if start[i] is None:
        prev = max([j for j in idx if j < i], default=None)
        nxt = min([j for j in idx if j > i], default=None)
        if prev is not None and nxt is not None:
            start[i] = start[prev] + (start[nxt] - start[prev]) * (i - prev) / (nxt - prev)
        elif prev is not None:
            start[i] = start[prev] + 0.25 * (i - prev)
        else:
            start[i] = start[nxt] - 0.25 * (nxt - i)

# vocal energy for held endings
voc, sr = sf.read(glob.glob(str(W / "stems/*Vocals*.wav"))[0], dtype="float32")
if voc.ndim > 1:
    voc = voc.mean(1)
h = sr // 100
db = 20 * np.log10(np.sqrt(np.convolve(voc ** 2, np.ones(h) / h, "same")[::h]) + 1e-6)
loud = np.percentile(db[int(T0 * 100):int((T0 + DUR) * 100)], 90)


def quiet_after(t, cap):
    """First time after t + 0.2 s where the vocal stays 20 dB under its loud level for 120 ms."""
    i = int((t + 0.2) * 100)
    while i < int(cap * 100):
        if (db[i:i + 12] < loud - 20).all():
            return i / 100
        i += 1
    return cap


out = []
for li, line in enumerate(LINES):
    ks = [k for k, (l, _) in enumerate(words) if l == li]
    ws = []
    for n, k in enumerate(ks):
        s = start[k]
        nxt = start[k + 1] if k + 1 < len(start) else s + 1.5
        last = n == len(ks) - 1
        e = quiet_after(s, min(nxt, s + (3.0 if last else 1.2)))
        e = max(e, s + 0.12)
        ws.append(dict(w=words[k][1], start=round(s - T0, 3), end=round(e - T0, 3)))
    out.append(dict(text=line, start=ws[0]["start"], end=ws[-1]["end"], words=ws))
    print(f"{ws[0]['start']:7.2f}-{ws[-1]['end']:6.2f}  {line}")
(ROOT / "data/lyrics.json").write_text(json.dumps(dict(source="parakeet-tdt + whisper-small on UVR vocal stem", lines=out), ensure_ascii=False, indent=1))
