#!/usr/bin/env bash
# Frames + mix -> delivery files: master (CRF 15), share copy (CRF 23), and a two-pass 720p30 phone preview under 30 MB
# (the chat send limit). Refuses to run with a missing frame. Runs niced: the VM is shared.
#   tools/encode.sh <film dir>
set -euo pipefail
P="$(cd "${1:?film dir}" && pwd)"; cd "$P"
read -r DUR FPS SLUG < <(node -e "const c=require('./film.config.json');console.log(c.dur, c.fps||60, c.slug||'film')")
N=$(node -e "console.log(Math.round($DUR*$FPS))"); HAVE=$(find out/frames -name 'f*.jpg' | wc -l)
[ "$HAVE" -ge "$N" ] || { echo "have $HAVE of $N frames: render the missing ones first (cloud/farm.sh missing)"; exit 1; }
OUT="$P/deliver"; mkdir -p "$OUT"; M="$OUT/$SLUG-1080p${FPS}.mp4"
AIN=(); ACODEC=(-an); if [ -f out/mix.wav ]; then AIN=(-i out/mix.wav); ACODEC=(-c:a aac -b:a 256k); fi
nice ffmpeg -y -loglevel error -framerate "$FPS" -i out/frames/f%06d.jpg "${AIN[@]}" -frames:v "$N" \
  -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p" -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:v libx264 -preset slow -crf 15 -threads 12 "${ACODEC[@]}" -movflags +faststart "$M"
nice ffmpeg -y -loglevel error -i "$M" -c:v libx264 -preset medium -crf 23 -maxrate 9M -bufsize 18M -threads 8 "${ACODEC[@]/256k/192k}" -movflags +faststart "$OUT/$SLUG-1080p${FPS}-share.mp4"
# phone preview: total bitrate sized to stay under 28 MB for any length
VB=$(node -e "console.log(Math.min(4000, Math.max(300, Math.floor(28*8*1024/$DUR - 100))))")k
LOG="$(mktemp -d)/pass"
nice ffmpeg -y -loglevel error -i "$M" -vf "scale=1280:720:flags=lanczos,fps=30" -c:v libx264 -preset slow -b:v "$VB" -pass 1 -passlogfile "$LOG" -threads 8 -an -f mp4 /dev/null
nice ffmpeg -y -loglevel error -i "$M" -vf "scale=1280:720:flags=lanczos,fps=30" -c:v libx264 -preset slow -b:v "$VB" -pass 2 -passlogfile "$LOG" -threads 8 "${ACODEC[@]/256k/96k}" -movflags +faststart "$OUT/preview-720p-phone.mp4"
[ -f out/captions.srt ] && cp out/captions.srt out/captions.vtt "$OUT/"; [ -f out/mix.wav ] && cp out/mix.wav "$OUT/audio-mix.wav"
echo "frames in master: $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$M") of $N"
[ -f out/mix.wav ] && ffmpeg -hide_banner -i "$M" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" || true
# Build record (SOP, owner 2026-11-12: the code that makes a film travels with its outputs). Everything needed to regenerate these
# files: the kit's commit, the film folder's commit, the config, the narration voice, the music and the frame count.
KITDIR="$(cd "$(dirname "$0")/.." && pwd)"
node - "$P" "$KITDIR" "$N" "$M" <<'JS' > "$OUT/BUILD.json"
const [P, KIT, N, M] = process.argv.slice(2); const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const git = (d) => { try { const c = execSync(`git -C "${d}" rev-parse HEAD`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  const dirty = execSync(`git -C "${d}" status --porcelain -- .`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== ''; return { commit: c, dirty }; } catch { return null; } };
const cfg = JSON.parse(fs.readFileSync(path.join(P, 'film.config.json'), 'utf8'));
let voice = null; try { voice = JSON.parse(fs.readFileSync(path.join(P, 'narration/script.json'), 'utf8')).voice ?? null; } catch {}
const ff = execSync('ffmpeg -version').toString().split('\n')[0];
console.log(JSON.stringify({ made: new Date().toISOString(), film: path.basename(P), kit: { path: KIT, git: git(KIT) }, filmFolder: git(P),
  config: cfg, frames: +N, master: path.basename(M), voice, music: cfg.music ?? null, encoder: ff,
  regenerate: 'See REPRODUCE.md in the film folder: dry run, cloud/farm.sh render <film> all, mix-audio, encode.' }, null, 1));
JS
cp "$P/film.config.json" "$OUT/film.config.json"
echo "build record: $OUT/BUILD.json"
ls -la "$OUT"
