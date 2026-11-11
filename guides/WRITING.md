# Writing for Agency 2026

This guide covers every word in Agency 2026 media: handouts, posters, slides, banners, social posts, signs, emails, captions, alt text,
lower thirds and narration. It is one standard in three layers:

| Layer | File | Covers |
|---|---|---|
| Core | this file | Facts, audience, plain language, banned shapes and words, names, numbers, spelling, headings |
| Screen | `guides/SLIDE-TEXT.md` | Slides, video screens, signs, social, lower thirds, captions: lengths and forms for text people read at a glance |
| Voice | `guides/NARRATION.md` | Everything spoken: films, announcements, introductions, the voice registry, pronunciation |

**Precedence.** (1) Lines the content owner dictates, used word for word. (2) These three guides. (3) Tool defaults (MVAI examples,
template samples). Where a tool's example breaks these guides, follow the guides.

**Where it came from.** The rules merge the shared writing guide (`/mnt/data/projects/_styles/`), the client's Prototype Lab narration rules
(September 2026), the owner's narrated-video standard (October 2026), MVAI's writing checks, and the Contact Alberta sponsor review
(November 2026). `docs/research/writing-standards-survey.md` lists every source, the conflicts between them and how each was settled.

**The test.** Read the text aloud as if to a deputy minister who has thirty seconds and no background in the subject. If any sentence
sounds like a trailer, a sales page or a LinkedIn post, rewrite it. If the listener could not say back what a paragraph means, it is not
finished. The target voice is a competent public servant briefing a colleague: direct, specific, friendly, unhurried.

```bash
python3 scripts/lint/lint.py my-content.json            # 0 errors before anything ships
python3 scripts/lint/lint.py --strict my-content.json   # warnings fail too (use before a final print run)
```

A clean lint is the floor, not the finish. A person reads every piece once against this guide before it goes out.

---

## 1. Facts

1. **Use only the facts you were given.** Never invent a name, number, date, quote, result, place or event detail. If a layout needs a
   fact the brief does not give, leave the block out or ask. *Why: every invented line on Contact Alberta had to be withdrawn after the
   sponsor review.*
2. **Every figure has a source.** Keep a `NOTES.md` beside the content file, one row per figure: the figure as printed, the source and the
   line or table it comes from (`contact-alberta/docs/video/agency/NOTES.md` is the model).
3. **One set of figures in every medium.** The film, the handout, the slides and the run of show use the same number from the same source.
   When it changes, it changes everywhere. *Sponsor: "re render so all the materials stay harmonious."*
4. **Event facts come from `brand/tokens/tokens.json` (`event`).** Dates, cities, day titles, venues and the event figures (3 days, 2
   cities, 40 working demos, 2 challenges) are read from there, never retyped.
5. **Example values are labelled.** Sample charts, screens and names say "Example values", "Sample" or "Synthetic data" where the reader sees
   them.
6. **Conclusions belong to the owner.** Lessons, asks, credit, thanks, closing lines and acknowledgements come from the content owner.
   Leave a placeholder and ask; never draft them.
7. **Classification comes from the owner.** Default to Unclassified. Never infer a level from the material.

## 2. Write for the audience

| Rule | Before | After |
|---|---|---|
| **Lead with the plain point**, then explain. *Abstract openers stall the reader.* | "The design rests on two commitments." | "The team checks every answer against a published source." |
| **One idea per sentence.** *A sentence read twice has failed.* | "The tool reads the form, checks the rules, flags gaps and books the visit, which saves time." | "The tool reads the form and checks it against the rules. It flags anything missing before the visit is booked." |
| **Name the actor; use the active voice.** Passive is allowed for system steps where the actor does not matter. | "Every number is checked." | "The AI agent checks every number against a source." |
| **Define every term at first use**, in plain words, including the project's own names. | "The Deck coordinates the crew." | "The Deck, a chat room the agents share, lets each agent see what the others are doing." |
| **An organization enters with what it does.** | "The AER considers those debts." | "The Alberta Energy Regulator, which licenses oil and gas wells, checks those taxes." |
| **Repeat the noun** instead of a pronoun when the sentence before has two candidates. | "Staff review the draft and the reply. It goes out the same day." | "Staff review the draft and the reply. The reply goes out the same day." |
| **Spell out a condition and its consequence.** | "Doubtful values are held." | "When the AI agent cannot read a value clearly, it flags the field for a person to review." |
| **Never cram a list into a sentence.** Three items at most; more go in a list, table or tile row. | "It covers forms, fees, dates, rules, exceptions and appeals." | A bulleted list of the six. |
| **Use plain words**: system, tool, staff, person, report, letter, record, select, automatically. | "Leverage the assurance layer to surface seams." | "Use the checks to find where the process breaks." |
| **Say who decides.** A named person or role makes every decision; tools propose. | "The system approves eligible claims." | "The system recommends a decision. A case worker approves each claim." |

Sentence length: in print, mostly 10 to 25 words; the lint warns at 30 and fails at 40. Spoken sentences have their own limits
(`guides/NARRATION.md`).

## 3. Shapes that read as written by AI

These are faults in every medium. The lint catches most of them; a reader catches the rest.

| Banned shape | Example | Write instead |
|---|---|---|
| **Negated contrast**, "not A, but B", "not just X", "more than X" | "This is not a pilot. It is a program." | "The program runs in three ministries." |
| **Rule of three or four for rhythm** | "Faster. Smarter. Safer." | Say what changed, with the number. |
| **Cinematic short sentences** in a row | "The window is open. The plan is ready." | One sentence of normal length. |
| **Slogans and taglines** written by us | "Every answer sourced. Every number checked." | The owner's own words, or nothing. The event tagline in `tokens.json` is the only tagline. |
| **"This is the moment" / "this is where"** | "This is where it all comes together." | Say what the step delivers. |
| **Participle tail** | "…answers in one second, demonstrating its speed." | Stop at the full stop. |
| **Benefit tail** ("so nothing is ever missed") | "…checked twice, so nothing slips through." | State the fact; the reader draws the conclusion. |
| **Dramatic colon** | "It comes down to one number: speed." | "Speed decides how many calls one person can handle." |
| **Wayfinding** ("In this video", "Here is how", "The answer is", "Next,") | "Here is how it works." | Describe how it works. |
| **Rhetorical questions** | "What if forms filled themselves?" | State the fact. (Films may use one staged question per turn: `guides/NARRATION.md`.) |
| **Straw-man negative** | "This is not a chatbot story." | Say what the story is. |
| **Openers**: Moreover, Furthermore, In essence, At its core, It is worth noting | | Cut the opener. |
| **Intensifiers and softeners**: very, really, truly, deeply, incredibly, just, simply, quietly, honestly | | Cut them, or strengthen the claim. |
| **Metaphor and hype**: journey, landscape, ecosystem, unlock, seamless, game-changing, world-class | | The literal word. |
| **Praise of people** in introductions: distinguished, renowned, esteemed, visionary, needs no introduction | | The person's approved title and one approved fact. |
| **Em dashes** | "The agent — fast and careful — answers." | Comma, colon or two sentences. En dashes stay in ranges ("Dec. 7–9"). |
| **Emojis and decorative symbols** | | None, anywhere. |

The full word list is `scripts/lint/banned.json` (39 words that always fail, 71 to check in context, and phrase and structure rules). Its
rules are explained in `scripts/lint/BANNED-README.md`. MVAI's approved-word list (use not utilize, about not approximately, help not
facilitate, show not demonstrate, get not obtain, before not prior to) applies to all our text.

## 4. Names, titles and organizations

1. **People.** First mention: the full name as the person gives it, then the person's own approved title, then the organization:
   "Jordan Sample, Director of Sample Services, the Ministry of Example Affairs". Later mentions repeat the full name in narration and the
   given name or surname in print, as the person prefers. Use no pronouns for a person unless the person has stated them.
2. **Honorifics.** Use the honorific the person uses, and only that: "the Honourable Jordan Sample, Minister of Example Affairs" on first
   mention, "Minister Sample" afterward. No "Dr." unless the person uses it. Ask the event owner's protocol office when unsure.
3. **The ministry.** "the Ministry of Technology and Innovation" on first mention, "Technology and Innovation" afterward. Never "TI" or
   "T and I" for the public.
4. **The government.** "the Government of Alberta"; never "GoA" outside internal documents.
5. **Acronyms.** Spell out on first use with the short form after it: "Jobs, Economy, Trade and Immigration, or JETI". Use an acronym only
   when the audience uses it or it appears again. Product names that are not acronyms are not expanded; list them in a spec's `terms`.
6. **AI terms.** "artificial intelligence, or AI" on first use in a film. Where staff in the story are also called agents (contact centres,
   registries), say **"AI agent"** for the AI every time (Contact Alberta sponsor rule; lint flag `--ai-agent`).
7. **The event.** "Agency 2026" in print, "Agency twenty twenty six" in narration. Day titles exactly as in `tokens.json`.
8. **Names as the owner gives them.** When the owner renames a product, rename it everywhere, including the pronunciation lexicon.

## 5. Numbers, dates and times

| | In print and on screen | In narration (`guides/NARRATION.md`) |
|---|---|---|
| Counts | Figures from 10 up, words for one to nine in running prose ("three days"); figures always in tiles, charts and tables | Words: "forty working demos" |
| Large numbers | "2.7 million", "770,000" | "two point seven million", "seven hundred and seventy thousand" |
| Money | "$4.2M" in tiles, "$4.2 million" in prose | "four point two million dollars" |
| Percent | "96%" in tiles, "96 per cent" or "96%" in prose (one form per piece) | "ninety six percent" |
| Dates | "Monday, December 7" · "Dec. 7–9, 2026" (as on the invites) | "Monday, December seventh" |
| Times | "10:30 a.m.", "1 p.m." | "ten thirty", "one o'clock" |
| Ranges | En dash, no spaces: "7–9", "9:00–10:30 a.m." | "seven to nine" |
| Phone | "780-555-0100" | "seven eight zero, five five five, zero one zero zero" |
| Web | "alberta.ca" (no "https://", no "www") | "alberta dot c a" |

Round only when rounding is honest ("about 2.5 million"), and say "about". A ratio gives both of its inputs nearby. Recurring figures say
"a year". Never use numbers as decoration.

## 6. Spelling and punctuation

- **Canadian spelling** (Canadian Press and Government of Alberta practice): colour, centre, behaviour, licence (noun) and license (verb),
  program, cheque, catalogue; **-ize** endings (organize, organization, recognize). The lint warns on US forms (color, center, behavior)
  and on -ise forms (organise).
- **Serial comma:** none, unless it prevents a misreading ("speed, accuracy and timing").
- **Ampersand** only inside an official title ("Research & the Future AI Economy"). Otherwise "and".
- **Colons and semicolons:** a colon may introduce a list or an example. Never join two sentences with a semicolon; write two sentences.
- **Parentheses:** allowed sparingly in print; never in narration or on a slide.
- **Quotation marks:** curly in print (“ ” ’). A quote is the speaker's approved words, attributed.
- **Exclamation marks:** none.

## 7. Headings

1. **Headings are plain labels that say what the section contains.** "Results on real calls", "How the AI agent works", "Way forward".
2. **Sentence case**: capitalize the first word and proper names only. Proper titles keep their capitals ("The Art of the Possible",
   "Velocity White Papers"). The Contact Alberta handout, approved in title case, is kept as approved; new work uses sentence case. *Why:
   the compliant slide template, the MVAI screens and the motion library all use sentence case, and it reads faster.*
3. **No teasers, counts or claims**: not "Five things that changed", "Why it matters", "The future is here", "What we learned".
4. **No end punctuation, no commas, no "and what it means"**, no "from X to Y" in a heading.
5. **A question is a heading only on a chapter card** that the next scene answers.

| Before | After |
|---|---|
| "Why Contact Centres Matter" | "Contact centres" |
| "Three Lessons From the Pilot" | "Pilot results" (and the owner's lessons, if supplied) |
| "From Paper to Platform: The Journey" | "Paper forms replaced by an online service" |

## 8. By medium

| Medium | Rules (details in `guides/SLIDE-TEXT.md`) |
|---|---|
| Handouts, reports, fact sheets | Sections open with the plain point. Paragraphs of one topic, at most six sentences. Tiles and tables carry the numbers; the prose explains them. A figures note says what was measured and how. |
| Slides | One message per slide. Headline 8 words or fewer, bullets 7 words or fewer, at most five bullets. Speaker notes in full sentences. |
| Video screens | The screen shows, the narration explains. Every item on screen is said or supported in the narration of that scene. |
| Posters, signs, wayfinding | Event facts only, as on the invites. Directions are a verb and a place: "Hall D", "Registration". |
| Social posts | One sentence of what and when, then the link. No hashtags in the sentence, at most two at the end (#Agency2026 and one more). No emojis. |
| Email | Subject line says what and when ("Agency 2026: day one starts at 9 a.m., December 7"). First sentence states the purpose. One call to action. |
| Lower thirds | Name on line one; role and organization on line two (`brand/voice/intros.json` lower-third). |
| Captions | Verbatim narration, broken at phrase boundaries, at most two lines of 42 characters. |
| Alt text | What the image shows and why it is there, in one sentence; for a chart, the finding and the key numbers. Never "image of". |
| QR codes | A printed URL beside every code, and a plain label of what it opens ("Agenda", "Save this demo"). |

## 9. Owner lines and feedback

- **Dictated lines.** When the owner dictates a sentence, store it word for word in `owner_lines.txt` beside the content and pass it to the
  lint (`--owner-lines`); the lint never flags it. Two changes are allowed: splitting at a natural joint when a sentence is too long to
  voice, and writing numbers as words.
- **Feedback becomes a rule.** Quote each owner correction, with its date, in the relevant guide; fix every other place the same fault
  occurs; and add a lint rule when the fault is mechanical. This loop is what made the source guides work.

## 10. The reviewer's checklist

1. Is every figure in the notes file with its source, and the same in every medium?
2. Any "not X, but Y", em dash, slogan, rule of three, run of short dramatic sentences, or participle or benefit tail?
3. Does any heading tease, count or claim instead of naming its content? Is it in sentence case?
4. Does any sentence carry more than one idea, or a list of more than three things?
5. Is every term, product and organization defined at first use? Is every acronym spelled out once?
6. Is every person introduced by the formula, with an approved title, and no pronoun the person has not stated?
7. Are conclusions, thanks and acknowledgements the owner's words?
8. Could a smart colleague outside the field say back what each paragraph means?
9. Did the lint report 0 errors, and has a person read every warning?
