#!/usr/bin/env python3
"""Writing lint for Agency 2026 content files: print and digital content JSON, deck JSON and MVAI video specs.

    python3 scripts/lint/lint.py samples/print/handout.json samples/video/*.json
    python3 scripts/lint/lint.py --ai-agent --owner-lines docs/owner_lines.txt spec.json
    python3 scripts/lint/lint.py --strict deck.json          # warnings fail too
    python3 scripts/lint/lint.py --json spec.json            # machine-readable findings

Rules come from two sources:
- banned.json: the shared writing rules (copied from /mnt/data/projects/_styles/banned.json; guides/WRITING.md is the same rules
  for a person). Words, phrases, sentence openers, sentence and heading shapes, and numeric limits.
- the narrated-video rules from the Contact Alberta and AI Maximalist films (owner standard, guides/reference/VIDEO-STYLE-GUIDE.md):
  no wayfinding, no softeners, no slogans, no dramatic colons. They apply to "narration" fields only.

--ai-agent adds the Contact Alberta sponsor rule: a bare "agent" is an error, because contact-centre staff are also called agents.
--owner-lines FILE: sentences in FILE (one per line, # comments) were dictated by the owner and are never flagged.
Exit 1 on any error (or any warning with --strict).
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RULES = json.loads((HERE / "banned.json").read_text(encoding="utf-8"))
LIM = RULES["limits"]

# keys whose values are not prose
SKIP = {"template", "name", "type", "id", "kit", "theme", "accent", "accents", "ground", "icon", "image", "src", "url", "voice", "assets",
        "terms", "transition", "style", "colors", "bus", "art", "classification", "lang", "kind", "upload", "file", "path", "font", "badge",
        "display", "unit", "value", "size", "layout", "direction", "_def", "music", "highlight", "seed", "marking_pos", "format", "qr"}
HEADING = {"title", "headline", "heading", "h", "subtitle", "kicker", "label_heading"}

NARRATION = [
    ("error", "wayfinding: announces the film, chapter or part", r"\b(this|the next|that) (film|chapter|part|section|video)\b|\bchapter (one|two|three|four|five)\b"),
    ("error", "wayfinding: count announcement", r"\b(we learned|it takes|there are) (two|three|four|five|six) (things|lessons|steps)\b"),
    ("error", "wayfinding: 'here is' / 'this is what'", r"\bhere(?: is|'s) (how|what|the)\b|\bthis is what\b"),
    ("error", "wayfinding: 'the answer is'", r"\bthe answer is\b"),
    ("error", "wayfinding: 'next is' / 'next,'", r"^next (is|are)\b|^next,"),
    ("error", "softener", r"\b(simply|just|really|honestly|quietly)\b"),
    ("error", "slogan", r"\bfloor, not a ceiling\b|\bthe rule is simple\b"),
    ("error", "dramatic colon", r"\b(comes down to|one number|one thing|the key)\b[^.]*:"),
    ("warn", "pronoun opening (repeat the noun)", r"^(it|they|this|these|that|those|he|she)\b(?! is (true|why))"),
    ("warn", "unowned we/our/us (name the actor)", r"\b(we|our|us|ourselves)\b"),
]
HEADING_PLAIN = ("warn", "heading is not a plain label (no 'and what', commas or end punctuation)", r",|\band what\b|[.!?:]$")
AI_AGENT = ("error", "say 'AI agent' (staff are also called agents)", r"(?<![Aa][Ii] )\b[Aa]gents?\b")


def strings(o, path=""):
    if isinstance(o, dict):
        for k, v in o.items():
            if k.startswith("$") or k in SKIP or k.lower().endswith("cue"):
                continue
            yield from strings(v, f"{path}.{k}" if path else k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(o, str) and re.search(r"[A-Za-z]{2}", o):
        yield path, re.sub(r"\*\*|==", "", o)


def leaf(path):
    return re.sub(r"\[\d+\]", "", path.split(".")[-1])


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.?!])\s+|\n+", text) if s.strip()]


def lint_file(f, ai_agent=False, owner=frozenset()):
    data = json.loads(Path(f).read_text(encoding="utf-8"))
    out = []
    add = lambda sev, rule, field, text: out.append({"file": str(f), "severity": sev, "rule": rule, "field": field, "text": text[:160]})
    dashes = 0
    words_err = [w for w in RULES["words_error"]]
    for field, text in strings(data):
        key = leaf(field)
        is_heading = key in HEADING
        dashes += text.count("—")
        for s in sentences(text):
            if s in owner:
                continue
            low = s.lower()
            for w in words_err:
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
            n = len(re.findall(r"[\w'’-]+", s))
            if n > LIM["sentence_words_error"]:
                add("error", f"sentence of {n} words (limit {LIM['sentence_words_error']})", field, s)
            elif n > LIM["sentence_words_warn"]:
                add("warn", f"sentence of {n} words (aim under {LIM['sentence_words_warn']})", field, s)
            if key == "narration":
                for sev, name, rx in NARRATION:
                    if re.search(rx, s, re.I):
                        add(sev, name, field, s)
            if is_heading and key in ("title", "headline", "heading") and re.search(HEADING_PLAIN[2], s):
                add(HEADING_PLAIN[0], HEADING_PLAIN[1], field, s)
            if ai_agent and re.search(AI_AGENT[2], s):
                add(AI_AGENT[0], AI_AGENT[1], field, s)
    if dashes > LIM["em_dash_max"]:
        add("error", f"{dashes} em dashes (guide: none; use a comma, colon or full stop)", "(file)", "")
    return out


def main(argv):
    ai = "--ai-agent" in argv
    strict = "--strict" in argv
    as_json = "--json" in argv
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
            print(f"{x['severity'].upper():5} {Path(x['file']).name} {x['field']}: {x['rule']} | {x['text']}")
    e = sum(x["severity"] == "error" for x in allf)
    w = len(allf) - e
    if not as_json:
        print(f"{e} error(s), {w} warning(s) in {len(files)} file(s)")
    return 1 if e or (strict and w) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
