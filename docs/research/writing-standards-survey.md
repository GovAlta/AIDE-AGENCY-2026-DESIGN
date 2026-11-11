# Writing and narration standards across the projects: survey

Survey made 2026-11-11 for the Agency 2026 design system. It reads every writing, narration and voice standard found under
`/mnt/data/projects` and records what each says, where they agree and conflict, what is missing, and which owner feedback shaped them.
The outcome is the layered standard in `guides/WRITING.md`, `guides/SLIDE-TEXT.md` and `guides/NARRATION.md`, with the machine-readable
parts in `brand/voice/` and the checks in `scripts/lint/lint.py` and `scripts/voice/say.py`.

## 1. Sources

| Source | Scope | Origin | Enforced by |
|---|---|---|---|
| `_styles/00-writing-style-guide.md`, `banned.json`, `BANNED-README.md` | All written deliverables | The owner's shared "Clean Writer" rules, built from real faults | `banned.json` read by `lib/sloplint.mjs` (charter project) and now `scripts/lint/lint.py` |
| Copies of the same guide: `AILI/docs/WRITING-STYLE-GUIDE.md`, `mars/STYLE_GUIDE.md`, `AIDE-TEC-MODERNIZATION-HSR/portal/video/WRITING-STYLE-GUIDE.md` (identical to `_styles`), `alberta-simulator`, `aidc-int`, `epa-rtr`, `capstone`, `k12`, `procurement-as-code` (`00-writing-style-guide.md`) | Per project | Copied from `_styles`; AILI and mars are older copies without the "Clarity for a mixed audience" section | None, or a project copy of the lint |
| `servicenow/bill-26/video/EXPLAINER-STYLE.md` (= `arlo/.../video-kit/base/EXPLAINER-STYLE.md`); variant `remoodle/packages/video-studio/style/EXPLAINER-STYLE.md` | Narrated explainers of prototypes and systems | The client's rules from vetting the TSA, ACCTS, AREPS and media-intelligence scripts, 2026-09-29 and 30; 40 numbered rules, each tied to a client edit | `tools/explainer-lint.mjs` (deterministic), `explainer-review.mjs` (model review), fixed lines in `video/project.json` |
| `.claude/skills/mg-bill26-narration-standards`, `mg-orpheus-narration-standards`, `remoodle/.claude/skills/narration-standards` | Short forms of the explainer guide per project | Vendored | The project lints |
| `L4-ai-maximalist-story/docs/VIDEO-STYLE-GUIDE.md` (+ `scripts/style_lint.py`, `cue_check.py`, `film/vidcheck.py`, `docs/owner_lines.txt`); skill `narrated-video-style` | Narrated argument films for GoA leaders | Merges MVAI's rules, the explainer guide and the owner's review of six versions of the AI Maximalist films (October 2026) | Style lint, cue check, glossary check, `no_drift()`, MVAI `check_walkthrough`, end-frame review |
| `contact-alberta/evals/audit/lib/style_lint.py`, `docs/video/agency/NOTES.md`, `owner_lines.txt`, `CHANGELOG.md` (C-56) | The Agency film, sizzle and handout | The L4 lint plus the sponsor's 2026-11-10 rules: "AI agent", plain headers, few pronouns, owned "we" | `style_lint.py`, `vidcheck.py`, `cue_check.py` |
| `aide-motion-video/pipeline/narration_check.py`, `docs/WALKTHROUGHS.md` (Voice, Writing checks), `app/video-types/instructions/*.md` | Every MVAI spec | ASD-STE100 summary plus spoken-narration rules; numbers as words, terms list, cue rules | `check_walkthrough` (error, warn, info) on every build |
| `.claude/skills/dossier-pdf/STE100.md`, `scripts/ste_check.py` | Dossier reports | ASD-STE100 working summary | `ste_check.py` |
| `atlas-alone/service/config/writing-guide.md`, `service/lib/writingguide.js`, `docs/WRITING_GUIDE.md`, `guide/writing.md` | Anything Atlas or its agents write for people | Joins the `_styles` rules and the client narration rules | A gate in front of voicing services: testable rules, then one editing pass by a model ("Fix it, don't reject", sponsor 2026-10-29) |
| `arlo-wt-hfiles/companions/_shared/narrator-voices.json`, `bill-26/video/project.json` | Voice choice | Owner decision 2026-10-11 | Read by the voice tools |
| `.claude/skills/deslop/STYLEGUIDE.md`, `style-guide/README.md` | Rewriting prose in John Muir's voice | A literary persona: 35-word sentences, six semicolons per 1,000 words | `scripts/metrics.py` |
| `.claude/skills/class-video/SKILL.md` | Class recordings | "No pronouns for the presenter or other people … unless the user states them" | Skill rules |

## 2. Two families and how they joined

1. **Prose rules (`_styles`).** Plain declarative writing; bans the shapes that read as machine-written ("not X but Y", tetracolons,
   cinematic short sentences, "this is where", participle tails, the banned vocabulary). Copied into at least ten projects; the copies drift
   (AILI and mars lack the mixed-audience section). `banned.json` is the only machine source; its README warns that a rule that flags good
   writing does more harm than the slop it catches, so context-dependent words are warnings.
2. **Narration rules (client, then owner).** The Prototype Lab vetting produced 40 rules, each from an edit the client made (define every
   proper noun, complete sentences of ten to twenty words, repeat the noun, ordinal lists that close with "Finally,", management register,
   no benefit tails, name the actor at every step). The owner's AI Maximalist review added argument structure (context and scale before
   mechanism, baselines, fair comparisons, staged questions, no wayfinding, owner-only conclusions, a glossary check) and screen rules.
   Contact Alberta added "AI agent", plain headers, few pronouns and owned "we".
3. **Joins.** Atlas's `writing-guide.md` is the first single document that joins both families; it gates scripts before voicing. MVAI's
   `narration_check.py` approximates both with STE100 limits. The L4 guide states the precedence: dictated lines, then the guide, then
   MVAI's defaults.

## 3. What worked

- **Feedback becomes a rule, and a lint where it can** (L4 guide 9.1; explainer guide "Learned from the client's … edit"). Each owner or
  client correction is quoted with its date, applied everywhere, and checked mechanically from then on. The L4 films stopped needing
  rebuilds once this loop ran.
- **A dictated-lines file** (`owner_lines.txt`) keeps the owner's words exact and exempt from the lint.
- **Fixed lines enforced by the lint** (`project.json` `lines` in bill-26; Parable's `PROFILES`). Every explainer opens and closes the
  same way, which made a set of scripts sound like one product. This is the model for the Agency introduction formulas.
- **Facts by key** (Parable films use `{fact:bench.dashboard.speedup}`; a typed figure fails the lint). Agency's equivalent is
  `tokens.json` `event` and a `NOTES.md` per piece.
- **A gate that edits once** (Atlas, 2026-10-29): rejecting a script five times wasted a day; one editing pass that keeps every fact and
  name, followed by the testable rules, kept work moving.
- **Notes files** for caveats and sources keep the narration plain while the evidence stays traceable (Contact Alberta `NOTES.md`).

## 4. Conflicts and how they were settled

| # | Conflict | Sources | Settled as |
|---|---|---|---|
| 1 | "Here's how the system works." and "Let's have a look at this system…" are required openers in the explainer guide, but "here is how" is banned wayfinding in the L4 guide | bill-26 `project.json`; L4 §4 | Allowed **only** as the fixed lines of the system-explainer shape (`intros.json` `fixed_lines`); the lint exempts those exact lines and bans the phrase everywhere else |
| 2 | Questions: Parable bans all; the explainer bans rhetorical ones; L4 allows one staged question per turn | remoodle; bill-26 rule 11; L4 §3 | One staged question per turn in **argument films** only, followed by where the answer comes from; never in introductions, explainers or headlines (a chapter card may ask the question it answers). The lint warns on every question for a person to judge |
| 3 | Number words: "twenty-six" with a hyphen (explainer, Orpheus) against "eighty one" without (L4, so cues match) | bill-26; L4 §5.4 | No hyphens in narration; the voice says both the same, and only the unhyphened form can be cued. Lint warns |
| 4 | Years: MVAI accepts digits for years; L4 writes them as words | `narration_check.py` `NUM_WORD_OK`; L4 §1.4, §5.4 | Words ("twenty twenty six"), per the owner's standard. The lint fails digits in narration. MVAI's own example specs break this and are reported, not edited |
| 5 | "We": the explainer's purpose line is "We've built this prototype…"; Contact Alberta warns on unowned "we"; L4 says give "we" its owner | bill-26 rule 19; CA C-56; L4 rule 14 | Name the actor ("The Technology and Innovation team built…"). "We" is a warning; allowed where the speaker is the named owner |
| 6 | Passive voice: STE wants active; the explainer allows passive for system actions | STE100 rule 9; explainer rule 9 | Active for people; passive allowed for system steps where the actor does not matter. MVAI reports passive as info |
| 7 | Sentence length: `_styles` warns at 30 and fails at 40; STE fails at 25 (20 for instructions); explainer aims 10–20 | `banned.json` limits; STE100; bill-26 rule 2 | Print prose: warn 30, fail 40. Narration: fail over 25, aim 10–20 |
| 8 | Dashes: `_styles` allows one em dash a file; every narration source bans them; the invites use en dashes in date ranges | `banned.json`; L4 §6.5; invites | No em dashes anywhere; en dashes only in ranges ("Dec. 7–9"); no dashes at all in narration |
| 9 | Heading case: the approved Contact Alberta handout uses Title Case ("Results on Real Calls"); MVAI screens, the compliant slide template and the motion library use sentence case ("What attendees get") | handout; `brand/pptx`; MVAI frames | Sentence case for new work; proper titles keep capitals; the approved handout stays as approved. Lint warns on Title Case |
| 10 | Parentheses: `_styles` allows them in prose; L4 bans them in narration | `_styles` §2; L4 §6.5 | Sparingly in print, never in narration or on slides |
| 11 | Spelling: sources mix "organization" and "organisation", "program" and "programme" | across repos | Canadian Press, as the Government of Alberta writes: -our, -re, licence (noun), program, and -ize. Lint warns on US and -ise forms |
| 12 | Voice: Matilda (owner decision, bill-26, IOA, Arlo, MVAI examples) against Kore (Contact Alberta's films, Parable's Gemini voice) | `narrator-voices.json`; CA C-39; remoodle | One registry (`brand/voice/voices.json`): Matilda narrates Unclassified work on `eleven_v4`; Kore only for Protected A or B, for a whole series. Announcer and alternate voices proposed for the owner to approve |
| 13 | The `/deslop` skill's Muir voice (long sentences, semicolons, dashes) is the opposite of every other standard | `deslop/STYLEGUIDE.md` | Never used on Agency text. `guides/WRITING.md` covers clean writing; "deslop" in this context means applying the WRITING guide, not the skill |
| 14 | Rejection gate against edit gate | Atlas before and after 2026-10-29 | The lint reports; a writer or one editing pass fixes; nothing loops. Owner lines are never edited |

## 5. Gaps found

1. **No introduction formulas anywhere.** No project fixed how a speaker, panel, session, demo or day is introduced, so the same event
   would introduce people in several styles. Added: `brand/voice/intros.json` (20 formulas, slots, word limits, examples), the
   "Introductions" section of `guides/NARRATION.md`, the lint's formula check and `scripts/voice/say.py`.
2. **No announcer voice or stage register.** Every voice decision was for films. Added: an announcer role (proposed) and stage formulas
   in plain present tense, with praise words failed by the lint.
3. **No pronunciation lexicon.** Only MVAI's `terms` list (acronym acceptance) and an instruction to listen. Added:
   `brand/voice/lexicon.json` with written and spoken forms and a `verify` to `checked` status, and an info note in the lint.
4. **No screen-text standard beyond "headlines under 8 words, items under 7".** Added: `guides/SLIDE-TEXT.md` with limits by field, forms
   for agendas, calls to action, lower thirds, captions and signs, and lint limits by field name.
5. **No rule for owner-only spoken moments.** Land acknowledgements, house notes, thanks and closes had no protection. Added: owner-only
   entries with no formula; the lint warns when a scene tags one, and `say.py` refuses to generate them.
6. **People's pronouns.** Only `class-video` said not to assume them. Added to the core guide and every formula: repeat the name; no
   pronoun unless the person stated it.
7. **Drifting copies.** Ten project copies of `_styles` drift. This repo keeps one attributed copy (`guides/reference/WRITING-STYLE-GUIDE.md`)
   and one machine source (`scripts/lint/banned.json`, copied from `_styles/banned.json`); refresh both together.

## 6. Voices found

| Voice | Id | Where used | Decision |
|---|---|---|---|
| Matilda (premade) | `XrExE9yKIg1WjnnlVkGX` | Hilary prototype lab, bill-26 IOA and Prototype Lab explainers, Arlo/Orpheus briefings, MVAI examples | Janak Alford, 2026-10-11, settings 0.5 / 0.75 / 0.2 / speaker boost |
| Matilda (professional clone) | `vXdn3dxpDdZHARskOYfz` | Listed by MVAI; not used | Not approved; easy to confuse with the premade |
| Kore (Google, Montréal) | `Kore` | Contact Alberta films (sponsor chose the Canada-resident voice), the MVAI screen bench render, Parable (Gemini TTS) | Allowed for Protected A/B under MVAI's classification policy |
| Zedbot (cloned) | `Gmpi6B3HbV6DUi4pxFMH` | Listed by MVAI | Not allowed without a consent record |
| Simon, Jenna (Canadian) | `FyYFoP6qNryBV7G8rnI9`, `TgnhEILA8UwUqIMi20rp` | New | Proposed 2026-11-11 for announcer and alternate; owner to approve. Both ids checked with a short clip each; the clips transcribed back word for word |

## 7. Open for the owner

1. Approve or replace the announcer (Simon) and alternate (Jenna) voices.
2. Confirm Canadian Press spelling and sentence-case headings as the house style.
3. Supply the owner-only texts for the event: house notes, the land acknowledgement and who reads it, thanks, and the closing words.
4. Decide whether the Prototype Lab fixed lines (system explainer) are the Agency demo explainer standard, or whether demos get their own
   close line.
