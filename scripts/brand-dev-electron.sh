#!/bin/bash
# `yarn dev` runs the app inside node_modules' stock Electron.app, and macOS reads
# the Dock label, tooltip and force-quit name from that bundle rather than from
# anything the app can set at runtime. Stamping the name and icon onto it is the
# only way to stop development builds announcing themselves as "Electron".
#
# Runs from postinstall and is re-run whenever the icon changes. Never fails the
# install: a missing bundle just means there is nothing to brand yet.
set -uo pipefail

NAME="Open Compare"
root="$(cd "$(dirname "$0")/.." && pwd)"
bundle="$root/node_modules/electron/dist/Electron.app"
plist="$bundle/Contents/Info.plist"

[ -f "$plist" ] || { echo "brand-dev-electron: no Electron.app yet, skipping"; exit 0; }

for key in CFBundleName CFBundleDisplayName; do
  /usr/libexec/PlistBuddy -c "Set :$key $NAME" "$plist" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :$key string $NAME" "$plist" 2>/dev/null
done

if [ -f "$root/build/icon.icns" ]; then
  cp "$root/build/icon.icns" "$bundle/Contents/Resources/electron.icns" 2>/dev/null
fi

# Bump the bundle's mtime so the Dock drops its cached icon for it.
touch "$bundle" 2>/dev/null

echo "brand-dev-electron: development Electron.app now presents as $NAME"
exit 0
