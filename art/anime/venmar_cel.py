# Venmar, Japanese-TV-anime cel style, 3/4 view sitting on the ledge. Flat colours only: base + one hard
# shadow tone (hand-placed shapes) + small hard highlights + a warm rim light from the sunset; ink lines in a
# per-material colour with heavier weight on the shadow side; layered flat anime eyes. Output: SVG (no bg).
import math, sys, json
F=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
BLINK=F.get('blink',0); MOUTH=F.get('mouth',1.0); WING=F.get('wing',0); TAIL=F.get('tail',0); HEAD=F.get('head',0); EAR=F.get('ear',0)
L_BLUE='#1d2452'; L_WHITE='#3c4680'; L_MEMB='#1b2048'
K=dict(blue='#58c9f3',blueS='#3b8edb',blueD='#2c68be',blueH='#c4f1ff',white='#f5f8ff',whiteS='#b8c3ea',
       memb='#3c90d8',membS='#2a60b0',green='#52e04c',greenS='#27a43a',pink='#ff9fbe',gold='#fbc92b',goldS='#cf8d12',
       cry='#a9e9ff',cryS='#62b6ea',rim='#ffd3a6')
out=[]; P=out.append; n=[0]
def nid(): n[0]+=1; return f'k{n[0]}'
def shape(d, base, shades=(), lights=(), line=L_BLUE, w=5.5, rims=()):
    """Flat cel part: ink underlay (weight on the shadow side), base, hand-drawn shadow shapes and hard
    highlights / rim light clipped inside, then the crisp contour on top."""
    c=nid()
    P(f'<clipPath id="{c}"><path d="{d}"/></clipPath>')
    P(f'<path d="{d}" transform="translate(1.8 2.4)" fill="none" stroke="{line}" stroke-width="{w+2.5}" stroke-linejoin="round"/>')
    P(f'<path d="{d}" fill="{base}"/>')
    if shades or lights or rims:
        P(f'<g clip-path="url(#{c})">')
        for sd,sc in shades: P(f'<path d="{sd}" fill="{sc}"/>')
        for rd in rims: P(f'<path d="{rd}" fill="{K["rim"]}"/>')
        for ld,lc in lights: P(f'<path d="{ld}" fill="{lc}"/>')
        P('</g>')
    P(f'<path d="{d}" fill="none" stroke="{line}" stroke-width="{w}" stroke-linejoin="round"/>')
def bez(pts,steps=28):
    res=[]
    for i in range(0,len(pts)-1,3):
        p0,c1,c2,p1=pts[i:i+4]
        for k in range(steps+(1 if i+4>=len(pts) else 0)):
            t=k/steps; u=1-t
            res.append((u**3*p0[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t**3*p1[0], u**3*p0[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t**3*p1[1]))
    return res
def ink(pts,w,col=L_BLUE,a=0.12,b=0.12):
    s=bez(pts); m=len(s); Lp=[];Rp=[]
    for i,(x,y) in enumerate(s):
        x0,y0=s[max(0,i-1)]; x1,y1=s[min(m-1,i+1)]; dx,dy=x1-x0,y1-y0; l=math.hypot(dx,dy) or 1
        t=i/(m-1); pr=math.sin(math.pi*t)**0.55; ww=w*((a if t<0.5 else b)+(1-(a if t<0.5 else b))*pr)
        Lp.append((x-dy/l*ww/2,y+dx/l*ww/2)); Rp.append((x+dy/l*ww/2,y-dx/l*ww/2))
    P('<path d="M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in Lp+Rp[::-1])+f' Z" fill="{col}"/>')

P('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">')
# ---------------- far wing (behind)
P(f'<g transform="rotate({-WING} 465 625)">')
shape('M466 616 C430 592 382 562 322 546 C336 576 336 602 326 628 C360 622 386 632 401 652 C421 642 446 642 461 652 Z',K['memb'],
      shades=[('M330 600 C360 610 390 625 405 650 L470 660 L470 620 C420 610 370 600 330 600 Z',K['membS'])],line=L_MEMB,w=4.5)
ink([(464,616),(420,590),(370,566),(324,548)],5,L_MEMB,0.6,0.1); ink([(462,622),(420,612),(380,620),(328,626)],4,L_MEMB,0.6,0.1)
P('</g>')
# ---------------- near wing (behind the body)
P(f'<g transform="rotate({WING} 700 615)">')
shape('M692 612 C762 560 852 470 988 440 C962 492 960 532 974 572 C932 562 897 574 877 602 C852 587 817 597 797 627 C772 617 737 622 716 642 Z',K['memb'],
      shades=[('M760 600 C820 560 900 540 975 570 L980 600 L720 660 Z',K['membS'])],
      lights=[('M720 600 C790 545 880 482 970 452 C890 490 820 545 740 610 Z','#7cc4f2')],line=L_MEMB,w=5)
for pts in [[(694,612),(780,540),(880,475),(984,442)],[(700,616),(790,580),(880,566),(970,570)],[(705,622),(760,612),(830,600),(876,602)]]: ink(pts,6.5,L_MEMB,0.7,0.1)
P('</g>')
# ---------------- tail (curls along the ledge to the right, tip up)
P(f'<g transform="rotate({TAIL} 770 860)">')
shape('M748 872 C850 884 932 872 962 822 C988 780 978 736 946 729 C920 724 904 746 914 767 C925 790 900 822 860 832 C820 842 782 842 752 840 Z',K['blue'],
      shades=[('M752 852 C820 870 900 866 945 830 C930 870 860 892 760 890 Z',K['blueS'])],rims=['M760 842 C800 846 840 842 870 830 C840 838 800 840 760 838 Z'])
shape('M946 729 C982 736 992 782 966 802 C941 792 921 772 919 753 C923 736 933 728 946 729 Z',K['white'],
      shades=[('M960 760 C975 770 975 790 966 802 C950 796 935 785 930 772 Z',K['whiteS'])],line=L_WHITE,w=4.5)
P('</g>')
# ---------------- torso
shape('M470 585 C440 650 432 760 448 840 C460 890 520 905 600 905 C690 905 760 880 775 820 C790 740 760 640 700 590 Z',K['blue'],
      shades=[('M430 560 C520 650 650 655 790 590 L790 560 Z',K['blueS']),
              ('M700 590 C770 650 792 760 772 832 C760 872 720 895 668 903 C722 860 748 780 733 700 C724 650 713 615 700 590 Z',K['blueS'])],
      rims=['M451 700 C457 650 469 615 487 592 C474 628 463 668 457 715 Z'])
# near haunch + back foot
shape('M640 760 C700 720 792 740 806 815 C816 870 781 905 721 905 L622 905 C612 850 612 790 640 760 Z',K['blue'],
      shades=[('M720 905 C790 900 815 860 806 815 C800 860 760 885 700 892 L640 905 Z',K['blueS'])],
      lights=[('M650 772 C690 745 740 742 770 755 C730 752 690 760 660 782 Z',K['blueH'])])
shape('M700 882 C742 872 802 876 816 893 C821 906 791 911 751 911 L701 909 Z',K['white'],shades=[('M760 900 C790 900 812 898 816 893 C820 906 790 911 751 911 Z',K['whiteS'])],line=L_WHITE,w=4.5)
# front legs + paws (far, then near)
shape('M484 770 C472 820 471 862 478 896 L530 898 C536 862 535 820 527 770 Z',K['blue'],shades=[('M512 760 C520 800 524 850 520 899 L532 899 C534 850 532 800 525 760 Z',K['blueS'])])
shape('M466 893 C466 870 535 868 540 893 C542 908 470 910 466 893 Z',K['white'],shades=[('M500 905 C520 904 540 900 540 893 C542 908 500 910 480 908 Z',K['whiteS'])],line=L_WHITE,w=4.5)
ink([(490,903),(491,896),(492,890),(494,884)],3.5,L_WHITE,0.1,0.7); ink([(512,904),(513,897),(514,891),(516,885)],3.5,L_WHITE,0.1,0.7)
shape('M562 770 C553 820 553 862 560 898 L623 900 C628 862 626 820 616 770 Z',K['blue'],shades=[('M600 760 C610 800 614 850 610 899 L622 899 C625 850 622 800 616 760 Z',K['blueS'])],
      rims=['M563 780 C560 820 560 860 563 890 L567 890 C565 860 565 820 568 780 Z'])
shape('M550 895 C548 868 628 866 634 895 C638 912 552 914 550 895 Z',K['white'],shades=[('M590 908 C615 906 636 902 634 895 C638 912 590 914 570 912 Z',K['whiteS'])],line=L_WHITE,w=4.5)
ink([(578,906),(579,899),(580,892),(582,886)],3.5,L_WHITE,0.1,0.7); ink([(602,906),(603,899),(604,892),(606,886)],3.5,L_WHITE,0.1,0.7)

# belly plate
shape('M492 630 C470 690 470 772 496 836 C524 866 572 866 594 840 C608 772 602 690 574 632 Z',K['white'],
      shades=[('M470 600 C520 680 580 690 620 640 L620 600 Z',K['whiteS']),('M560 650 C590 720 600 800 590 842 C606 790 604 700 574 632 Z',K['whiteS'])],line=L_WHITE,w=4.5)
for y in (705,752,798): ink([(484,y),(512,y+10),(556,y+10),(596,y-2)],3.5,L_WHITE,0.1,0.1)
# ---------------- head (tilt via HEAD)
P(f'<g transform="rotate({-4+HEAD} 590 600)">')
# far ear (behind head)
P(f'<g transform="rotate({-EAR} 470 300)">')
shape('M432 340 C408 280 395 210 400 150 C450 175 495 220 515 262 Z',K['blue'],shades=[('M400 150 C430 200 450 260 460 320 L432 340 C408 280 395 210 400 150 Z',K['blueS'])])
shape('M442 312 C428 270 421 226 423 188 C451 207 478 236 492 262 Z',K['white'],shades=[('M423 188 C440 220 452 260 456 300 L442 312 C428 270 421 226 423 188 Z',K['whiteS'])],line=L_WHITE,w=3.5)
P('</g>')
# cheek tufts
shape('M410 500 C380 505 356 520 342 545 C370 540 386 546 398 556 C388 566 382 580 382 596 C408 582 428 578 446 580 Z',K['blue'],shades=[('M382 596 C400 584 420 578 446 580 L430 560 Z',K['blueS'])])
shape('M770 500 C800 510 822 530 832 558 C806 552 790 556 778 564 C786 576 790 590 788 606 C764 592 744 586 726 586 Z',K['blue'],shades=[('M770 500 C800 510 822 530 832 558 C806 552 790 556 778 564 C786 576 790 590 788 606 C764 592 744 586 726 586 Z',K['blueS'])])
head='M600 238 C715 236 795 320 795 425 C795 505 760 560 715 590 C680 612 630 622 585 620 C525 618 470 600 435 568 C400 535 386 488 390 438 C396 320 480 240 600 238 Z'
shape(head,K['blue'],
      shades=[('M700 262 C790 302 806 420 782 500 C762 560 702 600 622 616 C690 580 742 520 752 450 C760 380 742 312 700 262 Z',K['blueS']),
              ('M640 252 C690 262 730 290 752 318 C720 300 680 290 640 290 Z',K['blueS'])],
      rims=['M396 425 C400 345 452 272 520 249 C468 282 422 345 406 425 Z'],
      lights=[('M470 300 C500 270 540 256 580 252 C545 266 512 284 488 312 Z',K['blueH']),('M455 335 C458 328 464 320 470 314 C468 322 465 330 462 338 Z',K['blueH'])])
# near ear (in front of the head contour)
P(f'<g transform="rotate({EAR} 700 280)">')
shape('M640 252 C690 205 745 160 795 128 C800 200 790 270 765 335 Z',K['blue'],shades=[('M795 128 C792 210 780 280 765 335 L745 320 C770 260 785 190 795 128 Z',K['blueS'])])
shape('M666 252 C705 216 745 186 779 166 C781 216 773 262 756 306 Z',K['white'],shades=[('M779 166 C778 220 768 268 756 306 L742 290 C760 250 772 205 779 166 Z',K['whiteS'])],line=L_WHITE,w=3.5)
ink([(690,250),(705,236),(722,224),(738,214)],3,L_WHITE,0.1,0.6); ink([(700,268),(716,256),(732,246),(748,240)],3,L_WHITE,0.1,0.6)
P(f'<circle cx="770" cy="322" r="15" fill="none" stroke="{L_BLUE}" stroke-width="10"/><circle cx="770" cy="322" r="15" fill="none" stroke="{K["gold"]}" stroke-width="5"/>')
P('<path d="M760 312 Q766 308 772 309" stroke="#fff3c0" stroke-width="3" fill="none" stroke-linecap="round"/>')
P('</g>')
# green markings
shape('M468 282 C482 304 488 330 480 356 C466 334 460 308 468 282 Z',K['green'],shades=[('M476 300 C484 320 486 340 480 356 C478 336 476 318 476 300 Z',K['greenS'])],line=L_BLUE,w=3.5)
shape('M626 268 C642 290 648 318 638 344 C624 322 618 294 626 268 Z',K['green'],shades=[('M634 286 C642 306 644 326 638 344 C636 324 634 304 634 286 Z',K['greenS'])],line=L_BLUE,w=3.5)
# crystal horn
shape('M562 136 C572 168 580 205 584 244 C566 252 544 252 526 244 C536 205 548 168 562 136 Z',K['cry'],
      shades=[('M562 136 C572 168 580 205 584 244 C574 248 566 250 558 250 C562 210 564 170 562 136 Z',K['cryS'])],
      lights=[('M556 160 C550 190 545 216 540 238 L546 240 C550 214 554 188 556 160 Z','#ffffff')],line=L_BLUE,w=4.5)
# muzzle
shape('M500 506 C506 484 572 482 582 506 C588 536 564 556 540 556 C512 556 494 534 500 506 Z','#c8efff',
      shades=[('M560 482 C585 495 595 530 575 555 C560 565 540 566 528 562 C560 548 575 520 560 482 Z','#94cff0')],line=L_BLUE,w=4)
# eyes
def eye(cx,cy,rx,ry,far=False):
    if BLINK:
        ink([(cx-rx*1.1,cy+6),(cx-rx*0.5,cy-ry*0.32),(cx+rx*0.5,cy-ry*0.32),(cx+rx*1.1,cy+4)],13,L_BLUE,0.3,0.3)
        return
    P(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#121a40"/>')
    P(f'<ellipse cx="{cx}" cy="{cy+ry*0.14}" rx="{rx*0.84}" ry="{ry*0.74}" fill="#2552bf"/>')
    P(f'<path d="M{cx-rx*0.84} {cy+ry*0.2} Q{cx} {cy+ry*0.55} {cx+rx*0.84} {cy+ry*0.2} Q{cx+rx*0.7} {cy+ry*0.85} {cx} {cy+ry*0.88} Q{cx-rx*0.7} {cy+ry*0.85} {cx-rx*0.84} {cy+ry*0.2} Z" fill="#4cbcff"/>')
    P(f'<path d="M{cx-rx*0.6} {cy+ry*0.62} Q{cx} {cy+ry*0.84} {cx+rx*0.6} {cy+ry*0.62} Q{cx} {cy+ry*0.76} {cx-rx*0.6} {cy+ry*0.62} Z" fill="#b6f4ff"/>')
    P(f'<ellipse cx="{cx+rx*0.04}" cy="{cy+ry*0.06}" rx="{rx*0.4}" ry="{ry*0.5}" fill="#0a0f2c"/>')
    P(f'<ellipse cx="{cx-rx*0.32}" cy="{cy-ry*0.36}" rx="{rx*0.34}" ry="{ry*0.27}" transform="rotate(-25 {cx-rx*0.32} {cy-ry*0.36})" fill="#ffffff"/>')
    P(f'<circle cx="{cx+rx*0.38}" cy="{cy+ry*0.3}" r="{rx*0.14}" fill="#ffffff"/>')
    P(f'<circle cx="{cx-rx*0.42}" cy="{cy+ry*0.2}" r="{rx*0.07}" fill="#ffffff"/>')
    o=-1 if far else 1
    ink([(cx-o*rx*1.12,cy-ry*0.05),(cx-o*rx*0.9,cy-ry*1.12),(cx+o*rx*0.6,cy-ry*1.18),(cx+o*rx*1.12,cy-ry*0.3)],15 if not far else 12,L_BLUE,0.25,0.3)
    ox=cx+o*rx*1.08; oy=cy-ry*0.32
    ink([(ox,oy),(ox+o*10,oy-6),(ox+o*18,oy-14),(ox+o*24,oy-26)],8,L_BLUE,0.9,0.1)
    ink([(ox-o*4,oy+14),(ox+o*8,oy+10),(ox+o*16,oy+6),(ox+o*24,oy-2)],6,L_BLUE,0.9,0.1)
    ink([(cx-rx*0.5,cy+ry*1.02),(cx-rx*0.15,cy+ry*1.1),(cx+rx*0.2,cy+ry*1.1),(cx+rx*0.5,cy+ry*1.0)],3.5,L_BLUE,0.2,0.2)
eye(470,440,31,58,far=True); eye(618,434,45,63)
# blush
for (bx,by,bw) in ((458,518,22),(650,512,34)):
    P(f'<ellipse cx="{bx}" cy="{by}" rx="{bw}" ry="{bw*0.42}" fill="{K["pink"]}" opacity="0.7"/>')
    for i in range(3): ink([(bx-bw*0.55+i*bw*0.45,by+8),(bx-bw*0.5+i*bw*0.45,by+2),(bx-bw*0.45+i*bw*0.45,by-4),(bx-bw*0.4+i*bw*0.45,by-10)],3,'#e8648a',0.3,0.3)
# nose + mouth (open smile with a fang)
P(f'<path d="M520 497 Q532 491 544 497 Q538 508 532 510 Q526 508 520 497 Z" fill="{L_BLUE}"/>')
my=530; mh=22*MOUTH
P(f'<path d="M505 {my} Q522 {my+mh*1.6} 538 {my+mh*0.9} Q556 {my+mh*1.5} 568 {my} Q552 {my+8} 537 {my+4} Q520 {my+8} 505 {my} Z" fill="#7d1f3f" stroke="{L_BLUE}" stroke-width="3.5" stroke-linejoin="round"/>')
if MOUTH>0.3: P(f'<path d="M520 {my+mh*1.0} Q537 {my+mh*0.55} 556 {my+mh*0.95} Q546 {my+mh*1.3} 537 {my+mh*1.15} Q528 {my+mh*1.3} 520 {my+mh*1.0} Z" fill="#ff8aa6"/>')
P(f'<path d="M512 {my+2} L517 {my+13} L522 {my+4} Z" fill="#ffffff" stroke="{L_BLUE}" stroke-width="1.5"/>')
ink([(496,522),(504,532),(516,534),(528,530)],3.5,L_BLUE,0.6,0.2); ink([(578,520),(570,531),(558,534),(546,530)],3.5,L_BLUE,0.6,0.2)
P('</g>')
P('</svg>')
open(sys.argv[1],'w').write('\n'.join(out))
