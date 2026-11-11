# Running the show

The show player in `show/` runs a whole event day from a JSON agenda.

- **The stage** is the screen the room sees. It shows:
  - the walk-in loop, countdowns and the opening sequence;
  - the day bumpers, speaker welcomes and lower thirds;
  - slides, and videos with sound;
  - breaks, thanks and the close, with a motion transition between every screen.
- **The control** is the operator's screen. It steps forward and back through the day, fires sound and voiced announcements, and
  handles blackout and freeze.

The look follows the motion library (`motion/library`) and `brand/tokens/tokens.json`.

| File | What |
|---|---|
| `show/server.mjs` | Server: the files, plus event codes over Server-Sent Events |
| `show/index.html` | Start page: new show, join as stage, join as control |
| `show/control.html` | The control |
| `show/stage.html` | The stage |
| `show/lib/engine.js` | Every command, in one place |
| `show/lib/transport.js` | How the stage and the control talk |
| `show/agenda.schema.json` | The agenda format |
| `show/samples/` | Sample agenda (placeholder sessions), sound cues, slides, a video |
| `show/Dockerfile`, `show/pack.mjs` | The published app |
| `show/test/run.mjs`, `show/test/remote.mjs` | Headless rehearsals |
| `show/screens/` | Screenshots of every scene and page |

## Three ways to run it

| | One laptop | Two machines on the venue network | Published app (event code) |
|---|---|---|---|
| Stage and control | Two windows in one Chrome | Any two browsers on the same network | Any two browsers that can reach the app |
| Start | `node show/server.mjs` | `node show/server.mjs --host 0.0.0.0 --memory` on the operator laptop | `publish-app` (below) |
| Connect | **Open stage window** in the control | Start page, **New show**, then join with the code | Start page, **New show**, then join with the code |
| Needs the internet | No | No (the venue network only) | Yes, the whole time |
| If the link drops | No link to drop | The stage holds its picture and catches up when the link returns | The same |

All three use the same agenda, the same screens and the same keys. Laptop mode needs no event code: the control window holds the show
and drives the stage window over the browser's own channel. In the other two modes the server holds the show. The control sends
commands with its PIN, and every screen receives each change, with a full snapshot whenever it connects or reconnects.

### 1. One laptop

```bash
node show/server.mjs --memory          # or: npm run show   (--memory: ignore DATABASE_URL, which the SHELL sandbox sets)
```

1. Open the printed address. Then open the laptop control link at the bottom of the start page, or go straight to
   `/show/control.html`.
2. Select **Open stage window**, drag the window to the projector display, and press F11.
3. Click once on the stage window to allow sound. The control's `sound:` pill turns green.

### 2. Two machines on the venue network

On the operator laptop, run `node show/server.mjs --host 0.0.0.0 --memory`. It prints its venue-network address, for example
`http://10.0.0.12:8765/`.

1. On the operator laptop, open the address and select **Make the show**. Note the event code and the PIN.
2. On the projector machine, open the same address, select **Join as the stage screen**, type the code, press F11 and click once to
   allow sound.
3. On the operator laptop, select **Open control**.

The laptop's firewall must allow the port. Use a wired network if the venue has one.

### 3. Published app with an event code

```bash
node show/pack.mjs                 # copies the tokens, fonts, logos, sound and motion videos the show uses into show/.bundle/
cd show
publish-app agency-show --database --min-instances 1 --memory 1Gi
```

- `publish-app` builds from `show/` alone, which is why `pack.mjs` comes first. Run it again after changing any media or agenda.
- After the first publish, register the app in the App Directory (`https://apps.sandbox.aim.int.gov.ab.ca`).
- The app is then `https://agency-show-janak.sandbox.aim.int.gov.ab.ca/`. Stage links look like
  `https://agency-show-janak.sandbox.aim.int.gov.ab.ca/stage?code=AGY-7K2`.
- SHELL SSO sits in front, so every screen needs a SHELL sign-in.

`--database` keeps the shows in the app's Postgres database. Cloud Run may run several copies of the app; each change is announced
through the database (LISTEN/NOTIFY), so a stage connected to one copy follows a control connected to another. Another way is to hold
the app to one copy, with an hour-long request timeout so the event streams stay open:

```bash
gcloud run services update agency-show-janak --max-instances 1 --timeout 3600   # then the memory store is enough
```

Event streams reconnect on their own when Cloud Run ends a request at its timeout, and every reconnect starts with a snapshot.

- **Event codes** look like `AGY-7K2`. They use six characters from an alphabet without 0/O or 1/I/L, and expire after 72 hours.
- **The PIN** is six digits. It is shown once, when the show is made, and stored only as a hash. Commands need it in the `X-Show-Pin`
  header. The stage needs no PIN: it can only read, and report that a video ended.
- **The control link** carries the PIN. The control moves the PIN out of the address bar as soon as it loads. Share the control
  link only with operators.
- **Several controls** may join one show. Each command changes the state in order. A control that sends a command after another
  control's change sees a conflict note, and the command log shows who sent what (the SHELL email from `X-Forwarded-Email`). The app
  stores nothing else about people.
- **Rate limits** apply: 10 commands a second for each show, and 3 stage reports a second.
- **Media:** everything in the image is available to every show. **Media for your agenda (zip)** on the start page uploads files to
  one copy of the app only. They are lost when that copy stops, and other copies cannot see them. In the agenda, write uploaded files
  as `{assets}/slides/slide-01.jpg`. For the real event, put the media in the repo, name it in the agenda, run `pack.mjs` and publish.
  A storage bucket is the next step if the media outgrows the image.

## The agenda

`show/agenda.schema.json` is the full format. In short:

```jsonc
{ "event": { "name": "Agency 2026", "dates": "Dec. 7–9, 2026", "cities": "Edmonton · Calgary", "timezone": "America/Edmonton", ... },
  "theme": "compliant",                                  // or "mvai" (Inter); the operator can switch it live
  "audio": { "cueFiles": ["show/samples/cues.json", "brand/audio/cues.json"], "pads": ["open-show", "walkup-a", ...],
             "voiceManifest": "out/voice/manifest.json" },
  "days": [ { "date": "2026-12-07", "label": "Day 1", "name": "Monday, December 7", "title": "...", "sub": "...", "place": "...", "accent": "blue",
    "segments": [
      { "id": "d1-doors", "type": "holding", "start": "07:30", "end": "08:55", "title": "Doors open", "music": { "bed": "bed-walkin" } },
      { "id": "d1-key", "type": "speaker-intro", "start": "09:10", "end": "09:45", "title": "...",
        "speakers": [{ "name": "...", "role": "...", "org": "...", "fact": "leads the ... program" }],
        "slides": { "dir": "decks/keynote", "pattern": "slide-{nn}.jpg", "count": 24 },
        "music": { "walkup": "walkup-a" },
        "scenes": [ { "type": "intro" }, { "type": "title" }, { "type": "slides", "lowerThird": true } ],
        "notes": "Shown to the operator only" },
      { "id": "d1-demo1", "type": "demo", "start": "09:50", "title": "...", "what": "a tool that ...", "team": "the ... Branch", "speakers": [...] },
      { "id": "d1-sizzle", "type": "video", "start": "09:45", "title": "...", "subject": "...", "video": { "src": "show/samples/media/x.mp4" } } ] } ] }
```

- A **segment** is one agenda item. Its **scenes** are the screens it steps through. Leave `scenes` out to use the defaults for its
  type, which the schema lists. GO moves to the next slide, then the next scene, then the next segment. Give every segment an `id`:
  voiced announcements are matched to segments by `id`.
- **Scene types:** `holding`, `opening`, `countdown`, `title`, `intro`, `panel`, `slides`, `video`, `break`, `bumper`, `stat`, `thanks`
  and `closing`. Any segment field can be repeated on a scene to override it there.
- **People:** each speaker is `{name, role, org, fact?, moderator?}`, exactly as the person gave them, in writing
  (`guides/NARRATION.md`).
  - The lower third is the name on line 1 and "role · organization" on line 2.
  - `fact` is the one extra fact the person approved. It is spoken, never shown.
  - `moderator: true` flags the panel card, and that person is introduced last.
- **Demos** take `what`, which completes "{title} is {what}, built by {team}.", and `team`, which the demo title card shows as
  "Built by {team}". **Videos** take `subject`, which completes "{title} is a video about {subject}."
- **Slides** are images. Make them with `node scripts/make.mjs deck.json`. Export a speaker's PDF with
  `pdftoppm -r 144 -jpeg deck.pdf decks/keynote/slide`, or a PowerPoint with File > Export > PNG.
- **Video** plays on the stage with sound through the show mixer, and the music bed ducks under it. Every screen keeps its video at
  the same position from the shared show clock. When the video ends, the show moves on, unless the segment says
  `"autoAdvance": false`.
- **Countdowns** count to the next programme segment's start time. They can count to `target` instead, or to the operator's override.
  **Breaks** show "The program resumes at …" with a live countdown.
- **Music:** `bed` starts a looping bed; `null` fades the bed out, and leaving `bed` out keeps the current one. `sting` and `walkup`
  fire once when the scene goes on air with GO or TAKE, never with BACK. The cues are described in `guides/SOUND.md` and
  `brand/audio/cues.json`.
- **Use only confirmed facts.** Event facts come from `tokens.json`. Set `"sample": true` on a practice agenda, and every screen is
  tagged "Sample content".

Check an agenda before the day:

```bash
python3 -c "import json,jsonschema;jsonschema.validate(json.load(open('my-agenda.json')),json.load(open('show/agenda.schema.json')))"
python3 scripts/lint/lint.py my-agenda.json                                       # 0 errors
python3 scripts/voice/say.py --agenda my-agenda.json --check                      # every announcement, linted
```

## Voiced announcements

```bash
python3 scripts/voice/say.py --agenda my-agenda.json --out out/voice     # voices every announcement and writes out/voice/manifest.json
```

The announcements use the formulas in `brand/voice/intros.json`: walk-ups, panels, demos, videos, breaks, lunch and the day close.
Their clip ids are `<segment id>-<formula>[-n]`.

- The control's **Announce** box lists the clips for the segment on air and the segment in Preview. Select one to play it, or press A
  for the next one not yet played.
- Clips play over the bed and duck it.
- Listen to every clip before the day, especially names (`brand/voice/lexicon.json`).
- For the published app, voice them first, then run `pack.mjs`: it copies `out/voice` into the image.

## Operating

The **Program** monitor is what the room sees. The **Preview** monitor shows what GO or TAKE will put on air.

| Key | Does |
|---|---|
| Space, →, Page Down | **GO**: the next slide, scene or segment. A presentation clicker sends Page Down, so it works too |
| ←, Page Up | **BACK**: one step back, with no sound |
| ↑ ↓ | Select a segment in the rundown (it shows in Preview) |
| Enter | **TAKE** the selected segment. Double-click a rundown row or scene chip to take it at once |
| L / Esc | Lower third on or off for the first speaker. The speaker buttons fire any speaker |
| A | The next voiced announcement for the segment on air |
| B | Blackout: fades to black; press again to return |
| F | Freeze: holds the picture and pauses the video |
| M | Mute all sound |
| V / R | Play or pause / restart the video |
| 1–9, 0 | Sound pads 1–9; 0 stops them |

The header shows:
- the event code;
- `link:` how this control is connected: `live` (event stream), `poll` (fallback), `lost` or `local`;
- `stage:` whether a program stage is reporting, or `behind` when it is more than one change behind;
- `sound:` whether the stage can play sound;
- the drift (how late or early this segment started, or how far it has run over), and the show clock.

The side panel also holds:
- the event-code links;
- the music bed and master volume, with a level meter;
- the countdown override, and the rehearsal clock (run the day as if it were, say, 08:50 on December 7);
- the look: the event template's Arial, or the MVAI kit's Inter;
- the command log.

## Rehearse

- [ ] `node show/test/run.mjs` and `node show/test/remote.mjs` pass on the show laptop. Add `--pg` to `remote.mjs` to test the database.
- [ ] **SSE through the gateway.** Open the published stage. After 20 seconds the control's `link:` pill still says `live`, not `poll`.
      If it says `poll`, the gateway is buffering the event stream. The show still works on long-polling, a little slower, so tell the
      platform team.
- [ ] Step through every segment, scene and slide on the real projector at the real resolution.
- [ ] Read every name, role and organization back against what the person confirmed. Listen to every voiced clip.
- [ ] Play every video with sound through the house system, and check that the bed ducks under it.
- [ ] Hear every cue in the room at show level: beds under conversation, stings and walk-ups clearly above. Set `gain_db` in the cue
      file, not on the house desk.
- [ ] Check the countdowns with the rehearsal clock set to each day.
- [ ] Try blackout, freeze and mute. Pull the stage machine's network cable for 30 seconds, then plug it back in. The stage holds
      its picture, then catches up.
- [ ] Have a spare laptop ready with the repo and the agenda, able to run laptop mode at once.

## When something goes wrong

| Problem | Do this |
|---|---|
| The stage froze, went white or closed | Reload it (F5), or select **Reload stage**. It returns to the step on air. A closed window: open the stage link again |
| The control closed | Open the control link again. It returns to the show as it is |
| The network dropped | The stage keeps showing the scene on air, and video keeps playing. When the link returns, a snapshot brings it to the current step. Press F (freeze) first if you need the room to see a steady picture while you fix it |
| The published app cannot be reached | Switch to laptop mode: `node show/server.mjs --memory` on the operator laptop, HDMI to the projector, then TAKE the segment on air |
| No sound | The `sound:` pill is red: click once on the stage. Then check M (mute), the master slider and the stage machine's sound output |
| Wrong screen on air | Press B (blackout), find the right step, press GO or TAKE, then B again |
| A video will not start | V plays it, R restarts it, GO skips it |
| The programme runs late | Drift shows how far. Use the countdown override for the next start |
| `link: poll` or `lost` | `poll` works, a little slower. `lost`: check the network. The control keeps trying, and its commands fail with a message until it reconnects |

## Add a scene type or a command

1. **A scene:** in `show/stage.js`, add `SCENES.<type> = (r) => ({ el, tick(t), exit?() })`.
   - `r.scene` is the scene merged over its segment.
   - `tick(t)` draws the scene at `t` seconds after it went on air. Draw everything from `t`, so freeze and reload land on the same
     picture.
   - Add the type to `$defs/scene/type` in the schema, and to `DEFAULT_SCENES` in `show/lib/core.js` if a segment type should use it.
2. **A command:** add a case to `apply()` in `show/lib/engine.js` and add its name to `COMMANDS`. The server and laptop mode then
   both have it.
3. Add a step to the tests, run them, and look at the screenshots.

Colours come from CSS variables that `core.js` `themeVars()` sets from `tokens.json`. Never write a hex value in a scene.
