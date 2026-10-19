# Phase 0 Research — Role Authorization & Scoping Fixes

**Feature**: `001-role-security-fixes` | **Date**: 2026-10-19 | **Branch**: `001-role-security-fixes`

Each section records the decision, the evidence that forced it, and the alternative rejected.

---

### R1 — Receptionist read scoping: filter by `receptionist_clinics`, everywhere

**Decision**: All receptionist read paths resolve their clinic/doctor set from
`receptionist_clinics` (active rows only). The legacy practice-wide fallback is **removed**, not
time-boxed.

**Evidence**: `getReceptionistClinicIds` already exists (`lib/queries/clinic.ts:268-292`) with exactly
one caller — `app/doctor/appointments/actions.ts:146`. Every other read resolves through
`resolvePracticeDoctorId` (`lib/queries/doctor.ts:39-41`) or `listDoctorIdsFor`
(`lib/queries/clinic.ts:88-91`), both of which fan out over the whole practice. The owner-facing UI
to maintain assignments is already built and correctly guarded
(`app/admin/staff/actions.ts:214 assignReceptionistClinics` — owner-only, validates the staff row and
every clinic against the caller's business scope), and migration `0011_receptionist_clinics.sql` is
applied. So the write side and the schema are done; only the read side is missing.

**Alternatives rejected**:
- *Time-boxed fallback flag* — `fallbackToPractice: true` is already in the signature and is
  already wrong: the fallback's `anchorId` ternary is a no-op
  (`lib/queries/clinic.ts:286`), so it can only ever return `[]`. Time-boxing a broken branch keeps
  dead code and hides the failure as "no data".
- *Filter only bookings* — that is the current state, which is precisely the defect.

**Consequence**: live behaviour changes for a receptionist holding assignments narrower than the
practice. Live data check: the one real receptionist is assigned both clinics {1,2}, so no
user-visible regression in the current dataset; the fix is what makes a third clinic safe.

---

### R2 — Admin-tier consultation detail: add an admin-scoped route, do not link into `/doctor`

**Decision**: Build `app/admin/consultations/[appointmentId]/page.tsx` (and
`online-consultations/[appointmentId]`) guarded by `requireAdminTier`, reusing the doctor's
consultation form component. The doctor-only rows ("View" on `/admin/consultations`) become an
admin-scoped route; the doctor-only *page* stays doctor-only.

**Evidence**: `app/admin/consultations/page.tsx:14-16` documents intent — "read-only history …
Starting a consultation (the clinical completion flow) stays with the doctor — the owner audits
records and downloads prescription PDFs" — yet it renders `components/mobile-view/consultations-list.tsx`
whose "View" link is `href={/doctor/consultations/${c.appointmentId}}` (line 61, unconditional). The
owner is bounced by `app/doctor/layout.tsx:23` `requireRole(["doctor","receptionist"])` and by
`DOCTOR_ONLY_PATHS` (`lib/auth/permissions.ts:58-66`).

**Alternatives rejected**:
- *Hide the "View" link for admins* — leaves the owner with a history list and no drill-down, which
  the audit table explicitly wants to be possible.
- *Add consultations to `/admin` as read-only mint* — already the page's intent; the missing piece is
  the detail route, not the list.

---

### R3 — Missing permission names: add real catalog rows, do not repoint the gates

**Decision**: Seed and migrate two new permission rows — `consultations` and `online-consultations` —
each with child permissions mirroring the doctor module pattern, and add both to
`DELEGABLE_MANAGER_MODULES`.

**Evidence**: `lib/auth/permissions.ts:128-132` gates `/admin/consultations` on `consultations` and
`/admin/online-consultations` on `online-consultations`. Verified against the live database: the
catalog holds 68 permissions and **neither name exists** (`PROBE consultations => ABSENT`,
`PROBE online-consultations => ABSENT`). Both routes therefore pass only via the owner role bypass;
a manager can never be granted them and the nav entry can never light up.

**Alternatives rejected**:
- *Repoint the gate to `dashboard`* — would make two clinically distinct modules share one grant,
  collapsing the permission model's granularity.
- *Drop the routes* — they are the documented owner-parity modules (D1).

---

### R4 — Duty state: collapse to one written column (`users.on_duty`)

**Decision**: `users.on_duty` becomes the single source of truth. The header pill and the SOS
broadcast both read it. `clinic_on_duty` / `home_visit_on_duty` are retained only as derived or
removed by migration once nothing reads them.

**Evidence**: `app/doctor/layout.tsx:129` feeds `dutyModeOf(user.clinicOnDuty, user.homeVisitOnDuty)`
into `components/dashboard/header.tsx:190`, whose tooltip advertises "the I'm on duty toggle" —
grepping for any writer of either column returns nothing. Meanwhile
`lib/dispatch/actions.ts:588-590 setDoctorOnDuty` writes `users.onDuty`, and
`lib/dispatch/geo.ts:63` reads it for the SOS pool. So the advertised control does not exist while a
working control exists for a different feature.

**Alternatives rejected**:
- *Write both duty columns and keep the pill on them* — stronly rejected: it preserves two sources of
  truth and leaves SOS reading a third.
- *Derive SOS from the duty-mode columns* — the live SOS path already uses `on_duty`; rewriting it
  inverts a working dependency.

**Open consequence**: receptionists cannot set an owner's duty (finding L6). The decision is to
expose a receptionist-visible duty control **only if** the product wants it; otherwise remove the
tooltip's promise for non-doctor roles rather than leaving a control that 403s.

---

### R5 — Test harness: `node:test` + `tsx`, no new runtime dependency

**Decision**: Add `node --test` suites run through the existing `tsx` devDependency, exercising the
seeded dev database inside rolled-back transactions. Add `npm run test` and wire it into Principle V's
gate table via a constitution amendment (MINOR).

**Evidence**: The repository has no test framework, no `*.test.*`/`*.spec.*` files, and no test
script (`package.json:5-15`); ROLE_MODEL_PLAN Phase 6 (tests) is recorded as not started. The
existing guard scripts (`scripts/check-storage-guard.mjs`, `scripts/check-db-schema.mjs`) already use
plain Node with `node:assert/strict` — the house style is dependency-free scripts. `tsx` is already a
devDependency and runs TypeScript directly.

**Alternatives rejected**:
- *Vitest/Jest* — adds a runtime dependency and a second assertion vocabulary to a codebase whose
  conventions are plain Node assertions.
- *Playwright e2e* — the suite was deliberately removed (commit `0ff2475`) and re-establishing it is
  a product decision, not a fix decision; browser-level verification stays in `quickstart.md` as a
  manual scenario.
- *Pure-unit mocks only* — every defect here is a SQL predicate or a guard call, so tests that stub
  the DB would not catch them.

**Risk**: tests run against the live dev database. Mitigation: each suite opens a transaction,
inserts its fixtures, asserts, and rolls back; the seed data (2 clinics, 1 receptionist, 2 managers)
is never mutated.

---

### R6 — Admin-tier file downloads: widen the guard, scope the record

**Decision**: The three affected download endpoints admit `admin`/`manager` and then apply a
business-scope check on the resolved row, matching the pattern the staff server actions already use
(`requireWriteScope`'s admin branch, `lib/auth/action-scope.ts`).

**Evidence**: `app/api/doctor/test-bookings/[id]/report/route.ts:30` and
`app/api/doctor/consult-pdf/route.ts:12-15` both require `["doctor","receptionist"]`, but their UI is
shared into `/admin` (`app/admin/test-bookings/page.tsx:7` imports the table;
`components/doctor/appointment-actions.tsx:87` renders the consult link from the admin appointments
page). The admin shell therefore renders links it can never fetch.

**Alternatives rejected**:
- *Separate admin-only download routes* — duplicates storage-containment logic
  (`resolveWithinStorage`) and its audit call, which Principle III wants in one place.
- *Hide the links for admins* — breaks the owner's documented ability to audit records (the reason
  `app/admin/consultations` exists at all).

---

### R7 — `/api/shule/doctors`: derive the tenant from the token holder's role

**Decision**: Require a staff-tier token holder (admin, manager, or doctor), derive the visible
doctor set from that holder's own scope, and return the documented 403 for deactivated owners.

**Evidence**: The route authenticates via `getUserByApiTokenHeader`
(`app/api/shule/doctors/route.ts:51`) and never reads `user.role`; the query is
`eq(users.role,"doctor") AND eq(users.status,"active")` with no tenant filter and `limit(200)`,
selecting `email`, `phone`, `registration_number`. Tokens are per-user
(`personal_access_tokens.tokenable_id`), so a patient-tier account qualifies. Crucially, **`users`
has no `business_id` column** — tenancy is derived: `businesses.owner_id` for owners,
`clinic_managers` for managers, `doctor_clinics` for doctors (`lib/auth/scope.ts`,
`resolveOwnerScope` shown above). The same helpers the dashboard uses therefore resolve a token
holder's tenant.

**Alternatives rejected**:
- *Global endpoint, token-scoped by `abilities`* — `abilities` exists on the token table but
  `lib/auth/api-token.ts` never reads it; adding ability parsing to close a leak is more machinery
  than deriving the existing scope.
- *Single shared platform token* — a provisioning change with migration and rotation cost, for no
  additional safety once the role check exists.

---

### R8 — Legacy `clinic_id = NULL` appointments: repair by explicit migration rule

**Decision**: Add a numbered migration assigning each null-clinic appointment to the acting doctor's
first active clinic, record the row count, and audit the change; display code keeps tolerating null
for old rows.

**Evidence**: Live: 9 appointments with `clinic_id = NULL`, 109 at clinic 1, 0 at clinic 2. NULLs
come from `resolveClinic` returning null and callers ignoring it
(`app/doctor/appointments/actions.ts:143-149,309,572`). Once FR-005 rejects those writes, the rows
remain as historical data that must render sensibly.

**Alternatives rejected**:
- *Delete* — destroys clinical history.
- *Leave NULL indefinitely* — leaves reports and clinic-scoped listings permanently unable to see
  those appointments.

---

## Resolution status

| Original unknown | Status |
|---|---|
| Receptionist read policy (R1) | **Resolved** — assignment-table scoping, fallback removed |
| Admin consultation drill-down (R2) | **Resolved** — new admin-scoped detail route |
| Missing permission names (R3) | **Resolved** — seed + migrate two catalog rows |
| Duty source of truth (R4) | **Resolved** — `users.on_duty`; receptionist on-behalf control dropped |
| Test harness (R5) | **Resolved** — `node --test` + `tsx`, transactional fixtures |
| Admin downloads (R6) | **Resolved** — widen guard + business-scope the row |
| Integration tenancy (R7) | **Resolved** — role check + derived tenant scope |
| Legacy NULL clinics (R8) | **Resolved** — migration rule + display tolerance |

**No NEEDS CLARIFICATION items remain.**
