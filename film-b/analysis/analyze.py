"""Music analysis -> data/audio.json (+ data/scope.bin)

Same method as pdoom-video's analysis/analyze.py, without stem separation
(no Demucs here: the drum bands are read off the full mix):

  * constant-tempo beat grid: tempo + phase fitted to the spectral-flux onset
    envelope over the whole song, phase refined on kick attacks,
  * bar phase from where the phrase-level low-end drops/returns land,
  * 100 fps normalised envelopes (rms / low / mid / high / bell),
  * kick / snare / hat / bell (cowbell band) onsets with 0..1 strengths,
  * a 48-band log spectrum at 100 fps and a min/max waveform at 1 kHz for
    the scenes that draw the audio itself.

Everything is written for the CLIP (t = 0 at the clip's first frame), so the
renderer never needs to know where in the song the clip was cut from.

Run:  python3 analyze.py  (needs numpy, scipy, soundfile; ffmpeg on PATH or FFMPEG=...)
"""
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import median_filter, uniform_filter1d
from scipy.signal import butter, find_peaks, sosfiltfilt, stft

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
SR = 44100
FPS = 100

# The cut: bar-aligned. The clip starts on the downbeat 2 bars before the drop
# (the tail of the breakdown, a riser into the drop) and runs 22 bars to the
# phrase downbeat that closes it, plus a short tail so the last hit lands.
CLIP_BARS_BEFORE_DROP = 2
CLIP_SECONDS = 40.0


def decode(path: Path) -> np.ndarray:
    wav = ROOT / "analysis" / "work" / "song.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    if not wav.exists():
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), str(wav)], check=True)
    y, sr = sf.read(wav, dtype="float32")
    assert sr == SR
    return y


def band_sos(lo, hi):
    if lo and hi:
        return butter(4, [lo, hi], btype="band", fs=SR, output="sos")
    if hi:
        return butter(4, hi, btype="low", fs=SR, output="sos")
    return butter(4, lo, btype="high", fs=SR, output="sos")


def frame_rms(x, win=2048):
    hop = SR / FPS
    n = int(math.ceil(len(x) / SR * FPS))
    pad = np.pad(x, (win // 2, win // 2 + int(hop) + 2))
    idx = (np.arange(n) * hop).astype(int)
    c = np.concatenate([[0.0], np.cumsum(pad.astype(np.float64) ** 2)])
    return np.sqrt(np.maximum((c[idx + win] - c[idx]) / win, 0))


def smooth_env(x, attack=0.010, release=0.090):
    """One-pole follower: fast attack, slower release (visual friendly)."""
    aa, ar = math.exp(-1 / (attack * FPS)), math.exp(-1 / (release * FPS))
    y = np.empty_like(x)
    s = 0.0
    for i, v in enumerate(x):
        a = aa if v > s else ar
        s = a * s + (1 - a) * v
        y[i] = s
    return y


def norm01(x, pct=99.0):
    return np.clip(x / (np.percentile(x, pct) + 1e-12), 0, 1)


def band_onsets(x, lo, hi, win=0.010, hop_s=0.002, min_gap=0.08, rel_db=10.0):
    """Onsets in a band: steepest rise of the band's log-energy envelope. Returns (times, peak dB)."""
    xb = sosfiltfilt(band_sos(lo, hi), x)
    h, w = int(hop_s * SR), int(win * SR)
    e = np.convolve(xb.astype(np.float64) ** 2, np.ones(w) / w, mode="same")[::h]
    db = 10 * np.log10(e + 1e-10)
    fps = SR / h
    d = uniform_filter1d(np.diff(db, prepend=db[0]), 3)
    lag = int(0.02 * fps)
    rise = db - np.concatenate([np.full(lag, db[0]), db[:-lag]])
    floor = median_filter(db, int(1.0 * fps) | 1)
    pk, _ = find_peaks(rise, height=rel_db, distance=int(min_gap * fps))
    times, strength = [], []
    for p in pk:
        a = max(0, p - lag)
        q = a + int(np.argmax(d[a:p + 1]))
        peak_db = db[p:p + int(0.03 * fps)].max()
        if peak_db < floor[p] + 3:
            continue
        times.append(q / fps)
        strength.append(peak_db)
    return np.array(times), np.array(strength)


def strength01(db_vals, lo_pct=5, hi_pct=95):
    if len(db_vals) == 0:
        return db_vals
    lo, hi = np.percentile(db_vals, lo_pct), np.percentile(db_vals, hi_pct)
    return np.clip((db_vals - lo) / (hi - lo + 1e-9) * 0.8 + 0.2, 0, 1)


def onset_envelope(y):
    hop = 256
    f, t, Z = stft(y, SR, nperseg=1024, noverlap=1024 - hop, boundary=None, padded=False)
    L = np.log1p(np.abs(Z) * 20)
    o = np.maximum(0, np.diff(L, axis=1)).sum(0)
    return np.concatenate([[0], o]), SR / hop


def fit_grid(y, duration):
    o, ofps = onset_envelope(y)
    o = o / (np.percentile(o, 99) + 1e-9)

    def score(P, off):
        ts = off + P * np.arange(int(duration / P) + 1)
        idx = np.round(ts * ofps).astype(int)
        idx = idx[(idx > 2) & (idx < len(o) - 2)]
        return np.maximum.reduce([o[idx - 1], o[idx], o[idx + 1]]).mean()

    best = (0, None, None)
    for bpm in np.arange(120.0, 145.0, 0.02):
        P = 60 / bpm
        for off in np.arange(0, P, 0.005):
            s = score(P, off)
            if s > best[0]:
                best = (s, bpm, off)
    _, bpm, off = best
    for b2 in np.arange(bpm - 0.03, bpm + 0.03, 0.001):
        P = 60 / b2
        for o2 in np.arange(off - 0.012, off + 0.012, 0.001):
            s = score(P, o2)
            if s > best[0]:
                best = (s, b2, o2)
    _, bpm, off = best
    P = 60 / bpm
    kick_t, _ = band_onsets(y, None, 120, win=0.012, min_gap=0.2, rel_db=12)
    n = np.round((kick_t - off) / P)
    res = kick_t - (off + n * P)
    res = res[np.abs(res) < 0.06]
    off = off + float(np.median(res))
    off = off - P * math.floor(off / P)
    return bpm, P, off, res


def main():
    y = decode(ROOT / "audio" / "song.mp3")
    duration = len(y) / SR
    bpm, P, off, res = fit_grid(y, duration)
    print(f"tempo {bpm:.3f} BPM  period {P:.5f}s  first beat {off:.4f}s  kick residual sd {res.std()*1000:.1f} ms")
    beats = off + P * np.arange(int((duration - off) / P) + 1)

    # low-end per beat: the drop is the first beat after the long bass-less breakdown where the sub returns
    low = frame_rms(sosfiltfilt(band_sos(None, 150), y))
    lowb = np.array([low[int(b * FPS):int((b + P) * FPS)].mean() for b in beats])
    lowb /= np.percentile(lowb, 95)
    quiet = lowb < 0.25
    # longest quiet run (the breakdown) -> the drop is where the sub returns at full level after it
    runs, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            runs.append((j - i, i, j))
            i = j
        else:
            i += 1
    _, bd0, bd1 = max(runs)
    drop = next(k for k in range(bd1, len(beats)) if lowb[k] > 0.7)
    # bar phase: the breakdown starts and the drop lands on downbeats
    phase = drop % 4
    print(f"breakdown beats {bd0}-{bd1} ({beats[bd0]:.2f}-{beats[bd1]:.2f}s), drop beat {drop} ({beats[drop]:.3f}s), "
          f"breakdown start {'on' if bd0 % 4 == phase else 'off'} the bar grid")

    t0 = float(beats[drop - 4 * CLIP_BARS_BEFORE_DROP])
    t1 = t0 + CLIP_SECONDS
    print(f"clip {t0:.3f} - {t1:.3f} s of the song")

    # --- clip audio (the renderer muxes this)
    clip = ROOT / "audio" / "clip.wav"
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-ss", f"{t0:.4f}", "-t", f"{CLIP_SECONDS:.4f}", "-i", str(ROOT / "audio" / "song.mp3"),
                    "-af", f"afade=t=in:d=0.015,afade=t=out:st={CLIP_SECONDS - 0.12:.3f}:d=0.12", "-ar", "48000", "-ac", "2", str(clip)], check=True)

    # --- envelopes over the song, then cropped
    env = {"rms": frame_rms(y)}
    for name, (lo, hi) in {"low": (None, 150), "mid": (150, 2000), "high": (4000, None), "bell": (600, 1400)}.items():
        env[name] = frame_rms(sosfiltfilt(band_sos(lo, hi), y))
    i0, n = int(round(t0 * FPS)), int(round(CLIP_SECONDS * FPS)) + 1
    for k in env:
        e = smooth_env(env[k])
        # normalise on the clip itself (the video only ever sees the clip)
        e = e[i0:i0 + n]
        env[k] = [round(float(x), 3) for x in norm01(e)]

    # --- onsets (full mix; bands chosen for this track: 808/kick, clap/snare, hats, cowbell)
    # (thresholds tuned by counting hits per bar against the audible pattern; the cowbell sits in
    # 700-1200 Hz and is quieter than the drums in the full mix, hence its lower rise threshold)
    kt, kdb = band_onsets(y, None, 120, win=0.012, min_gap=0.15, rel_db=8)
    st, sdb = band_onsets(y, 1500, 5000, win=0.010, min_gap=0.15, rel_db=6)
    ht, hdb = band_onsets(y, 7000, None, win=0.006, min_gap=0.06, rel_db=8)
    bt, bdb = band_onsets(y, 700, 1200, win=0.008, min_gap=0.1, rel_db=4)
    for other, gap in ((kt, 0.03),):
        if len(other) and len(ht):
            keep = np.min(np.abs(ht[:, None] - other[None, :]), axis=1) > gap
            ht, hdb = ht[keep], hdb[keep]

    def crop(ts, ss):
        s01 = strength01(ss)
        return [[round(float(t - t0), 3), round(float(s), 3)] for t, s in zip(ts, s01) if t0 - 0.5 <= t < t1]

    onsets = {"kick": crop(kt, kdb), "snare": crop(st, sdb), "hat": crop(ht, hdb), "bell": crop(bt, bdb)}

    # --- grid, cropped (kept a few beats either side so beatAt() extrapolates cleanly)
    k0 = drop - 4 * CLIP_BARS_BEFORE_DROP
    kb = [k for k in range(len(beats)) if t0 - 4 * P <= beats[k] <= t1 + 4 * P]
    cb = [round(float(beats[k] - t0), 4) for k in kb]
    cdb = [round(float(beats[k] - t0), 4) for k in kb if (k - phase) % 4 == 0]
    # phrase map in bars from the clip's first downbeat: bar 0-1 riser, bar 2 = drop, then 4-bar phrases
    bar = lambda b: round(b * 4 * P, 4)
    sections = [dict(name="riser", start=0.0, end=bar(2))]
    b = 2
    k = 1
    while bar(b) < CLIP_SECONDS:
        sections.append(dict(name=f"phrase{k}", start=bar(b), end=min(CLIP_SECONDS, bar(b + 4))))
        b += 4
        k += 1

    # low per beat for the clip (bass-out beats inside phrases: mini-breaks)
    breaks = [round(float(beats[k] - t0), 4) for k in kb if 0 <= beats[k] - t0 < CLIP_SECONDS and lowb[k] < 0.3 and k >= drop]

    # --- spectrum: 48 log bands 40 Hz - 16 kHz at 100 fps (dB, normalised on the clip)
    seg = y[int(t0 * SR):int(t1 * SR) + SR // 10]
    hop = SR // FPS
    f, _, Z = stft(seg, SR, nperseg=4096, noverlap=4096 - hop, boundary="zeros", padded=True)
    S = np.abs(Z)
    edges = np.geomspace(40, 16000, 49)
    bands = np.stack([S[(f >= edges[i]) & (f < edges[i + 1])].mean(0) if ((f >= edges[i]) & (f < edges[i + 1])).any()
                      else S[np.argmin(np.abs(f - edges[i]))] for i in range(48)])
    db = 20 * np.log10(bands + 1e-7)
    db -= np.percentile(db, 99.5)
    spec = np.clip((db + 60) / 60, 0, 1)[:, :n].T  # frames x bands
    # --- waveform min/max at 1 kHz (for the scope)
    wf = 1000
    m = int(CLIP_SECONDS * wf) + 1
    step = SR // wf
    seg2 = np.pad(seg, (0, max(0, m * step - len(seg))))[: m * step].reshape(m, step)
    peak = np.percentile(np.abs(seg), 99.9)
    wmin, wmax = np.clip(seg2.min(1) / peak, -1, 1), np.clip(seg2.max(1) / peak, -1, 1)
    blob = np.concatenate([(spec * 255).astype(np.uint8).ravel(),
                           np.round((wmin + 1) * 127.5).astype(np.uint8), np.round((wmax + 1) * 127.5).astype(np.uint8)])
    (ROOT / "data" / "scope.bin").write_bytes(blob.tobytes())

    doc = dict(
        duration=CLIP_SECONDS,
        song_offset=round(t0, 4),
        bpm=round(bpm, 3),
        beat_period=round(P, 5),
        beats=cb,
        downbeats=cdb,
        drop=round(float(beats[drop] - t0), 4),
        breaks=breaks,
        sections=sections,
        fps=FPS,
        features=env,
        onsets=onsets,
        scope=dict(file="data/scope.bin", specFrames=int(spec.shape[0]), specBands=48, specFps=FPS, waveRate=wf, waveLen=m),
    )
    (ROOT / "data" / "audio.json").write_text(json.dumps(doc, separators=(",", ":")))
    print(f"wrote data/audio.json: {len(cb)} beats, {len(cdb)} downbeats, drop at {doc['drop']:.3f}s, "
          f"{len(onsets['kick'])} kicks, {len(onsets['snare'])} snares, {len(onsets['hat'])} hats, {len(onsets['bell'])} bells, breaks {breaks}")
    print("sections", [(s['name'], s['start'], s['end']) for s in sections])


if __name__ == "__main__":
    sys.exit(main())
