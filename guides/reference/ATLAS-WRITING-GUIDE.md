<!-- Attributed copy (2026-11-11) of /mnt/data/projects/atlas-alone/service/config/writing-guide.md: Atlas's core writing guide, which joins the shared prose rules and the client narration rules, and which Atlas applies as a gate (check, then one editing pass) before a script reaches a voicing service. Do not edit here. -->

# Atlas's writing guide

Feature `atlas.writing_guide`. Every script, narration, brief and piece of prose that Atlas, a coding agent or a team member writes for
people to read or hear follows this guide. It joins two standards the sponsor's earlier video work used: a plain business prose style
and the narration rules a ministry client set in its vetting sessions. Atlas checks a script against it before the script goes to a
service that voices or renders it (`service/lib/writingguide.js`).

## Core principle

Write in plain declarative language. Make a claim. Move on. Trust the reader to follow without rhetorical scaffolding. If a sentence
works only because of its rhythm, its symmetry, or the way it sounds when read aloud, it is the wrong sentence. Replace it with one
that works because of what it says. The target voice is a competent senior official briefing a peer: direct, specific, declarative,
unhurried. If a sentence sounds like a movie trailer, a TED talk opening or a LinkedIn post, rewrite it.

## Who is listening

A ministry executive, a program lead or a policy analyst hearing a narration once, without a screen to scroll back, who knows their own
program but not our systems or our vocabulary. Every gap is closed for them. Nothing is assumed.

## Hard rules: the patterns that read as written by AI

1. **No "this is not A, but B" constructions, in any form.** "This is not X. It is Y." "Not just X, but Y." "Not only X, but also Y."
   "X is not the goal. Y is." "This is more than X. It is Y." State what the thing is and drop the negated half. If a contrast carries
   real information, give each side its own complete sentence.
2. **No em dashes or en dashes in prose.** Use a comma, a full stop, parentheses or a colon. A sentence that leans on a dash is usually
   two sentences.
3. **No cinematic short sentences.** Two or three short declarative sentences in a row for effect ("The window is open. The plan uses
   it.") read as a trailer. A short sentence used as a slogan or a headline ("One rule holds everywhere." "Everything starts here."
   "Atlas collects. People decide.") is the same fault. Write one sentence of normal length that says the fact.
4. **No "this is the moment" or "this is where" anchors.** Describe what the step delivers.
5. **No tetracolons or parallel "is the X" listings** for rhythm. Write ordinary sentences. Use a list only for items that really are a
   list of comparable things.
6. **No three-item lists invented to complete a rhythm.** If two things apply, list two.
7. **No participial flourish at the end of a sentence** (", demonstrating its leadership", ", making it easier"). End at the full stop,
   or give real information its own sentence.
8. **No "ensure" where a direct verb works.** "Maintain visibility", not "ensure visibility is maintained".
9. **No vague intensifiers or softeners:** very, really, truly, deeply, profoundly, incredibly, extremely, particularly, notably,
   importantly, just, simply, quietly, honestly, basically, actually.
10. **No banned vocabulary.** Verbs and adjectives: leverage, unlock, navigate (as a metaphor), delve, robust, seamless, crucial,
    essential, vital, holistic, nuanced, intricate, comprehensive, significant (as filler), interlocking, mutually reinforcing,
    crystallize, amplify, tee up, empower, supercharge, unleash, effortless, powerful, transformative. Nouns: landscape, ecosystem,
    tapestry, realm, paradigm, synergy, journey, fabric (as metaphors). Clichés: game-changing, cutting-edge, state-of-the-art,
    world-class, best-in-class, next-generation, revolutionary. Openers: Moreover, Furthermore, In essence, At its core, Fundamentally,
    In today's world, It's worth noting that, It is important to note that. Phrases: "From X to Y", "In a world where", "At the end of the
    day", "Move the needle", "Drive impact".
11. **No metaphors, no antithesis for effect** ("suggest, never decide"), **no dramatic colons, no rhetorical questions, no slogans as
    headlines.**

## Sentence rules for a narration

12. Define every proper noun, system and term of art on first use with an appositive, including ones we introduced ourselves: "the
    licensing system, which records every driver's licence". An organization enters the story with what it does and why it is there.
13. Complete sentences of ten to twenty words. No fragments anywhere.
14. Repeat the noun. Do not substitute a pronoun or a synonym. A pronoun may only follow one candidate noun: when the sentence before
    holds two nouns, name the one meant. "Those" or "these" repeats a noun the listener has already heard.
15. Say what happens, then where it lands and what the listener does next. Do not add a "so that …" tail that sells the point: state
    the fact and let the listener draw the conclusion.
16. Plain words: system, tool, staff, person, report, ticket, letter. Not "identifier", "masked", "audited", "assurance layer",
    "structured output", "oracle", "catalogue", "seams", "surface", "front door", "in code" (say "automatically").
17. Numbers in words where they are read aloud ("three to four hours"), and only numbers a source states.
18. "You" for the viewer; job titles for everyone else; an organization by its full name, then its acronym.
19. Present tense. System actions may be passive ("Stories are imported and screened for duplicates"); the viewer's actions are
    imperative and name the role they play: "Start as a registry agent by looking up a test driver."
20. Spell out a condition and its consequence. Not "Where a reading is doubtful, the value is held." Say "When the system cannot make a
    clear determination, these fields are flagged for human review." No shorthand states ("doubtful", "held", "unsure", "uncertain").
21. Every step names who is acting, and steps are told in the order they happen.
22. Guide the ear through a list with ordinals and connectors: "The first is …, who … Then …, who … Finally, …, who …". A list that opens
    "The first is" closes with "Finally,", and "And" does not open its last item.
23. Lead with the sequence word and strip the scaffolding: "First, contact details are removed."
24. No semicolon splices: two thoughts are two sentences. No parenthetical aside between a subject and its verb.
25. A phrase attaches to its nearest noun, so put it there. A rule set gets an example in the same breath ("the reporting rules, such as
    required fields and valid dates"). "Later" needs a where and a who.
26. A role's verb is the decision it makes ("who review each file and accept or return it").
27. Say what the system does not do and who decides ("Nothing is sent on its own. A staff member approves every reply.").
28. Truth first: every sentence can be checked against the product, its documents or its help. Where the product does not yet do what
    the script needs to say, the product is built first and the script waits.

## On-screen text

Headlines read in the same register as the narration and say what happens on that screen ("How this tool uses artificial
intelligence", "The roles this system supports"). Never a slogan. Short phrases are allowed on screen; the word rules above still apply.

## Structure of prose

Headings describe content, not importance. Bullets are for real lists. One idea per paragraph: open with the claim, support it, stop.
End a section at the full stop, with no closing flourish that restates it. Do not foreshadow ("As we will see") or recap ("As noted
above").

## How Atlas checks a script

`writing_check` runs the rules a program can test (patterns, words, sentence lengths, fragments, dashes, digits, questions, pronouns
after two nouns) and, when it is set up, an independent review by a model against this guide, which quotes the offending words and
proposes a replacement. A script with an error is sent back to its writer with the findings; warnings come back with the answer. The
review is a single pass to screen obvious issues: it sends a script back once, and the writer's next script for that service, within the hour, goes after the testable rules alone.
