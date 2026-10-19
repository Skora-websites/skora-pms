# Feature Specification: Role Authorization & Scoping Fixes

**Feature Branch**: `001-role-security-fixes`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Plan the full fixing of the above context" — the full remediation of the
role/feature implementation audit (1 CRITICAL, 13 HIGH, 13 MEDIUM, 6 LOW findings) conducted on
2026-10-19 against the live codebase and database.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Doctor data isolation across all read paths (Priority: P1)

A doctor who is only a member of a shared clinic (not the practice owner) must never be able to read
another doctor's clinical notes, case types, or booked-time availability through any page, server
action, or API route.

**Why this priority**: This is audit finding C1 (CRITICAL). `getHomeVisitPatientDetail` accepts a
`doctorId` and ignores it, so any doctor or receptionist holding the `home-visit` permission reads
any patient's appointment history — including `note` (free-text clinical notes) and `caseType`.
Finding H13 exposes the same class via the booked-times API.

**Independent Test**: As a member doctor, request the home-visit patient-details API for a patient
belonging to a peer doctor; the response must be 404, not that patient's appointment history.

**Acceptance Scenarios**:

1. **Given** doctor B is a member of a shared clinic, **When** doctor B requests
   `/api/doctor/home-visits/patient-details/{id}` for a patient owned by doctor A, **Then** the API
   returns 404 and no appointment rows.
2. **Given** doctor B is a member doctor, **When** doctor B calls the booked-times API with a peer's
   `doctor_id`, **Then** the call is rejected rather than returning the peer's booked slots.
3. **Given** any doctor, **When** the home-visit page lists patient history, **Then** every row
   returned belongs to the acting doctor or to a patient the acting doctor may see.

---

### User Story 2 - Receptionist clinic isolation is real, not decorative (Priority: P1)

A receptionist assigned to clinic B only must not see or act on clinic A's patients, appointments,
bills, or test bookings; and when they try to book at a clinic they are not assigned to, the booking
must be rejected with a visible error instead of silently persisting a clinic-less record.

**Why this priority**: Findings H1/H2/H3. The per-clinic assignment table (`receptionist_clinics`)
exists and migration 0011 is applied, but the read layer never consults it, and the one place that
does (`resolveClinic`) returns `null` which the booking action ignores. The live database already
contains 9 appointments persisted with `clinic_id = NULL` — evidence the silent drop is real.

**Independent Test**: Assign a receptionist to clinic B only; their appointments/patients/billing
lists must contain clinic B rows; a booking attempt at clinic A must return an error message.

**Acceptance Scenarios**:

1. **Given** receptionist R is assigned only to clinic B, **When** R opens any receptionist-panel
   listing (appointments, patients, billing, follow-ups, test bookings, income & expense), **Then**
   only rows belonging to clinic B's doctors are returned.
2. **Given** receptionist R is assigned only to clinic B, **When** R submits a booking for clinic A,
   **Then** the action returns an error and no appointment row is created.
3. **Given** receptionist R has no clinic assignment at all, **When** R books an appointment,
   **Then** the action returns a clear "no clinic assigned" error rather than an empty-data state
   caused by a mis-resolved fallback.
4. **Given** the booking form omits `clinic_id`, **When** the server cannot resolve a clinic the
   caller is entitled to, **Then** the action rejects instead of writing `clinic_id = NULL`.

---

### User Story 3 - Owner and manager panels are fully functional (Priority: P1)

A Business Owner and a Clinic Manager must be able to use every link, nav item, and download in
`/admin` — none may bounce them out of their own panel or return a 403.

**Why this priority**: Findings H6-H10. The `/admin` shell reuses `/doctor` components that hardcode
`/doctor/*` URLs, so the owner is bounced by `requireRole(["doctor","receptionist"])` on
consultations and profile/notifications, and gets 403 on test-report and consult-PDF downloads.

**Independent Test**: As a Business Owner, click every nav item and every row action on
`/admin/appointments`, `/admin/consultations`, `/admin/test-bookings`, `/admin/billing`; every
destination renders a page or returns the file — never a bounce back to `/admin` and never a 403.

**Acceptance Scenarios**:

1. **Given** an owner on `/admin/consultations`, **When** they activate the "View" action on a
   consultation row, **Then** they reach either an admin-scoped consultation detail view or a
   labelled "available to doctors only" state — not a silent redirect to `/admin`.
2. **Given** an owner on `/admin/test-bookings`, **When** they download a test report, **Then** the
   file is served (200), not 403.
3. **Given** an owner or manager in the `/admin` shell, **When** they open notifications or their
   profile from the header, **Then** a page renders in the admin panel.
4. **Given** a manager, **When** the owner grants them a module, **Then** the module's nav entry and
   route both become reachable.

---

### User Story 4 - Manager capability is delegable as documented (Priority: P2)

The documented capability "managers can be granted these" must be true: owner-parity modules must be
delegable, their permission names must exist, and a newly created manager must land somewhere useful.

**Why this priority**: Findings M1/M2/M3/L5. `DELEGABLE_MANAGER_MODULES` omits six modules that
`lib/auth/permissions.ts` comments say managers can be granted; two of those routes
(`/admin/consultations`, `/admin/online-consultations`) gate on permission names that do not exist
in the live catalog (68 permissions, both absent), so they are un-grantable forever; a new manager
has zero modules and is dumped on the public marketing home page.

**Independent Test**: Create a manager, grant them each owner-parity module, and confirm the module
opens; confirm a fresh manager with no grants sees an explanatory state instead of `/`.

**Acceptance Scenarios**:

1. **Given** the owner opens the manager permission editor, **When** they expand the delegable set,
   **Then** home-visit, chat, shop, support, consultations and online-consultations are offered.
2. **Given** any manager module gate references a permission, **When** the seeded catalog is
   inspected, **Then** every referenced permission name exists as a row.
3. **Given** a manager with no module grants, **When** they sign in, **Then** they see an
   explanatory empty state, not the public `/` marketing page.

---

### User Story 5 - Duty status and SOS dispatch are coherent (Priority: P2)

The Online/Offline pill shown in the dashboard header must reflect a status the user can actually
change, and emergency dispatch must only reach doctors who are on duty.

**Why this priority**: Findings H5/H12/L6. The pill reads `clinicOnDuty`/`homeVisitOnDuty`, columns
nothing can write, while tooltip text advertises a toggle that does not exist; a separate `onDuty`
column is written elsewhere and drives SOS. Separately, SOS admin actions admit receptionists and
resolve to the owner's doctor id, letting a front-desk account accept the owner's emergency case.

**Independent Test**: As a doctor, toggle duty from the header; the pill must change within one
request. As a receptionist, the emergency dispatch panel must be unreachable.

**Acceptance Scenarios**:

1. **Given** a doctor with both duty flags off, **When** they act on the advertised duty control,
   **Then** the header pill changes to Online without a page reload loop.
2. **Given** a doctor is off duty, **When** a patient triggers SOS, **Then** that doctor is not in
   the offer broadcast.
3. **Given** a receptionist, **When** they attempt an SOS dispatch action (accept/decline/complete)
   by direct request, **Then** the action is refused.

---

### User Story 6 - Integration endpoint honours tenancy and role (Priority: P2)

The Shule integration endpoint must only return doctors, must not expose practitioners across
tenants, and must refuse tokens issued to non-staff accounts.

**Why this priority**: Finding H4 (HIGH). `/api/shule/doctors` authenticates a bearer token, never
reads `user.role`, and queries `role='doctor' AND status='active'` with no tenant filter —
returning email, phone and professional registration number for up to 200 doctors across all
businesses. Tokens are per-user (`personal_access_tokens`), so a patient-tier token qualifies.

**Independent Test**: Present a token issued to a patient-tier account; the response must be 403.
Present a staff token; the response must contain only that tenant's doctors.

**Acceptance Scenarios**:

1. **Given** a token whose user is not a staff-tier account, **When** `/api/shule/doctors` is called,
   **Then** the response is 403 and no doctor rows.
2. **Given** a staff token scoped to one business, **When** the endpoint is called without `search`
   or `id`, **Then** only active doctors of that business are returned.
3. **Given** the documented 403-for-deactivated behaviour, **When** the token's owner is
   deactivated, **Then** the endpoint returns 403 (matching its documented contract).

---

### User Story 7 - Consent link lifetime is enforced consistently (Priority: P3)

An undecided consent link older than the 7-day retention window must stop serving patient and doctor
details, matching the behaviour of its sibling paths.

**Why this priority**: Finding M5. `getConsentBySlug` selects no `createdAt` and applies no TTL,
while both the consent action and the consent-file route enforce `CONSENT_TTL_MS = 7 days`.

**Independent Test**: Create a consent, age its `created_at` beyond 7 days, then open its public
slug page: it must show an expired state.

**Acceptance Scenarios**:

1. **Given** an undecided consent older than `CONSENT_TTL_MS`, **When** its slug page is opened,
   **Then** no patient name, doctor name, or appointment details are rendered.
2. **Given** an undecided consent inside the window, **When** its slug page is opened, **Then**
   behaviour is unchanged from today.

---

### User Story 8 - No component hardcodes another shell's URLs (Priority: P3)

Every cross-shell link must be produced by a role-aware helper so a future shared component cannot
reintroduce a bounce, mirroring the existing `doctorPathToReceptionist` precedent.

**Why this priority**: Findings H6/H7/H8/H9/H10/M10 all share one root cause — shared components
hardcode `/doctor/*`. Fixing each link individually leaves the structural defect in place.

**Independent Test**: Grep shared `components/**` for hardcoded `/doctor` hrefs: only files that are
doctor-only by construction may hold them.

**Acceptance Scenarios**:

1. **Given** a component rendered in both `/admin` and `/doctor`, **When** it builds an internal
   link, **Then** it uses a role/shell-aware helper, not a literal `/doctor` or `/admin` path.
2. **Given** the permission-gate client component, **When** it decides visibility, **Then** it
   applies the same `DOCTOR_ONLY_PATHS` set the server bounce applies.

---

### Edge Cases

- A receptionist whose clinic assignment is *removed* while they hold a session: next request must
  not resurrect practice-wide access from a cached scope.
- A manager whose clinics include a deactivated clinic (`doctor_clinics.is_active = false`) — the
  scope must exclude it (M4).
- Existing appointments already persisted with `clinic_id = NULL` (9 rows live): the fix must not
  retroactively break their display or edits.
- A doctor added to a second clinic mid-session: scope recalculation must be per-request (React
  `cache`), never memoised per process.
- Consultation PDFs and test reports for a *doctor-owned* record when requested by an owner: must
  serve the file for the owner's own business only.
- `/api/shule/doctors` with `?id=` for a doctor outside the caller's tenant.

## Requirements *(mandatory)*

### Functional Requirements

**Data isolation**

- **FR-001**: System MUST scope every home-visit patient-detail query by the acting doctor, and MUST
  reject requests for patients outside that scope with 404.
- **FR-002**: System MUST NOT expose a peer doctor's booked-time availability to a member doctor.
- **FR-013**: Every consultation, appointment, and patient detail read path MUST apply the same
  ownership predicate the corresponding write path enforces.

**Receptionist scoping**

- **FR-003**: Receptionist read paths MUST resolve the caller's clinic set from
  `receptionist_clinics` (active rows only) and MUST NOT fall back to the whole practice when
  assignments exist.
- **FR-004**: Receptionist booking at a clinic outside their assignment MUST return a user-facing
  error and MUST NOT create or mutate an appointment row.
- **FR-005**: Booking MUST NOT persist an appointment when clinic resolution fails; `clinic_id` MUST
  be non-null or the request rejected.
- **FR-006**: A receptionist with zero assignments MUST receive an explicit "no clinic assigned"
  error rather than an empty-result state caused by a broken fallback.
- **FR-007**: The legacy practice-wide fallback, if retained, MUST be documented, time-boxed, and
  MUST NOT silently widen a receptionist's scope.

**Admin shell integrity**

- **FR-008**: Every link, nav entry and row action rendered in `/admin` MUST resolve to a target the
  owner or manager role is authorised to access under the guards that protect that target.
- **FR-009**: Every file-download link rendered in `/admin` (test reports, consultation PDFs,
  consent files) MUST be served to the admin tier for their own business's records.
- **FR-010**: The header's notifications and profile entry points MUST resolve to a page within the
  caller's own panel for admin, manager, doctor and receptionist roles.

**Manager capability**

- **FR-011**: Every permission name referenced by an admin-tier route gate MUST exist as a row in
  the permission catalog.
- **FR-012**: The owner's manager permission editor MUST offer the full set of non-owner-only admin
  modules, including home-visit, chat, shop, support, consultations and online-consultations.
- **FR-014**: A newly created manager account MUST start with the documented default module set, or
  MUST land on an explanatory empty state — never the public marketing home page.

**Duty & SOS**

- **FR-015**: The dashboard duty control MUST write the columns the header status pill reads, and
  the pill MUST reflect a writable state.
- **FR-016**: Emergency dispatch actions MUST be restricted to the doctor tier; SOS offer broadcast
  MUST only include doctors whose duty state is on.

**API & integrations**

- **FR-017**: `/api/shule/doctors` MUST reject tokens whose user is not a staff-tier account and
  MUST limit results to the caller's own business.
- **FR-018**: The endpoint's documented status codes MUST match its implementation for deactivated
  accounts.

**Consent**

- **FR-019**: `getConsentBySlug` MUST apply the same retention window (`CONSENT_TTL_MS`) as its
  sibling consent paths.

**Structural**

- **FR-020**: Components rendered in more than one shell MUST derive internal links through a
  role-aware helper; no component may hardcode another shell's URL prefix.
- **FR-026**: The client-side permission gate MUST apply the same doctor-only path set as the
  server bounce.
- **FR-021**: Manager scope resolution MUST exclude inactive clinics (`doctor_clinics.is_active`).
- **FR-022**: `saveConsultation`, `updateAppointmentStatus` and `updateFollowUpStatus` MUST emit an
  audit entry (`consultation_saved`, `appointment_updated`, `follow_up_status_changed`). These three
  are exempt from the notification half of the audit-and-notify rule: none has a single obvious
  recipient, and the owner sees all of them on `/admin/overview` and `/admin/follow-ups` already.
  Actions that DO have a named recipient (booking, consent, SOS, support reply) MUST still send both.
- **FR-023**: A staff-tier user MUST NOT be able to reset a peer receptionist's password; only the
  owner tier may reset accounts it owns.
- **FR-024**: `saveStaffPermissions` MUST NOT grant a peer a permission the granting user does not
  themselves hold, and MUST retain the existing self-targeting refusal.
- **FR-025**: Public marketing pages MUST NOT depend on a session (no `getCurrentUser()` in their
  render path), so they remain statically renderable.

**Data repair**

- **FR-027**: The 9 existing appointments with `clinic_id = NULL` MUST be either re-attributed to
  the correct clinic or explicitly flagged; their display MUST NOT regress.

### Key Entities *(include if feature involves data)*

- **Appointment**: gains an invariant — `clinic_id` is non-null for rows created after this change;
  the 9 legacy null rows are marked for repair. State transitions: pending → confirmed → completed
  / cancelled, each audit-logged.
- **Receptionist clinic assignment** (`receptionist_clinics`): becomes the authoritative read-scope
  for the receptionist tier; one row per (receptionist, clinic) with `is_active`.
- **Permission**: two new catalog rows required for router gates; names must match the route map.
- **Manager module grant** (`model_has_permissions`): the delegable set widens to the full
  non-owner-only admin module list.
- **Duty state** (`users.on_duty`, `users.clinic_on_duty`, `users.home_visit_on_duty`): must
  collapse to one written source of truth feeding both the header pill and SOS.
- **Business scope**: must exclude inactive clinics for the manager tier.
- **Consent** (`appointment_consult_consents`): gains the same `created_at` TTL predicate its
  siblings already enforce.
- **Personal access token** (`personal_access_tokens`): must carry an ability/scope that the
  integration endpoint checks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member doctor requesting a peer's patient home-visit detail receives 404, verified by
  direct API call in the seeded fixture — 0 rows leaked.
- **SC-002**: A receptionist assigned to clinic B returns 0 clinic-A rows across all six listing
  queries, verified by query-level assertions against the seeded database.
- **SC-003**: 0 new appointments are created with a null `clinic_id` after the change; the attempted
  booking returns a visible error string.
- **SC-004**: Every nav entry and row action in `/admin` resolves without a bounce or a 403 —
  100% of destinations render (counted: 20 nav entries + row actions per module).
- **SC-005**: Every permission name referenced by an admin route gate exists in the catalog:
  catalog-vs-route-map diff = 0 missing.
- **SC-006**: A staff token for business A returns 0 doctors from business B; a patient-tier token
  returns 403.
- **SC-007**: A doctor toggling duty sees the header pill change state on the next request; an
  off-duty doctor is absent from the SOS offer broadcast.
- **SC-008**: An undecided consent older than 7 days renders no patient or doctor identifiers.
- **SC-009**: `npm run lint` (exit 0, no new warnings), `npm run check:storage` and `npm run db:check`
  all pass, and a new automated regression suite covering SC-001..SC-008 passes — the suite is the
  permanent replacement for the currently-absent test harness.
- **SC-010**: The documentation set (`DASHBOARD_FEATURES.md`, `DASHBOARD_FLOWS.md`,
  `ROLE_MODEL_PLAN.md`) is updated so its claims match the code, with no remaining stale gate rows.

## Assumptions

- The existing authorization primitives (`requireRole`, `requireAdminTier`, `requireWriteScope`,
  `requireDoctorPermission`, `getBusinessScope`) are correct and retained; the defects are in
  *callers* and *query layers*, so the fix is to enforce, not to redesign.
- The live seeded database (clinics 1 and 2, one real receptionist, two managers) is representative
  enough to verify scoping; the latent cross-clinic leak must be proven by seeding a third clinic,
  not by waiting for production data.
- The constitution ratified this session (v1.0.0) is authoritative; no principle is amended by this
  feature.
- `/api/shule/doctors` is a single-partner integration endpoint; restricting it by role and tenant
  preserves its purpose while closing the leak.
- A test harness does not exist today; adding one is part of this feature (see SC-009) and is the
  only way SC-001..SC-008 become permanent rather than manual.
- The duty feature's single source of truth will be decided in research.md; whichever column wins,
  the other is migrated rather than left as dead schema.
