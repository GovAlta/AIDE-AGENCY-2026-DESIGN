#!/usr/bin/env python3
"""Generate on-brand Agency 2026 illustrations from the prompt library (brand/imagery/prompts.json). Standard library only.

    python3 scripts/imagegen.py --list                                   # subjects, aspects, uses
    python3 scripts/imagegen.py --prompt circuit-frame --aspect square   # print the final prompt only (no call, no cost)
    python3 scripts/imagegen.py circuit-frame --aspect landscape         # -> brand/imagery/generated/circuit-frame-landscape-<n>.png + .json
    python3 scripts/imagegen.py rockies-traces --ground board --quality medium --out out/imagery
    python3 scripts/imagegen.py --subject "a single thin trace looping across open white space" --aspect square   # one-off subject, same style

Every image is AI-generated: the .json sidecar records the prompt, model, size, date and "ai_generated": true. Keep the sidecar with
the image and disclose AI generation where the image is used (guides/IMAGERY.md).

Data rule: Ent Tools images (azure-openai-images) are processed in the United States. Prompts are fixed style text plus a subject:
never put names, real people's likeness, Protected information or unpublished facts in a subject.

Needs ENT_TOOLS_URL and ENT_TOOLS_API_KEY (pre-loaded in SHELL sessions: source ~/.sandbox-env). Quality low by default (cheapest).
"""
import argparse, base64, datetime, json, os, re, ssl, sys, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIB = json.loads((ROOT / "brand/imagery/prompts.json").read_text(encoding="utf-8"))
BANNED_IN_SUBJECT = ["protected", "confidential", "secret", "@", "minister ", "premier ", "deputy minister"]


def build(subject, ground=None, composition=None):
    st = LIB["style"]
    s = next((x for x in LIB["subjects"] if x["id"] == subject), None)
    if s is None:
        s = {"id": "custom", "prompt": subject, "ground": ground or "board", "composition": composition or "centre-subject"}
        low = subject.lower()
        for w in BANNED_IN_SUBJECT:
            if w in low:
                sys.exit(f"subject contains '{w.strip()}': names, roles and protected material never go into an image prompt (guides/IMAGERY.md)")
    g, c = ground or s["ground"], composition or s["composition"]
    text = " ".join([st["preamble"], st["grounds"][g], "Subject: " + s["prompt"], st["compositions"][c], st["avoid"]])
    return s, g, c, text


def call(prompt, size, quality, model):
    url = os.environ.get("ENT_TOOLS_URL", "").rstrip("/") + "/v1/proxy/azure-openai-images/v1/images/generations"
    key = os.environ.get("ENT_TOOLS_API_KEY")
    if not key or not url.startswith("http"):
        sys.exit("ENT_TOOLS_URL / ENT_TOOLS_API_KEY not set (source ~/.sandbox-env)")
    ctx = ssl.create_default_context()
    if os.environ.get("IMAGEGEN_INSECURE", "1" if Path("/opt/sandbox").exists() else "") == "1":
        ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    body = json.dumps({"model": model, "prompt": prompt, "size": size, "quality": quality, "n": 1}).encode()
    for attempt in range(6):
        req = urllib.request.Request(url, data=body, method="POST", headers={"X-API-Key": key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=300) as r:
                d = json.loads(r.read())
            return base64.b64decode(d["data"][0]["b64_json"]), d.get("usage")
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")
            if e.code == 429 and attempt < 5:   # rate limit: wait as long as the service asks, then retry
                m = re.search(r"retry after (\d+) second", msg)
                wait = int(m.group(1)) + 3 if m else 30
                print(f"rate limited, retrying in {wait} s", file=sys.stderr); time.sleep(wait); continue
            sys.exit(f"HTTP {e.code}: {msg[:1500]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("id", nargs="?", help="subject id from prompts.json")
    ap.add_argument("--subject", help="a one-off subject sentence (same style)")
    ap.add_argument("--aspect", default=None, choices=list(LIB["sizes"]))
    ap.add_argument("--ground", choices=list(LIB["style"]["grounds"]))
    ap.add_argument("--composition", choices=list(LIB["style"]["compositions"]))
    ap.add_argument("--quality", default="low", choices=["low", "medium", "high"])
    ap.add_argument("--model", default=LIB["model"])
    ap.add_argument("--out", default=str(ROOT / "brand/imagery/generated"))
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--prompt", metavar="ID", help="print the final prompt for a subject and stop")
    a = ap.parse_args()
    if a.list:
        for s in LIB["subjects"]:
            print(f"{s['id']:22} {s['ground']:6} {s['composition']:15} {','.join(s['aspects']):26} {'; '.join(s['uses'])}")
        return
    if a.prompt:
        print(build(a.prompt, a.ground, a.composition)[3]); return
    subject = a.subject or a.id
    if not subject:
        ap.print_help(); return
    s, g, c, prompt = build(subject, a.ground, a.composition)
    aspect = a.aspect or (s.get("aspects") or ["square"])[0]
    size = LIB["sizes"][aspect]
    png, usage = call(prompt, size, a.quality, a.model)
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    stem = f"{s['id']}-{aspect}" + (f"-{g}" if g != s.get("ground") else "")
    n = 1
    while (out / f"{stem}-{n}.png").exists():
        n += 1
    f = out / f"{stem}-{n}.png"
    f.write_bytes(png)
    meta = {"file": f.name, "ai_generated": True, "model": a.model, "provider": "Ent Tools azure-openai-images (processed in the US)",
            "size": size, "quality": a.quality, "subject": s["id"], "ground": g, "composition": c, "prompt": prompt,
            "library_version": LIB["version"], "created": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "usage": usage, "alt": f"Abstract circuit-trace illustration: {s['prompt']}"}
    f.with_suffix(".json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(f)


if __name__ == "__main__":
    main()
