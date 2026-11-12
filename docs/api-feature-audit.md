# SkoraCare (old) Web API & Feature Audit

Repository: `D:\skorasoft sites\skoracare_old` (branch `main`, Next.js 16.3 App Router, React 19, TypeScript).  
Audit basis: repository structure, manifests/config, schema/guards/core modules, sampled routes/actions/layouts/helpers, and completed background exploration scans (2026-11-12). This is a concrete, repository-specific inventory, but not an exhaustive line-by-line reading of every page/component/handler.

## 1. High-level architecture (web-feature relevant)

### Stack and runtime
- **Framework:** Next.js App Router (`app/*`) with React Server Components, Route Handlers (`route.ts`), and Server Actions (`actions.ts` / `actions.tsx`).
- **Data:** MySQL via `mysql2` pool + Drizzle ORM (`lib/db/index.ts`, `lib/db/schema.ts`, migrations in `drizzle/*`, scripts in `scripts/`).
- **Auth/session:** Custom signed JWT (`jose`, HS256, 30-day) in `httpOnly` cookie `skora_session`, backed by revocable DB `sessions` rows (`lib/auth/session.ts`). Password hashing via `bcryptjs`.
- **Authorization:** Layered enforcement — edge/proxy coarse checks (`proxy.ts`) + layout guards + per-route/per-action guards and ownership/scope checks (`lib/auth/guard.ts`, `lib/auth/user.ts`, `lib/auth/scope.ts`, `lib/auth/action-scope.ts`, `lib/auth/ownership.ts`, `lib/auth/permissions.ts`, `lib/auth/server-permissions.ts`).
- **External/API auth:** Bearer PATs (`sk_live_*`/`sk_test_*`, SHA-256 hashed lookup, scopes/staff tiers/expiry) in `lib/auth/api-token.ts` with tenant-bounded integration scoping in `lib/auth/integration-scope.ts`.
- **Security controls:** Same-origin/CSRF checks for unsafe cookie-auth flows (`lib/security/csrf.ts`, `proxy.ts`), rate limiting with Redis or in-memory fallback (`lib/security/rate-limit.ts`), audit logging/crypto helpers (`lib/security/audit.ts`, `lib/security/crypto.ts`), trial gating (`lib/auth/trial.ts`).
- **UI/PWA:** Tailwind CSS v4, Radix/lucide, Recharts, Leaflet/react-leaflet, Tiptap, `@react-pdf/renderer`/jsPDF, PWA assets (`app/manifest.ts`, `app/sw.ts`, `app/offline/page.tsx`, `components/pwa/*`).
- **Integrations/services:** Razorpay (server-side REST/HMAC wrappers, fulfillment), nodemailer mail, web-push/firebase-admin, sharp/exceljs, India/public reference-data integrations, SOS dispatch/cron, optional Redis.

### Structural patterns
- **Multi-surface app:** marketing site, auth flows, 4 role dashboards (doctor/receptionist-shared, admin, patient, super-admin), tokenized vendor flow, and a large API/mobile/integration surface.
- **Server-first data flow:** RSC pages/layouts read via `lib/queries/*`; mutations primarily via colocated `"use server"` actions with zod validation, auth/scope checks, Drizzle writes, audit, and `revalidatePath`/redirect. No React Query/SWR/Zustand/Redux state architecture detected as primary pattern.
- **Tenancy:** Clinic/practice/business scoping is first-class (owner/manager/admin visibility, doctor/receptionist clinic memberships, integration caller scope) to prevent cross-tenant access.
- **Doctor/receptionist unification:** Receptionist paths alias/redirect into doctor routes; access filtered by permission/allowlist maps and scoped writes (`lib/auth/permissions.ts`, `app/receptionist/[[...path]]/page.tsx`, `lib/auth/action-scope.ts`).
- **Docs/scale snapshot:** ~98 `page.*`, ~123 API `route.*`, 96 client components, 57 server-action files, 61 Drizzle tables, extensive `revalidatePath` usage.

## 2. Web features inventory (by area/page)

### 2.1 Authentication & account (`app/(auth)/*`)
| Area | Representative routes/pages | Key capabilities |
|---|---|---|
| Login | `/login` (`app/(auth)/login/page.tsx`, `actions.ts`) | Credential login, throttling/audit, session cookie issuance, role-based redirect, trial-expired routing for doctors. |
| Signup / OTP | `/signup` (`app/(auth)/signup/page.tsx`, `actions.ts`, `otp-actions.ts`) | Registration/OTP verification flow. |
| Password recovery | `/forgot-password`, `/reset-password` (`app/(auth)/*`) | Generic reset request response, token-based password reset email/flow. |
| Trial gate | `/trial-expired` (`app/(auth)/trial-expired/page.tsx`) | Expired-doctor access boundary/landing; limited allowlisted paths enforced in proxy/layout/guards. |

### 2.2 Marketing & public web (`app/(marketing)/*`, public pages)
| Area | Representative routes/pages | Key capabilities |
|---|---|---|
| Public site | `/`, `/about`, `/services`, `/pricing`, `/contact`, `/download` | Marketing content, product/pricing presentation, CTAs, landing data/CMS-driven sections (`lib/queries/landing.ts`, marketing components). |
| Blog | `/blog`, `/blog/[slug]` | Published blog listing/detail (`lib/queries/blog.ts`). |
| Legal/policies | `/privacy-policy`, `/terms-and-conditions`, `/refund-policy`, `/cancellation-policy` | Static/policy pages. |
| Public consent | `/my-consent/[slug]` (`page.tsx`, `actions.ts`, token/slug flow) | Patient/public consent viewing/signing flow, rate-limited actions, slug-bound artifact access. |
| PWA/offline | `/offline`, root `manifest.ts`, `sw.ts` | Install/offline fallback behavior. |

### 2.3 Doctor / practice dashboard (`app/doctor/*`, receptionist alias)
| Area | Representative routes/pages | Key capabilities |
|---|---|---|
| Dashboard & profile | `/doctor`, `/doctor/profile`, `/doctor/clinic-profile`, `/doctor/settings` | Overview, profile/clinic settings, branding assets (logo/photo/signature). |
| Scheduling | `/doctor/appointments`, `/doctor/slots`, `/doctor/schedule`, holidays/availability-related pages | Appointment management, slot/schedule configuration, availability operations. |
| Patients & clinical | `/doctor/patients`, `/doctor/consultations`, `/doctor/prescriptions`, `/doctor/follow-ups`, medical history flows | Patient records, consult workflows, prescriptions, follow-up tracking. |
| Diagnostics | `/doctor/lab-tests`, test booking/result/report pages | Lab test catalog/bookings/results/report handling. |
| Billing & finance | `/doctor/billing`, ledger/transactions/income-expense related pages | Billing, line items, invoices/PDFs, financial records/exports. |
| Inventory/packages/staff | `/doctor/inventory`, packages/products, `/doctor/staff` | Clinic inventory/products/packages, staff/receptionist management. |
| Emergency/SOS | `/doctor/emergency`, SOS-related pages | SOS/dispatch participation, live status/map interactions. |
| Consents & documents | consent template/consent pages, exports/reports | Consent templates/requests/artifacts, reports and document exports. |
| Receptionist panel | `/receptionist/[[...path]]` → doctor routes | Same panel surface with permission- and clinic-scoped access restrictions. |

### 2.4 Admin / manager dashboard (`app/admin/*`)
| Area | Representative routes/pages | Key capabilities |
|---|---|---|
| Operations overview | `/admin`, `/admin/reports` | Dashboard metrics/reporting. |
| People & org | `/admin/doctors`, `/admin/managers`, `/admin/patients`, `/admin/clinics` | Manage doctors/managers/patients/clinics within business scope. |
| Appointments & billing | `/admin/appointments`, `/admin/billing` | Cross-clinic operational/billing visibility and actions (scope-limited). |
| Support & settings | `/admin/support`, `/admin/settings` | Support workflows and tenant/admin configuration. |

### 2.5 Patient portal (`app/patient/*`)
| Area | Representative routes/pages | Key capabilities |
|---|---|---|
| Home & profile | `/patient`, `/patient/profile`, `/patient/settings`, `/patient/notifications` | Patient dashboard, profile/preferences/notifications. |
| Care journey | `/patient/appointments`, `/patient/history`, `/patient/prescriptions`, `/patient/lab-reports` | Booking/history, prescriptions, reports/results access. |
| Billing & support | `/patient/billing`, `/patient/support` | Patient billing views/support tickets. |
| Emergency/SOS | `/patient/sos`, emergency-related pages | Raise/track SOS, live status/stream consumption. |

### 2.6 Super-admin (`app/super-admin/*`)
| Area | Representative routes/pages | Key capabilities |
|---|---|---|
| Platform administration | `/super-admin`, `/super-admin/users`, `/super-admin/doctors`, `/super-admin/clinics` | Global/platform-level management. |
| Payments & comms | `/super-admin/payments`, `/super-admin/email-setup` | Payment oversight and email/integration setup. |
| Content/masters/support | `/super-admin/landing`, `/super-admin/masters`, `/super-admin/support`, `/super-admin/audit`, `/super-admin/settings` | CMS/landing, master data, support, audit visibility, platform settings. |
| Files | super-admin file access routes/pages as applicable | Controlled file serving for privileged roles. |

### 2.7 Vendor / tokenized flows
| Area | Representative routes/pages | Key capabilities |
|---|---|---|
| Vendor upload | `/vendor/upload-test/[token]` | Token-gated external/vendor upload workflow. |

## 3. Inventory of web APIs and callable backend endpoints

> Counts are repository-based: **~123** API route files under `app/api/**/route.ts`, **~131** exported HTTP handlers total across app route/page files, **57** `"use server"` files (server actions). Below is a concrete namespace/endpoint inventory grouped by purpose.

### 3.1 Health, cron, and public/system endpoints
| Endpoint | Methods (expected/exported in codebase) | Purpose | Auth/notes |
|---|---|---|---|
| `/api/health` | `GET` | Health/readiness-style response. | Public/system; minimal/cached appropriately. |
| `/api/cron/expire-sos` | `GET`/`POST` (cron-invoked pattern) | Expire/escalate stale SOS requests via dispatch logic. | `x-vercel-cron` or `Authorization: Bearer $CRON_SECRET` (and/or PAT fallback per implementation); no-store. |
| `/api/emergency/stream` | `GET` (stream/SSE-like pattern) | Emergency live updates stream. | Auth/role/scope guarded. |
| `/api/doctors/[id]/photo` | `GET` (and related asset serving patterns) | Serve doctor/public-facing photo assets as applicable. | Route-specific access/public rules. |
| `/api/public/file/[...path]` | `GET` | Serve allowlisted CMS/public assets (`landing|blogs`, constrained types). | Public, path/type allowlisted, immutable caching, containment checks. |
| `/api/super-admin/file/[...path]` | `GET` | Serve files from storage to super-admin. | Super-admin only, path containment, restrictive headers. |
| `/api/consents/[slug]/file` | `GET` | Serve consent artifact bound to slug. | Patient link or authorized doctor session; no-store; containment checks. |
| `/api/prescriptions/[consultationId]` | `GET`/PDF-oriented handler | Prescription/consult document access. | Authenticated and ownership/scope-checked. |

### 3.2 Doctor-scoped APIs (`/api/doctor/*`)
Representative endpoints (namespace inventory): appointments (including export/status/operations), billing (including PDF), consult-pdf, patients export, profile photo/signature/logo uploads, staff management, test-bookings/results/report actions, schedule/slots-related operations, emergency/SOS doctor actions, consent/document operations, reports/exports.  
- **Purpose:** Support doctor dashboard UI, downloads/exports, file uploads, PDFs, and machine-readable operations that are awkward as server actions.
- **Auth:** `requireApi*`/permission/doctor-panel guards, tenant/practice scoping, ownership checks; receptionist access only where permitted and scope-resolved.

### 3.3 Admin APIs (`/api/admin/*`)
Representative endpoints: admin dashboard data/management operations for doctors, managers, patients, appointments, billing, clinics, reports, support, settings/permissions.  
- **Purpose:** Admin/manager operational surfaces and exports.
- **Auth:** Admin-tier/role/permission guards, business scope (`owner`/`manager`) enforcement.

### 3.4 Patient APIs (`/api/patient/*`)
Representative endpoints: available-slots, appointments-related reads/actions, SOS status/stream helpers, test reports (including summarize endpoint), profile/notification/document access.  
- **Purpose:** Patient portal and mobile-aligned patient operations, streaming/status, document/report access.
- **Auth:** Patient session/ownership checks; no-store/private handling for sensitive data.

### 3.5 Super-admin APIs (`/api/super-admin/*`)
Representative endpoints: users/doctors/clinics/payments/support/audit/settings/landing/masters/email setup, exports, file serving.  
- **Purpose:** Platform administration, reporting, and privileged operations.
- **Auth:** `super_admin` role/guard enforcement.

### 3.6 Mobile APIs (`/api/mobile/*`, plus helpers)
Representative namespaces: `session`, `device-tokens`, `doctor/*`, `patient/*`, `admin/*`, `super/*`, `emergency/*`, profile/notification/support-related mobile routes. Shared helpers in `app/api/mobile/_helpers.ts` (`apiOk`, `apiErr`, mobile auth wrappers, scoped doctor ID/anchor resolution).  
- **Purpose:** Native/mobile client backend with normalized JSON envelopes, session exchange/renewal/logout, push token registration, emergency flows, and role-scoped mobile data access.
- **Auth:** Mobile session/token handling, role guards, proxy CORS/origin/mutation protections, per-route throttling and scope checks.

### 3.7 Public/partner/integration APIs
| Endpoint/namespace | Purpose | Auth/notes |
|---|---|---|
| `/api/integrations/email-check` | Email validation/reference integration. | Guarded/rate-limited as applicable. |
| `/api/integrations/geo-data`, `/api/integrations/geocode` | Geo/reference lookups. | Public/internal usage patterns vary by route; external API dependencies. |
| `/api/integrations/holidays` | Holiday/reference data. | Integration-backed lookup. |
| `/api/integrations/pincode` | India pincode/reference lookup. | Integration-backed lookup. |
| `/api/integrations/reference`, `/api/integrations/weather` | Reference/weather data services. | External-provider backed. |
| `/api/packages/order`, `/api/packages/verify`, `/api/packages/webhook` | Subscription/package checkout, payment verification, Razorpay webhook fulfillment. | Session/auth where applicable for order/verify; webhook signature/HMAC verification required; idempotent fulfillment boundary. |
| `/api/shule/doctors` | Partner/integration doctor directory (read-only export-style listing). | Bearer PAT auth, minimum staff tier/scopes, tenant-bounded doctor visibility (`lib/auth/integration-scope.ts`). |

### 3.8 Callable server-side endpoints (non-`app/api`)

**Server Actions (`"use server"`) — 57 files (colocated/shared):**
- `app/(auth)/login/actions.ts`, `app/(auth)/forgot-password/actions.ts`, `app/(auth)/reset-password/*`, `app/(auth)/signup/actions.ts`, `app/(auth)/signup/otp-actions.ts`
- `app/(marketing)/...` (e.g. contact/consent/pricing-related actions where present)
- `app/admin/**/actions.ts`, `app/doctor/**/actions.ts`, `app/patient/**/actions.ts`, `app/super-admin/**/actions.ts`, `app/vendor/**/actions.ts`
- `lib/actions/auth.ts`, `lib/actions/inventory.ts`, `lib/actions/permissions.ts`, `lib/dispatch/actions.ts`, `lib/push/actions.ts`

**Typical responsibilities:** form mutations, CRUD/state transitions, validation (zod), permission/scope enforcement, audit logging, revalidation, redirects, and side effects (mail/push/dispatch/payment fulfillment hooks).

**Other callable backend surfaces:** Next.js page/layout/server-component rendering, route-handler streaming/download endpoints, and cron/webhook entrypoints listed above.

## 4. Feature → implementation mapping (important flows)

| Feature | UI/pages/components (representative) | Backend endpoint(s) / server action(s) | Data/auth/scope notes |
|---|---|---|---|
| Web login & session bootstrap | `app/(auth)/login/page.tsx`, auth forms | `app/(auth)/login/actions.ts`; session creation in `lib/auth/session.ts`; mobile equivalent `/api/mobile/session` | bcrypt verify, throttling/audit, `skora_session` cookie, role redirect, trial-expired doctor handling. |
| Signup & OTP | `app/(auth)/signup/*` | `app/(auth)/signup/actions.ts`, `otp-actions.ts`, mail helpers | Rate-limited registration/verification; DB-backed OTP/tokens. |
| Password reset | `app/(auth)/forgot-password/*`, `app/(auth)/reset-password/*` | forgot/reset server actions, `lib/mail/*` | Generic responses to reduce enumeration; token validation/expiry. |
| Marketing pages & blog | `app/(marketing)/*`, `components/marketing/*` | RSC queries `lib/queries/landing.ts`, `lib/queries/blog.ts`; public file serving `/api/public/file/[...path]` | Mostly public read paths; CMS/content tables in schema. |
| Public consent signing | `app/(marketing)/my-consent/[slug]/page.tsx` | `app/(marketing)/my-consent/[slug]/actions.ts`, `/api/consents/[slug]/file` | Slug/token-bound access, rate limiting, authorized file retrieval, containment/no-store. |
| Doctor dashboard shell/navigation | `app/doctor/layout.tsx`, `components/dashboard/*`, `components/dashboard/doctor-permission-gate.tsx` | `lib/auth/guard.ts`, `lib/auth/user.ts`, `lib/auth/permissions.ts`, `lib/auth/server-permissions.ts`, proxy permission hints | Server-authoritative RBAC + client UX gating; receptionist aliasing and route-permission mapping. |
| Appointment scheduling/management | `app/doctor/appointments/*`, `app/patient/appointments/*`, slot UIs | doctor/patient appointment actions; `/api/doctor/appointments*` (incl. export/status); `/api/patient/available-slots` | Ownership/clinic/practice scoping (`lib/queries/clinic.ts`, `lib/auth/action-scope.ts`, `ownership.ts`). |
| Consultations, prescriptions, PDFs | `app/doctor/consultations/*`, prescription views | doctor consult/prescription actions; `/api/doctor/consult-pdf`, `/api/prescriptions/[consultationId]`, billing/consult PDF routes | Clinical document generation via `@react-pdf/renderer`; scoped access and private caching. |
| Patient records & history | `app/doctor/patients/*`, `app/patient/history/*` | `lib/queries/doctor.ts`/`patient.ts`, patient/doctor actions, exports (`/api/doctor/patients/export`) | Tenant ownership checks; CSV/XLSX sanitization on exports. |
| Lab tests & reports | `app/doctor/lab-tests/*`, `app/patient/lab-reports/*` | doctor test-booking/actions, `/api/doctor/test-bookings*`, `/api/patient/test-reports/*` (incl. summarize) | Document/report access controls; possible AI-backed summarize endpoint (implementation-specific). |
| Billing & payments (packages) | `app/(marketing)/pricing/*`, admin/doctor/patient billing pages | `/api/packages/order`, `/api/packages/verify`, `/api/packages/webhook`; `lib/packages/razorpay.ts`, `lib/packages/fulfillment.ts`; billing actions/routes/PDFs | HMAC signature verification, idempotent fulfillment, scoped billing records/exports. |
| Inventory/products/packages/staff | `app/doctor/inventory/*`, staff pages, package UIs | `lib/actions/inventory.ts`, doctor/admin actions, `lib/queries/packages.ts` | Clinic-scoped mutations; role/permission gated. |
| Emergency/SOS/dispatch | patient/doctor emergency pages, SOS map/alarm components | `lib/dispatch/*` (actions/offers/geo/eta/escalation/expiry/hub), `/api/emergency/stream`, `/api/mobile/emergency/*`, `/api/patient/sos/*`, `/api/cron/expire-sos` | Multi-actor realtime-ish workflow, dispatch lifecycle, cron maintenance, strict auth/scope and push/device integration. |
| Notifications & push | dashboard/mobile flows, device registration UIs | `lib/push/*`, `lib/push/actions.ts`, `/api/mobile/device-tokens` | Web/native push tokens, role/user-targeted delivery; config/env dependent. |
| Admin/manager operations | `app/admin/*` | `app/admin/**/actions.ts`, `/api/admin/*`, `lib/queries/admin.ts`, `lib/auth/scope.ts` | Business-scope enforcement (owner vs manager), module permissions, clinic/doctor visibility limits. |
| Super-admin platform management | `app/super-admin/*` | `app/super-admin/**/actions.ts`, `/api/super-admin/*`, `lib/queries/super-admin.ts` | `super_admin` only; privileged exports/audit/content/masters/settings. |
| Partner/integration doctor listing | external consumers via API | `/api/shule/doctors`, `lib/auth/api-token.ts`, `lib/auth/integration-scope.ts` | Bearer PAT + scopes/staff tier + tenant-bounded doctor visibility. |
| Vendor token upload | `app/vendor/upload-test/[token]/*` | vendor actions/routes (tokenized), upload/media/file utilities | Token-gated access, upload size/type/path safety controls. |

## 5. Notable auth/role boundaries

| Boundary | Where enforced (representative) | Notes |
|---|---|---|
| **Public / anonymous** | marketing pages, `/api/public/file/*`, selected integration/reference endpoints | Public asset serving is allowlisted/path-contained; anonymous traffic and public actions may be rate-limited. |
| **Authenticated web session (cookie)** | `lib/auth/session.ts`, `proxy.ts`, role layouts, guards/actions/routes | JWT + DB revocable session (`skora_session`), IP/UA binding options, renewal/revocation semantics. |
| **Doctor** | `/doctor/*`, `/api/doctor/*`, many shared actions/queries | Doctor-panel access with trial gating; tenant/practice scoping via clinic ownership/membership. |
| **Receptionist** | `/receptionist/*` redirect alias + `/doctor/*` internals | Permission-filtered navigation and allowlisted operations; scoped clinic writes (`resolveClinicWriteScope`); not full doctor parity. |
| **Admin (owner)** | `/admin/*`, `/api/admin/*` | Business-owner scope across owned clinics/doctors; admin-tier/module permissions apply. |
| **Manager** | `/admin/*` (delegated), permission maps, proxy coarse gate | Restricted to permitted admin modules/clinics; redirected to first permitted admin path when needed. |
| **Patient** | `/patient/*`, `/api/patient/*` | Strict self/ownership checks for records, reports, billing, SOS, support. |
| **Super-admin** | `/super-admin/*`, `/api/super-admin/*`, `/api/super-admin/file/*` | Platform-wide privileged access; separate layout/guard enforcement. |
| **Mobile clients** | `/api/mobile/*`, `app/api/mobile/_helpers.ts`, `proxy.ts` | Mobile session/CORS/origin/mutation handling; normalized API envelopes; route-level role/scope/throttle. |
| **Integration/PAT callers** | `lib/auth/api-token.ts`, `lib/auth/integration-scope.ts`, `/api/shule/doctors`, cron/PAT fallbacks | Bearer token scopes/staff tiers/expiry/revocation; tenant-bounded data visibility to prevent cross-tenant enumeration. |
| **Webhook/cron** | `/api/packages/webhook`, `/api/cron/expire-sos` | Signature/secret-based trust (Razorpay HMAC, cron secret/header) rather than browser session cookies. |
| **Tokenized public/vendor/consent links** | `/vendor/upload-test/[token]`, `/my-consent/[slug]`, consent file route | Capability-style token/slug access with targeted validation, rate limiting, and file/path containment. |

## 6. Gaps / uncertainties noticed

1. **Not fully enumerated at handler level:** I did not read every one of the ~123 API route handlers or 57 server-action files line-by-line; this document inventories namespaces, representative endpoints, and verified patterns rather than a per-file contract for each export.
2. **HTTP method/export specifics vary:** Many routes were identified by path/namespace and sampled behavior; exact method sets, request/response schemas, and edge-case status codes should be confirmed per `route.ts` before client contract changes.
3. **UI-to-endpoint wiring is partly inferred:** Feature mapping combines route/action colocations, naming, and sampled usage; some pages may call additional helpers or APIs not exhaustively traced in this pass.
4. **AI/summarization implementation details:** `/api/patient/test-reports/[id]/summarize/route.ts` exists, but provider/model/runtime behavior, prompt/content handling, and failure modes were not deeply audited here.
5. **Realtime semantics:** Emergency/SOS "stream" behavior (SSE vs polling/fetch streaming specifics) and client reconnection guarantees should be validated in the concrete route/component implementations.
6. **PWA/service worker behavior:** Presence of `manifest.ts`, `sw.ts`, offline route, and PWA components is confirmed; caching/update strategies and offline data guarantees need dedicated review.
7. **Config-dependent integrations:** Mail, push (web/native), Razorpay, Redis rate limiting, and external India/public APIs depend on environment configuration; some paths may be disabled or degraded in local/default setups.
8. **Test/operational caveats:** README notes DB-backed tests mutate a shared `db` singleton and are not hermetic; this does not affect runtime architecture but matters for change validation confidence.
9. **Receptionist parity edge cases:** Permission maps and scoped write helpers define intended boundaries, but any specific receptionist-allowed mutation should be verified against the exact action/route guard used by that screen.
10. **Generated/large schema and query surface:** With 61 tables and many query modules, this audit focuses on major domains; less common tables/flows may have additional endpoints or constraints not highlighted above.

## 7. Key repository references

- **App shell/routing:** `app/layout.tsx`, `app/(marketing)/layout.tsx`, `app/(auth)/*`, `app/admin|doctor|patient|super-admin/layout.tsx`, `app/receptionist/[[...path]]/page.tsx`, `proxy.ts`, `next.config.ts`
- **Auth/security:** `lib/auth/session.ts`, `user.ts`, `guard.ts`, `permissions.ts`, `server-permissions.ts`, `scope.ts`, `action-scope.ts`, `ownership.ts`, `api-token.ts`, `integration-scope.ts`, `trial.ts`, `lib/security/rate-limit.ts`, `csrf.ts`
- **Data/domain:** `lib/db/index.ts`, `lib/db/schema.ts`, `drizzle/*`, `lib/queries/*`, `lib/dispatch/*`, `lib/packages/*`, `lib/push/*`, `lib/files/*`, `lib/uploads/*`
- **UI/components:** `components/dashboard/*`, `components/marketing/*`, `components/doctor/*`, `components/emergency/*`, `components/sos/*`, `components/pwa/*`, `components/pdf/*`, `components/ui/*`
- **APIs/actions:** `app/api/**/route.ts`, `app/**/actions.ts`, `app/api/mobile/_helpers.ts`
- **Docs/config:** `README.md`, `.env.example`, `package.json`, `scripts/*`
