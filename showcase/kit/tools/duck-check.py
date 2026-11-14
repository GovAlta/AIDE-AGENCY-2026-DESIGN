#!/usr/bin/env python3
"""Is the voice clearly over the music? Measures the stems that tools/mix-audio.mjs writes (out/stem-voice.wav, out/stem-music.wav:
the voice and the ducked music as they go into the mix) against the lines' own times (narration/script.json, timing.json).
For every line: the short-term loudness (BS.1770 K-weighting, 3 s windows every 0.5 s inside the line) of the voice and of the music,
the margin between them in the worst window, and the music's loudness in the gap after the line. The check fails when the music is
less than 18 dB under the voice in any window of any line (owner, film #32: "the music needs to get much quieter when the narration
is happening"). A film mixed with the old sidechain ducking (no "duck" in film.config.json) gets the table and a warning, exit 0,
unless --strict. tools/deliver-audio.sh runs this on every film.
  python3 tools/duck-check.py <film dir> [--min 18] [--stems <dir with the stems>] [--lines 1,7,13,19,25] [--brief] [--strict]"""
import json, pathlib, subprocess, sys
import numpy as np
from scipy.signal import lfilter
A = sys.argv[1:]; opt = lambda k, d=None: A[A.index(k) + 1] if k in A else d
P = pathlib.Path(A[0]).resolve(); S = pathlib.Path(opt('--stems', P / 'out')); MIN = float(opt('--min', 18)); SR = 48000
cfg = json.loads((P / 'film.config.json').read_text()); new = 'duck' in cfg
if not (S / 'stem-voice.wav').exists() or not (S / 'stem-music.wav').exists():
    print(f'duck-check: no stems in {S}: mix again with the current kit (tools/mix-audio.mjs writes them)'); sys.exit(2 if new or '--strict' in A else 0)
script = json.loads((P / 'narration/script.json').read_text()); timing = json.loads((P / 'narration/timing.json').read_text())
def blocks(f):
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    y = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    y = lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], y, axis=0); n = len(y) // 4800
    return (y[:n * 4800] ** 2).reshape(n, 4800, 2).mean(axis=1).sum(axis=1)
EV, EM = blocks(S / 'stem-voice.wav'), blocks(S / 'stem-music.wav')
def lufs(E, s, e):
    a = max(0, round(s * 10)); b = min(len(E), max(a + 1, round(e * 10))); return -0.691 + 10 * np.log10(E[a:b].mean() + 1e-12)
L = [l for l in script['lines'] if 'at' in l and l['id'] in timing]; rows = []
for i, l in enumerate(L):
    w = timing[l['id']]['words']; s, e = l['at'] + w[0]['s'], l['at'] + w[-1]['e']; win = min(3.0, e - s); t = s; worst = (99, 0, 0)
    while t + win <= e + 1e-6:
        v, m = lufs(EV, t, t + win), lufs(EM, t, t + win)
        if v - m < worst[0]: worst = (v - m, v, m)
        t += 0.5
    nxt = L[i + 1]['at'] + timing[L[i + 1]['id']]['words'][0]['s'] if i + 1 < len(L) else cfg['dur'] - 2.2
    g0, g1 = e + 0.9, nxt - 0.3; gap = lufs(EM, g0, g1) if g1 - g0 >= 1.0 else None
    rows.append((l['id'], s, e, lufs(EV, s, e), lufs(EM, s, e), worst[0], worst[1], worst[2], gap))
pick = [int(x) for x in opt('--lines', '').split(',') if x]; show = [r for i, r in enumerate(rows) if not pick or i + 1 in pick]
bad = [r for r in rows if r[5] < MIN]; gaps = [r[8] for r in rows if r[8] is not None]
intro = lufs(EM, 0.2, max(1.2, rows[0][1] - 0.4))
if '--brief' not in A or bad:
    print('| Line | Seconds | Voice LUFS (line) | Music LUFS (line) | Worst 3 s: voice | music | margin dB | Music in the gap after |\n|---|---|---|---|---|---|---|---|')
    for r in (bad if '--brief' in A else show):
        print(f'| {r[0]} | {r[1]:.1f} to {r[2]:.1f} | {r[3]:.1f} | {r[4]:.1f} | {r[6]:.1f} | {r[7]:.1f} | {r[5]:.1f} | {"%.1f" % r[8] if r[8] is not None else "no gap"} |')
med = lambda a: float(np.median(a))
print(f'duck-check ({"duck plan" if new else "old sidechain ducking"}): voice {med([r[3] for r in rows]):.1f} LUFS (median of {len(rows)} lines), music under the voice {med([r[4] for r in rows]):.1f}, '
      f'margin median {med([r[5] for r in rows]):.1f} dB, least {min(r[5] for r in rows):.1f} dB ({min(rows, key=lambda r: r[5])[0]}); music in the gaps {med(gaps) if gaps else float("nan"):.1f}, in the intro {intro:.1f} (stem levels, before the master gain)')
if bad:
    print(f'{"FAIL" if new or "--strict" in A else "WARNING"}: the music is less than {MIN:g} dB under the voice in {len(bad)} of {len(rows)} lines' + ('' if new else ': add "duck": {} to film.config.json and mix again (guides/SOUND.md)'))
    sys.exit(1 if new or '--strict' in A else 0)
print(f'ok: the music is at least {MIN:g} dB under the voice in every line')
