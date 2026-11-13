#!/usr/bin/env python3
# Seam check: finds frames that one farm task drew differently from its neighbours (a stale or half-loaded page for its whole chunk).
# Film #4 (2026-11-13): one task drew its 11 frames without the film's stylesheet; the cut jumped in and out again for 0.18 s.
#
# How it works, on the rendered frames only (no film page needed):
#   1. a task's chunk is a run of consecutive frames written in order; a chunk boundary is where the file times break that order
#      (the next frame was written before this one, or more than --gap seconds apart)
#   2. d[n] = mean absolute difference of frames n-1 and n (grey, 96 x 54)
#   3. ISLAND (strong): a chunk whose first and last frames both jump (d > --jump and > 4x the local median) while the frames on either
#      side of the chunk agree with each other: the chunk is wrong, not the film. A planned cut jumps once, not out and back.
#   4. BOUNDARY (weak): a single jump that falls exactly on a chunk boundary and on no planned cut (--cuts seconds, optional). Look at it.
#   python3 tools/seam-check.py <film dir or frames dir> [--fps 60] [--jump 12] [--gap 1.5] [--cuts 12.3,40.1] [--max-island 400]
# Exit status 1 when there is an island.
import os, sys, glob, statistics as st
from PIL import Image

args = sys.argv[1:]
opt = lambda k, d: type(d)(args[args.index('--' + k) + 1]) if '--' + k in args else d
root = args[0] if args and not args[0].startswith('--') else '.'
fr = root if glob.glob(os.path.join(root, 'f*.jpg')) else os.path.join(root, 'out', 'frames')
FPS, JUMP, GAP, MAXI = opt('fps', 60.0), opt('jump', 12.0), opt('gap', 1.5), opt('max-island', 400)
CUTS = [float(x) for x in opt('cuts', '').split(',') if x]
files = sorted(glob.glob(os.path.join(fr, 'f*.jpg')))
if not files: print('no frames in', fr); sys.exit(2)
num = lambda p: int(os.path.basename(p)[1:-4])
nums = [num(p) for p in files]; mt = [os.path.getmtime(p) for p in files]

def small(p):
    im = Image.open(p); im.draft('L', (240, 135)); return im.convert('L').resize((96, 54)).tobytes()
def diff(a, b): return sum(abs(x - y) for x, y in zip(a, b)) / len(a)

px = [small(p) for p in files]
d = [0.0] + [diff(px[i - 1], px[i]) if nums[i] == nums[i - 1] + 1 else 0.0 for i in range(1, len(px))]
# chunk boundaries from the write order
bound = [False] + [nums[i] == nums[i - 1] + 1 and (mt[i] < mt[i - 1] - 0.05 or mt[i] - mt[i - 1] > GAP) for i in range(1, len(px))]
def med(i, r=30):
    w = [d[k] for k in range(max(1, i - r), min(len(d), i + r)) if k != i]; return st.median(w) if w else 0
def jump(i): return d[i] > JUMP and d[i] > 4 * max(med(i), 0.5)
tc = lambda n: f'{int(n / FPS // 60)}:{n / FPS % 60:05.2f}'
near_cut = lambda n: any(abs(n / FPS - c) < 2 / FPS for c in CUTS)
B = [i for i in range(1, len(px)) if bound[i]]
islands, weak, used = [], [], set()
for a_i, a in enumerate(B):
    if not jump(a): continue
    for b in B[a_i + 1:]:
        if nums[b] - nums[a] > MAXI: break
        if jump(b):
            across = diff(px[a - 1], px[b])   # the frames on either side of the chunk
            if across < 0.5 * min(d[a], d[b]): islands.append((a, b, across)); used.update([a, b])
            break
for i in B:
    if i not in used and jump(i) and not near_cut(nums[i]): weak.append(i)
print(f'{fr}: {len(files)} frames, {len(B)} chunk boundaries')
for a, b, across in islands:
    print(f'ISLAND  frames {nums[a]}-{nums[b] - 1} ({tc(nums[a])} to {tc(nums[b])}, {nums[b] - nums[a]} frames): jump {d[a]:.1f} in, {d[b]:.1f} out, {across:.1f} across')
for i in weak: print(f'BOUNDARY frame {nums[i]} ({tc(nums[i])}): jump {d[i]:.1f} on a chunk boundary (a cut there is fine; anything else is a seam)')
print(f'{len(islands)} island(s), {len(weak)} boundary jump(s)')
sys.exit(1 if islands else 0)
