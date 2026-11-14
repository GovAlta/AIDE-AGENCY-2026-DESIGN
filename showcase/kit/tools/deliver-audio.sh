#!/usr/bin/env bash
# Gives every delivered MP4 its sound again from out/mix.wav (-16 LUFS, -2.3 dBTP), so each file keeps -16 LUFS and stays under -2 dBTP
# after AAC. Run it after tools/encode.sh. encode.sh lowers a file whose AAC overshoots -2.1 dBTP, which can leave it at -16.4 to -17.6
# LUFS (films #6, #9, #15). This script instead puts a 4x-oversampled limiter at -3 dBFS before the AAC encoder: the limiter catches the
# few inter-sample peaks that AAC lifts, so loudness stays at -16. The picture is copied untouched. The phone preview gets 128 kb/s
# (encode.sh's 96 kb/s overshoots most). Then it measures each file and fails if any true peak is not under -2.0 dBTP.
# Same method as the film copies in 06-flood, 09-ai-garage and 15-oasis (tools/deliver-audio.sh), made product-neutral.
#   tools/deliver-audio.sh <film dir>
set -euo pipefail
P="$(cd "${1:?film dir}" && pwd)"; MIX="$P/out/mix.wav"; OUT="$P/deliver"
[ -f "$MIX" ] || { echo "no out/mix.wav: run tools/mix-audio.mjs first"; exit 1; }
read -r FPS SLUG < <(node -e "const c=require('$P/film.config.json');console.log(c.fps||60, c.slug||'film')")
AF="aresample=192000,alimiter=limit=0.708:attack=0.5:release=40:level=disabled:asc=1,aresample=48000"
bad=0
for pair in "$SLUG-1080p${FPS}.mp4:256k" "$SLUG-1080p${FPS}-share.mp4:192k" "preview-720p-phone.mp4:128k"; do
  f="$OUT/${pair%:*}"; br="${pair##*:}"
  [ -f "$f" ] || { echo "missing $f: run tools/encode.sh first"; exit 1; }
  nice ffmpeg -y -loglevel error -i "$f" -i "$MIX" -map 0:v -map 1:a -c:v copy -af "$AF" -c:a aac -b:a "$br" -movflags +faststart "$f.tmp.mp4"
  mv "$f.tmp.mp4" "$f"
  read -r i p < <(ffmpeg -hide_banner -nostats -i "$f" -map 0:a -af ebur128=peak=true -f null - 2>&1 | awk '/Integrated loudness:/{a=1} a&&/ I:/{i=$2; a=0} /True peak:/{b=1} b&&/Peak:/{p=$2; b=0} END{print i, p}')
  ok=$(node -e "console.log($p < -2.0 ? 'ok' : 'OVER')"); [ "$ok" = ok ] || bad=1
  echo "$(basename "$f") ($br): $i LUFS, true peak $p dBTP $ok"
done
[ "$bad" = 0 ] || { echo "a file is not under -2.0 dBTP: lower peakTP in film.config.json, mix again and run this again"; exit 1; }
# the voice must sit clearly over the music: at least 18 dB while a line is spoken (owner, film #32). Fails a film mixed with "duck";
# a film on the old sidechain ducking gets the table and a warning
python3 "$(dirname "$0")/duck-check.py" "$P" --brief
