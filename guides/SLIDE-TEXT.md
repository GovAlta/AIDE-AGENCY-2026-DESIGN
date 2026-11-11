# Text on screens

Rules for text people read at a glance: slides, MVAI video screens, the run-of-show stage, signs, social cards, lower thirds and captions.
Everything in `guides/WRITING.md` applies. This file adds the lengths and forms that make screen text consistent. The lint checks the
limits by field name (`scripts/lint/lint.py`, "screen text" rules).

## The principle

The screen shows; the speaker or the narration explains. A screen carries one message, in the fewest words that still make sense to
someone who walked in late. Every item on a screen is said, or directly supported, by what is being said while it is up.

## Lengths

| Field (content JSON key) | Limit | Form | Example |
|---|---|---|---|
| `kicker` | 6 words | Event, series or section name, no verb | "Agency 2026 · Showcase" |
| `title`, `headline` | 8 words (lint warns over 8, fails over 12) | Sentence case, a plain label or a plain statement, no end punctuation | "Pilot year results" · "The decisions stay with staff" |
| `sub`, `subtitle` | 16 words | One sentence or phrase that adds the scope | "Applications read by the pilot service, April to September" |
| `lead` | 40 words | One or two full sentences | |
| bullet, `points[]`, `items[].text` | 7 words | Starts with a verb or a noun, parallel form, no end punctuation | "Reads the application in seconds" |
| bullets per slide | 5 | | |
| tile `label` | 7 words | What the number counts | "applications read" |
| tile `value` | a figure and unit | Figure, not words | "9,000" · "87%" · "12 min" |
| step `title` | 3 words | Verb first | "Check the rules" |
| step `text` | 12 words | One plain sentence or phrase | |
| chart title | 8 words | Says what the chart shows, not the conclusion | "Days to approve a permit, by region" |
| `source`, `note` | 30 words | Where the numbers came from | "Source: sample data, fictional pilot." |
| lower third | name + role · org | No full stops, no adjectives | "Jordan Sample" / "Director of Sample Services · Example Ministry" |
| caption line | 42 characters, 2 lines | Verbatim narration, broken at phrases | |
| sign direction | 4 words | A place and an arrow | "Hall D" → |
| social card title | 8 words | Event facts as on the invites | |

## Forms

1. **One message per slide.** If a slide needs two headlines, it is two slides.
2. **Headlines say what the slide shows** ("Savings against spend") or state one plain fact ("The decisions stay with staff"). Never a
   slogan ("Built for speed"), a tease ("What happened next") or a question, except on a chapter card that the next slides answer.
3. **Bullets are parallel**: all start with a verb, or all with a noun. No full stops on fragments. Full sentences, when needed, take full
   stops and then every bullet in that list is a full sentence.
4. **Numbers on screen are figures with units** ("$119M", "81×", "12 min"), and the source line sits on the same slide.
5. **Label example values.** "Sample data", "Example values" or "Fictional" on the slide itself.
6. **Speaker notes are full sentences** in the narration register (`guides/NARRATION.md`): they are often read aloud.
7. **Agenda and schedule lines**: time, title, place, in that order: "9:10 a.m. · Opening keynote · Hall D".
8. **Calls to action** are a verb and a destination: "Scan for the agenda", "Visit the Technology and Innovation booth". One per screen.
9. **No text over art.** Circuit traces, photos and gradients never sit behind words (`guides/BRAND.md`).
10. **Classification** is shown as the template draws it. Never type it into a headline.

## Before and after

| Before | After | Rule |
|---|---|---|
| "Unlocking Seamless Service Delivery" | "Applications processed in one visit" | Plain statement, sentence case, no hype |
| "Five Things You Need To Know" | "Pilot results" | No counts or teasers |
| "Our AI: Smarter, Faster, Safer" | "The AI agent answers in one second" | No rule of three; the fact |
| "• Faster processing.\n• Improved accuracy.\n• Better outcomes." | "• Answers in one second\n• Checks every number\n• Hands hard cases to staff" | Specific, parallel, no full stops |
| "Thank you to our amazing partners!" | Owner's own thanks, or "Thank you" | No praise, no exclamation marks |
