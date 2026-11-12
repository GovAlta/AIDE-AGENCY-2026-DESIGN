#!/usr/bin/env bash
# Frames + mix -> the delivery files. Checks that no frame is missing first.
set -euo pipefail
cd "$(dirname "$0")/.."
N=11856; HAVE=$(ls out/frames/f*.jpg | wc -l)
[ "$HAVE" -eq "$N" ] || { echo "have $HAVE of $N frames"; exit 1; }
OUT=../deliver; mkdir -p "$OUT"
nice ffmpeg -y -loglevel error -stats -framerate 60 -i out/frames/f%06d.jpg -i out/mix.wav \
  -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p" -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:v libx264 -preset slow -crf 15 -threads 12 -c:a aac -b:a 256k -movflags +faststart -shortest "$OUT/pan-canadian-fibre-optics-planner-1080p60.mp4"
cp out/captions.srt out/captions.vtt "$OUT/"
# the same picture without burned-in... (captions are part of the frames); a clean music-and-voice stem for the event team:
cp out/mix.wav "$OUT/audio-mix.wav"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of default=nw=1 "$OUT/pan-canadian-fibre-optics-planner-1080p60.mp4"
