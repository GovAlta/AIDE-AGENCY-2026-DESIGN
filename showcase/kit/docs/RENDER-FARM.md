# The render farm: how showcase films are rendered

A showcase film is rendered frame by frame in headless Chromium: a 3:17 film at 60 fps is about 12,000 frames, and a globe frame with
3D terrain takes 2 to 10 s of software WebGL. One machine is too slow, and the SHELL VM is shared, so the frames are rendered by many
temporary cloud machines at once. This is the method film #11 proved, generalised in `cloud/farm.sh`.

## How #11 got here

| Try | What | Result |
|---|---|---|
| 1 | Parallel browsers on the shared 64-core VM | Abandoned. Another session's 40-browser render had the load at about 600. Heavy renders on the VM slow every session, and yours |
| 2 | A Cloud Run *service* (8 vCPU, 16 GiB, one frame at a time per instance) | Worked, but the service scaled to about 12 instances (quota): about 1 frame a second, over 2 hours for the film |
| 3 | A Cloud Run *job*: 100 tasks of 4 vCPU and 8 GiB, each rendering a contiguous share of the frames and sending JPEGs back to a small receiver on the VM over the private network | **The working route.** All 100 tasks ran at once: about 4 frames a second, about 45 minutes for 11,856 frames. The slowest 3 % (3D-terrain scenes) went to a second, 70-task run to cut the tail |

## The method

```
  SHELL VM                                        Cloud Run job (northamerica-northeast1)
  ─────────                                       ─────────────────────────────────────────
  farm.sh deploy  ── docker build + push ──►      image: Playwright Chromium + kit + this film
  farm.sh render  ── job update + execute ──►     task 0 … task N-1   (4 vCPU / 8 GiB each)
  receiver.mjs  ◄── PUT f000123.jpg (token) ──    each task: open the film page, check load errors,
  out/frames/                                     draw frames a..b with film.frame(n), send JPEGs
  farm.sh wait / missing / cleanup
```

1. **Image.** `farm.sh deploy <film>` assembles a build context (`cloud/build-context.sh`: the kit at `/app/kit`, the film at
   `/app/project`, any `mounts` from `film.config.json` copied in), builds it from the official Playwright image (Chromium needs glibc)
   with `docker build --network host` (on SHELL the Docker bridge MTU stalls downloads), pushes it to Artifact Registry, and creates or
   updates the film's own job: `shell-<dev>-film-<slug>`, 4 vCPU, 8 GiB, VPC connector `sandbox-vpc-connector`, private egress,
   2 retries, 1-hour task timeout.
2. **Receiver.** `farm.sh render` starts this film's receiver on the VM's private address and its own port (`film.config.json`
   `ports.receiver`), with a random token in `out/.farm-token` (never committed). It accepts only token-checked PUTs of frame files.
3. **Execution.** One execution renders the frames you ask for: `all`, `missing` (the default) or ranges like `0-599,2364-2466`. Tasks
   default to one per 8 frames, capped by the regional share (`FARM_TOTAL_TASKS`, default 100 in all; with other films rendering, each
   gets an equal share and at least 8).
4. **Each task** opens the film page, refuses to start if the page had any load error (`window.filmInitErrors`: #11 lost 103 frames to
   a silent start-up error once), draws each frame with `window.film.frame(n)`, and sends the JPEG to the receiver.
5. **Wait and check.** `farm.sh wait <film>` blocks until the execution ends and lists missing frames; `farm.sh render <film> missing`
   fills them. Frames are a pure function of their number, so any range can be rendered again, on any task, in any order.
6. **Clean up.** `farm.sh cleanup <film>` deletes the job and stops only this film's receiver (checked by its command line).

## Sizing, time and cost

| Film | Frames | Tasks | Throughput | Time | Cloud cost |
|---|---|---|---|---|---|
| Kit smoke (screenshot plates, 8 s) | 480 | 10 | about 9–12 frames/s | about 1 min | under $1 |
| #11 (globe with terrain, 3:17) | 11,856 | 100 (+70 for the tail) | about 4 frames/s | about 45 min | $10–35 |
| A 3-minute plate film | about 10,800 | 100 | fast | a few minutes | about $2 |

Add about 10 minutes for the image build and push, and about 5 for the encode. A fix after review re-renders only the changed seconds
(#11's fixes were about 1,700 frames on 82–92 tasks).

## Rules

- **Never render a film on the shared VM.** Local work is one niced browser: the dry run and a few stills. Check `cat /proc/loadavg`
  first.
- **Stop only your own processes.** Identify them by parent PID, working directory or the film's port. Never `pkill -f` a pattern
  another session's render could match.
- **One job and one receiver per film**, with names and ports from `new-film.mjs`, so several films can render at once.
- **Delete the job when the film is delivered** (`farm.sh cleanup`). Old images can be deleted from Artifact Registry
  (`…/sandbox-apps/shell-app-<dev>-film-<slug>`).
- **Auth.** If the user's `gcloud` login has gone stale, `farm.sh` uses the sandbox service account (`shell-<dev>@…`), which can create
  and run jobs in the project.

## Settings you can change

| Variable | Default | Use |
|---|---|---|
| `FARM_PROJECT`, `FARM_REGION` | the sandbox project, `northamerica-northeast1` | org policy allows this region only |
| `FARM_TOTAL_TASKS` | 100 | the regional task budget shared by all films rendering now |
| `--tasks N` on `render` | one per 8 frames | fewer for short ranges, more for heavy scenes |
| `FARM_PORT` | `film.config.json` `ports.receiver` | the receiver's port on the VM |
