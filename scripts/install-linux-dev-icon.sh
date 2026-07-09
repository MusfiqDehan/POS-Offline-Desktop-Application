#!/usr/bin/env bash
# Install Sortorium POS icons and a dev .desktop entry for Ubuntu/GNOME dock integration.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ID="com.geekssort.sortorium.pos"
LEGACY_APP_ID="com.geekssort.sortorium.pos.desktop"
ICONS_DIR="${ROOT}/src-tauri/icons"
ICON_THEME_BASE="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
BINARY="${ROOT}/src-tauri/target/debug/sortorium-pos-desktop-app"
ICON_128="${ICON_THEME_BASE}/128x128/apps/${APP_ID}.png"
DESKTOP_FILE="${DESKTOP_DIR}/${APP_ID}.desktop"

if [[ ! -x "${BINARY}" ]]; then
  RELEASE_BINARY="${ROOT}/src-tauri/target/release/sortorium-pos-desktop-app"
  if [[ -x "${RELEASE_BINARY}" ]]; then
    BINARY="${RELEASE_BINARY}"
  fi
fi

install_icon() {
  local size="$1"
  local src="$2"
  local dest_dir="${ICON_THEME_BASE}/${size}x${size}/apps"
  mkdir -p "${dest_dir}"
  cp "${src}" "${dest_dir}/${APP_ID}.png"
}

# Remove legacy misnamed desktop entry and icons from the old app id.
rm -f "${DESKTOP_DIR}/${LEGACY_APP_ID}"
for size in 32 48 64 128 256 512; do
  rm -f "${ICON_THEME_BASE}/${size}x${size}/apps/${LEGACY_APP_ID}.png"
done

install_icon 32 "${ICONS_DIR}/32x32.png"
install_icon 48 "${ICONS_DIR}/64x64.png"
install_icon 64 "${ICONS_DIR}/64x64.png"
install_icon 128 "${ICONS_DIR}/128x128.png"
install_icon 256 "${ICONS_DIR}/128x128@2x.png"
install_icon 512 "${ICONS_DIR}/icon.png"

mkdir -p "${DESKTOP_DIR}"
cat >"${DESKTOP_FILE}" <<EOF
[Desktop Entry]
Type=Application
Name=Sortorium POS
Comment=Sortorium point-of-sale desktop client
Exec=${BINARY} %U
Icon=${ICON_128}
StartupWMClass=${APP_ID}
Terminal=false
Categories=Office;
EOF

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "${ICON_THEME_BASE}" >/dev/null 2>&1 || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "${DESKTOP_DIR}" >/dev/null 2>&1 || true
fi

echo "Installed Linux dev launcher icon for ${APP_ID}"
echo "Restart the app and re-pin it in the dock if the old icon is cached."
