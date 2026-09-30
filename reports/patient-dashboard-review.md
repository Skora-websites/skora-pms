# Patient Dashboard Verification Report

**Scope:** All routes under `app/patient/**`, their shared layout, supporting server actions (`app/patient/appointments/actions.ts`, `lib/dispatch/actions.ts`), query layer (`lib/queries/patient.ts`), patient-facing API routes (`app/api/patient/**`, `app/api/prescriptions/[consultationId]`), and shared UI (`components/dashboard/*`, `components/ui/dashboard-ui.tsx`).

**Method:** Full source read of every patient route file, action, query, and backing API route. No files were modified. Static verification only (no live server run).

**Verdict:** The patient dashboard is **fully implemented and well-built**. All 9 pages + 1 booking flow exist, are wired to real queries/actions, are auth-guarded, ownership-checked, and covered by sensible empty states. No critical or high-severity defects were found. Findings below are mostly low-severity polish and robustness items.

---

## Route Inventory

| Route | File | Status |
|---|---|---|
| `/patient` (dashboard home) | `app/patient/page.tsx` | PASS (with findings) |
| `/patient/find-doctor` | `app/patient/find-doctor/page.tsx` | PASS |
| `/patient/appointments` | `app/patient/appointments/page.tsx` | PASS (with findings) |
| `/patient/appointments/book` | `app/patient/appointments/book/page.tsx` + `book-form.tsx` | PASS (with findings) |
| `/patient/prescriptions` | `app/patient/prescriptions/page.tsx` | PASS |
| `/patient/test-reports` | `app/patient/test-reports/page.tsx` + `ai-summary.tsx` | PASS |
| `/patient/bills` | `app/patient/bills/page.tsx` | PASS |
| `/patient/records` | `app/patient/records/page.tsx` | PASS |
| `/patient/emergency` | `app/patient/emergency/page.tsx` + `sos-dispatch.tsx` | PASS (with findings) |

Supporting APIs (all verified):

- `GET /api/patient/available-slots` — `app/api/patient/available-slots/route.ts`
- `GET /api/patient/sos/status/[id]` — `app/api/patient/sos/status/[id]/route.ts`
- `GET /api/patient/test-reports/[id]` — `app/api/patient/test-reports/[id]/route.ts`
- `POST /api/patient/test-reports/[id]/summarize` — `app/api/patient/test-reports/[id]/summarize/route.ts`
- `GET /api/prescriptions/[consultationId]` (shared with doctor side) — `app/api/prescriptions/[consultationId]/route.ts`
- `GET /api/doctors/[id]/photo` (referenced by find-doctor + booking form)

Server actions:

- `createPatientAppointment`, `cancelPatientAppointment` — `app/patient/appointments/actions.ts`
- `triggerSos`, `cancelSos`, `getMyActiveRequest`, `getMySosHistory` — `lib/dispatch/actions.ts`

---

## Layout & Navigation

**PASS** — `app/patient/layout.tsx`

- `requireRole(["patient"])` at the segment root: unauthenticated → `/login`; wrong role → role home (`lib/auth/guard.ts`). Correctly protects all 9 child routes in one place.
- NAV lists 8 items; every `href` resolves to an existing page. The 9th route (`/patient/appointments/book`) is intentionally not in nav but is reachable from the dashboard quick actions, the appointments page header, and find-a-doctor cards — no orphaned or dead links.
- `DashboardShell` receives user name/role/email/photo; footer link back to the marketing site.

---

## Page-by-Page Findings

### 1. `/patient` — Dashboard home

**PASS** — Fully implemented. Parallel loads (`Promise.all`) of stats + appointments + consultations; 4 StatCards (upcoming / completed / consultations / total billed); two-column appointment + consultation panels with empty states; 6 quick-action cards.

- **ISSUE (low)** — "Your appointments" panel is not filtered to upcoming. `getPatientAppointments` (`lib/queries/patient.ts:168`) returns ALL appointments ordered by `createdAt DESC`, and the page slices the first 5 (`app/patient/page.tsx:60`). A patient with 5 recent past/cancelled bookings sees no upcoming visit in this panel even when `stats.upcoming > 0` (the StatCard and the panel can contradict each other). Filtering to `status NOT IN ('cancelled','completed') AND date >= today` would match the "Upcoming visits" card.
- **ISSUE (low)** — Appointments list ordering is by creation time, not chronological by appointment date, so the panel/table order can look scrambled relative to the dates shown (`lib/queries/patient.ts:184`).
- **ISSUE (low)** — Inconsistent caching directives: `bills`, `find-doctor`, `emergency`, `prescriptions`, `test-reports` set `export const dynamic = "force-dynamic"` but `page.tsx`, `appointments/page.tsx`, `records/page.tsx`, and `book/page.tsx` do not. In practice all are dynamic anyway (cookies via `getCurrentUser`), but the inconsistency invites confusion. All pages do export `metadata` — PASS.

### 2. `/patient/find-doctor`

**PASS** — Lists bookable doctors via `getAvailableDoctors`; empty state when none; photo-or-initials avatar; salutation, qualification, clinic, address, registration number, consultation fee all rendered; "Book appointment" deep-links to `/patient/appointments/book?doctor=<id>`, and the booking form validates the preselect against the loaded doctor list (`book-form.tsx:37-38`) — a stale/invalid `?doctor=` gracefully degrades to no selection.

- **ISSUE (low)** — `getAvailableDoctors` is N+1: one clinics query + one schedules query per doctor (`lib/queries/patient.ts:119-143`). Fine at clinic scale; worth a join/grouped query if the directory grows. The schedule-existence check uses `limit(1)` across all clinics and display picks the first clinic that has a schedule — logic is correct and commented.

### 3. `/patient/appointments`

**PASS** — Table of all appointments with doctor, date, time, visit type, status badge; empty state; header CTA to booking; `CancelAppointmentButton` shown only for non-cancelled/non-completed rows.

- **ISSUE (medium)** — **`?created=1` success param is never consumed.** `createPatientAppointment` redirects to `/patient/appointments?created=1` (`app/patient/appointments/actions.ts:235`), but `app/patient/appointments/page.tsx` never reads search params and renders no success banner/toast. After a successful booking the patient lands on the list with **no positive confirmation** in the UI (only the email, if configured). The appointment does appear in the list, so this is a UX gap, not a data bug.
- **ISSUE (low)** — `CancelAppointmentButton` (`cancel-appointment-button.tsx:16`) ignores the `{ error }` return value of `cancelPatientAppointment`. If the cancel fails server-side (e.g. the appointment became past between render and click — guarded at `actions.ts:259`), the modal closes silently and `router.refresh()` runs with no feedback. Should surface `res.error`.

### 4. `/patient/appointments/book` + booking form + action

**PASS** — The strongest part of the dashboard. Verified end-to-end:

- Server action `createPatientAppointment` validates: authenticated patient; integer doctorId; `YYYY-MM-DD` date; `HH:MM` time; allowed case types; date/time not in the past; doctor exists with role `doctor`; doctor has an active clinic; an active schedule exists for that weekday; selected time falls inside a schedule window (incl. overnight windows and 24h schedules — `timeInSchedule`, `actions.ts:51-61`).
- Duplicate protection at three layers: pre-check via `findDuplicateBooking`, then inside a transaction with `SELECT ... FOR UPDATE` on the doctor row (serializes concurrent bookings), re-checking doctor-slot conflicts and patient duplicate-slot conflicts before insert (`actions.ts:137-184`). Solid.
- Emails (patient confirmation + doctor notification) and in-app notification are fire-and-forget with a catch — a mail outage cannot fail a booking (`actions.ts:195-231`). Audit log entry written.
- Form UX: doctor cards with photos/fees, visit-type toggle with explanatory copy, date input with `min=today`, async slot fetch from `/api/patient/available-slots` with loading / empty / unavailable states, slot buttons converting display "h:mm AM/PM" → 24h for submission, submit disabled until a slot is chosen, action error banner rendered.
- `useSearchParams` is correctly wrapped in `<Suspense>` by the server page (`book/page.tsx:20`).
- `GET /api/patient/available-slots` is patient-role-gated, validates doctor/date, intersects schedule windows with booked times (normalizing legacy "h:mm AM" vs 24h storage) and strips past times for today.

Findings:

- **ISSUE (low)** — Slot list ordering bug in the API: `available-slots/route.ts:158` sorts display strings lexicographically (`.sort()`). `"9:00 AM"` compares greater than `"10:00 AM"` (character `'9'` > `'1'`), so single-digit-hour morning slots sort **after** 10–12 AM slots (e.g. 10:00 AM, 11:00 AM, 12:00 PM, 9:00 AM, 2:00 PM). Cosmetic but visible daily for doctors whose day starts before 10. Fix: sort by parsed minutes (`parseTimeToMinutes`) before mapping to display strings.
- **ISSUE (low)** — "Today" is computed from **server-local** time in both the action (`todayStr(now)`) and the slots API (`toLocaleDateString("en-CA")`), while `min={today}` in the form uses **client-local** time. If the server TZ differs from the patient's TZ, slot filtering near midnight can disagree with the date picker. Consistent within one deployment; flag for multi-region awareness.
- **GAP (low)** — No client-side notice when the fetched slot list is stale by submit time (slot could be taken between fetch and submit). The server-side transaction correctly rejects it with a clear error, so this is only a minor UX round-trip.

### 5. `/patient/prescriptions`

**PASS** — Lists consultations with diagnosis/symptoms, medications grid (name + dose/frequency/duration), follow-up badge, empty state. "Download PDF" points to `/api/prescriptions/${p.id}` where `p.id` is the consultation id — matches the `[consultationId]` route param, and that route enforces `consultations.patientId = user.id` for patient role (`route.ts:27-36`) before rendering via `@react-pdf/renderer` with a dynamic import. Ownership-safe.

### 6. `/patient/test-reports`

**PASS** — Lists test bookings with test names parsed from the `tests` JSON column, doctor + vendor names, status badge, "Report not uploaded yet" fallback when `uploadedFilePath` is null, and — only when a report exists — an "AI Summary" button and "View report" link.

- Report serving: `GET /api/patient/test-reports/[id]` is patient-gated, ownership-scoped (`patientId = user.id`), extension-whitelisted (pdf/jpg/png), path-traversal-guarded (`resolved.startsWith(STORAGE_DIR)`), served with `Cache-Control: private, no-store`, and audited. PASS.
- **ISSUE (low)** — The "AI Summary" is a deterministic template generator, not an AI (`summarize/route.ts` comments admit this: "Swap the inner logic for a real LLM call when keys exist"). The UI brands it "AI Summary" with a sparkles icon. The modal does carry a proper "informational only, consult your doctor" disclaimer. Acceptable, but the label over-promises what the backend delivers.
- **GAP (low)** — AI summary modal (`ai-summary.tsx`) has no Escape-key handler or focus trap; click-outside and X-button both work. Minor a11y gap.
- PASS: `StatusBadge` covers all test-booking statuses seen (`pending`, `in-progress`, `completed`, `cancelled` — `components/ui/dashboard-ui.tsx:154-173`).

### 7. `/patient/bills`

**PASS** — Receipt cards with bill number, doctor, billing type, date, status badge, Total/Paid/Pending (pending highlighted amber when > 0), payment method, notes; empty state; `dynamic = "force-dynamic"`; query excludes soft-deleted bills (`isNull(billings.deletedAt)`).

- **GAP (low)** — If a bill status of `"unpaid"` exists in the schema, it is not in `statusTones` and renders in the neutral slate fallback (graceful, not broken). Cosmetic only.

### 8. `/patient/records`

**PASS** — Health records = consultations list with diagnosis/symptoms, prescribed medicines, follow-up badge, and the same ownership-safe prescription PDF download as #5. Empty state present. No issues found beyond the shared ones (ordering/N+1 below).

### 9. `/patient/emergency` + SOS dispatch

**PASS** — The most complex flow, and it holds up:

- Page: big red SOS dispatch card, tel: links for 108/102/clinic number (clinic number pulled from company settings with a sane fallback), country-variance disclaimer, "Past emergencies" history (attended-by, timestamp, status badge). Resumes an in-flight SOS on reload via `getMyActiveRequest()` (`emergency/page.tsx:17,28`).
- `SosDispatchButton`: one-tap SOS — geolocation with manual-coordinates fallback (reads current DOM values at click time to avoid state races), `useTransition` + pending/locating states, wake lock while tracking is live, 3s status polling against `/api/patient/sos/status/[id]`, pending view (spinner + live map + cancel), accepted view (doctor name, call button, live map with doctor marker), expired/resolved view with "New SOS".
- `triggerSos` (`lib/dispatch/actions.ts`): zod-validated coords, per-user rate limit (`authRateLimit.emergency`), inserts pending request, nearby on-duty doctor discovery → broadcast offers (idempotent on unique constraint), SSE broadcast + notifications, TTL expiry when nobody is nearby, audit log. `cancelSos` is ownership-scoped (`patientId = user.id AND status = 'pending'`) and notifies offered doctors.
- `GET /api/patient/sos/status/[id]`: IDOR-safe (404 unless `req.patientId === user.id`), expires stale pending requests on read, re-runs discovery sweep for late-joining on-duty doctors, returns doctor live location only for the accepting doctor's open case.

Findings:

- **ISSUE (low)** — If the initial status poll fails or hasn't returned yet, `requestId && status` is false and the component falls back to rendering the idle SOS button (`sos-dispatch.tsx:130`), letting a patient fire a second SOS while one is active. `triggerSos` has no server-side "you already have an active request" guard either (rate limiting is the only backstop). A server-side active-request check in `triggerSos` would close this cleanly.
- Note: emergency history shows only terminal statuses (`completed/cancelled/expired`), which is correct since the active request renders in the tracker — intentional, not a gap.

---

## Cross-Cutting Findings

- **ISSUE (medium)** — **No `loading.tsx` or `error.tsx` anywhere under `app/patient/`.** The only error boundary is the root `app/error.tsx`, which renders a full-screen 500 page **outside** the `DashboardShell` — a patient who hits any query failure loses all navigation and must use the browser back button. Adding a segment-level `error.tsx` (inside the shell, with a retry + link to `/patient`) and a `loading.tsx` skeleton would materially improve resilience. `not-found.tsx` also exists only at the root.
- **GAP (medium)** — **No e2e coverage for the patient self-service dashboard.** `e2e/*.spec.ts` references to `/patient` are role-guard checks (`auth-matrix.spec.ts`, `smoke.spec.ts`) — every functional test (`patients.spec.ts`, `forms.spec.ts`, `appointments.spec.ts`, etc.) exercises the **doctor-side** `/doctor/patients` registry. Patient flows with zero automated coverage: self-booking (incl. slot selection), cancel, prescriptions PDF, test reports + summary, bills, SOS dispatch. Given SOS and booking contain the most concurrency-sensitive logic in this area, at least a happy-path patient booking + cancel spec would be valuable.
- **ISSUE (low)** — N+1 patterns in the query layer: `getAvailableDoctors` (per-doctor clinic + schedule queries), `getPatientPrescriptions` and `getPatientConsultations` (per-consultation medications query via `Promise.all`). All wrapped in React `cache()` so they memoize per request, and volumes are small; flag for scale only.
- **PASS (security)** — Verified across all patient surfaces: every page behind `requireRole(["patient"])`; every API route role-gated; every data fetch scoped by `patientId = user.id` (appointments, bills, consultations, test bookings, SOS requests, prescription PDFs); report file serving path-traversal-guarded; booking race protected by `FOR UPDATE` + in-transaction re-checks; SOS accept is an atomic conditional update; rate limiting on SOS; audit logging on booking, cancel, SOS trigger/cancel, and report downloads; notifications/mail fire-and-forget so they can never break the primary flow; server actions validate all FormData inputs (no trust in client state).
- **PASS (consistency)** — All pages use the shared `PageHeader` / `StatCard` / `EmptyState` / `StatusBadge` / `card` design system consistently; pluralization handled; `formatDate`/`formatINR` from `lib/utils` everywhere (the booking form re-defines a local `formatINR` for string fees — harmless duplication); icons and tone tokens consistent with the doctor dashboard.

---

## Summary

| Severity | Count | Items |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium (ISSUE) | 2 | Missing `loading.tsx`/`error.tsx` for the `/patient` segment; unconsumed `?created=1` (no booking success feedback) |
| Medium (GAP) | 1 | No e2e coverage for patient flows |
| Low | 10 | Unfiltered "Your appointments" panel; createdAt-based ordering; inconsistent `dynamic` exports; N+1 queries; cancel button swallows errors; lexicographic slot sort; server/client TZ assumption; SOS re-trigger window; "AI Summary" naming; `unpaid` status tone |
| GAP (low) | 2 | AI summary modal a11y (Escape/focus trap); stale-slot UX note |

**Bottom line:** All patient dashboard routes are properly created, complete, secure, and consistent with the codebase's design system. The two medium items (segment error/loading boundaries and booking success feedback) plus the e2e gap are the highest-value fixes; everything else is polish.
