# Documentation

## Root (entry points)

| File | Purpose |
|---|---|
| `README.md` | Project bootstrap / getting-started (create-next-app base) |
| `AGENTS.md` | Agent context: repo rules, conventions, operating constraints |
| `CLAUDE.md` | Pointer to `AGENTS.md` |

## Planning (`docs/planning/`)

Historical planning and specification documents. Git history is the source of truth for older revisions.

| Document | Content |
|---|---|
| `IMPLEMENTATION_PLAN.md` | Next.js 16.3 rewrite plan from the legacy Laravel app — **complete** |
| `ROLE_MODEL_PLAN.md` | Role & permission model — **implemented** (phases 1–5) |
| `DASHBOARD_FEATURES.md` | Dashboard feature checklist verified against the actual route/action/API inventory |
| `DASHBOARD_FLOWS.md` | Companion to the checklist: how each module works end-to-end |
| `DESIGN.md` | Design system & UI/UX specification |
| `BUSINESS_FLOW_AUDIT.md` | Business flow & business-logic validation report |

## Architecture (`docs/architecture/`)

| Document | Content |
|---|---|
| `server-actions.md` | Placement convention for `"use server"` files (`lib/actions/` vs route-local `actions.ts`) |

## PWA probes (`docs/probes/`)

| Probe | Content |
|---|---|
| `probe1-push-sync.html` | Web-push subscription sync probe |
| `probe2-visibility-wakelock.html` | Page-visibility / wake-lock probe |
| `probe3-capacitor.md` | Capacitor packaging exploration (PWA → native shell) |

## Archive (`docs/archive/drizzle-superseded/`)

Schema fragments superseded by committed `drizzle/*.sql` migrations. Kept for reference only — the migration runner never applies anything from `docs/`.

## Source layout reference

```
app/            Next.js App Router routes (pages, layouts, route-local actions.ts, api/)
components/     Shared UI by domain: dashboard, doctor, integrations, marketing,
                mobile-view, packages, pdf, pwa, sos, ui, dev
lib/            Server modules: actions, auth, db, dispatch, files, integrations,
                mail, packages, push, queries, security, uploads, validation
                + flat shared modules: config, constants, notifications, utils
scripts/        Operator tooling (migrate, seed, db:check, check:storage, provision-api-token)
drizzle/        Numbered MySQL migrations, applied by scripts/migrate.ts in filename order
proxy.ts        Middleware: session gate, security headers, CSP
docs/           This directory
```
