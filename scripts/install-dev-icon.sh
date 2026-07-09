#!/usr/bin/env bash
# Install platform-specific dev desktop launcher icons (Linux, macOS, or Windows).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$(uname -s)" in
  Linux)
    exec bash "${SCRIPT_DIR}/install-linux-dev-icon.sh"
    ;;
  Darwin)
    exec bash "${SCRIPT_DIR}/install-macos-dev-icon.sh"
    ;;
  MINGW* | MSYS* | CYGWIN*)
  if command -v powershell.exe >/dev/null 2>&1; then
    exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${SCRIPT_DIR}/install-windows-dev-icon.ps1"
  elif command -v pwsh >/dev/null 2>&1; then
    exec pwsh -NoProfile -ExecutionPolicy Bypass -File "${SCRIPT_DIR}/install-windows-dev-icon.ps1"
  else
    echo "PowerShell is required to install Windows shortcuts." >&2
    exit 1
  fi
  ;;
  *)
    echo "Unsupported platform: $(uname -s)" >&2
    exit 1
    ;;
esac
