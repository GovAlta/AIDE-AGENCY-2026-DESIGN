#!/usr/bin/env python3
"""Outline the Agency 2026 wordmark to SVG paths (no font needed to display it). Reads brand/tokens/tokens.json and brand/fonts.
    python3 scripts/outline-wordmark.py      # -> brand/logos/agency-2026-wordmark-outlined.svg and -white-outlined.svg
Geometry matches scripts/lib/vectors.mjs wordmark(): Inter ExtraBold, tracking -0.01 em, 0.12 em gap, spectrum rule at 1.14 em."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
T = json.loads((ROOT / "brand/tokens/tokens.json").read_text())
font = TTFont(ROOT / "brand/fonts/Inter-ExtraBold.otf")
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm
SIZE = 96

def run(text, x0, fill, track=-0.01):
    pen = SVGPathPen(gs); x = x0; k = SIZE / upm
    for ch in text:
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (k, 0, 0, -k, x, SIZE * 0.86))
        gs[g].draw(tp); x += gs[g].width * k + track * SIZE
    return f'<path fill="{fill}" d="{pen.getCommands()}"/>', x

for name, dark in (("agency-2026-wordmark-outlined.svg", False), ("agency-2026-wordmark-white-outlined.svg", True)):
    ink = "#FFFFFF" if dark else T["color"]["navy"]; yr = T["textOnDark"]["maroon"] if dark else T["color"]["maroon"]
    a, x = run("Agency", 0, ink); b, x = run("2026", x + SIZE * 0.12, yr)
    W, H, y = round(x + 2), round(SIZE * 1.25), round(SIZE * 1.14, 2)
    stops = "".join(f'<stop offset="{i / (len(T["spectrum"]) - 1):.3f}" stop-color="{c}"/>' for i, c in enumerate(T["spectrum"]))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><title>Agency 2026</title>'
           f'<defs><linearGradient id="s" x1="0" x2="1">{stops}</linearGradient></defs>{a}{b}'
           f'<rect y="{y}" width="{W - 2}" height="{SIZE * 0.075}" fill="url(#s)"/></svg>\n')
    (ROOT / "brand/logos" / name).write_text(svg); print("brand/logos/" + name, W, H)
