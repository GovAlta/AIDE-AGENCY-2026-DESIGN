<!-- Attributed copy (2026-11-11) of /mnt/data/projects/servicenow/bill-26/video/EXPLAINER-STYLE.md: the client's narration rules from the Prototype Lab vetting sessions of 2026-09-29 and 30, adapted for IOA. The same file is used by Arlo/Orpheus; Parable (remoodle) keeps a variant. Agency 2026 uses it through guides/NARRATION.md (system-explainer shape and fixed lines). Do not edit here: change guides/NARRATION.md. -->

# Explainer narration style guide

The client's rules, in the client's words where possible, consolidated from the vetting of the TSA, ACCTS, AREPS and
media intelligence scripts on 2026-09-29 and 30. This guide governs every explainer narration. The coordinator writes the
scripts; nothing here is optional. `EXPLAINER-BRIEF.md` still covers the schema, the tooling and the engine limits.

## Who is listening
A ministry executive, a program lead or a policy analyst hearing this once, without a screen to scroll back, who knows
their own program but not our systems or our vocabulary. Every gap is closed for them. Nothing is assumed.

## The shape of a script (five or six scenes, 90–150 seconds)

**1. The problem.** Who runs what, for whom, in the first sentence, with the acronym if one is in common use:
"Transportation and Economic Corridors, or TEC, licenses Alberta's drivers through a system called MOVES." Say what
the service is and how it works today. "Today, the application has three problems." Then the problems as plain
sentences, each a fact ("The search is slow. The filters are inconsistent. And the site failed a government
accessibility assessment."). End with the purpose and the audience, in our voice: "We've built this prototype to help
inform policy makers and business leaders how this requirement can be met."

**2. The roles.** "Let's have a look at this prototype, which will support several roles." Then each role by job title and
what they need: "Registry agents, who tell a driver at the counter whether they qualify and when they will." The last
begins with "Finally," (rule 35).

**3. How it works.** "Here's how the prototype works. Start as a registry agent by …" Walk the listener through the experience in order, with
connectors: "Before anything else happens, … The tool then … A reviewer looks at that suggestion and makes the decision.
When the acknowledgement letter is drafted, it is built from approved templates, and each sentence is checked against
those templates so nothing new is introduced." Say what happens, then why it matters. Say what the system does not do
and who decides: "Nothing is sent from the tool on its own." Where the tool offers alternatives the tester should
compare, say so: "Names and personal details can be detected and masked or removed, with code or securely with AI, and
you can test both."

**4. Artificial intelligence (optional).** Only when the walk-through has not already said what the AI does and who
decides. When present: "This tool uses artificial intelligence to …", then the division of labour ("The decisions stay
with staff. The AI gathers the stories, assesses them, finds the trends and makes recommendations. Staff decide what
goes into the report."), then the controls as procedures ("Every score is explained. If a citation is wrong, the system
detects it and removes it. A staff member always approves the final report."), then the refusal or hold rule ("If there
is a question the system cannot answer, it refuses.").

**5. Integrations.** "In order to work fully, several integrations are needed, including access to …" the systems by name, each with a
plain appositive on first mention ("MOVES, the driver record system"). Then the fixed line: "In the Lab, these
integrations are all simulated." (or which are live, then "The other integrations are simulated.").

**6. Try it.** "You can try this prototype now in the Prototype Lab." Optional actions as full sentences only. Then the
fixed close: "If you find anything deficient in the prototype, tell Atlas, the Lab's integrated product management agent.
Atlas will create a ticket and task the fix to be completed overnight, with your changes appearing the next day."

## Sentence rules
1. Define every proper noun on first use with an appositive, including ones we introduced ourselves.
2. Complete sentences of ten to twenty words. **No fragments anywhere**, not even in the try section ("Search the full
   history." is out; "You can search the full history of correspondence." is in).
3. Repeat the noun; do not substitute a pronoun or a synonym ("these integrations", not "these connections", "all of them").
4. Say what happens, then why it matters ("so the AI never has to see them", "so nothing new is introduced").
5. Finish the outcome: where the change lands and what the listener does next.
6. Plain words: system, tool, staff, person, report, ticket, letter. Not "identifier", "masked", "audited", "assurance
   layer", "structured output", "oracle", "catalogue", "seams", "surface".
7. Numbers in words ("three to four hours", "as many as half the calls"), and only numbers the assessment or the review
   states.
8. "You" for the tester; job titles for everyone else; the organization by its full name, then its acronym.
9. Present tense. System actions may be passive ("Stories are imported and screened for duplicates"); the tester's
   actions are imperative ("Start by looking up a test driver").
10. **Spell out the condition and the consequence.** Not "Where a reading is doubtful, the value is held." Say "When the AI is not
    able to make a clear determination, these fields are flagged for human review." No shorthand adjectives or verbs for
    system states ("doubtful", "held", "unsure", "uncertain"); say what the person would see and what happens next.
11. No metaphors, no antithesis for effect ("suggest, never decide"), no dramatic colons, no rhetorical questions, no
    softeners ("quietly", "simply", "just", "honest", "really"), no slogans as headlines.

## On-screen text
Headlines read in the same register: the problem scene carries the system or service name; the roles scene "The roles
this prototype supports"; the AI scene a plain statement ("How this tool uses artificial intelligence", "The decisions
stay with staff"); "Integrations this system needs"; "You can try this now in the Prototype Lab". Step headings say what
happens on that screen ("Names and personal details masked: code or AI"), never a slogan.

## Truth
Every sentence checkable against the manifest, the build brief and the Ministry review. Where the prototype does not
yet do what the script needs to say (ACCTS masking by AI, 2026-09-30), the feature is built first and the script waits.

## Length
Aim for two minutes; the client accepts up to about two and a half where the context needs it, and the tool refuses
anything over two and three-quarter minutes. Cut words, never steps or facts, and never the context that a first-time
listener needs. Defining every name and naming every actor (rules 1, 40) costs about fifteen seconds a script; make
room by removing repetition between the walk-through and the AI scene, not by dropping a definition.

## Reference scripts (approved by the client)
`explainers/scripts/accts-correspondence.json` (approved 2026-09-30), `tsa-licence-rules.json` (client edits applied),
`areps-policy-search.json` and `media-intelligence.json` (client-dictated).

## Learned from the client's EAB edit (2026-09-30)
12. **Management register, not idiom.** "recorded manually", "cannot sufficiently identify key metrics on performance",
    "the appeals performance measured". Not "counted by hand", not "nothing tells the Minister where an appeal stands".
    A shortfall is stated as a capability gap in the terms an executive uses (metrics, performance, tracked, centralized).
13. **No benefit tails.** Drop the "so that …" clauses that sell the point ("so a weekend never shortens anyone's time",
    "so nothing is counted twice"). State the fact; the listener draws the conclusion.
14. **Guide the ear through a list with ordinals and connectors.** "The first is the registrar, who … Then board members,
    who … Finally, appellants, who …". "However," introduces the key gap.
15. **Compress adjacent steps into one flowing sentence with a relative clause.** "Artificial intelligence reads the
    notice and extracts the details, such as the parties, the decision being appealed, the grounds, and the identified
    dates, which are reviewed by the registrar." Not two clipped sentences.
16. **Name the actor and the object.** "every appeal the Board receives arrives via email", not "every appeal arrives".
17. **Atlas acts.** The close is active: "Atlas will create a ticket and task the fix to be completed overnight, with your
    changes appearing the next day." Not a chain of passives.
18. **Try-it actions are the plain user task**, not a demonstration of a clever behaviour: "identify the deadline", not
    "watch a deadline that falls on a weekend move to the next business day".

## Learned from the client's AFFB edit (2026-09-30)
19. **The purpose may be a need statement in the ministry's voice**: "We need to innovate how applications are received and
    processed to increase responsiveness and reduce manual effort." (alongside "We've built this prototype to show …").
20. **Integrations opener, production framing**: "In production, several integrations are needed, including …" is preferred.
21. **Name the criteria of a determination**: "When the AI is not able to make a clear determination on accuracy or
    completeness, those fields are flagged for human review."
22. **A domain object gets a word of context**: "farm vehicle licence plates", not "farm plates".

## Learned from the client's MAID edit (2026-09-30)
23. **Lead with the sequence word and strip the scaffolding.** "First, contact and sensitive details are removed." Not
    "The tool removes names and contact details before anything else is done." Sequence words ("First", "Then", "Next")
    carry the order; "the tool" and "before anything else" are padding.
24. **Every term of art is defined where it first appears**, including ones the ministry uses daily: "action requests,
    pieces of ministerial correspondence assigned to the unit for a reply and tracked in a system called ARTS".
25. **No semicolon splices.** Two thoughts are two sentences.
26. **Say what the person sees or does**, not the abstract property: "review a sample of the letters in a campaign", not
    "read a sample of a campaign"; "each sentence of the draft is checked against the approved text", not "traced to".
27. **Prefer "automatically" to "in code"** when speaking to a listener; "in code" is our vocabulary, not theirs.
28. **Each clause explains itself.** Not "Letter-writing campaigns add more." Say "Some of these letters come from
    letter-writing campaigns that use very similar writing." A clipped fact stacked into a sentence for rhythm assumes the
    listener already knows what it is and why it matters. (Client, MAID, 2026-09-30.)
29. **"Later" needs a where and a who.** Not "further errors are identified later in the process". Say "further errors are
    identified later, once the report has already been accepted."
30. **A rule set gets an example in the same breath.** "the program's reporting rules, such as required fields and valid
    dates"; "the list of rules that were broken", not "the rule codes".
31. **A role's verb is the decision it makes.** "who review each file and accept or return it", not "who review each file
    and decide".
32. **Steps in the order they happen.** A safeguard that runs before the model ("health information … is removed") is said
    before the model's step, not after it. (Self-review, 2026-09-30.)
33. **Name the Act.** "the Heating Oil and Propane Rebate Act and its regulation", not "the Act and the regulation".

## Learned from the client's JETI review (2026-09-30)
34. **A pronoun may only follow one candidate noun.** Not "who reviews the draft and prepares the reply. Then the team
    leads, who approve it before it is sent." When the preceding sentence carries two nouns (draft and reply), name the
    one meant: "who approve the reply before it is sent". The same for "them" ("those sources", not "them", after
    templates and program pages) and for "They" opening a sentence after a sentence with two plural nouns ("Complaints
    are recorded", not "They are recorded", after complaints and calls). A role's verb always names its object; the lint
    fails "who … it/them" in the roles scene and, with `LINT_PRONOUNS=1`, lists every other pronoun for the writer to
    confirm.
35. **A sequence that opens with "The first is" closes with "Finally,".** "The first is the recorder, who … Then the
    reviewer, who … Then the approver, who … Finally, the records officer, who sets the retention period." Not "And the
    records officer". "And" may only close a list that did not open with an ordinal. (Client, LR review, 2026-09-30.)

## Learned from the client's muni review (2026-09-30)
36. **No parenthetical aside between a subject and its verb.** Not "Alberta's municipalities, more than three hundred of
    them, file a return". A count or a qualification gets its own sentence or its own clause: "Each year, more than three
    hundred municipalities file a return".
37. **A phrase attaches to its nearest noun, so put it there.** "file on unpaid property taxes from oil and gas companies"
    reads as returns from the companies. Say "the property taxes that oil and gas companies have not paid". And a
    "those/these" noun repeats a noun the listener has already heard ("those taxes", not "those debts" after "unpaid
    property taxes").
38. **An organization enters the story with what it does and why it is there.** "The Alberta Energy Regulator, which
    licenses oil and gas wells, checks those taxes before it grants a company a new licence." Not "The Alberta Energy
    Regulator considers those debts."

## How a script is checked before the client hears it
1. `node tools/explainer-lint.mjs <slug>` (deterministic rules, exit 1 on failure).
2. `node tools/explainer-review.mjs <slug> --strict` (an independent judgment review against this guide, run through the
   Ent Tools gateway; it quotes the offending words and proposes the replacement). Both run automatically when a script
   file is edited (PostToolUse hook, `tools/explainer-hook.mjs`) and inside `explainer.mjs --check`.
3. The writer reads the full narration once more for the client's recurring faults (rules 3, 10, 23, 28, 34–38) before
   voicing, then sends audio and text together.
39. **Lead with the actor's action, not the paperwork.** Not "municipalities file a return listing the property taxes that
    oil and gas companies have not paid". Say "Alberta's more than three hundred municipalities identify the oil and gas
    companies who have not paid their property taxes." Who does what to whom, in that order; the document that carries
    the action ("the annual return") is named where the listener meets it in the walk-through. (Client, muni, 2026-09-30.)
40. **Every step names who is acting.** "Start by submitting the annual return" does not say who. Say "Start as a
    municipal staff member by submitting the annual return", and keep naming the actor as the walk-through moves
    ("the staff member confirms each match", "a ministry analyst resolves"). The tester is told which role they are
    playing at each step. (Client, muni, 2026-09-30.)

## Project adaptations for IOA (copied from the Prototype Lab guide on 2026-10-07)
This copy governs the Immigration Oversight Act videos. Every rule above applies unchanged. IOA is not a Prototype Lab
prototype and has no Atlas, so these fixed lines are adapted and are NOT faults:
- Roles opener: "Let's have a look at this system, which will support several roles."
- How opener: "Here's how the system works."
- Purpose: "We've built this system to …"
- Integrations closer: "In the test environment, these integrations are all simulated." (or which are live, then "The other integrations are simulated.")
- Try opener: "You can try this system now in the test environment."
- Close: "If you find anything deficient in the system, tell the Technology and Innovation build team. The team will log a ticket and task the fix, with the change ready for testing the next day."
- Length: the overview runs up to about three minutes and the walkthrough ten to twenty minutes, because the client asked for those lengths.
