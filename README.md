# Multi-Store Management System (SaaS Desktop App)

An Electron + React (Vite) desktop application for managing multiple stores — pharmacies and retail — built with a **production-oriented, multi-tenant SaaS architecture** that runs **fully locally on mock data** (no external backend required).

## Features

- **Authentication & multi-tenancy** — login, session, and tenant (organization) switching. All data is scoped per tenant.
- **Dashboard** — KPI cards plus revenue trend (area chart) and sales-by-store (bar chart) using Recharts.
- **Stores / Inventory / Sales (POS) / Customers / Reports / Settings** — full CRUD with tenant scoping.
- **Point of Sale** — add-to-cart, quantity adjustments, payment method, checkout that decrements inventory, and sale voiding (with double-void guard + inventory restoration).
- **Theming** — light/dark mode persisted per workspace.
- **Local mock backend** — an in-memory, async, tenant-scoped data store that simulates a real API. Swap `src/services/mock/db.js` for HTTP calls in `src/services/api.js` to go live.

## Architecture

```
Electron (main.js + preload.js)
  └─ loads the React renderer (Vite build → dist/)

Renderer (React + MUI)
  ├─ context/AuthContext     auth + tenant context
  ├─ context/ThemeContext    light/dark
  ├─ services/api.js         service layer (single swap point to real API)
  ├─ services/mock/db.js     in-memory tenant-scoped mock database
  ├─ components/AppShell     sidebar + topbar (tenant switcher, theme, user)
  └─ pages/                  Login, Dashboard, Stores, Inventory, Sales, Customers, Reports, Settings
```

**Key design point:** the UI never talks to data directly — it calls `services/api.js`. Today that delegates to the local mock store; replacing the implementation with `fetch`/axios calls is the only change needed to connect a real backend.

## Demo Accounts

| Email | Password | Tenant |
|-------|----------|--------|
| admin@acme.com | admin123 | Acme Retail Group |
| manager@healthplus.com | manager123 | HealthPlus Pharmacies |
| demo@demo.com | demo123 | Acme Retail Group |

## Getting Started

```bash
npm install
npm run dev            # Vite dev server + Electron (loads http://localhost:3000)
# or
npm run build          # production build → dist/
npm run electron:build # package with electron-builder
npm test               # run the test suite (mock data layer)
```

## Notes

- Data is in-memory and resets on app restart (this is the local mock backend by design).
- To make data persistent or multi-user, implement the backend behind `services/api.js`.
