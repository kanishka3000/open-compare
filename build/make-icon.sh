#!/bin/bash
# Rasterises build/icon.svg into build/icon.icns.
# Slices at 64px and below come from icon-small.svg, whose heavier shapes stay
# legible once the icon is only a few pixels across.
#
# Requires rsvg-convert (brew install librsvg); iconutil ships with macOS.
set -euo pipefail

cd "$(dirname "$0")"

command -v rsvg-convert >/dev/null || { echo "rsvg-convert not found: brew install librsvg" >&2; exit 1; }

iconset="icon.iconset"
rm -rf "$iconset"
mkdir -p "$iconset"

render() { # size, output name
  local source="icon.svg"
  [ "$1" -le 64 ] && source="icon-small.svg"
  rsvg-convert -w "$1" -h "$1" "$source" -o "$iconset/$2"
}

render 16    icon_16x16.png
render 32    icon_16x16@2x.png
render 32    icon_32x32.png
render 64    icon_32x32@2x.png
render 128   icon_128x128.png
render 256   icon_128x128@2x.png
render 256   icon_256x256.png
render 512   icon_256x256@2x.png
render 512   icon_512x512.png
render 1024  icon_512x512@2x.png

iconutil --convert icns "$iconset" --output icon.icns
rm -rf "$iconset"

# Used for the dock icon under `yarn dev`, where there is no bundle to read.
rsvg-convert -w 1024 -h 1024 icon.svg -o icon.png

echo "wrote $(pwd)/icon.icns and $(pwd)/icon.png"
