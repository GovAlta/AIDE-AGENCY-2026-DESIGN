#!/usr/bin/env python3
"""Outline text to SVG path data in real units, so display production files carry no live text.
Reads a JSON list on stdin: [{"text": "Agency", "font": "inter-extrabold", "size": 4.2, "tracking": -0.01}, ...]
(size = em size in the drawing's unit, usually inches). Writes a JSON list: [{"d": "...", "width": w, "cap": cap height,
"ascent": a, "descent": d}] with the baseline at y = 0 and y growing downward (SVG convention).
    echo '[{"text":"Agency","font":"inter-extrabold","size":4}]' | python3 displays/lib/outline.py
"""
import json
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = {
    "inter-extrabold": ROOT / "brand/fonts/Inter-ExtraBold.otf",
    "inter-bold": ROOT / "brand/fonts/Inter-Bold.otf",
    "inter-semibold": ROOT / "brand/fonts/Inter-SemiBold.otf",
    "inter-medium": ROOT / "brand/fonts/Inter-Medium.otf",
    "liberation-bold": ROOT / "displays/fonts/LiberationSans-Bold.ttf",
    "liberation-regular": ROOT / "displays/fonts/LiberationSans-Regular.ttf",
}
_cache = {}


def font(key):
    if key not in _cache:
        f = TTFont(FONTS[key])
        os2 = f["OS/2"]
        _cache[key] = (f, f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm,
                       getattr(os2, "sCapHeight", 0) or int(f["head"].unitsPerEm * 0.72), os2.sTypoAscender, -os2.sTypoDescender,
                       f["hmtx"] if "hmtx" in f else None)
    return _cache[key]


def outline(text, key, size, tracking=0.0):
    f, gs, cmap, upm, cap, asc, desc, hmtx = font(key)
    k = size / upm
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.4f}".rstrip("0").rstrip("."))
    x = 0.0
    kern = {}
    for i, ch in enumerate(text):
        g = cmap.get(ord(ch)) or cmap.get(ord("?"))
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))
        x += gs[g].width * k + tracking * size
    width = x - tracking * size if text else 0.0
    return {"d": pen.getCommands(), "width": round(width, 4), "cap": round(cap * k, 4), "ascent": round(asc * k, 4), "descent": round(desc * k, 4)}


if __name__ == "__main__":
    req = json.load(sys.stdin)
    json.dump([outline(r["text"], r.get("font", "inter-extrabold"), float(r["size"]), float(r.get("tracking", 0))) for r in req], sys.stdout)
