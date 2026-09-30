# Admin (Super-Admin + Vendor) Dashboard Verification Report

**Scope:** All routes under `app/super-admin/**` (12 pages + shared `actions.ts`), the vendor area `app/vendor/**`, admin-facing API routes (`app/api/super-admin/**`), the query layer (`lib/queries/super-admin.ts`, `lib/queries/support.ts`, `lib/packages/fulfillment.ts`), shared auth guards (`lib/auth/guard.ts`, `lib/auth/user.ts`), the shared permission actions reused from `app/doctor/roles/actions.ts`, and middleware (`proxy.ts`).

**Method:** Full source read of every admin route, component, server action, query, and backing API route. No files were modified. Static verification only (no live server run). Next.js 16 App Router conventions (async `params`/`searchParams` promises) verified throughout.

**Verdict:** The super-admin dashboard is **fully implemented and well-built**. All 12 pages exist, are wired to real queries and server actions, are auth-guarded at both the layout and action layer, and every action writes an audit-log entry. CRUD is complete for users, doctors (status/permissions), clinics, master data (+import/export), blogs (+categories), support (tickets + videos), landing CMS, mail settings, and company settings. The vendor area is a single token-gated public upload page and is correctly implemented for what it is. One **high**-severity data-loss bug was found in the user edit form, plus a handful of medium/low issues. No critical defects.

---

## Route Inventory

| Route | File | Status |
|---|---|---|
| `/super-admin` (dashboard home) | `app/super-admin/page.tsx` | PASS (with findings) |
| `/super-admin/doctors` | `app/super-admin/doctors/page.tsx` | PASS |
| `/super-admin/doctors/[id]` | `app/super-admin/doctors/[id]/page.tsx` | PASS |
| `/super-admin/clinics` | `app/super-admin/clinics/page.tsx` + `clinics-panel.tsx` | PASS |
| `/super-admin/users` | `app/super-admin/users/page.tsx` + `users-table.tsx` | **ISSUE (high)** |
| `/super-admin/payments` | `app/super-admin/payments/page.tsx` | PASS (with findings) |
| `/super-admin/masters` | `app/super-admin/masters/page.tsx` + `master-panel.tsx` | PASS (with findings) |
| `/super-admin/blogs` | `app/super-admin/blogs/page.tsx` + `blog-manager.tsx` | PASS (with findings) |
| `/super-admin/support` | `app/super-admin/support/page.tsx` + 5 components + `actions.ts` | PASS (with findings) |
| `/super-admin/audit-logs` | `app/super-admin/audit-logs/page.tsx` + `audit-log-table.tsx` | PASS (with findings) |
| `/super-admin/landing` | `app/super-admin/landing/page.tsx` + `landing-editor.tsx` | PASS |
| `/super-admin/email-setup` | `app/super-admin/email-setup/page.tsx` + `mail-settings-form.tsx` | PASS |
| `/super-admin/settings` | `app/super-admin/settings/page.tsx` + `company-settings-form.tsx` | PASS (with findings) |
| `/vendor/upload-test/[token]` | `app/vendor/upload-test/[token]/page.tsx` + `upload-form.tsx` + `actions.ts` | PASS |

Supporting APIs (all verified):

- `GET /api/super-admin/file/[...path]` — `app/api/super-admin/file/[...path]/route.ts`
- `GET /api/super-admin/masters/[kind]/export` (xlsx) — `app/api/super-admin/masters/[kind]/export/route.ts`
- `GET /api/super-admin/support/export` (CSV) — `app/api/super-admin/support/export/route.ts`

Server actions (all in `app/super-admin/actions.ts` unless noted): users (`storeUser`, `updateUser`, `toggleUserStatus`), doctors (`saveDoctorPermissions`), clinics (`storeClinic`, `updateClinic`, `deleteClinic`), masters (`storeMasterItem`, `updateMasterItem`, `deleteMasterItem`, `importMasterItems`), categories (`storeCategory`, `updateCategory`, `deleteCategory`), blogs (`storeBlog`, `updateBlog`, `deleteBlog`), support (`closeTicket`, `setTicketPriority`, `storeSupportVideo`, `deleteSupportVideo`, plus `adminReplyToTicket` in `app/super-admin/support/actions.ts`), landing CMS (`updateLandingSection`, `storeLandingItem`, `updateLandingItem`, `deleteLandingItem`, `reorderLandingItem`), settings (`saveMailSettings`, `testMailSettings`, `saveCompanySettings`).

---

## Layout & Navigation

**PASS** — `app/super-admin/layout.tsx`

- `requireRole(["super_admin", "admin"])` at the segment root (`lib/auth/guard.ts`): unauthenticated → `/login`; wrong role → role home. Protects all 12 child routes in one place, and every page *also* re-checks the role (defense in depth).
- NAV lists 12 items; every `href` resolves to an existing page — no orphaned or dead links. `DashboardShell` receives name/role/email/photo; footer links back to the public site.
- Every server action in `actions.ts` calls `requireAdmin()` (re-checks session + `super_admin`/`admin` role) before touching the database — server actions are not reachable by role escalation through the UI.
- `proxy.ts` only sets security headers (CSP, HSTS, X-Frame-Options, etc.) and the receptionist rewrite; the layout/action guards are the route enforcement points. Appropriate.

---

## Page-by-Page Findings

### 1. `/super-admin` — Dashboard home

**PASS (with findings)** — Parallel `Promise.all` load of 6 datasets (stats, doctors, doctor/patient growth, top clinics, recent tickets); 4 StatCards; two MiniBarChart growth panels; top-clinics and recent-tickets panels with empty states; recent-doctors table (sliced to 8); 5 quick-action links, all resolving to real pages.

- **ISSUE (medium)** — **Top-clinics revenue fans out for multi-clinic doctors.** `getTopClinics` (`lib/queries/super-admin.ts:95-110`) joins `billings → users → doctorClinics` on **doctorId**, then groups by clinic id. A doctor with 2+ active clinics gets every bill counted once *per active clinic*, so the same revenue appears under multiple clinics and totals are inflated. Bills should carry (or be joined through) the clinic the bill belongs to, or the join should pick one clinic per doctor.
- **ISSUE (low)** — `getDoctors()` is called with no search and no limit, fetching **all** doctor rows only to slice 8 in the UI (`page.tsx:31,142`). Add a limited variant for the dashboard.
- **ISSUE (low)** — `getSuperAdminStats` computes `staff` and `blogs` counts and hardcodes `monthlyRevenue: 0` (`lib/queries/super-admin.ts:39-47`); none are displayed. Dead data — surface or drop (a "monthly revenue: 0" card would be misleading if ever wired up).

### 2. `/super-admin/doctors` + `/super-admin/doctors/[id]`

**PASS** — Card grid of all doctors via `getDoctors(search)` with name/email/phone LIKE search; each card shows contact, qualification, registration number, joined date, trial-end date, a **Permissions** dialog, and an **Activate/Deactivate** toggle; detail page renders profile + clinics with `notFound()` for invalid/non-existent ids and `force-dynamic`.

- `DoctorStatusToggle` reuses `toggleUserStatus` — super-admin accounts are rejected server-side, errors surface via `alert()`, state + `router.refresh()` on success. Correct.
- `DoctorPermissionsDialog` reuses the doctor-side read actions `getAllPermissions` / `getUserPermissionNames` (`app/doctor/roles/actions.ts`), which explicitly admit `super_admin`/`admin` (`canViewPermissionData`, lines 32-40, and 226-242). Save goes through `saveDoctorPermissions`, which normalizes child-permission selection to imply the module, validates the target is a real doctor, and replaces permissions **inside a transaction** (`actions.ts:514-523`) so a crash can't leave a doctor locked out. Solid.

### 3. `/super-admin/clinics`

**PASS** — Full CRUD. `ClinicsPanel` with create/edit modal forms (`useActionState`), two-step confirm delete, empty state, doctor-ownership display. Server side:

- `validateClinicForm` enforces doctor, name, address type (manual/map), phone, and non-negative fee; map addresses synthesize an address string from lat/lng.
- Logos are saved via magic-byte sniffing (`sniffImage`: jpg/png/webp/gif), 2 MB cap, UUID filenames under `storage/uploads/clinic` (outside `public/`); replaced logos are deleted with a path-safe `deleteUpload` guard (`DATE_SAFE` regex, `actions.ts:145-150`).
- `deleteClinic` deactivates dependent schedules and deletes the clinic in **one transaction**; orphan-file cleanup after commit. Correct.

### 4. `/super-admin/users`

**ISSUE (high)** — see below. Otherwise a well-built page: role filter chips, search, server-side pagination with a count query, responsive (mobile card list via `UsersList` + desktop table), self-identification ("(you)"), and guards hiding the toggle for self/super-admins.

- **ISSUE (high)** — **Editing any user wipes their qualification and registration number.** In `users-table.tsx` the `UserForm` qualification and registration-number inputs have **no `defaultValue`** (lines 105-112), and the `UserRow` type doesn't even carry those fields — `getUsers` (`lib/queries/super-admin.ts:249-274`) doesn't select them. On submit, `updateUser` executes `qualification: qualification || null` / `registrationNumber: registrationNumber || null` (`actions.ts:426-427`), so **every save of the edit dialog erases both columns** for that user (including doctors, whose registration number is shown on the doctors page). Fix: select both columns in `getUsers`, add them to `UserRow`, and prefill the inputs.
- **ISSUE (medium)** — **Privilege escalation: a plain `admin` can create a `super_admin`.** `storeUser` accepts any of `VALID_ROLES` (includes `super_admin`) and `requireAdmin()` admits both `super_admin` and `admin` (`actions.ts:64-69`). The only guard is that you cannot *change the role of an existing* super admin — creating a brand-new super-admin account is allowed. Restrict `super_admin` role assignment to `super_admin` actors.
- **ISSUE (medium)** — **`updateUser` bypasses the super-admin protection that `toggleUserStatus` enforces.** The toggle action refuses to change a super admin's status (`actions.ts:460`), but `updateUser` only blocks *role changes* on super admins — an admin can still set a super admin's `status` to `inactive` (or change their email/password) through the edit dialog. Align the guards.
- **ISSUE (low)** — Pagination links build URLs with unencoded interpolation: `` `/super-admin/users?role=${role}&q=${q ?? ""}&page=${p}` `` (`page.tsx:79`). A search term containing `&`, `#`, or `+` corrupts the query. Use `encodeURIComponent` / `new URLSearchParams`. (Same pattern in audit-logs, below.)
- **ISSUE (low)** — One page link is rendered per page (`page.tsx:76-88`); at scale this becomes hundreds of links. Use a windowed pager or prev/next.
- Note (PASS): creation is transactional with registration-id collision retry (`insertAdminUser`, `actions.ts:222-275`), self-demotion/self-deactivation is blocked, doctor demotion is blocked while patients/staff/clinics remain linked (`actions.ts:375-398`), password/role/status changes revoke all sessions (`actions.ts:439-442`), and admin-created doctors receive the default module permissions (documented legacy-parity fix, `actions.ts:207-219`). All well done.

### 5. `/super-admin/payments`

**PASS** — Read-only ledger of package payments via `getRecentPackagePayments(100)` (`lib/packages/fulfillment.ts:110`): date, doctor, package, period, amount (paise→INR), status badge, access-until, Razorpay order/payment ids; empty state included. Read-only is the right call — payment rows are created by the webhook/fulfillment flow, not by hand.

- **ISSUE (low)** — Hard cap of 100 rows with no pagination or date filter; fine at launch, not at scale. An export (like support's CSV) would fit the established pattern.

### 6. `/super-admin/masters`

**PASS (with findings)** — Tabbed panel (symptoms / examinations / diagnoses / lab-tests / medicines) over `getMasterData(kind)`; per-tab create/edit modal (medicines get strength/form/unit), two-step confirm delete, xlsx/csv **import** with a header row, 1000-row cap, and 5 MB limit, plus a per-kind **xlsx export** API. Kind is whitelisted via `MASTER_TABLES` — arbitrary table access is impossible.

- **ISSUE (low)** — `importMasterItems` does a duplicate-check query **per row** (N+1, `actions.ts:893`) and is not wrapped in a transaction, so a mid-loop failure leaves a partial import. Fetch all existing names once and insert in bulk inside a transaction.
- **ISSUE (low)** — CSV parsing is naive (`line.split(",")` with only full-cell quote stripping, `actions.ts:867`); quoted cells containing commas are misparsed. Acceptable for the simple name/strength/form/unit schema, but worth a note.
- Note (PASS): the export API re-guards with `requireRole(["super_admin", "admin"])` and whitelists kinds.

### 7. `/super-admin/blogs`

**PASS (with findings)** — Full blog + category CRUD. `BlogManager` with create/edit post modal (title, category, cover image, short summary, content, status, publish-at), post table with status badges and two-step confirm delete, and a category chip strip with per-category edit/delete and blog counts.

- **ISSUE (low)** — **The form offers "Uncategorized" but the action rejects it.** The category select includes `<option value="">Uncategorized</option>` (`blog-manager.tsx:76`), yet both `storeBlog` and `updateBlog` return `"A category is required."` for an empty value (`actions.ts:1051-1053`, `1127-1129`). Every new-post save via that default is a guaranteed error round-trip. Either drop the option or make the category optional server-side.
- **ISSUE (low)** — `updateBlog` does not validate `title.length > 255` (its sibling `storeBlog` does, `actions.ts:1032`); over-long titles rely on the DB column to reject/truncate.
- Note (PASS): slugs are auto-generated with collision-safe retry (`uniqueSlug`, `actions.ts:1005-1017`); title-only edits keep the existing slug (URLs stay stable, `actions.ts:1141`); images are magic-byte-sniffed with old-file cleanup; category deletion is blocked while blogs reference it (`actions.ts:988-993`); blog deletion removes child images + blog in one transaction.

### 8. `/super-admin/support`

**PASS (with findings)** — Ticket inbox (all tickets with subject, requester, role, `timeAgo`, priority select, close button, status badge, full message thread with admin replies rendered as support-team bubbles, reply composer), CSV export button, and a support-videos manager (YouTube link or file upload) below.

- **ISSUE (medium)** — **Admin replies never notify the ticket owner.** `adminReplyToTicket` (`support/actions.ts:10-33`) inserts the message and revalidates, but sends no email/in-app notification and no audit entry — the doctor/patient only sees the answer if they happen to revisit the support page. The vendor upload flow in this same codebase demonstrates the expected pattern (`notifyUser` + `sendMail`, fire-and-forget). Also: it doesn't verify the ticket exists or reject replies to closed tickets, and it inserts for arbitrary `ticketId` values.
- **ISSUE (low)** — `TicketCloseButton` ignores the `closeTicket` result entirely (`ticket-close-button.tsx:14`): on server-side failure the button resets and `router.refresh()` runs with no feedback. Same class of bug as the patient cancel button; surface `res.error`.
- **ISSUE (low)** — `TicketPrioritySelect` refreshes even when `setTicketPriority` errors and never surfaces the error message (`ticket-priority-select.tsx:31-34`) — the select snaps back via refresh, but the user gets no explanation.
- Note (PASS): video uploads enforce 200 MB cap + magic-byte container sniffing (mp4/webm/mov), stored outside `public/` and served only through the guarded file API; `next.config.ts` raises `serverActions.bodySizeLimit` to `200mb` so the action limit is reachable.

### 9. `/super-admin/audit-logs`

**PASS (with findings)** — Filterable (distinct actions from `getAuditActions`), paginated (50/page) audit table with action badge, user, time, IP, and an expandable pretty-printed metadata row. Empty state included. Every admin mutation across `actions.ts` writes an audit event — verified across users, clinics, masters, categories, blogs, tickets, videos, landing, and settings.

- **ISSUE (low)** — Pagination/filter links interpolate raw values: `` `?action=${action ?? ""}&page=${currentPage ± 1}` `` (`page.tsx:54-57`). Works today because actions are slugs, but it's the same unencoded-URL pattern as users.
- **ISSUE (low)** — "Showing N entries" + Next/Prev only (no total count), so the pager can't indicate depth. Cosmetic.

### 10. `/super-admin/landing`

**PASS** — Full CMS editor over `getLandingSectionsAdmin()` (all sections incl. inactive, items ordered): per-section edit modal (heading, subheading, optional JSON metadata with server-side parse/merge, visibility), per-item create/edit modal (title, description, badge, link, icon, image, monthly/yearly + original prices, features list, stars, visibility), item reorder (up/down), and two-step confirm delete. Thumbnail previews via `publicUploadUrl`.

- Note (PASS): `reorderLandingItem` swaps both `order` values in one transaction (`actions.ts:1565-1574`), edges are no-ops, and metadata merge is validated JSON. Prices are stored as fixed strings; stars are number-validated by the input but only range-validated client-side (`min=0 max=5`) — the action accepts any number (`actions.ts:1426`). Trivial.

### 11. `/super-admin/email-setup`

**PASS** — SMTP form (host, port, username, encryption select, password, from address/name) pre-filled from the saved row (password never echoed back — "leave blank to keep" semantics, stored via `encryptSecret`), a **Send test email** button that actually exercises `sendMail` and reports success/failure inline, and a sender-identity panel fed from company settings. `saveMailSettings` validates host/port/from-address; `testMailSettings` requires saved settings first and audits the attempt.

### 12. `/super-admin/settings`

**PASS (with findings)** — Company profile, branding (light/dark logo + favicon with live file preview and stored-name fallback), currency, default doctor trial days, and social/map fields, all saved via `saveCompanySettings` with insert-or-update semantics and old-logo cleanup.

- **ISSUE (low)** — Server-side validation is thin: only `default_trial_days` (1-365) is validated; emails, URLs, and phone fields accept anything (the form marks emails `type="email"` but the action doesn't). Self-inflicted misconfiguration only; low.

---

## API Routes (admin-facing)

**PASS** — all three re-verify the session and role themselves (defense independent of the pages):

- `GET /api/super-admin/file/[...path]` — serves clinic/blog/landing/company/support-videos uploads from `storage/uploads`. Correct layering: 401 unauthenticated → 403 non-admin → directory **allowlist** (`clinic`, `blogs`, `landing`, `company`, `support-videos`) → per-segment regex (`/^[a-zA-Z0-9._-]+$/`, blocks `..`/separators) → `path.resolve` + prefix check → extension→Content-Type allowlist → SVG served with a no-exec CSP. Legacy `uploads/` prefix normalized. No traversal, no MIME-sniffing hazards. Textbook.
- `GET /api/super-admin/masters/[kind]/export` — `requireRole` guard, kind whitelist, xlsx via ExcelJS. PASS.
- `GET /api/super-admin/support/export` — manual role check, CSV with quote escaping, `Cache-Control: private, no-store`. PASS. (Message threads aren't included in the export — minor, likely intentional.)

---

## Vendor Area

**PASS** — `app/vendor/upload-test/[token]` (page + `upload-form.tsx` + `actions.ts`)

The vendor "area" is a single **public, token-gated** report-upload page — no vendor login exists anywhere in the app (the `vendors` table only supplies a display name). This matches the documented legacy-parity design (IMPLEMENTATION_PLAN.md:332) and is correctly scoped: a token grants access to exactly one test booking, nothing else. Verified end-to-end:

- Page: 404s on unknown token (`notFound()`), shows booking context (doctor, vendor, patient, tests), and short-circuits to an "already uploaded" state for completed bookings. Patient name is shown; the selected phone is never rendered — no PII leakage beyond the name.
- Action `uploadTestReport`: re-validates the token server-side; rejects cancelled bookings and already-completed/replaced reports; enforces 5 MB max; **magic-byte** sniffing (PDF incl. BOM-prefixed, JPEG, PNG — spoofed extensions rejected); stores outside `public/` with a UUID filename; and performs a **conditional UPDATE** (`uploadedFilePath IS NULL AND status IN ('pending','in-progress')`, `actions.ts:89-105`) so two concurrent uploads cannot both win — the loser gets a clean error instead of overwriting the file. Race-safe.
- Fire-and-forget doctor email + in-app notification with a catch; `revalidatePath("/doctor/test-bookings")`; audit entry written. Correct.
- Upload form: drag-style picker, client+server accept-list, inline success/error messaging, disabled state while busy. Correct.

- **GAP (low)** — No `/vendor/upload-test` index route: visiting it 404s. Deep links are the only entry (generated by the doctor's test-bookings table via `uploadLinkToken`, with a regenerate action at `app/doctor/test-bookings/actions.ts:569`). Acceptable by design, but a small "invalid link" landing page would be friendlier than a bare 404.
- **ISSUE (low)** — Upload tokens never expire and there is no "disable link" flag; only manual regeneration invalidates one. The page copy says "Secure link" and the error message says "Invalid or expired," but expiry doesn't exist. (Overlap with the rbac-auth review; noted here for completeness.)

---

## Cross-Cutting Observations

- **Auth consistency:** every page calls `requireRole(["super_admin", "admin"])`, every action calls `requireAdmin()`, every API route re-checks. No page or action relies on the layout guard alone. PASS.
- **Audit coverage:** all mutating actions log via `audit.*` with actor id and contextual metadata — verified across users, clinics, masters, categories, blogs, tickets, videos, landing, and settings. **ISSUE (low, cosmetic)** — several non-file actions are logged under mismatched categories (`clinic_*`, `support_video_*` via `audit.fileUploaded`; `ticket_*` via `audit.supportTicketCreated`), skewing action-type filters on the audit page.
- **Caching directives:** only `audit-logs`, `support`, and `doctors/[id]` export `dynamic = "force-dynamic"`; the rest rely on `cookies()` via `getCurrentUser` making them dynamic anyway. Consistent behavior, inconsistent declaration. **ISSUE (low).**
- **Error/loading boundaries:** no `error.tsx`/`loading.tsx` at the super-admin or vendor segments; the global `app/error.tsx` + `app/not-found.tsx` cover crashes and 404s. **GAP (low)** — no loading skeletons for the heavy dashboard home (6 parallel queries) or audit-logs.
- **Shared UI:** all pages use `PageHeader` / `StatCard` / `StatusBadge` / `EmptyState` / `data-table` / `table-shell` primitives with consistent spacing, tone classes, and two-step confirm-destructive patterns. Design quality is uniform and strong. PASS.
- **Modal forms** all follow the same `useActionState` + `state !== initialState && state.error === null` success contract with `router.refresh()` — verified in users, clinics, masters, blogs, videos, and landing. PASS.

---

## Summary

| Severity | Count | Items |
|---|---|---|
| Critical | 0 | — |
| High | 1 | User edit wipes `qualification`/`registrationNumber` (`users-table.tsx:105-112` + `actions.ts:426-427`) |
| Medium | 4 | `admin` can create a `super_admin` (`storeUser`); `updateUser` can deactivate a super admin (parity break vs `toggleUserStatus`); top-clinics revenue fans out per active clinic (`getTopClinics`); admin replies never notify the ticket owner (`adminReplyToTicket`) |
| Low | 14 | Unencoded pagination/search URLs (users + audit-logs); unwindowed pager; payments 100-row cap; masters import N+1 + non-transactional + naive CSV; blog "Uncategorized" dead option; `updateBlog` missing title-length check; `TicketCloseButton` ignores errors; `TicketPrioritySelect` swallows errors; vendor tokens never expire; settings validation thin; dashboard `getDoctors()` overfetch; dead stats fields; `force-dynamic` inconsistency; audit-category mislabeling |
| GAP | 2 | No vendor index/landing route; no segment-level `loading.tsx`/`error.tsx` |

**Bottom line:** Both admin surfaces are production-quality: complete CRUD, consistent auth/audit discipline, transactional multi-step writes, magic-byte-validated file handling with path-safe storage, race-safe vendor uploads, and a well-designed, uniform UI. Fix the high-severity user-edit data loss first; the privilege-escalation and super-admin-status parity issues should follow; the rest are polish.
