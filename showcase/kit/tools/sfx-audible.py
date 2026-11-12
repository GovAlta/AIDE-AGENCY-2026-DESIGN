#!/usr/bin/env python3
# Are the sound effects heard? Nobody listens to every mix, so this measures it. For each event in <film>/out/sfx-events.json it takes the
# finished mix (<film>/out/mix.wav), keeps 1 to 8 kHz (where a phone speaker and the ear are strongest), and compares the loudest 30 ms
# in the first 150 ms of the effect (a loop: its first 400 ms) with the 200 ms before it. The onset must stand at least 6 dB over that bed.
#   python3 tools/sfx-audible.py <film dir> [--min 6]      exit 1 if any event is under the mark; also prints the stem's peak per kind
import sys, json, subprocess, numpy as np
F = sys.argv[1].rstrip('/'); MIN = float(sys.argv[sys.argv.index('--min') + 1]) if '--min' in sys.argv else 6.0; SR = 48000
def dec(f, af=None):
    a = ['ffmpeg', '-loglevel', 'error', '-i', f] + (['-af', af] if af else []) + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(a, capture_output=True).stdout, dtype=np.float32)
mix = dec(F + '/out/mix.wav', 'highpass=f=1000,lowpass=f=8000'); stem = dec(F + '/out/sfx.wav'); ev = json.load(open(F + '/out/sfx-events.json'))['events']
db = lambda x: 10 * np.log10(max(float(x), 1e-12)); w = int(0.03 * SR); bad = 0; pk = {}
print('   at    id            stem peak  onset over bed')
for e in ev:
    i = int(e['at'] * SR); span = int((0.4 if e.get('loop') else 0.15) * SR); seg = mix[i:i + span + w]; pre = mix[max(0, i - int(0.2 * SR)):i]
    if len(seg) < w or len(pre) < w: continue
    c = np.cumsum(np.concatenate([[0], seg * seg])); on = ((c[w:] - c[:-w]) / w).max(); bed = float(np.mean(pre * pre))
    d = db(on) - db(bed); p = 20 * np.log10(max(float(np.abs(stem[i:i + int(min(e.get('dur', 0.6), 3) * SR)]).max()), 1e-9))
    kind = 'loop' if e.get('loop') else 'single'; pk.setdefault(kind, []).append(p); low = d < MIN; bad += low
    print('%7.2f  %-13s %6.1f dB   %5.1f dB%s' % (e['at'], e['id'], p, d, '   <-- under %g dB' % MIN if low else ''))
for k, v in pk.items(): print('%s effects: stem peak %.1f to %.1f dBFS' % (k, min(v), max(v)))
print('%d of %d events under %g dB' % (bad, len(ev), MIN) if bad else 'all %d events stand at least %g dB over the bed' % (len(ev), MIN)); sys.exit(1 if bad else 0)
