# Business Flow & Business Logic Validation Report — SkoraCares

**Date:** 2026-08-24 (2 passes)
**Scope:** All 3 dashboards (Doctor/Receptionist, Patient, Super Admin) + vendor upload flow
**Method:** Real-business-user evaluation (43.1–43.27). Code inspection + live DB verification + in-browser E2E of the full business chain.

---

## 0. Second-pass additions (2026-08-24, later)

Second pass added 4 more findings, all verified live:

| # | Severity | Issue | Fix | Regression |
|---|---|---|---|---|
| B10 | MEDIUM | `deleteVendor` hard-deletes; FK cascades to ALL its test bookings (completed reports destroyed) while auto-bills remain | Guard: refuse deletion when bookings exist ("edit its details instead"); UI surfaces the error | ✅ typecheck + code path |
| B11 | HIGH | Bill numbers `INV-<last 6 digits of ms timestamp>` repeat every ~16.7 min; DB column is globally unique → random duplicate-key failures on bill creation (3 call sites) | New `generateBillNumber()` (`INV-<full ms>-<random 3-digit>`) in `lib/utils.ts`; used by all 3 creators | ✅ typecheck |
| B12 | MEDIUM | Permission system is **nav-only** — `requireRoleWithPermission` exists but is never used; any doctor/receptionist with dashboard access can reach every module by URL (billing, income-expense, staff…). Roles & Permission UI suggests restrictions the server doesn't enforce | **FIXED**: server-action guards (`requireDoctorPermission`) in 9 action files; client `DoctorPermissionGate` redirects restricted URLs; server-side layout redirect (307) via `x-pathname` header prevents data queries on restricted pages. Pure-route map in `lib/auth/permissions.ts` (client-safe); server-only guard in `lib/auth/server-permissions.ts` | ✅ typecheck + lint + E2E (full-perm doctor, limited-perm staff) |
| B13 | HIGH | `saveConsultation` never checked appointment status → a cancelled or `pending_consent` appointment could be "completed" via consultation (bypassing consent, re-opening cancelled visits) | Guard: reject `cancelled` ("Cancelled appointments cannot be consulted") and `pending_consent` ("Patient consent is required…") | ✅ E2E: form shows consent error, appointment stays `pending_consent`, no consultation row created |

Also noted: billing page has no filter/search (usability); staff hard-delete cascades attendance history (minor).

---

## 0b. Third-pass additions (2026-08-24, later)

| # | Severity | Issue | Fix | Regression |
|---|---|---|---|---|
| W7 | MEDIUM | Follow-up "Mark completed" button was **silently broken**: UI sent `"completed"` but the server whitelist (`pending/addressed/no_follow_up/rescheduled/cancelled`) rejected it — no-op | Button now sends `"addressed"` (legacy parity + existing DB values); added `FOLLOW_UP_TRANSITIONS` state machine (pending→terminal absorbing states; rescheduled→pending); `addressed`/`no_follow_up`/`rescheduled` badge styling | ✅ typecheck + live E2E (3→2 pending; DB addressed 3→4) |

---

## 1. Business Process Map (43.1)

**Who → does what → to which entity → at what stage → under what conditions → what happens next → who sees the result.**

| Actor | Action | Entity | Next stage | Downstream |
|---|---|---|---|---|
| Patient | Self-service booking (confirmed, consent skipped) | Appointment | Doctor dashboard "Recent appointments" + in-app + email | Consultation |
| Doctor/Receptionist | Books appointment (walk-in/registered) | Appointment | Status derived from consent type; consent link if `consent`/`email` | Patient confirms consent |
| Patient | Accepts consent via `/my-consent/<slug>` | Consent | Appointment confirmed | Doctor dashboard |
| Doctor | Saves consultation | Consultation | Appointment → completed; medications stored | Patient prescriptions/records |
| Doctor | Creates bill | Billing | Auto income transaction (non-credit) | Income & Expense |
| Doctor | Marks credit bill collected | Billing → Transaction | Income recognized only on collection | Income & Expense |
| Doctor | Books lab test | Test Booking | Auto bill "Medical Test" + income transaction | Vendor upload link |
| Vendor | Uploads report via token | Test Booking | Status → completed; report visible to doctor + patient | Patient test-reports |
| Doctor | Follow-up due | Consultation | Follow-up status workflow | Follow-ups page |
| Super Admin | Deactivate doctor/patient/staff | User | Login blocked | All dashboards |

### Entity lifecycles (43.3)

- **Appointment:** `pending → pending_consent → confirmed → completed` / `cancelled` (terminal). Enforced state machine in `updateAppointmentStatus`, `cancelAppointment`, `completeAppointment`. Completed/cancelled are immutable (`updateAppointment` rejects edits). ✅
- **Test booking:** `pending → in-progress → completed` / `cancelled`. **Was unrestricted — state machine added in this audit.** ✅ (fixed)
- **Billing:** `pending (credit) → paid` via `collectCreditPayment`; `paid/partial/pending` derived in `updateBill`. Soft-delete.
- **Consultation follow-up:** `pending → addressed/no_follow_up/rescheduled/cancelled`. No transition guard — **needs business confirmation**.
- **User:** `active → inactive` (super admin toggle). **Login blocked, but session gap existed — fixed in this audit.** ✅

---

## 2. Core Business Workflows — Final Classification (43.23, 43.26)

| # | Workflow | Expected business flow | Actual implementation | Status |
|---|---|---|---|---|
| W1 | Patient books → doctor notified → confirmed | Patient picks doctor/date/slot → validated → confirmed → doctor notified | Slot conflict + schedule containment + past-date server checks; doctor notified in-app + email | **MATCH** |
| W2 | Doctor books → consent flow → confirmation | Walk-in/registered → consent type drives status → consent link for patient | Server-side status derivation + consent slug link + email | **MATCH** |
| W3 | Appointment → consultation → patient records | Doctor completes consultation → appointment completed → patient sees prescription/records | `saveConsultation` marks appointment completed, stores medications; patient portal reflects; notifications | **MATCH** |
| W4 | Consultation → billing → income | Bill created → income recognized on payment | Auto income transaction; credit flow defers income until collection | **PARTIAL** (history rewrite on bill edit — see B7) |
| W5 | Test booking → vendor upload → patient report | Booking → vendor gets token link → upload → completed → patient + doctor notified | Token upload flow works; **cancelled bookings could be completed & reports silently overwritten — fixed**; booking hard-delete orphans its bill | **PARTIAL** (fixed, one gap remains — B8) |
| W6 | Patient registration/removal | Register patient → manage records; removal must not destroy history | Hard delete cascades to consultations/bills/test-bookings (FK cascade) — **guarded in this audit** | **PARTIAL** (fixed) |
| W7 | Follow-up management | Doctor tracks follow-ups from consultations | Follow-ups page lists pending with dates; status update was **broken** (UI sent "completed", server whitelist rejected it) + unrestricted transitions | **PARTIAL** (fixed: UI sends "addressed", whitelist + transition guard added — pending→addressed/no_follow_up/rescheduled/cancelled; terminal states absorbing) |
| W8 | Super admin deactivates user | Deactivated user loses access immediately | Login blocked; **active session remained valid — fixed** | **MATCH** (fixed) |
| W9 | Billing → dashboard KPIs | KPI = correct aggregate of underlying records | **Total patients KPI always 0; income included soft-deleted txns — both fixed** | **PARTIAL** (fixed → MATCH) |
| W10 | Support ticket | Doctor opens ticket → super admin replies → close | Ticket + messages + CSV export; role-scoped | **MATCH** |

---

## 3. Business Logic Issues (43.26)

| # | Severity | Issue | Business impact | Technical cause | Affected dashboard/roles | Current behavior | Expected behavior | Fix | Regression |
|---|---|---|---|---|---|---|---|---|---|
| B1 | HIGH | "Registered patients" KPI always shows 0 | Doctor believes they have no patients | `getDoctorStats` counts `users.doctor_id`; all patients store ownership in `reference_role_id` (verified live: 18/18 patients have `doctor_id = NULL`) | Doctor dashboard | 0 for every doctor (doctor 2 actually owns 4) | Count = patients owned via `reference_role_id` | Changed query to `referenceRoleId` | ✅ Dashboard now shows 4 |
| B2 | MEDIUM | Dashboard income/expense includes soft-deleted transactions | Doctor sees inflated monthly figures after deleting a bill/txn | `getDoctorStats.monthIncome/monthExpense` lack `isNull(deletedAt)` (other queries have it) | Doctor dashboard | ₹12,902 incl. ₹3,650 of deleted txns | Exclude deleted | Added `deletedAt IS NULL` | ✅ Dashboard shows ₹12,252 = correct |
| B3 | MEDIUM | Deactivated user keeps working session | Terminated doctor keeps accessing clinic data | `getCurrentUser`/`requireRole` never check `users.status`; `toggleUserStatus` doesn't revoke sessions | All dashboards | Full access until session expiry | Immediate lockout | `getCurrentUser` returns null for inactive; login action clears stale session instead of looping | ✅ (verified by code path; login redirect loop prevented) |
| B4 | MEDIUM | Test-booking status jumps arbitrary | `pending → completed` skip, `completed → pending` reversal, `cancelled → in-progress` | `updateTestBookingStatus` had no transition guard | Doctor / test-bookings | Any state to any state via dropdown | Enforce lifecycle | Added `BOOKING_TRANSITIONS` state machine; UI dropdown shows only legal options | ✅ E2E: completed→pending rejected; pending→in-progress OK |
| B5 | MEDIUM | Vendor upload completes cancelled bookings & silently overwrites reports | Cancelled test gets reactivated; clinical report replaced without consent | `uploadTestReport` unconditionally sets `status: completed` | Vendor upload | Cancelled booking → completed; re-upload overwrites file | Reject cancelled; reject silent re-upload | Added status guards in server action (UI already guarded) | ✅ |
| B6 | HIGH | Patient hard-delete destroys clinical + financial history | Deleting a patient cascades to consultations, bills, test bookings (FK CASCADE) — medicolegal/tax records lost | `deletePatient` hard-deletes `users` row; FKs `onDelete cascade` (verified live in information_schema) | Doctor / Registrations | Any patient deletable; all records destroyed | Block when records exist; suggest deactivation | Added consultation/billing guard returning actionable error; UI shows it | ✅ E2E: "This patient has consultation records. Deactivate…" |
| B7 | LOW | Bill edit silently rewrites linked income transaction | Payment history amount changed after the fact; no snapshot | `updateBill` overwrites linked transaction with new `receivedAmount` | Doctor / Billing | History rewritten | Preserve original payment events | **Mitigated**: bill edit now snapshots the previous `totalAmount/receivedAmount/pendingAmount/paymentMethod/status` into the audit log (`previous` metadata) — full before/after history is preserved even though the tx row is rewritten. Full snapshot-table design still needs product decision | ✅ typecheck + lint |
| B8 | LOW | Test-booking hard-delete orphans its auto-generated bill | Operational record gone; financial record remains untraceable | `deleteTestBooking` hard-deletes; `billings` has no `test_booking_id` linkage | Doctor / Test-bookings | Bill "Automated bill from Test Booking" with no reference | Soft-delete or retain linkage | Not changed — **requires schema decision (deletedAt / linkage column)** | — |
| B9 | MEDIUM | UTC date slicing vs IST | "Today" boundaries off by a day between 00:00–05:30 IST (server runs UTC+05:30) | `toISOString().slice(0,10)` used for `today` in KPI/booking checks/bill dates — 41 call sites | All | Edge-case misclassification (booking, KPI, bill dates off by a day) | Server-local date | **FIXED**: added `todayStr()` to `lib/utils.ts`; replaced UTC slicing in doctor/patient booking actions, KPI queries (`getDoctorStats`, `getTodaysAppointments`, patient upcoming), bill/transaction creation (billing, test-bookings, income-expense), API routes (appointments export, attendance, available-slots) + client-side `toLocaleDateString("en-CA")` for today-min | ✅ typecheck + lint |

---

## 4. State-Transition Verification (43.4) — live results

| Entity | Transition | Result |
|---|---|---|
| Appointment | `confirmed → cancelled` (doctor, future) | ✅ Allowed (dedicated action) |
| Appointment | `completed → pending` (via generic action) | ✅ Blocked (only `→ confirmed` allowed generically) |
| Appointment | edit completed/cancelled appointment | ✅ Blocked ("immutable") |
| Test booking | `completed → pending` | ✅ **Rejected now** (alert shown) |
| Test booking | `pending → in-progress` | ✅ Allowed (verified live) |
| Test booking | `cancelled → completed` (vendor upload) | ✅ **Rejected now** |
| Billing | credit `pending → paid` | ✅ Only via `collectCreditPayment` |
| User | `active → inactive` | ✅ Login blocked; session now also invalidated |
| Patient delete | with consultations/bills | ✅ **Blocked now** |

---

## 5. Server-Side Enforcement Audit (43.5, 43.22)

Enforced server-side (not just UI):
- Appointment date/time future checks, slot conflicts, schedule containment — both doctor and patient booking actions.
- Consent-type status derivation, immutable completed/cancelled appointments.
- Billing: ownership (`ensureBillOfDoctor`), credit collection flow, read-only billing-linked transactions.
- Test bookings: vendor ownership scoping, tests owned by doctor, payment method whitelist, PCI-safe card storage (brand + last4 only).
- Income/expense: category ownership, billing-linked tx read-only, file magic-byte sniffing.

Gaps closed in this audit: test-booking transitions, vendor upload guards, patient-delete guard, deactivation session invalidation, KPI calculation correctness, consultation status guard, bill-number uniqueness, vendor-delete guard.

**Closed enforcement gap (B12):** server-side permission enforcement now implemented at 3 layers:
- **Server actions** (9 files): `requireDoctorPermission("billing-create")` etc. rejects unauthorized invocations with `{error: "…"}`.
- **Server layout** (`app/doctor/layout.tsx`): reads `x-pathname` header (set by `proxy.ts`), checks `hasDoctorModuleAccess`, issues a 307 redirect before the page component fetches data.
- **Client gate** (`components/doctor/permission-gate.tsx`): `DoctorPermissionGate` mirrors the redirect for SPA client-side navigation.
- **Shared map** (`lib/auth/permissions.ts`): `DOCTOR_ROUTE_PERMISSIONS` is the single source of truth for nav + guards; import-safe (no server deps) so the client gate can use it.
- **Verified**: full-perm doctor (all 19 nav items), limited-perm staff (12 permitted items, 7 hidden), direct-URL redirects, 307 server-side redirect.

---

## 6. Notifications vs Business Events (43.11)

Verified notification triggers map to real events: booking created/updated/cancelled (doctor + patient), visit completed → records available, lab report uploaded, support replies. All fire-and-forget with failure isolation (email/notification failure never blocks the action). ✅

---

## 7. Audit Trail (43.12)

Audit entries verified for: login/login-failed/deactivated, appointment create/update/cancel/delete, patient create/update/delete/photo, bill create/update/delete, transaction create/update/status, test-booking status changes, vendor report upload, support ticket creation, role/permission changes, super-admin user status toggles. `audit_logs` viewer exists for super admin. ✅

---

## 8. Duplicate Prevention (43.15)

- Appointments: time-slot conflict check (doctor+date+time, excluding cancelled) in both booking paths — however no DB unique constraint (concurrent double-submit race remains possible; minor).
- Billing types / income / expense categories: duplicate name checks per user.
- Leads (demo bookings): rate-limited per email, but no uniqueness — repeated demo requests possible (acceptable for marketing).
- Bill number: `INV-<6-digit timestamp>` — **collision-prone under concurrency** (two bills in the same millisecond or two doctors on same server). No DB-level uniqueness on generated numbers beyond the `bill_number` unique column, which would throw on collision (currently uncaught in `createBill`).

---

## 9. Business Rules Requiring Confirmation (43.26)

1. **Test-booking deletion:** Should bookings that generated bills be soft-deleted/retained (add `deleted_at` + `billings.test_booking_id` linkage), or is hard-delete acceptable? (B8)
2. **Bill payment history:** Should editing a bill preserve the original payment/income event (snapshot) instead of rewriting the linked transaction? (B7)
3. **Follow-up status transitions:** Is reversal (`addressed → pending`) permitted, and should `completed` follow-ups be editable? (W7)
4. **"Today's appointments" KPI:** Should cancelled appointments be excluded from the count?
5. **Timezone:** Is the server expected to run in IST (use local date) or UTC? (B9)
6. **Patient deletion:** Confirm that patients with no records may still be permanently deleted (vs. always deactivate).
7. **Permission enforcement (B12):** Should module permissions (billing, income-expense, staff…) be enforced server-side for receptionists/staff, or is nav-visibility the intended scope of the Roles & Permission feature? If enforced, requires a systematic pass over all doctor layouts + server actions.

---

## 10. Final Verification Chain (43.27) — Patient Booking Journey

**REAL BUSINESS REQUIREMENT** — Patient books a visit and the clinic delivers care + billing.
**BUSINESS WORKFLOW** — Book → confirm → consult → bill → income → records.
**USER ROLE** — Patient (self-service) + Doctor/Receptionist.
**UI** — `/patient/appointments/book`; `/doctor/appointments`; `/doctor/consultations`.
**ROUTING** — Role-guarded layouts redirect cross-role access (verified in prior audit).
**AUTHENTICATION** — JWT session cookie; login blocks deactivated users (now also session-level).
**AUTHORIZATION** — `requireRole` + ownership helpers (`ensurePatientOfDoctor`, `ensureAppointmentOfDoctor`, etc.) on every action; verified IDOR-blocked in prior audit.
**VALIDATION** — Zod schemas + server-side date/time/slot/schedule/payment checks.
**BUSINESS RULE** — Appointment state machine; consent flow; billing → income mapping; test-booking state machine (new); deletion guards (new).
**API** — Server actions + authenticated API routes (available-slots, reports, export).
**DATABASE** — FKs + soft-deletes (transactions/billings); cascade behaviour now guarded at the business layer.
**STORAGE** — PHI-safe uploads outside `public/`, magic-byte validation, authenticated file routes.
**NOTIFICATION / EVENT** — In-app + email on book/complete/cancel/report-upload.
**NEXT BUSINESS STAGE** — Patient sees records/prescriptions/bills; doctor sees income.
**FINAL BUSINESS OUTCOME** — Care delivered, records retained, income recognized — verified end-to-end.

**Verification tooling:** `npx tsc --noEmit` ✅ · eslint on changed files ✅ (pre-existing `any` in `lib/auth/user.ts` untouched) · Live E2E in browser ✅
