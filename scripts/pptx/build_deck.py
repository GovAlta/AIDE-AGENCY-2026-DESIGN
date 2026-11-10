#!/usr/bin/env python3
"""Build an editable Agency 2026 PowerPoint (.pptx, 13.333 x 7.5 in) from the same deck JSON as templates/slides/deck.mjs.

    python3 scripts/pptx/build_deck.py samples/slides/agency-sample-deck.json out/slides/agency-sample-deck.pptx [--no-art]

Deck JSON fields: see the header of templates/slides/deck.mjs (one format for both). In short:
  {"name", "title", "footer", "classification", "numbers", "slides": [{"type", "ground", "accent", "label", "kicker", "title", "sub",
   "notes", ...type fields}]}; types: title chapter statement bullets stats big-number bars flow quote compare image agenda timeline end.

What is native and editable: every text box (font "Inter", mono "Geist Mono"), tiles, bars, flow steps, pins, rules, the band and the
classification pill. Pictures: the Agency wordmark and Alberta signature (brand/logos), circuit traces and the chapter sweep (rendered by
scripts/pptx/render_art.mjs with the same seeds as the HTML deck), QR codes, and image slides. Speaker notes come from "notes".
Fonts: install brand/fonts (Inter, Geist Mono) on every machine that opens the deck; PowerPoint does not embed OpenType fonts saved by
python-pptx. Headlines use Inter Bold (the HTML uses ExtraBold 800). Coordinates are the HTML slide's pixels: 1 px = 6350 EMU = 0.5 pt.
"""
import json, re, subprocess, sys
from pathlib import Path
from copy import deepcopy

from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

ROOT = Path(__file__).resolve().parents[2]
T = json.loads((ROOT / "brand/tokens/tokens.json").read_text())
C, ON_L, ON_D, G = T["color"], T["textOnLight"], T["textOnDark"], T["grounds"]
SPEC_NAMES = T["spectrumNames"]
FONT, MONO = "Inter", "Geist Mono"

px = lambda v: Emu(int(round(v * 6350)))
fs = lambda v: Pt(v / 2)                       # slide px -> pt


def rgb(c):
    c = c.strip()
    if c.startswith("#"):
        return RGBColor.from_string(c[1:7].upper()), 1.0
    m = [float(x) for x in re.findall(r"[\d.]+", c)]
    return RGBColor(int(m[0]), int(m[1]), int(m[2])), (m[3] if len(m) > 3 else 1.0)


def col(name, fallback="blue"):
    if name in C: return C[name]
    if name == "neutral-bar": return C["neutralBar"]
    if isinstance(name, str) and name.startswith("#"): return name
    return C[fallback]


def nth(i): return SPEC_NAMES[(i * 3) % len(SPEC_NAMES)]


def text_accent(name, dark):
    tab = ON_D if dark else ON_L
    return tab.get(name, col(name))


def set_alpha(fill_elm, alpha):
    if alpha >= 0.999: return
    clr = fill_elm.find(qn("a:srgbClr"))
    if clr is not None:
        a = etree.SubElement(clr, qn("a:alpha")); a.set("val", str(int(alpha * 100000)))


def fill_shape(shp, color):
    if color is None:
        shp.fill.background(); return
    c, a = rgb(color)
    shp.fill.solid(); shp.fill.fore_color.rgb = c
    set_alpha(shp.fill._xPr.find(qn("a:solidFill")), a)


def grad_fill(shp, colors, angle=0):
    """Multi-stop linear gradient (python-pptx only offers two stops)."""
    spPr = shp.fill._xPr
    for tag in ("a:solidFill", "a:gradFill", "a:noFill"):
        for e in spPr.findall(qn(tag)): spPr.remove(e)
    g = etree.Element(qn("a:gradFill")); g.set("rotWithShape", "1")
    lst = etree.SubElement(g, qn("a:gsLst"))
    for i, c in enumerate(colors):
        gs = etree.SubElement(lst, qn("a:gs")); gs.set("pos", str(int(i * 100000 / max(1, len(colors) - 1))))
        s = etree.SubElement(gs, qn("a:srgbClr")); s.set("val", c.lstrip("#").upper())
    lin = etree.SubElement(g, qn("a:lin")); lin.set("ang", str(int(angle * 60000))); lin.set("scaled", "0")
    # gradFill must come right after the geometry, before a:ln
    ln = spPr.find(qn("a:ln"))
    if ln is not None: ln.addprevious(g)
    else: spPr.append(g)


def no_line(shp): shp.line.fill.background()


def box(slide, x, y, w, h, fill=None, radius=0, line=None, line_w=0, shape=None):
    shp = slide.shapes.add_shape(shape or (MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE), px(x), px(y), px(w), px(h))
    if radius and shape is None:
        shp.adjustments[0] = min(0.5, radius / max(1, min(w, h)))
    fill_shape(shp, fill)
    if line:
        c, _ = rgb(line); shp.line.color.rgb = c; shp.line.width = px(line_w or 2)
    else:
        no_line(shp)
    shp.shadow.inherit = False
    return shp


MARK = re.compile(r"(\*\*.+?\*\*|==.+?==)")


def text(slide, x, y, w, h, s, size, color, bold=False, font=FONT, align="l", anchor="t", lh=1.1, hi=None, spacing=None, upper=False, wrap=True):
    """Text box; s takes **bold**, ==highlight== (colour hi) and \\n (new paragraph)."""
    tb = slide.shapes.add_textbox(px(x), px(y), px(w), px(h))
    tf = tb.text_frame; tf.word_wrap = wrap
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    s = str(s or "")
    if upper: s = s.upper()
    for k, para in enumerate(s.split("\n")):
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        p.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[align]
        p.line_spacing = lh
        for part in MARK.split(para):
            if not part: continue
            r = p.add_run()
            b, c = bold, color
            if part.startswith("**"): part, b = part[2:-2], True
            elif part.startswith("=="): part, c = part[2:-2], (hi or color)
            r.text = part
            f = r.font; f.size = fs(size); f.bold = b; f.name = font
            cc, _ = rgb(c); f.color.rgb = cc
            if spacing is not None:
                r._r.get_or_add_rPr().set("spc", str(int(spacing * 100)))
    return tb


class Deck:
    def __init__(self, d, art):
        self.d, self.art = d, art
        self.prs = Presentation()
        self.prs.slide_width, self.prs.slide_height = px(1920), px(1080)
        self.blank = self.prs.slide_layouts[6]
        self.n = len(d.get("slides", []))

    # ---- chrome shared by every slide (same geometry as styles/slides.css) ----
    def chrome(self, sl, s, i, ground):
        g = G[ground]; dark = g["dark"]
        bg = sl.background.fill
        if ground == "spectrum":
            b = box(sl, 0, 0, 1920, 1080, None); grad_fill(b, ["#6F2C83", "#B0306E", "#E86BA5"], angle=20)
        else:
            bg.solid(); bg.fore_color.rgb = rgb(g["bg"])[0]
        for a in self.art.get(i, []):
            sl.shapes.add_picture(a["png"], px(a["x"]), px(a["y"]), px(a["w"]), px(a["h"]))
        if not (s["type"] == "end" and s.get("host")):
            wm = ROOT / ("brand/logos/agency-2026-wordmark-white.png" if dark else "brand/logos/agency-2026-wordmark.png")
            sl.shapes.add_picture(str(wm), px(64), px(48), height=px(40))
            if s.get("label"):
                text(sl, 254, 56, 900, 24, s["label"], 15, g["soft"], font=MONO, spacing=2, upper=True)
        sig = ROOT / ("brand/logos/goa-signature-white.png" if dark else "brand/logos/goa-signature.png")
        sl.shapes.add_picture(str(sig), px(1920 - 64 - 163), px(47), height=px(46))
        box(sl, 0, 1016, 1920, 64, C["navy"])
        if self.d.get("footer"): text(sl, 64, 1016, 1100, 64, self.d["footer"], 17, "#C9D6E2", anchor="m")
        cls = (self.d.get("classification") or T["classification"]["default"]).upper()
        cw = 26 + len(cls) * 11
        if self.d.get("numbers", True):
            text(sl, 1920 - 64 - cw - 28 - 160, 1016, 160, 64, f"{i + 1:02d} / {self.n:02d}", 16, "#8FA9BF", font=MONO, align="r", anchor="m")
        pill = box(sl, 1920 - 64 - cw, 1016 + 16, cw, 32, None, radius=16, line="#8AA3BA", line_w=1.5)
        text(sl, 1920 - 64 - cw, 1016 + 16, cw, 32, cls, 14, "#FFFFFF", font=MONO, align="c", anchor="m", spacing=2)
        if s.get("notes"):
            sl.notes_slide.notes_text_frame.text = s["notes"]

    def head(self, sl, s, g, dark, acc, y=146, title_size=72, w=1500):
        ink, soft, hi = g["ink"], g["soft"], text_accent(acc, dark)
        if s.get("kicker"):
            text(sl, 120, y, 1400, 30, s["kicker"], 21, text_accent(s.get("accent", "purple"), dark), bold=True, font=MONO, spacing=4, upper=True); y += 44
        if s.get("title"):
            lines = self.lines(s["title"], title_size, w)
            text(sl, 120, y, w, lines * title_size * 1.08, s["title"], title_size, ink, bold=True, hi=hi, lh=1.0); y += lines * title_size * 1.08
        if s.get("sub"):
            y += 22; lines = self.lines(s["sub"], 32, 1250)
            text(sl, 120, y, 1250, lines * 44, s["sub"], 32, soft, lh=1.2); y += lines * 44
        return y

    @staticmethod
    def lines(s, size, w):
        n = 0
        for para in re.sub(r"\*\*|==", "", str(s)).split("\n"):
            n += max(1, -(-int(len(para) * size * 0.53) // int(w)))
        return n

    def source(self, sl, s, g):
        if s.get("source"):
            text(sl, 120, 960, 1600, 24, s["source"], 15, g["soft"], font=MONO)

    # ---- layouts ----
    def build(self):
        art = self.art
        for i, s in enumerate(self.d.get("slides", [])):
            ground = s.get("ground") or ("night" if s["type"] == "chapter" else "board")
            g = G[ground]; dark = g["dark"]
            acc = s.get("accent") or nth(i + 1)
            sl = self.prs.slides.add_slide(self.blank)
            self.chrome(sl, s, i, ground)
            getattr(self, "l_" + s["type"].replace("-", "_"))(sl, s, g, dark, acc)
        return self.prs

    def l_title(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc, y=262, title_size=84, w=1500)
        for k, (c, w) in enumerate(zip(["purple", "yellow", "cyan"], [520, 442, 364])):
            box(sl, 120, y + 30 + k * 11, w, 5, C[c], radius=2.5)

    def l_chapter(self, sl, s, g, dark, acc):
        n = s.get("number", "01")
        tb = text(sl, 140, 300, 560, 330, n, 300, C["pink"], bold=True, lh=0.9, anchor="m")
        for p in tb.text_frame.paragraphs:
            for r in p.runs:  # gradient numerals, like the HTML
                rPr = r._r.get_or_add_rPr()
                for e in rPr.findall(qn("a:solidFill")): rPr.remove(e)
                gf = etree.SubElement(rPr, qn("a:gradFill")); lst = etree.SubElement(gf, qn("a:gsLst"))
                for pos, c in ((0, C["purple"]), (55000, C["pink"]), (100000, C["orange"])):
                    gs = etree.SubElement(lst, qn("a:gs")); gs.set("pos", str(pos)); e = etree.SubElement(gs, qn("a:srgbClr")); e.set("val", c[1:])
                lin = etree.SubElement(gf, qn("a:lin")); lin.set("ang", "1200000"); lin.set("scaled", "0")
                rPr.insert(0, gf)
        text(sl, 770, 380, 1050, 100, s.get("title", ""), 84, "#FFFFFF", bold=True, lh=1.0)
        if s.get("sub"): text(sl, 770, 490, 1050, 90, s["sub"], 32, g["soft"], lh=1.2)

    def l_statement(self, sl, s, g, dark, acc):
        tsize = 100
        h = (44 if s.get("kicker") else 0) + self.lines(s.get("title", ""), tsize, 1560) * tsize * 1.06 + (22 + self.lines(s.get("sub", ""), 32, 1200) * 44 if s.get("sub") else 0)
        y0 = 146 + (870 - 146 - h) / 2
        box(sl, 120, 200, 8, 760, "#FFFFFF" if s.get("ground") == "spectrum" else col(acc), radius=4)
        y = y0
        if s.get("kicker"):
            text(sl, 216, y, 1400, 30, s["kicker"], 21, text_accent(acc, dark), bold=True, font=MONO, spacing=4, upper=True); y += 44
        n = self.lines(s.get("title", ""), tsize, 1560)
        text(sl, 216, y, 1560, n * tsize * 1.06, s.get("title", ""), tsize, g["ink"], bold=True, hi=text_accent(acc, dark), lh=1.0); y += n * tsize * 1.06
        if s.get("sub"):
            text(sl, 216, y + 22, 1200, 90, s["sub"], 32, "#FFFFFF" if s.get("ground") == "spectrum" else g["soft"], lh=1.2)

    def l_bullets(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc)
        items = [x if isinstance(x, dict) else {"text": x} for x in s.get("items", [])]
        hs = [52 + (40 if it.get("sub") else 0) for it in items]
        y = y + (960 - y - sum(hs) - 34 * (len(items) - 1)) / 2
        for j, it in enumerate(items):
            c = col(it.get("accent") or nth(j))
            box(sl, 120, y + 9, 34, 34, g["bg"], line=c, line_w=5, shape=MSO_SHAPE.OVAL)
            text(sl, 184, y, 1440, 56, it["text"], 44, g["ink"], bold=True, hi=text_accent(acc, dark))
            if it.get("sub"): text(sl, 184, y + 58, 1440, 40, it["sub"], 28, g["soft"])
            y += hs[j] + 34

    def l_stats(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc)
        items = s.get("items", []); n = max(1, len(items)); gap = 34; w = (1680 - 112 - gap * (n - 1)) / n
        y = y + (960 - y - 320) / 2
        for j, it in enumerate(items):
            x = 120 + j * (w + gap); c = col(it.get("accent") or nth(j))
            box(sl, x, y, w, 6, c)
            tb = text(sl, x, y + 30, w, 150, it.get("value", ""), 150, g["ink"], bold=True, lh=0.95, wrap=False)
            if it.get("unit"):
                r = tb.text_frame.paragraphs[0].add_run(); r.text = " " + it["unit"]; r.font.size = fs(68); r.font.bold = True; r.font.name = FONT; r.font.color.rgb = rgb(g["ink"])[0]
            text(sl, x, y + 196, w, 50, it.get("label", ""), 36, g["ink"], bold=True)
            if it.get("sub"): text(sl, x, y + 250, w, 70, it["sub"], 26, g["soft"], lh=1.2)
        self.source(sl, s, g)

    def l_big_number(self, sl, s, g, dark, acc):
        y = 230
        if s.get("kicker"):
            text(sl, 216, y, 1400, 30, s["kicker"], 21, text_accent(acc, dark), bold=True, font=MONO, spacing=4, upper=True); y += 44
        if s.get("before"):
            tb = text(sl, 216, y, 900, 80, s["before"], 64, g["soft"], bold=True)
            tb.text_frame.paragraphs[0].runs[0]._r.get_or_add_rPr().set("strike", "sngStrike")
            r = tb.text_frame.paragraphs[0].add_run(); r.text = "   BEFORE"; r.font.size = fs(18); r.font.name = MONO; r.font.color.rgb = rgb(g["soft"])[0]
            y += 90
        tb = text(sl, 206, y, 1500, 270, s.get("value", ""), 290, g["ink"], bold=True, lh=0.9, wrap=False)
        if s.get("unit"):
            r = tb.text_frame.paragraphs[0].add_run(); r.text = " " + s["unit"]; r.font.size = fs(145); r.font.bold = True; r.font.name = FONT; r.font.color.rgb = rgb(g["ink"])[0]
        y += 290
        b = box(sl, 216, y, 900, 6, None, radius=3); grad_fill(b, [col(acc), g["bg"]])
        text(sl, 216, y + 30, 1500, 60, s.get("label", ""), 46, g["ink"], bold=True)
        if s.get("sub"): text(sl, 216, y + 100, 1300, 50, s["sub"], 32, g["soft"])
        self.source(sl, s, g)

    def l_bars(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc)
        rows = s.get("rows", []); rh, gap = 48, 26
        y = y + (960 - y - (len(rows) * (rh + gap)) - 50) / 2
        if s.get("axis"): text(sl, 446, y, 800, 24, s["axis"], 15, g["soft"], font=MONO, spacing=3, upper=True)
        y += 50
        track = G[ "board" if not dark else "night"]["field"] if dark else C["track"]
        for r in rows:
            text(sl, 120, y, 300, rh, r.get("label", ""), 32, g["ink"], bold=True, align="r", anchor="m")
            box(sl, 446, y, 1100, rh, track, radius=8)
            v = max(0, min(100, float(r.get("value", 0))))
            if v > 0: box(sl, 446, y, 1100 * v / 100, rh, C["neutralBar"] if r.get("neutral") else col(r.get("accent") or acc), radius=8)
            text(sl, 1572, y, 230, rh, r.get("display", f"{r.get('value')}%"), 38, g["ink"], bold=True, anchor="m")
            y += rh + gap
        self.source(sl, s, g)

    def l_flow(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc)
        steps = s.get("steps", []); n = max(1, len(steps)); gap = 26; w = (1680 - 112 - gap * (n - 1)) / n; h = 300
        y = y + (960 - y - h) / 2
        for j, st in enumerate(steps):
            x = 120 + j * (w + gap); c = col(st.get("accent") or nth(j))
            box(sl, x, y, w, h, g["field"], radius=18)
            box(sl, x, y, w, 8, c)
            box(sl, x + 34, y + 36, 52, 52, c, shape=MSO_SHAPE.OVAL)
            text(sl, x + 34, y + 36, 52, 52, str(j + 1), 26, "#FFFFFF", bold=True, align="c", anchor="m")
            text(sl, x + 34, y + 110, w - 68, 96, st.get("title", ""), 40, g["ink"], bold=True, lh=1.0)
            text(sl, x + 34, y + 110 + self.lines(st.get("title", ""), 40, w - 68) * 46 + 10, w - 68, 120, st.get("text", ""), 28, g["soft"], lh=1.2)
        self.source(sl, s, g)

    def l_quote(self, sl, s, g, dark, acc):
        c = col(acc); y = 250
        text(sl, 176, y - 40, 300, 200, "“", 220, c, bold=True, lh=0.8)
        y += 110; n = self.lines(s.get("text", ""), 70, 1500)
        text(sl, 176, y, 1500, n * 84, s.get("text", ""), 70, g["ink"], bold=True, hi=text_accent(acc, dark), lh=1.08); y += n * 84 + 44
        if s.get("who"):
            box(sl, 176, y + 20, 90, 4, c); text(sl, 286, y, 1200, 44, s["who"], 32, g["ink"], bold=True, anchor="m")
        if s.get("role"): text(sl, 286, y + 54, 1300, 30, s["role"], 18, g["soft"], font=MONO, spacing=3, upper=True)

    def l_compare(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc)
        L, R = s.get("left", {}), s.get("right", {})
        rows = max(len(L.get("items", [])), len(R.get("items", [])))
        y = y + (960 - y - (80 + rows * 104)) / 2
        w = (1680 - 112 - 110) / 2
        for k, (c_, a) in enumerate(((L, C["neutralBar"]), (R, col(R.get("accent") or acc)))):
            x = 120 + k * (w + 110)
            text(sl, x, y, w, 56, c_.get("title", ""), 42, g["ink"], bold=True)
            box(sl, x, y + 62, w, 5, a)
            yy = y + 90
            for it in c_.get("items", []):
                box(sl, x, yy, w, 88, g["field"], radius=14); box(sl, x, yy, 6, 88, a)
                text(sl, x + 30, yy, w - 50, 88, it, 33, g["ink"], anchor="m"); yy += 104
        box(sl, 120 + w + 17, y + 90 + rows * 52 - 38, 76, 76, g["bg"], radius=16, line="#C5CED8", line_w=3)
        text(sl, 120 + w + 17, y + 90 + rows * 52 - 38, 76, 76, "vs", 28, g["ink"], bold=True, align="c", anchor="m")

    def l_image(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc) + 40
        fw = (1680 - 112 - 56) * 1.55 / 2.55; fh = 940 - y
        src = s.get("src", "")
        p = ROOT / src
        if src and p.exists():
            from PIL import Image
            iw, ih = Image.open(p).size
            k = max(fw / iw, fh / ih); cw, ch = fw / k, fh / k   # cover crop
            pic = sl.shapes.add_picture(str(p), px(120), px(y), px(fw), px(fh))
            pic.crop_left = pic.crop_right = (1 - cw / iw) / 2; pic.crop_top = pic.crop_bottom = (1 - ch / ih) / 2
        else:
            box(sl, 120, y, fw, fh, g["field"], radius=18)
        text(sl, 120 + fw + 56, y, 1680 - 112 - fw - 56, fh, s.get("caption", ""), 34, g["soft"], anchor="m", lh=1.25)

    def l_agenda(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc)
        items = s.get("items", []); rh = 140
        y = y + (960 - y - len(items) * rh) / 2
        line = "#D5DCE3" if not dark else "#2A4A66"
        box(sl, 120, y, 1600, 2, line)
        for j, it in enumerate(items):
            a = it.get("accent") or nth(j)
            box(sl, 120, y + rh / 2 - 11, 22, 22, col(a), radius=6)
            text(sl, 158, y, 380, rh, it.get("when", ""), 28, text_accent(a, dark), bold=True, anchor="m")
            t = it.get("title", "") + ("\n" + it["sub"] if it.get("sub") else "")
            tb = text(sl, 550, y, 780, rh, it.get("title", ""), 44, g["ink"], bold=True, anchor="m", lh=1.05)
            if it.get("sub"):
                p = tb.text_frame.add_paragraph(); r = p.add_run(); r.text = it["sub"]; r.font.size = fs(24); r.font.name = FONT; r.font.color.rgb = rgb(g["soft"])[0]
            text(sl, 1320, y, 400, rh, it.get("place", ""), 27, g["soft"], align="r", anchor="m")
            y += rh; box(sl, 120, y, 1600, 2, line)

    def l_timeline(self, sl, s, g, dark, acc):
        y = self.head(sl, s, g, dark, acc)
        items = s.get("items", []); n = max(1, len(items)); w = (1680 - 112) / n
        y = y + (960 - y - 260) / 2
        b = box(sl, 120, y + 13, 1568, 5, None, radius=2.5); grad_fill(b, T["spectrum"])
        for j, it in enumerate(items):
            x = 120 + j * w; a = it.get("accent") or nth(j); c = col(a)
            box(sl, x, y, 32, 32, c if it.get("now") else g["bg"], line=c, line_w=6, shape=MSO_SHAPE.OVAL)
            text(sl, x, y + 62, w - 24, 30, it.get("when", ""), 24, text_accent(a, dark), bold=True, font=MONO, spacing=2)
            text(sl, x, y + 98, w - 24, 90, it.get("title", ""), 38, g["ink"], bold=True, lh=1.0)
            if it.get("text"): text(sl, x, y + 98 + self.lines(it.get("title", ""), 38, w - 24) * 42 + 8, w - 24, 80, it["text"], 27, g["soft"], lh=1.15)

    def l_end(self, sl, s, g, dark, acc):
        if s.get("host"):
            text(sl, 64, 44, 700, 20, "Hosted by", 13, g["soft"], font=MONO, spacing=3, upper=True)
            text(sl, 64, 64, 900, 30, s["host"], 18, g["ink"], bold=True)
        y = 300 - (60 if s.get("url") else 0)
        n = self.lines(s.get("title", ""), 112, 1500)
        text(sl, 210, y, 1500, n * 116, s.get("title", ""), 112, g["ink"], bold=True, align="c", lh=1.0); y += n * 116 + 26
        if s.get("date") or s.get("place"):
            tb = text(sl, 210, y, 1500, 54, s.get("date", ""), 40, text_accent("maroon", dark), bold=True, align="c")
            if s.get("place"):
                r = tb.text_frame.paragraphs[0].add_run(); r.text = "  " + s["place"]; r.font.size = fs(40); r.font.bold = True; r.font.name = FONT; r.font.color.rgb = rgb(g["ink"])[0]
            y += 80
        if s.get("cta"):
            w = 80 + len(s["cta"]) * 17
            box(sl, 960 - w / 2, y, w, 72, col(acc), radius=36)
            text(sl, 960 - w / 2, y, w, 72, s["cta"], 32, "#FFFFFF", bold=True, align="c", anchor="m"); y += 112
        if s.get("url") and self.qr.get(s["url"]):
            sl.shapes.add_picture(self.qr[s["url"]], px(760), px(y), px(170), px(170))
            text(sl, 956, y, 600, 170, re.sub(r"^https?://", "", s["url"]), 24, text_accent(acc, dark), font=MONO, anchor="m")


def main(argv):
    if len(argv) < 2 or argv[0] in ("-h", "--help"):
        print(__doc__); return 0
    src, out = Path(argv[0]), Path(argv[1])
    d = json.loads(src.read_text(encoding="utf-8"))
    out.parent.mkdir(parents=True, exist_ok=True)
    cache = out.parent / f".art-{d.get('name', src.stem)}"
    art = {}
    if "--no-art" not in argv:
        subprocess.run(["node", str(ROOT / "scripts/pptx/render_art.mjs"), str(src), str(cache)], check=True, cwd=ROOT)
        for a in json.loads((cache / "art.json").read_text()):
            art.setdefault(a["index"], []).append(a)
    # QR codes as PNG through the repo's QR script (same look as the HTML deck)
    qr = {}
    for i, s in enumerate(d.get("slides", [])):
        if s.get("url"):
            f = cache / f"qr-{i + 1:02d}.svg"
            subprocess.run(["node", str(ROOT / "scripts/qr.mjs"), s["url"], "--out", str(f), "--png", "--style", "rounded", "--accent", s.get("accent", "blue"), "--size", "680"], check=True, cwd=ROOT, stdout=subprocess.DEVNULL)
            qr[s["url"]] = str(f.with_suffix(".png"))
    deck = Deck(d, art); deck.qr = qr
    prs = deck.build()
    prs.core_properties.title = d.get("title", d.get("name", ""))
    prs.core_properties.subject = "Agency 2026"
    prs.save(out)
    print(f"{out}  ({len(d.get('slides', []))} slides)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
