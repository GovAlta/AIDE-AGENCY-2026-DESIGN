# Sound

Agency 2026 has one sonic palette, used for every sound moment of the event day: walk-in, countdowns, openers, day bumpers, speaker
walk-ups, applause swells, breaks, reels, awards and the close. The cue list is `brand/audio/cues.json`. The show player (`show/`) and the
motion renderer read it. Every cue is music made by the content owner in Suno. This guide sets the palette, lists the cues, gives the Suno
settings, and says how a delivered file becomes a cue.

## The palette ("Agency signal")

Both reference tracks were made by the owner in Suno on 2026-11-10 and measured with the MVAI beat tool (`brand/audio/analysis/`):

| | Percussive Hook | Tech Sizzle Cue |
|---|---|---|
| File | `brand/audio/source/percussive-hook.mp3` | `brand/audio/source/tech-sizzle-cue.mp3` |
| Length | 130.9 s | 99.8 s |
| Tempo | about 94 bpm (bar 2.57 s) | about 104 bpm (bar 2.31 s) |
| Key (chroma estimate) | A minor | D major |
| Loudness as delivered | -15.8 LUFS | -15.4 LUFS |
| Shape | intro 0-9 s, steady groove to 56 s, lift to 78 s, peak 106-123 s, outro | intro 0-7 s, body to 63 s, break 63-67 s, peak 67-96 s, ending |
| Character | punchy, percussive, bright top end (44 % of energy above 2 kHz), about 3 hits a second | bright, driving, builds to a clear peak and a clean ending |

From these, every new cue keeps to:

- **Instruments:** cinematic electronic with organic percussion: taiko, claps and toms under bright analog-synth plucks and arpeggios, a
  warm sub bass and airy pads. Strings and brass come in only for triumphant moments.
- **Tempo family:** 92 to 104 bpm, target 100. Half-time feels are allowed. Nothing faster: the day should feel confident, not frantic.
- **Key family:** D major for openers, bumpers and triumph; B minor or A minor for calm beds and the Day 2 motif.
- **Signature motif:** a rising three-note pluck arpeggio, D, F sharp, A, landing on one taiko and clap hit. It opens every sting and
  bumper, so the room learns it by mid-morning.
- **Day motifs** (the day colours on screen): Day 1, blue, *The Art of the Possible*: bright and curious, piano and pluck, D major, 100 bpm.
  Day 2, plum, *Research & the Future AI Economy*: thoughtful and warm, cello pizzicato and pad, B minor, 92 bpm. Day 3, orange, *Alberta
  Velocity*: driving, punchy drums and synth bass, D major, 104 bpm.
- **No vocals** anywhere. Speech is the speakers' job.

## Loudness

| Kind | Target | Why |
|---|---|---|
| Beds under conversation (walk-in, breaks, lunch, walk-out) | -22 to -24 LUFS | background people can talk over |
| Countdown and return beds | -18 to -20 LUFS | present, still under the room |
| Stings, walk-ups, reels, openers | -16 LUFS | the same level as videos, so the operator never rides the fader between them |
| Swells | -18 LUFS | under applause |
| Every file | true peak -1.5 dBTP | headroom for the venue system |

`scripts/audio-prep.mjs` measures and sets these (two-pass ffmpeg loudnorm). Embedded videos are mastered to -16 LUFS by
`scripts/motion-render.mjs` and by MVAI, so music and video sit at one level.

## The cues

`node scripts/audio-prep.mjs --list` prints the live list. Status on 2026-11-11: 8 ready (cut from the two reference tracks), 2 interim,
13 to generate, 2 silence rules.

| Cue | Kind | Use | Length | Loop | Status |
|---|---|---|---|---|---|
| `bed-walkin` | bed | doors open, holding loop | 41 s | yes | ready (Percussive Hook, 16 bars) |
| `bed-countdown` | bed | under MG-04, the 5 minutes before a session | 300 s | yes | interim (walk-in loop, louder) |
| `bed-break` | bed | coffee breaks | 60 s | yes | to generate |
| `bed-lunch` | bed | lunch | 120 s | yes | to generate |
| `bed-return` | bed | last 60 s of a break, ends on a hit | 60 s | no | to generate |
| `bed-walkout` | bed | after the close | 90 s | yes | to generate |
| `open-show` | sting | under MG-01, first open of each day | 10 s | no | ready (Tech Sizzle peak to ending) |
| `sting-logo` | sting | under AN-03, video opens and closes | 4 s | no | interim (2 bars of the Tech Sizzle peak) |
| `day1-bumper`, `day2-bumper`, `day3-bumper` | sting | MG-02 day bumpers, one per day | 3 s | no | to generate |
| `walkup-a`, `walkup-b` | sting | speaker walk-ups with the MG-03 lower third | 5 s | no | ready |
| `walkup-c` | sting | keynote walk-up | 8 s | no | to generate |
| `swell-applause` | swell | under applause as a speaker finishes | 6 s | no | to generate |
| `swell-transition` | swell | between segments | 8 s | no | ready (Percussive Hook into the 56 s lift) |
| `video-intro` | sting | the 2 s before a stage video | 2.5 s | no | to generate |
| `triumph-award`, `triumph-milestone` | sting | recognition moments, triumphant snatches between sessions | 12 s, 6 s | no | to generate |
| `close-day` | sting | end of each day | 20 s | no | to generate |
| `reel-60`, `reel-30`, `reel-15` | reel | VD-01 sizzle, VD-04 cutdown, 15 s promo | 65, 30, 15 s | no | ready (Tech Sizzle) |
| `silence-speech` | rule | no music under live speech, panels or Q&A; fade any bed over 2 s before the first word | | | rule |
| `silence-video` | rule | stop or duck every cue while a video with its own audio plays | | | rule |

Each cue in `cues.json` carries its use, the moment of the day, length, loop, key and tempo target, energy, loudness, fades, the stems
wanted, the file, and a ready-to-paste Suno prompt.

## Making a cue in Suno

1. **Start from a reference.** Open the Tech Sizzle Cue or the Percussive Hook in Suno and use *Cover* or *Extend* when the cue should
   sound like one of them (walk-ups, reels, swells). Use a new song only for the beds and the Day 2 motif. This keeps the palette tight.
2. **Paste the cue's prompt.** From `cues.json`, cue `suno`:
   - **Style of music:** `suno.style`.
   - **Lyrics:** `suno.lyrics` (structure tags such as `[Intro] [Build] [Big Hit] [End]`, with `[Instrumental]` first).
   - **Exclude styles:** `suno.exclude` (vocals, choir, rap, lo-fi, dubstep and similar).
   - **Instrumental:** on.
3. **Length.** Suno will not make a 3-second song. Generate 30 to 60 seconds and cut the sting out with `audio-prep.mjs --start`. For
   beds, ask for "steady groove, no build, no breakdown, consistent energy" so any 8 or 16 bars loop. For a clean ending, end the lyrics
   field with `[Big Finish] [End]`.
4. **Pick and name.** Generate four or more takes; keep the one that states the signature motif clearly in the first two seconds. Name the
   download `agency26_<cue-id>_v<n>.wav`, and export WAV, not MP3.
5. **Make it a cue:**
   ```bash
   node scripts/audio-prep.mjs bed-break ~/Downloads/agency26_bed-break_v2.wav --start 4.1 --length 60
   ```
   The script cuts, fades, crossfades the loop, masters to the cue's loudness, writes `brand/audio/cues/bed-break.m4a`, records the source
   in `cues.json` and marks the cue ready. Find `--start` on a downbeat: open the file in any editor, or run the beat tool on it
   (`/mnt/data/projects/aide-motion-video/.venv/bin/python -I /mnt/data/projects/aide-motion-video/engine/beats.py file.wav`).
6. **Listen** to the result end to start on loop (beds) and against the motion piece it plays under (stings). Keep the WAV master outside
   the repo; the repo keeps the 192 kb/s AAC cue.

## cues.json, for the show player

```jsonc
{ "palette": { … }, "loudness": { … },
  "cues": [ {
    "id": "walkup-a",              // what a show step names: { "audio": "walkup-a" }
    "kind": "bed|sting|swell|reel|silence",
    "use": "…", "when": "…",
    "file": "brand/audio/cues/walkup-a.m4a",   // null until the cue is made
    "status": "ready|interim|to generate|rule",
    "source": { "file": "…", "start": 106.092, "length": 5.13, "note": "…" },
    "loop": false, "length_s": 5.13, "key": "A minor", "bpm": 94, "energy": "…",
    "loudness_lufs": -17, "true_peak_dbtp": -1.5,
    "gain_db": 0,                  // trim the player applies on top of the mastered file
    "fade_in_s": 0, "fade_out_s": 1.2,   // the player's fades when it starts or stops the cue
    "stems": [], "day": 1,
    "suno": { "style": "…", "prompt": "…", "lyrics": "…", "exclude": "…", "instrumental": true } } ] }
```

Rules for the player: a cue whose `file` is null or whose status is "to generate" is skipped with a warning, never an error. Beds loop
until the next step and fade out over `fade_out_s`. A sting or swell plays once over a running bed, which ducks 8 dB for its length. The
silence rules stop every bed before speech and while a video with its own audio plays.

## Sound effects

Short interface sounds for the showcase films: a key press, a message arriving, a counter running. They live in `brand/audio/sfx/`
(`palette.json` plus one `.wav` at 48 kHz and one `.m4a` for each sound, peak -3 dBFS). All were generated on 2026-11-12 with ElevenLabs
sound generation through Ent Tools; `palette.json` records the prompt, the take chosen and the date for each one.

| id | kind | length | default gain | use |
|---|---|---|---|---|
| `key-1` | one-shot | 0.152 s | -6 dB | one key press while text types |
| `key-2` | one-shot | 0.124 s | -6 dB | one key press (variant) |
| `key-3` | one-shot | 0.177 s | -6 dB | one key press (variant) |
| `type-loop` | loop | 1.998 s | -8 dB | light typing under a field that fills |
| `click` | one-shot | 0.071 s | -4 dB | a pressed button (Yes, Send, Merge) |
| `toggle` | one-shot | 0.065 s | -5 dB | a switch turning on |
| `whoosh-in` | one-shot | 0.222 s | -9 dB | a hero window arriving |
| `whoosh-out` | one-shot | 0.184 s | -10 dB | a hero window leaving |
| `pop` | one-shot | 0.191 s | -5 dB | a chat message arrives |
| `send` | one-shot | 0.213 s | -6 dB | a message is sent |
| `tick` | one-shot | 0.058 s | -8 dB | a list row or record entry appears |
| `step` | one-shot | 0.18 s | -5 dB | a step or block rises |
| `count` | loop | 0.955 s | -10 dB | a counter running |
| `chime` | one-shot | 1.2 s | -5 dB | the one success moment |
| `ring-close` | one-shot | 0.8 s | -6 dB | a timer ring completing |
| `focus` | one-shot | 0.569 s | -12 dB | a focus change (use rarely) |
| `call-connect` | one-shot | 0.36 s | -6 dB | a call is picked up |
| `voice-blip` | one-shot | 0.18 s | -8 dB | the AI agent starts to speak |

In a film, the id `key` takes `key-1`, `key-2` and `key-3` in turn, so typing does not sound like one repeated sample.

### The rule of restraint

- An effect supports an action the viewer can see at that moment. If nothing visible happens, there is no sound.
- Keep them sparse. No more than about 6 in any second, never two closer than 60 ms (`tools/sfx-events.mjs` warns on both).
- No effects under a title or a pitch statement. Those belong to the voice and the music.
- Nothing is louder than the voice. The effects track sits about 14 dB down and drops a little more while the voice speaks.
- `chime` is for the one success moment in a film. `focus` is for rare use.

### The contract for a film

A film's `web/timeline.js` may export `SFX`, or return `sfx` from `createTimeline`. It is an array of events:

```js
export const SFX = [
  { at: 12.4, id: 'pop' },                       // seconds on the film's clock; id from the palette
  { at: 14.0, id: 'type-loop', dur: 2.5 },       // a loop needs dur (seconds); it fades in and out over 20 ms
  { at: 18.2, id: 'click', gain: -3, pan: 0.4 }, // gain in dB, added to the palette's default; pan from -1 (left) to 1 (right)
];
```

Take each `at` from the same cue table as the picture, so a re-time moves sound and picture together. Then:

```bash
node tools/sfx-events.mjs --project $F     # checks the ids, prints counts and warnings, writes out/sfx-events.json
node tools/mix-audio.mjs --project $F      # places the events, writes out/sfx.wav (the effects alone) and out/mix.wav
node tools/mix-audio.mjs --project $F --no-sfx   # the same mix without effects
```

Each event starts at its own sample in the mix; the sound is heard within 6 ms of `at`. `film.config.json` may set `"sfxGain"` (dB for
the whole effects track, default -14) and `"peakTP"` (the master's peak target, default -2.3 dBTP). A film with no events mixes as before.

### Changing or adding a sound

```bash
source ~/.sandbox-env
node tools/sfx.mjs list                      # the palette
node tools/sfx.mjs generate tick --force     # after changing the prompt in palette.json: 3 takes, the best by measurement, trimmed
node tools/sfx.mjs check                     # every file is 48 kHz, peaks under -2.5 dBFS and starts within 25 ms
```

To add a sound, add an entry to `palette.json` (`id`, `kind`, `dur`, `gain_db`, `use`, `prompt`, and `max_s` to cut a one-shot that
runs long), then run `generate <id>`. The tool picks a take by measurement, not by ear: listen to the result before a film uses it.
Keep the folder under 3 MB.

### Licence

These sounds were generated with the owner's ElevenLabs access through Ent Tools. Confirm the use rights with the content owner before
a film that contains them is broadcast or published outside the event.

## Rights

The two reference tracks and every cue made from them were generated by the content owner in Suno. Before public broadcast or a recording
posted online, confirm that the owner's Suno plan grants commercial use for the tracks used. Record that confirmation in this file.
