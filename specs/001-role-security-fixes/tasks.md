---

description: "Task list for feature implementation"

---

# Tasks: Role Authorization & Scoping Fixes

**Input**: Design documents from `/specs/001-role-security-fixes/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included — `spec.md` SC-009 and `research.md` R5 explicitly request a regression suite
(`node --test` + `tsx`, no new framework) covering SC-001…SC-008. Tests are written FIRST and MUST
FAIL before the corresponding implementation task.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single Next.js project. Source: `app/`, `components/`, `lib/`, `scripts/`, `drizzle/`.
Tests are colocated as `__tests__` directories and run by `node --test` via the existing `tsx`
devDependency (decision R5), e.g. `lib/queries/__tests__/doctor-scope.test.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the regression suite and its gates.

- [X] T001 Add `test` script running `node --test` over `**/*.test.ts` through `tsx` in `package.json` (script body: `tsx --test "**/__tests__/*.test.ts"`), plus `test:watch` variant, keeping every existing script unchanged
- [X] T002 [P] Add `check:permissions` script (`node scripts/check-permissions.mjs`) to `package.json` scripts block alongside the existing `check:storage` and `db:check`
- [X] T003 [P] Document the new gates (`npm run test`, `npm run check:permissions`) in `docs/README.md` under the operator-tooling table, so the gate names match `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create the transactional test harness in `tests/helpers/db.ts`: opens a MySQL connection, exposes `withRollback(async (tx) => ...)` that inserts fixtures, yields a handle, and rolls back; MUST never commit against the dev database (R5)
- [X] T005 [P] Create fixture factories in `tests/helpers/fixtures.ts` for the seeded entities — clinic, doctor, receptionist, manager, patient, appointment, consent — returning ids usable inside the rolled-back transaction from T004
- [X] T006 Write migration `drizzle/0020_permission_rows.sql` adding catalog rows `consultations` and `online-consultations`, each with child permissions named `<parent>-view`, `<parent>-create`, `<parent>-edit`, `<parent>-delete`, parented via `permissions.parent_id` (R3, data-model.md §3)
- [X] T007 [P] Write migration `drizzle/0021_repair_null_clinics.sql` re-attributing every `appointments` row where `clinic_id IS NULL` to the acting doctor's first active clinic (`doctor_clinics.is_active = 1`, lowest `id`), recording the affected row count in an `INSERT` into the audit-log-friendly output; MUST be idempotent (R8, data-model.md §1)
- [X] T008 [P] Attach both new permissions to the seeded Doctor and Receptionist roles in `scripts/seed.ts` by extending the module-permission map (the object consumed around `scripts/seed.ts:118`), keeping `consultations`/`online-consultations` out of `DEFAULT_DOCTOR_MODULE_PERMS` in `lib/auth/server-permissions.ts`
- [X] T009 Create the shell path-translation helper module `lib/auth/shell-paths.ts` exporting one function per internal link purpose — `consultationDetailPath`, `notificationsPath`, `profilePath`, `testReportPath`, `consultPdfPath` — each taking the caller's shell (`"admin" | "doctor" | "receptionist" | "patient" | "super_admin"`) and returning the correct URL or an explicit `null` when the destination is not available in that shell; MUST reuse the existing prefix translators `doctorPathToReceptionist`/`receptionistPathToDoctor` from `lib/auth/permissions.ts:221-229` rather than re-implementing prefix logic
- [X] T010 Create guard script `scripts/check-permissions.mjs`: reads every `perm` value in `ADMIN_ROUTE_PERMISSIONS`, `DOCTOR_ROUTE_PERMISSIONS` and `DELEGABLE_MANAGER_MODULES`, asserts each resolves to a row in the `permissions` table, and fails with a diff listing missing names; MUST exit non-zero on any missing permission (SC-005)
- [X] T011 Run `scripts/check-permissions.mjs` against the pre-migration database and capture the failure output listing `consultations` and `online-consultations` as missing into `specs/001-role-security-fixes/quickstart.md` (Scenario E) — this is the RED proof that T010 detects the M1 defect

**Checkpoint**: Foundation ready — harness, migrations, permission rows, path helper, and the parity
guard exist; user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Doctor data isolation across all read paths (Priority: P1) 🎯 MVP

**Goal**: A member doctor can never read a peer's clinical notes, case types, or booked-time
availability through any page, action, or API.

**Independent Test**: Call `/api/doctor/home-visits/patient-details/{id}` as a member doctor for a
patient owned by a peer doctor → expect `404` and an empty body. Repeat for a patient the acting
doctor owns → `200` with that patient's rows only.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (T015/T016)**

- [X] T012 [P] [US1] Contract test for the home-visit detail route in `lib/queries/__tests__/doctor-scope.test.ts`: seeds two doctors sharing one clinic plus one patient each, asserts `getHomeVisitPatientDetail(doctorB.id, patientA.id)` returns no appointment rows after T014
- [X] T013 [P] [US1] Integration test for the booked-times isolation in `lib/queries/__tests__/doctor-scope.test.ts`: asserts a member doctor probing a peer's `doctor_id` receives a rejection and not a slot list

### Implementation for User Story 1

- [X] T014 [US1] Add the doctor-scope predicate to `getHomeVisitPatientDetail` in `lib/queries/doctor.ts:905-918` — the `where` clause MUST become `and(eq(appointments.patientId, patientId), inArray(appointments.doctorId, <caller scope>))`, closing finding C1 (contract CG-1); the function signature MUST keep its `doctorId` parameter meaningful, or it MUST be replaced by an explicit `doctorIds: number[]` scope argument with all call sites updated
- [X] T015 [US1] Enforce caller scope at the route in `app/api/doctor/home-visits/patient-details/[id]/route.ts:1-21`: after `requireApiPermission(["doctor","receptionist"], "home-visit")`, resolve the acting doctor set (receptionist → their per-clinic doctors from T020) and return `404` when the requested patient is outside it; the 404 MUST be indistinguishable from a non-existent patient (no existence oracle)
- [X] T016 [US1] Remove the peer-probe branch from `app/api/doctor/appointments/booked-times/route.ts:51` — the `requested === resolvedDoctorId || (await isPracticeDoctor(resolvedDoctorId, requested))` condition MUST only permit the caller's own id or an id inside their write scope
- [X] T017 [US1] Replace the admin-tier fallback at `app/api/doctor/appointments/booked-times/route.ts:33` — when the resolved scope is empty, return an explicit no-access response (4xx with a stable error string) instead of silently using `user.id`
- [X] T018 [P] [US1] Apply the same ownership predicate to the sibling read paths named in FR-013: `getConsultationForPdf` in `lib/queries/doctor.ts:942` MUST assert the consultation belongs to the caller's doctor scope, and `getPatientPhotoPath` in `lib/queries/doctor.ts:278` MUST gain a doctor-scope parameter (it currently filters only `users.id` + `users.role`, exposing any patient's photo path) — update its call sites in `app/doctor/patients/*`; `getPatientById` (`:240`) is already correctly scoped via `users.referenceRoleId` and MUST NOT be changed
- [X] T019 [US1] Re-run `npm run test` (T012/T013 now green), `npm run lint`, and `npm run build` following Scenario A in `specs/001-role-security-fixes/quickstart.md`; record the C1 before/after in the commit message

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently — the
CRITICAL PHI leak is closed.

---

## Phase 4: User Story 2 - Receptionist clinic isolation is real (Priority: P1)

**Goal**: A receptionist assigned to clinic B only sees and acts on clinic B; a booking at an
unassigned clinic is rejected with a visible error and never persists a clinic-less row.

**Independent Test**: Assign the receptionist to clinic 2 only, then inspect every receptionist
listing (appointments, patients, billing, follow-ups, test bookings, income & expense) — clinic 1
rows must be absent; a booking attempt at clinic 1 must return an error string and create no row.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (T025/T026)**

- [X] T020 [P] [US2] Contract test in `lib/queries/__tests__/receptionist-scope.test.ts`: seeds three clinics with one receptionist assigned to two of them, asserts `listDoctorIdsFor` returns only the assigned clinics' doctors and never the unassigned clinic's doctor
- [X] T021 [P] [US2] Integration test in `lib/queries/__tests__/receptionist-scope.test.ts`: asserts a booking submitted at an unassigned clinic returns a rejection and that `SELECT COUNT(*) FROM appointments WHERE clinic_id IS NULL` stays at zero

### Implementation for User Story 2

- [X] T022 [US2] Rework `getReceptionistClinicIds` in `lib/queries/clinic.ts:268-292`: remove the `fallbackToPractice` option and the broken fallback block at `:278-286` (the `rows.length === 0 ? receptionistId : receptionistId` no-op ternary), so the function returns exactly the active `receptionist_clinics` rows (R1, FR-003, FR-006)
- [X] T023 [US2] Route receptionist scope through the assignment table in `lib/queries/clinic.ts:88-91` (`listDoctorIdsFor`) and `lib/queries/doctor.ts:39-41` (`resolvePracticeDoctorId`/`isPracticeWideUser`): a receptionist's doctor set MUST be the doctors of their assigned clinics, never the whole practice (FR-003); update every call site that relied on the old practice-wide result
- [X] T024 [P] [US2] Fix `resolveClinic` in `app/doctor/appointments/actions.ts:143-149`: when the requested clinic is outside the receptionist's assignment, return a typed rejection that the caller MUST surface as a user-facing error — not `null`
- [X] T025 [US2] Make both call sites at `app/doctor/appointments/actions.ts:309` and `:572` treat the T024 rejection as a hard failure: return `{ error: ... }` and perform no write; the appointment MUST NOT be created with `clinic_id` null (FR-004, FR-005)
- [X] T026 [US2] Add the zero-assignment path in `app/doctor/appointments/actions.ts`: a receptionist with no active clinic rows MUST receive an explicit "no clinic assigned" error (FR-006)
- [X] T027 [P] [US2] Propagate the receptionist scope into every listing query used by the receptionist panel — `lib/queries/doctor.ts` appointment, patient, billing, follow-up, test-booking and income-expense readers MUST accept the caller's doctor-id set rather than deriving it from the anchor doctor (FR-003)
- [X] T028 [US2] Harden `getBusinessScope` in `lib/auth/scope.ts:76` (`resolveManagerScope`) to exclude clinics whose `doctor_clinics.is_active = 0` (FR-021)
- [X] T029 [US2] Run `npm run db:check` and `npm run db:migrate:status` (T007 applied) and re-run `npm run test`, `npm run lint`, `npm run build` following Scenarios B and C in `specs/001-role-security-fixes/quickstart.md`

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently — receptionist
isolation and the CRITICAL leak are closed.

---

## Phase 5: User Story 3 - Owner and manager panels are fully functional (Priority: P1)

**Goal**: Every link, nav entry and download in `/admin` resolves for the owner or manager role —
no bounce to `/admin`, no 403.

**Independent Test**: As the Business Owner, walk every `/admin` nav entry and every row action on
appointments, consultations and test bookings, plus header notifications and profile — every
destination renders inside `/admin`; downloads return 200.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (T034/T035)**

- [X] T030 [P] [US3] Contract test in `app/admin/__tests__/access.test.ts`: for each path in `ADMIN_ROUTE_PERMISSIONS`, assert `hasAdminModuleAccess` admits an owner and admits a manager holding the module
- [X] T031 [P] [US3] Link-graph test in `lib/auth/__tests__/shell-paths.test.ts`: for every purpose exported by `lib/auth/shell-paths.ts` (T009), assert the admin and doctor results differ and that no result points into a shell the caller cannot enter

### Implementation for User Story 3

- [X] T032 [P] [US3] Replace the hardcoded link in `components/mobile-view/consultations-list.tsx:61` with `consultationDetailPath(shell)` from T009, rendering a disabled affordance when the helper returns null
- [X] T033 [P] [US3] Replace the hardcoded link in `components/doctor/appointment-actions.tsx:87` with `consultationDetailPath(shell)`
- [X] T034 [US3] Build the admin-scoped consultation detail route `app/admin/consultations/[appointmentId]/page.tsx` guarded by `requireAdminTier("/admin/consultations")`, reusing the doctor's consultation form component and the business scope, so T032/T033 resolve to a real page for owners (R2)
- [X] T035 [US3] Point `components/dashboard/header.tsx:101` and `components/dashboard/mobile-app-shell.tsx:76` at `notificationsPath(shell)`, and `components/dashboard/header.tsx:165` plus `components/dashboard/mobile-app-shell.tsx:127` at `profilePath(shell)` — the helper MUST supply an admin-tier destination or an explicit null (H8, H9)
- [X] T036 [US3] Add the missing admin destinations referenced by T035: a notifications page and a profile page reachable from the `/admin` shell (either `/admin/notifications` and `/admin/profile`, or documented no-ops with an explanatory empty state — never a dead link)
- [X] T037 [US3] Widen `app/api/doctor/test-bookings/[id]/report/route.ts:30` to admit `admin` and `manager`, then assert the requested booking belongs to the caller's business scope before serving; keep `resolveWithinStorage` containment and the audit call unchanged (R6, FR-009)
- [X] T038 [US3] Widen `app/api/doctor/consult-pdf/route.ts:12-15` to admit `admin` and `manager` with the same business-scope row check; receptionists MUST resolve to their own anchor doctor id and never the owner's (H11)
- [X] T039 [US3] Restrict the upload action `app/doctor/consult-pdf/actions.ts:23-31` to the doctor tier so a receptionist cannot overwrite the owner's consultation-terms PDF (H11)
- [X] T040 [P] [US3] Replace the dead admin bottom-tab array in `components/dashboard/mobile-app-shell.tsx:224` with the shell's own nav paths (M10)
- [X] T041 [US3] Re-run `npm run test`, `npm run lint`, `npm run build`; walk Scenario D in `quickstart.md` and record the destination count (20 nav entries + row actions) with zero bounces and zero 403s

**Checkpoint**: All three P1 stories now work independently — the owner and manager panels are
fully functional and the PHI leaks are closed.

---

## Phase 6: User Story 4 - Manager capability is delegable as documented (Priority: P2)

**Goal**: The documented "managers can be granted these" is true; every referenced permission
exists; a new manager lands somewhere useful.

**Independent Test**: Create a manager, grant every module in the owner's editor, and open each one;
create a manager with no grants and confirm they see an explanatory state, not the public `/`.

### Tests for User Story 4 ⚠️

- [X] T042 [P] [US4] Test in `app/admin/__tests__/managers.test.ts`: assert `DELEGABLE_MANAGER_MODULES` equals the set of non-owner-only `ADMIN_ROUTE_PERMISSIONS` entries — any drift fails the test
- [X] T043 [P] [US4] Test in `app/admin/__tests__/managers.test.ts`: after `createManager`, assert the new user holds the documented default module set and that a session redirect lands on `/admin`, not `/`

### Implementation for User Story 4

- [X] T044 [US4] Widen `DELEGABLE_MANAGER_MODULES` in `app/admin/managers/actions.ts:21-30` to the full non-owner-only admin module set — adding `home-visit`, `chat`, `shop`, `support`, `consultations`, `online-consultations` (R3, FR-012)
- [X] T045 [P] [US4] Grant the documented default module set on manager creation in `app/admin/managers/actions.ts:149-186`, using the same transactional pattern as `saveManagerPermissions` at `:202` and emitting `audit.settingsUpdated` (M3, FR-014)
- [X] T046 [US4] Update `firstPermittedAdminPath` in `lib/auth/permissions.ts:155-186` so a manager with no grants lands on the admin empty state rather than the public site: the redirect in `lib/auth/guard.ts:104` MUST target an admin-scoped empty route, not `/` (L5)
- [X] T047 [P] [US4] Extend the scope check in `app/doctor/staff/actions.ts:120-124` so a staff-tier user can reset a password only for accounts they own; peer receptionist resets MUST be refused (FR-023)
- [X] T048 [P] [US4] Bound `saveStaffPermissions` in `app/doctor/roles/actions.ts:213-225`: the granted set MUST be a subset of the granting user's own permissions, and the existing self-targeting refusal MUST remain (FR-024)

**Checkpoint**: Manager capability matches the documented model; the catalog-vs-route-map diff is zero.

---

## Phase 7: User Story 5 - Duty status and SOS dispatch are coherent (Priority: P2)

**Goal**: The advertised duty control changes the status the header shows, and emergency dispatch
only reaches doctors who are on duty and only doctors.

**Independent Test**: Toggle duty as a doctor — the pill changes on the next request. Trigger SOS
with a doctor off duty — they are absent from the offer. Call a dispatch action as a receptionist —
refused.

### Tests for User Story 5 ⚠️

- [X] T049 [P] [US5] Test in `lib/dispatch/__tests__/duty.test.ts`: assert the header's duty input and the SOS broadcast read the same column, and that an off-duty doctor is excluded from the offer set
- [X] T050 [P] [US5] Test in `lib/dispatch/__tests__/tier.test.ts`: assert every exported dispatch action refuses a receptionist session

### Implementation for User Story 5

- [X] T051 [US5] Collapse the duty source of truth onto `users.on_duty` (R4): update `dutyModeOf` in `lib/utils.ts` and its single call site `app/doctor/layout.tsx:129` so the header pill (`components/dashboard/header.tsx:190`) reflects a writable column; leave `clinic_on_duty`/`home_visit_on_duty` unwritten
- [X] T052 [P] [US5] Correct the header tooltip text in `components/dashboard/header.tsx:190` so it only promises a control that exists for the viewer's role — the current "set your status with the I'm on duty toggle" MUST NOT appear for roles that cannot set duty (H5)
- [X] T053 [US5] Restrict the SOS admin actions in `lib/dispatch/actions.ts:70-74` to the doctor tier, so a receptionist cannot accept/decline/complete a case by direct request (H12, FR-016)
- [X] T054 [US5] Fix receptionist resolution in `lib/dispatch/geo.ts:12-14` — a receptionist MUST NOT resolve to the owner's doctor id; their identity for dispatch purposes is either their own scope or a rejection
- [X] T055 [US5] Confirm the SOS broadcast in `lib/dispatch/geo.ts:55-65` filters on the same duty column as T051, and drop the reachable-but-dead receptionist duty entry point referenced at `lib/dispatch/actions.ts:588-593` instead of shipping a control that cannot work (L6)

**Checkpoint**: Duty state and SOS dispatch read one source of truth and respect the role boundary.

---

## Phase 8: User Story 6 - Integration endpoint honours tenancy and role (Priority: P2)

**Goal**: The Shule endpoint returns only staff-visible doctors of the caller's own tenant.

**Independent Test**: A patient-tier token → 403. A business-A staff token → only business A's
doctors, with no B addresses or registration numbers.

### Tests for User Story 6 ⚠️

- [X] T056 [P] [US6] Test in `app/api/__tests__/shule-doctors.test.ts`: a patient-tier token receives 403 with no rows; a staff token for business A returns zero doctors from business B; a deactivated token owner receives 403

### Implementation for User Story 6

- [X] T057 [US6] Add a role and scope guard to `app/api/shule/doctors/route.ts:51-62`: after `getUserByApiTokenHeader`, require a staff-tier holder (`admin`, `manager`, or `doctor`) and derive the visible doctor set from that holder's scope — owner via `businesses.owner_id` + `business_clinics`, manager via `clinic_managers`, doctor via `doctor_clinics` (R7, FR-017); note `users` carries no `business_id`, so the scope MUST be derived per role
- [X] T058 [US6] Apply the derived doctor-id set to the route's query in `app/api/shule/doctors/route.ts` — the `inArray` on the resolved ids MUST replace the unscoped `eq(users.role, "doctor") AND eq(users.status, "active")` pair, keeping the `?search=` and `?id=` filters working within that set
- [X] T059 [P] [US6] Align the endpoint's status codes with its docstring in `app/api/shule/doctors/route.ts:20`: deactivated token owners MUST yield 403 rather than collapsing into 401 (FR-018)
- [X] T060 [P] [US6] Keep `Cache-Control: no-store` and the existing rate-limit keying intact; confirm the response never includes `registration_number` for a doctor outside the derived set

**Checkpoint**: The integration endpoint is tenant- and role-scoped.

---

## Phase 9: User Story 7 - Consent link lifetime is enforced consistently (Priority: P3)

**Goal**: An undecided consent older than 7 days stops serving patient and doctor details.

**Independent Test**: Age an undecided consent past 7 days and open its public slug — the expired
state renders with no names.

### Tests for User Story 7 ⚠️

- [X] T061 [P] [US7] Test in `lib/queries/__tests__/consent-ttl.test.ts`: an in-window undecided consent resolves with details; an 8-day undecided consent returns null; a decided consent returns null regardless of age

### Implementation for User Story 7

- [X] T062 [US7] Add `createdAt` to the select and a TTL predicate to `getConsentBySlug` in `lib/queries/consent.ts:21-38` — reuse `CONSENT_TTL_MS` from `lib/files/consent-upload.ts` rather than redefining the window (M5, FR-019)
- [X] T063 [P] [US7] Render the expired state at `app/(marketing)/my-consent/[slug]/page.tsx` so an expired link shows an explanation rather than an empty or broken page

**Checkpoint**: Consent lifetime matches its sibling paths.

---

## Phase 10: User Story 8 - No component hardcodes another shell's URLs (Priority: P3)

**Goal**: The structural fix — cross-shell links come from one helper and a check prevents
regression; the client gate matches the server boundary.

**Independent Test**: Grep `components/**` for hardcoded `/doctor` or `/admin` hrefs — only
doctor-only-by-construction files may hold them; the permission gate test covers `DOCTOR_ONLY_PATHS`.

### Tests for User Story 8 ⚠️

- [X] T064 [P] [US8] Test in `lib/auth/__tests__/panel-redirect.test.ts`: for every path in `DOCTOR_ONLY_PATHS`, assert `resolveDoctorPanelRedirect` bounces a receptionist regardless of module perms, never redirects a doctor, and never lands on a path that would redirect again. (Placement changed from `components/__tests__/` because the rule now lives in one pure function shared by the client gate and the server bounce — a DOM component test could not cover the shared behaviour.)
- [X] T065 [P] [US8] Static check script `scripts/check-shell-links.mjs`: fails when a file under `components/` contains a literal `href` to another shell's prefix except for an explicit allow-list; register it as `npm run check:links` in `package.json`

### Implementation for User Story 8

- [X] T066 [US8] Apply `DOCTOR_ONLY_PATHS` to the client gate in `components/doctor/permission-gate.tsx:20-32` so it uses the same set as the server bounce in `app/doctor/layout.tsx:54` (CG-4, FR-026)
- [X] T067 [P] [US8] Migrate every remaining hardcoded cross-shell link found by T065 to the helper from T009, leaving an allow-list entry only where the file is genuinely doctor-only by construction
- [X] T068 [US8] Add audit and notification to the three unaudited mutations — `saveConsultation` and the status transitions in `app/doctor/actions.ts:201-364`, `:54` and `:365` — matching `app/doctor/billing/actions.ts:148` (CG-5, FR-022)
- [X] T069 [P] [US8] Remove `getCurrentUser()` from the public render paths `app/(marketing)/page.tsx:42` and `app/(marketing)/pricing/page.tsx:19`, moving buyer prefill into a client-side server action so the routes stay statically renderable (FR-025)

**Checkpoint**: All eight user stories are independently functional; recurrence is guarded.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [X] T070 [P] Scope the three unscoped admin queries in `lib/queries/admin.ts:201`, `:505` and `:533` so they filter by the caller's business instead of relying on caller-side post-filtering (M6)
- [X] T071 [P] Update `docs/planning/DASHBOARD_FLOWS.md` §2.3 to describe the admin tier as full CRUD (the code has always imported the write forms) and §1.1 to match the doctor home screen actually shipped (L4)
- [X] T072 [P] Update `docs/planning/DASHBOARD_FEATURES.md` so every feature row matches a page or action, including the `drizzle/0019` doctor-cannot-book boundary that is documented in FLOWS but missing from the status table (SC-010)
- [X] T073 [P] Rewrite the G1–G6 verdict rows in `docs/planning/ROLE_MODEL_PLAN.md` from this implementation: G1 resolved with the manager caveat, G2 resolved, G3 resolved by T044/T045, G4 resolved by T022–T027, G5 resolved, G6 resolved, Phase 6 started by T001 (L4)
- [X] T074 Run the full `quickstart.md` suite (Scenarios A–I) end-to-end and capture output as evidence: `npm run test`, `npm run lint`, `npm run check:permissions`, `npm run check:storage`, `npm run db:check`, `npm run build` (SC-009)
- [X] T075 Prepare the constitution amendment adding `npm run test` and `npm run check:permissions` to the Principle V gate table in `.specify/memory/constitution.md` — this is a MINOR amendment and MUST be proposed as a separate explicit command, never folded into a code change (plan.md Complexity Tracking)
- [X] T076 [P] Record the migration numbering decision (0017 is skipped; new work uses 0020/0021) in `docs/README.md` so the next author continues the sequence (L4)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phases 3–10)**: All depend on Foundational completion
  - US1, US2 and US3 are the P1 critical path and SHOULD land first
  - US4/US5/US6 (P2) then proceed, in parallel if staffed
  - US7/US8 (P3) then proceed
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational only. No dependency on other stories — **MVP**.
- **US2 (P1)**: Foundational only. T027 touches the same `lib/queries/doctor.ts` readers T018 touches,
  so T018 SHOULD land first; US2 does not otherwise depend on US1.
- **US3 (P1)**: Foundational only (T009 supplies the path helper). Independent of US1/US2.
- **US4 (P2)**: Foundational only (T006/T008 create the permission rows it delegates). Independent.
- **US5 (P2)**: Independent. T054 touches `lib/dispatch/geo.ts` resolution that US2's receptionist
  scope also reads — resolve this overlap before merging both.
- **US6 (P2)**: Independent.
- **US7 (P3)**: Independent.
- **US8 (P3)**: Depends on T009 (helper) from Foundational. T066/T067 depend on T032/T033/T035 landing
  first, because they migrate the remaining hardcoded links those tasks identified.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (T012→T014, T020→T022, T030→T032,
  T056→T057, T061→T062)
- Queries/predicates before routes and actions
- Core implementation before integration
- Story complete before moving to the next priority

### Parallel Opportunities

- T002/T003 can run alongside T001
- T005, T007, T008, T009, T010 can all run in parallel (separate files)
- US1 and US3 are fully parallel from the start (different files: `lib/queries/*` vs `app/admin/*`,
  `components/*`)
- US4/US5/US6 can run in parallel with each other once Foundational is complete
- Within US3, T032/T033/T037/T040 are parallelizable (four different files)
- Within US2, T024 and T027 are parallelizable after T022
- T070–T076 in Polish are parallelizable

---

## Parallel Example: User Story 1

```bash
# Launch the US1 tests together, confirm they FAIL, then implement:
Task: "Contract test for home-visit doctor scope in lib/queries/__tests__/doctor-scope.test.ts"
Task: "Integration test for booked-times isolation in lib/queries/__tests__/doctor-scope.test.ts"

# Then, in parallel (separate files):
Task: "Add doctor-scope predicate in lib/queries/doctor.ts:905-918"
Task: "Apply ownership predicate to sibling read paths in lib/queries/doctor.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm run test` green on T012/T013; call the home-visit endpoint as a peer
   doctor and observe 404
5. Deploy/demo — the CRITICAL PHI leak (C1) is closed with the smallest possible change

### Incremental Delivery

1. Setup + Foundational → harness, permission rows, path helper, parity guard
2. Add US1 → PHI leak closed → Deploy
3. Add US2 → receptionist isolation enforced, NULL-clinic writes stop → Deploy
4. Add US3 → owner/manager panels fully functional → Deploy
5. Add US4/US5/US6 → manager capability, duty/SOS coherence, integration tenancy → Deploy
6. Add US7/US8 → consent lifetime and structural link hygiene → Deploy
7. Polish → docs parity, scoped admin queries, constitution amendment

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is complete:
   - Developer A: US1 then US2 (`lib/queries/*`, `app/doctor/*`)
   - Developer B: US3 (`app/admin/*`, `components/*`) — no file overlap with A
   - Developer C: US4 + US6 (`app/admin/managers/*`, `app/api/shule/*`)
   - Developer D: US5 (`lib/dispatch/*`)
3. Stories complete and integrate independently; only T018/T027 (queries) and T054/`geo.ts`
   (dispatch) need merge coordination

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- No new runtime dependency is introduced by any task; `tsx` is already a devDependency
- Avoid vague tasks, same-file conflicts, and cross-story dependencies that break independence
