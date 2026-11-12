# Finds frames that "pop": a frame that differs from the frames a little before and after it more than those two differ
# from each other. That is how a render dropout looks (layers vanish for a few frames, then come back); camera motion and
# planned cuts change smoothly or once, so they are not flagged.
#   python3 tools/find-pops.py <frames dir> [--gap 12] [--ratio 2.5]
# Catches flickers shorter than about 2 x gap frames. For longer dropouts of one element, use tools/layer-present.py.
import sys, os, subprocess, numpy as np
d = sys.argv[1]
gap = int(sys.argv[sys.argv.index('--gap') + 1]) if '--gap' in sys.argv else 12
ratio = float(sys.argv[sys.argv.index('--ratio') + 1]) if '--ratio' in sys.argv else 2.5
files = sorted(f for f in os.listdir(d) if f.endswith('.jpg'))
W, H = 48, 27
cmd = ['nice', 'ffmpeg', '-loglevel', 'error', '-threads', '4', '-framerate', '60', '-i', os.path.join(d, 'f%06d.jpg'), '-vf', f'scale={W}:{H}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
raw = subprocess.run(cmd, capture_output=True, check=True).stdout
X = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
n = len(X)
diff = lambda a, b: np.abs(X[a] - X[b]).mean()
flag = []
for i in range(gap, n - gap):
    a, b = i - gap, i + gap
    ends = diff(a, b)
    mid = min(diff(i, a), diff(i, b))
    if mid > ratio * ends + 1.5:
        flag.append((i, round(float(mid), 2), round(float(ends), 2)))
runs = []
for i, m, e in flag:
    if runs and i - runs[-1][1] <= gap: runs[-1][1] = i; runs[-1][2] = max(runs[-1][2], m)
    else: runs.append([i, i, m])
print(f'{n} frames scanned, {len(flag)} flagged in {len(runs)} stretches')
for a, b, m in runs: print(f'  frames {a}-{b}  ({a/60:.2f}s to {b/60:.2f}s)  strength {m}')
