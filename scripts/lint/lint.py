#!/usr/bin/env python3
"""Writing lint for Agency 2026: content JSON (print, digital, on-site, office, slides), run-of-show agendas and MVAI video specs.

    python3 scripts/lint/lint.py samples/print/handout.json samples/video/*.json
    python3 scripts/lint/lint.py --ai-agent --owner-lines docs/owner_lines.txt spec.json
    python3 scripts/lint/lint.py --strict deck.json          # warnings fail too
    python3 scripts/lint/lint.py --json spec.json            # machine-readable findings
    python3 scripts/lint/lint.py --info spec.json            # also print info notes (pronunciation to check)
    python3 scripts/lint/lint.py --rules                     # list the rule groups

The rules are the three guides, as far as a program can check them:
- guides/WRITING.md (all text): banned.json (shared with /mnt/data/projects/_styles: words, phrases, openers, sentence and heading
  shapes, limits), praise words in introductions, Canadian spelling, sentence-case headings, em dashes.
- guides/SLIDE-TEXT.md (screen text): word limits by field (title/headline 8, kicker 6, bullet 7, label 7, sub 16) and at most five
  bullets in a list.
- guides/NARRATION.md (spoken fields: narration, say, line, announce, voiceover, script): 25-word sentences, numbers as words, no
  parentheses, semicolons or dashes, no wayfinding, softeners, slogans or dramatic colons, questions only as staged questions, "select"
  not "click", pronoun openings and unowned "we", teaser colons and idioms ("runs on", "it all", "one thing"), hedging words
  ("prototype", "planned", "concept", "could", "the owner states"), plus the introduction formulas: any object tagged "intro": "<id>" must match its
  formula in brand/voice/intros.json, and the fixed explainer lines there are allowed as written.
--ai-agent adds the Contact Alberta sponsor rule (a bare "agent" is an error where staff are also called agents).
--owner-lines FILE: sentences in FILE (one per line, # comments) were dictated by the owner and are never flagged.
Exit 1 on any error (or any warning with --strict). Info notes never fail.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RULES = json.loads((HERE / "banned.json").read_text(encoding="utf-8"))
LIM = RULES["limits"]
VOICE = ROOT / "brand" / "voice"
INTROS = json.loads((VOICE / "intros.json").read_text(encoding="utf-8")) if (VOICE / "intros.json").exists() else {"intros": [], "fixed_lines": {}}
LEXICON = json.loads((VOICE / "lexicon.json").read_text(encoding="utf-8")).get("entries", []) if (VOICE / "lexicon.json").exists() else []
try:
    TOKENS = json.loads((ROOT / "brand" / "tokens" / "tokens.json").read_text(encoding="utf-8"))
    PROPER_TITLES = [d["title"] for d in TOKENS["event"]["days"]] + [TOKENS["event"]["name"], TOKENS["event"].get("tagline", "")]
except Exception:
    PROPER_TITLES = []

# keys whose values are not prose
SKIP = {"template", "name", "type", "id", "kit", "theme", "accent", "accents", "ground", "icon", "image", "src", "url", "voice", "assets",
        "terms", "transition", "style", "colors", "bus", "art", "classification", "lang", "kind", "upload", "file", "path", "font", "badge",
        "display", "unit", "value", "size", "layout", "direction", "_def", "music", "highlight", "seed", "marking_pos", "format", "qr",
        "intro", "dir", "pattern", "start", "end", "date", "audio", "cue", "cues", "sting", "bed", "walkup", "scene", "scenes_type"}
HEADING = {"title", "headline", "heading", "h", "subtitle", "kicker", "label_heading"}
SPOKEN = {"narration", "say", "announce", "voiceover", "voice_over", "script", "spoken"}
SCREEN_LIMITS = {"title": (8, 12), "headline": (8, 12), "heading": (8, 12), "kicker": (6, 10), "sub": (16, 24), "subtitle": (16, 24)}
BULLET_KEYS = {"points", "bullets", "items"}
FIXED = [v for k, v in INTROS.get("fixed_lines", {}).items() if not k.startswith("$")]

NARRATION = [
    ("error", "wayfinding: announces the film, chapter or part", r"\b(this|the next|that) (film|chapter|part|section|video)\b|\bchapter (one|two|three|four|five)\b|\bin this (film|video|chapter)\b"),
    ("error", "wayfinding: count announcement", r"\b(we learned|it takes|there are) (two|three|four|five|six) (things|lessons|steps)\b|\b(two|three|four|five|six) (cases|measures|things|lessons) (answer|show|tell)\b"),
    ("error", "wayfinding: 'here is' / 'this is what'", r"\bhere(?: is|'s|’s) (how|what|the)\b|\bthis is what\b"),
    ("error", "wayfinding: 'the answer is'", r"\bthe answer is\b(?!\s+\w+ed\b)"),
    ("error", "wayfinding: 'next is' / 'next,'", r"^next (is|are)\b|^next,|\bcoming up next\b"),
    ("error", "softener", r"\b(simply|just|really|honestly|quietly|basically)\b"),
    ("error", "slogan", r"\bfloor, not a ceiling\b|\bthe rule is simple\b|\bsuggest, never decide\b"),
    ("error", "dramatic colon", r"\b(comes down to|one number|one thing|the key)\b[^.]*:"),
    ("error", "digits in narration (write numbers as they are said)", r"\d"),
    ("error", "parenthesis in narration", r"[()]"),
    ("error", "semicolon in narration (write two sentences)", r";"),
    ("error", "dash in narration (use a comma or a full stop)", r"—|\s–\s|\s-\s"),
    ("warn", "question in narration (only one staged question per turn, in argument films)", r"\?"),
    ("warn", "hyphenated number word (write 'forty five': a hyphen breaks cues)", r"\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)-(one|two|three|four|five|six|seven|eight|nine)\b"),
    ("warn", "say 'select', not 'click'", r"\bclick(s|ed|ing)?\b"),
    ("warn", "say 'automatically', not 'in code'", r"\bin code\b"),
    ("warn", "pronoun opening (repeat the noun)", r"^(it|they|this|these|that|those|he|she)\b(?! is (true|why))"),
    ("warn", "unowned we/our/us (name the actor)", r"\b(we|our|us|ourselves)\b"),
    # owner, film #15 (2026-11-13): "This language isn't helpful." Name who does what to what; no teaser, idiom or mood openings
    ("warn", "teaser: a colon in narration (say who does what to what in one sentence)", r":"),
    ("warn", "teaser or idiom ('runs on', 'it all', 'one thing'): name who does what to what", r"\bruns? on\b|\bit all\b|\bone thing\b"),
    # owner, film #12 (2026-11-13): "Stop hedging on what I'm saying." Describe the end product; state the owner's claims plainly
    ("warn", "hedging: describe the end product and state the owner's claims plainly", r"\b(prototypes?|planned|concepts?|could|the owner (states|says|claims))\b"),
    # owner, film #16 (2026-11-14): "A business case doesn't ask for anything." A document, record or idea is never the actor:
    # a person or the system acts on it
    ("warn", "a thing as the actor: a person or the system does this (a document does not ask, a request does not land)",
     r"\b(business case|charter|case|request|file|files|notes|slides|section|document|process|plan|record|claim|gap|list|report)s? "
     r"(asks?|wants?|says?|tells?|names?|decides?|disagrees?|agrees?|lands?|renews?|needs?|shows?|lists?|came from|sets? out|turns?)\b"),
]
INTRO_PRAISE = ("error", "praise in an introduction (name, title, organization only)",
                r"\b(distinguished|renowned|esteemed|illustrious|visionary|thought leader|rock ?star|legendary|needs no introduction|without further ado|very special guest|put your hands together|give it up for|get ready for)\b")
HEADING_PLAIN = ("warn", "heading is not a plain label (no 'and what', commas or end punctuation)", r",|\band what\b|[.!?:]$")
AI_AGENT = ("error", "say 'AI agent' (staff are also called agents)", r"(?<![Aa][Ii] )\b[Aa]gents?\b")
SPELLING = {  # US or -ise form -> Canadian Press form
    "color": "colour", "colors": "colours", "colored": "coloured", "center": "centre", "centers": "centres", "behavior": "behaviour",
    "behaviors": "behaviours", "favorite": "favourite", "honor": "honour", "labor": "labour", "neighbor": "neighbour", "catalog": "catalogue",
    "programme": "program", "programmes": "programs", "organise": "organize", "organised": "organized", "organisation": "organization",
    "organisations": "organizations", "recognise": "recognize", "prioritise": "prioritize", "optimise": "optimize", "realise": "realize",
    "summarise": "summarize", "finalise": "finalize", "minimise": "minimize", "maximise": "maximize", "standardise": "standardize",
    "utilise": "use", "analyse": None, "defense": "defence", "offense": "offence", "traveled": "travelled", "modeling": "modelling",
    "canceled": "cancelled", "fulfill": "fulfil", "enrollment": "enrolment",
}
MINOR = {"a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "at", "by", "with", "from", "as", "is", "are", "vs"}


def strings(o, path=""):
    if isinstance(o, dict):
        for k, v in o.items():
            if k.startswith("$") or k in SKIP or k.lower().endswith("cue"):
                continue
            if k in ("title", "name") and not path:      # a spec's or file's own title is metadata, not screen text
                continue
            yield from strings(v, f"{path}.{k}" if path else k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(o, str) and re.search(r"[A-Za-z]{2}", o):
        yield path, re.sub(r"\*\*|==", "", o)


def leaf(path):
    return re.sub(r"\[\d+\]", "", path.split(".")[-1])


def parent_key(path):
    parts = [re.sub(r"\[\d+\]", "", p) for p in path.split(".")]
    return parts[-2] if len(parts) > 1 else ""


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.?!])\s+|\n+", text) if s.strip()]


def nwords(s):
    return len(re.findall(r"[\w'’-]+", s))


def title_case(s):
    """True when a heading capitalizes ordinary words (Title Case), not counting the first word, proper titles or acronyms."""
    t = s
    for p in PROPER_TITLES + [e["term"] for e in LEXICON]:
        if p:
            t = t.replace(p, "")
    ws = [w for w in re.findall(r"[A-Za-z][\w'’-]*", t)[1:] if w.lower() not in MINOR]
    caps = [w for w in ws if w[0].isupper() and not w.isupper() and len(w) > 3]
    return len(ws) >= 2 and len(caps) >= 2 and len(caps) / len(ws) >= 0.6


def template_regex(tpl):
    """'Please welcome {name}, {role}[, {org}].' -> a regex that accepts any slot text and drops optional parts."""
    out, i = "", 0
    while i < len(tpl):
        c = tpl[i]
        if c == "[":
            j = tpl.index("]", i)
            out += "(?:" + template_regex(tpl[i + 1:j]) + ")?"
            i = j + 1
        elif c == "{":
            j = tpl.index("}", i)
            out += r".+?"
            i = j + 1
        else:
            out += re.escape(c)
            i += 1
    return out


INTRO_RX = {x["id"]: (re.compile("^" + template_regex(x["template"]).replace(r"\ ", r"\s+") + ("" if x.get("pattern_only") else "$"), re.S), x)
            for x in INTROS.get("intros", []) if x.get("template")}


def check_intros(o, add, path=""):
    """Objects tagged "intro": "<id>" must say their formula (brand/voice/intros.json)."""
    if isinstance(o, dict):
        if isinstance(o.get("intro"), str):
            iid = o["intro"]
            text = next((o[k] for k in ("narration", "say", "line", "announce", "text") if isinstance(o.get(k), str)), None)
            entry = next((x for x in INTROS.get("intros", []) if x["id"] == iid), None)
            if entry is None:
                add("error", f"unknown intro formula '{iid}' (brand/voice/intros.json)", path or "(root)", "")
            elif entry.get("owner_only"):
                add("warn", f"'{iid}' is owner-only: the text must be the owner's words, unchanged", path or "(root)", text or "")
            elif text is not None:
                body = text.strip()
                rx, x = INTRO_RX[iid]
                head = body if not x.get("pattern_only") else body
                if not rx.search(head):
                    add("error", f"intro '{iid}' does not follow its formula: {x['template']}", path or "(root)", body)
                first = sentences(body)[: len(sentences(x["template"].replace("{", "").replace("}", "")))] if body else []
                if nwords(" ".join(first)) > x.get("max_words", 99):
                    add("error", f"intro '{iid}' over {x['max_words']} words", path or "(root)", body)
        for k, v in o.items():
            if not k.startswith("$"):
                check_intros(v, add, f"{path}.{k}" if path else k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            check_intros(v, add, f"{path}[{i}]")


def check_tiles(o, add, path=""):
    """A tile's label under a number is a caption (7 words, limit 14). Under a tile title it is body text, checked as prose."""
    if isinstance(o, dict):
        if isinstance(o.get("label"), str) and "value" in o and not o.get("title"):
            n = nwords(o["label"])
            if n > 14:
                add("error", f"label of {n} words under a number (screen text: aim 7, limit 14)", f"{path}.label", o["label"])
            elif n > 7:
                add("warn", f"label of {n} words under a number (screen text: aim 7 or fewer)", f"{path}.label", o["label"])
        for k, v in o.items():
            if not k.startswith("$"):
                check_tiles(v, add, f"{path}.{k}" if path else k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            check_tiles(v, add, f"{path}[{i}]")


def check_lists(o, add, path=""):
    if isinstance(o, dict):
        for k, v in o.items():
            p = f"{path}.{k}" if path else k
            if k in BULLET_KEYS and isinstance(v, list) and len(v) > 5 and all(isinstance(x, (str, dict)) for x in v):
                kinds = {o.get("type"), o.get("kind")}
                if not kinds & {"agenda", "timeline", "table", "stickers", "lanyard", "people", "icons", "waffle", "map", "network", "tree"}:
                    add("warn", f"{len(v)} items in one list (screen text: at most five)", p, "")
            check_lists(v, add, p)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            check_lists(v, add, f"{path}[{i}]")


# Official event wording printed on the invites, the compliant template and the motion library (brand/tokens/tokens.json "event").
# These lines are the owner's, so the lint accepts them exactly as written ("How do you fuel velocity?", "Research & the Future AI Economy").
def _official():
    try:
        ev = json.loads((Path(__file__).resolve().parents[2] / "brand/tokens/tokens.json").read_text(encoding="utf-8"))["event"]
    except Exception:
        return frozenset()
    out = set()
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if not k.startswith("$"): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
        elif isinstance(o, str) and o.strip():
            out.add(o.strip())
            for part in o.split(":"):   # "Alberta Velocity: Full Speed Ahead" is often set on two lines
                if part.strip(): out.add(part.strip() + (":" if part is not o.split(":")[-1] else ""))
    walk(ev)
    cfd = ev.get("callForDemos", {})
    if cfd: out.add(f"{cfd.get('kicker', '')} {cfd.get('title', '')}".strip())
    return frozenset(out)
OFFICIAL = _official()


def lint_text(field, text, add, ai_agent=False, owner=frozenset(), heard=None):
    """Check one string. field is its JSON path; the last key decides which rules apply."""
    if text.strip() in OFFICIAL:   # the event's own printed wording (tokens.json "event"): never flagged
        return
    key, pkey = leaf(field), parent_key(field)
    is_heading = key in HEADING
    spoken = key in SPOKEN
    if heard is not None:
        heard.append(text.lower())
    for s in sentences(text):
        if s in owner:
            continue
        low = s.lower()
        fixed = any(s.startswith(f) for f in FIXED)
        for w in RULES["words_error"]:
            if re.search(r"\b" + re.escape(w.lower()) + r"\b", low):
                add("error", f"banned word: {w}", field, s)
        for w in RULES["words_warn"]:
            if re.search(r"\b" + re.escape(w.lower()) + r"\b", low):
                add("warn", f"word to check: {w}", field, s)
        for grp, sev in (("phrases_error", "error"), ("phrases_warn", "warn"), ("openers_error", "error"), ("structures_error", "error"), ("structures_warn", "warn")):
            for r in RULES[grp]:
                heading_rule = "heading" in r["label"] or r["pattern"].startswith("^#") or r["label"] == "listicle-heading"
                if heading_rule and not is_heading:
                    continue
                probe = ("## " + s) if r["pattern"].startswith("^#") else s
                try:
                    if re.search(r["pattern"], probe, re.I | re.M):
                        add(sev, f"{r['label']}", field, s)
                except re.error:
                    pass
        n = nwords(s)
        if spoken:
            if n > 25:
                add("error", f"spoken sentence of {n} words (limit 25)", field, s)
            for sev, name, rx in NARRATION:
                if fixed and name.startswith("wayfinding"):
                    continue
                if re.search(rx, s, re.I if not name.startswith("dash") else 0):
                    add(sev, name, field, s)
        elif n > LIM["sentence_words_error"]:
            add("error", f"sentence of {n} words (limit {LIM['sentence_words_error']})", field, s)
        elif n > LIM["sentence_words_warn"]:
            add("warn", f"sentence of {n} words (aim under {LIM['sentence_words_warn']})", field, s)
        if re.search(INTRO_PRAISE[2], s, re.I):
            add(INTRO_PRAISE[0], INTRO_PRAISE[1], field, s)
        for us, ca in SPELLING.items():
            if ca and re.search(r"\b" + us + r"\b", low):
                add("warn", f"spelling: '{us}' (Canadian: '{ca}')", field, s)
        if "!" in s and key not in ("url",):
            add("warn", "exclamation mark", field, s)
        if ai_agent and re.search(AI_AGENT[2], s):
            add(AI_AGENT[0], AI_AGENT[1], field, s)
    # whole-string rules
    if key in SCREEN_LIMITS and not spoken:
        warn_at, err_at = SCREEN_LIMITS[key]
        n = nwords(text)
        if n > err_at:
            add("error", f"{key} of {n} words (screen text: aim {warn_at}, limit {err_at})", field, text)
        elif n > warn_at:
            add("warn", f"{key} of {n} words (screen text: aim {warn_at} or fewer)", field, text)
    if pkey in BULLET_KEYS or (key == "text" and pkey in BULLET_KEYS):
        n = nwords(text)
        if n > 12:
            add("warn", f"bullet of {n} words (screen text: 7 or fewer)", field, text)
    if is_heading and key in ("title", "headline", "heading"):
        if re.search(HEADING_PLAIN[2], text.strip()):
            add(HEADING_PLAIN[0], HEADING_PLAIN[1], field, text)
        if title_case(text):
            add("warn", "heading in Title Case (use sentence case: capitalize the first word and proper names)", field, text)
    if spoken:
        for e in LEXICON:
            if e.get("status") == "verify" and e.get("kind") in ("place", "venue", "event") and e["write"].lower() in text.lower():
                add("info", f"pronunciation not yet checked: {e['write']} (say {e['say'] or 'as written'}; brand/voice/lexicon.json)", field, text)


def lint_file(f, ai_agent=False, owner=frozenset()):
    data = json.loads(Path(f).read_text(encoding="utf-8"))
    out = []
    add = lambda sev, rule, field, text: out.append({"file": str(f), "severity": sev, "rule": rule, "field": field, "text": (text or "")[:160]})
    dashes = 0
    for field, text in strings(data):
        dashes += text.count("—")
        lint_text(field, text, add, ai_agent, owner)
    check_intros(data, add)
    check_lists(data, add)
    check_tiles(data, add)
    if dashes > LIM["em_dash_max"]:
        add("error", f"{dashes} em dashes (guide: none; use a comma, colon or full stop)", "(file)", "")
    # the same finding once per field and rule
    seen, uniq = set(), []
    for x in out:
        k = (x["severity"], x["rule"], x["field"], x["text"])
        if k not in seen:
            seen.add(k)
            uniq.append(x)
    return uniq


def main(argv):
    if "--rules" in argv:
        print("words_error", len(RULES["words_error"]), "| words_warn", len(RULES["words_warn"]), "| phrases", len(RULES["phrases_error"]) + len(RULES["phrases_warn"]),
              "| structures", len(RULES["structures_error"]) + len(RULES["structures_warn"]), "| narration", len(NARRATION) + 1,
              "| intro formulas", len(INTRO_RX), "| fixed lines", len(FIXED), "| spellings", len(SPELLING), "| screen limits", len(SCREEN_LIMITS) + 1)
        return 0
    ai = "--ai-agent" in argv
    strict = "--strict" in argv
    as_json = "--json" in argv
    show_info = "--info" in argv
    owner = set()
    if "--owner-lines" in argv:
        p = Path(argv[argv.index("--owner-lines") + 1])
        owner = {l.strip() for l in p.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")}
    files = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--owner-lines")]
    if not files:
        print(__doc__)
        return 0
    allf = []
    for f in files:
        allf += lint_file(f, ai, frozenset(owner))
    if as_json:
        print(json.dumps(allf, indent=1, ensure_ascii=False))
    else:
        for x in allf:
            if x["severity"] == "info" and not show_info:
                continue
            print(f"{x['severity'].upper():5} {Path(x['file']).name} {x['field']}: {x['rule']} | {x['text']}")
    e = sum(x["severity"] == "error" for x in allf)
    w = sum(x["severity"] == "warn" for x in allf)
    i = sum(x["severity"] == "info" for x in allf)
    if not as_json:
        print(f"{e} error(s), {w} warning(s) in {len(files)} file(s)" + (f", {i} info" if i else ""))
    return 1 if e or (strict and w) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
