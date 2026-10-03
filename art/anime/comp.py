# Anime "satsuei" (photography) pass: grade the cel layer to the scene light, cast shadow, then the
# compositing look: bloom on highlights, a warm light leak, slight chromatic aberration, vignette, grain.
import sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageChops
bg=Image.open(sys.argv[1]).convert('RGBA'); ch=Image.open(sys.argv[2]).convert('RGBA'); out=sys.argv[3]
seed=int(sys.argv[4]) if len(sys.argv)>4 else 0
W,H=bg.size
a=np.asarray(ch).astype(np.float32)
# scene grade: dusk tint, warm light from the upper left fading to cool on the right
xx=np.linspace(0,1,W)[None,:,None]; yy=np.linspace(0,1,H)[:,None,None]
tint=np.array([0.95,0.9,1.0])*(1-0.15*xx) + np.array([0.12,0.06,0.0])*(1-xx)*(1-yy)
a[...,:3]=np.clip(a[...,:3]*tint[...,:3]*1.0 + 0,0,255)
ch=Image.fromarray(a.astype(np.uint8),'RGBA')
# cast shadow on the ledge
sh=Image.new('L',(W,H),0); ImageDraw.Draw(sh).ellipse((420,880,860,930),fill=150); sh=sh.filter(ImageFilter.GaussianBlur(12))
dark=Image.new('RGBA',(W,H),(30,20,60,255)); bg=Image.composite(dark,bg,sh.point(lambda v:int(v*0.6)))
bg.alpha_composite(ch)
img=bg.convert('RGB')
# bloom: bright pass, blurred, screened
f=np.asarray(img).astype(np.float32)/255
lum=f.mean(axis=2,keepdims=True); bright=np.clip((lum-0.72)/0.28,0,1)*f
bl=Image.fromarray((bright*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(22))
b=np.asarray(bl).astype(np.float32)/255
f=1-(1-f)*(1-b*0.85)
# warm light leak, top-left
yy,xx=np.mgrid[0:H,0:W]; d=np.hypot(xx-80,yy-120)/900
leak=np.clip(1-d,0,1)[...,None]**2*np.array([1.0,0.72,0.45])*0.28
f=1-(1-f)*(1-leak)
# chromatic aberration (1px), vignette, grain
r=np.roll(f[...,0],1,axis=1); bch=np.roll(f[...,2],-1,axis=1); f=np.stack([r,f[...,1],bch],axis=2)
v=np.hypot((xx-W/2)/(W/2),(yy-H/2)/(H/2)); f*=(1-0.22*np.clip(v-0.35,0,1)**1.4)[...,None]
rng=np.random.default_rng(seed); f+=rng.normal(0,0.012,f.shape)
Image.fromarray((np.clip(f,0,1)*255).astype(np.uint8)).save(out)
