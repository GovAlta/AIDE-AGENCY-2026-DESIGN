<!-- Copied 2026-11-10 from /mnt/data/projects/L4-ai-maximalist-story/docs/VIDEO-STYLE-GUIDE.md (the program owner's approved narrated-video standard). That file is the master; refresh this copy when it changes. -->
# Narrated argument video: production style guide

This guide covers narrated, animated videos that make a case to Government of Alberta leaders: program stories, evidence
films, business-case reviews and briefings that run from two to fifteen minutes a part. Any writer can follow it, human or
AI, without having seen the videos it was learned from.

It merges three sources into one standard:
- the writing and screen rules built into MVAI (the AIDE motion-video service): ASD-STE100 Simplified Technical
  English, cue rules, on-screen text limits and the "use only facts you were given" rule;
- the explainer narration guide (`arlo/world/lanes/orpheus/video-kit/base/EXPLAINER-STYLE.md`), built from executive
  reviews of prototype explainers;
- the owner's review of the AI Maximalist films (October 2026). Those films went through six full versions. Every
  rule below that comes from that review would have prevented at least one rebuild.

**Precedence.** (1) Lines the content owner dictates, word for word. (2) This guide. (3) MVAI's defaults and examples.
Where MVAI's own examples break this guide, follow this guide. For example, MVAI's sample chapter line "Chapter one is
about who does the work" is a wayfinding announcement and is banned here (section 4).

---

## 1. Before writing a word

### 1.1 Get the brief in the owner's words
Write down, before drafting:
- **The audience.** Usually a deputy minister, an executive committee or a program lead. They hear the video once,
  without a screen to scroll back. They know their own area but not your vocabulary.
- **The argument.** One sentence: what the listener should believe at the end, and why it matters to the
  Government of Alberta.
- **The length.** A ceiling for each part, for example "each part under fifteen minutes".
- **The classification**, set by the owner and drawn on every frame. Never infer it from the source material.
- **What the owner must supply.** Conclusions, lessons, asks, credit for results, and the closing statement. The
  writer never invents them (section 2.6).

### 1.2 Read the whole record first
Read the transcript of the conversation that launched the work, the bibliography and every source before you outline.
The narrative arc usually sits in that first conversation. When a draft feels thin or disjointed, go back to it.
Do not patch scene by scene.

### 1.3 Keep a notes file next to the script
Every video has a companion notes file. It holds sources, open confirmations, method notes for derived figures, data
quality flags and anything the owner has not yet confirmed. The narration states the argument plainly, and the notes
file carries the caveats. The video ends on a sources or end card that points to the notes file.

### 1.4 Keep a file of dictated lines
When the owner dictates a sentence, store it word for word in a dictated-lines file (`docs/owner_lines.txt` here). Two
kinds of change are allowed:
- splitting a sentence at a natural joint when it breaks the 25-word limit, with the fewest new words that make each
  half complete ("The program will…");
- reading numbers as words ("March twenty twenty five") and fixing capitals ("Government of Alberta").

The lint accepts dictated lines as written. Nothing else in the script gets that exemption.

---

## 2. The argument

### 2.1 One argument, built in order
A video is a rhetorical argument, not a list of facts. Each scene earns the next one. The usual order:

1. **Define the subject once.** "A maximalist is a person who…" The definition comes in the first scene. Never
   introduce the concept again.
2. **Say why the listener should care.** Use a staged question that leads to the baseline (section 3).
3. **Establish the baseline before the claim.** If the claim is about a multiple of human output, first show what
   human output is and what the research says about it. Without that baseline, the listener cannot judge the
   multiple.
4. **Show where the opportunity is.** Use the research or the record.
5. **Name the shift.** Say how the way of working must change, for example from "a person prompting a chat window"
   to "a person orchestrating productive teams".
6. **Show the mechanism working,** with the measured figures.
7. **Show the size of the result,** with a fair comparison (section 5.3).
8. **Close with the owner's conclusion:** where things stand, what happens next, and the commitment.

### 2.1a Context before mechanism, why before what
The owner's note on the first Part 3 draft: "There's so many things that you introduce here that is never defined…
You just set the context… We need to take a little bit more time to introduce the why. You already jumped into the
5,000 commits before you even introduced what that was."

Before any mechanism, tool, team or number, the listener must hear four things, in this order:
1. **The problem and its size.** What the project is, why it is hard, and how far it must go. For a transformation,
   count the starting complexity and the target, from and to: "24 code repositories become one", "five legacy
   databases become one", "8 forms in scope become all 235". Measure the ambition before the method.
2. **Why the obvious approach is not enough.** For example: "a single agent could not finish in time and could not
   hold the whole project in its context".
3. **The answer, as a decision someone made.** "So the project lead created the Arlonauts, a team of coding agents…"
4. **Why each part of the answer exists.** "For the agents to work together, they need to know each other exists and
   they need a way to talk. The Deck is a chat room that lets them…"

Only then come the activity figures (commits, messages, decisions), and each is defined as it appears: "a commit, one
saved change to the code".

### 2.1b Teaching films: each challenge, then the strategy
When the film teaches others to copy a method, organise the body as the challenges a practitioner will meet. Give each
challenge a definition, what happened, the strategy that answered it, and the evidence. For example: context rot, then
fresh sessions on a rule; memory overload, then short layered memory; drift, then a single work list. Never show a
component without the problem it solves.

### 2.1c Parallel efforts: name each one, measure the difference, carry it through
When a film follows two or more efforts at once, name each one once, with its short name ("V one" and "V two"). Then show how
the approaches differ, in numbers where possible, for example files, words of guidance and lines of code. Keep the contrast in
every later scene, so that each outcome is tied to the approach that produced it ("In V two, the lighter template, …"). The owner
asked for this on Part 4 (2026-10-26): "make sure we differentiate between them in the story, since they took different
approaches."

### 2.2 Do not compress the argument to hit a length
If the argument needs room, use the room up to the owner's ceiling. A ten-minute film that jumps between ideas is worse
than a fourteen-minute film that explains why each idea follows from the last one. Cut repetition, never the
connective reasoning.

### 2.3 Every scene connects to the one before it, with content
The first sentence of a scene picks up a noun or a fact from the scene before it: "Today, a Government of Alberta
employee…", "Those six hundred and forty hours are not deep work." It never opens with a signpost (section 4) or a
cold fact the listener cannot place.

### 2.4 Say each thing once
- A term is defined in one place.
- A figure is given in one place. In the review, "147 hours" was stated early and then again at the end, and the
  owner noticed.
- A case is introduced once, by name and what it is, before its numbers.

If the story seems to repeat, check how the parts were joined. Chapters built as separate videos and then joined often
repeat their own set-up (section 8.2).

### 2.5 Tie every idea to why it matters to the government
At each turn, the listener should know why this concept is on screen and how it connects to the Government of
Alberta's work. If a scene does not move the argument, move it to another part or cut it. In the review, two process
cases that interrupted the orchestration argument in Part 1 moved to Part 2.

### 2.6 Conclusions, lessons, asks and credit come from the owner
- Never write a "what we learned", a recommendation, an ask or a closing statement the owner has not given. In the
  review, an invented "What we learned" slide had to be replaced with the owner's three lessons. If the structure
  needs one, leave a placeholder, ask, and cut the slide if no answer comes.
- Credit must match the owner's view. An individual can take credit for results they delivered, and a methodology
  takes credit for future avoided costs. Say "These are only six use cases, and they are a subset of the work this
  leader has done". Do not total the individual's results and the methodology's results into one number.
- When the owner corrects a figure ("it was $2.5M") or a scope ("deploy it 26 times"), the correction replaces the
  source figure everywhere: narration, screen, notes and totals.
- Use names as the owner gives them. A product renamed by the owner ("call it OASIS") is renamed in narration,
  on screen, in the notes and in the pronunciation list.

### 2.7 Open and close
- **Opening.** Start on the subject itself: the definition, the first case, the first fact. A one-sentence statement
  of what the video examines is allowed only when the owner dictates it ("In this video, we'll examine several case
  studies which have been created using the maximalist approach.").
- **Closing.** End on the owner's conclusion, then the end card. Never end on a total, a slogan or a question.

---

## 3. Staged questions
A staged question is the one approved way to turn the argument. Ask the question the listener is already asking, then
say where the answer comes from, with content. The owner's model:

> "But how much of that time is productive? To answer the productivity question, we need to look at the research on
> knowledge work."

Rules:
- Use one staged question at a turn in the argument, never two in a row.
- The next sentence names the path to the answer: a body of research, a record, a case or a comparison. It never
  names a count ("Six cases answer that question").
- Never follow a question with "The answer is…". State the answer as a plain sentence.
- A question can open a chapter card when it is the question the chapter answers ("Where does the work slow down?").
- MVAI flags every question in narration as a warning. Staged questions are accepted warnings, and any other question
  is a fault.

---

## 4. No wayfinding, no announcements
"These kinds of wayfinding flourishes are not acceptable. This is not how people speak or write." Never tell the
listener what the video, chapter, part or next scene is about to do. Say the thing itself.

| Not acceptable | Write instead |
|---|---|
| "This film is about the AI maximalist." | "A maximalist is a person who…" |
| "Chapter four turns those six teams into a number." | Give the number. |
| "Six cases answer that question." / "Four measures answer that question." | Give the first case or measure. |
| "One case proves it." | "Bill 26, the Immigration Oversight Act, gives…" |
| "Here is how a single session works." / "This is what one person drives today." | Describe the session and give the figures. |
| "Part one said…" / "Part two shows what the record says." | State the fact without referring to parts. |
| "The answer is…" | Give the answer as a plain sentence. |
| "We learned three things." / "It takes three things." | Start the list with "First, …" and end it with "Finally, …". |
| "Next is Parable…" / "The third case is…" | "Parable is a learning platform built to replace Moodle." Use names, not ordinals, for cases, so reordering cannot break them. |
| "To see how much that changes, we start with…" | Start. |
| "Chapter one is about who does the work." (MVAI example) | The first fact about who does the work. |

Chapter cards carry a short title or a staged question on screen. The narration over a chapter card follows the same
rules as any other scene.

---

## 5. Claims, numbers and fairness

### 5.1 Every number has a source
Every figure on screen or in the narration traces to a source: a log, a commit history, a cost model, a business case
or the owner's statement. MVAI's rule applies to all of it: never put facts, numbers, names or screens on screen that
the requester did not give you. Derived figures (totals, ratios, multiples) keep their working in the notes file,
with inputs, method and date.

### 5.2 State the argument boldly
State the measured result plainly: "Agents worked seven hundred hours, eighty one times the human time." Leave
hedges, confidence notes and data caveats out of the narration and put them in the notes file. Do not soften claims
with "may", "around" or "it seems" unless the source itself is a range. If a figure is too weak to state plainly,
leave it out of the video.

### 5.3 Comparisons must be fair
- When a cost is shown, show what it buys at the same scale. If tokens cost $4.1M at a 2,000× output, compare them
  with 2,000 staff at $120,000 a year ($240M). Then the token cost is about 1/58th of that workforce. Never compare
  the AI cost with a single salary.
- Compare like with like: one-time with one-time, a year with a year. Label recurring savings "a year" on screen and
  in the narration.
- Keep money spent to date separate from money committed to year end, and say both ("one hundred thousand dollars to
  date, and about one hundred and fifty thousand more to the end of the year").
- A ratio shown on screen has its two inputs shown or said in the same scene (the first 29% cost over $41M, and the
  remaining 71% costs about $150K, so each percent costs about 670× less).
- Before a ratio the owner has not seen goes in, show it to the owner.

### 5.4 Numbers in speech
- Write numbers as they are said ("seven point nine eight million dollars", "twenty twenty five"). MVAI flags digits
  in narration.
- When you cue on a number, write it as separate words ("eighty one", not "eighty-one"). A hyphenated word is one
  token and will not match a cue.
- On screen, use figures with units ("$119M", "≈ 480×", "81×").

### 5.5 Sensitive material stays out
- Keep Cabinet-confidence figures, vendor names from quotes not for distribution, live vulnerabilities, named staff
  in ticket data and Protected material out of the video. Do this even when the video is Unclassified.
- Never copy a credential, token or key into a script, a spec, a notes file or a prompt. Redact anything
  credential-shaped before calling an external service.
- Screens show synthetic data, and the narration says so.

---

## 6. Narration sentence rules
The voice reads every word aloud, once. Write for the ear.

### 6.1 Structure
1. Use complete sentences only. No fragments, not even in lists ("Two in June, four in July…" and "An hour a team,
   each day:" are fragments).
2. Keep sentences to 25 words or fewer (the ASD-STE100 limit that MVAI enforces), mostly 10 to 20 words, one idea each.
3. Use active voice, and name the actor and the object: "Research agents wrote acceptance criteria before any code."
   Use passive only when the actor does not matter.
4. Use present tense for how things work and past tense for what happened.
5. Put no parenthetical aside between a subject and its verb. A count or qualification gets its own sentence.
6. Put a phrase next to the noun it describes.
7. Do not join two thoughts with a semicolon. Write two sentences.
8. Join adjacent steps with a relative clause instead of two clipped sentences.

### 6.2 Reference and definition
9. Define every proper noun, acronym and term of art on first use with an appositive: "Alta, the land titles
   mainframe"; "Jobs, Economy, Trade and Immigration, or JETI". This applies even to terms the audience uses daily.
9a. **No jargon without a definition, including the project's own words.** Treat every internal name as unknown to
    the listener: the team's name, the chat room, the work list, a lane, a session, context, compaction, a handoff, a
    sub-agent, orchestration, a commit, a finding. Define each in plain words, with its purpose, before or in the
    sentence that first uses it, and never on screen before it is said. Explain invented names too: "Each agent has a
    name and an identity, so that people and agents can refer to each other easily."
9b. **Keep a glossary in the builder,** with each term and the scene that defines it. The build fails when a term is
    used, in narration or on screen, before its defining scene. Use `glossary_check()` from `film/vidcheck.py`:
    each scene lists the terms it defines in `"_def"`, and `strip_meta()` removes that key before the spec is written
    (`film/build_specs_p3.py` is the worked example, with 60 terms). When a term slips through after rendering, as
    "push" did on one Part 3 screen, add it to the glossary so the build catches it next time.
10. An organization enters the story with what it does: "The Alberta Energy Regulator, which licenses oil and gas
    wells, …".
11. A case starts with its name and what it is, before its numbers: "Parable is a learning platform built to replace
    Moodle."
12. A pronoun follows exactly one candidate noun. If the sentence before has two nouns, repeat the noun ("the agent's
    time", "the person's time", "that figure"). Never open a case with "It".
13. Repeat the noun the listener heard. Do not switch to a synonym ("those taxes", not "those debts" after "unpaid
    property taxes"). A "these/those" phrase must point back to a noun already heard. MVAI flags "these gains" when
    "gains" has not been said.
14. Give "we" and "earlier studies" their owner: "In Government of Alberta builds, we have measured…"; "Earlier
    controlled studies, from before agent orchestration, measured…".
15. Give "later", "here" and "in this environment" a where: "in the Government of Alberta's AI sandbox".
15a. **One name for each actor, all the way through.** Pick the role name once ("the project lead") and never switch
    to a synonym ("the leader", "the sponsor", "the deputy") in the same film.
15b. **No word that collides with a role or a defined term.** If "project lead" is a role, a detector raises a
    "signal", not a "lead". If "the crew" is defined, do not also call it "the team" in the next scene.
15c. **Describe each thing as what it is, and qualify a generalisation.** Claude Code is a tool, not a model. If only
    most of the agents are named after the Argo's crew, say "most of the agents". Read each sentence that begins
    "All", "Every" or "The agents are" against the source.
15d. **When an appositive overloads a sentence, define the term in its own sentence.** "…made five thousand six hundred
    and eighty four commits. A commit is one saved change to the code."
16. Each clause must make sense on its own. A clipped fact stacked into a sentence for rhythm ("Letter-writing
    campaigns add more.") assumes knowledge the listener does not have.

### 6.3 Lists
17. A spoken list opens with "First," and closes with "Finally,". The middle items use "Second," / "Then". "And" closes
    only a list that did not open with an ordinal.
18. Lead with the sequence word and remove the scaffolding: "First, contact details are removed." Not "The tool removes
    contact details before anything else is done."
19. Give steps in the order they happen.

### 6.4 Register
20. Use the management register, not idiom: "recorded manually", "cannot identify key metrics on performance". Not
    "counted by hand".
21. Use plain words: system, tool, staff, person, report, letter, record. Avoid "surface", "seams", "oracle",
    "assurance layer" and "structured output".
22. Spell out conditions and consequences: "When the AI cannot make a clear determination, these fields are flagged
    for human review." Not "doubtful values are held".
23. Use "select", not "click" (MVAI), and "automatically", not "in code".

### 6.5 Banned
| Banned | Why, or what to write instead |
|---|---|
| Wayfinding and announcements | Section 4. |
| "holds" ("the case holds", "this holds") | Give the evidence. For "holds back", write "slows". |
| "not only…" / "not just…" contrasts | Say what it is ("…not only to speed it up" becomes the thing itself). |
| Slogans and antithesis tails ("a floor, not a ceiling", "the rule is simple", "reads less and decides more", "suggest, never decide") | State the fact. |
| Dramatic colons ("…comes down to one number: the check-in interval.") | "The number of agents one person can keep busy depends on the check-in interval." |
| Benefit tails ("…so nothing is ever counted twice") | State the fact and let the listener draw the conclusion. |
| Softeners: simply, just, really, honestly, quietly, very | Delete them. A dictated phrase keeps its word ("independent oversight that quietly observes"), and the whole sentence goes in the dictated-lines file. |
| Hype: unlock, revolutionary, game-changing, transform (unless the owner dictated it) | State the fact. |
| Metaphors and heroic or nautical prose | Say it literally. |
| Negative framing that sets up a straw man ("This is not a copilot story.") | Say what the story is. |
| Rhetorical questions that are not staged questions | Section 3. |
| Em dashes, parentheses and abbreviations the voice cannot say | Use commas and full words. |

---

## 7. Screens

### 7.1 The screen shows, the narration explains
- Headlines under 8 words; list items under 7 words (MVAI). Each headline says what the scene shows ("Savings
  against spend", "Built in hours, waiting for weeks"), never a slogan.
- Every item on screen is said, or directly supported, in that scene's narration. Nothing appears on screen that the
  narration contradicts or never reaches.
- Scene labels (the small top-right text) name the subject ("The Immigration Oversight Act"), not the chapter number.

### 7.2 Prefer dynamic screens
The owner's note: "Too many of the screens rely on this simple 4 box layout instead of something … more dynamic and
engaging. Your clock and big banner images are good."
- Choose the device that does the job of the data:
  - counters for a headline number;
  - a clock or dial for time;
  - cells or dot grids for a count of many;
  - stairs for a progression;
  - a checklist for items landing one by one;
  - a status timeline for a process and its waits;
  - compare bars for before and after;
  - a diagram for a flow.
- For a transformation, show the scale as from-and-to counters ("24 → 1 code repositories", "8 → 235 forms",
  "100% of the migration"), after a counter of the starting complexity.
- Use a static grid of boxes for at most one scene in five.
- Use full-frame word punches as the exception: one per film is usually right, kept for the named answer to the
  film's question ("ARLONAUTS"). Never use two in a row.
- Grouped cards (`story-groups`): with three or four columns, give each column a spot illustration (`spot:code`,
  `spot:team`, `spot:support`, `spot:search` and so on) so the cards are not empty boxes. With two columns, leave the
  illustrations out: the wide cards crop them.
- A teaching film closes on a recap that pairs each challenge with its strategy (stairs), then the owner's line.
- **No slowly enlarging text.** MVAI's `story-title` (drifts to 1.03), `story-punch` (drifts to 1.06) and the
  `story-status` go-live bar ("pops and drifts") scale their text while it is on screen, and the kit has no switch to stop
  it. The owner (2026-10-27): "Those sort of slightly dynamically enlarging titles are distracting, and I don't think we ever
  want them, unless they can be made to be completely smooth… right now they're not subtle, they're just sort of jagged and
  janky." Do not use these scene types. Every builder calls `no_drift()` from `film/vidcheck.py`, which turns a title or punch
  into a static `story-chapter` card and a go-live bar into an ordinary row. Use these types again only when MVAI offers a
  smooth effect or an off switch and the owner approves it.
- At least half of the scenes in each chapter carry a device that moves on the narration's cues.
- Do not splice in clips of another visual style to "add energy" unless each clip carries a step of the argument. In
  the review, alternate-style big-idea clips were rejected: "the splices are not helpful or engaging".

### 7.3 Timing and cues
- Every cue is an exact phrase from that scene's narration (MVAI). Elements appear when the voice says the cue.
- Cue each item at the start of the sentence that introduces it, so the item stays on screen while the voice talks
  about it.
- At least six spoken words follow the last cue in a scene, so the final element is on screen long enough to read.
  Otherwise add `"hold": 1.5`.
- The first element appears within about two seconds of the scene start. The last element appears before the scene
  ends.
- Pace runs at about 2.3 words a second, plus about 1.1 s of lead and tail per scene. Estimate the length before
  rendering.

### 7.4 Fit and legibility
- No text is cut off, ellipsised or hidden. Second lines that disappear behind a box, or rules drawn over boxes,
  are faults. Read MVAI's `warnings` (`fit: …`) after every render, and treat every one as a fault.
- Keep within character limits. Rewrite shorter text; do not rely on auto-shrink.
- With captions off, keep content anywhere. With captions burned in, keep content above y 780.
- Kinetic story scenes show portraits or spot illustrations only, never screenshots (a screenshot is cropped into
  an unreadable piece). Show app screens with screen or explainer scene types.

### 7.5 Covers and thumbnails
- A generated cover carries the title and nothing else. An image model will invent statistics ("+42%"), so check
  every word on a generated cover, and regenerate if any text other than the title appears.
- Use the same design language as the video (GoA navy, Archivo type), and add no logos the brief did not supply.

---

## 8. Structure, length and assembly

### 8.1 Length
- Each part stays under the owner's ceiling (here, fifteen minutes). Two parts are better than one rushed film.
- A part usually has four to six chapters of 2 to 5 minutes. Each chapter has 3 to 17 scenes.
- A teaching film may run longer when the owner asks for room ("as long as it needs to be"). Part 3 runs 19.5
  minutes in six chapters, and every minute defines, explains or proves something.
- Trim length by cutting repetition. Never cut a definition, a baseline or a transition sentence.

### 8.2 Assembly
- Write each part as one continuous script, and read it aloud as one piece, even when the chapters are rendered
  separately and joined.
- After joining, watch the seams. A chapter written to stand alone will re-introduce the subject. In the first
  assembly, "around the four minute mark the whole story repeats".
- Render each chapter as its own job and join them (`film/assemble_*.py`). A changed chapter is updated with
  `update_walkthrough`: unchanged narration is not voiced again, which keeps the voice consistent and the cost down. A
  new chapter gets `create_walkthrough`.
- After an update, confirm the new render is the one downloaded: search the chapter's captions for a changed
  sentence before joining. A poll can report the old render as done.

### 8.3 Voice and pronunciation
- Use one voice for the whole series. For Protected material, or by owner choice, use a Canadian-processed voice
  (google-ca).
- Add every product name, acronym and coined term to the spec's `terms` list.
- After rendering, listen to every new name. Or transcribe the clip, with a Canada-resident model when the data
  requires it, and confirm the name is spoken as intended (a word, not letters).

---

## 9. Production workflow and quality gates
Do these steps in order. A step that fails sends you back to the step that caused the fault.

1. **Brief** (section 1.1). Record the audience, argument, length, classification and the owner-supplied items.
2. **Outline the argument** (section 2.1) as a list of scene claims, one sentence each. Check the outline for the
   baseline, the staged questions, the fair comparison and the owner's conclusion. Send the outline to the owner when
   the structure is new.
3. **Draft the narration** in a builder script that generates the spec from source data, so figures cannot drift from
   their sources.
4. **Read the whole script in order, aloud**, before any tool runs. Check:
   - define once;
   - say each figure once;
   - every pronoun has one noun;
   - every scene connects to the scene before it;
   - no wayfinding;
   - no empty contrasts;
   - no slogans;
   - every sentence is complete.
5. **Run the glossary check** by building the specs (`film/vidcheck.py`, rule 9b). It must report 0 faults.
6. **Run the style lint** (`scripts/style_lint.py <spec.json>`). It must report 0 faults. Add each new fault the owner
   finds to the lint, so it never comes back.
7. **Check cues and sentence length** (`scripts/cue_check.py <spec.json>`). Every cue matches, at least six words
   follow the last cue, and no sentence is over 25 words. The first element lands within two seconds.
7a. **Run MVAI `check_walkthrough`.** Fix every error. Fix every warning except staged questions and dictated lines.
8. **Render, then inspect frames.** For every scene, look at the frame 1.2 seconds before the scene ends
   (`film/scene_end_frames.py`). That is the moment every element must be on screen. Check for cut-off text, missing final elements, overlapping rules and fit warnings.
9. **Check pronunciation** of every new name (section 8.3).
10. **Watch the joined part straight through** for repetition at the seams and for pacing.
11. **Update the notes file** with sources, changes and open confirmations.
12. **Deliver.** Send the video, plus a compressed copy if the channel has a size limit. Say exactly what changed and
    what still needs the owner.

### 9.0 The toolkit
| Step | Tool | Passes when |
|---|---|---|
| Glossary | `film/vidcheck.py` `glossary_check()` in the builder | 0 glossary faults |
| No drift | `film/vidcheck.py` `no_drift()` in the builder | no `story-title`, `story-punch` or go-live bar in any spec |
| Style | `scripts/style_lint.py film/specs/<set>/<ch>.json` | 0 style faults (dictated lines in `docs/owner_lines.txt` are exempt) |
| Cues and length | `scripts/cue_check.py film/specs/<set>/<ch>.json` | 0 cue faults |
| MVAI writing check | `check_walkthrough` (MCP) | 0 errors |
| Render and join | `create_walkthrough` / `update_walkthrough`, then `film/assemble_*.py` | every chapter `done`, captions show the new text |
| Frames | `film/scene_end_frames.py film/specs/<set> film/out/<set> <chapters>` | every scene complete 1.2 s before it ends, no cut-off text |
| Pronunciation | a short clip transcribed by `vertex-gemini-ca` | each new name spoken as intended |

### 9.1 Turning feedback into rules
Every piece of owner feedback is a rule, not a one-off fix:
- quote it, with the date, in the style file;
- find every other place in both parts where the same fault occurs, and fix them all;
- add a lint rule when the fault is mechanical.

---

## 10. Pre-render checklist

**Argument**
- [ ] The problem, its size (from and to) and why the obvious approach fails come before any mechanism or activity
      figure.
- [ ] Every term, including the project's own names, is defined before or where it is first used (the glossary check
      passes).
- [ ] In a teaching film, every component is introduced through the challenge it answers.
- [ ] The subject is defined once, in the first scene.
- [ ] The baseline comes before the claim, and the research or record is named.
- [ ] Each turn uses at most one staged question, and the next sentence names the path to the answer.
- [ ] Every scene's first sentence connects to the scene before it, with content.
- [ ] No figure, case or definition appears twice.
- [ ] Lessons, asks, credit and the conclusion are the owner's words, from the dictated-lines file.
- [ ] The video ends on the owner's conclusion, then the end card.

**Narration**
- [ ] No wayfinding: "this chapter", "here is how", "the answer is", "next is", "N cases answer", "we learned N things".
- [ ] None of the banned words or forms: holds, not only, slogans, dramatic colons, benefit tails, softeners, hype,
      fragments, straw-man negatives.
- [ ] Every sentence has 25 words or fewer, is in active voice and is complete.
- [ ] Every name and acronym is defined on first use and listed in `terms`.
- [ ] Every pronoun has exactly one noun before it.
- [ ] Each actor has one name throughout, and no word collides with a role or a defined term.
- [ ] Numbers are written as words, and numbers used as cues have no hyphens.

**Numbers**
- [ ] Every figure traces to a source, and the working for derived figures is in the notes file.
- [ ] Comparisons are like for like and at the same scale, and recurring figures say "a year".
- [ ] The owner's corrections are applied everywhere.
- [ ] No sensitive, Protected or credential material appears.

**Screens**
- [ ] No more than one static four-box layout in five scenes, and no two punches in a row.
- [ ] Headlines are under 8 words and list items under 7.
- [ ] Every cue matches, at least six words follow the last cue, and the first element shows within two seconds.
- [ ] There are 0 fit warnings and no cut-off text in the QA frames.
- [ ] Grouped cards with three or four columns carry spot illustrations; two-column cards do not.
- [ ] No drifting scene types: `no_drift()` ran in the builder (no `story-title`, `story-punch` or go-live bar).
- [ ] The cover shows the title only.

**Assembly**
- [ ] Each part is under the length ceiling, with no repetition at the seams.
- [ ] Every new name is pronounced correctly.
- [ ] Each updated chapter's captions show the new text before the join.
- [ ] The classification is as the owner set it, on every frame.
- [ ] The notes file is updated.

---

## Appendix A. Faults from early drafts and their fixes
These are the patterns that caused rebuilds, with the general form of each fix.

| Draft | Fault | Fix |
|---|---|---|
| "One case proves it." "The business case was uploaded after midnight." | "It" and "the business case" point at nothing the listener has heard. | Introduce the case by name and purpose: "Bill 26, the Immigration Oversight Act, gives Jobs, Economy, Trade and Immigration new duties… The ministry's business case for a system to support it was uploaded after midnight." |
| "Not all of that time is production." "Second, how much of that time is productive?" | Rough turn, with an ordinal that announces structure. | "But how much of that time is productive? To answer the productivity question, we need to look at the research on knowledge work." |
| "This is not a copilot story." | A straw-man negative. | Say what the story is: a maximalist unlocking the potential of AI to change the nature of work. |
| "What does this way of working build? Six cases answer this question." | Wayfinding after a staged question. | "What has this way of working built, and what multiples does it deliver? The builds range from ministry prototypes to a new land titles system." |
| "…this demonstrates that this holds." | Banned word and empty demonstrative. | Give the evidence itself. |
| "…not only to speed it up", then the maximalist defined a second time | Empty contrast, and the subject defined twice. | Define once. The next scene builds on the definition. |
| "Take sixty percent away." | Away from what? | "Take sixty percent away from those one thousand five hundred and ninety five hours." |
| "The third case is the Prototype Lab." | Wrong ordinal after reordering, and the Lab is never explained. | Name and explain the case: "The Prototype Lab turns ministry requests into working prototypes before money is committed." |
| A "What we learned" slide written by the generator | An invented conclusion. | Replace it with the owner's lessons, or cut it. |
| $4.1M of tokens shown on its own | An unfair comparison. | Show the human-equivalent cost at the same output ($240M, so the tokens cost 1/58th of it). |
| The individual credited with the methodology's $100M future avoidance | Credit misassigned. | Credit the individual's results to the individual and the future avoidance to the methodology. Do not combine them into one total. |
| Many four-box slides in a row | Static, repetitive screens. | Use counters, clocks, stairs, checklists, status timelines and compare bars, cued to the narration. |
| A second line hidden behind a box | Text cut off. | Shorten the text, then check frames one second after the last cue. |
| A cover with invented statistics | Fiction on screen. | Use a title-only cover, and check every generated word. |
| The story repeated at the four-minute mark | Chapters joined with their own set-ups. | Write the part as one script, and watch the seams after joining. |
| Alternate-style clips spliced in for energy | They broke the narrative flow. | Use only devices that carry a step of the argument. |
| Part 3 draft opened on "Fifteen days of the crew: 5,684 commits" and "the Deck" | A number and a term the listener could not place. | Open on the problem and its scale, from and to; say why one agent is not enough; then the decision; define the Deck by its purpose; give activity figures last (2.1a). |
| "The crew", "lanes", "compaction", "handoff" used without definition | Project jargon. | Define every term before use, and enforce it with the glossary check (9a, 9b). |
| Components listed with no problem attached | A tour, not a lesson. | In a teaching film, introduce each component through the challenge it answers (2.1b). |
| "the leader", then "the sponsor", then "the project lead" | Three names for one actor. | One role name throughout (15a). |
| "A detector raises a lead" in a film with a "project lead" | A word that collides with a role. | "raises a signal" (15b). |
