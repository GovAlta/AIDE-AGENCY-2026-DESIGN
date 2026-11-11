#!/usr/bin/env bash
# Rebuild everything in examples/displays from the specs: all designs, layout drawings, renders, galleries, SVGs and two print sets.
#   bash displays/make-examples.sh        (about 2 minutes)
set -euo pipefail
cd "$(dirname "$0")/.."
O=out/displays E=examples/displays V="rise rails wrap spectrum night converge"
rm -rf "$O" "$E"; mkdir -p "$E"/{galleries,svg,layouts,print}
for f in displays/specs/*.json; do node displays/build.mjs "$f" --variant all & done; wait
node displays/layout.mjs displays/specs/*.json --out "$E/layouts"
node displays/render.mjs --out "$E/renders"
T=$(mktemp -d)
for s in kiosk-30x30x72 kiosk-30x30x84; do
  rows=()
  for v in $V; do
    montage $O/$s/$v/{front,right,back,left}.png -tile 4x -geometry 330x+6+6 -background "#E9ECEF" "$T/$v.png"
    convert "$T/$v.png" -gravity North -background "#E9ECEF" -splice 0x46 -font DejaVu-Sans-Bold -pointsize 26 -fill "#022C4C" -annotate +0+8 "$v  ·  front  right  back  left" "$T/$v.png"
    rows+=("$T/$v.png")
  done
  montage "${rows[@]}" -tile 3x -geometry +10+10 -background "#E9ECEF" -quality 82 "$E/galleries/$s-variants.jpg"
  for v in wrap rise night; do convert $O/$s/$v/wrap.png -resize 2400x -quality 82 "$E/galleries/$s-$v-wrap.jpg"; done
done
for s in panel-30x72 panel-24x60; do
  montage $(for v in $V; do echo $O/$s/$v/front.png; done) -tile 6x -geometry x900+8+8 -background "#E9ECEF" -quality 82 "$E/galleries/$s-variants.jpg"
done
for s in kiosk-30x30x72 kiosk-30x30x84 panel-30x72 panel-24x60; do for v in $V; do mkdir -p "$E/svg/$s/$v"; cp $O/$s/$v/*.svg "$E/svg/$s/$v/"; done; done
mkdir -p "$E/print/kiosk-30x30x72-rise" "$E/print/panel-30x72-rails"
cp $O/kiosk-30x30x72/rise/{front.pdf,front.ai,front-production.pdf,wrap.pdf,wrap.ai,wrap-production.pdf,front.png} "$E/print/kiosk-30x30x72-rise/"
cp $O/panel-30x72/rails/{front.pdf,front.ai,front-production.pdf,front.png} "$E/print/panel-30x72-rails/"
rm -rf "$T"; du -sh "$E"
