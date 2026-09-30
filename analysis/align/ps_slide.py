import json, re
from ps_chunk import align, lines, norm
cursor=9.5; res=[]
i=0
while i < len(lines):
    best=None
    for W in (9, 12, 16, 22):
        r=align(cursor, cursor+W, i, min(i+2,len(lines)))
        if not r: continue
        n1=len([w for w in re.split(r"[\s–—-]+",lines[i]) if norm(w)])
        first=r[:n1]
        # sanity: no crazy long words, first word not glued to window start after a long leak
        durs=[b-a for _,a,b in first]
        ok=max(durs)<2.2
        if ok: best=(first,r,W); break
    if not best:
        print('FAIL line',i,lines[i],'at',cursor); r=align(cursor,cursor+16,i,i+1); best=(r,r,16)
    first=best[0]
    res.append({'i':i,'text':lines[i],'words':first})
    print(f"{i:2d} {first[0][1]:7.2f}-{first[-1][2]:7.2f} W{best[2]:2d} {lines[i]}")
    cursor=first[-1][2]-0.05
    i+=1
json.dump(res,open('ps_lines.json','w'),indent=0)
