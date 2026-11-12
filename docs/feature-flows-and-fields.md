# SkoraCare Feature Specification: Required Fields & Flows

This document consolidates **industry-standard required/core fields and workflows** (researched) with the **current SkoraCare implementation** and **target end-to-end scope** for:
- Appointment Scheduling
- e-Prescriptions
- Patient Portal
- Billing/Invoicing

> Notes
> - Standards-based external integrations (e.g. NCPDP SCRIPT pharmacy-network eRx/EPCS, X12/EDI claims clearinghouse, live payment gateway capture) are treated as **integration boundaries**: the in-app data model and workflows are designed to be integration-ready; real network transmission requires provider credentials/configuration not present in-repo.
> - All flows must remain role-scoped (admin/manager/doctor/receptionist/patient), auditable, and compatible with existing legacy data where applicable.

---

## 1) Appointment Scheduling

### 1.1 Core/required fields (industry)
| Category | Fields |
|---|---|
| Participants | Patient (registered or walk-in identity), provider/doctor, clinic/location |
| Timing | Appointment date, start time/slot, duration/end time (or derived), timezone/context |
| Visit details | Visit type/mode (in-clinic, home, online/telemedicine, on-call), reason for visit/chief complaint, intake notes/symptoms, urgency/priority (optional) |
| Clinical pre-visit | Vitals/intake (BP, weight, height), blood group, allergies/history references (as applicable) |
| Status & lifecycle | Requested/pending, confirmed, checked-in, completed, cancelled, no-show (and consent-pending states if used) |
| Contact & consent | Phone/mobile, consent type/value/file/link, reminders/notifications |
| Operational | Booking source, created/updated by, audit trail, linked consultation/billing/visit records |

### 1.2 Current implementation (codebase)
- **Schema:** `appointments` includes doctor/patient or `patientString`, date/time (legacy string), `case_type` (`clinical_visit|home_visit|online_visit|on_call_visit`), vitals (bp/weight/height/blood_group), remarks/notes, consent fields, status, clinic link.
- **Enhancement added (0028):** `status` extended with `checked_in`, `no_show`; added `reason`, `intake_notes`, `checked_in_at`, `no_show_at`, `reminder_sent_at`.
- **Flows in place:** patient self-book/cancel/reschedule with schedule/slot validation, duplicate detection, locking; doctor/practice create/update/cancel/complete/delete with scope checks, schedule containment, consent handling; admin UIs reuse doctor flows.
- **Gaps to complete end-to-end:** richer intake capture in all UIs, explicit check-in/no-show UI/actions across roles, reminder scheduling/delivery hooks, unified visit-type UX (online/on-call parity), stronger linkage to consult/billing and visit summaries.

### 1.3 Target workflow
1. **Discover & select:** patient/staff selects doctor, clinic, visit type, and date.
2. **Availability:** system shows schedule-derived slots (respecting clinic/doctor availability, conflicts, holidays/advisories).
3. **Capture details:** reason for visit, intake notes, contact, consent choice as required.
4. **Book/confirm:** create appointment with conflict/duplicate protection; notify patient/provider.
5. **Pre-visit:** reminders; consent completion if pending.
6. **Arrival/visit:** check-in (clinic/virtual start) → consultation/visit.
7. **Close:** complete (links to clinical note/prescription/billing) or mark cancelled/no-show with reason/audit.
8. **Post-visit:** follow-up scheduling, records and invoices visible in patient portal.

---

## 2) e-Prescriptions (in-app digital prescriptions)

### 2.1 Core/required fields (industry)
| Category | Fields |
|---|---|
| Prescription header | Prescription/consultation ID, issue date/time, prescriber identity (name, qualification, registration/license, contact/clinic), patient identity (name, DOB/age, gender, contact) |
| Clinical context | Diagnosis/indications, symptoms/exam notes, allergies, relevant history, visit/appointment linkage |
| Medication line items | Drug/medicine name, strength, form, dose, route (as applicable), frequency/SIG, duration, quantity, refills, instructions/notes |
| Safety & review | Allergy/interaction/duplication checks (as supported), substitutions/notes |
| Authorization & lifecycle | Status (draft, signed/authorized, issued/sent, cancelled, amended), prescriber signature/attestation, signed/issued timestamps, cancellation/amendment reason, audit trail |
| Fulfillment (external eRx) | Pharmacy selection/routing, transmission status/IDs, refill authorization/requests (requires network integration) |

### 2.2 Current implementation (codebase)
- **Schema:** `consultations` (clinical notes, follow-up) + `consultation_medications` (name, dose, frequency, when_to_take, duration, note, order), `consultation_prescription_uploads` (defined), `doctorConsultPdfs` (consent/terms). PDF generation at `/api/prescriptions/[consultationId]`.
- **Enhancement added (0028):** `consultations` extended with `prescription_status`, `signed_at`, `signed_by_doctor_id`, `issued_at`, `prescription_cancelled_at`, `cancellation_reason`; `users.allergies`; `prescription_refill_requests` table.
- **Flows in place:** doctor saves consultation and meds, completes appointment, generates/downloads PDF; patient views prescriptions/records and downloads PDF.
- **Gaps to complete end-to-end:** structured medication capture/edit in UI, explicit sign/issue/cancel/amend workflow and status visibility, allergy/diagnosis linkage surfaced, refill request handling (patient → doctor), uploaded prescription management, full audit of Rx lifecycle.

### 2.3 Target workflow
1. **Encounter:** start from appointment/consultation; capture diagnosis, symptoms, history, allergies.
2. **Compose:** add structured medication items (dose/frequency/duration/qty/refills/instructions).
3. **Review:** clinician reviews clinical + medication details.
4. **Authorize:** sign/approve prescription (in-app attestation/signature context) → status becomes signed/issued.
5. **Deliver:** generate PDF/share; make available in patient portal; record audit/PHI access.
6. **Follow-up:** amendments/cancellation with reason; patient refill requests tracked and resolved.
7. **Integration-ready:** outbound eRx transmission hook for pharmacy networks when configured.

---

## 3) Patient Portal

### 3.1 Core/required capabilities & fields (industry)
| Area | Fields / capabilities |
|---|---|
| Identity & profile | Demographics, contact, DOB/gender, address, identifiers, emergency/allergy info, preferences |
| Appointments | View upcoming/past, book/reschedule/cancel, visit details, reminders, check-in context |
| Clinical records | Visit summaries/consultations, diagnoses, care plans, documents/uploads |
| Prescriptions | Active/past prescriptions, medication details, download/share, refill requests/status |
| Labs & results | Test orders/bookings, reports/results, download/view, clinician notes |
| Billing & payments | Invoices/bills, line items, balances, payment history/receipts, statements, insurance info (if applicable) |
| Communication | Secure messaging with care team, notifications (in-app/email/SMS/push), read status |
| Consent & access | Consent records, privacy notices, role-scoped access, audit trail |

### 3.2 Current implementation (codebase)
- **Routes:** `/patient` dashboard, find-doctor, appointments, prescriptions, test reports, bills, records, emergency, notifications/preferences.
- **Enhancement added (0028):** `patient_messages` table for secure messaging foundation.
- **Gaps to complete end-to-end:** unified information architecture (reduce records/prescriptions duplication), richer profile/allergy management, refill request UX, secure messaging UI/flow, consolidated visit summaries and document access, clearer payment/statement experience.

### 3.3 Target workflow
1. **Authenticate/onboard:** patient signs in; profile and preferences available.
2. **Dashboard:** upcoming care, recent results/prescriptions, outstanding bills, messages/notifications.
3. **Self-service:** book/manage appointments; view/download prescriptions and request refills; view records/results.
4. **Financial:** review invoices, payment history/receipts, and balances.
5. **Communicate:** send/receive secure messages; manage notification preferences and consents.
6. **Continuity:** each action links to underlying clinical/billing records with auditability.

---

## 4) Billing / Invoicing

### 4.1 Core/required fields (industry)
| Category | Fields |
|---|---|
| Invoice header | Invoice/bill number, issue date, service/date range, provider/practice, patient/guarantor, linked encounter/appointment |
| Line items | Description/service, code (CPT/HCPCS/internal), quantity, unit price, line amount |
| Financials | Subtotal, discounts/adjustments, taxes, total, amount paid/received, balance due, refunds/credits |
| Payment | Payment method, transaction/reference IDs, payment date/status, receipts/statements |
| Insurance/claims (if applicable) | Payer/plan, member/policy IDs, diagnosis/procedure codes, claim/reference status, adjudication/ERA details |
| Controls | Status (draft/pending/partial/paid/refunded/void), notes, soft-delete/immutability rules, audit trail |

### 4.2 Current implementation (codebase)
- **Schema:** `billings` (bill number, patient/doctor, billing type, links to appointment/consultation/test booking, totals/received/pending, method incl. credit, status, notes, date), `billing_types`, `transactions` ledger.
- **Enhancement added (0028):** `billings` extended with insurance/claim fields, discount/tax/refunded amounts, `refunded` status; `billing_line_items` table.
- **Flows in place:** doctor/admin bill create/update/delete/collect credit with ledger sync; patient bills and payment history views; bill PDF.
- **Gaps to complete end-to-end:** line-item invoice composition UI, discounts/taxes/adjustments/refunds/receipts in workflow, statements/balance views, insurance claim tracking UI, payment gateway integration hooks, stronger linkage and reporting.

### 4.3 Target workflow
1. **Charge capture:** identify patient/encounter and select services/items.
2. **Compose invoice:** add line items, apply discounts/taxes/adjustments → compute totals.
3. **Issue:** generate bill/invoice number and share/print/download receipt.
4. **Collect:** record payment (cash/card/UPI/netbanking/credit) or partial payment; sync ledger.
5. **Manage balance:** credits/refunds, follow-up on pending amounts, statements.
6. **Insurance (if used):** capture payer/claim data, track claim status/reference (submission/adjudication via integration when available).
7. **Close/audit:** maintain immutable financial history with audit trail.

---

## 5) Cross-cutting requirements

- **Roles & access:** enforce existing guards/scope (`requireRole`, `requireWriteScope`, ownership checks) across admin/doctor/receptionist/manager/patient surfaces.
- **Validation & integrity:** zod/server-side validation, transactional writes for critical paths, conflict/duplicate protection, idempotent side effects where possible.
- **Auditability:** record clinical and financial lifecycle events (create/update/status/sign/issue/payment/refund) with actor/context.
- **Notifications:** in-app/email hooks for bookings, status changes, prescription issuance, refill updates, and billing events (respect user preferences).
- **Compatibility:** preserve legacy formats/flows (e.g. appointment time strings, existing statuses/consent behavior) while extending additively.
- **Documentation & tests:** keep this spec aligned with implementation; cover key journeys (book→consult→prescribe→bill→patient portal visibility/payment) with automated tests where feasible.

## 6) Implementation status (this pass)

- **Completed:** codebase exploration, research-backed fields/flows documented, additive schema changes drafted (appointments intake/lifecycle, prescription lifecycle/refill foundation, billing insurance/line-items/refund fields, patient messaging foundation, user allergies) and migration `0028_feature_enhancements.sql` created.
- **In progress:** wiring new fields/actions through all role UIs and APIs, full eRx lifecycle/refill UX, portal messaging & unification, invoice line-item/adjustment/refund/insurance workflows, and comprehensive tests.
- **Integration boundaries:** real pharmacy-network eRx (NCPDP/EPCS), live payment gateway capture, and claims clearinghouse/EDI submission remain pluggable hooks unless configured in this environment.
