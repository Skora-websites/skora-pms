# Doctor Dashboard Verification Report

**Codebase:** `skoracare_old` (Next.js 16 App Router, Drizzle ORM, server components + server actions)
**Scope:** All routes under `app/doctor/**` — layout, pages, server actions, queries, guards, loading/error states
**Reviewer:** Frontend/fullstack code review (read-only)
**Validation:** `npx tsc --noEmit` — **PASS** (no type errors in the doctor dashboard tree)

---

## 1. Route Inventory (all verified to exist and render)

| Route | File | Status |
|---|---|---|
| `/doctor` (dashboard) | `app/doctor/page.tsx` | PASS |
| `/doctor/appointments` | `app/doctor/appointments/page.tsx` | PASS (see F-07) |
| `/doctor/appointments/book` | `app/doctor/appointments/book/page.tsx` | PASS |
| `/doctor/appointments/[id]/edit` | `app/doctor/appointments/[id]/edit/page.tsx` | PASS |
| `/doctor/patients` | `app/doctor/patients/page.tsx` | PASS |
| `/doctor/patients/new` | `app/doctor/patients/new/page.tsx` | PASS |
| `/doctor/patients/[id]` | `app/doctor/patients/[id]/page.tsx` | PASS |
| `/doctor/patients/[id]/edit` | `app/doctor/patients/[id]/edit/page.tsx` | PASS (not re-read in full; pattern matches sibling edit page) |
| `/doctor/consultations` | `app/doctor/consultations/page.tsx` | PASS (see F-08) |
| `/doctor/consultations/[appointmentId]` | `app/doctor/consultations/[appointmentId]/page.tsx` | PASS |
| `/doctor/follow-ups` | `app/doctor/follow-ups/page.tsx` | PASS (see F-03) |
| `/doctor/billing` | `app/doctor/billing/page.tsx` | PASS (see F-03) |
| `/doctor/income-expense` | `app/doctor/income-expense/page.tsx` | PASS (see F-03) |
| `/doctor/test-bookings` | `app/doctor/test-bookings/page.tsx` | PASS (see F-03) |
| `/doctor/home-visits` | `app/doctor/home-visits/page.tsx` | PASS (see F-03, F-11) |
| `/doctor/chat` | `app/doctor/chat/page.tsx` | PASS |
| `/doctor/shop` | `app/doctor/shop/page.tsx` | PASS |
| `/doctor/online-consultations` | `app/doctor/online-consultations/page.tsx` | PASS w/ issues (F-03, F-09) |
| `/doctor/emergency` | `app/doctor/emergency/page.tsx` | PASS |
| `/doctor/schedule` | `app/doctor/schedule/page.tsx` | PASS w/ perf issue (F-05) |
| `/doctor/staff` | `app/doctor/staff/page.tsx` | PASS w/ perf issue (F-06) |
| `/doctor/roles` | `app/doctor/roles/page.tsx` | PASS w/ perf issue (F-06) |
| `/doctor/support` | `app/doctor/support/page.tsx` | PASS |
| `/doctor/notifications` | `app/doctor/notifications/page.tsx` | PASS |
| `/doctor/faq` | `app/doctor/faq/page.tsx` | PASS |
| `/doctor/consult-pdf` | `app/doctor/consult-pdf/page.tsx` | PASS |
| `/doctor/profile` | `app/doctor/profile/page.tsx` | PASS |
| `/doctor/settings` | `app/doctor/settings/page.tsx` | PASS |

---

## 2. Layout, Auth & Guards

**PASS — `app/doctor/layout.tsx`.** Well-layered defense:

- `requireRole(["doctor", "receptionist", "admin"])` redirects unauthenticated users to `/login` and wrong roles to their home (`lib/auth/guard.ts`).
- Trial-expiry lockout for doctors (`trialEndsAt <= now` → `/trial-expired`).
- Server-side module-permission gate: `hasDoctorModuleAccess(perms, pathname)` redirects before any page data fetch — a restricted URL never executes its queries (`lib/auth/permissions.ts` is a documented single source of truth shared by nav, server guards, and client gate).
- Dual URL-space handling (`/doctor/*` vs `/receptionist/*` via proxy rewrite) with cross-prefix bounce guards and a redirect-loop guard when the fallback equals the current path.
- Sidebar nav is filtered by the same permission set, keeping nav and enforcement in sync.
- `DoctorPermissionGate` (`components/doctor/permission-gate.tsx`) mirrors the server check client-side and correctly translates `/receptionist/*` pathnames before permission matching.

**PASS — Server actions.** Every action file is `"use server"` and guards with `requireDoctorPermission(...)` (`lib/auth/server-permissions.ts`) plus ownership helpers (`ensurePatientOfDoctor`, `ensureAppointmentOfDoctor`, `ensureTicketOwner`, etc. in `lib/auth/ownership.ts`). Mutations write audit entries (`lib/security/audit-log.ts`) and call `revalidatePath` for every affected route (e.g. test-booking actions revalidate test-bookings, billing, and income-expense together). Notifications actions are ownership-scoped (`eq(notifications.userId, doctorId)` on both read and update) and permission-checked.

**PASS — Data leakage.** `getCurrentUser` (`lib/auth/user.ts`) selects an explicit safe column list (no password hash) and is `cache()`-wrapped per request. The full object passed to the client `SettingsTabs` contains only profile fields.

**PASS — 404 handling.** Dynamic pages (`appointments/[id]/edit`, `patients/[id]`, `consultations/[appointmentId]`) validate the ID and call `notFound()` when the record is missing or foreign. Root `app/not-found.tsx` and `app/error.tsx` exist.

---

## 3. Findings

### F-01 · GAP · HIGH — No `loading.tsx` anywhere in the dashboard tree
`app/doctor/**` contains **zero** `loading.tsx` files (verified via recursive search; the only error boundary in the whole app is `app/error.tsx`). Every navigation between dashboard pages blocks on full server render with no skeleton or spinner. This is most painful on:
- `/doctor/schedule` (see F-05 — sequential N+1 queries),
- `/doctor` (4 parallel queries + heavy markup),
- `/doctor/appointments`, `/doctor/billing`, `/doctor/test-bookings` (multi-query pages).

**Recommendation:** Add `app/doctor/loading.tsx` with a bento-grid skeleton matching the dashboard card layout; add targeted `loading.tsx` for slow sub-trees if needed.

### F-02 · GAP · MEDIUM — No route-level `error.tsx` under `app/doctor`
Only the root `app/error.tsx` exists, and it renders a full-page "500" **outside** the dashboard shell (no sidebar/header; raw marketing-style page with blue buttons that don't match the design system). A single failed query (e.g. a DB hiccup on the dashboard's `Promise.all`) ejects the doctor from the app chrome entirely. No `global-error.tsx` exists either.
**Recommendation:** Add `app/doctor/error.tsx` that renders an in-shell error card with `reset()`; keep the root boundary as last resort.

### F-03 · ISSUE · MEDIUM — Inconsistent practice-awareness for receptionists/admins
`/doctor/appointments` and `/doctor` (today/recent lists) are practice-aware: receptionists get `getPracticeAppointments(practiceIds, …)` / `getPracticeTodaysAppointments` across `getPracticeDoctorIds()` (`lib/queries/clinic.ts:29`, `lib/queries/doctor.ts:94-140`). But the following pages resolve `doctorId` to the owner only and query a single doctor's data with no `getPractice*` variant:

- `/doctor/consultations` (`getConsultations`, `lib/queries/doctor.ts:469`)
- `/doctor/follow-ups` (`getFollowUps`, line 450)
- `/doctor/home-visits` (`getHomeVisits`, line 660)
- `/doctor/online-consultations` (`getOnlineConsultations`, line 152)
- `/doctor/billing` (`getBillingOverview`, line 278)
- `/doctor/income-expense` (`getTransactions`, line 364)
- `/doctor/test-bookings` (`getTestBookings`, line 491)

In a multi-doctor practice, a receptionist (whose `doctorId` resolves to the practice owner via `user.doctorId ?? user.id`) will **not see other practice doctors'** consultations, follow-ups, home visits, online visits, bills, ledger entries, or lab bookings, even though they see all appointments. Single-doctor practices are unaffected.
**Recommendation:** Add `getPractice*` variants (or an `doctorIds: number[]` parameter with `inArray`) for these queries, mirroring `getPracticeAppointments`.
### F-04 · ISSUE · MEDIUM — Unbounded list queries, no pagination or SQL limits
Every dashboard list query returns the **entire result set** with no `limit()`/offset and no pagination UI:
- `getAppointments` / `getPracticeAppointments` (`lib/queries/doctor.ts:103-131`) — `/doctor/appointments` renders all rows into the desktop table and mobile card list.
- `getConsultations` (`:469`), `getTransactions` (`:364`), `getTestBookings` (`:491`), `getBillingOverview` (`:278`), `getHomeVisits` (`:660`), `getOnlineConsultations` (`:152`) — same pattern on their respective pages.

Payload size and render cost grow linearly with practice history (years of appointments/consultations in one table). Related: `getSupportTickets` (`lib/queries/doctor.ts:542-568`) issues one messages query **per ticket** (`Promise.all` over tickets) — an N+1 that grows with ticket count.
**Recommendation:** Add cursor/offset pagination (server-side `limit` + `?page=` searchParams) to appointments, consultations, transactions, and test-bookings first; batch the support-ticket messages with a single `inArray(supportTicketMessages.supportTicketId, ids)` query.

### F-05 · ISSUE · HIGH — `/doctor/schedule` sequential N+1 query waterfall
`app/doctor/schedule/page.tsx:24-42` runs a **sequential per-clinic loop** with awaits inside:
1. `getClinicsWithSchedules(doctorId)` and `getClinicsOfDoctor(doctorId)` are awaited back-to-back (independent — could be `Promise.all`).
2. For **each** clinic, `for (const id of clinicIds) { ... }` (line 31) sequentially awaits `getClinicDoctors(id)` and `ensureClinicOwner(id, doctorId)`.
3. Within each clinic, a `Promise.all` over members still issues one `getClinicSchedulesOfDoctor(clinicId, memberId)` query **per member** (lines 34-39).

For a practice with C clinics and M members each, that's `2 + C·(2 + M)` round trips, fully serialized across clinics. A doctor with 5 clinics × 3 members waits on ~22 sequential queries on every page load (with no `loading.tsx` per F-01, the whole navigation just hangs).
**Recommendation:** Fetch all clinics+members+owner flags in ≤3 set-based queries (join `doctorClinics` → `clinicDoctors` → `doctorSchedules` with `inArray(clinicIds, ...)`), or at minimum `Promise.all` across clinics instead of the sequential loop.

### F-06 · ISSUE · MEDIUM — `/doctor/staff` and `/doctor/roles` scan global tables with no scoping
- **Staff** (`app/doctor/staff/page.tsx:39-42`): the `modelHasRoles` query filters only on `modelType = "App\\Models\\User"` — **no `inArray(roleId, practiceRoleIds)`**. It loads the role-assignment row of **every user in the entire application** (all practices' patients, doctors, staff) and filters to practice roles in JS afterward.
- **Roles** (`app/doctor/roles/page.tsx:41-44`): the `rolePermRows` query is a `roleHasPermissions ⟕ permissions` join with **no `WHERE` clause at all** — it loads every role-permission mapping for every practice in the database, then keeps only the current practice's roles in JS.

Both are unbounded full-table reads that degrade as the platform grows, and they pull other tenants' row counts into the query payload.
**Recommendation:** Scope the staff query with `inArray(modelHasRoles.roleId, practiceRoles.map(r => r.id))` and the roles query with `inArray(roleHasPermissions.roleId, rows.map(r => r.id))` (or `where roles.doctorId = doctorId` via a join).

### F-07 · ISSUE · MEDIUM — `admin` role handled inconsistently in `doctorId` resolution
`app/doctor/appointments/page.tsx`:
- Line 21 (shared by **every** doctor page): `const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;`
- Line 26: `const isReceptionist = user.role === "receptionist" || user.role === "admin";`

An `admin` (allowed through `requireRole(["doctor", "receptionist", "admin"])` in the layout) is treated as practice-wide for the query branch, but `doctorId` resolves to **the admin's own user id** — not `user.doctorId ?? user.id` like receptionists. `getPracticeDoctorIds(adminUserId)` then fans out from an id that likely owns no practice, so admins can get empty/partial data on `/doctor/appointments` — and since the same resolution line is copy-pasted across all doctor pages, the same mismatch applies everywhere else (they just don't take the practice branch, so an admin sees only rows keyed to their own id, i.e. typically none).
**Recommendation:** Use one shared helper (e.g. `resolvePracticeDoctorId(user)`) that maps both `receptionist` **and** `admin` through `user.doctorId ?? user.id`, and use it everywhere instead of the inline ternary.

### F-08 · ISSUE · LOW — `/doctor/consultations` renders a dead "View" link when a consultation has no appointment
`app/doctor/consultations/page.tsx:80`: `href={`/doctor/consultations/${c.appointmentId ?? "0"}`}` — when `appointmentId` is null the row links to `/doctor/consultations/0`, which hits the `[appointmentId]` route, fails validation, and renders a 404 inside the shell. The button is always rendered, so affected rows show a clickable "View" that can only lead to "not found".
**Recommendation:** Conditionally render the "View" button only when `c.appointmentId` is set (keep the PDF button as the fallback action).

### F-09 · ISSUE · LOW — `/doctor/online-consultations` has no status filter and an unconditional "Start consultation" CTA
`app/doctor/online-consultations/page.tsx`:
- The table lists **all** statuses mixed together (no `TabPills`/status filter like `/doctor/appointments` has), so cancelled/completed visits clutter the queue.
- The "Start consultation" button (lines 60-68) is rendered for **every** row regardless of status — including cancelled and completed appointments. The empty-state copy says "for you to start the consultation", but nothing distinguishes actionable rows.
- No date filter or pagination either (see F-04).

**Recommendation:** Add status tabs (reuse the `TabPills` pattern from the appointments page) and render "Start consultation" only for `pending`/`confirmed` rows.

### F-10 · ISSUE · LOW — Dashboard "recent appointments" fetches all rows, slices to 5 in JS
`lib/queries/doctor.ts:133-140` — `getRecentAppointments(doctorId, limit = 5)` accepts a `limit` parameter but never applies it to the SQL; it selects **every** appointment for the doctor (full `appointmentRows` payload), sorts, then `rows.slice(0, limit)` in application code. Same shape in `getPracticeRecentAppointments` (`:143-150`). On the `/doctor` dashboard this runs on every load, transferring the practice's whole appointment history to render 5 cards. Currently masked by `cache()` per request and small datasets — a footgun as data grows.
**Recommendation:** Push the limit into SQL (`.orderBy(desc(createdAt), desc(id)).limit(limit)`).

### F-11 · ISSUE · LOW — `/doctor/home-visits` minor polish: unconditional CTA + coarse map pin
`app/doctor/home-visits/page.tsx`:
- The "Consult" button (lines 108-114) is rendered for every visit regardless of `v.status`, mirroring F-09 — cancelled/completed home visits still show a primary-ish consult action.
- The map link (line 90, `mapsUrl`) uses only `city`/`state` — it drops street/pincode even though the patient record has `streetAddress`/`pincode`, so "View on map" often lands on a city-level search rather than the patient's area.
- Subtitle claims "for your practice" while the query is single-doctor (F-03).

**Recommendation:** Gate "Consult" on actionable statuses and include `streetAddress`/`pincode` in the geocoding query string.

---

## 4. Navigation check

**PASS with one nit.** `app/doctor/layout.tsx:58-76` (`NAV_BY_PERM`) was cross-checked against the route inventory:

- Every nav `href` resolves to a page that exists and is permission-gated server-side by the same permission key — nav and enforcement are in sync (same `hasDoctorModuleAccess` source of truth).
- Pages intentionally **absent from the nav** (book/edit/detail flows, `/doctor/chat`, `/doctor/consult-pdf`, profile/settings/notifications/faq) are reachable via page CTAs and header affordances — correct for detail/child routes.
- **Nit (ties to F-09):** "Online Consultations" and "Emergency" are gated under the coarse `perm: "dashboard"` key (`layout.tsx:71-72`) rather than dedicated module permissions — a doctor who loses dashboard access unexpectedly loses these two nav entries, and they can't be permission-tuned independently of the dashboard itself.

---

## 5. Summary

| Severity | Count | Findings |
|---|---|---|
| Critical | 0 | — |
| High | 2 | F-01 (no `loading.tsx` — GAP), F-05 (schedule sequential N+1) |
| Medium | 5 | F-02 (no route `error.tsx` — GAP), F-03 (practice-awareness gaps for receptionists), F-04 (unbounded list queries / no pagination), F-06 (staff/roles global-table scans), F-07 (admin `doctorId` resolution mismatch) |
| Low | 4 | F-08 (dead "View" link), F-09 (online-consultations UX), F-10 (dashboard fetch-all-then-slice), F-11 (home-visits polish) |

**Bottom line:** The doctor dashboard is well-built where it matters most — a genuinely layered auth/permission model (role guard → trial lockout → module gate → per-action `requireDoctorPermission` + ownership helpers), owner-scoped mutations with audit logging and correct `revalidatePath` fan-out, safe user field selection, and clean 404 handling on dynamic routes. Type-check passes. The gaps are operational, not security: no streaming/loading UX (F-01/F-02), query-layer scalability (F-04/F-05/F-06/F-10), and multi-doctor correctness for receptionist/admin users (F-03/F-07). Fix order recommendation: F-07/F-03 (correctness for staff users) → F-01/F-02 (UX resilience) → F-05/F-06/F-04/F-10 (performance) → F-08/F-09/F-11 (polish).
