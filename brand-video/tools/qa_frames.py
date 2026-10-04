"""QA on rendered stills (docs/QA.md). Render them with `render.ts stills --qa` (no grain, no CA; it
also writes <frame>.gbuf.json: the pixel-art G-buffer's object stats).

    python3 tools/qa_frames.py <frames-dir> <out-dir>

Writes into <out-dir>, per frame:
  <name>_zoom.png   the frame as 6 crops at 100% (lazy areas can't hide in a thumbnail)
  <name>_flat.png   magenta boxes = flat objects (big, few tones, little internal detail);
                    cyan = platform UI zones where text must not sit (9:16)
and qa_report.md listing every object with its numbers and a FLAT flag.
FLAT = area >= 250 art px and (internal detail < 0.12 or tones <= 3). Sky is never an object.
"""
import sys, json
from pathlib import Path
from PIL import Image, ImageDraw

MIN_AREA, MIN_DETAIL, MIN_TONES = 250, 0.12, 4
UNSAFE_9x16 = [(0, 0, 1080, 150, 'top bar'), (940, 700, 1080, 1700, 'buttons'), (0, 1560, 1080, 1920, 'caption / username')]

src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
report = ['# QA report: object detail and safe zones', '',
          f'FLAT = area ≥ {MIN_AREA} art px and (internal detail < {MIN_DETAIL} or tones < {MIN_TONES}). '
          'Detail = share of neighbouring pixel pairs inside the object that differ (texture, shading, parts).', '']
flat_total = 0
text_bad = []
for f in sorted(src.glob('*.png')):
    img = Image.open(f).convert('RGB'); W, H = img.size
    g = f.with_suffix('.gbuf.json')
    objs = json.loads(g.read_text()) if g.exists() else []
    vis = Image.eval(img, lambda v: int(v * 0.6)); d = ImageDraw.Draw(vis)
    report.append(f'## {f.stem}')
    if not objs: report.append('(no pixel-art G-buffer: a UI / macro / shader shot; check it by eye at 100%)')
    else:
        report.append('| object | id | area | tones | detail | flag |'); report.append('|---|---|---|---|---|---|')
    for o in objs:
        if o['area'] < 60: continue
        flat = o['area'] >= MIN_AREA and (o['detail'] < MIN_DETAIL or o['tones'] < MIN_TONES)
        flat_total += flat
        report.append(f"| {o['name'] or '?'} | {o['id']} | {o['area']} | {o['tones']} | {o['detail']} | {'**FLAT**' if flat else ''} |")
        if flat:
            d.rectangle(o['box'], outline=(255, 0, 200), width=5); d.text((o['box'][0] + 6, o['box'][1] + 6), o['name'] or str(o['id']), fill=(255, 0, 200))
    if H > W:
        for x0, y0, x1, y1, name in UNSAFE_9x16:
            d.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(0, 230, 255), width=3); d.text((x0 + 8, y0 + 8), name, fill=(0, 230, 255))
    tj = f.with_suffix('.text.json')
    if tj.exists():
        tz = json.loads(tj.read_text())
        bad = {k: v for k, v in tz.items() if v > 0.002}
        report.append('text in platform UI zones: ' + (', '.join(f'**{k} {v*100:.1f}%**' for k, v in bad.items()) if bad else 'none'))
        text_bad.extend(f'{f.stem}: {k}' for k in bad)
    vis.save(out / f'{f.stem}_flat.png')
    cw, ch = W // 2, H // 3
    Z = Image.new('RGB', (cw * 3 + 20, ch * 2 + 10), (20, 20, 24))
    for k in range(6):
        cx, cy = (k % 2) * cw, (k // 2) * ch
        Z.paste(img.crop((cx, cy, cx + cw, cy + ch)), ((k % 3) * (cw + 10), (k // 3) * (ch + 10)))
    Z.save(out / f'{f.stem}_zoom.png')
    report.append('')
report.insert(3, f'**{flat_total} flat objects** across {len(list(src.glob("*.png")))} frames. **Text in UI zones: {len(text_bad)}** ' + (str(text_bad) if text_bad else '') + '\n')
(out / 'qa_report.md').write_text('\n'.join(report))
print(out / 'qa_report.md', flat_total, 'flat;', len(text_bad), 'text-in-zone')
