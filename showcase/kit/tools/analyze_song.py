# Song structure: tempo, beats, downbeats (4/4 guess), RMS energy per bar, section changes.
import sys, json, numpy as np, librosa
path, out = sys.argv[1], sys.argv[2]
y, sr = librosa.load(path, sr=22050, mono=True)
dur = len(y)/sr
oenv = librosa.onset.onset_strength(y=y, sr=sr)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, units='time')
tempo = float(np.atleast_1d(tempo)[0])
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
# pick downbeat phase: the beat offset (0..3) with strongest mean onset strength
bf = librosa.time_to_frames(beats, sr=sr)
st = oenv[np.clip(bf,0,len(oenv)-1)]
phase = int(np.argmax([st[i::4].mean() for i in range(4)]))
down = beats[phase::4]
bars = []
for i in range(len(down)-1):
    m = (t>=down[i])&(t<down[i+1]); bars.append(float(rms[m].mean()))
# low/high band energy per second for a coarse "energy curve"
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))**2
f = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = S[f<150].sum(0); high = S[f>4000].sum(0)
sec = int(dur)+1
def persec(v): return [float(v[(t[:len(v)]>=s)&(t[:len(v)]<s+1)].mean()) if ((t[:len(v)]>=s)&(t[:len(v)]<s+1)).any() else 0 for s in range(sec)]
rs, ls, hs = persec(rms), persec(low), persec(high)
# section boundaries via agglomerative clustering on chroma+mfcc
C = librosa.feature.chroma_cqt(y=y, sr=sr); M = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
X = np.vstack([librosa.util.normalize(C,axis=1), librosa.util.normalize(M,axis=1)])
bnd = librosa.segment.agglomerative(X, 10)
bt = librosa.frames_to_time(bnd, sr=sr).tolist()
json.dump({'duration':dur,'tempo':tempo,'beats':[round(float(b),3) for b in beats],'downbeats':[round(float(b),3) for b in down],
           'bar_rms':bars,'rms_per_s':rs,'low_per_s':ls,'high_per_s':hs,'sections':[round(b,2) for b in bt]}, open(out,'w'))
print('dur',round(dur,2),'tempo',round(tempo,2),'beats',len(beats),'bar',round(float(np.median(np.diff(down))),3))
print('sections',[round(b,1) for b in bt])
mx=max(rs)
for s in range(0,sec,2): print(f'{s:3d}s rms {"#"*int(40*rs[s]/mx):40s} low {"#"*int(20*ls[s]/max(ls)):20s} hi {"#"*int(20*hs[s]/max(hs))}')
