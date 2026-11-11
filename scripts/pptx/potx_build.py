#!/usr/bin/env python3
"""Build brand/pptx/Agency2026.potx: the event team's compliant slide template as a real PowerPoint template, with extra layouts.

    python3 scripts/pptx/potx_build.py [--examples] [--palette compliant|mvai]
        -> brand/pptx/Agency2026.potx            (layouts only, no slides: File > New from template gives a blank deck)
        -> brand/pptx/Agency2026-layout-guide.pptx with --examples: one filled example slide per layout, for review

Source: brand/pptx/Agency2026_Slide_Template_compliant.pptx (layouts TITLE, SECTION_DAY1-3, CONTENT, TITLE_ONLY, STATEMENT: kept unchanged).
Added layouts (cloned from TITLE_ONLY, so they keep its circuit art, Alberta signature and "Agency 2026" footer):
    TWO_COLUMN     title, two column headings, two bodies
    BIG_NUMBER     title, one big number, its label, a source line
    STATS_4        title, four value + label pairs
    IMAGE_CAPTION  title, picture placeholder, caption
    AGENDA         title, three day columns (day line, session title, place)
Colours and fonts come from brand/tokens/tokens.json (--palette compliant, the default, matches the source template: Arial).
"""
import io, json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
T = json.loads((ROOT / "brand/tokens/tokens.json").read_text())
SRC = ROOT / "brand/pptx/Agency2026_Slide_Template_compliant.pptx"
OUT = ROOT / "brand/pptx/Agency2026.potx"
EMU = 914400
pal = sys.argv[sys.argv.index("--palette") + 1] if "--palette" in sys.argv else "compliant"
if pal == "mvai":
    C = {"navy": T["color"]["navy"], "red": T["color"]["maroon"], "blue": T["color"]["blue"], "mute": T["color"]["mute"], "rule": "D0D1DB", "ground": T["color"]["field"]}
    FONT = T["font"]["display"]
else:
    c = T["compliant"]["color"]; C = {"navy": c["navy"], "red": c["red"], "blue": c["blue"], "mute": "#4F6274", "rule": c["rule"], "ground": c["ground"]}
    FONT = T["compliant"]["font"]
h = lambda x: x.lstrip("#").upper()
inch = lambda v: int(v * EMU)

def ph(id_, name, idx, typ, x, y, w, hgt, sz, prompt, bold=False, color=None, algn="l", anchor="t", caps=False):
    col = f'<a:solidFill><a:srgbClr val="{h(color)}"/></a:solidFill>' if color else '<a:solidFill><a:schemeClr val="tx1"/></a:solidFill>'
    t = f' type="{typ}"' if typ else ''
    b = ' b="1"' if bold else ''
    cap = ' cap="all" spc="200"' if caps else ''
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{id_}" name="{name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph{t} idx="{idx}" hasCustomPrompt="1"/></p:nvPr></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{inch(x)}" y="{inch(y)}"/><a:ext cx="{inch(w)}" cy="{inch(hgt)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            f'<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="{anchor}" rtlCol="0"><a:normAutofit/></a:bodyPr><a:lstStyle><a:lvl1pPr algn="{algn}" indent="0" marL="0"><a:spcAft><a:spcPts val="600"/></a:spcAft><a:buNone/>'
            f'<a:defRPr lang="en-US" sz="{int(sz * 100)}"{b}{cap} dirty="0">{col}<a:latin typeface="{FONT}"/></a:defRPr></a:lvl1pPr></a:lstStyle>'
            f'<a:p><a:pPr algn="{algn}" indent="0" marL="0"><a:buNone/></a:pPr><a:r><a:rPr lang="en-US" sz="{int(sz * 100)}"{b} dirty="0"/><a:t>{prompt}</a:t></a:r></a:p></p:txBody></p:sp>')

def pic_ph(id_, idx, x, y, w, hgt, prompt):
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{id_}" name="Picture Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="pic" idx="{idx}" hasCustomPrompt="1"/></p:nvPr></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{inch(x)}" y="{inch(y)}"/><a:ext cx="{inch(w)}" cy="{inch(hgt)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            f'<a:solidFill><a:srgbClr val="{h(C["ground"])}"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="{h(C["rule"])}"/></a:solidFill></a:ln></p:spPr>'
            f'<p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle><a:lvl1pPr algn="ctr"><a:buNone/><a:defRPr sz="1400"><a:solidFill><a:srgbClr val="{h(C["mute"])}"/></a:solidFill></a:defRPr></a:lvl1pPr></a:lstStyle>'
            f'<a:p><a:r><a:rPr lang="en-US" sz="1400"/><a:t>{prompt}</a:t></a:r></a:p></p:txBody></p:sp>')

def card(id_, x, y, w, hgt, top=None):
    """a rounded card frame drawn on the layout (not editable on slides), like the source template's cards"""
    ln = f'<a:ln w="9525"><a:solidFill><a:srgbClr val="{h(C["rule"])}"/></a:solidFill></a:ln>'
    s = (f'<p:sp><p:nvSpPr><p:cNvPr id="{id_}" name="Card"/><p:cNvSpPr/><p:nvPr userDrawn="1"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{inch(x)}" y="{inch(y)}"/><a:ext cx="{inch(w)}" cy="{inch(hgt)}"/></a:xfrm>'
         f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 4000"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>{ln}</p:spPr></p:sp>')
    if top:
        s += (f'<p:sp><p:nvSpPr><p:cNvPr id="{id_ + 100}" name="Card rule"/><p:cNvSpPr/><p:nvPr userDrawn="1"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{inch(x)}" y="{inch(y)}"/><a:ext cx="{inch(w)}" cy="{inch(0.06)}"/></a:xfrm>'
              f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{h(top)}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>')
    return s

TITLE = lambda: ph(3, "Title", 101, "title", 0.6, 0.5, 9.4, 1.0, 36, "Slide title", bold=True)
cc = T["compliant"]["color"]; DAYC = [cc["blue"], cc["plum"], cc["orange"]]; TILEC = [cc["blue"], cc["pink"], cc["orange"], cc["green"]]

def layouts():
    L = {}
    L["TWO_COLUMN"] = TITLE() + card(40, 0.6, 2.2, 5.85, 3.8) + card(41, 6.85, 2.2, 5.85, 3.8) + \
        ph(6, "Left heading", 102, "body", 0.9, 2.45, 5.25, 0.5, 20, "Left heading", bold=True) + ph(7, "Left body", 103, "body", 0.9, 3.05, 5.25, 2.8, 16, "Left column text") + \
        ph(8, "Right heading", 104, "body", 7.15, 2.45, 5.25, 0.5, 20, "Right heading", bold=True) + ph(9, "Right body", 105, "body", 7.15, 3.05, 5.25, 2.8, 16, "Right column text")
    L["BIG_NUMBER"] = TITLE() + ph(6, "Number", 102, "body", 0.6, 1.8, 7.5, 2.4, 138, "40", bold=True, color=C["red"], anchor="b") + \
        ph(7, "Label", 103, "body", 0.6, 4.35, 7.5, 0.9, 26, "What the number counts", bold=True) + ph(8, "Source", 104, "body", 0.6, 5.4, 7.5, 0.5, 12, "Source: where the figure comes from", color=C["mute"])
    s = TITLE()
    for i in range(4):
        x = 0.6 + i * 3.05; s += card(40 + i, x, 2.2, 2.8, 2.9, TILEC[i])
        s += ph(6 + 2 * i, f"Value {i + 1}", 102 + 2 * i, "body", x + 0.25, 2.5, 2.3, 1.3, 54, "00", bold=True, color=C["red"], algn="ctr", anchor="b")
        s += ph(7 + 2 * i, f"Label {i + 1}", 103 + 2 * i, "body", x + 0.25, 3.95, 2.3, 1.0, 14, "what it counts", algn="ctr")
    L["STATS_4"] = s
    L["IMAGE_CAPTION"] = TITLE() + pic_ph(6, 102, 0.6, 1.7, 8.2, 4.4, "Picture: click the icon to insert (add alt text)") + \
        ph(7, "Caption", 103, "body", 9.1, 2.4, 3.6, 3.7, 16, "Caption: what the picture shows and why it matters", anchor="t")
    s = TITLE()
    for i in range(3):
        x = 0.6 + i * 4.1; s += card(40 + i, x, 2.2, 3.8, 3.8, DAYC[i])
        s += ph(6 + 3 * i, f"Day {i + 1}", 102 + 3 * i, "body", x + 0.3, 2.5, 3.2, 0.4, 13, "Day, date", bold=True, color=C["red"])
        s += ph(7 + 3 * i, f"Session {i + 1}", 103 + 3 * i, "body", x + 0.3, 2.95, 3.2, 1.3, 22, "Session title", bold=True)
        s += ph(8 + 3 * i, f"Place {i + 1}", 104 + 3 * i, "body", x + 0.3, 4.4, 3.2, 1.4, 14, "Place · who it is for")
    L["AGENDA"] = s
    return L

def build():
    zi = zipfile.ZipFile(SRC); files = {n: zi.read(n) for n in zi.namelist()}
    base = files["ppt/slideLayouts/slideLayout7.xml"].decode(); base_rels = files["ppt/slideLayouts/_rels/slideLayout7.xml.rels"]
    # keep the TITLE_ONLY chrome (circuit art id 2, footer text id 4, signature id 5, slide number id 25), drop its title placeholder (id 3)
    head, tree_tail = base.split("<p:spTree>", 1)
    spTree = "<p:spTree>" + tree_tail.split("</p:spTree>")[0] + "</p:spTree>"
    spTree = re.sub(r'<p:sp><p:nvSpPr><p:cNvPr id="3" name="Text 0"/>.*?</p:sp>', "", spTree, count=1, flags=re.S)
    after = tree_tail.split("</p:spTree>", 1)[1]
    master = files["ppt/slideMasters/slideMaster1.xml"].decode(); mrels = files["ppt/slideMasters/_rels/slideMaster1.xml.rels"].decode()
    ct = files["[Content_Types].xml"].decode()
    n0, lid = 8, 2147483657
    for k, (name, body) in enumerate(layouts().items()):
        n = n0 + 1 + k; rid = f"rIdL{n}"
        xml = head.replace('name="TITLE_ONLY"', f'name="{name}"') + "<p:spTree>" + spTree[len("<p:spTree>"):-len("</p:spTree>")] + body + "</p:spTree>" + after
        xml = xml.replace('<p:cSld name="TITLE_ONLY">', f'<p:cSld name="{name}">')
        files[f"ppt/slideLayouts/slideLayout{n}.xml"] = xml.encode(); files[f"ppt/slideLayouts/_rels/slideLayout{n}.xml.rels"] = base_rels
        master = master.replace("</p:sldLayoutIdLst>", f'<p:sldLayoutId id="{lid + k}" r:id="{rid}"/></p:sldLayoutIdLst>')
        mrels = mrels.replace("</Relationships>", f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout{n}.xml"/></Relationships>')
        ct = ct.replace("</Types>", f'<Override PartName="/ppt/slideLayouts/slideLayout{n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/></Types>')
    files["ppt/slideMasters/slideMaster1.xml"] = master.encode(); files["ppt/slideMasters/_rels/slideMaster1.xml.rels"] = mrels.encode(); files["[Content_Types].xml"] = ct.encode()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zo:
        for n, d in files.items(): zo.writestr(n, d)
    buf.seek(0); return buf

def strip_slides(prs):
    sl = prs.slides._sldIdLst
    for s in list(sl):
        prs.part.drop_rel(s.rId); sl.remove(s)

EXAMPLES = {
    "TITLE": {100: "Hosted by Technology and Innovation", 101: "Agency 2026", 102: "Example: presentation title", 103: T["event"]["datesLong"]},
    "SECTION_DAY1": {100: T["event"]["days"][0]["day"], 101: "The Art of the Possible", 102: T["event"]["days"][0]["sub"], 103: T["event"]["days"][0]["place"]},
    "CONTENT": {101: "Example: content slide", 102: "Body text. One idea per line, short sentences."},
    "TWO_COLUMN": {101: "Example: two columns", 102: "Before", 103: "Example text for the left column.", 104: "After", 105: "Example text for the right column."},
    "BIG_NUMBER": {101: "Agency 2026 at a glance", 102: "40", 103: "working demos built by Technology and Innovation", 104: "Source: Agency 2026 slide template"},
    "STATS_4": {101: "Agency 2026 at a glance", **{102 + 2 * i: f["value"] for i, f in enumerate(T["event"]["figures"])}, **{103 + 2 * i: f["label"] for i, f in enumerate(T["event"]["figures"])}},
    "AGENDA": {101: "Three days, three conversations", **{k: v for i, d in enumerate(T["event"]["days"]) for k, v in ((102 + 3 * i, d["day"]), (103 + 3 * i, d["title"]), (104 + 3 * i, d["place"]))}},
    "IMAGE_CAPTION": {101: "Example: picture and caption", 103: "Example caption. Insert a picture and give it alt text."},
    "STATEMENT": {102: T["event"]["tagline"], 103: "Agency 2026 · " + T["event"]["anchor"]},
}

if __name__ == "__main__":
    from pptx import Presentation
    prs = Presentation(build()); strip_slides(prs)
    if "--examples" in sys.argv:
        names = {l.name: l for l in prs.slide_layouts}
        for lname, vals in EXAMPLES.items():
            s = prs.slides.add_slide(names[lname])
            for p in s.placeholders:
                if p.placeholder_format.idx in vals and p.has_text_frame: p.text_frame.text = vals[p.placeholder_format.idx]
        f = ROOT / "brand/pptx/Agency2026-layout-guide.pptx"; prs.save(f); print(f.relative_to(ROOT), len(prs.slides._sldIdLst), "slides")
        prs = Presentation(build()); strip_slides(prs)
    tmp = io.BytesIO(); prs.save(tmp); tmp.seek(0)
    with zipfile.ZipFile(tmp) as zi, zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            d = zi.read(it.filename)
            if it.filename == "[Content_Types].xml":
                d = d.replace(b"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml", b"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml")
            zo.writestr(it, d)
    print(OUT.relative_to(ROOT), "layouts:", [l.name for l in prs.slide_layouts])
