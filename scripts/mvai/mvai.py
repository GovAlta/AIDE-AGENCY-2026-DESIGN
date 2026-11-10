#!/usr/bin/env python3
"""MVAI (AIDE Motion Video) client for Agency 2026 videos. Standard library only.

MVAI renders the video. This repo does not re-implement it: it gives you the spec format, the style rules and this thin client.

    export MVAI_API_KEY=mvk_...            # create one in the MVAI app: API keys (top right). Never commit it.
    python3 scripts/mvai/mvai.py me                                   # who am I, today's spend
    python3 scripts/mvai/mvai.py type agency-explainer [--part guide] # instructions, guide, template, schema
    python3 scripts/mvai/mvai.py screens bars,stats,flow              # field guide + example scenes for chosen screens
    python3 scripts/mvai/mvai.py check  samples/video/explainer.json  # writing + schema + cue checks (fix every error)
    python3 scripts/mvai/mvai.py create samples/video/explainer.json [--images dir] [--themes agency-light,agency-dark]
    python3 scripts/mvai/mvai.py wait   <job_id>                      # poll every 25 s until done; prints the download links
    python3 scripts/mvai/mvai.py fetch  <job_id> out/video/           # download mp4, captions, poster, contact sheet
    python3 scripts/mvai/mvai.py update <job_id> spec.json            # re-send a spec (unchanged narration is not voiced again)
    python3 scripts/mvai/mvai.py storyboard <job_id>                  # scene start/end times (for frame grabs)

Address: $MVAI_URL or https://mvai.app.int.gov.ab.ca. The GoA certificate authority is not trusted on every machine: set
MVAI_CA=/path/goa-ca-bundle.pem (from the MVAI repo deploy/ folder), or MVAI_INSECURE=1 on a SHELL VM.
MCP instead of REST: claude mcp add --transport http motion-video https://mvai.app.int.gov.ab.ca/mcp --header "X-API-Key: $MVAI_API_KEY"
"""
import base64, json, os, ssl, sys, time, urllib.error, urllib.request
from pathlib import Path

BASE = os.environ.get("MVAI_URL", "https://mvai.app.int.gov.ab.ca").rstrip("/")
KEY = os.environ.get("MVAI_API_KEY", "")


def _ctx():
    if os.environ.get("MVAI_CA"):
        return ssl.create_default_context(cafile=os.environ["MVAI_CA"])
    if os.environ.get("MVAI_INSECURE", "1" if Path("/opt/sandbox").exists() else "") == "1":
        c = ssl.create_default_context(); c.check_hostname = False; c.verify_mode = ssl.CERT_NONE; return c
    return ssl.create_default_context()


def req(method, path, body=None, raw=False, retries=6):
    if not KEY:
        sys.exit("MVAI_API_KEY is not set (create a key in the MVAI app: API keys)")
    url = path if path.startswith("http") else BASE + "/api/v1" + path
    data = json.dumps(body).encode() if body is not None else None
    for i in range(retries):
        r = urllib.request.Request(url, data=data, method=method, headers={"X-API-Key": KEY, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(r, context=_ctx(), timeout=300) as resp:
                b = resp.read()
                if raw:
                    return b
                if not b.strip():
                    raise ValueError("empty body")
                return json.loads(b)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")
            if e.code in (429, 502, 503) and i < retries - 1:   # busy: wait and retry (MVAI instructions)
                time.sleep(30 + 10 * i); continue
            sys.exit(f"HTTP {e.code} {method} {url}\n{msg[:2000]}")
        except (ValueError, json.JSONDecodeError):
            if i < retries - 1:
                time.sleep(30); continue
            raise


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def images_for(spec, folder):
    """Every asset named {"upload": "x.png"} (or {"video": {"upload": ...}}) is sent from `folder` as base64."""
    out = []
    for a in (spec.get("assets") or {}).values():
        name = a.get("upload") or (a.get("video") or {}).get("upload")
        if name:
            f = Path(folder) / name
            if not f.exists():
                sys.exit(f"asset file missing: {f}")
            out.append({"name": name, "base64": base64.b64encode(f.read_bytes()).decode()})
    return out


def main(a):
    if not a or a[0] in ("-h", "--help"):
        print(__doc__); return
    cmd, rest = a[0], a[1:]
    opt = {rest[i][2:]: rest[i + 1] for i in range(len(rest) - 1) if rest[i].startswith("--")}
    pos = [x for i, x in enumerate(rest) if not x.startswith("--") and not (i and rest[i - 1].startswith("--"))]
    if cmd == "me":
        print(json.dumps(req("GET", "/me"), indent=1))
    elif cmd == "type":
        d = req("GET", f"/video-types/{pos[0]}" + (f"?part={opt['part']}" if "part" in opt else ""))
        print(json.dumps(d, indent=1, ensure_ascii=False))
    elif cmd == "screens":
        print(json.dumps(req("GET", f"/video-types/{opt.get('type', 'agency-explainer')}/screens?names={pos[0]}"), indent=1, ensure_ascii=False))
    elif cmd == "check":
        d = req("POST", "/walkthrough/check", {"spec": load(pos[0])})
        print(json.dumps(d, indent=1, ensure_ascii=False))
        sys.exit(0 if d.get("ok") else 1)
    elif cmd == "create":
        spec = load(pos[0])
        body = {"spec": spec, "images": images_for(spec, opt.get("images", Path(pos[0]).parent))}
        if "themes" in opt:
            body["themes"] = opt["themes"].split(",")
        if "library" in opt:
            body["library"] = {"collection": opt["library"], "title": spec.get("title", "")}
        d = req("POST", "/walkthroughs", body)
        print(json.dumps({k: d.get(k) for k in ("id", "job_id", "status", "phase", "url", "next") if k in d} or d, indent=1))
    elif cmd == "update":
        print(json.dumps(req("POST", f"/jobs/{pos[0]}/spec", {"spec": load(pos[1])}), indent=1)[:4000])
    elif cmd == "wait":
        while True:
            d = req("GET", f"/jobs/{pos[0]}")
            rs = d.get("renders") or []
            print(time.strftime("%H:%M:%S"), d.get("phase"), d.get("status"), [(r.get("theme"), r.get("status"), r.get("progress")) for r in rs], flush=True)
            if d.get("phase") in ("done", "error", "failed") or d.get("status") in ("error", "failed"):
                print(json.dumps({"renders": rs, "warnings": d.get("warnings")}, indent=1)); break
            time.sleep(25)
    elif cmd == "storyboard":
        print(json.dumps(req("GET", f"/jobs/{pos[0]}/storyboard"), indent=1, ensure_ascii=False))
    elif cmd == "fetch":
        out = Path(pos[1] if len(pos) > 1 else "out/video"); out.mkdir(parents=True, exist_ok=True)
        d = req("GET", f"/jobs/{pos[0]}")
        for r in d.get("renders") or []:
            for k in ("download", "captions_vtt", "captions_srt", "poster", "contact_sheet", "frame_85"):
                if r.get(k):
                    name = r[k].split("/")[-1].split("?")[0]
                    (out / f"{pos[0]}-{name}").write_bytes(req("GET", r[k], raw=True)); print("saved", out / f"{pos[0]}-{name}")
    else:
        sys.exit(f"unknown command {cmd}\n{__doc__}")


if __name__ == "__main__":
    main(sys.argv[1:])
