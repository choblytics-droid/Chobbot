import re, wave, json, sys, time
import numpy as np
from multiprocessing import Pool
from pocketsphinx import Decoder
from ps_chunk import lines, norm
W=wave.open('voc16.wav'); AUD=W.readframes(W.getnframes())
def words_of(i): return [norm(w) for w in re.split(r"[\s–—-]+",lines[i]) if norm(w)]
_d=None
def score(args):
    global _d
    i,a,b=args
    if _d is None: _d=Decoder(samprate=16000, bestpath=False, loglevel='FATAL', beam=1e-200, wbeam=1e-200, pbeam=1e-200)
    buf=AUD[int(a*16000)*2:int(b*16000)*2]
    txt=' '.join(words_of(i)) if i>=0 else ''
    if i<0:  # gap: silence only -> use a single-word-free alignment isn't possible; score as None
        return (i,a,b,None)
    _d.set_align_text(txt); _d.start_utt(); _d.process_raw(buf, full_utt=True); _d.end_utt()
    h=_d.hyp()
    return (i,a,b, h.score if h else None)
if __name__=='__main__':
    L0,L1,A,B,step=int(sys.argv[1]),int(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5])
    grid=np.round(np.arange(A,B+1e-6,step),3)
    jobs=[]
    for i in range(L0,L1):
        nw=len(words_of(i))
        for ai,a in enumerate(grid):
            for b in grid[ai+1:]:
                if 0.18*nw <= b-a <= min(9.0, 0.9*nw+1.5): jobs.append((i,float(a),float(b)))
    print(len(jobs),'jobs'); t=time.time()
    with Pool(4) as p: res=p.map(score,jobs,chunksize=32)
    print('scored',time.time()-t)
    S={}
    for i,a,b,s in res:
        if s is not None: S[(i,a,b)]=s
    # DP: lines L0..L1-1 consecutive windows covering [A,B]; last line ends at B; line windows may start after a
    # gap (the gap scored as the same line's silence: allowed only by absorbing into the window, so windows tile)
    g=list(grid); idx={x:k for k,x in enumerate(g)}
    NEG=-1e18
    best=[[NEG]*len(g) for _ in range(L1-L0+1)]; bp=[[None]*len(g) for _ in range(L1-L0+1)]
    best[0][0]=0
    for li in range(L1-L0):
        i=L0+li
        for ka,a in enumerate(g):
            if best[li][ka]==NEG: continue
            for kb in range(ka+1,len(g)):
                s=S.get((i,float(a),float(g[kb])))
                if s is None: continue
                v=best[li][ka]+s
                if v>best[li+1][kb]: best[li+1][kb]=v; bp[li+1][kb]=ka
    kb=len(g)-1; out=[]
    for li in range(L1-L0,0,-1):
        ka=bp[li][kb]; out.append((L0+li-1,float(g[ka]),float(g[kb]))); kb=ka
    out.reverse()
    for o in out: print(o, lines[o[0]])
    json.dump(out,open(f'dp_{L0}_{L1}.json','w'))
