#!/usr/bin/env python3
"""Printer files for a display face: CMYK conversion, then crop marks and cut paths in a spot colour on a larger sheet.
    python3 displays/lib/production.py art.pdf out-cmyk.pdf out-production.pdf job.json [--icc printer.icc]
job.json: {"trim": [w_in, h_in], "bleed": in, "cuts": [[x, y, w, h], ...] (inches from the trim's top-left; the monitor window),
           "folds": [x, ...] (kiosk wrap fold lines, inches from the left trim), "title": "slug line"}
Spot colours: "CutContour" (100% magenta alternate, overprint) for the trim and the monitor window, the name contour cutters and
most wide-format RIPs read; "Fold" (cyan alternate) for wrap folds, drawn outside the trim only. Rename with --cut-name if the vendor asks.
"""
import json
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter, Transformation
try:  # our own large-format art can exceed pypdf's 75 MB decompression guard (it protects against hostile files, not these)
    from pypdf._configuration import overwrite_configuration
    overwrite_configuration(zlib_maximum_output_length=2_000_000_000)
except Exception:
    import pypdf.filters as _f
    _f.ZLIB_MAX_OUTPUT_LENGTH = 2_000_000_000
from pypdf.generic import RectangleObject
from reportlab.lib.colors import CMYKColorSep
from reportlab.pdfgen import canvas

PT = 72.0
MARK = 0.75  # inches of slug around the bleed for crop marks


def cmyk(src, dst, icc=None):
    args = ["gs", "-q", "-dNOPAUSE", "-dBATCH", "-dSAFER", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.6", "-dAutoRotatePages=/None",
            "-sColorConversionStrategy=CMYK", "-sProcessColorModel=DeviceCMYK", "-dPDFSETTINGS=/prepress", "-dEmbedAllFonts=true"]
    if icc:
        args += [f"-sOutputICCProfile={icc}"]
    subprocess.run(args + [f"-sOutputFile={dst}", src], check=True)


def main(argv):
    art, out_cmyk, out_prod, jobf = argv[:4]
    icc = argv[argv.index("--icc") + 1] if "--icc" in argv else None
    cut_name = argv[argv.index("--cut-name") + 1] if "--cut-name" in argv else "CutContour"
    job = json.loads(Path(jobf).read_text())
    tw, th = job["trim"]; b = job["bleed"]
    cmyk(art, out_cmyk, icc)

    W, H = (tw + 2 * b + 2 * MARK) * PT, (th + 2 * b + 2 * MARK) * PT
    ox, oy = (MARK + b) * PT, (MARK + b) * PT                     # trim origin (bottom-left) on the sheet
    over = Path(out_prod).with_suffix(".overlay.pdf")
    c = canvas.Canvas(str(over), pagesize=(W, H))
    cut = CMYKColorSep(0, 1, 0, 0, spotName=cut_name, density=1)
    fold = CMYKColorSep(1, 0, 0, 0, spotName="Fold", density=1)
    reg = CMYKColorSep(1, 1, 1, 1, spotName="All", density=1)
    # crop marks at the trim corners, outside the bleed
    c.setStrokeColor(reg); c.setLineWidth(0.25)
    L, g = 0.5 * PT, (b + 0.0625) * PT
    for x, y, sx, sy in ((ox, oy, -1, -1), (ox + tw * PT, oy, 1, -1), (ox, oy + th * PT, -1, 1), (ox + tw * PT, oy + th * PT, 1, 1)):
        c.line(x + sx * g, y, x + sx * (g + L), y); c.line(x, y + sy * g, x, y + sy * (g + L))
    # fold ticks for the wrap, outside the trim, top and bottom
    c.setStrokeColor(fold); c.setDash(3, 2)
    for fx in job.get("folds", []):
        x = ox + fx * PT
        c.line(x, oy - g, x, oy - g - L); c.line(x, oy + th * PT + g, x, oy + th * PT + g + L)
    c.setDash()
    # cut paths: the trim and each window, as hairlines in the spot colour, overprinting
    c.setStrokeColor(cut); c.setLineWidth(0.25); c.setStrokeOverprint(True) if hasattr(c, "setStrokeOverprint") else None
    c.rect(ox, oy, tw * PT, th * PT, stroke=1, fill=0)
    for x, y, w, h in job.get("cuts", []):
        c.rect(ox + x * PT, oy + (th - y - h) * PT, w * PT, h * PT, stroke=1, fill=0)
    c.setFillColor(reg); c.setFont("Helvetica", 7)
    c.drawString(ox, oy + th * PT + g + L + 4, (job.get("title", "") + f"  ·  bleed {b} in  ·  {cut_name} = cut  ·  Fold = fold").strip())
    c.showPage(); c.save()

    src = PdfReader(out_cmyk).pages[0]
    w = PdfWriter(); page = w.add_blank_page(width=W, height=H)
    page.merge_transformed_page(src, Transformation().translate(MARK * PT, MARK * PT))
    page.merge_page(PdfReader(str(over)).pages[0])
    page.trimbox = RectangleObject([ox, oy, ox + tw * PT, oy + th * PT])
    page.bleedbox = RectangleObject([ox - b * PT, oy - b * PT, ox + (tw + b) * PT, oy + (th + b) * PT])
    page.artbox = page.trimbox
    w.add_metadata({"/Title": job.get("title", "Agency display"), "/Creator": "AIDE-AGENCY-2026-DESIGN displays/build.mjs"})
    with open(out_prod, "wb") as fh:
        w.write(fh)
    over.unlink()


if __name__ == "__main__":
    main(sys.argv[1:])
