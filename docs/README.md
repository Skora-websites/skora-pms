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

## Verification gates (`npm run`)

Every change MUST pass the gates that apply to it. The two new gates (`check:permissions`,
`check:links`) close audit findings where a route or component referenced something that no longer
existed.

| Command | Covers |
|---|---|
| `npm run build` | TypeScript `strict`, whole app |
| `npm run lint` | ESLint + `eslint-config-next` |
| `npm run check:storage` | Storage path containment (no bare `startsWith`) |
| `npm run db:check` | Migration numbering, collation, staff-link integrity |
| `npm run db:migrate:status` | No pending migrations |
| `npm run check:permissions` | Every route-map permission name exists in the catalog |
| `npm run check:links` | No component hardcodes another shell's URL prefix |
| `npm run test` | `node --test` suites covering role scoping and isolation |

**`npm run build` pins `NODE_ENV=production` itself.** npm on some hosts injects
`NODE_ENV=development` into lifecycle scripts, which makes `next build` compile
React's development internals; static generation then dies prerendering
`/_global-error` with `TypeError: Cannot read properties of null (reading
'useContext')`. Do not set `NODE_ENV` in `.env`/`.env.example` either — Next owns
that variable, and a pinned value silently builds the wrong bundle.

**Migration numbering**: `drizzle/` files are applied in filename order by
`scripts/migrate.ts`, which only picks up files matching `^\d{4}_`. The sequence
skips `0017` (0016 → 0018) — the runner is unaffected because it orders by name,
not by continuity. New migrations use the next free number (currently `0022`).

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
scripts/        Operator tooling (migrate, seed, db:check, check:storage, provision-api-token,
                import-india-datasets — validates the India clinical-data snapshots)
drizzle/        Numbered MySQL migrations, applied by scripts/migrate.ts in filename order
proxy.ts        Middleware: session gate, security headers, CSP
docs/           This directory
```
