# SkoraCare — Dashboard Features Checklist

> **Status as of 2026-09-26** (commit `2cf7cfa` — member-doctor scoping + follow-ups flow).
> Determined from the actual route/action/API inventory (`app/**/page.tsx`, `app/**/actions.ts`, `app/api/**`), not from `IMPLEMENTATION_PLAN.md`'s Aug-14 snapshot, which predates ~100 later commits.
>
> **Legend:** ✅ implemented · 🟡 partial (some pieces missing) · ❌ not built · ⚠️ known issue
>
> **Role → URL space:** doctors `/doctor/*` · receptionists `/receptionist/*` (rewritten onto doctor routes) · business owners + managers `/admin` · patients `/patient` · platform `/super-admin`.

---

## 1. Doctor Dashboard (shared with Receptionist)

> **Updated 2026-09-30:** the doctor home is now a focused view — greeting + today's/recent appointments only. The full "Clinic OS" widgets (KPIs, occupancy chart, next-appointment, clinical queue, finance trend) moved to the manager dashboard (`/admin` for managers).

| Module | Features | Status |
|---|---|---|
| **Dashboard home** (`/doctor`) | Time-aware greeting + today's schedule summary | ✅ |
| | Today's Appointments card (booked list with status) | ✅ |
| | Recent appointments table | ✅ |
| | Quick action: Book appointment | ✅ |
| **Schedule Time** (`/doctor/schedule`) | Clinic CRUD (create / update / delete) | ✅ |
| | Weekly schedule slot CRUD (save / update / delete) | ✅ |
| | Multi-doctor clinics: add / remove clinic doctors, edit profile | ✅ |
| | Clinic logo upload + serving API | ✅ |
| **Registrations** (`/doctor/patients`) | Patient list with search | ✅ |
| | Create patient (auto `PAT+` registration no.), edit, delete | ✅ |
| | Patient detail page + profile photo upload | ✅ |
| | Excel export of patients | ✅ |
| **Appointments** (`/doctor/appointments`) | List, book (with booked-times conflict detection), edit, delete | ✅ |
| | Cancel / complete / status transitions | ✅ |
| | Excel export of appointments | ✅ |
| | Consent flow: public consent page (`/my-consent/[slug]`) + appointment consent-file viewing | ✅ |
| | WhatsApp Cloud API automated confirmations | ❌ (click-to-chat pills only, see Follow-ups) |
| | Appointment settings page | ❌ |
| **Follow Ups** (`/doctor/follow-ups`) | Follow-up list (consultation follow-ups + `follow_up_reminders`) | ✅ |
| | Create reminder, note / reschedule / mark-addressed with transition guards | ✅ |
| | WhatsApp / call quick pills (`wa.me` links, trunk-zero fix) | ✅ |
| **Income & Expense** (`/doctor/income-expense`) | Transaction create / edit / delete / status update | ✅ |
| | Income & expense category CRUD | ✅ |
| | Attachment upload + authed file serving | ✅ |
| | Excel export (GET/POST) | ✅ |
| **Test Booking** (`/doctor/test-bookings`) | Booking CRUD + status updates | ✅ |
| | Vendor CRUD + Tests CRUD | ✅ |
| | Patient search / registration suggestions (AJAX) | ✅ |
| | Public vendor report upload (`/vendor/upload-test/[token]`) + regenerate link | ✅ |
| | Lab report PDF/image serving (with blank-report guard → 422 page) | ✅ |
| **Billing** (`/doctor/billing`) | Bill create / edit / delete | ✅ |
| | Credit payment collection | ✅ |
| | Billing types CRUD | ✅ |
| | Bill PDF (invoice) download | ✅ |
| **Home Visit** (`/doctor/home-visits`) | Home-visit list + patient details drawer (API) | ✅ |
| **Chat** (`/doctor/chat`) | Send / poll / edit / delete messages, favorites, mute, clear chat | ✅ |
| **Shop** (`/doctor/shop`) | Medicine inventory browse with search + form filters | ✅ |
| | Add / edit / delete medicine (catalogue CRUD) + stock add/set controls | ✅ |
| **Consultations** (`/doctor/consultations`) | List + per-appointment consultation form (diagnosis, meds, vitals, follow-up) | ✅ |
| | Medicine search AJAX API | ✅ |
| | Nav entry gated on the `dashboard` module (matches the route map) | ✅ doctor-only (hidden from receptionists) |
| **Online Consultations** (`/doctor/online-consultations`) | List with status tabs (pending / pending consent / confirmed / completed / cancelled), book online visit | ✅ doctor-only (hidden from receptionists) |
| **Emergency** (`/doctor/emergency`) | Live SOS dispatch offers (SSE stream), accept case, active-case tracking, past cases | ✅ doctor-only (hidden from receptionists) |
| **Support** (`/doctor/support`) | Create ticket + reply | ✅ |
| **My Staff** (`/doctor/staff`) | Staff CRUD | ✅ |
| | Attendance save + attendance report API | ✅ |
| | Per-staff permission viewing (API) | ✅ |
| **Roles & Permission** (`/doctor/roles`) | Role CRUD, permission catalog, save staff permissions | ✅ |
| **Profile** (`/doctor/profile`) | Update details, photo upload, signature upload | ✅ |
| **Settings** (`/doctor/settings`) | Notification preferences | 🟡 only prefs page — legacy settings hub (bank, invoice, tax, payment methods, integrations) not built |
| **Notifications** | List, mark read / all read, unread badge in shell | ✅ |
| **Consult PDF** | Upload + authed, scoped streaming (non-public storage) | ✅ |
| **FAQ** (`/doctor/faq`) | Static FAQ page | ✅ |
| Legacy extras | Video call (WebRTC), Wallet | ❌ not built |

### Receptionist-specific behavior (same pages, `/receptionist/*` URLs)

| Feature | Status |
|---|---|
| Own URL space (`/receptionist/*`) with server rewrite onto doctor routes + prefix bounce guards | ✅ |
| Practice-wide data scope (owner doctor's patients, appointments, billing, I/E, follow-ups, test bookings) | ✅ |
| Duty toggle on behalf of the practice owner | ✅ |
| Emergency module hidden from panel; direct URL bounced | ✅ |
| Consultation features hidden (nav, dashboard widgets, row CTAs, direct URL bounce, server action) | ✅ |
| Nav filtered by per-staff permissions (roles & permission manager) | ✅ |

---

## 2. Admin Dashboard (Business Owner + Manager, `/admin`)

| Module | Features | Status |
|---|---|---|
| **Overview** (`/admin`) | **Owners:** cross-clinic KPIs (appointments today, MTD revenue, active staff, total patients) | ✅ |
| | Owners: revenue by clinic, upcoming appointments feed (clinic-tenancy scoping w/ legacy fallback) | ✅ |
| | **Managers:** full "Clinic OS" overview — KPI row (patients this week, appointments today + pending follow-ups, monthly billing, registered patients), Weekly OPD occupancy chart, Next Appointment widget, Clinical Queue, Recent Appointments table, 6-month Income & Expense trend (business-scoped via getPracticeStats/getPracticeFinanceTrend, all CTAs on `/admin/*`) | ✅ |
| **Clinics** (owner only) | Clinic list with revenue per clinic | ✅ view |
| **Managers** (owner only) | Create manager, assign / unassign manager to clinics | ✅ full CRUD |
| **Business Settings** (owner only) | Business settings page | ✅ |
| **Schedule** | Clinic schedule view | ✅ view |
| **Registrations** | Patient list + search (scoped by business) | ✅ view |
| **Appointments** | Appointment list (scoped) | ✅ view |
| **Follow Ups** | Follow-up list + new reminder + status actions (shared components with doctor) | ✅ |
| **Test Bookings** | Booking list (scoped) | ✅ view |
| **Billing** | Bill list + totals (total / received / pending) | ✅ view |
| **Income & Expense** | Transaction list + totals (+ scoped export API) | ✅ view |
| **Clinic Staff** | Staff / manager roster | ✅ view |
| **Full clinic-ops CRUD** | Appointments (book / edit / confirm / cancel / complete / delete), Registrations (create / edit / delete), Billing (bill CRUD + credit collection + billing types), Income & Expense (transaction + category CRUD), Test Bookings (booking / vendor / test CRUD + status + upload links), Follow-ups (new reminder, status transitions) | ✅ owners full · managers per-permission |
| Empty / error states | No-business empty state, error boundary, loading states | ✅ |

> Design note: the admin tier has **full CRUD** over shared clinic operations. Owners bypass module permission checks (requireAdminTier parity); managers must hold the same module permissions the doctor/staff roles use. All writes flow through the unified `requireWriteScope` guard (lib/auth/action-scope.ts) — business-scoped (business → clinics → doctor ids), anchored to a real doctor account so records stay visible on clinic dashboards, and every mutation is audit-logged.
> Managers see only modules they hold permissions for; `ownerOnly` entries (Clinics / Managers / Business Settings) never render for them.

---

## 3. Patient Portal (`/patient`)

| Module | Features | Status |
|---|---|---|
| **Dashboard** | KPI cards (upcoming visits, completed, consultations, total billed) | ✅ |
| | Upcoming appointments list, recent consultations with medications + follow-up date | ✅ |
| **Find a Doctor** | Doctor directory (public doctor API + photo serving) | ✅ |
| **Appointments** | List, book online visit (available-slots API), cancel own booking | ✅ |
| **Prescriptions** | List + prescription PDF download (authed, scoped) | ✅ |
| **Test Reports** | List + report download + AI report summary | ✅ |
| **My Bills** | Bill history | ✅ |
| **My Health Records** | Consultation history (diagnosis, meds, follow-up badges) + PDF download | ✅ |
| **Emergency** | Uber-style SOS dispatch button + live map tracking, resume in-flight SOS | ✅ |
| | Call cards (108 / 102 / clinic number from company settings), past emergencies history | ✅ |

---

## 4. Super Admin (`/super-admin`)

| Module | Features | Status |
|---|---|---|
| **Dashboard** | Platform stats (doctors, patients, clinics, open tickets), 6-month doctor/patient growth charts, top clinics by revenue, recent tickets | ✅ |
| **Manage Doctors** | List + detail page, doctor photo API, sync doctor permissions, activate/deactivate | ✅ |
| **Manage Clinics** | Clinic create / update / delete | ✅ |
| **Businesses** | Business list, toggle business status, toggle owner status | ✅ |
| **Manage Users** | User create / update, activate / deactivate | ✅ |
| **Package Payments** | Payments list + package order / verify / webhook APIs | ✅ |
| **Consult Masters** | Master data CRUD for symptoms, examinations, diagnoses, lab tests, medicines + Excel import/export + category CRUD | ✅ |
| **Blogs** | Blog create / update / delete | ✅ |
| **Support** | Reply, close ticket, set priority, support videos CRUD, tickets Excel export | ✅ |
| **Audit Logs** | Platform audit trail viewer | ✅ |
| **Landing Page** | Section metadata update, item CRUD + image upload + reorder | ✅ |
| **Email Setup** | Save SMTP settings, send test email | ✅ |
| **Settings** | Company settings save | ✅ |

---

## 5. Cross-cutting (all dashboards)

| Feature | Status |
|---|---|
| Auth: login, signup with email OTP verification | ✅ |
| Session-guarded layouts per role (`requireRole`, `requireAdminTier`, trial-expired guard for doctors) | ✅ |
| Permission system: route→perm maps, server + client nav gating, staff permission manager | ✅ |
| Practice scoping: clinic-owner vs member-doctor vs receptionist (`listDoctorIdsFor`) | ✅ |
| Audit logging of sensitive actions | ✅ |
| File serving APIs with auth + scoping (PHI never in `public/`) | ✅ |
| PWA support (splash screen, installable shell) | ✅ |
| Notifications (in-app list + unread badge) | ✅ |

---

## 6. Known gaps / open issues

| # | Item | Impact |
|---|---|---|
| 1 | ✅ **FIXED 2026-09-26:** Consultations nav was hidden for everyone because the entry gated on a `consultations` permission that no catalog grants. Re-mapped to the `dashboard` permission, matching `DOCTOR_ROUTE_PERMISSIONS`. | — |
| 2 | ✅ **FIXED 2026-09-26:** Shop was read-only — medicine add/edit/delete now built in `lib/actions/inventory.ts` + `app/doctor/shop/medicine-forms.tsx`. | — |
| 3 | 🟡 Doctor Settings has only notification prefs. | Legacy settings hub (bank accounts, invoice, tax rates, payment methods, integrations) not built. |
| 4 | ❌ WhatsApp Cloud API automation (appointment confirmations). | Only click-to-chat pills exist. |
| 5 | ❌ Video call + Wallet (legacy extras). | Not started. |
| 6 | ✅ **FIXED 2026-09-30:** Admin tier had full CRUD — appointments, registrations, billing, income & expense, test bookings, and follow-ups are now writable for owners (and permission-gated managers) via the unified write-scope guard. | — |
