# Pixel NPC "Mila", the shepherd girl: built from shape layers on a 32x44 grid, then auto-outlined and
# shaded (light from the top-left), like the farm-game NPC style in the reference.
import numpy as np
from PIL import Image
W,H=32,44
PAL={'skin':((255,217,184),(240,176,140),(255,234,214)),'hair':((150,88,50),(108,60,34),(186,118,66)),
 'scarf':((248,245,236),(214,206,190),(255,255,255)),'trim':((96,140,186),(70,104,146),(130,170,210)),
 'dress':((112,148,80),(84,114,58),(140,176,100)),'apron':((252,247,234),(222,212,190),(255,255,255)),
 'shoe':((96,62,42),(70,44,30),(120,80,56)),'eye':((43,29,26),)*3,'eyeH':((255,255,255),)*3,
 'blush':((246,150,138),)*3,'mouth':((150,60,50),)*3,'bow':((214,96,80),(170,70,60),(236,130,110)),'sleeve':((112,148,80),(84,114,58),(140,176,100))}
OUT=(59,42,36)
def canvas(): return np.full((H,W),'',dtype=object)
def ell(g,cx,cy,rx,ry,k,cond=None):
    for y in range(H):
        for x in range(W):
            if ((x+0.5-cx)/rx)**2+((y+0.5-cy)/ry)**2<=1 and (cond is None or cond(x,y)): g[y,x]=k
def rect(g,x0,y0,x1,y1,k):
    for y in range(max(0,y0),min(H,y1+1)):
        for x in range(max(0,x0),min(W,x1+1)): g[y,x]=k
def px(g,pts,k):
    for x,y in pts:
        if 0<=x<W and 0<=y<H: g[y,x]=k
def render(g,scale=8,mirror=False):
    if mirror: g=g[:,::-1]
    img=np.zeros((H,W,4),np.uint8)
    filled=g!=''
    for y in range(H):
        for x in range(W):
            k=g[y,x]
            if not k:
                nb=[(x+dx,y+dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))]
                if any(0<=a<W and 0<=b<H and filled[b,a] for a,b in nb): img[y,x]=(*OUT,255)
                continue
            base,shade,light=PAL[k]
            same=lambda a,b: 0<=a<W and 0<=b<H and g[b,a]==k
            c=base
            if not same(x+1,y) or not same(x,y+1) or not same(x+1,y+1): c=shade
            elif not same(x-1,y-1) and not same(x,y-1) and k in('hair','scarf','apron','dress','skin'): c=light
            # selective inner outline between body groups
            grp=lambda kk:'head' if kk in('skin','hair','scarf','trim','eye','eyeH','blush','mouth') else 'body'
            if k not in('eye','eyeH','blush','mouth') and any(0<=a<W and 0<=b<H and g[b,a] and grp(g[b,a])!=grp(k) for a,b in ((x,y-1),)): c=tuple(int(v*0.55) for v in shade)
            img[y,x]=(*c,255)
    im=Image.fromarray(img,'RGBA')
    return im.resize((W*scale,H*scale),Image.NEAREST)

def body(g,step=0,view='front'):
    # legs/shoes
    if view=='side':
        rect(g,14,37,17,39-(1 if step==1 else 0),'shoe'); 
        if step: rect(g,17,36,20,38,'shoe')
        rect(g,12,25,20,36,'dress'); rect(g,11,31,21,36,'dress')
        rect(g,18,27,20,35,'apron')
        rect(g,14,26,16,32,'sleeve'); rect(g,14,33,16,34,'skin')
        return
    l= 1 if step==1 else 0; r= 1 if step==3 else 0
    rect(g,11,37,14,39-r,'shoe'); rect(g,18,37,21,39-l,'shoe')
    rect(g,10,25,22,31,'dress'); rect(g,9,31,23,36,'dress')
    rect(g,7,26,9,32,'sleeve'); rect(g,23,26,25,32,'sleeve')
    rect(g,7,33,9,34,'skin'); rect(g,23,33,25,34,'skin')
    if view=='front':
        rect(g,13,26,19,28,'apron'); rect(g,12,29,20,36,'apron'); px(g,[(12,25),(20,25)],'apron')
        px(g,[(15,25),(16,25),(17,25)],'bow')
    else:
        px(g,[(13,26),(14,27),(15,28),(17,28),(18,27),(19,26)],'apron'); rect(g,14,29,18,30,'bow'); px(g,[(13,30),(19,30),(16,31)],'bow')

def head(g,view='front',blink=False):
    if view=='side':
        ell(g,16,15.5,9,9,'skin'); px(g,[(24,17),(24,18)],'skin')
        ell(g,15,13,9.8,9.6,'hair',lambda x,y: y<11 or x<15 or (x<18 and y<13))
        rect(g,7,14,11,22,'hair')
        ell(g,15.5,10,10.3,7.6,'scarf',lambda x,y:y<=9)
        for x in range(W):
            ys=[y for y in range(H) if g[y,x]=='scarf']
            if ys: g[max(ys),x]='trim'
        rect(g,5,10,7,12,'scarf'); px(g,[(4,12),(5,13)],'scarf')
        px(g,[(13,15),(13,16),(12,16)],'skin'); px(g,[(12,15)],'blush')
        if blink: px(g,[(20,17),(21,17)],'eye')
        else: rect(g,20,15,21,18,'eye'); px(g,[(20,15),(20,16)],'eyeH'); px(g,[(22,15)],'eye')
        px(g,[(22,20)],'blush'); px(g,[(23,21)],'mouth')
        return
    ell(g,16,15.5,9.5,9,'skin')
    ell(g,16,13,10.5,9.6,'hair',lambda x,y: y<12 or x<9 or x>22)
    if view=='front':
        # bangs: jagged fringe
        for x in range(9,23):
            d=[11,12,12,11,12,13,12,11,12,13,12,12,11,12][x-9]
            rect(g,x,8,x,d,'hair')
        rect(g,6,13,8,21,'hair'); rect(g,23,13,25,21,'hair')
        if blink: rect(g,11,18,13,18,'eye'); rect(g,19,18,21,18,'eye')
        else:
            rect(g,11,15,12,18,'eye'); rect(g,20,15,21,18,'eye'); px(g,[(11,16),(11,15),(20,16),(20,15)],'eyeH')
            px(g,[(10,15),(22,15)],'eye')
        rect(g,9,19,10,19,'blush'); rect(g,22,19,23,19,'blush'); px(g,[(15,20),(16,20)],'mouth')
    else:
        ell(g,16,15.5,9.6,9.2,'hair'); rect(g,6,13,25,22,'hair')
    ell(g,16,10,10.8,7.6,'scarf',lambda x,y:y<=9)
    for x in range(W):
        ys=[y for y in range(H) if g[y,x]=='scarf']
        if ys: g[max(ys),x]='trim'
    if view=='back': rect(g,14,10,18,12,'scarf'); px(g,[(13,13),(19,13)],'scarf')

def roundc(g):
    for (x,y) in [(10,25),(22,25),(9,36),(23,36),(7,26),(9,26),(23,26),(25,26),(12,25),(20,25)]:
        if g[y,x] in('dress','sleeve'): g[y,x]=''
def frame(view='front',step=0,blink=False,bob=0):
    g=canvas(); body(g,step,view)
    if view!='side': roundc(g)
    head(g,view,blink)
    if bob: g=np.roll(g,bob,axis=0)
    return g
views=[render(frame('front')),render(frame('side')),render(frame('side'),mirror=True),render(frame('back'))]
walk=[render(frame('front',s,bob=(1 if s in(1,3) else 0))) for s in range(4)]
side_walk=[render(frame('side',s%2,bob=(1 if s%2 else 0))) for s in range(4)]
sheet=Image.new('RGBA',(W*8*4+50,H*8*3+40),(236,231,214,255))
for i,im in enumerate(views): sheet.alpha_composite(im,(10+i*(W*8+10),10))
for i,im in enumerate(walk): sheet.alpha_composite(im,(10+i*(W*8+10),20+H*8))
for i,im in enumerate(side_walk): sheet.alpha_composite(im,(10+i*(W*8+10),30+H*8*2))
sheet.save('../../out/style/pixel_sheet.png')
# walk GIF (front + side), 4 fps per frame step like an NPC on a farm
fr=[]
for k in range(8):
    f=Image.new('RGBA',(W*8*2+30,H*8+20),(236,231,214,255))
    f.alpha_composite(walk[k%4],(10,10)); f.alpha_composite(side_walk[k%4],(20+W*8,10)); fr.append(f.convert('RGB'))
fr[0].save('../../out/style/pixel_walk.gif',save_all=True,append_images=fr[1:],duration=160,loop=0)
