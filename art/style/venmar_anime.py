# Venmar as an anime key visual, generated as SVG: cel-shaded parts (hard shadow shapes from an offset copy
# of each shape), line weight heavier on the shadow side (offset ink underlay), tapered brush strokes for
# inner lines, glossy layered eyes, soft sky background with clouds and sparkles.
import math, re, sys, json
F=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
WING=F.get('wing',0); WAVE=F.get('wave',0); BLINK=F.get('blink',0); TAIL=F.get('tail',0); BOB=F.get('bob',0); MOUTH=F.get('mouth',1)
INK='#16264f'
C=dict(blue='#4cc6f2',blueS='#2a8ed2',blueD='#1f6db3',blueH='#bdeeff',white='#ffffff',whiteS='#c6dcf0',
       memb='#2f8fd6',membS='#1f66a8',green='#46e23f',greenS='#22a52c',pink='#f59ab4',gold='#f8c623',goldS='#c98f0a',
       cry='#9fe0fa',cryS='#58b4e6')
out=[]
def P(s): out.append(s)
uid=[0]
def nid(p='c'): uid[0]+=1; return f'{p}{uid[0]}'

def part(d, base, shade, light=(-14,-18), ink_w=7, hi=None, hi_col=None, rim=True, extra=''):
    """Cel-shaded filled shape: ink underlay (thicker on the shadow side), shadow fill, lit region, highlight."""
    cid=nid()
    P(f'<clipPath id="{cid}"><path d="{d}"/></clipPath>')
    P(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{ink_w*2}" stroke-linejoin="round"/>')
    P(f'<path d="{d}" transform="translate(2.5 3.5)" fill="none" stroke="{INK}" stroke-width="{ink_w*2}" stroke-linejoin="round"/>')
    P(f'<g clip-path="url(#{cid})"><path d="{d}" fill="{shade}"/>'
      f'<path d="{d}" transform="translate({light[0]} {light[1]})" fill="{base}"/>{extra}')
    if hi: P(f'<path d="{hi}" fill="{hi_col or "#ffffff"}" opacity="0.85"/>')
    P('</g>')

def bez(pts,n=24):
    """Sample a polyline of cubic segments: pts = [p0, c1, c2, p1, c1, c2, p2, ...]."""
    res=[]
    for i in range(0,len(pts)-1,3):
        p0,c1,c2,p1=pts[i:i+4]
        for k in range(n+(1 if i+4>=len(pts) else 0)):
            t=k/n; u=1-t
            res.append((u*u*u*p0[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*p1[0], u*u*u*p0[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*p1[1]))
    return res
def stroke(pts, w, col=INK, a=0.15, b=0.15, op=1):
    """Tapered brush stroke along cubic points; width rises from a*w to w and falls to b*w."""
    s=bez(pts); n=len(s); L=[];R=[]
    for i,(x,y) in enumerate(s):
        x0,y0=s[max(0,i-1)]; x1,y1=s[min(n-1,i+1)]
        dx,dy=x1-x0,y1-y0; l=math.hypot(dx,dy) or 1; nx,ny=-dy/l,dx/l
        t=i/(n-1); prof=math.sin(math.pi*min(1,max(0,t)))**0.6
        ww=w*(a+(1-a)*prof) if t<0.5 else w*(b+(1-b)*prof)
        L.append((x+nx*ww/2,y+ny*ww/2)); R.append((x-nx*ww/2,y-ny*ww/2))
    poly=L+R[::-1]
    P(f'<path d="M{" L".join(f"{x:.1f} {y:.1f}" for x,y in poly)} Z" fill="{col}" opacity="{op}"/>')

def mirror(f):
    P('<g transform="translate(1000 0) scale(-1 1)">'); f(); P('</g>')

P('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">')
P('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f8fe0"/><stop offset="0.5" stop-color="#a9c6f2"/><stop offset="0.85" stop-color="#f6d6e6"/><stop offset="1" stop-color="#fbe9d8"/></linearGradient>
<radialGradient id="irisG" cx="0.5" cy="0.75" r="0.75"><stop offset="0" stop-color="#7fe0ff"/><stop offset="0.35" stop-color="#3a86e8"/><stop offset="0.75" stop-color="#1b3f8f"/><stop offset="1" stop-color="#0f1d48"/></radialGradient>
<radialGradient id="sun" cx="0.25" cy="0.15" r="0.6"><stop offset="0" stop-color="#fff6dc" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient>
<linearGradient id="depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#5a3fa0" stop-opacity="0"/><stop offset="1" stop-color="#5a3fa0" stop-opacity="0.22"/></linearGradient>
<filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="blur20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>''')
# ---------------- background: sky, sun bloom, clouds, sparkles
P('<rect width="1000" height="1000" fill="url(#sky)"/><rect width="1000" height="1000" fill="url(#sun)"/>')
for cx,cy,r,o in [(150,780,140,0.9),(300,830,170,0.9),(520,860,190,0.95),(760,820,170,0.9),(900,770,130,0.9),(80,300,90,0.5),(860,250,110,0.55),(720,190,70,0.45)]:
    P(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#ffffff" opacity="{o}" filter="url(#blur8)"/>')
P('<rect x="0" y="880" width="1000" height="120" fill="#ffffff" opacity="0.85" filter="url(#blur20)"/>')
import random; random.seed(4)
for i in range(26):
    x,y,s=random.uniform(40,960),random.uniform(60,700),random.uniform(4,11)
    P(f'<path d="M{x} {y-s} Q{x} {y} {x+s} {y} Q{x} {y} {x} {y+s} Q{x} {y} {x-s} {y} Q{x} {y} {x} {y-s} Z" fill="#ffffff" opacity="{random.uniform(0.5,0.95):.2f}"/>')
# ground shadow
P('<ellipse cx="500" cy="905" rx="210" ry="26" fill="#5a3fa0" opacity="0.25" filter="url(#blur8)"/>')

# ---------------- wings (behind)
def wing():
    d='M372 600 C320 510 230 430 110 400 C140 450 142 495 126 535 C168 520 205 538 222 572 C246 548 290 560 315 600 C335 588 352 590 372 600 Z'
    part(d,C['memb'],C['membS'],light=(10,-16))
    for pts in [[(372,600),(300,520),(200,450),(112,402)],[(365,598),(300,540),(200,500),(128,532)],[(360,598),(320,566),(260,555),(222,572)]]:
        stroke(pts,6,INK,0.6,0.1)
    stroke([(118,410),(165,440),(205,470),(240,500)],5,'#7fd0ff',0.1,0.1,0.8)
P(f'<g transform="rotate({WING} 372 600)">'); wing(); P('</g>'); P('<g transform="translate(1000 0) scale(-1 1)">'); P(f'<g transform="rotate({WING} 372 600)">'); wing(); P('</g></g>')

# ---------------- tail (behind, curling up on the left)
tail='M360 820 C270 850 170 830 150 740 C135 680 175 625 228 640 C255 648 262 680 240 696 C222 708 200 700 196 684 C205 740 260 770 345 760 Z'
P(f'<g transform="rotate({TAIL} 350 800)">')
part(tail,C['blue'],C['blueS'],light=(10,-14))
part('M228 640 C255 648 262 680 240 696 C222 708 200 700 196 684 C186 652 205 634 228 640 Z',C['white'],C['whiteS'],light=(-6,-8),ink_w=5)
P('</g>')

# ---------------- body
body='M372 585 C330 650 318 760 340 845 C370 905 630 905 660 845 C682 760 670 650 628 585 Z'
part(body,C['blue'],C['blueS'],light=(-22,-14),hi='M352 700 C356 660 370 630 388 612 C380 650 372 690 368 730 Z',hi_col=C['blueH'])
belly='M432 630 C408 700 410 800 440 862 C480 885 520 885 560 862 C590 800 592 700 568 630 Z'
part(belly,C['white'],C['whiteS'],light=(-16,-10),ink_w=5)
for y in (690,740,790,835):
    stroke([(436,y),(470,y+12),(530,y+12),(564,y)],4,INK,0.1,0.1,0.55)
# feet
def foot():
    part('M360 880 C360 845 420 835 450 850 C475 862 470 905 430 910 C395 914 360 905 360 880 Z',C['white'],C['whiteS'],light=(-8,-10),ink_w=6)
    for x in (392,416): stroke([(x,905),(x+2,896),(x+3,888),(x+4,880)],4,INK,0.1,0.6,0.8)
foot(); mirror(foot)
# right arm resting on the belly
part('M612 640 C650 680 660 735 622 770 C602 788 572 776 576 752 C582 728 606 705 598 662 Z',C['blue'],C['blueS'],light=(-10,-12))
part('M576 752 C570 722 602 712 622 724 C640 738 632 770 608 776 C590 780 578 768 576 752 Z',C['white'],C['whiteS'],light=(-6,-8),ink_w=5)
# left arm raised, waving
P(f'<g transform="rotate({WAVE} 384 636)">')
part('M380 650 C335 660 292 650 262 620 C250 606 256 588 272 586 C288 584 296 600 306 612 C326 628 356 632 384 624 Z',C['blue'],C['blueS'],light=(-10,-12))
part('M282 600 C276 566 246 552 226 568 C206 586 214 620 240 630 C264 638 286 624 282 600 Z',C['white'],C['whiteS'],light=(-6,-8),ink_w=5)
for a in (0,1,2): stroke([(222+a*16,582-a*6),(228+a*16,590-a*6),(232+a*16,596-a*6),(236+a*16,602-a*6)],3.5,INK,0.1,0.6,0.8)
# motion arcs of the wave
for r,o in ((70,0.7),(95,0.45)):
    P(f'<path d="M{236-r*0.2} {560-r*0.55} A{r} {r} 0 0 0 {236-r*0.95} {560+r*0.05}" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round" opacity="{o}"/>')

P('</g>')
# ---------------- head group (tilted)
P(f'<g transform="translate(0 {BOB}) rotate({-6+BOB*0.4} 500 560)">')
def ear():
    part('M318 318 C292 240 272 170 284 100 C334 136 384 186 414 240 Z',C['blue'],C['blueS'],light=(-12,-6))
    part('M330 288 C314 238 304 190 308 150 C338 176 368 212 388 246 Z',C['white'],C['whiteS'],light=(-4,-8),ink_w=4)
    for pts in [[(316,270),(318,250),(322,232),(330,214)],[(334,282),(338,262),(344,246),(352,232)]]: stroke(pts,4,INK,0.1,0.7,0.6)
ear(); mirror(ear)
# fluffy cheek tufts
def tuft():
    part('M275 430 C240 440 214 462 200 494 C228 488 246 494 258 504 C246 514 238 530 236 548 C262 534 282 530 300 534 Z',C['blue'],C['blueS'],light=(-6,-10),ink_w=6)
tuft(); mirror(tuft)
head='M500 205 C648 205 742 296 746 410 C750 505 692 585 600 608 C560 618 440 618 400 608 C308 585 250 505 254 410 C258 296 352 205 500 205 Z'
part(head,C['blue'],C['blueS'],light=(-26,-24),hi='M300 330 C318 280 360 248 410 236 C372 268 344 300 326 344 Z',hi_col=C['blueH'])
# green forehead marks
def mark(): part('M398 248 C410 282 414 318 402 352 C388 320 384 284 398 248 Z',C['green'],C['greenS'],light=(-4,-6),ink_w=4)
mark(); mirror(mark)
# crystal crest
P('<g filter="url(#glow)">')
part('M500 120 C512 150 526 186 532 222 C512 230 488 230 468 222 C474 186 488 150 500 120 Z',C['cry'],C['cryS'],light=(-8,-6),ink_w=5,
     hi='M496 140 C490 170 484 196 480 218 C486 220 490 220 494 220 C496 190 498 166 496 140 Z')
P('</g>')
stroke([(500,126),(503,160),(506,195),(508,224)],3,INK,0.1,0.2,0.5)
# gold earring (her right ear = viewer's left? the sprite has it on the viewer's right)
P(f'<circle cx="702" cy="292" r="15" fill="none" stroke="{INK}" stroke-width="11"/><circle cx="702" cy="292" r="15" fill="none" stroke="{C["gold"]}" stroke-width="6"/>')
P('<path d="M692 282 Q698 278 704 280" stroke="#fff6c0" stroke-width="3" fill="none" stroke-linecap="round"/>')
# muzzle
part('M440 478 C446 452 554 452 560 478 C566 518 538 540 500 542 C462 540 434 518 440 478 Z','#c6efff','#8fd0f2',light=(-10,-10),ink_w=4)
# eyes
def eye():
    ex,ey=420,404
    if BLINK:
        stroke([(ex-58,ey+6),(ex-30,ey-24),(ex+26,ey-24),(ex+54,ey+4)],16,INK,0.3,0.3)
        stroke([(ex-56,ey+4),(ex-70,ey-2),(ex-80,ey-10),(ex-90,ey-22)],8,INK,0.9,0.1)
        return
    P(f'<ellipse cx="{ex}" cy="{ey}" rx="54" ry="70" fill="{INK}"/>')
    P(f'<ellipse cx="{ex}" cy="{ey}" rx="48" ry="64" fill="url(#irisG)"/>')
    P(f'<ellipse cx="{ex+2}" cy="{ey+6}" rx="23" ry="34" fill="#0b1638"/>')
    P(f'<path d="M{ex-30} {ey+28} Q{ex} {ey+52} {ex+30} {ey+28}" stroke="#a8ecff" stroke-width="5" fill="none" opacity="0.9"/>')
    P(f'<ellipse cx="{ex-16}" cy="{ey-26}" rx="18" ry="24" fill="#ffffff"/>')
    P(f'<circle cx="{ex+18}" cy="{ey+22}" r="7" fill="#ffffff"/>')
    P(f'<circle cx="{ex-22}" cy="{ey+16}" r="3.5" fill="#ffffff" opacity="0.9"/>')
    stroke([(ex-58,ey-6),(ex-52,ey-64),(ex+18,ey-82),(ex+56,ey-40)],18,INK,0.35,0.3)
    stroke([(ex-56,ey-14),(ex-70,ey-22),(ex-80,ey-32),(ex-90,ey-46)],9,INK,0.9,0.1)
    stroke([(ex-50,ey-40),(ex-64,ey-52),(ex-70,ey-62),(ex-74,ey-74)],6,INK,0.9,0.1)
    stroke([(ex-28,ey+70),(ex-10,ey+76),(ex+10,ey+76),(ex+26,ey+70)],4,INK,0.2,0.2,0.7)
eye(); mirror(eye)
# blush with hatching
def blush():
    P(f'<ellipse cx="352" cy="492" rx="40" ry="18" fill="{C["pink"]}" opacity="0.75" filter="url(#blur8)"/>')
    for i in range(3): stroke([(336+i*14,500),(340+i*14,494),(344+i*14,488),(348+i*14,482)],3.5,'#e0607e',0.2,0.2,0.85)
blush(); mirror(blush)
# nose + happy open mouth with a fang
P(f'<path d="M488 462 Q500 456 512 462 Q506 474 500 476 Q494 474 488 462 Z" fill="{INK}"/>')
P(f'<g transform="translate(0 {494*(1-MOUTH)}) scale(1 {MOUTH})">')
P(f'<path d="M462 494 Q480 532 500 520 Q520 532 538 494 Q520 504 500 498 Q480 504 462 494 Z" fill="#7a1f3a" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>')
P('<path d="M482 516 Q500 506 518 516 Q510 526 500 524 Q490 526 482 516 Z" fill="#f7869e"/>')
P('<path d="M470 498 L476 510 L482 500 Z" fill="#ffffff"/>')
P('</g>')
stroke([(452,488),(462,500),(476,504),(488,500)],4,INK,0.6,0.2)
stroke([(548,488),(538,500),(524,504),(512,500)],4,INK,0.6,0.2)
P('</g>')
# ---------------- finishing: depth gradient over the character, light bloom
P('<rect width="1000" height="1000" fill="url(#depth)"/>')
P('<ellipse cx="300" cy="200" rx="260" ry="200" fill="#fff4d8" opacity="0.18" filter="url(#blur20)"/>')
P('</svg>')
open(sys.argv[1],'w').write('\n'.join(out))
