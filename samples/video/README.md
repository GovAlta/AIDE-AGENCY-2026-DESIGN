# Video samples

Videos are rendered by MVAI. These files are specs and reference frames; `guides/VIDEO.md` explains the loop.

| File | What it is | Status |
|---|---|---|
| `explainer-sample.json` | A fictional explainer for an invented service, "Trail Pass Finder": 9 scenes, about 79 seconds, Montréal voice (`google-ca`, Kore), captions on. Every number is an example value and is labelled on screen | Passes `check_walkthrough` with no findings and `scripts/lint/lint.py` with no errors or warnings (2026-11-10). Not rendered |
| `sizzle.json` | MVAI's own fictional event sizzle, "Agency 2026: The Art of the Possible" (19 scenes), copied from `aide-motion-video/examples/kits/goa-agency/sizzle.json` | Reference only. The lint reports 3 errors in MVAI's wording (two literal "at the end of the day", one "This video") |
| `screen-bench/screen-bench.json` | MVAI's own fictional screen bench (58 scenes, every Agency screen once or twice), copied from `aide-motion-video/examples/kits/goa-agency/agency.json` with the voice set to `google-ca` Kore | Rendered as MVAI job `fbe6d95ed434` on 2026-11-10 in both themes (8.8 minutes each). The lint reports 1 error in MVAI's wording |
| `screen-bench/frames/` | One frame of every scene of that job, taken at 86 % of each scene so every element has landed, 960 px wide: `agency-light-NN-<screen>.jpg` and `agency-dark-NN-<screen>.jpg` | |
| `screen-bench/*.png` | The images the bench spec uploads (avatars, a form, a phone screen) | Fictional |

The sizzle and bench specs are MVAI's examples. Keep them as they are, so they match MVAI; write new specs from `explainer-sample.json`.

To render a sample (it costs money and uses your daily MVAI allowance):

```bash
export MVAI_API_KEY=mvk_...
python3 scripts/mvai/mvai.py check  samples/video/explainer-sample.json
python3 scripts/mvai/mvai.py create samples/video/explainer-sample.json --themes agency-light
python3 scripts/mvai/mvai.py wait   <job_id>
python3 scripts/mvai/mvai.py fetch  <job_id> out/video/
```
