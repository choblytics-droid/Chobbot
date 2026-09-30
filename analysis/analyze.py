"""Music analysis -> data/audio.json (the format app/src/engine/audio.ts reads).

    python3 analysis/analyze.py [--vocals path/to/vocals.wav] [--accomp path/to/accompaniment.wav]

- Beat grid: librosa beat tracking, then a least-squares straight grid (the Suno track is a fixed tempo),
  re-phased onto the strongest onsets. Downbeats: the beat phase (mod 4) with the most kick energy.
- Envelopes at 100 fps, 0..1: rms, low/mid/high bands, vocal (vocal stem), drums (percussive part of the
  accompaniment), bass (<150 Hz of the accompaniment), other (harmonic accompaniment).
- Onsets [time, strength]: kick (<150 Hz percussive), snare (1.5-5 kHz percussive), hat (>7 kHz percussive),
  bell (the phonk cowbell: 500-1400 Hz harmonic+percussive transients of the accompaniment), vocal (stem).
- Sections: from data/sections.json if present (hand-labelled against the aligned lyrics), else energy-based.
Without stems (no Spleeter) the full mix is used for everything and `vocal` is a mid-band proxy.
"""
import argparse
import json
from pathlib import Path

import librosa
import numpy as np
import scipy.signal as sig

ROOT = Path(__file__).resolve().parent.parent
FPS = 100
SR = 22050
HOP = SR // FPS  # 220.5 -> use exact frame times below
HOP = 220


def norm01(x, pct=99.0):
    x = np.maximum(x, 0)
    hi = np.percentile(x, pct) + 1e-9
    return np.clip(x / hi, 0, 1)


def band_env(S, freqs, lo, hi):
    m = (freqs >= lo) & (freqs < hi)
    return np.sqrt((S[m] ** 2).mean(axis=0))


def resample_to_fps(x, n_frames_src, duration):
    """x sampled at hop HOP -> FPS grid."""
    t_src = librosa.frames_to_time(np.arange(len(x)), sr=SR, hop_length=HOP)
    t_dst = np.arange(int(duration * FPS)) / FPS
    return np.interp(t_dst, t_src, x)


def smooth(x, n=3):
    if n <= 1:
        return x
    k = np.hanning(n + 2)[1:-1]
    return np.convolve(x, k / k.sum(), mode="same")


def onsets(env, t, delta, wait_s=0.06, pre=0.03, post=0.03):
    env = env / (env.max() + 1e-9)
    w = int(wait_s * FPS)
    pk = librosa.util.peak_pick(env, pre_max=int(pre * FPS) + 1, post_max=int(post * FPS) + 1,
                                pre_avg=10, post_avg=10, delta=delta, wait=w)
    return [[round(float(t[i]), 3), round(float(min(1.0, env[i] / np.percentile(env[pk], 90) if len(pk) else 1)), 3)] for i in pk]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", default=str(ROOT / "audio/song.mp3"))
    ap.add_argument("--vocals")
    ap.add_argument("--accomp")
    ap.add_argument("--out", default=str(ROOT / "data/audio.json"))
    a = ap.parse_args()

    y, _ = librosa.load(a.audio, sr=SR, mono=True)
    duration = len(y) / SR
    yv = librosa.load(a.vocals, sr=SR, mono=True)[0][: len(y)] if a.vocals else None
    ya = librosa.load(a.accomp, sr=SR, mono=True)[0][: len(y)] if a.accomp else y

    # ---------------------------------------------------------------- beat grid
    oenv = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP)
    _, bt = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, hop_length=HOP, units="time", tightness=400)
    bt = np.asarray(bt)
    idx = np.arange(len(bt))
    period, t0 = np.polyfit(idx, bt, 1)
    # refine the phase: maximise onset strength summed at grid points
    ot = librosa.frames_to_time(np.arange(len(oenv)), sr=SR, hop_length=HOP)
    best = (0, -1)
    for dp in np.linspace(-0.002, 0.002, 41):
        for d0 in np.linspace(-0.05, 0.05, 101):
            g = (t0 + d0) + np.arange(-2, len(bt) + 4) * (period + dp)
            g = g[(g >= 0) & (g < duration)]
            s = np.interp(g, ot, oenv).sum()
            if s > best[1]:
                best = ((t0 + d0, period + dp), s)
    (t0, period) = best[0]
    k0 = int(np.ceil(-t0 / period))
    grid = t0 + np.arange(k0, int((duration - t0) / period) + 1) * period
    grid = grid[(grid >= 0) & (grid < duration)]
    bpm = 60.0 / period

    # ---------------------------------------------------------------- spectra
    S = np.abs(librosa.stft(ya, n_fft=2048, hop_length=HOP))
    freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
    H, P = librosa.decompose.hpss(S, margin=(1.0, 2.0))
    Sm = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP))
    t_src = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR, hop_length=HOP)
    tt = np.arange(int(duration * FPS)) / FPS
    R = lambda x: np.interp(tt, t_src, x)

    rms = R(np.sqrt((Sm ** 2).mean(axis=0)))
    low = R(band_env(Sm, freqs, 20, 250))
    mid = R(band_env(Sm, freqs, 250, 4000))
    high = R(band_env(Sm, freqs, 4000, 11000))
    drums = R(np.sqrt((P ** 2).mean(axis=0)))
    bass = R(band_env(H, freqs, 20, 150))
    other = R(np.sqrt((H[freqs > 150] ** 2).mean(axis=0)))
    if yv is not None:
        Sv = np.abs(librosa.stft(yv, n_fft=2048, hop_length=HOP))
        vocal = R(band_env(Sv, freqs, 150, 6000))
        vflux = R(librosa.onset.onset_strength(S=librosa.amplitude_to_db(Sv, ref=np.max), sr=SR, hop_length=HOP))
    else:
        vocal = R(band_env(H, freqs, 300, 3400))
        vflux = R(librosa.onset.onset_strength(S=librosa.amplitude_to_db(H, ref=np.max), sr=SR, hop_length=HOP))

    def flux(M, lo, hi):
        m = (freqs >= lo) & (freqs < hi)
        L = np.log1p(M[m] * 10)
        d = np.maximum(0, np.diff(L, axis=1, prepend=L[:, :1]))
        return R(d.mean(axis=0))

    kick_f = flux(P, 20, 150)
    snare_f = flux(P, 1500, 5000)
    hat_f = flux(P, 7000, 11000)
    bell_f = flux(S, 500, 1400) * (R(band_env(S, freqs, 500, 1400)) > np.percentile(R(band_env(S, freqs, 500, 1400)), 40))

    feats = {k: np.round(norm01(smooth(v, 3)), 3).tolist() for k, v in
             dict(rms=rms, low=low, mid=mid, high=high, vocal=vocal, drums=drums, bass=bass, other=other).items()}
    ons = {
        "kick": onsets(kick_f, tt, 0.12, 0.12),
        "snare": onsets(snare_f, tt, 0.12, 0.1),
        "hat": onsets(hat_f, tt, 0.1, 0.06),
        "bell": onsets(bell_f, tt, 0.1, 0.07),
        "vocal": onsets(vflux * (np.array(feats["vocal"]) > 0.08), tt, 0.1, 0.08),
    }

    # downbeat phase: most kick energy
    kt = np.array([k[0] for k in ons["kick"]]) if ons["kick"] else np.zeros(0)
    ks = np.array([k[1] for k in ons["kick"]]) if ons["kick"] else np.zeros(0)
    score = []
    for ph in range(4):
        g = grid[ph::4]
        sc = 0.0
        for gt in g:
            d = np.abs(kt - gt)
            if len(d) and d.min() < 0.05:
                sc += ks[d.argmin()]
        score.append(sc)
    ph = int(np.argmax(score))
    downbeats = grid[ph::4]

    # sections
    sec_file = ROOT / "data/sections.json"
    if sec_file.exists():
        sections = json.loads(sec_file.read_text())
    else:
        e = np.array(feats["rms"])
        bars = list(downbeats) + [duration]
        sections = []
        for i in range(0, len(bars) - 1, 8):
            s, en = bars[i], bars[min(i + 8, len(bars) - 1)]
            m = e[int(s * FPS): int(en * FPS)].mean()
            sections.append({"name": "high" if m > 0.5 else "low", "start": round(float(s), 3), "end": round(float(en), 3)})

    out = {
        "duration": round(duration, 3),
        "bpm": round(float(bpm), 3),
        "beat_period": round(float(period), 5),
        "time_signature": 4,
        "beats": [round(float(b), 3) for b in grid],
        "downbeats": [round(float(b), 3) for b in downbeats],
        "sections": sections,
        "fps": FPS,
        **feats,
        "onsets": ons,
        "notes": f"librosa grid fit ({len(bt)} tracked beats), downbeat phase {ph} (kick scores {np.round(score, 1).tolist()}); "
                 f"stems: {'spleeter 2stems' if yv is not None else 'none (full mix)'}",
    }
    Path(a.out).write_text(json.dumps(out, separators=(",", ":")))
    print(f"bpm {bpm:.3f}  beats {len(grid)}  downbeats {len(downbeats)}  phase {ph} {np.round(score,1)}")
    print({k: len(v) for k, v in ons.items()})


if __name__ == "__main__":
    main()
