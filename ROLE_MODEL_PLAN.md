# Role & Permission Model — Implementation Plan

> Status: **IMPLEMENTED (phases 1–5).**
> Verified against the codebase on 2026-10-01 (guards, scopes, seeds, e2e contracts).
> Decisions below are confirmed by the product owner.
>
> Implemented: doctor default = clinical core (Phase 4); manager permission
> editor + finance template (Phase 2); receptionist_clinics migration 0011 +
> owner assignment UI + booking enforcement (Phase 3); six owner-parity
> modules under /admin (Phase 1); route map + nav + firstPermittedAdminPath
> updates (Phase 5). Remaining: apply migration 0011 + reseed, run e2e
> (Phase 6).

## 1. Target role model

```
Super Admin  → "PMS Admin"      → full platform, /super-admin        (exists, relabel only)
Admin        → Business Owner   → /admin: /doctor's full module set minus Emergency
                                   + teams (managers, staff) + clinics + settings
Manager      → per-clinic ops   → /admin, clinics owner assigned, template:
                                   full clinic ops incl. Billing + Income & Expense,
                                   owner-trimmable per manager
Receptionist → per-clinic ops   → /receptionist, only clinics assigned via
                                   receptionist_clinics; booking/appointments/registrations/
                                   test-bookings/follow-ups/billing at those clinics
Doctor       → clinical core    → Dashboard, Appointments, Schedule, Consultations,
                                   Follow-ups, Support; own appointments only (rule kept);
                                   clinic-wide list = owner/manager/receptionist only
Patient      → own data         → /patient (already correct)
```

### Confirmed decisions

| # | Question | Decision |
|---|---|---|
| D1 | Which doctor modules does the Business Owner also get? | **All except Emergency** (Home Visit, Chat, Shop, Support, Consultations, Online Consultations) |
| D2 | Do managers get finance modules? | **Full ops incl. finance** — Billing + Income & Expense in the template, owner-trimmable |
| D3 | Default modules for a NEW doctor? | **Clinical core**: dashboard, appointments, schedule, follow-up, support (consultations is nav-mapped to `dashboard`) |
| D4 | Doctor visibility across the clinic? | **Keep own-only** (privacy rule in `lib/queries/clinic.ts` stays; clinic-wide views are owner/manager/receptionist) |

## 2. Verification: target model vs current implementation

| Target role | Current implementation | Verdict |
|---|---|---|
| **Super Admin = PMS Admin** | `/super-admin`: platform stats, all doctors/clinics/businesses/users, payments, masters, blogs, support, audit logs, landing CMS, email, settings. Strict `super_admin` gates everywhere. | ✅ Matches — cosmetic label change only |
| **Admin = Business Owner** | `/admin`: Overview, Schedule, Registrations, Appointments, Follow-ups, Test Bookings, Billing, Income & Expense, Clinics CRUD, Managers, Business Settings, Clinic Staff — all business-scoped via `requireWriteScope`. **BUT** 7 modules of /doctor are missing: Home Visit, Chat, Shop, Support, Consultations, Online Consultations, Emergency; e2e asserts owners are bounced from `/doctor/*`. | ⚠️ Partial (G1) |
| **Manager = per-clinic ops** | Scope model already per-clinic (`clinic_managers`). **BUT** seed template lacks Billing / Income & Expense and **no UI exists for the owner to change a manager's modules** (`createManager` makes account + assignment only; perms are seed-only). | ⚠️ Partial (G2, G3) |
| **Receptionist = per-clinic booking/appointments** | `/receptionist` panel exists with the right perms, but anchoring is `users.doctorId` → practice-owner doctor: a receptionist sees **every clinic** that doctor owns/joins. No per-clinic assignment. | ❌ Mismatch (G4) |
| **Doctor = appointments + doctor-required things** | Default is the **full 13-module set** (`DEFAULT_DOCTOR_MODULE_PERMS`); non-owner doctors see strictly their own rows ("no peer visibility"). | ❌ Mismatch on module breadth (G5); visibility rule **kept** per D4 |
| **Patient = own data only** | `requireRole(["patient"])` + `patientId = user.id` scoping on every query. | ✅ Matches |

## 3. Gap list

| # | Gap | Where | Severity |
|---|---|---|---|
| G1 | Owner missing 6 modules vs /doctor (D1) | `app/admin/layout.tsx` nav; no pages | High |
| G2 | Owner can't grant/trim manager modules | `app/admin/managers/*` (no permission editor) | High |
| G3 | Manager seed template lacks billing/income-expense (D2) | `scripts/seed.ts` `managerTemplatePerms` | Medium |
| G4 | Receptionists have no per-clinic assignment | `users.doctorId` anchoring only | High |
| G5 | Doctor default = full 13 modules (D3) | `DEFAULT_DOCTOR_MODULE_PERMS` in `lib/auth/server-permissions.ts` | Medium |
| G6 | Role labels ("PMS Admin") | `app/super-admin/layout.tsx` shell user.role label | Low |
| G7 | Admin-tier logo/API gates | done previously (clinic-logo route + super-admin tightening) | ✅ |

## 4. Phases

### Phase 1 — Owner module parity (G1)
New routes under `/admin`, reusing the doctor pages' query layer (business-scoped over `getBusinessScope().doctorIds`):
1. `/admin/home-visits` — practice-wide home visits
2. `/admin/chat` — read-first inbox; owner sends from the anchor doctor id
3. `/admin/shop` — catalog view + order list
4. `/admin/support` — admin-tier ticket list (tickets where sender ∈ scoped doctors)
5. `/admin/consultations` + `/admin/online-consultations` — read-only lists over scoped doctor ids (completion flow stays doctor-owned)

Changes: `AdminNavPerm` + `ADMIN_ROUTE_PERMISSIONS` entries (6 new, NOT `ownerOnly` so managers can be granted them later), admin layout nav entries, `requireWriteScope`-based actions where writes make sense.

Test contract: owner opens every new page → 200; manager without the perm → redirect to `/admin`.

### Phase 2 — Manager permission editor (G2 + G3)
1. `app/admin/managers/permissions-editor.tsx` — per-manager module-checkbox dialog (mirrors super-admin's `DoctorPermissionsDialog`): clinic-ops modules only, **never** owner-only modules. New `saveManagerPermissions` action: transactional replace of `model_has_permissions`, child-perms imply parent module, audit `role_changed`, guard `requireAdminPermission("managers", { ownerOnly: true })`.
2. Seed update — `managerTemplatePerms` += `billing`, `billing-list/create/edit/delete/print`, `income-expense`, `income-expense-list/create/edit/delete/export`.
3. Existing managers keep their grants; editor is additive.

Test contract: owner edits manager modules → manager nav changes after refresh; manager cannot edit own perms.

### Phase 3 — Receptionist per-clinic assignment (G4)
1. Migration `0010_receptionist_clinics.sql`: `receptionist_clinics` (`receptionist_id` → users, `clinic_id` → doctor_clinics, unique pair, cascade deletes). Backfill: one row per existing receptionist per clinic of their anchoring doctor (behavior unchanged at migration time).
2. Scope: new `getReceptionistClinicIds(userId)`; `resolvePracticeDoctorId` stays for anchoring NEW records, but practice-wide receptionist queries filter `clinicId ∈ assigned clinics`.
3. Booking/appointment actions: validate target clinic ∈ assigned set for receptionist sessions.
4. Owner UI: `/admin/staff` receptionist rows get "Assign clinics" control (new `assignReceptionistClinics` action, transactional replace).
5. Zero assignments ⇒ empty data (mirrors a manager with no clinics).

Test contract: receptionist of clinic A sees nothing of clinic B (extends `e2e/admin-scope.spec.ts` to `/receptionist`).

### Phase 4 — Doctor default modules + labeling (G5, G6)
1. `DEFAULT_DOCTOR_MODULE_PERMS` → `["dashboard", "appointments", "schedule", "follow-up", "support"]` (consultations is nav-mapped to `dashboard`). Call sites covered automatically: doctor signup, super-admin doctor creation, clinic-doctor creation. Existing doctors keep current grants; super-admin can trim via the existing permissions dialog.
2. Shell labels: `/super-admin` → **"PMS Admin"**; `/admin` already shows "Business Owner"; doctor shell → "Doctor"; receptionist shell → "Receptionist".

### Phase 5 — Guard/scope consistency sweep
1. `lib/auth/permissions.ts` — add the 6 new admin routes to `ADMIN_ROUTE_PERMISSIONS` with perm names matching the doctor module names; extend `AdminNavPerm`.
2. `requireWriteScope` — already tier-aware; new write actions go through the same guard.
3. Update `DASHBOARD_FEATURES.md` + `DASHBOARD_FLOWS.md` role-model sections.

### Phase 6 — Tests & docs
1. Extend `e2e/admin-scope.spec.ts`: owner sees the 6 new pages; manager of clinic 1 never sees clinic 2 on any new page.
2. New `e2e/role-model.spec.ts`: manager template includes billing; receptionist of clinic A blind to clinic B; doctor default module set.
3. Gates: `npx tsc --noEmit`, `npx eslint`, targeted e2e (seeded DB).

## 5. Execution order

**4 → 2 → 3 → 1 → 5 → 6** (cheap correctness fixes first, structural work later).

| Phase | Depends on | Size |
|---|---|---|
| 4 | — | 1 file + labels |
| 2 | — | ~3 files |
| 3 | migration 0010 | ~8–10 files |
| 1 | — | ~4–6 files |
| 5 | Phase 1 | 2 files |
| 6 | all | tests |

## 6. Invariants that must not break

- Owner-only modules (`managers`, `clinics`, `business-settings`) are never delegable to managers.
- Manager cross-clinic isolation (e2e `admin-scope.spec.ts`) holds on every new page.
- Owner gets 403 on every super-admin API (e2e NV-1 regression).
- Doctor own-only appointment visibility is retained (D4).
- Every mutation stays audit-logged (`audit.settingsUpdated` / `roleChanged`) and business-scope-checked.
