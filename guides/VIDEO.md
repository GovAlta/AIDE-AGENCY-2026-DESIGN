# Agency 2026 video with MVAI

Agency videos are made by **MVAI** (AIDE Motion Video, `https://mvai.app.int.gov.ab.ca`), the Government of Alberta service that turns a
JSON spec into a narrated, captioned, animated video. MVAI owns the video look: its `goa-agency` kit draws the circuit-board splash, the
44 Agency screens, the bus-sweep transitions, the caption bar and the classification band. This repo does not re-implement any of it. It
gives you the rules, a sample spec, a contact sheet of every screen and a small client, `scripts/mvai/mvai.py`.

The print, slide and digital templates in this repo copy the video's chrome (the Agency mark top-left, the Alberta logo top-right, the navy
band with the classification pill), so a handout and a film from the same project look like one set.

## Before you start

1. **Get an API key.** Open MVAI, select **API keys** (top right), name the key after the agent or person that will use it, and copy the
   `mvk_…` value. It is shown once. Store it in your environment (`export MVAI_API_KEY=mvk_…`), never in a file in this repo. Videos made
   with a key belong to the key's owner and stay in that person's private bucket.
2. **Certificate.** `*.app.int.gov.ab.ca` is signed by the GoA certificate authority. On a machine that does not trust it, set
   `MVAI_CA=/path/goa-ca-bundle.pem` (the bundle is in the MVAI repo, `deploy/goa-ca-bundle.pem`). On a SHELL VM the client skips the
   check by default.
3. **Read the brief rules.** Writing: `guides/WRITING.md`. Narration: the owner's standard, `reference/VIDEO-STYLE-GUIDE.md`. Format
   rules for this video type: `reference/agency-explainer.md` (the live copy is in the `get_video_type` answer).

## The video type

`agency-explainer` uses kit `goa-agency`, themes `agency-light` (white board, the default) and `agency-dark` (night board). Length 45 to
240 seconds, 6 to 25 scenes. Scene order: splash → title → (chapter → content screens …) → statement (the takeaway) → end. Longer films
are made as several jobs (one per chapter) and joined with ffmpeg, as the Contact Alberta film was.

Other MVAI types exist for other formats (`story-briefing`, `prototype-explainer`, `app-walkthrough`, `academy-lesson` and more). Use
`agency-explainer` for anything shown at or about Agency 2026.

## The loop

| Step | Our client | MCP tool | REST |
|---|---|---|---|
| 1. See the type | `mvai.py type agency-explainer` | `get_video_type {slug}` | `GET /api/v1/video-types/agency-explainer` |
| 2. Field guide for chosen screens | `mvai.py screens bars,stats,flow` | `get_screens` | `GET /api/v1/video-types/agency-explainer/screens?names=…` |
| 3. Fill the template | edit a copy of `samples/video/explainer-sample.json` | | `GET …/agency-explainer/template` |
| 4. Check | `mvai.py check spec.json` | `check_walkthrough {spec}` | `POST /api/v1/walkthrough/check` |
| 5. Create | `mvai.py create spec.json [--themes agency-light,agency-dark]` | `create_walkthrough {spec, images, library}` | `POST /api/v1/walkthroughs` |
| 6. Wait | `mvai.py wait <job>` | `get_video` every 20–30 s | `GET /api/v1/jobs/<job>` |
| 7. Review | `mvai.py fetch <job> out/video/` | `get_video` (contact sheet, poster) | `/jobs/<job>/out/…` with the key |
| 8. Revise | `mvai.py update <job> spec.json` | `update_walkthrough` | `POST /api/v1/jobs/<job>/spec` |

Notes on each step:

- **Check** runs the kit's JSON Schema, checks every cue against its scene's narration, and runs the Simplified Technical English and
  spoken-narration rules. Fix every `error`. Also run this repo's lint: `python3 scripts/lint/lint.py spec.json` (add `--ai-agent` for an AI
  service where staff are also called agents). The check also returns `estimate.total_s`: use it to hit the target length before you create.
- **Create** answers at once with a job id. Images and screen recordings named in `assets` (`{"upload": "x.png"}`) are sent from the
  spec's folder (or `--images dir`).
- **Review.** Look at the poster and the contact sheet, and read `warnings` (text the kit shortened or dropped), before calling a video
  finished. The contact sheet arrives 2 to 7 minutes after the video. Grab the last frame of each scene to check that every element landed:
  `mvai.py storyboard <job>` gives each scene's start and end.
- **Revise.** Narration that did not change is not voiced again, so revisions are cheap.
- **Busy service.** HTTP 429, a plain-text "Rate exceeded" body or an empty body means the service is busy: wait 30 to 60 seconds and retry.
  The client does this.

MCP instead of REST:

```bash
claude mcp add --transport http motion-video https://mvai.app.int.gov.ab.ca/mcp --header "X-API-Key: $MVAI_API_KEY"
```

## Classification and voice

Every video is Unclassified unless the content owner names a level, and MVAI draws the marking on every frame.

| Classification | Drafting (Claude on Vertex AI) | Voice | ElevenLabs voices and generated images (outside Canada) |
|---|---|---|---|
| Unclassified | yes | any; ElevenLabs is the default | yes |
| Protected A | yes | `google-ca` (Montréal) by default | yes, with a notice |
| Protected B | yes | `google-ca` by default | only with the owner's approval, `"external_processing_ok": true` |
| Protected C and above | no | no | MVAI may not be used |

Set the voice in the spec: `"voice": {"provider": "google-ca", "name": "Kore"}` keeps narration in Canada and costs least. The sample spec
and the screen bench use it.

## Spec essentials

```jsonc
{ "kit": "goa-agency", "theme": "agency-light", "title": "…", "classification": "Unclassified",
  "voice": { "provider": "google-ca", "name": "Kore" }, "captions": true,
  "terms": ["Trail Pass Finder"],                      // names the acronym check should accept
  "kit_options": { "event": "Agency", "year": "2026", "date": "Dec. 7–9, 2026", "place": "Edmonton · Calgary",
                   "host": "Ministry of Technology and Innovation", "host_label": "Hosted by", "series": "Explainer 01" },
  "scenes": [ { "type": "splash", "duration": 6 }, { "type": "title", "headline": "…", "narration": "…" }, … ] }
```

- `narration` is spoken word for word. The voice reads about 2.3 words a second, and each scene adds about 1.1 seconds of lead and tail.
- Every `cue` is a phrase from that scene's narration (`"word#2"` for the second time a word appears) or seconds from the scene start.
  Cue each item at the start of the sentence that introduces it. Add `"hold": 1.5` when the last item needs time on screen.
- Scene fields shared by every type: `ground` (board, paper, night, navy, spectrum), `accent` (a spectrum name), `transition`
  (sweep, rise, iris, cut), `label` (the small mono tag top-left), `traces` (true or false).
- Circuit art belongs to the splash, title cards, chapter cards, the end card and transitions. Content screens are a clean board. The chip
  appears on the splash only. Use `night` or `navy` grounds on a few scenes for contrast, and `spectrum` once, for the line people should
  remember.
- Write numbers in narration as they should be said ("two point seven million"); digits in narration are flagged.
- `"captions": true` burns captions in. VTT and SRT files are always made.

## The scene catalogue

MVAI rendered its own fictional screen-bench example for this repo (job `fbe6d95ed434`, 2026-11-10, both themes, 8.8 minutes). One finished
frame of every scene is in `samples/video/screen-bench/frames/`, and `contact-sheets/` holds them as sheets. The spec that made them is
`samples/video/screen-bench/screen-bench.json`: copy any scene from it as a starting point.

| Purpose | Screen | Frame (light theme; `agency-dark-…` beside it) |
|---|---|---|
| Open, structure and close | `splash` | `agency-light-01-splash.jpg` |
|  | `title` | `agency-light-02-title.jpg` |
|  | `chapter` | `agency-light-03-chapter.jpg`, `agency-light-19-chapter.jpg`, `agency-light-34-chapter.jpg`, `agency-light-46-chapter.jpg` |
|  | `end` | `agency-light-58-end.jpg` |
| One strong message | `statement` | `agency-light-20-statement.jpg`, `agency-light-21-statement.jpg` |
|  | `big-number` | `agency-light-22-big-number.jpg` |
|  | `quote` | `agency-light-08-quote.jpg` |
|  | `question` | `agency-light-09-question.jpg` |
| Explain an idea or a term | `definition` | `agency-light-10-definition.jpg` |
|  | `bullets` | `agency-light-04-bullets.jpg`, `agency-light-05-bullets.jpg` |
|  | `icons` | `agency-light-06-icons.jpg`, `agency-light-07-icons.jpg`, `agency-light-12-icons.jpg` |
|  | `layers` | `agency-light-55-layers.jpg` |
| Compare or contrast | `compare` | `agency-light-13-compare.jpg` |
|  | `before-after` | `agency-light-33-before-after.jpg` |
|  | `myth-fact` | `agency-light-11-myth-fact.jpg` |
|  | `venn` | `agency-light-52-venn.jpg` |
|  | `matrix` | `agency-light-51-matrix.jpg` |
| Steps, sequences and time | `process` | `agency-light-37-process.jpg`, `agency-light-38-process.jpg` |
|  | `checklist` | `agency-light-14-checklist.jpg` |
|  | `timeline` | `agency-light-35-timeline.jpg` |
|  | `roadmap` | `agency-light-36-roadmap.jpg` |
|  | `phases` | `agency-light-45-phases.jpg` |
|  | `journey` | `agency-light-41-journey.jpg` |
|  | `cycle` | `agency-light-39-cycle.jpg` |
|  | `funnel` | `agency-light-40-funnel.jpg` |
|  | `agent-loop` | `agency-light-42-agent-loop.jpg` |
|  | `countdown` | `agency-light-43-countdown.jpg`, `agency-light-44-countdown.jpg` |
| Numbers and data | `stats` | `agency-light-23-stats.jpg` |
|  | `bars` | `agency-light-24-bars.jpg` |
|  | `columns` | `agency-light-25-columns.jpg` |
|  | `line` | `agency-light-26-line.jpg`, `agency-light-27-line.jpg` |
|  | `donut` | `agency-light-28-donut.jpg` |
|  | `gauge` | `agency-light-29-gauge.jpg` |
|  | `ranking` | `agency-light-30-ranking.jpg` |
|  | `waffle` | `agency-light-31-waffle.jpg`, `agency-light-32-waffle.jpg` |
| Systems and how they connect | `architecture` | `agency-light-47-architecture.jpg` |
|  | `hub` | `agency-light-48-hub.jpg` |
|  | `network` | `agency-light-49-network.jpg` |
|  | `tree` | `agency-light-50-tree.jpg` |
|  | `flow` | `agency-light-53-flow.jpg` |
|  | `map` | `agency-light-54-map.jpg` |
| People and voices | `people` | `agency-light-15-people.jpg`, `agency-light-16-people.jpg` |
|  | `chat` | `agency-light-17-chat.jpg`, `agency-light-18-chat.jpg` |
| Show the tool or the screen | `screen` | `agency-light-56-screen.jpg`, `agency-light-57-screen.jpg` |

One more screen, `punch` (a silent full-frame section word for beat-cut sizzles), appears in MVAI's `three-days` example and is not in the
bench.

Pick the screen that fits each idea and vary them; most ideas fit two or three screens. `mvai.py screens <names>` gives the full field guide
and working example scenes.

## Narration standard, in brief

The owner's standard (`reference/VIDEO-STYLE-GUIDE.md`) governs every narrated Agency video. Precedence: lines the owner dictates, word for
word, then the standard, then MVAI's own defaults and examples. Its core:

1. **Brief first.** Audience, argument in one sentence, length ceiling, classification, and what only the owner can supply (conclusions,
   lessons, asks, credit, closing words).
2. **Context and scale before mechanism.** The problem and its size, why the obvious approach is not enough, the decision, why each part of
   the answer exists, and only then activity figures.
3. **Define every term before using it.** Keep a glossary in the builder and check it.
4. **No wayfinding.** No "In this video", "Chapter two is about", "Here is how" or "The answer is".
5. **Every number has a source** in the notes file, and comparisons are fair (same method, each side scored alone).
6. **Dynamic screens.** The screen shows and the narration explains. Prefer screens that build on the cue over static text.
7. **Frame QA.** Look at the end frame of every scene before delivery.

Keep three files beside each spec: the builder or spec, `NOTES.md` (sources by figure, caveats, open confirmations) and `owner_lines.txt`
(dictated lines, never edited). `contact-alberta/docs/video/agency/` is a complete worked example.

## Samples in this repo

| File | What it is |
|---|---|
| `samples/video/explainer-sample.json` | A fictional 79-second explainer (9 scenes) that passes `check_walkthrough` with no findings. Start here |
| `samples/video/sizzle.json` | MVAI's fictional event sizzle, "The Art of the Possible" (19 scenes) |
| `samples/video/screen-bench/` | MVAI's fictional screen bench: every screen once or twice, with rendered frames |

`samples/video/README.md` has the details.
