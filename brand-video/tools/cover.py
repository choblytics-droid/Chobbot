"""Streamer Stories series cover (TikTok / Shorts / Reels), one fixed design, per film only number + title.

  python tools/cover.py --num 01 --title "The train ride" --out ../ready-to-post/ST-01_train-ride/ST-01_train-ride_cover.png
  python tools/cover.py --make-chob D:/APP/heroes/CHOB_CANONICAL.png      (only if Chob's art changes)

Layers: the series plate (the streamer's desk room from the film engine, rendered with --notext),
pixel Chob (made from the locked canonical art by tools/cover.py --make-chob), the title block.
Everything sits inside TikTok's 3:4 grid crop (y 240-1680 of 1080x1920).
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent          # brand-video/
KIT = ROOT / 'assets' / 'cover'
FONTS = ROOT / 'app' / 'public' / 'fonts'
W, H = 1080, 1920
YELLOW, INK, BONE = (255, 244, 46), (20, 20, 20), (242, 238, 228)


# Chob's colours, sampled from heroes/CHOB_CANONICAL.png (None = background)
CHOB = [None, (11, 12, 14), (23, 32, 45), (25, 61, 93), (226, 226, 225), (10, 85, 105),
        (197, 31, 27), (142, 21, 18), (241, 166, 162)]
OUTLINE = 1


def make_chob(src: Path, out: Path, art_h=128, px=5):
    """Pixel Chob from the canonical art: every source pixel snaps to Chob's own palette, then each
    art pixel takes the most common colour of its block (the outline wins at 30 %, so it never
    breaks up). Scaled back up with hard pixels."""
    im = Image.open(src).convert('RGB')
    bg = im.getpixel((8, 8))
    w, h = im.size
    pi = im.load()

    def cls(p):
        if sum(abs(p[i] - bg[i]) for i in range(3)) < 60:
            return 0
        return min(range(1, len(CHOB)), key=lambda k: sum((p[i] - CHOB[k][i]) ** 2 for i in range(3)))

    idx = [[cls(pi[x, y]) for x in range(w)] for y in range(h)]
    ys = [y for y in range(h) if any(idx[y])]; xs = [x for x in range(w) if any(idx[y][x] for y in ys)]
    x0, x1, y0, y1 = xs[0], xs[-1] + 1, ys[0], ys[-1] + 1
    s = (y1 - y0) / art_h
    aw = round((x1 - x0) / s)
    art = Image.new('RGBA', (aw, art_h), (0, 0, 0, 0))
    for ay in range(art_h):
        for ax in range(aw):
            cnt = [0] * len(CHOB)
            for y in range(int(y0 + ay * s), int(y0 + (ay + 1) * s)):
                for x in range(int(x0 + ax * s), min(w, int(x0 + (ax + 1) * s))):
                    cnt[idx[y][x]] += 1
            n = sum(cnt) or 1
            k = OUTLINE if cnt[OUTLINE] >= 0.3 * n else max(range(len(CHOB)), key=lambda i: cnt[i])
            if k and cnt[0] < 0.6 * n:
                art.putpixel((ax, ay), CHOB[k] + (255,))
    # holes: the blush is close to the canonical's peach background, so a few cheek pixels key out.
    # Any see-through patch that doesn't reach the edge is filled with its most common rim colour.
    seen = set()
    for ay in range(art_h):
        for ax in range(aw):
            if (ax, ay) in seen or art.getpixel((ax, ay))[3]:
                continue
            comp, stack, rim, edge = [], [(ax, ay)], [], False
            seen.add((ax, ay))
            while stack:
                x, y = stack.pop(); comp.append((x, y))
                for q in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if not (0 <= q[0] < aw and 0 <= q[1] < art_h):
                        edge = True; continue
                    c = art.getpixel(q)
                    if not c[3]:
                        if q not in seen:
                            seen.add(q); stack.append(q)
                    else:
                        rim.append(c)
            if not edge and rim:
                fill = max(set(rim), key=rim.count)
                for p in comp:
                    art.putpixel(p, fill)
    art.resize((aw * px, art_h * px), Image.NEAREST).save(out)


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def cover(num: str, title: str, out: Path):
    plate = Image.open(KIT / 'plate_desk.png').convert('RGB').resize((W, H))
    img = plate.convert('RGBA')

    # dark wash over the top half so the title reads on any part of the room
    wash = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(wash)
    for y in range(H):
        v = 200 if y < 760 else max(0, int(200 - (y - 760) * 0.55))
        d.line([(0, y), (W, y)], fill=v)
    img = Image.composite(Image.new('RGBA', (W, H), (12, 12, 16, 255)), img, wash)

    # pixel Chob on the rug, with a soft contact shadow
    chob = Image.open(KIT / 'chob_pixel.png')
    cx, foot = 300, 1650
    shadow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(shadow).ellipse([cx - 210, foot - 26, cx + 230, foot + 22], fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    img = Image.composite(Image.new('RGBA', (W, H), (0, 0, 0, 255)), img, shadow)
    img.alpha_composite(chob, (cx - chob.width // 2, foot - chob.height))

    d = ImageDraw.Draw(img)
    big = font('Archivo-w1250-900.ttf', 200)
    d.text((76, 300), 'STORY', font=big, fill=BONE)
    d.text((76, 500), 'TIME', font=big, fill=BONE)
    # the episode number under STORY TIME, the title and the hook line beside it
    nf = font('Archivo-w1000-900.ttf', 210)
    nb = d.textbbox((0, 0), num, font=nf)
    d.text((80 - nb[0], 735 - nb[1]), num, font=nf, fill=YELLOW)
    tx = 80 + (nb[2] - nb[0]) + 44
    tf = font('Archivo-w1125-700.ttf', 58)
    tb = d.textbbox((0, 0), title, font=tf)
    ty = 752
    d.rectangle([tx, ty, tx + (tb[2] - tb[0]) + 40, ty + (tb[3] - tb[1]) + 40], fill=YELLOW)
    d.text((tx + 20 - tb[0], ty + 20 - tb[1]), title, font=tf, fill=INK)
    sf = font('Archivo-w1000-500.ttf', 38)
    d.text((tx + 2, ty + (tb[3] - tb[1]) + 70), 'Based on a true story', font=sf, fill=(235, 230, 220))

    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert('RGB').save(out)
    print(out)


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--num'); p.add_argument('--title'); p.add_argument('--out')
    p.add_argument('--make-chob', metavar='CANONICAL_PNG')
    a = p.parse_args()
    if a.make_chob:
        KIT.mkdir(parents=True, exist_ok=True)
        make_chob(Path(a.make_chob), KIT / 'chob_pixel.png')
        print(KIT / 'chob_pixel.png')
    else:
        cover(a.num, a.title, Path(a.out))
