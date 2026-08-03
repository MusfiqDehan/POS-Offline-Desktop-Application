# AGENTS.md — Sortorium POS Desktop

Offline-capable Tauri 2 + React/Vite desktop POS client (Rust shell + SQLite cache). Package manager: **pnpm**. See `README.md` for full docs; only non-obvious, durable notes live here.

## Cursor Cloud specific instructions

JS deps are refreshed by the environment update script (`pnpm install`). The Rust/Tauri system libraries (`webkit2gtk-4.1`, GTK/soup/appindicator dev packages) and an up-to-date Rust toolchain are provided by the base VM snapshot.

### Running

- Web layer only: `pnpm dev` (Vite, strict port `:1420`). Tests/typecheck: `pnpm test` (Vitest — 48 tests) and `pnpm typecheck`; both pass.
- Full desktop app in dev mode: `DISPLAY=:1 pnpm tauri dev`. A display (`:1`) is available on the VM. The **first** build compiles ~590 Rust crates and takes a few minutes; the `src-tauri/target/` cache makes later runs fast. `libEGL ... DRI3` warnings are harmless software-rendering fallbacks.
- Rust toolchain must be **≥ 1.85** (some dependencies require the `edition2024` Cargo feature). If `pnpm tauri dev` fails with "feature `edition2024` is required", run `rustup update stable`.

### Backend connectivity gotchas (needed for live login)

- `.env` (gitignored) must set `VITE_API_BASE_URL` / `VITE_PUBLIC_API_BASE_URL` to the running backend, `http://localhost:8002/api/v1`. The committed `.env.example` defaults to `:8000`, but the backend serves on `:8002`. Vite bakes env at build time, so re-run dev/build after changing `.env`.
- The Tauri HTTP capability allowlist in `src-tauri/capabilities/default.json` only permits `sortorium.com` and `localhost:8000`. A **live login against the local backend on `:8002`** additionally requires allowlisting `http://localhost:8002/**` (and `http://127.0.0.1:8002/**`) in that file. Without it the app shows "Unable to reach the server." This is a tracked-code security-config change, so it is intentionally left to the developer rather than baked into the environment.
- Login flow: subdomain + email + password against `tenancy/auth/login/`, then `access/me/` (requires `pos` ≥ `edit`); it goes straight to `/pos`. Tenant context is sent via the `X-Tenant-Subdomain` header.
- Known pre-existing app bug (not an environment issue): the desktop POS may stay on "Loading products…" even when the backend returns products successfully.
