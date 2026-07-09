#!/usr/bin/env bash
# Create a dev .app bundle in ~/Applications so macOS Dock shows the Sortorium icon.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="Sortorium POS"
BUNDLE_ID="com.geekssort.sortorium.pos"
APP_DIR="${HOME}/Applications/${APP_NAME}.app"
ICONS_DIR="${ROOT}/src-tauri/icons"
DEBUG_BINARY="${ROOT}/src-tauri/target/debug/sortorium-pos-desktop-app"
RELEASE_BINARY="${ROOT}/src-tauri/target/release/sortorium-pos-desktop-app"

if [[ -x "${RELEASE_BINARY}" ]]; then
  BINARY="${RELEASE_BINARY}"
elif [[ -x "${DEBUG_BINARY}" ]]; then
  BINARY="${DEBUG_BINARY}"
else
  echo "Build the app first: pnpm tauri dev (or pnpm tauri build)"
  exit 1
fi

mkdir -p "${APP_DIR}/Contents/MacOS"
mkdir -p "${APP_DIR}/Contents/Resources"

cp "${ICONS_DIR}/icon.icns" "${APP_DIR}/Contents/Resources/AppIcon.icns"
ln -sf "${BINARY}" "${APP_DIR}/Contents/MacOS/sortorium-pos-desktop-app"

cat >"${APP_DIR}/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>sortorium-pos-desktop-app</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>0.1.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.13</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
EOF

echo "Installed macOS dev app bundle at ${APP_DIR}"
echo "Launch from Finder or drag it to the Dock. Re-run after rebuilding the binary."
