import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
src=np.asarray(Image.open('chob_yutoo_green_source.png').convert('RGB')).astype(np.float32)
r,g,b=src[...,0],src[...,1],src[...,2]
gd=g-np.maximum(r,b); a=np.clip((110-gd)/80,0,1); a[a<0.04]=0
out=src.copy(); out[...,1]=np.where(gd>0,np.maximum(r,b),g)
rgba=np.dstack([out,a*255]).clip(0,255).astype(np.uint8)
H,W=a.shape; lum=src.mean(axis=2)
fg=a>0.5; line=lum<70
poly=[(960,1080),(1010,1060),(1140,1160),(1400,1180),(1430,1300),(1290,1560),(1495,1600),(1495,1860),(1240,1860),(1250,2110),(1000,2170),(870,2150),(860,1950),(830,1720),(735,1650),(745,1560),(840,1500),(925,1380),(945,1250)]
pm=Image.new('L',(W,H),0); ImageDraw.Draw(pm).polygon(poly,fill=1); pm=np.asarray(pm).astype(bool)
red=(r>120)&(g<80)&(b<80)
lab,n=ndimage.label(fg&~line)
idx=np.arange(1,n+1)
yy,xx=np.indices(lab.shape)
cnt=np.bincount(lab.ravel(),minlength=n+1)
cy=np.bincount(lab.ravel(),weights=yy.ravel(),minlength=n+1)/np.maximum(cnt,1)
cx=np.bincount(lab.ravel(),weights=xx.ravel(),minlength=n+1)/np.maximum(cnt,1)
rf=np.bincount(lab.ravel(),weights=red.ravel(),minlength=n+1)/np.maximum(cnt,1)
keep=[i for i in idx if pm[int(cy[i]),int(cx[i])] and not (rf[i]>0.5 and cy[i]<1450)]
yut=np.isin(lab,keep)
yut=ndimage.binary_dilation(yut,iterations=9)&fg
yut=ndimage.binary_fill_holes(yut)&fg
yut=ndimage.binary_opening(yut,iterations=2)
yy0=np.indices(yut.shape)[0]
redish=(r>110)&(g<90)&(b<90)&(r-g>60)
yut&=~ndimage.binary_dilation(redish&(yy0<1450),iterations=3)
yut=ndimage.binary_opening(yut,iterations=2)
ch=fg&~yut
l2,n2=ndimage.label(ch); s=np.bincount(l2.ravel())[1:]; ch=l2==(np.argmax(s)+1)
for m,name,excl in ((yut,'yutoo',None),(ch,'chob',yut)):
    soft=ndimage.binary_dilation(m,iterations=2)&(a>0)
    if excl is not None: soft&=~excl
    one=rgba.copy(); one[...,3]=np.where(soft,one[...,3],0)
    ys,xs=np.where(soft)
    Image.fromarray(one[ys.min():ys.max()+1,xs.min():xs.max()+1],'RGBA').save(f'{name}.png'); print(name,xs.max()-xs.min()+1,ys.max()-ys.min()+1)
import sys
if '--sheet' not in sys.argv: raise SystemExit
tiles=[]
for f in ('chob_yutoo_pair.png','chob.png','yutoo.png'):
    im=Image.open(f)
    for c in [(20,20,20),(245,242,234)]:
        t=Image.new('RGB',(600,800),c); s=min(560/im.width,760/im.height); p=im.resize((int(im.width*s),int(im.height*s)),Image.LANCZOS)
        t.paste(p,((600-p.width)//2,(800-p.height)//2),p); tiles.append(t)
sheet=Image.new('RGB',(3600,800))
for i,t in enumerate(tiles): sheet.paste(t,(600*i,0))
sheet.resize((2160,480)).save('D:/Temp/claude/D--APP/dfcfe714-ef39-498c-90c9-41bf399f9335/scratchpad/cut_check.jpg')
