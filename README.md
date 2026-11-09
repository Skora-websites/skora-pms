# Skoracare PMS

Multi-tenant clinic management system: appointments, billing, prescriptions,
lab test bookings, staff roles and permissions, plus an emergency (SOS)
dispatch system and a React Native client.

- **Web app:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Drizzle ORM + MySQL2 · Tailwind 4
- **Native app:** Expo / React Native, separate repository (`~/skora-mobile`) — consumes `/api/mobile/**`

## Getting started

```bash
cp .env.example .env      # then fill in DATABASE_URL, AUTH_SECRET (see below)
npm ci
npm run db:migrate        # ordered SQL runner; `--status` lists applied/pending
npm run dev               # http://localhost:3000
```

### The two env vars that matter

| Variable | Why |
|---|---|
| `AUTH_SECRET` | Signs session JWTs **and** derives the at-rest encryption key. The app **refuses to start** on a missing, short (<32 chars) or placeholder value. Generate with `openssl rand -hex 32`. |
| `DATABASE_URL` | MySQL connection string. |

Full list: `.env.example`. Never commit `.env` — `.gitignore` covers `.env` and every
`.env.*` variant (a dated `env` backup can no longer be swept up by `git add .`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Test suite (`tsx --test`, `--conditions react-server`) |
| `npm run typecheck:tests` | Typecheck the test tree |
| `npm run db:migrate` | Apply pending `drizzle/*.sql` |
| `npm run db:migrate:status` | Show applied vs pending migrations |
| `npm run check:storage` | Asserts every file-serving route contains paths via `resolveWithinStorage` |
| `npm run check:permissions` | Asserts the route-permission maps stay coherent |
| `npm run check:links` | Asserts cross-shell links translate to the caller's own panel |

The three `check:*` scripts are **guardrails, not tests** — run them before
committing, and read a failure as "a security invariant was just removed".

## Architecture

```
app/api/**      thin HTTP adapters: parse → guard → delegate → envelope
app/api/mobile/**   JSON API for the native client (additive; reuses every guard)
lib/queries/**  all data access — no HTTP, no cookies()
lib/auth/**     guards, sessions, permissions, scoping
lib/dispatch/** emergency (SOS) dispatch engine
lib/security/** crypto, rate limiting, audit log, logger, CSRF/origin guard
lib/packages/** purchase + fulfillment (Razorpay)
components/**   presentation
```

### The outer security net: `proxy.ts`

`proxy.ts` at the repo root is Next 16's **middleware** (the file was renamed from
`middleware.ts`; a named `proxy` export is the documented convention). It is
load-bearing, not dead code:

1. **Session gate** — every dashboard prefix requires a valid session-cookie JWT,
   bouncing unauthenticated requests to `/login` before any page code runs.
2. **Receptionist URL-space rewrite** — `/receptionist/*` → `/doctor/*`.
3. **Security headers** — a per-request **nonce-locked CSP** in production
   (audit F-08 fixed a production `script-src 'unsafe-inline'`), HSTS,
   `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy`.

It is deliberately a *second* net: API handlers verify their own auth, and the
layouts + server actions remain the primary authorization layer (role checks,
session revocation, ownership scoping).

## Single instance is a hard constraint

Two things are **in-memory per process**:

- the rate limiter (`lib/security/rate-limit.ts`)
- the SOS event hub (`lib/dispatch/hub.ts`)

Running more than one Node process multiplies every rate limit by instance count,
`pm2 restart` wipes all limit windows, and a broadcast from one process never
reaches an SSE subscriber on another. For emergency dispatch that last one is a
**correctness** failure, not a performance one.

So run **one** process: `pm2 start npm --name skoracare -- start`. Do **not** add
`-i max`. Scale only after setting `REDIS_URL` and moving both onto a shared
backend. See `docs/planning/DEPLOY_AND_MOBILE_PLAN.md` §1.8.

## Caching worth knowing about

`lib/queries/available-slots.ts` memoizes the schedules + booked-times + holiday
lookup for 30 s per `(doctor, date)`; the is-today filter runs **after** the cache,
so a cached entry can never let a patient book a slot that has since been taken.
The holiday advisory reaches a public API, so the cache also removes that
outbound call from every patient-facing read.

Two other caches share one idea (`globalThis`, so they survive hot reload and are
per-process): `lib/integrations/public-apis/cache.ts` (L1 memory + L2 the DB
`cache` table) and the SOS hub registry.

## Deployment

Deploy target is a single aaPanel box behind nginx — git clone, `npm ci`,
`npm run db:migrate`, `npm run build`, PM2. The **nginx config is SSE-critical**
(proxy buffering off, 1-hour read timeout) and the cron for SOS expiry is
documented in `docs/planning/DEPLOY_AND_MOBILE_PLAN.md`, which is the source of
truth for production steps.

## Testing

Fixtures for the scoping suites (`lib/queries/__tests__/{doctor,receptionist}-scope`,
`consent-ttl`, `lib/dispatch/__tests__/*`, `lib/push/__tests__/device-tokens`,
`app/admin/__tests__/managers`, `app/api/__tests__/shule-doctors`) live in
`tests/helpers/` and write **through the app's real `db` singleton**, sweeping
`@fixture.test` rows before and after each run. They therefore need a live MySQL
and are not hermetic — keep that in mind in CI.

Pure-unit suites (config, formats, scope logic, signatures) need neither the DB
nor network.
