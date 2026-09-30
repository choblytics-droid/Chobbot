#!/usr/bin/env python3
"""Turn any reference video into study material (the process used to analyse 《光先到》).

    python3 study_video.py path/to/video.mp4 out_dir [--times name:sec,name:sec,...]

Needs ffmpeg on PATH and `pip install pillow numpy librosa`. Produces, in out_dir:
  timeline_XX-YYs.png  whole film at 10 fps in 3-second windows (10x3 grids, timestamps)
  cuts.txt             scene-change times (ffmpeg scene score > 0.25)
  cuts_sheet.png       one frame just after every cut
  styles_N.png         one sharp frame per --times entry (labelled), 6 per sheet
  palettes.txt         6-colour median-cut palette with area share for each --times frame
  audio_levels.txt     RMS dBFS + spectral centroid per 0.5 s
  spectrogram*.png     full, 5-11 kHz zoom (hidden text), 0-1.5 kHz zoom (beats/heartbeats)
Then read the sheets with a vision model and fill the library entries in references/03_style_library.md.
"""
import os, subprocess, sys, glob
from PIL import Image, ImageDraw

def ff(*a): subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *a], check=True)

def grid(files, labels, cols, cw, ch, out):
    rows = (len(files) + cols - 1) // cols
    s = Image.new('RGB', (cols * cw, rows * (ch + 16)), (15, 15, 15)); d = ImageDraw.Draw(s)
    for i, (f, l) in enumerate(zip(files, labels)):
        x, y = (i % cols) * cw, (i // cols) * (ch + 16)
        s.paste(Image.open(f).convert('RGB').resize((cw, ch)), (x, y + 16)); d.text((x + 3, y + 2), l, fill=(255, 200, 80))
    s.save(out)

def main():
    v, out = sys.argv[1], sys.argv[2]
    times = []
    if '--times' in sys.argv:
        times = [tuple(x.split(':')) for x in sys.argv[sys.argv.index('--times') + 1].split(',')]
    os.makedirs(f'{out}/f10', exist_ok=True)
    w, h = map(int, subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                             'stream=width,height', '-of', 'csv=p=0', v]).decode().strip().split(','))
    cw = 200; ch = int(cw * h / w)
    ff('-i', v, '-vf', f'fps=10,scale={cw}:{ch}', f'{out}/f10/f_%04d.png')
    fs = sorted(glob.glob(f'{out}/f10/f_*.png'))
    for k in range(0, len(fs), 30):
        grid(fs[k:k + 30], [f'{(k + i) / 10 + 0.05:.2f}' for i in range(30)], 10, cw, ch, f'{out}/timeline_{k // 10:02d}-{k // 10 + 3:02d}s.png')
    log = subprocess.run(['ffmpeg', '-nostdin', '-i', v, '-vf', "select='gt(scene,0.25)',showinfo", '-vsync', 'vfr', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    cuts = [float(x.split(':')[1].split()[0]) for x in log.split() if x.startswith('pts_time:')]
    open(f'{out}/cuts.txt', 'w').write('\n'.join(f'{c:.3f}' for c in cuts))
    os.makedirs(f'{out}/cuts', exist_ok=True)
    cf = []
    for i, c in enumerate(cuts):
        p = f'{out}/cuts/c_{i:03d}.png'; ff('-ss', f'{c + 0.04:.3f}', '-i', v, '-frames:v', '1', '-vf', f'scale={cw}:{ch}', p); cf.append(p)
    if cf: grid(cf, [f'{c:.2f}' for c in cuts], 8, cw, ch, f'{out}/cuts_sheet.png')
    if times:
        os.makedirs(f'{out}/styles', exist_ok=True); sf = []; pal = []
        for n, t in times:
            p = f'{out}/styles/{n}.png'; ff('-ss', t, '-i', v, '-frames:v', '1', p); sf.append(p)
            q = Image.open(p).convert('RGB').resize((180, 240)).quantize(colors=6, method=Image.Quantize.MEDIANCUT)
            pp = q.getpalette(); cs = sorted(q.getcolors(), reverse=True); tot = sum(c for c, _ in cs)
            pal.append(f'{n}: ' + ' '.join('#%02x%02x%02x(%d%%)' % (*pp[i * 3:i * 3 + 3], round(100 * c / tot)) for c, i in cs))
        open(f'{out}/palettes.txt', 'w').write('\n'.join(pal))
        for k in range(0, len(sf), 6):
            grid(sf[k:k + 6], [n for n, _ in times[k:k + 6]], 3, 480, int(480 * h / w), f'{out}/styles_{k // 6 + 1}.png')
    ff('-i', v, '-vn', '-ac', '1', '-ar', '22050', f'{out}/audio.wav')
    import librosa, numpy as np
    y, sr = librosa.load(f'{out}/audio.wav', sr=22050); hop = int(sr * 0.5)
    rms = librosa.feature.rms(y=y, frame_length=hop, hop_length=hop)[0]
    cen = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    open(f'{out}/audio_levels.txt', 'w').write('\n'.join(f'{i * 0.5:6.1f}s  {20 * np.log10(r + 1e-9):7.1f} dBFS  centroid {c:6.0f} Hz'
                                                         for i, (r, c) in enumerate(zip(rms, cen))))
    ff('-i', f'{out}/audio.wav', '-lavfi', 'showspectrumpic=s=1800x500:legend=1:scale=log:fscale=log:color=intensity', f'{out}/spectrogram.png')
    ff('-i', f'{out}/audio.wav', '-lavfi', 'showspectrumpic=s=1800x700:legend=1:scale=log:start=5000:stop=11000:color=intensity', f'{out}/spectrogram_high.png')
    ff('-i', f'{out}/audio.wav', '-lavfi', 'showspectrumpic=s=1800x500:legend=1:scale=log:stop=1500:color=intensity', f'{out}/spectrogram_low.png')
    print(f'done: {len(fs)} frames, {len(cuts)} cuts -> {out}')

if __name__ == '__main__':
    main()
