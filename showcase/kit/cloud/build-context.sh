#!/usr/bin/env bash
# Docker build context for one film: the kit at /app/kit, the project at /app/project, the Agency brand files, and every
# extra mount from film.config.json copied in under /app/project/_mounts (the config is rewritten to point there).
#   cloud/build-context.sh <film dir>   -> <film dir>/out/cloud-ctx
set -euo pipefail
KIT="$(cd "$(dirname "$0")/.." && pwd)"; P="$(cd "${1:?film dir}" && pwd)"; CTX="$P/out/cloud-ctx"
rm -rf "$CTX"; mkdir -p "$CTX/kit" "$CTX/project"
rsync -a --exclude node_modules --exclude .git --exclude example "$KIT/" "$CTX/kit/"
rsync -a --exclude out --exclude deliver --exclude storyboard --exclude node_modules --exclude '*.webm' --exclude 'narration/*.mp3' "$P/" "$CTX/project/"
BRAND="${AGENCY_BRAND:-$(cd "$KIT/../.." && pwd)/brand}"   # the design repo this kit lives in (showcase/kit)
[ -d "$P/brand" ] || { mkdir -p "$CTX/project/brand"; rsync -a "$BRAND/fonts" "$BRAND/logos" "$BRAND/tokens" "$BRAND/voice" "$CTX/project/brand/"; }
node - "$P" "$CTX/project" <<'E'
const fs = require('fs'), path = require('path'); const [P, OUT] = process.argv.slice(2);
const f = path.join(P, 'film.config.json'); const c = JSON.parse(fs.readFileSync(f, 'utf8')); const m = {};
for (const [k, v] of Object.entries(c.mounts || {})) { const src = path.resolve(P, v), name = k.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root';
  fs.cpSync(src, path.join(OUT, '_mounts', name), { recursive: true }); m[k] = `_mounts/${name}/`; }
c.mounts = m; fs.writeFileSync(path.join(OUT, 'film.config.json'), JSON.stringify(c, null, 1));
E
cat > "$CTX/Dockerfile" <<'D'
# The official Playwright image carries Chromium and its system libraries (apt inside node:bookworm-slim failed here, and
# Chromium needs glibc, so not node:22-alpine). Keep its version equal to the kit's playwright package.
FROM mcr.microsoft.com/playwright:v1.65.0-noble
WORKDIR /app/kit
COPY kit/package*.json ./
RUN npm ci --omit=dev
COPY kit /app/kit
COPY project /app/project
ENV NODE_ENV=production
CMD ["node", "/app/kit/cloud/job.mjs"]
D
du -sh "$CTX" | cut -f1
