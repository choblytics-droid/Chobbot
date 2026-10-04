"""Contact sheet of stills with labels (style frames, cut checks).

    python3 tools/contact_sheet.py out.png <cols> "frame1.png|label" "frame2.png|label" ...
Needs Pillow (pip install pillow).
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out, cols, items = sys.argv[1], int(sys.argv[2]), [i.split('|', 1) for i in sys.argv[3:]]
first = Image.open(items[0][0])
tw = 360 if first.height > first.width else 480
th = round(tw * first.height / first.width)
lab, pad = 54, 14
rows = (len(items) + cols - 1) // cols
S = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad), (18, 18, 22))
d = ImageDraw.Draw(S)
font_file = Path(__file__).resolve().parent.parent / 'app/public/fonts/Archivo-w1000-700.ttf'
f = ImageFont.truetype(str(font_file), 22) if font_file.exists() else ImageFont.load_default()
for k, (fn, label) in enumerate(items):
    x, y = pad + (k % cols) * (tw + pad), pad + (k // cols) * (th + lab + pad)
    d.text((x + 2, y + 6), label, fill=(235, 232, 226), font=f)
    S.paste(Image.open(fn).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + lab))
S.save(out)
print(out)
