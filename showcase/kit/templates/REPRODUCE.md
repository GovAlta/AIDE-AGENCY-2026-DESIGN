# Reproduce this film

Standard operating procedure (owner, 2026-11-12): the code that makes a film travels with the film. This folder is a self-contained
git repository. It holds everything needed to change or regenerate the delivered files: the timeline, narration script, captures, saved
API answers (`prep/`), figure scripts and sources (`NOTES.md`), the owner's words and the process log. Frames and masters are not in git.

## What it depends on

| Dependency | Where | Pin |
|---|---|---|
| The showcase kit | the AIDE-AGENCY-2026-DESIGN repo, `showcase/kit` | the `kit.git.commit` in `deliver/BUILD.json` |
| The app or data it films | FILL: repo URL and folder | FILL: commit or data version |
| Music | `film.config.json` `music` | FILL: file and its licence |
| Narration voice | `narration/script.json` `voice` (from `brand/voice/voices.json`) | ElevenLabs `eleven_v4` |

## Regenerate

```bash
K=<design repo>/showcase/kit; F=$(pwd)
git -C <design repo> checkout <kit commit from deliver/BUILD.json>     # or keep the latest kit and re-check the stills
npm --prefix $K ci
node $K/tools/dryrun.mjs --project $F                                  # every frame evaluates
node $K/tools/still-at.mjs --project $F --times 2,30,90                # look at them
$K/cloud/farm.sh deploy $F && $K/cloud/farm.sh render $F all && $K/cloud/farm.sh wait $F
node $K/tools/mix-audio.mjs --project $F && $K/tools/encode.sh $F      # writes deliver/ and deliver/BUILD.json
$K/cloud/farm.sh cleanup $F
```

To change part of the film, edit `web/timeline.js` or `narration/script.json`, then re-render only the changed seconds:
`$K/cloud/farm.sh render $F <first>-<last>` (frames are a pure function of their number).

## Where the outputs are

- `deliver/`: master, share copy, phone preview, captions, `BUILD.json`. Not in git: publish the master as a release asset or in a bucket.
- `out/frames/`: rendered frames (re-creatable; delete after delivery if space is short).
