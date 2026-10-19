<!--
SYNC IMPACT REPORT (scratch — remove before commit)
Version change: none (untracked scaffold, never ratified) -> 1.0.0 (initial adoption)
Modified principles: none carried forward; PRINCIPLE_1-5 were unresolved scaffold slots
Renamed principles: none
Added sections:
  - "Technical Constraints"
  - "Development Workflow & Quality Gates"
Removed sections: none
Template layers resolved: .specify/scripts/bash/resolve-template.sh constitution-template --json
  (project template at .specify/templates/constitution-template.md equals resolved content;
   no preset or extension layer present; no .specify/extensions.yml hooks registered)
Deferred:
  - RATIFICATION_DATE derived as 2026-10-19: the repository held only the unmodified scaffold
    (`.specify/` is untracked; `git log -- .specify` is empty), so no earlier adoption date exists.
    Correct this if the team ratified it informally earlier.
  - No automated test suite exists in this repository (Playwright e2e removed in commit 0ff2475;
    no vitest/jest config, no *.test.* or *.spec.* files). Principle V therefore encodes the
    verification regime that actually exists — operator scripts plus documentation audits.
    Adding a real automated suite SHOULD become a constitution amendment (MINOR).
  - The dashboard-features / business-flow docs are audited manually against the live route and
    action inventory; no check script enforces that parity yet.
-->

# SkoraCare Constitution

## Core Principles

### I. Server-Action Boundary Discipline

Every mutating operation MUST live in a `"use server"` action file. The split between
`lib/actions/` and route-local `app/<group>/<feature>/actions.ts` is deliberate and MUST follow
one rule: an action moves to `lib/actions/` only when it is imported by more than one route group
or by a shared component under `components/`; otherwise it stays beside the route that owns it.

- Route groups MUST NOT import across group boundaries (`app/doctor/...` MUST NOT import from
  `app/admin/...`).
- Cross-group reads belong in `lib/queries/<domain>.ts`; only mutations belong in `lib/actions/`.
- Page components MUST NOT import `@/lib/db` directly — they go through `lib/queries/`.
- A route's `actions.ts` is the complete, auditable list of what a client can ask that feature to
  do; nothing outside it may add to that surface.

Rationale: a `"use server"` file is its own module boundary — every export becomes an HTTP
endpoint. Keeping a feature's mutations beside the feature keeps the callable surface auditable,
and the extraction rule prevents both duplication and sideways coupling.

### II. Authorization Scoping On Every Mutation (NON-NEGOTIABLE)

Every server action MUST enforce both an authentication guard (`lib/auth/guard.ts`) and an
explicit data scope before reading or writing a row. Scope MUST match the session's tier:

| Tier | Required scope |
|---|---|
| Doctor | Strict single-doctor scope — own records only |
| Receptionist | Practice-wide scope anchored on the practice owner |
| Manager | Clinic-isolated; cross-clinic access MUST fail |
| Owner / super-admin | Full business scope |

The following role-model invariants MUST hold on every new page and endpoint and MUST be
re-verified before any release that touches them:

- Owner-only modules (`managers`, `clinics`, `business-settings`) are never delegable to managers.
- Manager cross-clinic isolation holds on every new page.
- Owner gets 403 on every super-admin API.
- Doctor own-only appointment visibility is retained.
- Every mutation is audit-logged (`audit.settingsUpdated`, `roleChanged`, or the module's
  equivalent) and business-scope-checked.

Rationale: this is a multi-tenant clinical system. An unscoped query is an authorization defect
that leaks another clinic's or doctor's patient data, and it is invisible in review unless the
scope check is itself mandatory.

### III. Data Protection, Path Containment, And Boundary Validation

- Every server module that touches secrets, the database, or the filesystem MUST import
  `server-only` so it can never be pulled into a client bundle (already enforced in
  `lib/auth/action-scope.ts`, `lib/auth/scope.ts`, `lib/auth/server-permissions.ts`,
  `lib/db/index.ts`, `lib/files/consent-upload.ts`).
- Every request that accepts user input MUST validate against a Zod schema in `lib/validation/`
  before the data is processed.
- Every file-serving path MUST be contained by the shared storage helper (`resolveWithinStorage`,
  a `path.relative` check) — a bare `startsWith` prefix check MUST NOT be used.
  Verify with `npm run check:storage`.
- Security headers MUST be set in `proxy.ts` on every app and API response: CSP,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy` (keeping `geolocation=(self)` for SOS dispatch, denying camera and
  microphone), and `X-DNS-Prefetch-Control: off`. `Strict-Transport-Security`
  (`max-age=31536000; includeSubDomains; preload`) MUST be set on non-development responses,
  and `Cache-Control: no-store, must-revalidate` on HTML and JSON responses.
- Adding a route or changing the public surface MUST re-examine the CSP allowlist rather than
  loosening it; `script-src` is nonce-locked in production.

Rationale: clinical records, consent documents, and session data are the assets this system
exists to protect. Containment and boundary validation are the two cheapest guards against the
two most common leak classes — path traversal and unvalidated input.

### IV. Schema And Migration Integrity

- Schema changes MUST ship as numbered SQL migrations in `drizzle/`, applied by
  `scripts/migrate.ts` in filename order. Raw SQL against a live database MUST NOT be used as a
  substitute for a committed migration.
- Committed migrations MUST NOT be edited after they have been applied anywhere.
- `npm run db:migrate:status` MUST be clean and `npm run db:check` MUST pass before a change that
  touches data-access code is considered done. `db:check` enforces, and a change MUST NOT relax,
  these invariants: every `.sql` in `drizzle/` is a numbered migration; all tables share the
  `utf8mb4_uca1400_ai_ci` collation with no column-level divergence except a deliberate
  `utf8mb4_bin`; and every receptionist row carries a staff link (`reference_role_id` or
  `doctor_id`).
- Schema fragments under `docs/archive/` are reference material only. The migration runner never
  applies anything from `docs/`, and `docs/` MUST NOT be treated as a migration source.

Rationale: the migration directory, ordered by filename, is the single reproducible history of
the database shape. Ambiguity about what has been applied is unrecoverable without a restore.

### V. Verification Gates Before Done

A change is NOT complete until the applicable gates pass. The gates MUST be run and MUST NOT be
skipped or waived:

| Gate | Command | Covers |
|---|---|---|
| Type check + build | `npm run build` | TypeScript `strict`, whole app |
| Lint | `npm run lint` | ESLint + `eslint-config-next`; 0 errors, new warnings justified |
| Unit & scope regression | `npm run test` | Authorization scoping, role isolation, invariants (`node --test`) |
| Permission catalog parity | `npm run check:permissions` | Every route-map permission name exists in the catalog |
| Cross-shell link hygiene | `npm run check:links` | No component hardcodes another shell's URL prefix |
| Storage containment | `npm run check:storage` | Principle III path rule |
| Schema check | `npm run db:check` | Principle IV schema parity |
| Feature inventory | manual, against `docs/planning/DASHBOARD_FEATURES.md` | Routes match reality |

A gate that is skipped is an unverified release. A test that fails in CI is a regression the
intended feature genuinely broke — the intended feature MUST then be removed because it needs to
be rewritten or revised, not the test weakened.

Any change to behavior documented under `docs/planning/` (dashboard features, dashboard flows,
business flow audit, role model) MUST update that document in the same change. Documentation
that describes behavior the code no longer performs MUST be corrected or removed, never left
stale.

Rationale: gates are the only thing standing between this codebase and an unnoticed
authorization regression — the 2026-10-19 audit found a peer-data leak and an unenforced
per-clinic boundary precisely because neither was covered by a runnable check.

## Technical Constraints

- Stack is pinned and MUST NOT be upgraded casually: Next.js `16.3.0` (App Router),
  React `19.2.8`, TypeScript `5` with `strict: true`, Tailwind CSS `v4` via
  `@tailwindcss/postcss`, Drizzle ORM `0.45.2` over MySQL (`mysql2`), Zod `v4`, `jose` for
  session signing, `bcryptjs` for password hashing.
- This Next.js version has breaking changes relative to older releases. Code MUST be written
  against `node_modules/next/dist/docs/` in this repository, NOT against remembered Next.js
  APIs. Deprecation notices in that directory MUST be heeded.
- UI MUST use the design tokens in `docs/planning/DESIGN.md` (4px/8px grid unit, 24px outer
  canvas padding, 16px bento grid gap, the documented radii and shadows) rather than ad-hoc
  values.
- `/receptionist/*` and `/doctor/*` are two URL prefixes over the SAME implementation:
  `proxy.ts` rewrites `/receptionist/*` via `pathname.replace(/^\/receptionist/, "/doctor")`,
  and `app/doctor/layout.tsx` bounces receptionist sessions from `/doctor/*` back to
  `/receptionist/*`. Receptionist routes MUST NOT be reimplemented under `app/receptionist/`;
  new receptionist-facing behavior belongs under `app/doctor/` and is reached through this
  rewrite.
- Secrets and connection strings MUST come from environment variables (`.env.example` is the
  documented template); no credentials in source, migrations, or docs.
- Business scope, roles, and permission names MUST match `lib/auth/` and
  `docs/planning/ROLE_MODEL_PLAN.md`. New roles, permission keys, or scope tiers require
  updating both.

## Development Workflow & Quality Gates

Work on new features follows the Spec-Driven Development workflow in `.specify/`:

1. `.specify/scripts/bash/check-prerequisites.sh` establishes the current feature directory and
   available documents before any work begins.
2. `create-new-feature.sh`, `setup-plan.sh`, and `setup-tasks.sh` produce, in order, the spec,
   plan, and task documents. The templates under `.specify/templates/` are the required
   structure.
3. Implementation proceeds against the generated tasks; every completed task MUST satisfy the
   gates in Principle V.
4. Artifact shape comes from the template layer via the resolver; templates MUST NOT be hand
   edited to match a single feature, and generated documents MUST NOT overwrite the templates.

Merge readiness MUST include: all Principle V gates green, the Sync Impact Report for any
amendment, repro steps for any defect fixed, and documentation updated per Principle V.
`AGENTS.md` is the runtime guidance file for agents working in this repository; where this
constitution and `AGENTS.md` conflict, this constitution wins and `AGENTS.md` MUST be corrected.

## Governance

This constitution supersedes all other practices and conventions in this repository. Where an
older document, comment, or habit contradicts it, this document is authoritative and the
conflicting text MUST be corrected.

**Amendments.** A change to any principle MUST be proposed as an explicit amendment with: the
principle text before and after, the motivation, the affected files and callsites, and a
migration note describing how existing code is brought into compliance. Amendments that remove
or redefine a principle incompatibly are MAJOR changes. Amendments that add a principle or
materially expand guidance are MINOR. Clarifications, wording, and typo fixes are PATCH. The
version MUST increment in the same change that amends the text, and `Ratified` MUST never change
after initial adoption while `Last Amended` records each amendment date in `YYYY-MM-DD`.

**Compliance review.** Every implementation task MUST be checked against these principles before
it is marked complete: Principle I (action placement), II (scope), III (validation and
containment), IV (migration), V (gates). Complexity that fights a principle MUST be justified in
writing in the plan document; an unjustified exception is a defect.

**Waivers.** A principle may be waived only by a recorded amendment to this constitution, never
by a comment in code or a decision in one review. Suspected violations MUST be reported by
whoever finds them, with the evidence.

**Version**: 1.2.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-20
