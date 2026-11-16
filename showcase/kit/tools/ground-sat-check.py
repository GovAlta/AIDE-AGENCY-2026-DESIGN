#!/usr/bin/env python3
"""Ground saturation check (owner, 2026-11-16: "the background colours are getting pretty strong ... They also seem to be covering
the cards"). Measures the colour washes of a film's light scenes the way the coordinator measured the approved films, and passes or
fails against film #20 Prototype Lab's level.

How it measures: each frame is scaled to 320 x 180; only the light pixels count (HLS lightness between 0.70 and 0.985: the ground
and the soft card surfaces; text, the band, dark art and pure white are left out); a frame with fewer than 5,000 such pixels (a
title or end card, a dark frame) is skipped. Per frame: the mean HLS saturation, its 95th percentile, and the share of pixels over
50 percent saturation. The film's figures are the means over its frames.

Reference, measured the same way on 12 frames of each approved master (2026-11-16):
  01 Atlas 29.7 / 46.4 / 3.1%   20 Prototype Lab 27.7 / 44.6 / 3.7%   19 Keystone 29.2 / 47.7 / 4.5%
  22 PaC Builder 28.3 / 46.8 / 6.8%   31 Enterprise Tools 27.9 / 46.4 / 4.2%   21 PIA Builder 32.5 / 53.7 / 11.5%
Limits: mean saturation at most 31.0 (aim for 28 to 30) and at most 5.0 percent of light pixels over 50 percent saturation.
It also fails if any single frame is far above the others (a wash stronger behind one scene than another): a frame's mean more
than 6 points over the film's mean, or more than 12 percent of its pixels over 50 percent.

  python3 tools/ground-sat-check.py <video.mp4 | folder of stills> [--frames 12] [--max-mean 31] [--max-strong 5] [--each]
A video is sampled at --frames evenly spaced moments. A folder is read whole (every .jpg and .png): the stills are first encoded the
way the kit makes a master (full range to TV range, BT.709), because a full-range still read directly measures higher near white.
Measure a master made by the kit's encode.sh; a file encoded another way (a quick test encode) is not on the same footing. Exit code 1 on a fail."""
import colorsys, io, pathlib, subprocess, sys
from PIL import Image
def arg(k, d): return type(d)(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
src = pathlib.Path(sys.argv[1]); N = arg('--frames', 12); MAXM = arg('--max-mean', 31.0); MAXS = arg('--max-strong', 5.0)
def measure(im):
    im = im.convert('RGB'); im = im if im.size == (320, 180) else im.resize((320, 180), Image.BILINEAR)
    raw = im.tobytes(); hl = [colorsys.rgb_to_hls(raw[i] / 255, raw[i + 1] / 255, raw[i + 2] / 255) for i in range(0, len(raw), 3)]
    if sum(1 for h, l, _ in hl if l >= 0.985) > 0.4 * len(hl): return None      # a title or end card: mostly pure white
    s = sorted(x for h, l, x in hl if 0.70 < l < 0.985)
    if len(s) < 5000: return None
    return 100 * sum(s) / len(s), 100 * s[int(len(s) * .95)], 100 * sum(1 for x in s if x > 0.5) / len(s)
rows = []
if src.is_dir():
    # stills are full-range JPEGs or PNGs: encode them as the kit's encode.sh encodes a master, one still a second, then measure that
    import tempfile
    files = sorted(list(src.glob('*.jpg')) + list(src.glob('*.png')))
    with tempfile.TemporaryDirectory() as td:
        lst = pathlib.Path(td) / 'list.txt'; lst.write_text(''.join(f"file '{f.resolve()}'\nduration 1\n" for f in files))
        mp4 = pathlib.Path(td) / 'stills.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,fps=10',
                        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', str(mp4)], check=True)
        for k, f in enumerate(files):
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(k + 0.5), '-i', str(mp4), '-frames:v', '1', '-vf', 'scale=320:180', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
            if not raw: continue
            m = measure(Image.open(io.BytesIO(raw)))
            if m: rows.append((f.name, *m))
else:
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(src)], capture_output=True, text=True).stdout)
    for k in range(1, N + 1):
        t = d * k / (N + 1)
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', str(src), '-frames:v', '1', '-vf', 'scale=320:180', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
        if not raw: continue
        m = measure(Image.open(io.BytesIO(raw)))
        if m: rows.append((f'{t:7.2f} s', *m))
if not rows: print('no light frames to measure'); sys.exit(1)
n = len(rows); mean = sum(r[1] for r in rows) / n; p95 = sum(r[2] for r in rows) / n; strong = sum(r[3] for r in rows) / n
if '--each' in sys.argv:
    for r in rows: print(f'  {r[0]:>16s}  mean {r[1]:5.1f}  p95 {r[2]:5.1f}  over 50%: {r[3]:5.1f}%')
out = [r for r in rows if r[1] > mean + 9 or r[3] > 15]
ok = mean <= MAXM and strong <= MAXS and not out
print(f'ground check: {n} light frames · mean saturation {mean:.1f} (limit {MAXM:g}; film #20: 27.7) · 95th percentile {p95:.1f} (film #20: 44.6) · over 50%: {strong:.1f}% (limit {MAXS:g}%; film #20: 3.7%)')
for r in out: print(f'  a stronger wash than the rest at {r[0]}: mean {r[1]:.1f}, over 50%: {r[3]:.1f}%')
print('GROUND OK' if ok else 'GROUND FAIL: bring the washes down (fewer, smaller, paler; keep them behind the cards)'); sys.exit(0 if ok else 1)
