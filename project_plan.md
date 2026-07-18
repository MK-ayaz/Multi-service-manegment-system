# Project Plan — Multi-Store Management System

**Status:** Prototype → Production hardening
**Last updated:** 2026-07-18
**Owner:** Engineering

---

## 1. Current State (Assessment)

The application is a functional **prototype**: an Electron + React (MUI) desktop POS / inventory manager backed by local SQLite. Core CRUD, sales, inventory, and basic reporting work in the happy path. A full code review (`CODE_REVIEW.md`) surfaced **4 critical, 6 high, 7 medium, and 5 low** issues — most notably a broken "void sale" feature, a SQL-injection-grade generic query bridge, a command-injection-grade process spawn, incorrect DB return values, duplicate/conflicting build configs, and dead code from an abandoned refactor.

**Goal:** convert the prototype into a maintainable, secure, testable production candidate by (a) fixing all correctness/security defects, (b) establishing a single coherent architecture, and (c) adding an automated test suite.

---

## 2. Architecture (Target)

```
Renderer (React + MUI)
  └─ window.api  (contextBridge, single typed bridge)
        │  invoke / on
        ▼
Main (Electron)
  ├─ ipc/index.js   ← single registration point, all handlers, registered once
  ├─ services/      ← databaseManager, themeManager, fileSystem
  └─ main.js        ← app lifecycle + window creation only

Data: SQLite (userData/)  ← schema + idempotent migrations on boot
```

**Principles**
- No arbitrary SQL from the renderer. Only purpose-built, parameterized handlers.
- IPC handlers registered **once** at app startup (never inside window creation).
- The DB layer returns `{ lastID, changes }` and applies migrations idempotently.
- Theme is a single source of truth shared between native (`nativeTheme`) and React (`createTheme`).
- Every external input is validated in the main process, not just the UI.

---

## 3. Workstreams & Tasks

### WS1 — Data layer correctness (CRITICAL)
- [x] Add `sales.status TEXT DEFAULT 'completed'` to schema + idempotent migration.
- [x] Fix `DatabaseManager.run` to resolve `{ lastID, changes }`.
- [x] Add `migrate()` invoked on `initialize()`; safe to re-run.
- [x] Add `withTransaction(fn)` helper replacing raw `BEGIN/COMMIT` strings.

### WS2 — Security hardening (CRITICAL)
- [x] Remove generic `db-query` IPC handler (arbitrary SQL surface).
- [x] Replace string-interpolated SQL in `Dashboard.jsx` with a bound-parameter `dashboard:stats` handler.
- [x] Remove renderer-driven `process:start` with `shell: true` (RCE surface).
- [x] Apply `sandbox: true` + `contextIsolation` to the real main window.
- [x] Add server-side validation in `ipc/validation.js` for all write handlers.

### WS3 — IPC consolidation (HIGH)
- [x] Move all `ipcMain.handle` registrations into a single `ipc/index.js` loaded once at startup.
- [x] Delete duplicate `get-theme/set-theme/toggle-theme` handlers in `main.js`.
- [x] Consolidate the preload bridge into **one** `window.api` (removed redundant `window.electron` + dead channels).
- [x] Register window-scoped `webContents.send` listeners only inside `createWindow`.

### WS4 — Build tooling (HIGH)
- [x] Standardize on Vite + electron-builder. Delete `forge.config.js`, `webpack.config.js`.
- [x] Collapse `vite.config.js` + `vite.config.ts` into a single `vite.config.js` (`base: './'`, `outDir: dist`).
- [x] Delete dead `electron/windows/mainWindow.js` (loaded nonexistent `build/index.html`).

### WS5 — Real theming (MEDIUM)
- [x] Create `ThemeContext` (in `App.jsx`); load saved settings on boot via `api.settings.get()`.
- [x] Wire `ThemeManager` (native) ↔ React `createTheme` so Dark Mode applies.
- [x] `Settings.jsx` reads persisted settings and reflects/saves changes.
- [x] Theme toggle button added to `TitleBar`.

### WS6 — Business-logic robustness (MEDIUM)
- [x] `sale:void` guards against double-void; restores inventory only once.
- [x] `sale:create` validates non-empty cart and sufficient inventory before decrementing.
- [x] Server-side validation for store/product/customer/inventory create/update.

### WS7 — Dead-code removal (MEDIUM)
- [x] Delete `src/components/Sidebar.jsx` (dead, imports missing icons); keep `layout/Sidebar`.
- [x] Delete duplicate `src/index.js` (keep `main.jsx`).
- [x] Remove `processManager.js` / `projectManager.js` (unused, security risk).

### WS8 — Automated testing (MEDIUM)
- [x] Unit tests for `DatabaseManager` (schema, migrations, run/get/all, transactions) on in-memory SQLite.
- [x] Unit tests for IPC handlers (sale create/void, store CRUD, validation) with mocked `ipcMain`.
- [x] React component tests (`Stores`, `App`) with mocked `window.api`.
- [x] `npm test` runs the suite (jest + babel + jsdom).

---

## 4. Definition of Done (per issue)

| ID | Issue | Fix | Verification |
|----|-------|-----|--------------|
| C1 | `sales.status` missing | schema + migration | test asserts column exists; void sets status |
| C2 | SQL injection via `db-query` | handler removed; bound params | grep confirms no `db-query`; dashboard uses `?` |
| C3 | duplicate/dead IPC | single `ipc/` module | grep: one registration per channel |
| C4 | build conflict | one bundler | `npm run build` succeeds; no forge/webpack |
| H1 | `db.run` returns statement | returns `{lastID,changes}` | test asserts `lastID` populated |
| H2 | no inventory/void guard | validation + guard | test: oversell rejected; double-void no-op |
| H3 | `shell:true` spawn | feature removed | grep: no `shell:true` |
| H4/H5 | handler leak | register once | `activate` creates window without duplicate handlers |
| M1–M7 | dead code / theme / validation | removed/wired | tests + manual smoke |

---

## 5. Milestones

- **M1 — Security & Correctness:** WS1–WS4. No injection surfaces; DB returns correct IDs; single IPC source.
- **M2 — UX completeness:** WS5–WS6. Real dark mode, robust sales logic.
- **M3 — Quality gate:** WS7–WS8. Dead code gone, test suite green.

---

## 6. Risks & Non-Goals

- **Risk:** Existing user DBs lack `sales.status`. Mitigated by idempotent `ALTER TABLE` migration guarded against "duplicate column".
- **Non-goal:** Cloud sync, multi-device, e-commerce, mobile (see README "Coming Features").
- **Non-goal:** Rewriting the UI framework. MUI/React stays.

---

## 7. How to Run

```bash
npm install
npm run dev          # vite + electron dev
npm test             # automated test suite
npm run build        # vite build -> dist/
npm run electron:build  # package with electron-builder
```
