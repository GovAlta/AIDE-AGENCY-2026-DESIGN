# Process log: <#NN Project name> film

| # | Step | Result |
|---|------|--------|
| 1 | Brief (templates/brief.md) | |
| 2 | Clone, build, run the app; capture real UI (tools/capture-states.mjs, tools/capture-video.mjs) | |
| 3 | Figure inventory (NOTES.md), checked for misleading truths | |
| 4 | Song analysis (tools/analyze_song.py) | |
| 5 | Storyboard published for sign-off (tools/storyboard.mjs) | |
| 6 | Owner lines (owner_lines.txt) | |
| 7 | Narration (tools/narrate.mjs), transcribed back | |
| 8 | Timeline (web/timeline.js); dry run (tools/dryrun.mjs) | |
| 9 | Preview: every 2 s in the cloud (cloud/farm.sh render <dir> <ranges>) | |
| 10 | Full render in the cloud; missing frames re-rendered | |
| 11 | Mix (tools/mix-audio.mjs), encode (tools/encode.sh), QA (find-pops, layer-present, camcheck, frame sheet) | |
| 12 | Delivered; cloud job deleted (cloud/farm.sh cleanup) | |

## Lessons (add every one; the kit's SKILL.md collects them)
