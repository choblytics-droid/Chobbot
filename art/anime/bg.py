# Painted anime background (bijutsu style): dusk sky gradient, cumulus banks painted with thousands of
# brush dabs (lit warm from below/left, cool in shadow), the rift crack glowing in the sky, a hazy city
# skyline with windows, and the concrete rooftop ledge Venmar sits on. Deterministic (seeded).
import numpy as np, math, random
from PIL import Image, ImageDraw, ImageFilter
W=H=1200; rnd=random.Random(7); np.random.seed(7)
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def grad(stops,t):
    for (t0,c0),(t1,c1) in zip(stops,stops[1:]):
        if t<=t1: return lerp(c0,c1,(t-t0)/(t1-t0))
    return stops[-1][1]
sky=[(0,(22,32,88)),(0.35,(70,62,150)),(0.55,(170,96,150)),(0.68,(245,150,110)),(0.74,(255,206,150)),(1,(255,226,180))]
img=Image.new('RGB',(W,H)); px=img.load()
for y in range(H):
    c=grad(sky,y/H)
    for x in range(W): px[x,y]=c
# sun glow low on the left
glow=Image.new('L',(W,H),0); ImageDraw.Draw(glow).ellipse((-200,620,500,1100),fill=255); glow=glow.filter(ImageFilter.GaussianBlur(160))
img=Image.composite(Image.new('RGB',(W,H),(255,230,170)),img,glow.point(lambda v:int(v*0.75)))
# value noise
def vnoise(w,h,s,oct=5):
    out=np.zeros((h,w))
    for o in range(oct):
        f=s/2**o; g=np.random.rand(int(h/f)+3,int(w/f)+3)
        ys=np.arange(h)/f; xs=np.arange(w)/f; yi=ys.astype(int); xi=xs.astype(int); ty=(ys-yi)[:,None]; tx=(xs-xi)[None,:]
        ty=ty*ty*(3-2*ty); tx=tx*tx*(3-2*tx)
        a=g[yi][:,xi]; b=g[yi][:,xi+1]; c=g[yi+1][:,xi]; d=g[yi+1][:,xi+1]
        out+=((a*(1-tx)+b*tx)*(1-ty)+(c*(1-tx)+d*tx)*ty)/2**o
    return out/2
n=vnoise(W,H,160.)
# cumulus clusters, anime cel-style: union of puffs; lit rim = mask minus the mask shifted away from the
# low sun (left/below), plus a mid tone and a cool shadow; a light dab texture and soft edge on top
yy,xx=np.mgrid[0:H,0:W]
def cluster(x0,x1,base,top,seed):
    r=random.Random(seed); m=np.zeros((H,W),bool)
    x=x0
    while x<x1:
        rad=r.uniform(40,110); h=top+(base-top)*(0.35+0.65*abs(math.sin((x-x0)/(x1-x0)*math.pi*1.3+seed)))
        cy=max(top+rad, h); m|=(xx-x)**2+(yy-cy)**2<rad**2
        for k in range(3):
            rr=rad*r.uniform(0.4,0.7); m|=(xx-x-r.uniform(-rad,rad))**2+(yy-cy+rad*r.uniform(0.3,0.8))**2<rr**2
        x+=rad*r.uniform(0.7,1.1)
    m&=yy<base+10*np.sin(xx/37.0+seed)+6*np.sin(xx/13.0)
    return m
def sh(m,dx,dy):
    o=np.zeros_like(m); H_,W_=m.shape
    o[max(0,dy):H_+min(0,dy), max(0,dx):W_+min(0,dx)] = m[max(0,-dy):H_-max(0,dy), max(0,-dx):W_-max(0,dx)]
    return o
def shade(m,cool,mid,warm,hot):
    lit=m & ~sh(m,-18,22)        # faces towards the low sun (left / below)
    rim=m & ~sh(m,-6,8)
    top=m & ~sh(m,0,26)                              # upper crowns catch the sky light
    out=np.zeros((H,W,4),np.uint8)
    out[m]=(*cool,255); out[top]=(*mid,255); out[lit]=(*warm,255); out[rim]=(*hot,255)
    return Image.fromarray(out,'RGBA')
for (x0,x1,base,top,seed,c) in [(-60,700,470,250,1,((118,96,170),(160,128,196),(246,160,150),(255,222,190))),
                                 (560,1300,430,280,2,((112,92,168),(150,122,192),(236,150,150),(255,214,186))),
                                 (-80,1300,690,520,3,((150,104,160),(196,136,176),(255,182,150),(255,232,200)))]:
    m=cluster(x0,x1,base,top,seed)
    layer=shade(m,*c)
    # brush texture: dabs of slightly varied colour inside the cloud, then a soft edge
    tex=Image.new('RGBA',(W,H),(0,0,0,0)); td=ImageDraw.Draw(tex)
    arr=np.array(layer)
    idx=np.argwhere(m)
    for k in rnd.sample(range(len(idx)),min(len(idx),5000)):
        y,x=idx[k]; col=arr[y,x,:3].astype(int)+rnd.randint(-12,12); rr=rnd.uniform(3,9)
        td.ellipse((x-rr*1.6,y-rr,x+rr*1.6,y+rr),fill=(*np.clip(col,0,255).tolist(),110))
    layer=Image.alpha_composite(layer,tex)
    alpha=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    layer.putalpha(Image.fromarray(np.minimum(np.array(layer)[:,:,3],np.array(alpha))))
    img.paste(layer,(0,0),layer)
# the rift: a jagged glowing crack across the upper sky
rift=Image.new('L',(W,H),0); rd=ImageDraw.Draw(rift)
pts=[];x=-40;y=170
while x<W+40:
    pts.append((x,y)); x+=rnd.uniform(25,60); y=170+90*math.sin(x/260)+rnd.uniform(-18,18)
rd.line(pts,fill=255,width=7)
core=rift.filter(ImageFilter.GaussianBlur(2)); halo=rift.filter(ImageFilter.GaussianBlur(26))
img=Image.composite(Image.new('RGB',(W,H),(255,170,90)),img,halo.point(lambda v:min(255,int(v*2.2))))
img=Image.composite(Image.new('RGB',(W,H),(255,248,220)),img,core)
# distant city skyline with haze and windows
city=Image.new('RGBA',(W,H),(0,0,0,0)); cd=ImageDraw.Draw(city)
x=0
while x<W:
    w=rnd.randint(30,90); h=rnd.randint(60,260); top=780-h
    cd.rectangle((x,top,x+w,1000),fill=(64,48,104,255))
    for wy in range(top+10,780,14):
        for wx in range(x+6,x+w-6,11):
            if rnd.random()<0.32: cd.rectangle((wx,wy,wx+4,wy+6),fill=(255,rnd.randint(170,220),120,255))
    if rnd.random()<0.3: cd.rectangle((x+w//2-1,top-40,x+w//2+1,top),fill=(64,48,104,255)); cd.ellipse((x+w//2-4,top-46,x+w//2+4,top-38),fill=(255,60,60,255))
    x+=w-rnd.randint(4,14)
img.paste(city,(0,0),city)
haze=Image.new('L',(W,H),0); ImageDraw.Draw(haze).rectangle((0,700,W,830),fill=150); haze=haze.filter(ImageFilter.GaussianBlur(40))
img=Image.composite(Image.new('RGB',(W,H),(250,180,150)),img,haze)
# rooftop ledge (foreground), painted concrete with a warm lit top edge
led=Image.new('RGBA',(W,H),(0,0,0,0)); ld=ImageDraw.Draw(led)
ld.polygon([(0,915),(W,895),(W,H),(0,H)],fill=(52,44,78,255))
ld.polygon([(0,905),(W,885),(W,905),(0,925)],fill=(232,168,140,255))
tex=Image.new('RGBA',(W,H),(0,0,0,0)); tdd=ImageDraw.Draw(tex)
for i in range(1800):
    x=rnd.uniform(0,W); y=rnd.uniform(925,H); c=rnd.randint(40,70)
    tdd.ellipse((x-6,y-2,x+6,y+2),fill=(c,c-8,c+30,90))
led=Image.alpha_composite(led,tex)
img.paste(led,(0,0),led)
img.save('bg.png')
