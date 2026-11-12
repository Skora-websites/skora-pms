# API Inventory — SkoraCares

**Audit date:** 2026-11-12  
**Application:** SkoraCares PMS (Next.js 16.3 App Router)  
**Total HTTP handler exports:** 139 across 123 route files  
**Server Action files:** 57 (non-HTTP RPC surface, enumerated separately)

---

## Module Summary

| Module | Route Files | HTTP Handlers | Auth Type |
|---|---:|---:|---|
| System / Public | 7 | 7 | Mixed (public / bearer PAT) |
| Patient (web) | 5 | 6 | Session cookie / public |
| Packages / Payments | 3 | 3 | Session cookie / HMAC webhook |
| Integration proxies | 11 | 12 | Mixed (public / internal) |
| Doctor panel | 22 | 23 | Session cookie (doctor role) |
| Super-admin panel | 3 | 3 | Session cookie (super_admin role) |
| Mobile — Session & Device | 2 | 5 | Session cookie |
| Mobile — Patient | 7 | 13 | Session cookie (patient role) |
| Mobile — Doctor | 15 | 22 | Session cookie (doctor role) |
| Mobile — Admin | 18 | 18 | Session cookie (admin/manager role) |
| Mobile — Emergency (SOS) | 11 | 11 | Session cookie (role-specific) |
| Mobile — Super-admin | 10 | 10 | Session cookie (super_admin role) |
| Shule integration | 1 | 1 | Bearer PAT |
| Cron | 1 | 1 | Bearer PAT / cron secret |
| **Total** | **116** | **135** | — |

> Note: 7 route files export multiple HTTP methods, bringing the total handler count to 139. Four integration routes counted once above each handle GET+POST or similar.

---

## 1. System / Public Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| SYS-001 | GET | `/api/health` | None (public) | Health/readiness check |
| SYS-002 | GET | `/api/cron/expire-sos` | Bearer PAT or `x-vercel-cron` header | Cron: expire stale SOS requests |
| SYS-003 | GET | `/api/public/file/[...path]` | None (allowlisted paths only) | Serve CMS/blog public assets |
| SYS-004 | GET | `/api/consents/[slug]/file` | Patient link or doctor session | Serve consent artifact by slug |
| SYS-005 | GET | `/api/doctors/[id]/photo` | None (public profile photo) | Serve doctor profile photo |
| SYS-006 | GET | `/api/medicines/search` | Session cookie (doctor role) | Medicine name autocomplete |
| SYS-007 | GET | `/api/prescriptions/[consultationId]` | Session cookie + ownership | Prescription document access |

---

## 2. Patient (Web) Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| PAT-001 | GET | `/api/patient/available-slots` | Session cookie (patient role) | Available appointment slots |
| PAT-002 | GET | `/api/patient/test-reports/[id]` | Session cookie (patient role) + ownership | Fetch test report by ID |
| PAT-003 | POST | `/api/patient/test-reports/[id]/summarize` | Session cookie (patient role) + ownership | AI-powered test report summary |
| PAT-004 | GET | `/api/patient/sos/stream` | Session cookie (patient role) | SSE stream for SOS status updates |
| PAT-005 | GET | `/api/patient/sos/status/[id]` | Session cookie (patient role) + ownership | Polling SOS request status |

---

## 3. Packages / Payments Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| PKG-001 | POST | `/api/packages/order` | Session cookie (doctor role) | Create Razorpay order for subscription |
| PKG-002 | POST | `/api/packages/verify` | Session cookie (doctor role) | Verify payment and fulfil subscription |
| PKG-003 | POST | `/api/packages/webhook` | Razorpay HMAC signature | Idempotent webhook fulfillment |

---

## 4. Integration Proxy Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| INT-001 | GET | `/api/integrations/email-check` | Internal / rate-limited | Email format/MX validation |
| INT-002 | POST | `/api/integrations/email-check` | Internal / rate-limited | Email format/MX validation (POST form) |
| INT-003 | GET | `/api/integrations/geo-data` | Session cookie | Geo/location reference data |
| INT-004 | GET | `/api/integrations/geocode` | Session cookie | Forward geocoding (address → coords) |
| INT-005 | GET | `/api/integrations/health` | None (public) | External integration health check |
| INT-006 | GET | `/api/integrations/holidays` | Session cookie | Indian public holidays |
| INT-007 | GET | `/api/integrations/india` | Session cookie | India clinical reference data (ICD-10, RxTerms) |
| INT-008 | GET | `/api/integrations/pincode` | Session cookie | India pincode lookup |
| INT-009 | GET | `/api/integrations/qr` | Session cookie | QR code generation |
| INT-010 | GET | `/api/integrations/reference` | Session cookie | Generic reference data |
| INT-011 | GET | `/api/integrations/weather` | Session cookie | Weather data |

---

## 5. Doctor Panel Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| DOC-001 | GET | `/api/doctor/appointments/export` | Session cookie (doctor role) | CSV/XLSX appointment export |
| DOC-002 | GET | `/api/doctor/appointments/booked-times` | Session cookie (doctor role) | Booked time slots for scheduling UI |
| DOC-003 | GET | `/api/doctor/appointments/[id]/consent-file` | Session cookie (doctor role) + ownership | Serve consent file for appointment |
| DOC-004 | GET | `/api/doctor/billing/[id]/pdf` | Session cookie (doctor role) + ownership | Generate billing PDF |
| DOC-005 | GET | `/api/doctor/clinic-logo/[id]` | Session cookie (doctor role) + ownership | Serve clinic logo |
| DOC-006 | GET | `/api/doctor/consult-pdf` | Session cookie (doctor role) | Generate consultation PDF |
| DOC-007 | GET | `/api/doctor/home-visits/patient-details/[id]` | Session cookie (doctor role) + ownership | Patient details for home visit |
| DOC-008 | GET | `/api/doctor/income-expense/export` | Session cookie (doctor role) | Income/expense CSV export |
| DOC-009 | POST | `/api/doctor/income-expense/export` | Session cookie (doctor role) | Income/expense export with filters |
| DOC-010 | GET | `/api/doctor/income-expense/[id]/file` | Session cookie (doctor role) + ownership | Serve income/expense attachment |
| DOC-011 | GET | `/api/doctor/patients/export` | Session cookie (doctor role) | Patient list CSV/XLSX export |
| DOC-012 | GET | `/api/doctor/patients/[id]/photo` | Session cookie (doctor role) + ownership | Patient photo |
| DOC-013 | GET | `/api/doctor/profile/photo` | Session cookie (doctor role) | Doctor profile photo |
| DOC-014 | GET | `/api/doctor/profile/signature` | Session cookie (doctor role) | Doctor signature image |
| DOC-015 | GET | `/api/doctor/sos/stream` | Session cookie (doctor role) | SSE stream for SOS offers/updates |
| DOC-016 | GET | `/api/doctor/sos/status` | Session cookie (doctor role) | Current SOS duty status |
| DOC-017 | GET | `/api/doctor/staff/[id]/permissions` | Session cookie (doctor role) + ownership | Staff member permission set |
| DOC-018 | GET | `/api/doctor/staff/attendance` | Session cookie (doctor role) | Staff attendance records |
| DOC-019 | GET | `/api/doctor/staff/attendance/report` | Session cookie (doctor role) | Staff attendance report export |
| DOC-020 | GET | `/api/doctor/test-bookings/[id]/report` | Session cookie (doctor role) + ownership | Lab test report file |
| DOC-021 | GET | `/api/doctor/test-bookings/patient-details` | Session cookie (doctor role) | Patient details for test booking |
| DOC-022 | GET | `/api/doctor/test-bookings/suggestions` | Session cookie (doctor role) | Test name autocomplete suggestions |

---

## 6. Super-Admin Panel Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| SUP-001 | GET | `/api/super-admin/file/[...path]` | Session cookie (super_admin role) | Serve storage files to super-admin |
| SUP-002 | GET | `/api/super-admin/masters/[kind]/export` | Session cookie (super_admin role) | Export master data by kind |
| SUP-003 | GET | `/api/super-admin/support/export` | Session cookie (super_admin role) | Export support ticket data |

---

## 7. Mobile — Session & Device Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| MOB-S-001 | POST | `/api/mobile/session` | Credentials (email + password) | Mobile login — issues session token |
| MOB-S-002 | GET | `/api/mobile/session` | Session cookie | Fetch current session identity |
| MOB-S-003 | DELETE | `/api/mobile/session` | Session cookie | Logout — revokes session |
| MOB-S-004 | POST | `/api/mobile/device-tokens` | Session cookie | Register Expo push token |
| MOB-S-005 | DELETE | `/api/mobile/device-tokens` | Session cookie | Unregister Expo push token |

---

## 8. Mobile — Patient Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| MOB-P-001 | GET | `/api/mobile/patient/home` | Session cookie (patient) | Patient home dashboard data |
| MOB-P-002 | GET | `/api/mobile/patient/doctors` | Session cookie (patient) | Browse doctor listing |
| MOB-P-003 | GET | `/api/mobile/patient/available-slots` | Session cookie (patient) | Available booking slots |
| MOB-P-004 | GET | `/api/mobile/patient/appointments` | Session cookie (patient) | Patient appointment history |
| MOB-P-005 | POST | `/api/mobile/patient/appointments` | Session cookie (patient) | Book new appointment |
| MOB-P-006 | POST | `/api/mobile/patient/appointments/[id]/cancel` | Session cookie (patient) + ownership | Cancel appointment |
| MOB-P-007 | GET | `/api/mobile/patient/prescriptions` | Session cookie (patient) | Patient prescriptions |
| MOB-P-008 | GET | `/api/mobile/patient/records` | Session cookie (patient) | Patient health records |
| MOB-P-009 | GET | `/api/mobile/patient/test-reports` | Session cookie (patient) | Patient lab reports |
| MOB-P-010 | GET | `/api/mobile/patient/bills` | Session cookie (patient) | Patient billing history |
| MOB-P-011 | GET | `/api/mobile/patient/emergency/history` | Session cookie (patient) | SOS request history |
| MOB-P-012 | POST | `/api/mobile/patient/sos/[id]/location` | Session cookie (patient) + ownership | Update patient location during SOS |
| MOB-P-013 | GET | `/api/mobile/patient/sos/status/[id]` | Session cookie (patient) + ownership | Poll SOS request status |

---

## 9. Mobile — Doctor Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| MOB-D-001 | GET | `/api/mobile/doctor/home` | Session cookie (doctor) | Doctor home dashboard |
| MOB-D-002 | GET | `/api/mobile/doctor/schedule` | Session cookie (doctor) | Doctor schedule/slots |
| MOB-D-003 | GET | `/api/mobile/doctor/patients` | Session cookie (doctor) | Patient list |
| MOB-D-004 | GET | `/api/mobile/doctor/patients/[id]` | Session cookie (doctor) + ownership | Individual patient detail |
| MOB-D-005 | GET | `/api/mobile/doctor/appointments` | Session cookie (doctor) | Appointment list |
| MOB-D-006 | GET | `/api/mobile/doctor/consultations` | Session cookie (doctor) | Consultation list |
| MOB-D-007 | GET | `/api/mobile/doctor/consultations/[appointmentId]` | Session cookie (doctor) + ownership | Individual consultation |
| MOB-D-008 | GET | `/api/mobile/doctor/follow-ups` | Session cookie (doctor) | Follow-up reminders |
| MOB-D-009 | GET | `/api/mobile/doctor/billing` | Session cookie (doctor) | Billing records |
| MOB-D-010 | GET | `/api/mobile/doctor/income-expense` | Session cookie (doctor) | Income/expense records |
| MOB-D-011 | GET | `/api/mobile/doctor/test-bookings` | Session cookie (doctor) | Lab test bookings |
| MOB-D-012 | GET | `/api/mobile/doctor/home-visits` | Session cookie (doctor) | Home visit requests |
| MOB-D-013 | GET | `/api/mobile/doctor/online-consultations` | Session cookie (doctor) | Online consultation list |
| MOB-D-014 | GET | `/api/mobile/doctor/notifications` | Session cookie (doctor) | Doctor notifications |
| MOB-D-015 | GET | `/api/mobile/doctor/profile` | Session cookie (doctor) | Doctor profile data |
| MOB-D-016 | GET | `/api/mobile/doctor/staff` | Session cookie (doctor) | Staff list |
| MOB-D-017 | GET | `/api/mobile/doctor/shop` | Session cookie (doctor) | Inventory/shop data |
| MOB-D-018 | GET | `/api/mobile/doctor/chat` | Session cookie (doctor) | Chat messages |
| MOB-D-019 | POST | `/api/mobile/doctor/chat` | Session cookie (doctor) | Send chat message |
| MOB-D-020 | PUT | `/api/mobile/doctor/chat` | Session cookie (doctor) | Update chat message/settings |
| MOB-D-021 | GET | `/api/mobile/doctor/emergency/history` | Session cookie (doctor) | SOS emergency history |
| MOB-D-022 | GET | `/api/mobile/doctor/sos/feed` | Session cookie (doctor) | Active SOS feed |

---

## 10. Mobile — Admin Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| MOB-A-001 | GET | `/api/mobile/admin/home` | Session cookie (admin/manager) | Admin home dashboard |
| MOB-A-002 | GET | `/api/mobile/admin/clinics` | Session cookie (admin/manager) | Clinic list (business-scoped) |
| MOB-A-003 | GET | `/api/mobile/admin/managers` | Session cookie (admin) | Manager list |
| MOB-A-004 | GET | `/api/mobile/admin/staff` | Session cookie (admin/manager) | Staff across clinics |
| MOB-A-005 | GET | `/api/mobile/admin/patients` | Session cookie (admin/manager) | Patient list (business-scoped) |
| MOB-A-006 | GET | `/api/mobile/admin/appointments` | Session cookie (admin/manager) | Appointments (business-scoped) |
| MOB-A-007 | GET | `/api/mobile/admin/follow-ups` | Session cookie (admin/manager) | Follow-up reminders |
| MOB-A-008 | GET | `/api/mobile/admin/test-bookings` | Session cookie (admin/manager) | Lab test bookings |
| MOB-A-009 | GET | `/api/mobile/admin/billing` | Session cookie (admin/manager) | Billing records |
| MOB-A-010 | GET | `/api/mobile/admin/income-expense` | Session cookie (admin/manager) | Income/expense records |
| MOB-A-011 | GET | `/api/mobile/admin/home-visits` | Session cookie (admin/manager) | Home visit list |
| MOB-A-012 | GET | `/api/mobile/admin/consultations` | Session cookie (admin/manager) | Consultation records |
| MOB-A-013 | GET | `/api/mobile/admin/online-consultations` | Session cookie (admin/manager) | Online consultation list |
| MOB-A-014 | GET | `/api/mobile/admin/chat` | Session cookie (admin/manager) | Chat messages |
| MOB-A-015 | GET | `/api/mobile/admin/notifications` | Session cookie (admin/manager) | Admin notifications |
| MOB-A-016 | GET | `/api/mobile/admin/business-settings` | Session cookie (admin) | Business settings |
| MOB-A-017 | GET | `/api/mobile/admin/schedule` | Session cookie (admin/manager) | Schedule overview |
| MOB-A-018 | GET | `/api/mobile/admin/support` | Session cookie (admin/manager) | Support ticket list |

---

## 11. Mobile — Emergency (SOS Dispatch) Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| MOB-E-001 | PUT | `/api/mobile/emergency/availability` | Session cookie (doctor) | Toggle doctor SOS on-duty status |
| MOB-E-002 | POST | `/api/mobile/emergency/requests` | Session cookie (patient) | Raise new SOS request |
| MOB-E-003 | POST | `/api/mobile/emergency/requests/[id]/accept` | Session cookie (doctor) | Accept SOS offer |
| MOB-E-004 | POST | `/api/mobile/emergency/requests/[id]/decline` | Session cookie (doctor) | Decline SOS offer |
| MOB-E-005 | POST | `/api/mobile/emergency/requests/[id]/cancel` | Session cookie (patient/doctor) | Cancel SOS request |
| MOB-E-006 | POST | `/api/mobile/emergency/requests/[id]/arrived` | Session cookie (doctor) | Mark doctor arrived at patient |
| MOB-E-007 | POST | `/api/mobile/emergency/requests/[id]/complete` | Session cookie (doctor) | Complete SOS case |
| MOB-E-008 | POST | `/api/mobile/emergency/requests/[id]/verify-otp` | Session cookie (doctor) | OTP verification at arrival |
| MOB-E-009 | POST | `/api/mobile/emergency/requests/[id]/location` | Session cookie (doctor) | Update doctor location during SOS |
| MOB-E-010 | GET | `/api/mobile/emergency/requests/[id]/case` | Session cookie (doctor/patient) | Fetch case details |
| MOB-E-011 | POST | `/api/mobile/emergency/requests/[id]/rating` | Session cookie (patient) | Submit post-SOS rating |

---

## 12. Mobile — Super-Admin Endpoints

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| MOB-SA-001 | GET | `/api/mobile/super/stats` | Session cookie (super_admin) | Platform-wide statistics |
| MOB-SA-002 | GET | `/api/mobile/super/businesses` | Session cookie (super_admin) | Business/tenant listing |
| MOB-SA-003 | GET | `/api/mobile/super/users` | Session cookie (super_admin) | All users |
| MOB-SA-004 | GET | `/api/mobile/super/doctors` | Session cookie (super_admin) | All doctors |
| MOB-SA-005 | GET | `/api/mobile/super/doctors/[id]` | Session cookie (super_admin) | Individual doctor detail |
| MOB-SA-006 | GET | `/api/mobile/super/clinics` | Session cookie (super_admin) | All clinics |
| MOB-SA-007 | GET | `/api/mobile/super/masters` | Session cookie (super_admin) | Master data management |
| MOB-SA-008 | GET | `/api/mobile/super/support` | Session cookie (super_admin) | Support tickets (platform-wide) |
| MOB-SA-009 | GET | `/api/mobile/super/audit-logs` | Session cookie (super_admin) | Audit log access |
| MOB-SA-010 | GET | `/api/mobile/super/payments` | Session cookie (super_admin) | Payment records |

---

## 13. Integration — Shule Doctor Directory

| ID | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| INT-S-001 | GET | `/api/shule/doctors` | Bearer PAT (staff tier, scopes, tenant-bounded) | Partner integration: doctor directory |

---

## 14. Server Actions (Non-HTTP RPC Surface)

Server Actions are Next.js `"use server"` functions invoked via POST to the page URL with a form action ID. They are not REST endpoints and cannot be called like HTTP APIs. They share the same auth/session infrastructure as route handlers.

**57 server-action files across modules:**

| Module | File count | Representative actions |
|---|---:|---|
| Auth | 5 | login, signup, OTP verify, forgot-password, reset-password |
| Doctor dashboard | ~20 | appointment CRUD, consultation, prescription, billing, inventory, staff, schedule, slots, lab tests, SOS duty toggle, consents, PDF generation |
| Admin dashboard | ~8 | doctor/manager/patient/clinic management, business settings, support |
| Patient portal | ~6 | appointment booking/cancel, profile update, notifications, support tickets |
| Super-admin | ~10 | user management, clinics, doctors, payments, landing CMS, masters, email setup, audit |
| Vendor | ~2 | token-gated file upload |
| Shared/lib | 6 | `lib/actions/auth.ts`, `lib/actions/permissions.ts`, `lib/actions/inventory.ts`, `lib/dispatch/actions.ts`, `lib/push/actions.ts`, `lib/security/audit.ts` |

> Server Actions undergo the same Zod validation, guard checks, ownership verification, rate limiting, and audit logging as route handlers.
