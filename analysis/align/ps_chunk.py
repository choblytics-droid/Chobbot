import re, wave, json, sys, os
from pocketsphinx import Decoder
def norm(w):
    w=w.lower().replace('’',"'"); return re.sub(r"[^a-z']","",w).strip("'")
lines=[l.strip() for l in open('lyrics.txt') if l.strip() and not l.startswith('[')]
def align(t0,t1,li,lj,src='voc16.wav'):
    words=[norm(w) for l in lines[li:lj] for w in re.split(r"[\s–—-]+",l) if norm(w)]
    w=wave.open(src); w.setpos(int(t0*16000)); buf=w.readframes(int((t1-t0)*16000))
    d=Decoder(samprate=16000, bestpath=False, loglevel='FATAL', beam=1e-200, wbeam=1e-200, pbeam=1e-200)
    d.set_align_text(' '.join(words))
    d.start_utt(); d.process_raw(buf, full_utt=True); d.end_utt()
    if not d.hyp(): return None
    return [(s.word, round(t0+s.start_frame/100,2), round(t0+(s.end_frame+1)/100,2)) for s in d.seg() if s.word not in ('<sil>','(NULL)','<s>','</s>')]
if __name__=='__main__':
    t0,t1,li,lj=float(sys.argv[1]),float(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4])
    r=align(t0,t1,li,lj, *(sys.argv[5:6]))
    print(r)
