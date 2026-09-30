import json, re
from ps_chunk import align, lines, norm
fwd={d['i']:d['words'] for d in json.load(open('ps_lines.json'))}
bwd={int(k):v for k,v in json.load(open('ps_back.json')).items()}
BAR0, BAR = 1.455, 60/132.912*4
tb=lambda b: BAR0+b*BAR
start={}
for i in range(12): start[i]=(fwd[i][0][1]+bwd[i][0][1])/2
for i in range(12,20): start[i]=bwd[i][0][1]
for i,b in zip(range(20,24),(48.7,50.7,52.7,54.7)): start[i]=tb(b)-0.35
for i,b in zip((24,25),(60.7,62.7)): start[i]=tb(b)-0.35
for i in range(26,35): start[i]=bwd[i][0][1]
ends={i:start[i+1] for i in range(34)}
ends[23]=tb(56.9); ends[25]=start[26]; ends[29]=start[30]; ends[34]=165.0
ends[31]=start[32]; ends[33]=start[34]
out=[]
for i,l in enumerate(lines):
    a=max(0,start[i]-0.6); b=ends[i]+0.25
    r=align(a,b,i,i+1)
    if not r:
        r=align(a-0.5,b+0.8,i,i+1)
    toks=[t for t in re.split(r"(?<=[^\s])[\s]+|\s[–—-]\s", l) if t.strip()]
    toks=[t for t in re.split(r"\s+", l.replace(' – ',' ').replace(' — ',' ')) if norm(t)]
    assert len(toks)==len(r),(i,toks,r)
    ws=[{'w':t,'start':round(s,3),'end':round(e,3),'conf':0.7} for t,(_,s,e) in zip(toks,r)]
    # cap sustained tails: a word ending in trailing leak is limited to 1.6 s
    for w in ws: w['end']=min(w['end'], w['start']+1.6)
    singer='A' if (i<12 or 24<=i<=31) else 'B'
    out.append({'i':i,'text':l,'start':ws[0]['start'],'end':ws[-1]['end'],'singer':singer,'words':ws})
    print(f"{i:2d} {singer} {ws[0]['start']:7.2f}-{ws[-1]['end']:7.2f}  {l}")
json.dump({'lines':out,'source':'spleeter vocals + pocketsphinx forced alignment per line, line slots from fwd/bwd passes + 2-bar grid prior'},open('/home/user/Chobbot/data/lyrics.json','w'),indent=1,ensure_ascii=False)
