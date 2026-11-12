# International subsea cables by country, from the planner's TeleGeography layers.
# A cable "lands" in a country when an end of one of its line parts lies within R km of that country's landing point.
# International = lands in two or more countries. Prints counts per country for several R, plus spot checks.
import json, math, sys
from collections import defaultdict, Counter
D = sys.argv[1]
lp = json.load(open(f'{D}/landing_points.overview.geojson'))['features']
cab = json.load(open(f'{D}/subsea_cables.overview.geojson'))['features']
country = lambda n: n.rsplit(',', 1)[-1].strip()
pts = [(f['geometry']['coordinates'][0], f['geometry']['coordinates'][1], country(f['properties']['name'])) for f in lp]
grid = defaultdict(list)
for p in pts: grid[(math.floor(p[0]), math.floor(p[1]))].append(p)
def km(a, b, c, d):
    t = math.pi / 180; return 12742 * math.asin(math.sqrt(math.sin((d - b) * t / 2) ** 2 + math.cos(b * t) * math.cos(d * t) * math.sin((c - a) * t / 2) ** 2))
def lands(f, R):
    g = f['geometry']; parts = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
    s = set()
    for part in parts:
        for x, y in (part[0], part[-1]):
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for p in grid.get((math.floor(x) + dx, math.floor(y) + dy), []):
                        if km(x, y, p[0], p[1]) <= R: s.add(p[2])
    return s
WATCH = ['Canada', 'United States', 'United Kingdom', 'Ireland', 'France', 'Spain', 'Portugal', 'Germany', 'Netherlands', 'Denmark', 'Norway', 'Iceland',
         'Japan', 'China', 'Taiwan', 'South Korea', 'Hong Kong', 'Singapore', 'Philippines', 'Indonesia', 'India', 'Australia']
res = {}
for R in (5, 15, 30):
    L = {f['properties']['name']: lands(f, R) for f in cab}
    intl = Counter(); anyc = Counter()
    for n, s in L.items():
        for c in s: anyc[c] += 1
        if len(s) >= 2:
            for c in s: intl[c] += 1
    res[R] = (intl, anyc, L)
print('Cables in file:', len(cab))
print(f"{'country':16s}" + ''.join(f'  intl@{R}km  all@{R}km' for R in res))
for c in WATCH: print(f'{c:16s}' + ''.join(f'  {res[R][0][c]:9d}  {res[R][1][c]:8d}' for R in res))
L = res[15][2]
print('\nSpot checks at 15 km (public landing lists in brackets):')
for n, known in [('EXA Express', 'Canada, Ireland, UK'), ('Topaz', 'Canada, Japan'), ('Grace Hopper', 'US, UK, Spain'), ('MAREA', 'US, Spain'), ('Greenland Connect', 'Canada, Greenland, Iceland'), ('Crosslake Fibre', 'Canada, US'), ('Dunant', 'US, France')]:
    print(f'  {n:20s} -> {sorted(L.get(n, {"(not in file)"}))}   [{known}]')
print('\nInternational cables landing in Canada @15 km:', sorted(n for n, s in L.items() if 'Canada' in s and len(s) >= 2))
