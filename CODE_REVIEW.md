# Code Review — Multi-Store Management (Electron + React)

**Reviewer:** Senior Software Engineer (10 yoe)
**Scope:** Full codebase audit — Electron main process, preload bridge, React frontend, build config
**Date:** 2026-07-18

---

## 1. Executive Summary

This is a small but functional multi-store POS / inventory desktop app. The architecture is conventional (Electron main + React renderer, SQLite, IPC over `contextBridge`). The good news: security basics are mostly right (`contextIsolation: true`, `nodeIntegration: false`, parameterized SQL in most handlers).

However, the project has **critical correctness bugs, a serious data-integrity flaw, dead/conflicting code, and build configuration that will not produce a working production app**. Several modules are clearly abandoned mid-refactor. **It is not production-ready in its current state.** Below are the issues ranked by severity, with concrete file:line references and recommended fixes.

**Severity tally:** 🔴 Critical ×4 · 🟠 High ×6 · 🟡 Medium ×7 · ⚪ Low ×5

---

## 2. 🔴 Critical Issues

### C1. `sales` table has no `status` column, but `sale:void` writes to it — the void feature is broken
`electron/main.js:393-396` issues `UPDATE sales SET status = "voided" ...` yet the schema in `electron/services/databaseManager.js:66-74` defines `sales` **without a `status` column**. In SQLite this throws `SQLITE_ERROR: no such column: status`, so `sale:void` always rolls back and throws. The UI (`Sales.jsx:391, Reports.jsx:160`) even renders `sale.status || 'completed'`, masking the bug on read.

**Fix:** Add `status TEXT DEFAULT 'completed'` to the `sales` CREATE TABLE, and migrate existing DBs (`ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'`).

### C2. SQL injection via `db-query` exposed to the renderer (arbitrary SQL execution)
`electron/main.js:142-144` registers `db-query` which forwards **any** SQL + params to `db.all`. `Dashboard.jsx:62-67` interpolates `today` directly into a SQL string:
```js
WHERE date(created_at) = date('${today}')
```
This is both string-interpolated SQL and exposes a full query primitive to the renderer. A malicious/buggy page (or XSS) could run `DROP TABLE`, read any data, etc.

**Fix:** Remove the generic `db-query` handler entirely. Expose only purpose-built, parameterized handlers (you already have them). Make the dashboard use a bound parameter: `WHERE date(created_at) = date(?)` with `[today]`.

### C3. Duplicate `ipcMain.handle` registration for theme/settings — one set is dead
`main.js:112-122` registers `get-theme` / `set-theme` / `toggle-theme`. `themeManager.js:81-92` registers `theme:get` / `theme:set` / `theme:toggle`. The **preload (`preload.js:62-65`) only wires the `theme:*` channels**, so the `get-theme`/`set-theme`/`toggle-theme` handlers in `main.js` are **never called and are dead code**. Conversely, `api.theme` in the preload is the only theme path actually used, but it routes through `themeManager`'s `ipcMain.handle` which is set up inside `ThemeManager`'s constructor — which only runs if `new ThemeManager()` is constructed. It is (`main.js:23`), so this *works*, but the split is confusing and error-prone.

**Fix:** Pick one channel namespace. Delete the `get-theme`/`set-theme`/`toggle-theme` handlers from `main.js`. Keep a single source of truth for IPC registration (ideally inside the service that owns it).

### C4. Build output path mismatch — `electron-builder` will ship a broken app
`package.json:9` sets `"build": "vite build"` → outputs to `dist/` (vite.config). But `electron/main.js:45` loads `dist/index.html` (correct), while the **unused** `electron/windows/mainWindow.js:37` loads `../../build/index.html` (CRA path, doesn't exist). More importantly, `forge.config.js` (electron-forge) and `package.json` `electron-builder` **both exist and conflict** — two different packaging systems. `main` points to `electron/main.js`, but `mainWindow.js` is never imported anywhere (dead code). The webpack.config.js is corrupt garbage (see M3).

**Fix:** Standardize on **one** bundler. Given `vite build` + `electron-builder` is the chosen path, delete `forge.config.js`, `webpack.config.js`, and `electron/windows/mainWindow.js`. Verify the packaged app loads `dist/index.html`.

---

## 3. 🟠 High Issues

### H1. `db.run` returns `this` (the statement), not `{ lastID, changes }`
`databaseManager.js:102-112`: the promise resolves `this` (the `sqlite3.Statement`). SQLite's `lastID`/`changes` live on the **database object** (`this.db`), not the statement, and must be read synchronously inside the callback. `main.js:276` does `const saleId = saleResult.lastID;` → `lastID` is always `undefined`. The sale insert "succeeds" but the returned `saleId` is undefined, and `sale:void`/`sale:get` key off a bad id.

**Fix:** Capture `this.lastID`/`this.changes` inside the callback:
```js
run(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
```
(`.run` inside `DatabaseManager` keeps `this` as the statement in non-arrow callback — good — but currently returns the statement object, not its props.)

### H2. `sale:create` uses manual `BEGIN/COMMIT` with `db.run` that does not expose transaction control robustly + error contract
`electron/main.js:264-297`. `db.run('BEGIN TRANSACTION')` etc. rely on sqlite3's serialized mode. Acceptable, but there is **no retry/locking handling** and the transaction primitives are string statements. Also `sale:create` never validates that `items` is non-empty or that inventory exists/is sufficient before decrementing — you can sell more than stock (negative inventory) and there's no `status` default. Add quantity availability checks.

### H3. `processManager.startProcess` spawns with `shell: true` on unsanitized command — command injection / RCE
`electron/services/processManager.js:28-32`: `spawn(command, args, { shell: true })`. With `shell:true`, `command` is parsed by the shell, so any renderer-supplied string runs arbitrary shell commands. The preload exposes `process.start(command, args, cwd)` to the renderer. Even ignoring malice, this is a huge attack surface. Combined with C2's dead-code surface, the security model is inconsistent.

**Fix:** Remove `shell: true` (pass `command` as the executable and `args` as an array), or remove the arbitrary process-run feature entirely — it's unrelated to a POS system and unused by the UI.

### H4. `MainProcess.initializeServices()` sets `processManager`/`projectManager` mainWindow **before** the window exists
`electron/main.js:18-26`: `createWindow()` is called in `init()` **before** `initializeServices()`. But `initializeServices` calls `processManager.setMainWindow(this.mainWindow)` while `this.mainWindow` is still `null` (window created in `createWindow` sets `this.mainWindow`, which *does* run first — OK). However `projectManager.setMainWindow(this.mainWindow)` also called. The ordering is fragile: `createWindow` registers `ipcMain.handle('window:minimize')` **every time the window is created** (see H5).

### H5. IPC handlers registered inside `createWindow()` leak on multiple window creation (macOS `activate`)
`electron/main.js:49-72`: `ipcMain.handle('window:minimize'|'maximize'|'close')` and the `maximize`/`unmaximize` event listeners are registered **inside `createWindow()`**. On macOS `activate` (`main.js:87-91`) `createWindow()` runs again → **duplicate handlers**. `ipcMain.handle` overwrites (warning thrown), but the `webContents.on('maximize')` listeners accumulate and reference the old, closed window → memory leaks + sending to a dead webContents.

**Fix:** Register all `ipcMain.handle` **once** at app startup (outside `createWindow`). Keep only `BrowserWindow` creation + window-scoped `webContents.send` listeners in `createWindow`.

### H6. No `ready-to-show` / lifecycle safety; window can flash and the app quits on dev errors silently
`electron/main.js:96`: `mainProcess.init().catch(console.error)` — any init failure is swallowed. Also `mainWindow` has `frame: false` + custom title bar, but there is no fallback if `window.api` is undefined (e.g., web security), and `loadURL('http://localhost:3000')` hardcodes the Vite port with no retry.

---

## 4. 🟡 Medium Issues

- **M1. Dead component `src/components/Sidebar.jsx`** — imports `DashboardIcon`, `StoreIcon`, `InventoryIcon`, `PointOfSaleIcon`, `PeopleIcon`, `AnalyticsIcon` that are **never imported** (will crash if rendered) and uses `ListItem button` (deprecated in MUI v5). The real sidebar is `src/components/layout/Sidebar/Sidebar.jsx`. Delete the dead file.
- **M2. Duplicate entry points** — `src/index.js` and `src/main.jsx` are near-identical; `index.html` loads `main.jsx`. `index.js` is dead and also calls `reportWebVitals()` (fine) but is unused.
- **M3. Corrupt `webpack.config.js`** — contains literal scaffolding/garbage (`// ...existing code...`, stray `};`). Not referenced, but should be deleted to avoid confusion.
- **M4. Conflicting Vite configs** — both `vite.config.js` and `vite.config.ts` exist. Vite picks one (`.ts` wins if present in some setups, but `.js` is also loaded). They define different aliases (`@features` vs `@database`/`@shared`) and only `.js` has `manualChunks` for `lodash`/`moment` which **aren't dependencies**. Collapse to a single correct config.
- **M5. `Settings` page never reads persisted settings** — `Settings.jsx:22` hardcodes defaults and never calls `window.api.settings.get()`. So toggling "Dark Mode" saves to DB but the actual MUI theme (`App.jsx:16-41`) is hardcoded `mode: 'light'` and the native theme (`ThemeManager`) is never applied to the React theme. Dark mode is cosmetic-only and non-functional end-to-end.
- **M6. `sale:void` restores inventory even if already voided** — no guard checking `status`. Double-void double-restores stock. Add `WHERE id = ? AND status != 'voided'`.
- **M7. No input validation on any IPC write** — `store:create`, `product:create`, `customer:create`, etc. accept arbitrary shapes; empty `name` allowed (only `NOT NULL` at DB level, but empty string passes). Frontend `Stores.jsx` has no required-field validation (only `Customers.jsx:131-134` validates). Add server-side validation.

---

## 5. ⚪ Low / Hygiene Issues

- **L1.** `electron/services/databaseManager.js:8` stores DB at `APPDATA || HOME` root as `MultiStoreManagement/database.sqlite` — mixes OS paths awkwardly; use `app.getPath('userData')` instead of raw `APPDATA/HOME`.
- **L2.** `preload.js` exposes **two** APIs (`window.electron` and `window.api`) with overlapping, differently-named channels (`electron.fs` vs `api.files`, `electron.theme` vs `api.theme`). Consolidate to one bridge.
- **L3.** `preload.js` references channels that don't exist in main (`dialog:openFile`, `dialog:saveFile`, `dialog:openFolder`, `fs:readFile`, `fs:writeFile`, `fs:readDirectory`, `project:open`, `create-project`, `load-project`, `list-projects`, `get-current-project`, `theme:system`, `theme:changed`) — dead bridge methods that will reject/hang.
- **L4.** `Reports.jsx:64-71` builds date range but passes JS `Date.toISOString()` to a handler that wraps with `date(?)`. Comparing `date(created_at)` (UTC day) vs JS ISO (UTC) is mostly OK, but `sale:getAll`/`getByStore` don't use the dates effectively and `startDate`/`endDate` defaults can exclude same-day sales depending on TZ.
- **L5.** Empty/`0`-byte files committed: `scripts/show-logs.js`, `src/components/ProjectExplorer.css`, `src/App.test.js` (likely empty/boilerplate), `public/robots.txt`. Add a real logs script or remove. `App.test.js` — verify it actually tests something.

---

## 6. Security Posture (Summary)

| Control | Status |
|---|---|
| `contextIsolation` | ✅ true |
| `nodeIntegration` | ✅ false |
| Parameterized SQL (CRUD handlers) | ✅ yes |
| Generic `db-query` (arbitrary SQL) | 🔴 remove |
| `shell:true` process spawn from renderer | 🔴 remove/harden |
| SQL string interpolation in renderer | 🔴 fix |
| `sandbox` only on dead `mainWindow.js` | ⚠️ apply to real window |

---

## 7. Prioritized Action Plan

1. **Fix schema + migrations** (C1, H1): add `sales.status`, fix `db.run` to return `{lastID, changes}`, migrate existing DBs.
2. **Close IPC attack surface** (C2, H3): delete `db-query` + arbitrary `process` spawn; use bound params everywhere.
3. **Single source of truth for IPC** (C3, H5): register handlers once at startup; delete dead handlers/bridge methods; pick one API namespace.
4. **Unify build tooling** (C4, M3, M4): keep Vite + electron-builder; delete forge/webpack/duplicate vite/duplicate entry/dead window.
5. **Make Dark Mode real** (M5): wire `ThemeManager` → React `createTheme` via context; load saved settings on boot.
6. **Code hygiene** (M1, M2, L3, L5): delete dead components/files, consolidate preload.
7. **Add validation + guards** (M6, M7, H2): server-side validation, void guards, inventory availability checks.

---

## 8. What's Done Well ✅

- Correct Electron security primitives (`contextIsolation`, `nodeIntegration:false`).
- Parameterized queries in all CRUD handlers (good instinct).
- Transaction wrapping for sale create/void (conceptually right).
- Clean, readable React pages with consistent MUI patterns and loading/error states.
- `react-router` routing is sensible; layout componentization is reasonable.

The foundation is sound; the blockers above are concentrated and fixable without rearchitecting.
