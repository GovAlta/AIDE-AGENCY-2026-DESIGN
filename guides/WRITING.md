# Writing for Agency 2026 media

These rules apply to every word in Agency media: handouts, posters, slides, banners, social posts, captions and video narration. They come
from two sources:

- the shared writing style guide, `/mnt/data/projects/_styles/00-writing-style-guide.md` (copy in `reference/WRITING-STYLE-GUIDE.md`),
  and its machine-checkable list, `banned.json` (copy in `scripts/lint/banned.json`, explained in `scripts/lint/BANNED-README.md`);
- the sponsor's reviews of the Contact Alberta Agency film and handout (November 2026) and the owner's reviews of the AI Maximalist films
  (October 2026, `reference/VIDEO-STYLE-GUIDE.md`).

When the two disagree, the owner's video standard wins for narration, and the shared guide wins for everything else. Lines the content
owner dictates are used word for word and are never "corrected".

Run the lint on every content file before you deliver:

```bash
python3 scripts/lint/lint.py samples/print/my-handout.json            # 0 errors required
python3 scripts/lint/lint.py --ai-agent my-video.json                 # add the "AI agent" rule when staff are also called agents
python3 scripts/lint/lint.py --owner-lines owner_lines.txt my.json    # dictated lines are never flagged
```

A clean lint is the floor. Read the text yourself afterwards against the rules below, because a regular expression cannot tell a sentence
that says nothing from one that says something.

## Facts

1. **Use only the facts you were given.** Never invent a name, number, date, quote, result, place or event detail. If a template needs
   something the brief does not give, leave it out or ask.
2. **Every figure has a source.** Keep a `NOTES.md` next to the content file with one row per figure: the figure as printed, the source
   file or document, and the line or table it comes from. The Contact Alberta record (`contact-alberta/docs/video/agency/NOTES.md`) is
   the model.
3. **One set of figures across all media.** The film, the handout and the slides use the same numbers from the same run. When a figure
   changes, change it everywhere. The sponsor's words on Contact Alberta were "re render so all the materials stay harmonious".
4. **Example values are labelled.** A sample chart or a device screen shows generic labels ("Region A", "Sample Park") and says
   "Example values" or "Synthetic data" on screen.
5. **Conclusions belong to the owner.** Lessons, asks, credit for results and closing statements come from the content owner. The writer
   drafts none of them unprompted.
6. **Classification comes from the owner.** Default to Unclassified, and never infer a level from the material.

## Plain language

- Write so a thoughtful person outside the field can follow on the first read.
- One idea per sentence. Mostly short and medium sentences; the lint warns at 30 words and fails at 40.
- Lead with the plain point, then explain.
- Name the actor and use the active voice: "The AI agent checks every number", not "Every number is checked".
- Define each technical term the first time it appears, in plain words ("**Hill climbing** means measuring, changing one thing, and
  keeping the change only when the measure improves").
- Never cram a list into a sentence. More than three items go in a table, a tile row or bullets.
- Numbers are concrete and honest. Round when rounding is honest ("about 2.5 million"), and do not use numbers as decoration.

## Shapes that are banned

| Banned shape | Example of the fault | Write instead |
|---|---|---|
| Negated contrast, "not A, but B" | "This is not a pilot. It is a program." | "The program runs in three ministries." |
| Em dashes | "The agent — fast and careful — answers" | Use a comma, a colon or two sentences |
| Rule of three or four for rhythm | "Faster. Smarter. Safer." | Say what changed, with the number |
| Cinematic short sentences | "The window is open. The plan is ready." | One sentence with normal cadence |
| "This is the moment", "this is where" | "This is where it comes together." | Say what the step delivers |
| Participle tail | "…answers in a second, demonstrating its speed." | Stop at the full stop |
| Slogans and closing lines | "Every answer sourced. Every number checked." | Use the owner's own closing words, or none |
| Openers | Moreover, Furthermore, In essence, At its core, It is worth noting | Cut the opener |
| Intensifiers | very, really, truly, deeply, incredibly, particularly | Strengthen the claim instead |
| Softeners | simply, just, honestly, quietly | Cut them |
| Emojis and decorations | | None, anywhere |

The banned vocabulary (leverage, unlock, seamless, robust, landscape, ecosystem, journey as a metaphor, game-changing, world-class and the
rest) is listed in `scripts/lint/banned.json`. Replace each with a plainer word that carries the meaning.

## Headings and on-screen text

- **Headings are plain labels** that describe the content: "Results on Real Calls", "Knowledge Base", "Way Forward". No end punctuation,
  no commas, no "and what it means", no teasers, no counts with a payoff ("Five Things That Changed").
- **Short on screen.** Slide and video headlines under 8 words; list items, tile labels and steps under 7 words where possible. The
  narration or the body text explains; the screen shows.
- **Kickers** name the event, series or section: "Agency 2026 · Showcase".

## Rules from the Contact Alberta sponsor review

These came from the sponsor's review of the Contact Alberta film and handout on 2026-11-10. They apply to any Agency piece about an AI
service.

- **Say "AI agent" for the AI** whenever people are also called agents (contact-centre staff, for example). A bare "agent" is a fault in
  every spoken or on-screen string, labels included. Lint flag: `--ai-agent`.
- **Plain headings.** "Contact Centres", not "Why contact centres matter".
- **Few pronouns.** Repeat the noun at the start of a sentence instead of "It", "This" or "They", so a listener who hears the line once
  knows what it refers to. The lint warns on pronoun openings in narration.
- **Name who "we" is.** Unowned "we", "our" and "us" are warnings in narration: say "the project team" or "the ministry".
- **No slogans.** The sponsor withdrew lines such as "Every answer sourced. Every number checked." Closings are the owner's words or
  absent.
- **No invented lists.** A "before it goes live" checklist and an agent-loop scene were withdrawn because the sponsor had not supplied them.
- **Fair comparisons.** When two sides are compared (the AI agent and staff), score each side alone, by the same method, and say how.
- **Results by program, never by person.** Staff figures are reported for the program, never for an employee.

## Narration (video)

Video narration follows the owner's standard in `reference/VIDEO-STYLE-GUIDE.md` in full. Read it before writing a line. The points the
lint checks:

- no wayfinding ("In this video", "Chapter two", "Here is how", "The answer is", "Next,");
- no softeners and no slogans;
- no dramatic colon ("It comes down to one thing: …");
- numbers written the way the voice should say them ("two point seven million", "twenty twenty-six");
- context and scale before mechanism, and every term defined before it is used.

`guides/VIDEO.md` covers the MVAI checks that run on top of these.

## The reviewer's checklist

1. Is every figure in the notes file with its source?
2. Is any sentence a "not X, but Y"? Is there an em dash?
3. Is there a rule of three, a run of short dramatic sentences or a slogan?
4. Does any heading tease instead of naming its content?
5. Does any sentence carry more than one idea, or a list of more than three things?
6. Is every technical term defined at first use?
7. Could a smart colleague outside technology say back what each paragraph means?
8. Did the lint report 0 errors, and has a person read every warning?
