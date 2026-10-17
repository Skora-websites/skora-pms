# SkoraCare — Dashboard Working Flows

> Companion to `DASHBOARD_FEATURES.md`. Documents **how each module actually works** — the step-by-step flow of every option, as implemented in the code (routes → server actions → DB → notifications/audit).
> **Status as of 2026-09-26.** Verified against the server actions and API routes, not the legacy app.
>
> **Shared plumbing used by every flow:**
> - **Auth gate:** page layouts call `requireRole` / `requireAdminTier`; server actions re-check with `requireDoctorPermission(perm)` — the nav hiding a page is *not* the security boundary.
> - **Scoping:** `ensurePatientOfDoctor`, `ensureAppointmentOfDoctor`, etc. bind every row to the caller's practice. Receptionists resolve to the owner doctor (`resolvePracticeDoctorId`); member doctors are strictly scoped to their own rows (`listDoctorIdsFor`).
> - **Side effects:** validated writes emit `auditLog` entries, `notifyUser` in-app notifications, and `revalidatePath` cache refreshes. Files upload to non-public `storage/uploads/*` with magic-byte checks.

---

## 1. Doctor / Receptionist panel

### 1.1 Dashboard home (`/doctor`, receptionist: `/receptionist`)
1. Layout resolves the caller; receptionists resolve to the **practice owner's** doctorId, so all KPIs are practice-wide.
2. Four KPI cards load in parallel: patients this week, appointments today (+ pending follow-ups), monthly billing, registered patients (+ month expense).
3. Widgets: Weekly OPD Occupancy chart, Next Consultation (with **Start Consultation** shortcut to the consultation form), Clinical Queue (today's rows with per-row Start), Recent Appointments, 6-month Income vs Expense chart.
4. **Duty toggle** (top-right): flips clinic/home-visit on-duty. Doctors set their own; receptionists set it **on behalf of the owner** (`setDutyMode` resolves staff → owner). Duty status feeds the SOS dispatch pool.
5. Quick actions: **Add Patient** → registrations form; **New Appointment** → booking page.

### 1.2 Schedule Time (`/doctor/schedule`)
- **Clinic CRUD:** create / update / delete clinics (name, address, fee, logo upload → served via authed `/api/doctor/clinic-logo/[id]`).
- **Weekly schedule:** save/update/delete slots per weekday (`saveSchedules`); 24-hour and overnight ranges supported (overnight handled by minute-overflow logic).
- **Multi-doctor clinics:** clinic owner can **add doctors to a clinic** (`addClinicDoctor`), **remove** them, and edit their per-clinic profile. Member doctors see the clinics they've been added to.
- Booking later validates times **against these schedules** (see 1.4).

### 1.3 Registrations (`/doctor/patients`)
1. List with search; every row belongs to the practice (patients are bound via `referenceRoleId`).
2. **Create** (`createPatient`): validated form → auto-generates `PAT+7digit` registration id → creates the patient user.
3. **Edit** (`updatePatient`) / **Delete** (`deletePatient`) — both ownership-checked.
4. Detail page shows the patient's chart; photo uploads land in non-public storage and are served authed via `/api/doctor/patients/[id]/photo`.
5. **Excel export** via `/api/doctor/patients/export`.

### 1.4 Appointments (`/doctor/appointments`)
- **Book** (`createAppointment`): the fullest validation chain in the app:
  1. `requireDoctorPermission("appointments-create")` → zod `appointmentSchema`.
  2. **Target doctor resolution:** doctors always book for themselves; receptionists may pick a practice doctor (`doctor_id` field) — a doctor injecting `doctor_id` for someone else is rejected as unauthorized.
  3. **Clinic resolution:** chosen clinic must be accessible; booking on behalf of another doctor lands on a clinic **shared by the practice**, else the target's first active clinic.
  4. **Schedule check:** the chosen time must fall inside the target doctor's active schedule for that weekday (overnight-aware).
  5. **Conflict check:** existing non-cancelled appointment at the same doctor/date/time is rejected; plus a **duplicate-booking finder** (same patient, date, time).
  6. Insert under a **`SELECT ... FOR UPDATE` lock** on the doctor row — closes the concurrent double-booking race.
  7. Side effects: email, in-app notification, audit log, cache revalidation.
- **Edit** (`updateAppointment`): same validation chain minus creation-only fields.
- **Cancel** (`cancelAppointment`) / **Complete** (`completeAppointment`) / **Delete** (`deleteAppointment`) — dedicated validated actions; `updateAppointmentStatus` is deliberately a no-op for everything except `pending → confirmed` (and refuses to confirm `pending_consent`, which only the patient's consent response may confirm).
- **Consent flow:** booking can create a consent record with a **slug link**; the patient opens the public `/my-consent/[slug]` page (§5), and the appointment auto-transitions to `confirmed` or `cancelled` from the patient's decision.
- **Export:** `/api/doctor/appointments/export` (Excel).

### 1.5 Consultations (`/doctor/consultations`, form at `/doctor/consultations/[appointmentId]`)
1. Reached via **Start Consultation** from dashboard/appointments/online consultations.
2. Consultation form saves: symptoms, diagnosis, vitals (height/weight/BP/blood group), **medications** (with live `/api/medicines/search`), follow-up date/status.
3. Saving a follow-up date marks the consultation for the Follow Ups list; status transitions are guarded (§1.6).
4. Optional **consult PDF upload** (exam documents) — stored outside `public/`, streamed via authed `/api/doctor/consult-pdf`.
5. Prescription PDF is generated on demand at `/api/prescriptions/[consultationId]` (authed + scoped).

### 1.6 Follow Ups (`/doctor/follow-ups`)
Two distinct lists, one page:
- **Consultation follow-ups** (rows created by saving a follow-up date in a consultation):
  - `updateFollowUpDetail` supports **comment**, **reschedule** (valid date ≥ today; reschedule returns status to `pending`), and **status** with a legal-transition guard:
    `pending → addressed | no_follow_up | rescheduled | cancelled`; `rescheduled → pending`; terminal states cannot move.
- **Reminders** (`follow_up_reminders` table — proactive call-list entries, no consultation needed):
  - **Create reminder** (`createFollowUpReminder`): pick patient (must belong to the practice) + date (≥ today) + note. If a **receptionist** creates it, the owner gets a heads-up notification.
  - **Reminder actions** (`updateReminderStatus`): `Done` (→ addressed) / `Cancel` (→ cancelled); `pending` is the only source state, both targets are terminal.
- Every transition is audit-logged; WhatsApp/call pills (`wa.me` with trunk-zero fix) let staff contact the patient in one tap.

### 1.7 Income & Expense (`/doctor/income-expense`)
1. **Add transaction** (`createTransaction`): type income(1)/expense(2) → category must belong to the doctor → amount/date/payment-method validation → optional **attachment** (PDF/JPG/PNG ≤ 3 MB, magic-byte sniffed, stored outside public/) → audit + revalidate.
2. **Edit / delete / status update** on own rows.
3. **Category CRUD** for income and expense types (create/update/delete).
4. **Export** via `/api/doctor/income-expense/export` (GET current filter, POST selected ids).
5. Attachments stream through authed `/api/doctor/income-expense/[id]/file`.
6. Billing auto-writes income transactions (see §1.8), so the ledger always reflects collected bills.

### 1.8 Billing (`/doctor/billing`)
1. **Create bill** (`createBill`):
   - Validates patient + billing type ownership; a linked appointment/consultation must belong to **this doctor** (forged form fields rejected).
   - **Credit bills** (payment method `credit`) are created `pending` with received = 0 — income is recognized only when collected.
   - Bill + auto income transaction are written in **one DB transaction** (no orphan income).
2. **Collect credit** (`collectCreditPayment`): marks the 48-hour credit bill collected and creates the income transaction.
3. **Edit / delete bill**, **billing types CRUD** (create/update/deactivate).
4. **Bill PDF** invoice download via authed `/api/doctor/billing/[id]/pdf`.

### 1.9 Test Booking (`/doctor/test-bookings`)
1. **Create booking** (`createTestBooking`): patient resolved by registration-id **or exact phone** (suffix-safety: no LIKE), must be the doctor's own patient; test + vendor selected; status starts `pending`.
2. **Payment capture at booking:** UPI / cash / card / netbanking / *pending (pay later)*. Card flow stores **brand + last4 only** (PCI-DSS; full PAN/CVV never persisted). "pending" maps to a `credit` bill created `pending`.
3. **State machine:** `pending → in-progress → completed`, with `cancelled` reachable from pending/in-progress; `completed`/`cancelled` are terminal (no reversal — bookings may have generated bills/vendor uploads/patient records).
4. **Vendor upload link:** each booking gets a secure token link (regenerable via `regenerateUploadLink`); the vendor opens the public `/vendor/upload-test/[token]` page and uploads the report (pdf/jpg/png ≤ 5 MB) → booking status `completed`, doctor notified.
5. Doctor/patient views the report via authed `/api/doctor/test-bookings/[id]/report` — **blank-report guard** returns a friendly 422 page instead of an empty PDF.
6. Suggestions API (`/api/doctor/test-bookings/suggestions`) and patient-details API power the booking form autocomplete.
7. Booking may generate a **bill + income transaction** in the same pattern as billing.

### 1.10 Home Visit (`/doctor/home-visits`)
1. Home-visit appointments (case type `home_visit`) listed.
2. **Patient details drawer** fetches from authed `/api/doctor/home-visits/patient-details/[id]`.

### 1.11 Chat (`/doctor/chat`)
1. Send message (`sendChatMessage`); polling via `pollChatMessages(sinceId)` — auth-checked (fixed CRITICAL IDOR from the audit).
2. Edit / delete own messages, **favorites**, mute toggle, clear chat.

### 1.12 Shop (`/doctor/shop`)
1. Browse medicine inventory with **search** (name/strength/form) + **form filter pills**.
2. **Catalogue CRUD** (`createMedicine` / `updateMedicine` / `deleteMedicine` in `lib/actions/inventory.ts`):
   - **Add medicine** (header button + empty-state CTA) → dialog with name (required, unique, ≤255), strength, form, unit. New entries start at stock 0.
   - **Edit** (per-card) → same dialog; name-uniqueness checked excluding the row itself.
   - **Delete** (per-card) → `window.confirm` → hard delete. Prescriptions copy medication *names* into `consultation_medications`, so history is unaffected.
   - Same validation rules as super-admin Masters (kind "medicines") — both manage the shared `medicines` table; every mutation audit-logged via `settings_updated` scope `medicine_inventory`.
3. **Stock control** (per card): Add (delta, negative to remove) / Set (stock-take) with optimistic UI and under-stock guard.

### 1.13 Online Consultations (`/doctor/online-consultations`)
1. List filtered by status tabs (all / pending / pending consent / confirmed / completed / cancelled).
2. **Book online visit** → the appointments booking flow with `case_type = online_visit`.
3. Same consent flow as §1.4 for `pending_consent` rows; Start Consultation links into the consultation form.
4. Scope: clinic owners + receptionists see the whole practice; member doctors see only their own.

### 1.14 Emergency (`/doctor/emergency`) — doctor-only (hidden from receptionists)
1. **Live offers:** patient SOS broadcasts arrive over an **SSE stream** (`/api/doctor/sos/stream`) — no refresh needed.
2. **Accept** (`acceptSos`) — **atomic claim**: a conditional `UPDATE ... WHERE status='pending'` means exactly one doctor wins; losers get "Another doctor accepted this request first."
3. On accept: winner's offer → `accepted`, all other offers → `declined`; an **emergency case** row is created; the patient is notified "Doctor on the way"; other doctors are told it's taken (live + notification).
4. **Decline** (`declineSos`) is idempotent; stale pending requests expire inline via business TTL.
5. **Complete case** (`completeSos`) closes the active case; patient live-tracks via their own page (§4.6).
6. Duty toggle (§1.1) controls whether the doctor receives offers at all.
7. Past cases list with statuses.

### 1.15 Support (`/doctor/support`)
Create ticket (`createSupportTicket`) → reply (`replySupportTicket`, ownership-checked) → super-admin answers (§4.9).

### 1.16 My Staff (`/doctor/staff`)
1. **Staff CRUD** (create/update/delete receptionists).
2. **Attendance:** save via `saveAttendance`; daily grid from `/api/doctor/staff/attendance`; monthly report from `/api/doctor/staff/attendance/report`.
3. Per-staff permission inspection via `/api/doctor/staff/[id]/permissions`.

### 1.17 Roles & Permission (`/doctor/roles`)
1. **Role CRUD** (create/update/delete custom roles).
2. `getAllPermissions` lists the catalog; `saveStaffPermissions` writes per-user permission sets (spatie-format parity).
3. Those permissions drive the receptionist's nav, page access, and action-level `requireDoctorPermission` checks.

### 1.18 Profile / Settings / Notifications
- **Profile:** update details; photo + signature upload (served authed); signature appears on prescription PDFs.
- **Settings:** notification preferences (`updateNotificationPreferences` with `wantsNotification` gating mail/notification side effects across flows).
- **Notifications:** list, mark read / all read; unread badge in the shell.

### 1.19 Receptionist-specific behavior (same pages, `/receptionist/*` URLs)
- Proxy rewrites `/receptionist/*` onto doctor routes; each role is bounced out of the other's prefix.
- Data resolves practice-wide through the owner doctor; Emergency is hidden and its URL bounces.
- Module visibility follows the permission sets managed in §1.17.

---

## 2. Admin panel (Business Owner + Manager, `/admin`)

### 2.1 Overview (`/admin`)
1. `requireAdminTier` validates role + route module map; business scope resolves owned (owner) or assigned (manager) businesses/clinics/doctors.
2. KPIs are **clinic-tenancy scoped**: appointments today and upcoming feed filter by the appointment's own `clinicId` (falling back to doctor scoping only for legacy rows with null clinic) — so a single-clinic manager never sees another branch's rows.
3. Cards: appointments today, MTD revenue, active staff, total patients, revenue by clinic, upcoming appointments.

### 2.2 Managers (owner-only)
1. **Create manager** (`createManager`) with credentials.
2. **Assign manager to clinic(s)** (`assignManager`) / **unassign** (`unassignManager`).
3. Assigned managers get `/admin` access limited to their clinics and only modules they hold permissions for.

### 2.3 Monitoring modules (read-only by design)
- **Clinics** (owner): list with revenue per clinic.
- **Schedule / Registrations / Appointments / Test Bookings / Billing / Income & Expense / Clinic Staff:** scoped lists + totals (billing shows total/received/pending; I&E has the scoped Excel export API).
- **Follow Ups:** the one interactive module — new reminder + status actions reusing the doctor flow components (§1.6).
- **Business Settings** (owner), plus dedicated **empty state** (no businesses yet), **error** and **loading** boundaries.

---

## 3. Patient portal (`/patient`)

### 3.1 Dashboard
KPIs (upcoming visits, completed, consultations, total billed) + upcoming appointments + recent consultations (medications chips, follow-up date).

### 3.2 Find a Doctor
Public doctor directory (directory data via `/api/shule/doctors`, photos via `/api/doctors/[id]/photo`) → pick doctor → **Book Appointment**.

### 3.3 Appointments (`/patient/appointments`)
1. **Book** (`createPatientAppointment`):
   - Validates date/time (not in the past), visit type (`clinical_visit` / `home_visit` only from portal), doctor exists with an **active clinic**.
   - Time must fall inside the doctor's **schedule for that weekday** (overnight-aware).
   - Duplicate booking check + slot-conflict check inside a **doctor-row lock transaction** (same race-safety as staff booking).
   - Books as `confirmed` (consent skipped) → confirmation email + notification; audit logged.
   - Available slots for the picker come from `/api/patient/available-slots`.
2. **Cancel own booking** (`cancelPatientAppointment`).
3. Patient sees status transitions made by the clinic (confirm/complete/cancel) reflected in the list.

### 3.4 Prescriptions / Test Reports / Bills / Records
- **Prescriptions:** list + PDF download (authed, scoped to the patient).
- **Test Reports:** list + report download; **AI summary** endpoint (`/api/patient/test-reports/[id]/summarize`) generates a plain-language summary.
- **My Bills:** bill history.
- **Health Records:** consultation history (diagnosis, medications, follow-up badges) + prescription PDF per record.

### 3.5 Notifications
In-app list via the shared shell.

### 3.6 Emergency (`/patient/emergency`)
1. **SOS dispatch** (`triggerSos`): big red button captures GPS + optional complaint/notes/radius →
   - Rate-limited (`authRateLimit.emergency`); re-trigger guard — one active pending request per patient, stale ones expire first.
   - Inserts pending `sos_requests` row → finds **nearby on-duty doctors** within radius → creates offer rows → broadcasts live (SSE) + in-app notifications (WhatsApp intentionally not used).
   - **No doctor available** → request expires immediately with a clear message (no endless wait).
2. Patient **live-tracks** the request via `/api/patient/sos/status/[id]` (map tracking; Uber-style).
3. Patient can **cancel** (`cancelSos`) while pending; doctor completes the case (`completeSos`).
4. Call cards: 108 / 102 / clinic number (from company settings) + past emergency history.

---

## 4. Super Admin (`/super-admin`)

### 4.1 Dashboard
Platform stats, 6-month doctor/patient growth charts, top clinics by revenue, recent support tickets.

### 4.2 Manage Doctors
List → detail page; **sync doctor permissions** (`saveDoctorPermissions`), **activate/deactivate**; photo serving API.

### 4.3 Manage Clinics
Clinic create / update / delete (`storeClinic` / `updateClinic` / `deleteClinic`).

### 4.4 Businesses
List businesses; **toggle business status** and **toggle owner status** (activate/deactivate whole tenancies).

### 4.5 Manage Users
User create / update (`storeUser` / `updateUser`), **activate/deactivate** (`toggleUserStatus`).

### 4.6 Package Payments
Payments list; package **order / verify / webhook** APIs (`/api/packages/*`) handle the payment lifecycle.

### 4.7 Consult Masters
Master data CRUD for **symptoms, examinations, diagnoses, lab tests, medicines** (`storeMasterItem` / `updateMasterItem` / `deleteMasterItem`); **Excel import** (`importMasterItems`) and **export** per kind; **category CRUD** (`storeCategory` / `updateCategory` / `deleteCategory`).

### 4.8 Blogs
Blog create / update / delete; public blog pages read from these rows.

### 4.9 Support
Reply (`adminReplyToTicket`), **close ticket**, **set priority**, **support videos CRUD**, tickets Excel export.

### 4.10 Audit Logs
Platform-wide audit trail viewer (all `auditLog` emissions from the flows above land here).

### 4.11 Landing Page
Section metadata update (`updateLandingSection`); landing item CRUD (`storeLandingItem` / `updateLandingItem` / `deleteLandingItem`) with **image upload** and **reorder** (`reorderLandingItem`).

### 4.12 Email Setup
Save SMTP (`saveMailSettings`), **send test email** (`testMailSettings`).

### 4.13 Settings
Company settings save (`saveCompanySettings`) — e.g. the clinic support phone shown on the patient Emergency page.

---

## 5. Cross-cutting flows

### 5.1 Consent flow (public, links doctor + patient)
1. Staff booking with consent required creates an `appointmentConsultConsents` row with a random **slug**.
2. Patient opens `/my-consent/[slug]` (no login) → reads consent → **Accept** or **Reject**:
   - Rate-limited per slug; links **expire after 7 days**; double submission is rejected.
   - Optional file upload (jpg/png/pdf ≤ 5 MB).
   - On **accept**: a **consent certificate PDF is auto-generated** (react-pdf) and stored outside `public/`; consent + appointment move to `confirmed` in one **conditional-update transaction** (concurrent duplicates can never overwrite).
   - On **reject**: consent + appointment → `cancelled`.
3. Doctor is notified either way; everything audit-logged with client IP.

### 5.2 Auth & onboarding
Login (`loginAction`) with rate limiting/lockout; **signup with email OTP** (`sendSignupOtp` / `verifySignupOtp` / `signupAction`); trial-period guard redirects expired doctors to `/trial-expired`.

### 5.3 Notification & audit spine
Every write flow above emits: zod-validated input → ownership check → DB write → `auditLog` → `notifyUser` (respecting preferences) → `revalidatePath`. Files: magic-byte checked, random names, `storage/uploads/*` (never `public/`), served only through authed, scoped APIs.

---

## 6. Known flow gaps
| # | Gap | Where |
|---|-----|-------|
| 1 | ✅ FIXED 2026-09-26: Consultations nav re-mapped to the `dashboard` perm — entry now visible (was gated on a permission no catalog grants) | Doctor sidebar |
| 2 | ✅ FIXED 2026-09-26: Shop medicine CRUD added (`createMedicine`/`updateMedicine`/`deleteMedicine`) | §1.12 |
| 3 | Settings hub beyond notification prefs (bank, invoice, tax, payment methods) | §1.18 |
| 4 | WhatsApp automation absent (click-to-chat pills only) | §1.6 etc. |
| 5 | Video call / wallet flows | Legacy extras |
