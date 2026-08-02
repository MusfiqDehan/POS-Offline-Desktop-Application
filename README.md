# Sortorium POS Desktop

Offline-capable Tauri 2 + React POS client for tenant cashiers or permitted users

## Stack

- **Tauri 2** desktop shell
- **React 19 + Vite 7 + TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Urbanist font, Sortorium brand colors)
- **SQLite** via `tauri-plugin-sql` for offline cache + checkout outbox
- **Store** via `tauri-plugin-store` for subdomain / branch preferences

## Setup

```bash
cd sortorium-pos-desktop-app
pnpm install
```

Copy env defaults:

```bash
cp .env.example .env
```

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Tenant API base (`/api/v1`) | `http://localhost:8000/api/v1` |
| `VITE_PUBLIC_API_BASE_URL` | Public schema (login) | same as API base |

**Important:** Vite bakes these into the app at **build time**. After changing `.env`, run `pnpm build` or `pnpm tauri build` again before testing production URLs.

Production example (matches web public API host):

```env
VITE_API_BASE_URL=https://sortorium.com/api/v1
VITE_PUBLIC_API_BASE_URL=https://sortorium.com/api/v1
```

The desktop app uses Tauri's native HTTP client for API calls (not browser `fetch`), so production CORS must still allow Tauri WebView origins on the backend, or requests fail before they leave the app.

## Run

```bash
# Frontend only (Vite)
pnpm dev

# Full desktop app
pnpm tauri dev
```

## Build installers

Tauri only creates bundles for the **OS you build on**. On Ubuntu you get `.deb`, `.rpm`, and `.AppImage` only. Windows `.exe` (NSIS) and macOS `.dmg` must be built on those platforms (or via CI).

| Platform | Command | Output |
|----------|---------|--------|
| Linux (current) | `pnpm build:desktop:linux` | `src-tauri/target/release/bundle/{deb,rpm,appimage}/` |
| Windows | `pnpm build:desktop:windows` | `src-tauri/target/release/bundle/nsis/*.exe` |
| macOS | `pnpm build:desktop:macos` | `src-tauri/target/release/bundle/dmg/*.dmg` |

### Local prerequisites

**Windows**

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) + pnpm
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with **Desktop development with C++**
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually preinstalled on Windows 10/11)

```powershell
cd sortorium-pos-desktop-app
pnpm install
pnpm build:desktop:windows
pnpm windows:icon   # optional: Desktop + Start Menu shortcuts for dev
```

**macOS**

- Xcode Command Line Tools: `xcode-select --install`
- Rust, Node.js, pnpm

```bash
cd sortorium-pos-desktop-app
pnpm install
pnpm build:desktop:macos
pnpm macos:icon     # optional: ~/Applications/Sortorium POS.app wrapper for dev
```

### CI builds (all platforms from GitHub)

Workflow: [`.github/workflows/sortorium-desktop-build.yml`](../.github/workflows/sortorium-desktop-build.yml)

1. Open **Actions → Sortorium POS Desktop → Run workflow**, or push changes under `sortorium-pos-desktop-app/`.
2. Download artifacts per OS:
   - `sortorium-pos-linux` → `.deb`, `.rpm`, `.AppImage`
   - `sortorium-pos-windows` → `.exe` (NSIS installer)
   - `sortorium-pos-macos-arm64` / `sortorium-pos-macos-x64` → `.dmg`

`bundle.targets` is `"all"` in `tauri.conf.json`, but the CLI still limits bundles to the host OS — the matrix workflow runs separate jobs on `ubuntu-22.04`, `windows-latest`, and `macos-latest`.

## Branding

App icons are generated from [`Sortorium_Frontend/public/favicon.png`](../Sortorium_Frontend/public/favicon.png):

```bash
pnpm tauri icon src/assets/brand/favicon.png
```

Bundled platform icons live in `src-tauri/icons/`:

| Platform | File | Used for |
|----------|------|----------|
| Linux | `icon.png`, `32x32.png`, … | Dock / `.desktop` launcher |
| macOS | `icon.icns` | `.app` bundle, Dock, DMG |
| Windows | `icon.ico` | `.exe` taskbar icon, NSIS installer |

### Dev desktop launcher icons

During `pnpm tauri dev`, the OS may show a generic icon until a launcher is installed:

```bash
# Auto-detect OS (Linux / macOS / Windows)
pnpm icons:install

# Or run a platform script directly
pnpm linux:icon
pnpm macos:icon
pnpm windows:icon
```

- **Linux**: installs hicolor theme icons + `~/.local/share/applications/com.geekssort.sortorium.pos.desktop`
- **macOS**: creates `~/Applications/Sortorium POS.app` wrapper with `AppIcon.icns`
- **Windows**: creates Desktop + Start Menu shortcuts using `icon.ico`

Restart the app after installing. Re-pin to the dock/taskbar if the old generic icon is cached.

If `pnpm tauri dev` exits immediately with `[ELIFECYCLE] Command failed`, a stale app instance is usually still running (GTK allows only one instance per app ID). The `pre-dev.sh` hook stops these automatically; you can also run:

```bash
pkill -f sortorium-pos-desktop-app
pnpm tauri dev
```

Production builds (`pnpm tauri build`) embed icons automatically via `tauri.conf.json` → `bundle.icon`.

## Auth & routing

1. Login with **subdomain + email + password** (`POST tenancy/auth/login/`).
2. Permission check via `GET access/me/` — requires `pos` ≥ `edit`.
3. Redirects straight to `/pos` (no dashboard). Platform login is not supported.

## Offline behavior

- On login/sync: pull products, customers, categories, payment methods, POS config into SQLite.
- Offline: catalog reads + barcode scan use cache; checkout queues to `checkout_outbox` with `idempotency_key`.
- When online again: FIFO outbox replay to `POST /api/v1/pos/checkout/`.
- Offline banner: “Offline — sales will sync when connected.”

## Tests

```bash
pnpm test
pnpm typecheck
```

## Manual offline matrix

1. Login online → wait for sync
2. Disconnect network → scan product → checkout → see queued message
3. Reconnect → refresh sync → verify sale on server (no duplicate charge)

## Visual parity

POS layout mirrors web `pos-five` three-panel grid:

- Products ~689fr | Order details ~370fr | Sidebar ~330fr
- Primary `#0AC79E`, secondary `#092C4C`
