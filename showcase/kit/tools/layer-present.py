# Checks that something you expect on screen is present in every frame of a range: the share of pixels in a box that match a
# colour rule must stay above a floor. Catches render dropouts longer than find-pops' window (the 0:39 dropout of film #11
# was 99 frames of missing layers, exactly one cloud task's slice).
#   python3 tools/layer-present.py <frames dir> --from 36 --to 46 --rule warm [--box x,y,w,h] [--floor 0.4]
# rules: warm (lit yellow/orange infrastructure, city lights), cyan, white, any:<r>,<g>,<b>,<tol>
# Leave planned fades and cuts out of the range: a fade to black is flagged like a dropout.
# --floor is relative to the median share in the range (0.4 = flag frames under 40 % of the median).
import sys, subprocess, numpy as np
d = sys.argv[1]; A = dict(zip(sys.argv[2::2], sys.argv[3::2]))
fps = int(A.get('--fps', 60)); a, b = int(float(A.get('--from', 0)) * fps), int(float(A.get('--to', 10)) * fps)
x, y, w, h = map(int, A.get('--box', '0,0,1920,1036').split(','))
W, H = 384, 216
raw = subprocess.run(['nice', 'ffmpeg', '-loglevel', 'error', '-threads', '4', '-start_number', str(a), '-framerate', str(fps), '-i', f'{d}/f%06d.jpg', '-frames:v', str(b - a),
                      '-vf', f'crop={w}:{h}:{x}:{y},scale={W}:{H}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
X = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(int); R, G, B = X[..., 0], X[..., 1], X[..., 2]
rule = A.get('--rule', 'warm')
if rule == 'warm': m = (R > 120) & (G > 90) & (R - B > 45)
elif rule == 'cyan': m = (B > 140) & (G > 120) & (R < 120)
elif rule == 'white': m = (R > 210) & (G > 210) & (B > 210)
else: r, g, bb, tol = map(int, rule.split(':')[1].split(',')); m = (abs(R - r) < tol) & (abs(G - g) < tol) & (abs(B - bb) < tol)
share = m.reshape(len(X), -1).mean(1) * 100; med = float(np.median(share)); floor = float(A.get('--floor', 0.4)) * med
bad = [a + i for i, v in enumerate(share) if v < floor]
print(f'frames {a}-{b - 1}: median share {med:.3f}%, floor {floor:.3f}%, frames under floor: {len(bad)}')
if bad:
    runs, s, p = [], bad[0], bad[0]
    for f in bad[1:]:
        if f == p + 1: p = f
        else: runs.append((s, p)); s = p = f
    runs.append((s, p))
    for s, p in runs: print(f'  frames {s}-{p} ({s / fps:.2f}s to {p / fps:.2f}s): re-render with cloud/farm.sh render {s}-{p}')
sys.exit(1 if bad else 0)
