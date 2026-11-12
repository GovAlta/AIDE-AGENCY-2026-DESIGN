# PR log: the film's look in the real planner

**PR:** https://github.com/GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK/pull/21 (branch `ui/night-theme`, commit 7b8efd8, from main
9220eef). Open and mergeable; not merged. Write-up in the repo: `docs/ui-night.md`.

## Steps

| # | Step | Result |
|---|------|--------|
| 1 | Read README, `docs/decisions/README.md`, design §10 (hosting, tiles), §11 (CSP), §19 (D61-1 to D61-5), `web/src`, `server/tiles.ts`, tests | Rules kept: same origin only, tiles through the server with cache and limits, attribution complete, wording and semantics unchanged |
| 2 | Checked open PRs | #19 (cinema mode, `web/src/cinema/` + 5 lines of `main.ts`) is in flight: kept away from its hook; noted the rebase in the PR |
| 3 | Probed NASA GIBS headers | Blue Marble relief `max-age=259200` (cacheable); every night-lights layer `no-store` (respected: not cached) |
| 4 | `server/tiles.ts`: `TileService` takes a `layout`, generic `registerTileRoute`; `server/imagery.ts`: two routes; wired in `app.ts`, `index.ts` (`IMAGERY_CACHE_BYTES`, `IMAGERY_UPSTREAM_PER_HOUR`) | 34 tile tests unchanged and passing; 10 new imagery tests |
| 5 | `web/src/theme.ts`: view and basemap prefs, `liftForNight` (contrast ≥ 3:1 on #041B30, same hue), `nightStyle` (lines and points lifted, fills kept), `applyThemeToDefs` (in place, reversible) | One style object feeds both the map paint and the legend |
| 6 | `style.css`: every literal colour → token with its old value; night token set; topbar toggle; basemap radios | Light view pixel-identical to main except the new button (diffed, 5 tabs) |
| 7 | `main.ts`: base style per view and basemap, basemap choice with the failure fallback, view toggle that repaints only; `overlays.ts` glow; plan colour and wording via `Planning.themeChanged` | Live check: toggle, solve, toggle back, reload; no console errors |
| 8 | Bug found in the live check: the status line kept "white line" after switching back | Fixed: the plan code rewrites only its solved message |
| 9 | Tests and lint | `npm test` 577/577 (11 new), `npm run lint` clean |
| 10 | Bench and frame rate (SwiftShader) | First load 5.65 MB as main (+3 KB gzip); first map 0.32 s; drag 9.2–9.5 fps vs 8.9 main; NASA basemap 7.4 fps |
| 11 | Screenshots, before and after, light and night | 14 JPEGs, 4.1 MB, `docs/screenshots/ui-night/` |
| 12 | Commit, push, PR | 7b8efd8, PR #21. Repo CI (`CI` workflow) still queued for a GitHub runner after 20 min; the org's dynamic CodeQL run reported `startup_failure` ("workflow file issue", not this repo's workflow). The full suite passed locally (577/577) |
| 13 | Cleanup | Stopped this session's two app servers (ports 3112, 3113, checked by working directory); removed the main worktree |

## Left for the team

1. Record as a decision and in the design, or not.
2. Black Marble upstream load (no-store), or a one-time pipeline image.
3. The night palette rule.
4. Browser checks at 1280 and 390 px in both views.
5. Rebase against #19 for whichever merges second (both touch `main.ts`).
