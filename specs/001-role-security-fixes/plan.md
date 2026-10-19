# Implementation Plan: Role Authorization & Scoping Fixes

**Branch**: `001-role-security-fixes` | **Date**: 2026-10-19 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `/specs/001-role-security-fixes/spec.md`

## Summary

Close every authorization, scoping and cross-shell defect found by the 2026-10-19 role audit
(1 CRITICAL, 13 HIGH, 13 MEDIUM, 6 LOW). The existing guard/scope primitives are sound — the defects
are in *callers* and *query predicates*: a scope parameter accepted and ignored, a `null` returned
where an error was required, permission names referenced but never seeded, and six components
hardcoding another shell's URLs. The fix enforces what the primitives already promise: filter reads
by the caller's real scope, reject instead of silently dropping, make every referenced permission
exist, and route all cross-shell links through one role-aware helper. A `node --test` harness (R5)
turns the eight success criteria into permanent regression tests.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict: true`, ES2017 target — enforced by `npm run build`

**Primary Dependencies**: Next.js 16.3.0 (App Router), React 19.2.8, drizzle-orm 0.45.2 + mysql2,
Zod v4, jose (sessions), bcryptjs, tailwindcss v4, `server-only`. **No new runtime dependency is
introduced by this feature.**

**Storage**: MySQL via Drizzle; schema changes ship as numbered SQL files in `drizzle/`, applied by
`scripts/migrate.ts` in filename order. Two new permission rows and the null-clinic repair are
migrations.

**Testing**: `node --test` executed via the existing `tsx` devDependency (R5) — no new framework.
Fixtures run inside rolled-back transactions against the dev database. Browser-level verification is
manual (`quickstart.md`). Existing operator guards — `npm run check:storage`, `npm run db:check`,
`npm run lint` — remain mandatory.

**Target Platform**: Linux server, web application; rendered both server (RSC) and client.

**Project Type**: Web application, single project (no monorepo). App Router route groups:
`(auth)`, `(marketing)`, `admin`, `doctor`, `patient`, `super-admin`, `vendor`, `api`.

**Performance Goals**: No new hot paths. Every added predicate uses already-indexed columns
(`appointments.patient_id`, `appointments.doctor_id`, `receptionist_clinics.is_active`), and the
scope helpers stay inside the existing React `cache()` per-request memoisation. Page-render p95
unchanged is the acceptance bar; any added per-request query must join an existing index.

**Constraints**: Read-only analysis found the defects; this plan confines itself to guard call sites,
query predicates, permission data, one link helper, and tests. No schema redesign, no new runtime
dependency, no change to the guard primitives' contracts. PHI must never enter a client bundle
(`server-only` discipline, Principle III).

**Scale/Scope**: 6 roles (`super_admin`, `admin`, `manager`, `doctor`, `receptionist`, `patient`) ·
8 route groups · 139 routes · ~91 documented features · 33 audit findings.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| **I. Server-Action Boundary Discipline** | PASS | Fixes are confined to existing action files and their guards; no new action files, no cross-route-group server-action imports introduced. |
| **II. Authorization Scoping On Every Mutation (NON-NEGOTIABLE)** | PASS — this feature *restores* it | C1, H11, H12, H13 are Principle II violations; FR-001/002/016 enforce the guard predicate the constitution mandates. |
| **III. Data Protection, Path Containment, Boundary Validation** | PASS | No file-serving logic changes; the widened download guards keep `resolveWithinStorage` containment. |
| **IV. Schema And Migration Integrity** | PASS | Two permission rows + one null-clinic repair ship as numbered migrations, applied in filename order; no committed migration is edited. |
| **V. Verification Gates Before Done** | PASS with one required follow-up | `check:storage`, `db:check`, `lint`, `build` stay green. Adding `npm run test` to the gate table materially expands V's guidance → **a separate, explicit MINOR constitution amendment is required and is not performed by `/speckit.plan`.** See Complexity Tracking. |

No principle requires dilution, reinterpretation, or amendment by the implementation itself.

## Project Structure

### Documentation (this feature)

```text
specs/001-role-security-fixes/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 — 8 decisions (R1-R8)
├── data-model.md        # Phase 1 — invariants on existing entities
├── quickstart.md        # Phase 1 — scenarios A-I
├── contracts/
│   ├── authorization-guards.md    # CG-1..CG-5 caller obligations
│   └── affected-endpoints.md      # guard/status-code changes
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
lib/auth/                    guard.ts · scope.ts · action-scope.ts · server-permissions.ts
                             permissions.ts (route maps, DELEGABLE set, link helpers)
lib/queries/                 clinic.ts (getReceptionistClinicIds, listDoctorIdsFor)
                             doctor.ts (getHomeVisitPatientDetail — the C1 predicate)
                             consent.ts (TTL), admin.ts (unscoped reads)
lib/dispatch/                actions.ts · geo.ts (SOS tier + duty resolution)
app/doctor/                  layout.tsx · appointments/actions.ts · actions.ts
                             staff/actions.ts · roles/actions.ts · consult-pdf/actions.ts
app/admin/                   managers/actions.ts · staff/actions.ts
                             consultations/page.tsx + NEW [appointmentId]/page.tsx
app/api/doctor/              home-visits/patient-details/[id] · booked-times · consult-pdf
                             test-bookings/[id]/report
app/api/shule/               doctors/route.ts (role + tenant scoping)
components/dashboard/        header.tsx · mobile-app-shell.tsx (link helper adoption)
components/doctor/           appointment-actions.tsx · permission-gate.tsx
components/mobile-view/      consultations-list.tsx
scripts/                     NEW check-permissions.mjs (catalog ↔ route-map parity)
drizzle/                     NEW 0020_permission_rows.sql · 0021_repair_null_clinics.sql
spec → tests (new)           lib/**/__tests__, app/**/__tests__ run by node --test
```

**Structure Decision**: Single Next.js web application; all changes land in the existing layout.
The only new source files are the two link-helper modules, the permission-parity check script, the
two migrations, the admin consultation detail route, and the test files. No new project, package, or
build layer.

## Complexity Tracking

> Constitution Check has no violations requiring justification. Two items need explicit user
> decisions, recorded here rather than hidden.

| Item | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Constitution MINOR amendment adding `npm run test` to Principle V's gate table | SC-009 requires the eight criteria to be permanent gates, not manual checks | Running them manually is exactly the regime that let 33 defects accumulate; the constitution must name the new gate or teams will skip it. **Amendment is a separate, explicit command.** |
| Removing the receptionist practice-wide fallback (R1) | The existing fallback is provably broken (`anchorId` no-op ternary returns `[]`) and time-boxing it keeps a silent-widening path | Keeping the flag preserves a code path whose only observable effect is an empty list with no explanation — indistinguishable from a bug to the user. |

## Design re-check (post Phase 1)

- CG-1 is satisfied: `getHomeVisitPatientDetail` gains the doctor-scope predicate; clinic
  resolution failure returns an error rather than `null`.
- CG-2 needs no primitive change — all fixes are caller-side.
- CG-3 is satisfied by the new shell-link helper (one module, one source of truth per link purpose).
- CG-4: the client gate adopts `DOCTOR_ONLY_PATHS`, closing the drift the audit flagged.
- CG-5: `saveConsultation` and the two status-transition actions gain audit + notify, matching
  `DASHBOARD_FLOWS.md` §5.3.
- No data-model contract conflicting with any constitution principle; migration rules respect
  Principle IV (filename-ordered, append-only).

**Gate result: PASS.**
