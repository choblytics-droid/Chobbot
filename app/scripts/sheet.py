# Combine stills into a 2-column contact sheet: python3 scripts/sheet.py out.png a.png b.png ...
import sys
from PIL import Image
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB').resize((640, 360)) for f in files]
s = Image.new('RGB', (1280, 360 * ((len(ims) + 1) // 2)))
for i, im in enumerate(ims): s.paste(im, ((i % 2) * 640, (i // 2) * 360))
s.save(out)
