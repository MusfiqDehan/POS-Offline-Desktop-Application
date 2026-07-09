#!/usr/bin/env bash
# Prepare the dev environment: stop stale processes, refresh Linux icons, start Vite.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

stop_stale_dev_processes() {
  # GTK app IDs are single-instance; a leftover binary makes `tauri dev` exit instantly.
  pkill -f "${ROOT}/src-tauri/target/debug/sortorium-pos-desktop-app" 2>/dev/null || true
  pkill -f "${ROOT}/src-tauri/target/release/sortorium-pos-desktop-app" 2>/dev/null || true

  # Free the Tauri dev port if a previous Vite instance is still running.
  if command -v fuser >/dev/null 2>&1; then
    fuser -k 1420/tcp 2>/dev/null || true
  fi

  sleep 0.2
}

if [[ "$(uname -s)" == "Linux" ]]; then
  stop_stale_dev_processes
  bash "${ROOT}/scripts/install-linux-dev-icon.sh" >/dev/null 2>&1 || true
fi

cd "${ROOT}"
exec pnpm dev
