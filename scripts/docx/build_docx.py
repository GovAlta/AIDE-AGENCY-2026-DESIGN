#!/usr/bin/env python3
"""Agency 2026 Word documents from content JSON: briefing note, memo, speaker brief, event report.

    python3 scripts/docx/build_docx.py samples/office/briefing-note.json out/office/briefing-note.docx [--palette compliant|mvai] [--pdf]
    python3 scripts/docx/build_docx.py --templates       # writes the blank .dotx templates to templates/office/
    python3 scripts/docx/build_docx.py --all [--pdf]     # every samples/office/*.json -> out/office/

Content JSON:
{ "doc": "briefing-note" | "memo" | "speaker-brief" | "report",
  "classification": "UNCLASSIFIED",              # header pill and footer band; from the content owner, never inferred
  "kicker": "Agency 2026 · Briefing note",        # small caps line above the title (optional; each doc type has a default)
  "title": "Subject or document title",
  "meta": [["To", "..."], ["From", "..."], ["Date", "..."]],   # the label/value block under the title
  "sections": [ { "heading": "Purpose", "blocks": [ block, ... ] } ],
  "contact": "Name, title, phone or email"          # closing contact line (briefing note, memo)
}
Blocks: {"p": "text with **bold**"} {"bullets": [...]} {"numbers": [...]} {"h3": "..."} {"callout": "..."} {"note": "..."}
        {"table": {"head": [...], "rows": [[...]], "widths": [inches...]}} {"figures": [{"value": "40", "label": "working demos"}]}
Palette: the owner has not chosen between the MVAI set (Inter, tokens.color) and the event team's compliant set (Arial, tokens.compliant).
Office files default to --palette compliant (Arial is on every Office install). Colours and fonts come only from brand/tokens/tokens.json.
"""
import io, json, re, subprocess, sys, zipfile
from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Inches, RGBColor, Emu
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
T = json.loads((ROOT / "brand/tokens/tokens.json").read_text())

def palette(name):
    if name == "mvai":
        c = T["color"]
        return dict(font=T["font"]["display"], mono=T["font"]["mono"], navy=c["navy"], red=c["maroon"], blue=c["blue"], mute=c["mute"], body=c["body"],
                    rule="#D0D1DB", ground=c["field"], spectrum=T["spectrum"], accents=[c["blue"], c["purple"], c["orange"], c["green"]])
    c = T["compliant"]["color"]
    return dict(font=T["compliant"]["font"], mono="Consolas", navy=c["navy"], red=c["red"], blue=c["blue"], mute="#4F6274", body="#22384C",
                rule=c["rule"], ground=c["ground"], spectrum=[c["plum"], c["blue"], c["cyan"], c["pink"], c["orange"], c["yellow"], c["green"]],
                accents=[c["blue"], c["plum"], c["orange"], c["green"]])

rgb = lambda h: RGBColor.from_string(h.lstrip("#").upper()[:6])
DEFAULT_KICKER = {"briefing-note": "Agency 2026 · Briefing note", "memo": "Agency 2026 · Memo", "speaker-brief": "Agency 2026 · Speaker brief", "report": "Agency 2026 · Report"}

def spectrum_png(P, w=1800, h=10):
    """the spectrum rule as a PNG (Word has no gradient rules); colours from the palette"""
    im = Image.new("RGB", (w, h)); d = ImageDraw.Draw(im); cs = [tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in P["spectrum"]]
    for x in range(w):
        u = x / (w - 1) * (len(cs) - 1); i = min(int(u), len(cs) - 2); f = u - i
        d.line([(x, 0), (x, h)], fill=tuple(round(cs[i][k] + (cs[i + 1][k] - cs[i][k]) * f) for k in range(3)))
    b = io.BytesIO(); im.save(b, "PNG"); b.seek(0); return b

def trace_png(P, w=1800):
    """the trace underline under the Agency mark (owner 2026-11-11: replaces the rainbow rule): a thin line, a 45-degree step and a ring
    pad, in one colour; geometry = UNDERLINE in scripts/lib/vectors.mjs, for an "Agency 2026" mark 6.47 font-sizes wide. Drawn 4x and
    scaled down for smooth edges."""
    k = 4; S = w / 6.47; W, H = w * k, round(S * 0.34) * k; s = S * k
    im = Image.new("RGBA", (W, H), (255, 255, 255, 0)); d = ImageDraw.Draw(im)
    col = tuple(int(P["blue"][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    sw = round(0.045 * s); y0 = 0.06 * s; jx = W - (0.16 + 0.16 + 0.14) * s; y1 = y0 + 0.16 * s; x2 = W - 0.14 * s
    d.line([(0, y0), (jx, y0), (jx + 0.16 * s, y1), (x2, y1)], fill=col, width=sw, joint="curve")
    r = 0.07 * s - 0.02 * s; cx = W - 0.07 * s
    d.ellipse([cx - r, y1 - r, cx + r, y1 + r], outline=col, width=round(0.04 * s))
    im = im.resize((w, H // k), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "PNG"); b.seek(0); return b, H / k / w

def shade(cell, hexcol):
    tcPr = cell._tc.get_or_add_tcPr(); s = OxmlElement("w:shd"); s.set(qn("w:val"), "clear"); s.set(qn("w:color"), "auto"); s.set(qn("w:fill"), hexcol.lstrip("#")); tcPr.append(s)

def borders(table, color="D0D1DB", inside=True, size=4):
    tblPr = table._tbl.tblPr; b = OxmlElement("w:tblBorders")
    for e in ("top", "left", "bottom", "right") + (("insideH", "insideV") if inside else ()):
        el = OxmlElement(f"w:{e}"); el.set(qn("w:val"), "single" if e in ("top", "bottom", "insideH") else "nil"); el.set(qn("w:sz"), str(size)); el.set(qn("w:color"), color); b.append(el)
    tblPr.append(b)

def no_borders(table):
    tblPr = table._tbl.tblPr; b = OxmlElement("w:tblBorders")
    for e in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{e}"); el.set(qn("w:val"), "nil"); b.append(el)
    tblPr.append(b)

def cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr(); m = OxmlElement("w:tcMar")
    for k, v in (("top", top), ("bottom", bottom), ("start", left), ("end", right)):
        e = OxmlElement(f"w:{k}"); e.set(qn("w:w"), str(v)); e.set(qn("w:type"), "dxa"); m.append(e)
    tcPr.append(m)

def para_rule(p, color, size=12, space=4):
    pPr = p._p.get_or_add_pPr(); bdr = OxmlElement("w:pBdr"); b = OxmlElement("w:bottom")
    b.set(qn("w:val"), "single"); b.set(qn("w:sz"), str(size)); b.set(qn("w:space"), str(space)); b.set(qn("w:color"), color.lstrip("#")); bdr.append(b); pPr.append(bdr)

def runs(p, text, P, size=None, color=None, bold=None):
    """inline marks: **bold**; == == highlight in blue"""
    for part in re.split(r"(\*\*.+?\*\*|==.+?==)", str(text)):
        if not part: continue
        r = p.add_run(part.strip("*=") if part[:2] in ("**", "==") else part)
        if part.startswith("**"): r.bold = True
        if part.startswith("=="): r.font.color.rgb = rgb(P["blue"]); r.bold = True
        if size: r.font.size = Pt(size)
        if color and not part.startswith("=="): r.font.color.rgb = rgb(color)
        if bold is not None and not part.startswith("**"): r.bold = bold
    return p

def styles(doc, P):
    st = doc.styles
    def set_font(s, size, color=None, bold=False, name=None):
        s.font.name = name or P["font"]; s.font.size = Pt(size); s.font.bold = bold
        if color: s.font.color.rgb = rgb(color)
        rpr = s.element.get_or_add_rPr(); rf = rpr.find(qn("w:rFonts"))
        if rf is None: rf = OxmlElement("w:rFonts"); rpr.append(rf)
        for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"): rf.set(qn(a), name or P["font"])
        for a in ("w:asciiTheme", "w:hAnsiTheme", "w:cstheme", "w:eastAsiaTheme"):
            if rf.get(qn(a)) is not None: del rf.attrib[qn(a)]
    n = st["Normal"]; set_font(n, 10.5, P["body"]); n.paragraph_format.space_after = Pt(6); n.paragraph_format.line_spacing = 1.2
    for name, size, col, sb, sa in (("Title", 26, P["navy"], 0, 4), ("Heading 1", 14, P["navy"], 11, 3), ("Heading 2", 12, P["navy"], 10, 3), ("Heading 3", 10.5, P["navy"], 8, 2)):
        s = st[name]; set_font(s, size, col, True); s.paragraph_format.space_before = Pt(sb); s.paragraph_format.space_after = Pt(sa); s.paragraph_format.keep_with_next = True
        s.element.get_or_add_pPr()  # keep Word's outline level for navigation and accessibility (heading structure is read by screen readers)
    st["Title"].paragraph_format.line_spacing = 1.0
    for name, base in (("Kicker", "Normal"), ("Caption Agency", "Normal"), ("Callout", "Normal"), ("Note", "Normal"), ("Meta", "Normal")):
        s = st.add_style(name, 1) if name not in [x.name for x in st] else st[name]; s.base_style = st[base]
    set_font(st["Kicker"], 8.5, P["blue"], True); st["Kicker"].font.all_caps = True; st["Kicker"].paragraph_format.space_after = Pt(2)
    rpr = st["Kicker"].element.get_or_add_rPr(); sp = OxmlElement("w:spacing"); sp.set(qn("w:val"), "30"); rpr.append(sp)
    set_font(st["Caption Agency"], 8.5, P["mute"]); set_font(st["Note"], 8.5, P["mute"]); set_font(st["Meta"], 10, P["body"]); st["Meta"].paragraph_format.space_after = Pt(0)
    set_font(st["Callout"], 11, P["navy"], True)
    for nm in ("List Bullet", "List Number"): set_font(st[nm], 10.5, P["body"]); st[nm].paragraph_format.space_after = Pt(3)

def header_footer(doc, P, cls):
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    sec.left_margin = sec.right_margin = Inches(0.85); sec.top_margin = Inches(1.05); sec.bottom_margin = Inches(0.95)
    sec.header_distance = Inches(0.4); sec.footer_distance = Inches(0.35)
    hd = sec.header; hd.is_linked_to_previous = False
    t = hd.add_table(1, 3, Inches(6.8)); no_borders(t); t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c0, c1, c2 = t.rows[0].cells; set_widths(t, [2.6, 2.2, 2.0])
    p = c0.paragraphs[0]; r = p.add_run("Agency"); r.bold = True; r.font.size = Pt(14); r.font.color.rgb = rgb(P["navy"]); r.font.name = P["font"]
    r = p.add_run(" 2026"); r.bold = True; r.font.size = Pt(14); r.font.color.rgb = rgb(P["red"]); r.font.name = P["font"]
    p2 = c0.add_paragraph(); p2.paragraph_format.space_after = Pt(0); png, ratio = trace_png(P); p2.add_run().add_picture(png, width=Inches(1.35), height=Inches(1.35 * ratio))
    pc = c1.paragraphs[0]; pc.alignment = WD_ALIGN_PARAGRAPH.CENTER; r = pc.add_run(cls.upper()); r.font.size = Pt(7.5); r.bold = True; r.font.color.rgb = rgb(P["mute"]); r.font.name = P["font"]
    pr = c2.paragraphs[0]; pr.alignment = WD_ALIGN_PARAGRAPH.RIGHT; pr.add_run().add_picture(str(ROOT / "brand/logos/goa-signature.png"), height=Inches(0.36))
    hd.paragraphs[0].paragraph_format.space_after = Pt(0)
    # footer band: navy table row with the footer line, page number and classification
    ft = sec.footer; ft.is_linked_to_previous = False
    tb = ft.add_table(1, 2, Inches(6.8)); no_borders(tb)
    a, b = tb.rows[0].cells; set_widths(tb, [4.9, 1.9])
    for c in (a, b): shade(c, P["navy"]); cell_margins(c, 90, 90, 140, 140)
    pa = a.paragraphs[0]; r = pa.add_run("Agency 2026 · " + T["event"]["dates"] + " · " + T["event"]["cities"] + "   ·   Page "); r.font.size = Pt(7.5); r.font.color.rgb = rgb("#FFFFFF"); r.font.name = P["font"]
    fld = OxmlElement("w:fldSimple"); fld.set(qn("w:instr"), "PAGE"); rr = OxmlElement("w:r"); rp = OxmlElement("w:rPr")
    col = OxmlElement("w:color"); col.set(qn("w:val"), "FFFFFF"); sz = OxmlElement("w:sz"); sz.set(qn("w:val"), "15"); rp.append(col); rp.append(sz); rr.append(rp)
    tx = OxmlElement("w:t"); tx.text = "1"; rr.append(tx); fld.append(rr); pa._p.append(fld)
    pb = b.paragraphs[0]; pb.alignment = WD_ALIGN_PARAGRAPH.RIGHT; r = pb.add_run(cls.upper()); r.bold = True; r.font.size = Pt(7.5); r.font.color.rgb = rgb("#FFFFFF"); r.font.name = P["font"]
    ft.paragraphs[0].paragraph_format.space_after = Pt(0)

def set_widths(t, widths):
    """column widths that Word and LibreOffice both honour: fixed layout, the grid and every cell"""
    t.autofit = False
    tblPr = t._tbl.tblPr; lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
    grid = t._tbl.tblGrid
    for j, gc in enumerate(grid.findall(qn("w:gridCol"))):
        if j < len(widths): gc.set(qn("w:w"), str(int(widths[j] * 1440)))
    for row in t.rows:
        for j, w in enumerate(widths):
            if j < len(row.cells): row.cells[j].width = Inches(w)

def meta_block(doc, P, rows):
    t = doc.add_table(len(rows), 2); borders(t, P["rule"].lstrip("#"), inside=True)
    for i, (k, v) in enumerate(rows):
        a, b = t.rows[i].cells; a.width, b.width = Inches(1.3), Inches(5.5)
        pa = a.paragraphs[0]; pa.style = doc.styles["Meta"]; runs(pa, k, P, color=P["navy"], bold=True)
        pb = b.paragraphs[0]; pb.style = doc.styles["Meta"]; runs(pb, v, P)
        for c in (a, b): cell_margins(c, 40, 40, 60, 60)
    set_widths(t, [1.3, 5.5]); gap(doc, 4)

def table(doc, P, spec):
    head, rows = spec["head"], spec["rows"]; t = doc.add_table(len(rows) + 1, len(head)); borders(t, P["rule"].lstrip("#"))
    widths = spec.get("widths")
    for j, h in enumerate(head):
        c = t.rows[0].cells[j]; shade(c, P["navy"]); cell_margins(c)
        p = c.paragraphs[0]; r = p.add_run(h); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = rgb("#FFFFFF")
    # header row repeats on each page (accessibility and long tables)
    trPr = t.rows[0]._tr.get_or_add_trPr(); th = OxmlElement("w:tblHeader"); th.set(qn("w:val"), "true"); trPr.append(th)
    for i, row in enumerate(rows):
        for j, v in enumerate(row):
            c = t.rows[i + 1].cells[j]; cell_margins(c)
            if i % 2: shade(c, P["ground"])
            p = c.paragraphs[0]; runs(p, v, P, size=9.5); p.paragraph_format.space_after = Pt(0)
    set_widths(t, widths or [6.8 / len(head)] * len(head))
    if spec.get("caption"):
        cp = doc.add_paragraph(style="Caption Agency"); runs(cp, spec["caption"], P); cp.paragraph_format.space_before = Pt(3)
    else:
        gap(doc)

def figures(doc, P, items):
    t = doc.add_table(1, len(items)); no_borders(t)
    for j, f in enumerate(items):
        c = t.rows[0].cells[j]; shade(c, P["ground"]); cell_margins(c, 120, 120, 140, 140)
        tcPr = c._tc.get_or_add_tcPr(); bd = OxmlElement("w:tcBorders"); tp = OxmlElement("w:top")
        tp.set(qn("w:val"), "single"); tp.set(qn("w:sz"), "24"); tp.set(qn("w:color"), (f.get("color") or P["accents"][j % 4]).lstrip("#")); bd.append(tp); tcPr.append(bd)
        p = c.paragraphs[0]; r = p.add_run(f["value"]); r.bold = True; r.font.size = Pt(22); r.font.color.rgb = rgb(P["navy"]); p.paragraph_format.space_after = Pt(0)
        p2 = c.add_paragraph(); runs(p2, f["label"], P, size=9); p2.paragraph_format.space_after = Pt(0)
    set_widths(t, [6.8 / len(items)] * len(items)); gap(doc)

def callout(doc, P, text):
    t = doc.add_table(1, 1); no_borders(t); c = t.rows[0].cells[0]; shade(c, P["ground"]); cell_margins(c, 140, 140, 200, 200)
    tcPr = c._tc.get_or_add_tcPr(); bd = OxmlElement("w:tcBorders"); l = OxmlElement("w:left"); l.set(qn("w:val"), "single"); l.set(qn("w:sz"), "36"); l.set(qn("w:color"), P["blue"].lstrip("#")); bd.append(l); tcPr.append(bd)
    p = c.paragraphs[0]; p.style = doc.styles["Callout"]; runs(p, text, P); p.paragraph_format.space_after = Pt(0)
    set_widths(t, [6.8]); gap(doc)

def gap(doc, pts=2):
    """a small spacer paragraph after a table (Word needs a paragraph between consecutive tables)"""
    g = doc.add_paragraph(); g.paragraph_format.space_after = Pt(0); g.paragraph_format.space_before = Pt(0)
    g.paragraph_format.line_spacing = Pt(pts + 2)

def block(doc, P, b):
    if "p" in b: runs(doc.add_paragraph(), b["p"], P)
    elif "h3" in b: doc.add_paragraph(b["h3"], style="Heading 3")
    elif "bullets" in b:
        for x in b["bullets"]: runs(doc.add_paragraph(style="List Bullet"), x, P)
    elif "numbers" in b:
        for x in b["numbers"]: runs(doc.add_paragraph(style="List Number"), x, P)
    elif "table" in b: table(doc, P, b["table"])
    elif "figures" in b: figures(doc, P, b["figures"])
    elif "callout" in b: callout(doc, P, b["callout"])
    elif "note" in b: runs(doc.add_paragraph(style="Note"), b["note"], P)
    else: raise SystemExit(f"unknown block: {list(b)}")

def build(d, out, pal="compliant"):
    P = palette(d.get("palette", pal)); doc = Document(); styles(doc, P)
    cls = d.get("classification", T["classification"]["default"]); header_footer(doc, P, cls)
    cp = doc.core_properties; cp.title = d.get("title", ""); cp.subject = d.get("doc", ""); cp.author = d.get("author", "Agency 2026"); cp.keywords = cls; cp.language = d.get("lang", "en-CA")
    doc.add_paragraph(d.get("kicker", DEFAULT_KICKER.get(d.get("doc"), "Agency 2026")), style="Kicker")
    tp = doc.add_paragraph(d.get("title", ""), style="Title"); para_rule(tp, P["blue"], 12, 6)
    if d.get("subtitle"): runs(doc.add_paragraph(), d["subtitle"], P, size=12, color=P["navy"])
    if d.get("meta"): meta_block(doc, P, d["meta"])
    for s in d.get("sections", []):
        if s.get("heading"): doc.add_paragraph(s["heading"], style="Heading 1")
        for b in s.get("blocks", []): block(doc, P, b)
        if s.get("pagebreak"): doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
    if d.get("contact"):
        doc.add_paragraph("Contact", style="Heading 2"); runs(doc.add_paragraph(), d["contact"], P)
    out = Path(out); out.parent.mkdir(parents=True, exist_ok=True); doc.save(out)
    if out.suffix == ".dotx": to_template(out)
    return out

def to_template(f):
    """a .docx saved by python-docx becomes a Word template by changing the main part's content type"""
    tmp = f.with_suffix(".tmp");
    with zipfile.ZipFile(f) as zi, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            data = zi.read(it.filename)
            if it.filename == "[Content_Types].xml":
                data = data.replace(b"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", b"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml")
            zo.writestr(it, data)
    tmp.replace(f)

def pdf(f):
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(Path(f).parent), str(f)], check=True, capture_output=True, timeout=180)
    return Path(f).with_suffix(".pdf")

BLANK = {
    "briefing-note": {"doc": "briefing-note", "title": "Subject of the briefing note", "meta": [["To", "Name, title"], ["From", "Name, title"], ["Date", "Month day, year"], ["Decision", "Information | Decision required by date"]],
                      "sections": [{"heading": h, "blocks": [{"p": "Write here."}]} for h in ("Purpose", "Background", "Analysis", "Recommendation")], "contact": "Name, title, phone or email"},
    "memo": {"doc": "memo", "title": "Memo subject", "meta": [["To", "Name"], ["From", "Name"], ["Date", "Month day, year"], ["Re", "Subject"]], "sections": [{"blocks": [{"p": "Write here."}]}], "contact": "Name, title, phone or email"},
    "speaker-brief": {"doc": "speaker-brief", "title": "Session title", "meta": [["Speaker", "Name, title"], ["Session", "Title"], ["Day", "Day, date"], ["Time", "Start to end"], ["Room", "Room, venue"], ["Host", "Name"]],
                      "sections": [{"heading": "Run of show", "blocks": [{"table": {"head": ["Time", "What happens", "Who"], "rows": [["00:00", "Walk-on music and welcome", "Host"]], "widths": [1.0, 4.2, 1.6]}}]},
                                   {"heading": "Talking points", "blocks": [{"bullets": ["Point"]}]}, {"heading": "AV needs", "blocks": [{"bullets": ["Item"]}]}]},
    "report": {"doc": "report", "title": "Report title", "subtitle": "One line on what the report finds", "meta": [["Prepared by", "Team"], ["Date", "Month year"]],
               "sections": [{"heading": h, "blocks": [{"p": "Write here."}]} for h in ("Summary", "Findings", "Next steps")]},
}

if __name__ == "__main__":
    a = sys.argv[1:]; pal = a[a.index("--palette") + 1] if "--palette" in a else "compliant"; want_pdf = "--pdf" in a
    pos = [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or a[i - 1] != "--palette")]
    if "--templates" in a:
        for k, d in BLANK.items():
            f = build(dict(d), ROOT / f"templates/office/agency-2026-{k}.dotx", pal); print(f.relative_to(ROOT))
    elif "--all" in a:
        for s in sorted((ROOT / "samples/office").glob("*.json")):
            f = build(json.loads(s.read_text()), ROOT / f"out/office/{s.stem}.docx", pal); print(f.relative_to(ROOT))
            if want_pdf: print("  ", pdf(f).relative_to(ROOT))
    elif len(pos) == 2:
        f = build(json.loads(Path(pos[0]).read_text()), pos[1], pal); print(f)
        if want_pdf: print(pdf(f))
    else:
        print(__doc__)
