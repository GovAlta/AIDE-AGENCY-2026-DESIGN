#!/usr/bin/env python3
"""Fill an introduction formula, lint it, and voice it with the registered voice (ElevenLabs eleven_v4 through Ent Tools).

    python3 scripts/voice/say.py --list                                             # the formulas and their slots
    python3 scripts/voice/say.py speaker-walkup --name "Jordan Sample" --role "Director of Sample Services" \
        --org "the Ministry of Example Affairs" --dry-run                           # print the line, no voice
    python3 scripts/voice/say.py speaker-walkup --name ... --role ... --out out/voice/walkup.mp3   # voice it (announcer)
    python3 scripts/voice/say.py --text "Sample Session Title begins now." --role-voice announcer --out x.mp3
    python3 scripts/voice/say.py --agenda show/samples/agency-2026.json --check     # every announcement in a run of show, linted
    python3 scripts/voice/say.py --agenda show/samples/agency-2026.json --out out/voice/   # voice them all + manifest.json

Formulas: brand/voice/intros.json. Voices and settings: brand/voice/voices.json (announcer for stage lines, narrator for film lines).
Spoken forms: brand/voice/lexicon.json ("Agency 2026" becomes "Agency twenty twenty six"). Every line is checked with scripts/lint/lint.py
before it is voiced; a line with an error is not voiced. Each clip gets a .json record (text, formula, voice, model, settings, date).
Unclassified material only: ElevenLabs processes outside Canada. For Protected material use MVAI with "provider": "google-ca".
Needs ENT_TOOLS_URL and ENT_TOOLS_API_KEY (~/.sandbox-env).
"""
import datetime
import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VOICE = ROOT / "brand" / "voice"
INTROS = json.loads((VOICE / "intros.json").read_text(encoding="utf-8"))
VOICES = json.loads((VOICE / "voices.json").read_text(encoding="utf-8"))
LEXICON = json.loads((VOICE / "lexicon.json").read_text(encoding="utf-8"))["entries"]
TOKENS = json.loads((ROOT / "brand" / "tokens" / "tokens.json").read_text(encoding="utf-8"))
sys.path.insert(0, str(ROOT / "scripts" / "lint"))
import lint  # noqa: E402

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
PROPER = {"Alberta", "Albertans", "Edmonton", "Calgary", "AI", "Canada", "Montréal"}
CITIES = {"Edmonton", "Calgary", "Red Deer", "Lethbridge", "Medicine Hat", "Grande Prairie", "Fort McMurray"}


def words(n):
    """Whole numbers below 1,000 as they are said, without hyphens ('forty five')."""
    n = int(n)
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " and " + words(n % 100))


def spoken_time(hhmm):
    h, m = (int(x) for x in hhmm.split(":"))
    h12 = h % 12 or 12
    if m == 0:
        return f"{words(h12)} o'clock"
    return f"{words(h12)} {'oh ' + words(m) if m < 10 else words(m)}"


def greeting(hhmm):
    h = int(hhmm.split(":")[0])
    return "Good morning" if h < 12 else "Good afternoon" if h < 17 else "Good evening"


def spoken(text):
    """Apply the lexicon's written forms for the voice ('Agency 2026' -> 'Agency twenty twenty six', '%' -> 'percent')."""
    for e in sorted(LEXICON, key=lambda e: -len(e["term"])):
        if e["kind"] in ("event", "url", "symbol") and e["term"] != e["write"] and e["term"] != "$":   # "$4" needs rewording by hand
            text = text.replace(e["term"], e["write"] if e["kind"] != "symbol" else " " + e["write"])
    return re.sub(r"\s+", " ", text).strip()


def where(place):
    """'Edmonton · By invitation' -> 'in Edmonton'; 'Platform Calgary' -> 'at Platform Calgary' (the part before ' · ' is spoken)."""
    p = (place or "").split("·")[0].strip()
    if not p:
        return ""
    return ("in " if p in CITIES else "at " if not p.lower().startswith("the ") else "at ") + p


def lower_sub(s):
    """'A Showcase for Government' -> 'a showcase for government' (proper names keep capitals)."""
    return " ".join(w if w in PROPER else w.lower() for w in s.split())


def fill(template, slots):
    """Replace {slot}; drop [optional] parts whose slots are empty; fail on a missing required slot."""
    def opt(m):
        part = m.group(1)
        names = re.findall(r"\{(\w+)\}", part)
        return part if all(slots.get(n) for n in names) else ""
    t = re.sub(r"\[([^\]]*)\]", opt, template)
    missing = [n for n in re.findall(r"\{(\w+)\}", t) if not slots.get(n)]
    if missing:
        raise ValueError(f"missing slot(s): {', '.join(missing)}")
    return re.sub(r"\{(\w+)\}", lambda m: str(slots[m.group(1)]), t)


def intro(iid):
    x = next((x for x in INTROS["intros"] if x["id"] == iid), None)
    if not x:
        raise SystemExit(f"unknown formula {iid}; --list shows them")
    if x.get("owner_only") or not x.get("template"):
        raise SystemExit(f"{iid} is owner-only: read the owner's text word for word ({x.get('rule', '')})")
    return x


def make_line(iid, slots):
    x = intro(iid)
    line = spoken(fill(x["template"], slots))
    findings = []
    lint.lint_text("say", line, lambda sev, rule, field, text: findings.append((sev, rule)))
    if lint.nwords(line) > x.get("max_words", 99):
        findings.append(("error", f"over {x['max_words']} words"))
    return line, findings


def voice_for(role):
    r = VOICES["roles"][role]
    return r["voice_id"], r["name"], r["settings"], r.get("status")


def tts(text, role, out):
    url, key = os.environ.get("ENT_TOOLS_URL"), os.environ.get("ENT_TOOLS_API_KEY")
    if not (url and key):
        raise SystemExit("ENT_TOOLS_URL / ENT_TOOLS_API_KEY not set (source ~/.sandbox-env)")
    vid, name, st, status = voice_for(role)
    body = {"text": text, "model_id": VOICES["engine"]["model"], "voice_settings": {k: v for k, v in st.items()}}
    req = urllib.request.Request(f"{url}/v1/proxy/elevenlabs/v1/text-to-speech/{vid}?output_format={VOICES['engine']['output']}",
                                 data=json.dumps(body).encode(), method="POST",
                                 headers={"X-API-Key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    ctx = ssl.create_default_context()
    ctx.check_hostname, ctx.verify_mode = False, ssl.CERT_NONE   # SHELL sandbox: the gateway certificate is not in the VM's store
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=120) as r:
            audio = r.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs via Ent Tools: HTTP {e.code} {e.read()[:300]!r}")
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    rec = {"text": text, "role": role, "voice": name, "voice_id": vid, "voice_status": status, "model": VOICES["engine"]["model"],
           "settings": st, "made": datetime.datetime.now().isoformat(timespec="seconds"), "classification": "Unclassified"}
    out.with_suffix(".json").write_text(json.dumps(rec, indent=1, ensure_ascii=False))
    return out


def agenda_lines(path):
    """Every announcement a run of show needs, from its segments (show/agenda.schema.json)."""
    A = json.loads(Path(path).read_text(encoding="utf-8"))
    event = spoken(A.get("event", {}).get("name") or TOKENS["event"]["name"])
    out = []
    days = A.get("days", [])
    for di, day in enumerate(days):
        dn = words(di + 1)
        tdays = TOKENS["event"]["days"]
        tday = tdays[di] if di < len(tdays) else {}
        for s in day.get("segments", []):
            sid, typ, sp = s.get("id"), s.get("type"), s.get("speakers") or []
            place = s.get("place") or s.get("room") or ""
            add = lambda iid, **kw: out.append((f"{sid}-{iid}" + (f"-{kw.pop('_n')}" if "_n" in kw else ""), sid, iid, kw))
            if typ == "welcome":
                add("event-open", greeting=greeting(s.get("start", "09:00")), event=event)
                add("day-open", day_number=dn, event=event, day_title=day.get("title") or tday.get("title", ""), day_sub=lower_sub(day.get("sub") or tday.get("sub", "")))
            elif typ == "speaker-intro" and sp:
                p = sp[0]
                add("speaker-walkup", name=p.get("name"), role=p.get("role"), org=p.get("org"))
                if p.get("fact"):
                    add("speaker-fact", name=p.get("name"), fact=p["fact"])
            elif typ == "session":
                add("session-now", title=s.get("title"), place=place.split("·")[0].strip())
                for i, p in enumerate(sp):
                    add("speaker-walkup", _n=i + 1, name=p.get("name"), role=p.get("role"), org=p.get("org"))
            elif typ == "panel":
                add("panel-open", title=s.get("title"))
                mods = [p for p in sp if p.get("moderator")]
                for i, p in enumerate([p for p in sp if not p.get("moderator")]):
                    add("panel-member", _n=i + 1, name=p.get("name"), role=p.get("role"), org=p.get("org"))
                for p in mods:
                    add("panel-moderator", name=p.get("name"), role=p.get("role"), org=p.get("org"))
            elif typ == "demo":
                if s.get("what") and s.get("team"):
                    add("demo-intro", title=s.get("title"), what=s["what"], team=s["team"])
                else:
                    out.append((f"{sid}-demo-intro", sid, "demo-intro", {"_skip": "the segment needs 'what' and 'team' from the demo's owner"}))
                for i, p in enumerate(sp):
                    add("demo-presenter", _n=i + 1, name=p.get("name"), role=p.get("role"))
            elif typ == "video" and s.get("subject"):
                add("video-intro", title=s.get("title"), subject=s["subject"])
            elif typ == "break" and s.get("end"):
                add("break", time=spoken_time(s["end"]), place=place.split("·")[0].strip())
            elif typ == "lunch" and s.get("end"):
                add("lunch", place=place or "the lunch area", time=spoken_time(s["end"]))
            elif typ == "closing" and di + 1 < len(days):
                nxt = days[di + 1]
                first = (nxt.get("segments") or [{}])[0].get("start", "09:00")
                add("day-close", day_number=dn, event=event, next_day_number=words(di + 2), time=spoken_time(first), where=where(nxt.get("place")))
    return out


def main(a):
    if not a or "-h" in a or "--help" in a:
        print(__doc__); return 0
    opt = {}
    pos = []
    i = 0
    while i < len(a):
        if a[i].startswith("--"):
            k = a[i][2:]
            if i + 1 < len(a) and not a[i + 1].startswith("--"):
                opt[k] = a[i + 1]; i += 2
            else:
                opt[k] = True; i += 1
        else:
            pos.append(a[i]); i += 1
    if "list" in opt:
        for x in INTROS["intros"]:
            print(f"{x['id']:20} {x['speaker']:9} {'(owner only)' if x.get('owner_only') else x.get('template') or ''}")
        return 0
    if "agenda" in opt:
        bad = 0
        manifest = {"agenda": opt["agenda"], "made": datetime.datetime.now().isoformat(timespec="seconds"), "clips": []}
        for cid, sid, iid, slots in agenda_lines(opt["agenda"]):
            if "_skip" in slots:
                print(f"SKIP  {cid}: {slots['_skip']}"); continue
            try:
                line, f = make_line(iid, slots)
            except ValueError as e:
                print(f"ERROR {cid}: {e}"); bad += 1; continue
            errs = [r for s, r in f if s == "error"]
            bad += bool(errs)
            print(f"{'ERROR' if errs else 'ok   '} {cid:28} {line}" + (f"   <- {'; '.join(errs)}" if errs else ""))
            if not errs and "out" in opt and "check" not in opt:
                p = tts(line, "announcer", Path(opt["out"]) / f"{cid}.mp3")
                manifest["clips"].append({"id": cid, "segment": sid, "intro": iid, "text": line, "file": str(p.relative_to(ROOT) if p.is_absolute() and ROOT in p.parents else p)})
        if "out" in opt and "check" not in opt:
            Path(opt["out"]).mkdir(parents=True, exist_ok=True)
            (Path(opt["out"]) / "manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
        return 1 if bad else 0
    role = opt.get("role-voice", "announcer")
    if "text" in opt:
        line = spoken(opt["text"])
        f = []
        lint.lint_text("say", line, lambda sev, rule, field, text: f.append((sev, rule)))
    else:
        if not pos:
            raise SystemExit("name a formula (see --list), or give --text or --agenda")
        x = intro(pos[0])
        slots = {k: v for k, v in opt.items() if isinstance(v, str)}
        if x["speaker"] == "narrator":
            role = opt.get("role-voice", "narrator")
        line, f = make_line(pos[0], slots)
    for sev, rule in f:
        print(f"{sev.upper():5} {rule}")
    print(line)
    if any(s == "error" for s, _ in f):
        return 1
    if "out" in opt and "dry-run" not in opt:
        print("voiced ->", tts(line, role, opt["out"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
