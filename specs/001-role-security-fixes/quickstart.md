# Clean-slate rebuild and re-verification

Run 2026-10-20. The dev database was reset to empty and rebuilt from
migrations + seed, then **one account per role was created and every dashboard
re-tested**. This is the end-to-end proof that the role fixes work on data that
never contained a leak to begin with.

## Reset

- Dumped first: `/tmp/skoradumps/skoracares-pre-reset-<timestamp>.sql`
  (572 KB, 72 tables) — the reset is reversible.
- Dropped all 72 tables, re-applied all 21 migrations (`0000` → `0021`), then
  `SEED_ADMIN_EMAIL=admin@gmail.com npm run db:seed`.
- Pre-reset state: **135 users** (123 test artifacts from the removed Playwright
  suite: `E2E *`, `QA *`, `Fixture *`, `NotifPat-*`) driving 118 appointments,
  1,918 audit logs, 594 sessions, 327 notifications.
- Post-reset state: **1 user** (the PMS Admin), 0 appointments, 0 sessions,
  0 audit logs — exactly what was requested.

## Two real seed bugs found *by* the reset

The reset exposed both; neither was reachable on the polluted database.

1. **`scripts/seed.ts` crashed on a fresh database.** The `appointments` module
   map omitted the `appointments-create` child, while the doctor-role template
   validates for all 19 clinical-core names and threw `found 18/19`. The row
   must exist in the catalog — `drizzle/0019` revokes it from the *Doctor role*,
   which is a grant, not a catalog entry.
2. **`seed.ts` was not idempotent.** Re-running it (or running it after a
   migration that adds catalog rows) collided on the `permissions` and `roles`
   unique indexes and on `role_has_permissions` primary keys. Permission and
   role inserts now reuse existing ids by name, and every grant goes through a
   `grantRole` helper that skips existing pairs.

Also found while re-testing: **a regression I had introduced.** Scoping the
manager-assignment picker to the caller's clinics (audit M6 fix) made a
*newly created* manager invisible, because the query only returned managers
already holding an assignment — so no manager could ever be assigned to a clinic.
`listManagerUsersInScope` now returns assigned **plus unassigned** managers while
still excluding managers belonging to another business. Verified by re-running
the assignment through the UI.

## Accounts created

| Role | How | Result |
|---|---|---|
| `super_admin` | `db:seed` | PMS Admin, 78-permission catalog |
| `doctor` | **real `/signup` flow** (OTP verified) | `Doctor` system role + exactly the 5 clinical-core modules (D3) + 15-day trial |
| `patient` | **real `/signup` flow** (OTP verified) | own-data portal |
| `admin` (Business Owner) | script — **no UI flow exists** | business + clinic + `business_clinics` link + owner-as-clinic-member |
| `manager` | **real owner UI** (`/admin/managers`) | exactly the 8 default modules (M3) + clinic assignment |
| `receptionist` | script (mirrors `/doctor/staff`) | `Receptionist` role + 7 direct perms + `receptionist_clinics` row (G4) |

**Gap worth noting:** the `admin` tier has no creation surface anywhere in the
app. `signupAction` accepts only `patient` and `doctor`; no page or API creates a
`role: "admin"` user, and `/admin/managers` only assigns already-created managers.
Business ownership can only be produced by direct data manipulation, which is how
the owner above was made.

**Closed the same day.** `createBusinessOwner` in
`app/super-admin/businesses/actions.ts` plus `CreateOwnerForm` on
`/super-admin/businesses` now onboard owner + business + first clinic in one
transaction. Kept behind the super-admin guard rather than public signup, so the
open internet cannot mint accounts that own a business. Verified by creating an
owner through the UI and signing in as them: `/admin` renders with
"UI Test Business · 1 clinic" (their own business, not the other owner's),
18 nav entries, and the "Business Owner" label. Verification account removed
afterwards; 6 accounts remain, one per role.

## Verification after rebuild

`tsc` 0 · `test` 24/24 · `check:permissions`, `db:check`, `check:storage` pass ·
0 appointments, 0 sessions (only the one active login).

---

### Remediation round 2 — 2026-10-20

`/speckit.analyze` on this feature's own artifacts found four tasks marked `[X]` with no
implementation behind them. All four are now closed, plus a fifth that followed from one.

| Finding | Fix | Verified by |
|---|---|---|
| `npm run check:links` **exited 1** — promised by `package.json` and `docs/README.md` but the script never existed | Wrote `scripts/check-shell-links.mjs`: scans 337 component/route files for literal cross-shell hrefs and fails naming the file | **RED/GREEN**: injected `href="/admin/…"` → exit 1 with the file named; removed → exit 0 |
| Client permission gate omitted `DOCTOR_ONLY_PATHS`, so client nav and the server bounce could disagree (audit M7) | Extracted the whole boundary rule into one pure function `resolveDoctorPanelRedirect` (`lib/auth/permissions.ts`), now called by **both** `app/doctor/layout.tsx` and `components/doctor/permission-gate.tsx` — the duplication that caused the drift is gone, not merely patched | New suite `lib/auth/__tests__/panel-redirect.test.ts` (8 cases, incl. ordering + no-landing-loop); receptionist boundary re-probed live — all 5 doctor-only paths still bounce |
| `saveConsultation`, `updateAppointmentStatus`, `updateFollowUpStatus` wrote PHI with **zero** audit rows (FR-022) | New `audit.consultationSaved` action + helper; audit calls added to both transitions using `appointmentUpdated` / `followUpStatusChanged` | `tsc` 0, suite green. **Live write not exercised** — the clean database holds 0 appointments, so no consultation has been recorded against this path |
| `/` and `/pricing` called `getCurrentUser()` in the server component — session-coupled, buyer PII in the RSC payload (FR-025) | Decision moved to server action `getCheckoutPlansForVisitor`, called on mount by client wrapper `PricingWithCheckout`. Pages static; PII travels only in the doctor's own authenticated response | Both pages `200` anonymous with **0** PII refs; `npm run build` exit 0 |
| The `DOCTOR_ONLY_PATHS` parity test was never written (T064) | `panel-redirect.test.ts` — 8 cases including the guard that fails if the boundary is ever checked *after* the module permission | 32/32 green |

Final gates: `tsc` 0 · `lint` 0 (12 warnings, all pre-existing) · `test` **32/32** ·
`check:links` / `check:permissions` / `db:check` pass · `build` 0.

#### Audit write verified end-to-end — 2026-10-20

The one gap flagged in Remediation round 2 (FR-022's audit write had never been exercised
because the clean database had no appointments) is now closed.

Booked a real appointment (receptionist), registered a patient, then recorded a consultation
through the doctor's real form at `/doctor/consultations/44`. Result:

```text
consultations:   { id: 1, appointment_id: 44, patient_id: 344, diagnosis_note: "Viral fever (audit verification)" }
audit_logs:      { id: 17, action: "consultation_saved",
                   metadata: { appointmentId: 44, consultationId: 1, doctorId: 50 } }
appointments:    status = completed
```

The `consultation_saved` audit row was written by the code added in round 2, in a real request.
Test rows removed afterwards; `test data: appointments 0, consultations 0, users 6`.

Note for anyone re-verifying: `auditLog` catches its own errors silently ("Table may not exist
yet"), and it calls `getClientIp()` before inserting — so calling an `audit.*` helper from a
script outside a request context writes nothing and reports no failure. Exercise audit paths
through the app, never from a standalone script, or a silent pass will look like a verified write.

#### Remediation round 3 — 2026-10-20

The second `/speckit.analyze` found one new defect (the first four tasks were re-verified genuine).

| Finding | Fix | Verified by |
|---|---|---|
| **N1 (HIGH)** `auditLog` swallowed all its own errors ("Table may not exist yet") and called `getClientIp()` before the insert — so a broken audit trail looked identical to a working one. That is how my first script probe produced a false pass | The IP resolution now degrades independently (`ip_address` is nullable → `null`), and an insert failure is **logged** via `console.error([audit] FAILED …)` instead of silently discarded. Still never re-throws, because callers use `void audit.x(…)` | **Both directions**: outside a request the probe now writes a row with `ip=null` (before: wrote nothing); inside a request `login` rows still land with `ip=unknown`. Probe row removed afterwards |
| **N2 (LOW)** FR-022 required audit **and** "the documented notification step" for three actions with no obvious recipient — unimplementable as written | FR-022 and contract CG-5 now name the three actions, require the audit entry, and exempt them from the notification half *with a stated reason* (no single recipient; the owner already sees them on `/admin`). Actions with a named recipient still must send both | Spec and contract re-read for consistency; nothing left requiring an undefined recipient |
| Constitution Principle V promised no gate for cross-shell links | **v1.1.0 → v1.2.0**: added `npm run check:links` to the gate table so the guard is binding, not advisory | Gate table now 7 rows; version/dates ISO; 0 placeholders; 0 trailing whitespace |

Final gates: `tsc` 0 · `lint` 0 (12 warnings, all pre-existing) · `test` 32/32 ·
`check:links` / `check:permissions` / `db:check` pass · constitution **v1.2.0**.

Audit rows: 0 `consultation_saved` remain (end-to-end row and probe row both removed); 4 `login`
rows prove in-request writes continue to work after the change.
