# Contract — Authorization Guards & Scoping Helpers

**Feature**: `001-role-security-fixes` | **Date**: 2026-10-19

These are the contracts this feature must restore. Each is a *caller obligation* drawn from existing
code; the defects being fixed are violations of these contracts, not flaws in the guards themselves.

---

## CG-1 Query-scope contract

> A function that accepts a scope parameter MUST use it in every predicate it builds. An accepted
> and ignored scope parameter is a defect, not documentation.

| Function | Param scoped today | Defect |
|---|---|---|
| `getHomeVisitPatientDetail(doctorId, patientId)` — `lib/queries/doctor.ts:905-918` | **Not used** — `where(eq(appointments.patientId, patientId))` only | FR-001 |
| `getSchedulesForDay(doctorId, date, clinicId)` — callers pass `null` | `null` accepted silently | FR-005 |

**Required after fix**: `getHomeVisitPatientDetail` AND-filters on the caller's doctor scope; a
patient outside it yields the same 404 as a non-existent patient (no existence oracle).

## CG-2 Guard return contracts

| Guard | Returns | Caller MUST |
|---|---|---|
| `requireWriteScope(permission)` — `lib/auth/action-scope.ts` | `ActionScope \| null` | Treat `null` as a user-facing error; never fall through to an unscoped write |
| `requireDoctorPermission(permission)` | `number \| null` | Same |
| `requireAdminPermission(perm, {ownerOnly})` | `{user, viewerRole} \| null` | Same |
| `requireApiRole / requireApiPermission / requireApiDoctorOnly` | `CurrentUser \| Response` | Return the `Response` immediately; the `instanceof Response` check is mandatory |
| `requireAdminTier(pathname)` / `requireRole(roles)` | redirects | No caller-side result handling; must not be re-implemented |

The `null`-return path is where this feature's data-integrity bug lives: `resolveClinic`'s `null` is
*not* a guard return, so nobody checked it. **Required after fix**: clinic resolution failure
returns the same user-facing error contract as a guard `null`.

## CG-3 Cross-shell link contract

> A component rendered in more than one shell MUST NOT hardcode another shell's URL prefix. Internal
links MUST be produced by a role-aware helper (precedent: `doctorPathToReceptionist` /
`receptionistPathToDoctor`, `lib/auth/permissions.ts:221-229`).

| Site | Current hardcode | Defect |
|---|---|---|
| `components/mobile-view/consultations-list.tsx:61` | `/doctor/consultations/${appointmentId}` | H6 |
| `components/doctor/appointment-actions.tsx:87` | same | H7 |
| `components/dashboard/header.tsx:101` | `/doctor/notifications` | H8 |
| `components/dashboard/header.tsx:165` | `/doctor/profile` | H9 |
| `components/dashboard/mobile-app-shell.tsx:76,127` | `/doctor/notifications`, `/doctor/profile` | H8/H9 |
| `components/dashboard/mobile-app-shell.tsx:224` | `admin: ["/doctor", …]` | M10 (dead) |

**Required helper shape**: a single module exporting, per purpose (`consultationDetail`,
`notifications`, `profile`, `testReport`, `consultPdf`), a function taking the caller's shell and
returning the correct path — or an explicit "not available in this shell" signal the component
renders as a disabled affordance rather than a link.

## CG-4 Permission-gate parity contract

The client gate (`components/doctor/permission-gate.tsx:20-32`) MUST apply the same
`DOCTOR_ONLY_PATHS` set as the server bounce (`app/doctor/layout.tsx:54`). Today it only consults
`doctorPermissionForPath`, so the two can drift (M7).

## CG-5 Audit contract

A mutating server action MUST emit an audit entry. Where it has a named recipient it MUST also send
the notification step (`DASHBOARD_FLOWS.md` §5.3); the three clinical-record writes are exempt from
the notification half because they have no single recipient, and the owner already sees them on the
admin overview and follow-ups pages.

Audit-emitting: billing (`app/doctor/billing/actions.ts:148`), receptionist assignment, and — added
in remediation round 2 and verified end-to-end — `saveConsultation`, `updateAppointmentStatus`,
`updateFollowUpStatus` (`app/doctor/actions.ts`). Nothing is outstanding.

`auditLog` logs its own failures and never re-throws (callers use `void audit.x(...)`), and resolves
the client IP independently of the insert so an unavailable IP yields `null` rather than losing the
audit row. Exercise audit paths through the app, not from a standalone script: `getClientIp()` needs
`next/headers`, so a script shares neither the request context nor the process lifetime of the
server, and a hanging or incomplete probe can look exactly like a verified write.
