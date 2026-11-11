#!/usr/bin/env python3
"""Outline the Agency 2026 wordmark to SVG paths (no font needed to display it). Reads brand/tokens/tokens.json and brand/fonts.
    python3 scripts/outline-wordmark.py      # -> brand/logos/agency-2026-wordmark-outlined.svg and -white-outlined.svg
Geometry matches scripts/lib/vectors.mjs wordmark(): Inter ExtraBold, tracking -0.01 em, 0.12 em gap, trace underline at 1.1 em (UNDERLINE in vectors.mjs)."""
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

U = dict(y=0.06, stroke=0.045, jog=0.16, tail=0.16, pad=0.07, padStroke=0.04)   # = UNDERLINE in scripts/lib/vectors.mjs (x font size)

def underline(w, top, colour):
    """the trace underline: a thin trace under the word, a 45-degree step and a hollow ring pad (owner 2026-11-11: no rainbow rule)"""
    s = SIZE; y0 = top + U["y"] * s; jx = w - (U["jog"] + U["tail"] + 2 * U["pad"]) * s; y1 = y0 + U["jog"] * s; x2 = w - 2 * U["pad"] * s
    return (f'<g fill="none" stroke="{colour}" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M0 {y0:.2f} H{jx:.2f} L{jx + U["jog"] * s:.2f} {y1:.2f} H{x2:.2f}" stroke-width="{U["stroke"] * s:.2f}"/>'
            f'<circle cx="{w - U["pad"] * s:.2f}" cy="{y1:.2f}" r="{(U["pad"] - U["padStroke"] / 2) * s:.2f}" stroke-width="{U["padStroke"] * s:.2f}"/></g>')

VARIANTS = (("agency-2026-wordmark-outlined.svg", False, True), ("agency-2026-wordmark-white-outlined.svg", True, True),
            ("agency-wordmark-outlined.svg", False, False), ("agency-wordmark-white-outlined.svg", True, False))   # "Agency" alone: no year
for name, dark, with_year in VARIANTS:
    ink = "#FFFFFF" if dark else T["color"]["navy"]; yr = T["textOnDark"]["maroon"] if dark else T["color"]["maroon"]
    trace = T["textOnDark"]["blue"] if dark else T["color"]["blue"]
    a, x = run("Agency", 0, ink)
    b = ""
    if with_year:
        b, x = run("2026", x + SIZE * 0.12, yr)
    W, H = round(x + 2), round(SIZE * 1.45)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><title>{"Agency 2026" if with_year else "Agency"}</title>'
           f'{a}{b}{underline(W - 2, SIZE * 1.1, trace)}</svg>\n')
    (ROOT / "brand/logos" / name).write_text(svg); print("brand/logos/" + name, W, H)
