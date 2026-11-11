# Narration and voice

Every word that is spoken in Agency 2026 media follows this guide: MVAI films and explainers, sizzle voice-overs, the run of show's
announcements, speaker introductions, recorded briefings and any clip voiced by text to speech. It sits on top of `guides/WRITING.md`
(all of which applies) and gives the narrated-film detail to the owner's standard, `guides/reference/VIDEO-STYLE-GUIDE.md`, which is part
of this guide.

**Precedence.** (1) Lines the owner dictates, word for word (`owner_lines.txt`). (2) This guide and the owner's video standard. (3) MVAI's
defaults and examples.

The machine-readable parts live in `brand/voice/`:

| File | What |
|---|---|
| `voices.json` | The voice registry: engine, the approved voices by role, their settings, the Protected fallback, cloning rules, decisions |
| `intros.json` | The introduction formulas, with slots, word limits and examples, and the fixed lines of the system-explainer profile |
| `lexicon.json` | How names, places, acronyms, dates and web addresses are written for the voice, and how they should sound |

---

## 1. One engine, three voices

| Role | Voice | ElevenLabs id | Settings (stability / similarity / style / boost) | Status |
|---|---|---|---|---|
| **Narrator** for every film, explainer, walkthrough, reel and briefing | Matilda | `XrExE9yKIg1WjnnlVkGX` | 0.5 / 0.75 / 0.2 / on | Approved by Janak Alford, 2026-10-11 |
| **Announcer** for stage announcements and speaker walk-ups | Simon (Canadian) | `FyYFoP6qNryBV7G8rnI9` | 0.55 / 0.75 / 0.15 / on | Proposed, owner to approve |
| **Alternate**, only where a film needs a second speaker | Jenna (Canadian) | `TgnhEILA8UwUqIMi20rp` | 0.5 / 0.75 / 0.2 / on | Proposed, owner to approve |

- **Engine:** ElevenLabs **`eleven_v4`**, through Ent Tools or MVAI. No other model, and no other engine for Unclassified work.
- **In an MVAI spec:** `"voice": { "name": "Matilda" }`. MVAI resolves the name; check that the build notes name the premade Matilda.
  MVAI lists two voices named Matilda; the approved one is the premade `XrExE9yKIg1WjnnlVkGX`.
- **One voice per series.** A film, its chapters, its sizzle and its cutdowns use the same narrator. A voice never changes mid-series.
- **Protected material:** Protected A or B is voiced in Canada by Google (`"provider": "google-ca"`): **Kore** replaces the narrator and
  **Charon** the announcer. A Protected series uses Kore for every part. Protected C and above are not voiced with these services.
- **Cloning** a real person's voice needs that person's documented consent and the owner's written approval, recorded in `voices.json`
  `decisions`. A clone never says words the person did not approve, and never voices Protected material (the sample leaves Canada).
- **Changing a voice** is the owner's decision only. Record it in `voices.json` `decisions` with the date and the person.

*Why: before this registry, projects used Matilda (Prototype Lab, IOA, Arlo, MVAI examples), Kore (Contact Alberta, Parable) and assorted
stock voices, so the same event sounded like several organizations.*

## 2. Who is listening

A public servant, an executive or a guest who hears each line once, with no screen to scroll back, who knows their own work but not our
systems or vocabulary. Every gap is closed for that listener. Nothing is assumed.

## 3. Shapes

| Shape | Use | Structure |
|---|---|---|
| **Argument film** (2–15 min a part) | Evidence films, program stories, briefings | The owner's standard, section 2: define the subject; why it matters, with a staged question; the baseline; the opportunity; the shift; the mechanism with figures; the size of the result with a fair comparison; the owner's conclusion. Context and scale before any mechanism. |
| **System or prototype explainer** (90–150 s) | A demo's explainer video | The problem (who runs what, for whom; what is wrong today) · the roles · how it works · artificial intelligence (optional) · integrations · try it. Uses the fixed lines in `intros.json` `fixed_lines`. |
| **Event explainer or sizzle voice-over** (30–90 s) | Agency promos | Event facts from `tokens.json` only. Complete sentences, no slogans; the event tagline only where the owner placed it. A reel may run on music alone. |
| **Stage announcements** | The run of show | The introduction formulas below, nothing else. |
| **Walkthrough** (10–20 min) | Training on an app | One chapter per role or task; each step says who acts, what happens on screen and why it matters. |

## 4. Introductions

People, sessions, demos, videos and days are introduced **the same way every time**, with the formulas in `brand/voice/intros.json`. The
run of show (`show/`) and `scripts/voice/say.py` fill them from the agenda; a writer uses them in MVAI specs by tagging the scene
(`"intro": "speaker-walkup"`), which the lint checks.

| Moment | Formula | Example (placeholders) |
|---|---|---|
| Opening of a day | `{greeting}, and welcome to {event}.` | "Good morning, and welcome to Agency twenty twenty six." |
| The day | `Day {day_number} of {event} is {day_title}[, {day_sub}].` | "Day one of Agency twenty twenty six is The Art of the Possible, a showcase for government." |
| Speaker walk-up (announcer) | `Please welcome {name}, {role}[, {org}].` | "Please welcome Jordan Sample, Director of Sample Services, the Ministry of Example Affairs." |
| Speaker from the host | `To present {title}, please welcome {name}, {role}[, {org}].` | |
| One approved fact (optional) | `{name} {fact}.` | "Jordan Sample leads the Sample Services modernization program." |
| Panel | `Please welcome the panel for {title}.` then one line each: `{name}, {role}[, {org}].`, moderator last: `…, moderates the panel.` | |
| Session | `{title} begins now[, in {place}].` · `{title} begins in {minutes} minutes[, in {place}].` | "Sample Session Title begins in five minutes, in Hall D." |
| Demo | `{title} is {what}, built by {team}.` then `{name}, {role}, presents the demo.` | "Sample Demo is a tool that drafts replies to ministerial letters for staff to review, built by the Example Branch." |
| Video | `{title} is a video about {subject}.` | |
| Break · lunch · return | `The program resumes at {time}[ in {place}].` · `Lunch is served in {place}. The program resumes at {time}.` · `The program resumes in {minutes} minutes. Please take your seats.` | |
| End of a day | `Day {day_number} of {event} is complete. Day {next_day_number} begins at {time} at {next_place}.` | |
| Organization in a film | `{org}, which {what}, …` | "The Alberta Energy Regulator, which licenses oil and gas wells, checks those taxes." |
| Person in a film | `{name}, {role}[ at {org}], …` then the full name again, never a pronoun | |
| On screen | Lower third: `{name}` / `{role} · {org}` | |

Rules for every introduction:

1. **Name, approved title, organization, in that order.** The title is the person's own, approved by the person. No adjectives.
2. **No praise.** Never "distinguished", "renowned", "esteemed", "visionary", "thought leader", "needs no introduction", "without further
   ado", "a very special guest". The lint fails them.
3. **At most one extra fact**, supplied or approved by the person, in its own sentence that repeats the name.
4. **No pronouns** for a person unless the person has stated them. Repeat the name.
5. **Ask how each name is said**, add it to `lexicon.json`, and listen to the rendered clip before the day.
6. **Owner-only moments have no formula**: house notes, land acknowledgements, thanks, credit and the event close are read word for word
   from the owner's text, by the person the owner names. A land acknowledgement is never written, edited or voiced by text to speech
   unless the owner says so.
7. **Announcements are present tense and plain.** "Sample Session Title begins now." Not "Get ready for…", "Coming up next…", "Put your
   hands together for…".

## 5. Spoken English

The voice reads every word aloud, once. Write for the ear.

| # | Rule | Before | After |
|---|---|---|---|
| 1 | **Complete sentences only.** No fragments, even in lists or try-it lines. | "Search the full history." | "You can search the full history of correspondence." |
| 2 | **25 words or fewer**, mostly 10 to 20, one idea each. The lint fails narration over 25 words. | A 34-word sentence | Two sentences |
| 3 | **Active voice; name the actor and the object.** | "Every appeal arrives by email." | "Every appeal the board receives arrives by email." |
| 4 | **Numbers as they are said**, with no digits and no hyphens (a hyphenated number cannot be cued). Years too. | "In 2026, 40 demos" · "forty-five" | "In twenty twenty six, forty demos" · "forty five" |
| 5 | **No parentheses, dashes, semicolons or symbols.** | "Results (strict check) – 96%" | "On the strict check, the AI agent scored ninety six percent." |
| 6 | **Define every name and term at first use**, with an appositive, including the project's own words. | "The Deck shows it." | "The Deck, a chat room the agents share, shows each task." |
| 7 | **A pronoun follows exactly one candidate noun**; otherwise repeat the noun. Never open a scene with "It". | "Staff send the draft and the reply. It is logged." | "…The reply is logged." |
| 8 | **Spoken lists** open with "First," and close with "Finally,". "And" closes only a list that did not open with an ordinal. | "The first is the registrar… And appellants…" | "…Finally, appellants, who…" |
| 9 | **No wayfinding.** Never announce what the film, chapter or next scene will do. | "This chapter looks at cost." | Give the first cost. |
| 10 | **One staged question per turn, in argument films only**, followed by where the answer comes from. No other questions. | "So what does it cost? The answer is…" | "But how much does it cost? The cost model in the business case gives the figures." |
| 11 | **Web addresses, phone numbers and symbols spelled out** as `lexicon.json` shows. | "Visit alberta.ca/agency." | "Visit alberta dot c a slash agency." |
| 12 | **Management register, not idiom.** | "counted by hand" | "recorded manually" |
| 13 | **"Select", not "click"; "automatically", not "in code".** | | |
| 14 | **Say what the system does not do, and who decides.** AI is optional where the build says so; say so. | | "Nothing is sent on its own. A staff member approves every reply." |
| 15 | **Synthetic data on screen is said to be synthetic.** | | "The screens show synthetic data." |

Pace: about 2.3 words a second, plus about 1.1 seconds of lead and tail per MVAI scene. Use a full stop for a pause; do not add pause
tags or SSML. Mix and loudness follow `guides/SOUND.md` (−16 LUFS, music ducked under the voice).

## 6. Pronunciation

1. Before voicing, list every product name, acronym, coined term, place and person's name in the spec's `terms` (MVAI) and in
   `brand/voice/lexicon.json`.
2. Write the narration with the lexicon's `write` form ("Agency twenty twenty six", "alberta dot c a").
3. After rendering, listen to every new name, or transcribe the clip with a Canada-resident model when the data requires it
   (`vertex-gemini-ca`), and confirm the name sounds as intended. Then set the entry's `status` to `checked` with the date.
4. If a name is said wrong, change the `write` form (a respelling in the narration only; the screen keeps the real spelling) and render
   again.

## 7. Workflow and checks

1. **Brief**: audience, argument, length, classification, the owner-only items (conclusions, thanks, acknowledgements).
2. **Outline** as one sentence per scene; check context before mechanism, the baseline, the staged question, the fair comparison.
3. **Draft** in a builder or content file, with figures read from their sources (or `tokens.json`), never retyped.
4. **Read the whole script aloud, in order**, once.
5. **Check**:
   ```bash
   python3 scripts/lint/lint.py spec.json --owner-lines owner_lines.txt     # 0 errors
   python3 scripts/mvai/mvai.py check spec.json                              # MVAI: 0 errors
   python3 scripts/voice/say.py --check show/samples/agency-2026.json        # every announcement fills its formula
   ```
6. **Render, then listen** to names and look at the end frame of every scene (`guides/VIDEO.md`).
7. **Turn each piece of owner feedback into a rule**: quote it with the date in this guide or the owner's standard, fix every other place
   it occurs, and add a lint rule when the fault is mechanical.

### Voicing an announcement

```bash
python3 scripts/voice/say.py speaker-walkup --name "Jordan Sample" --role "Director of Sample Services" --org "the Ministry of Example Affairs" --dry-run
python3 scripts/voice/say.py speaker-walkup --name "…" --role "…" --out out/voice/walkup-jordan.mp3      # announcer voice, eleven_v4
python3 scripts/voice/say.py --agenda show/samples/agency-2026.json --out out/voice/                     # every speaker-intro in an agenda
```

The script fills the formula, lints the line, voices it with the role's registered voice and settings, and writes the clip with a `.json`
record of the text, voice, model and date. Unclassified only; for Protected material use MVAI with `google-ca`.
