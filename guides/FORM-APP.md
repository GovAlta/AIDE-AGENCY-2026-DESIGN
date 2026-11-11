# Agency Studio: the form app

Agency Studio lets anyone make an Agency 2026 piece without running scripts. A person picks a template, starts from one of its samples,
replaces the words in a form, and downloads a PDF, a PNG or (for slide decks) an editable PowerPoint. The design is fixed by the templates
and the tokens; the form changes content only.

Every render runs the same checks as `make.mjs --check`, plus the writing lint and a QR check, and shows the results beside the preview:

| Finding | What it means |
|---|---|
| Fit | Text does not fit its box, a page overflows, or a bundled font did not load. Shorten the text. |
| Access | Missing alt text, page language or title (errors), or text contrast below WCAG AA (warnings). |
| Writing | A rule in `guides/WRITING.md` failed (errors) or needs a person's judgement (checks). "Show field" jumps to the field. |
| Placeholder | A field still holds sample text ("Sample", "Example", "TBC", "Speaker name"). It is highlighted in the form. |
| QR | The code on the page was decoded and matches the link in the content. Still scan the printed piece with a phone. |

Nothing typed into the app leaves the server: rendering, lint and QR checks run in the container, and no outside service is called. Jobs
(content and outputs) are kept in the container's temporary folder for two hours, then deleted. The classification picker prints the marking
on documents that carry one and shows a handling reminder for Protected A and B.

## Run it locally

```bash
npm install && npx playwright install chromium     # once
node app/server.mjs                                 # http://localhost:8080 (PORT=8391 node app/server.mjs for another port)
node app/build-thumbs.mjs                           # optional: gallery thumbnails (otherwise it uses out/ PNGs if you have built them)
```

Python 3 with `python-pptx` is needed for PowerPoint downloads; everything else is Node.

## Run it in Docker

```bash
docker build -t agency-studio .
docker run --rm -p 8080:8080 agency-studio          # http://localhost:8080
```

On this SHELL VM, build with `docker build --network host -t agency-studio .`: the VM's network card has an MTU of 1460 and the Docker
bridge 1500, so downloads inside a bridge-network build (apt, npm, Playwright) stall. See "Publish it" below.

The image (about 1.5 GB) is Debian slim with Node 22, Chromium (Playwright's headless shell), Python 3 and python-pptx. The build makes the tokens and the
gallery thumbnails. `.dockerignore` leaves out video, audio, the motion library, the show runner and the stock art the app does not use.

## Publish it (SHELL)

```bash
cd /mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN
publish-app agency-studio --memory 2Gi --cpu 2
```

`publish-app` runs a plain `docker build`, which hits the MTU stall above on this VM. Until the Docker daemon is set to `"mtu": 1460`
(a platform change), publish from the App Manager, or ask the platform operator. Check the build log for apt `Ign:` lines that repeat
every 30 seconds: that is the stall.

Then open the App Directory (`https://apps.sandbox.aim.int.gov.ab.ca`), find **agency-studio** under "Awaiting Registration" and select
**Register**. The app is then at `https://agency-studio-{yourname}.sandbox.aim.int.gov.ab.ca`, behind SHELL sign-in; the signed-in address
(`X-Forwarded-Email`) is shown in the top bar. Republish after template changes with the same command.

App names: 3 to 20 characters, lowercase letters, digits and hyphens, starting with a letter (`^[a-z][a-z0-9-]{2,19}$`).

2 GiB is the floor: one Chromium renders every job, one job at a time (a 15-slide deck takes about 10 s). If the browser crashes, the next
render starts a fresh one.

## How it works

| Path | What |
|---|---|
| `app/server.mjs` | HTTP server (no framework). Scans `templates/**` for templates and their header comments, serves samples, runs `make()` from `scripts/make.mjs` per job, runs `scripts/lint/lint.py --json`, decodes QR codes with jsQR, builds PowerPoint with `scripts/pptx/build_deck.py` |
| `app/public/` | The UI: gallery, a form generated from the sample's JSON (text, numbers, switches, lists with add, move and remove, accent and ground pickers, image upload), live preview, findings, downloads, a JSON tab and the template's field guide |
| `app/build-thumbs.mjs` | Renders every sample once and keeps a 480 px JPEG of its first page in `app/thumbs/` |

A new template appears in the app as soon as it has a module in `templates/<family>/` and a sample in `samples/<family>/`: the form is
built from the sample, so a good sample is the whole job. Keep field names consistent across templates (`accent`, `ground`, `title`,
`headline`, `url`, `src`, `alt`) so the right pickers appear.

API, for scripts and agents (the same checks as the UI):

```
GET  /api/templates                 templates, samples, thumbnails
GET  /api/sample?file=samples/...   a sample's content JSON
POST /api/render {content}          -> {id, files[], faults[], warnings[], lint[], placeholders[], qr[]}
POST /api/pptx {job}                slides/deck jobs -> {url}
GET  /jobs/<id>/<family>/<file>?download
```
