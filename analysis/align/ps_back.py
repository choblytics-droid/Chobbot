import json, re
from ps_chunk import align, lines, norm
cursor=165.5; res={}
for i in range(len(lines)-1,-1,-1):
    best=None
    for W in (9,12,16,22):
        lo=max(0,i-1)
        r=align(max(0,cursor-W), cursor, lo, i+1)
        if not r: continue
        n1=len([w for w in re.split(r"[\s–—-]+",lines[i]) if norm(w)])
        last=r[-n1:]
        if max(b-a for _,a,b in last)<2.2: best=(last,W); break
    if not best: print('FAIL',i); r=align(max(0,cursor-16),cursor,i,i+1); best=(r,16)
    last=best[0]; res[i]=last
    print(f"{i:2d} {last[0][1]:7.2f}-{last[-1][2]:7.2f} W{best[1]:2d} {lines[i]}")
    cursor=last[0][1]+0.05
json.dump(res,open('ps_back.json','w'))
