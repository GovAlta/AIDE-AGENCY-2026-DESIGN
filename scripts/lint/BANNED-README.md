# The banned list

`banned.json` is the only rule source the linter reads. `00-writing-style-guide.md`
is the same rules written for a person. When the two disagree, the guide is the
intent and `banned.json` is the part a machine can check.

This file explains what the rules do, how to run them, and how to review with them
when you are an AI rather than a regex.

## What the file holds

| Group | Shape | Count |
|---|---|---|
| `words_error` | a plain word, matched on a word boundary | 39 |
| `words_warn` | the same, where context sometimes allows it | 71 |
| `phrases_error` | `{pattern, label}`, a case-insensitive regex | 62 |
| `phrases_warn` | the same, for a person to judge | 34 |
| `openers_error` | tested against the start of every line | 4 |
| `structures_error` | sentence and heading shapes | 19 |
| `structures_warn` | shapes that are sometimes correct | 17 |
| `limits` | numeric ceilings: sentence length, em dashes, cadence | 6 |

Every pattern is compiled with the `gi` flags in `lib/sloplint.mjs`. Case-sensitive
rules are impossible, so a rule can never key on capitalisation. Write patterns that
match the shape of the sentence.

## Severity

An error blocks a write. `lib/charter.mjs` refuses the section and the text never
reaches `data/charter.json`.

A warning is reported and a person decides. Report warnings to the user rather than
rewriting on your own. The project's own documentation carries between 4 and 33
warnings per file and 0 errors, which is the intended state.

An error is for a construction that is wrong in every context. A word with a real
technical sense stays a warning, because the author may mean the technical sense.

```
significant    warn    a statistician means something by it
world class    error   nobody means anything by it
```

Examples of banned wording belong in a table or a fenced block. Markdown tables and
code fences are stripped before linting, so a rejected phrase can be shown without
failing the file it appears in.

## Running it

```bash
npm run slopcheck                            # every sentence in the artifact
npm run slopcheck -- --json                  # the same, machine readable
npm run slopcheck -- --strict                # exit non-zero on warnings too
npm run slopcheck -- --file CLAUDE.md        # any file, markdown furniture stripped
npm run slopcheck -- --file out/ledger.md
```

Markdown files have their tables and code fences removed first, so the cadence
checks read prose and not reference material.

### One string

```bash
node --input-type=module -e "
const {lint,loadRules}=await import('./lib/sloplint.mjs');
loadRules('styles/banned.json');
const r=lint('This marks a turning point for the program.','probe');
console.log(r.errors, r.warnings);
r.findings.forEach(f=>console.log(f.severity, f.rule, JSON.stringify(f.match)));
"
```

### One rule on its own

Useful when you are drafting a rule and want to know what it catches before you
add it. Point it at the corpus you care about.

```bash
node --input-type=module -e "
import fs from 'node:fs';
const PATTERN='\\\\bthis (marks|represents|signals|heralds|ushers in)\\\\b';
const re=new RegExp(PATTERN,'gi');
const text=fs.readFileSync('CLAUDE.md','utf8');
text.split(/\r?\n/).forEach((line,i)=>{
  re.lastIndex=0;
  if(re.test(line)) console.log((i+1)+': '+line.trim());
});
"
```

### Every rule of one label

```bash
node -e "
const j=require('./styles/banned.json');
const label=process.argv[1];
for (const key of ['phrases_error','phrases_warn','structures_error','structures_warn'])
  j[key].filter(e=>e.label===label).forEach(e=>console.log(key+'  '+e.pattern));
" metaphoric-announcement
```

### What the linter reports

`lint()` returns a report. Each finding names the rule that fired, the text it
matched, and the line it sits on.

```
report   { where, findings, errors, warnings, clean }
finding  { severity, kind, rule, match, line, excerpt }
kind     word | phrase | opener | structure
```

Read `kind` to tell a regex hit from one of the counting rules.

`lintCharter(charter)` runs the same rules over every prose surface in the artifact.
Table cells are included, because a cell is prose too.

`styleBriefing()` returns the rules as a short instruction block. Drafting agents get
this in their system prompt, so a model is told the rules before it writes rather than
only after.

## The limits of a regex

A regex catches a shape. It cannot catch a sentence that is grammatically clean and
says nothing. Three real examples from this project, all of which passed the linter:

- "Every other decision in the build follows from this one."
- "The right column is the part that needs judgement."
- "The tall bar is the point."

None of those trips a rule. All three are the writing the guide exists to prevent.
Adding a rule for them is not possible, because vacuity is a judgement about meaning
rather than a pattern in the characters.

So the linter is the floor and not the ceiling. Run it, then read the text yourself
against the four intents below.

## The four intents

These are what the rules are trying to protect. When you review as an AI, judge
against the intent, and treat a clean linter run as no evidence either way.

### Metaphoric announcement

A claim arriving as a figure of speech instead of a fact. The reader is told
something is important without being told what happened.

Rules with this label:

```
metaphoric-announcement   dead-metaphor   banned-idiom   drama
```

| Rejected | Correct |
|---|---|
| "This marks a turning point for the program." | "The service opened to applicants on 6 April 2026." |
| "The platform unlocks value across the ministry." | "The platform removes four manual reconciliation steps." |
| "This lays the groundwork for a step change in delivery." | "This replaces the paper form with an online one." |
| "The reform paves the way for faster service." | "Turnaround falls from 34 days to 20." |

The test: strike the metaphor and see what is left. If nothing is left, the sentence
carried no information.

### Clickbait and the withheld subject

A heading or a line that promises a payoff instead of naming its content. Rules:

```
listicle-heading          listicle-heading-clause   listicle-heading-verb
teaser-tail-heading       count-hook-heading        count-question-heading
heading-participial-tail  withheld-subject-heading  reader-directive-heading
stock-dramatic-heading    why-x-why-now-heading     counting-announcement
```

| Rejected | Correct |
|---|---|
| "Five Inputs That Changed the Build" | "Comments That Changed the Code" |
| "The Three Rules It Enforces" | "The Rules the Builder Enforces" |
| "Two Ways the Schema Is Enforced" | "Enforcing the Schema" |
| "The 05:21 Brief, and What It Produced" | "The Overnight Brief" |
| "The Build, in Four Numbers" | "Session Totals" |
| "Everything That Went In" | "The Starting Files" |
| "What Has to Pass Before It Ships" | "The Checks Before Release" |
| "The Thirty Eight Inputs, Classified" | "The Input Categories" |

A count in a heading is fine when the heading is a bare noun phrase. "The five
states" and "The three sentences" are correct, because the count is part of what the
heading names. It goes wrong when a clause hangs off the count and holds the payoff
back, as in "Five Inputs That Changed the Build".

The test: could a reader who sees only the heading say what is on the page? If the
heading makes them read on to find out, rewrite it.

### Drama and enticement

Government documents are read by people deciding whether to spend money. Nothing in
them should work by building anticipation. Rules:

```
drama                     grand-opening             cta-today-urgency
wont-wait-urgency         urgency-cta-now           empty-superlative
cannot-be-overstated      signpost                  teaser-filler
rhetorical-question-cta   no-more-anaphora          here-today-stagesetting
```

Four more shapes are forbidden, and each has a rule behind it:

- a cinematic run of short sentences
- a four-part parallel listing
- a rule of three used for rhythm
- the negated contrast, "this is not A, it is B"

The guide calls the last one the most reliable marker of machine prose.

| Rejected | Correct |
|---|---|
| "The window is open. The leverage is real. The plan uses both." | "The submission closes on 15 October, and this plan meets that date." |
| "This is not a communications exercise. It is operational necessity." | "The change is required by the new regulation." |
| "The importance of this cannot be overstated." | "Without it, 14,200 applications stay on paper." |
| "Apply today and skip the queue." | "Applications open on 6 April." |

### Verb-final cadence

A model tends to close a sentence on the verb of a relative clause, or on a stranded
preposition, or on an agentless passive. Each is grammatical. In a run they make prose
that sounds translated. Rules, all of them warnings:

```
verb-final-relative   terminal-stranded-preposition
terminal-agentless-passive   participial-tail
```

| Rejected | Correct |
|---|---|
| "The tool redrafts the sections it answers." | "The tool finds the sections a statement answers, then redrafts them." |
| "Every claim records where it came from." | "Every claim carries a link to its source." |
| "Every quote is checked against the file." | "The extraction pass checks every quote against its file." |
| "The ones that do not match are dropped." | "It discards the ones that do not match." |
| "This holds the document honest, keeping every claim sourced." | "This keeps every claim sourced." |

These three rules fire 19 times across 2,143 sentences of this project's own writing,
so a hit is a prompt to look rather than a verdict. The fix is almost always to name
the actor and put the verb earlier.

## Reviewing as an AI

Run the linter first, because it is free and exact. Then do the pass it cannot do.

1. **Fix every error.** An error is not a matter of taste. Rewrite the sentence.
2. **Report every warning with a recommendation.** Say which ones you would change
   and why. Do not silently rewrite: a warning exists because the author may have
   meant it.
3. **Read each heading against its page.** Ask whether it names the content. A
   heading that could sit on a different page is wrong even when it lints clean.
4. **Read each sentence for what it asserts.** If you cannot state the fact the
   sentence delivers, delete the sentence. This is the check that finds the vacuous
   writing no rule can see.
5. **Strike every metaphor and read what is left.** If the sentence collapses, the
   metaphor was carrying it.
6. **Read the closing sentence of every section.** If it restates the section, cut
   it. The guide is explicit: end at the period.
7. **Read the whole thing aloud.** If a sentence sounds like a trailer, a conference
   talk, or a post, rewrite it. The target voice is a competent senior official
   briefing a peer.
8. **Read it once more as a non-specialist.** If a sentence is noise to that reader,
   it is the wrong sentence however accurate it is.

When you rewrite, replace the flourish with a number, a date, a name or an action.
Every table above works the same way: the correct column is shorter and carries a
fact the rejected column withheld.

## Adding a rule

A rule that flags correct writing does more damage than the slop it catches, because
people start ignoring the linter. So test before you add.

1. Write the pattern and a label. The label is what a reviewer reads, so name the
   defect and not the fix.
2. Collect the shapes it should catch, and a set of correct lines it must leave alone.
   Include this project's own documentation in the second set.
3. Run the pattern over both. A candidate earns a place when it catches its shape and
   fires on nothing correct.
4. Choose the severity. If you cannot defend blocking a write over it, it is a warning.
5. Add it to the matching group, then confirm the whole file still compiles and the
   documentation still reports 0 errors:

```bash
node -e "
const j=require('./styles/banned.json');
let bad=0;
for (const k of ['words_error','words_warn','phrases_error','phrases_warn','openers_error','structures_error','structures_warn'])
  for (const e of j[k]) { const p=typeof e==='string'?e:e.pattern;
    try { new RegExp(p,'gi'); } catch(err){ console.log('BROKEN '+k+': '+p); bad++; } }
console.log(bad?bad+' broken':'every pattern compiles');
"
npm run slopcheck -- --file CLAUDE.md
npm run evals
```

Two rules were rejected during this project for failing step 3. A bare count heading
rule flagged nine correct headings in these docs. One of them was "The five states".
A paired count rule could not separate two shapes:

```
One Session, Two Sittings           rhythm, and wrong
Seven parts, twenty four sections   a fact, and correct
```

No pattern tells those apart, so that shape stays a judgement call. The review pass
above is where it gets made.

## What the linter cannot see

Keep these in mind, because no rule covers them:

- a sentence that is clean and empty
- a heading that lints clean and describes a different page
- a correct claim with no source behind it, which is what `/trace` is for
- a figure that is wrong, which is what the evidence ledger is for
- a document that is 40 percent blank, which is what coverage on the cover is for

The linter checks how a sentence is built. Whether it should exist is still your call.
