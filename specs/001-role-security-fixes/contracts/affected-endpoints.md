# Contract — Affected HTTP Endpoints & File Downloads

**Feature**: `001-role-security-fixes` | **Date**: 2026-10-19

Behaviour changes are listed as *before → after*. Endpoints that only become reachable by the admin
tier keep their existing guard helper; the change is the role list plus a row-level scope check (R6).

---

## Changed guards

| Endpoint | Before | After | Finding |
|---|---|---|---|
| `GET /api/doctor/home-visits/patient-details/[id]` | `requireApiPermission(["doctor","receptionist"], "home-visit")`, no row scope | Same guard **+** patient must be in the acting doctor's scope, else 404 | C1 / FR-001 |
| `GET /api/doctor/appointments/booked-times` | `isPracticeDoctor(...)` lets a member doctor probe a peer (`:51`); admin-tier zero-scope falls back to `user.id` (`:33`) | Peer probe removed; zero-scope admin returns an explicit no-access state | H13 / FR-002 |
| `GET /api/doctors/consult-pdf` — `app/api/doctor/consult-pdf/route.ts` | `["doctor","receptionist"]`, resolves to the **owner** id for receptionists | `["doctor","admin","manager"]` + record must belong to the caller's business; receptionist resolves to own anchor only | H11 / FR-009 |
| `GET /api/doctor/test-bookings/[id]/report` | `["doctor","receptionist"]` — admin gets 403 | `["doctor","admin","manager"]` + booking's business scope | H10 / FR-009 |
| `GET /api/shule/doctors` | token valid only; no role/tenant check; `limit(200)` all-tenant select incl. `email`, `phone`, `registration_number` | Staff-tier token required (403 otherwise); results scoped to the holder's derived tenants; documented 403 for deactivated owners | H4 / FR-017, FR-018 |
| `POST` upload — `app/doctor/consult-pdf/actions.ts` | admits receptionists | doctor-tier only | H11 |
| `GET /api/consents/[slug]/file` | 7-day TTL enforced | unchanged (already correct) | — |
| Consent slug page data — `getConsentBySlug` | no TTL | same `CONSENT_TTL_MS` predicate | M5 / FR-019 |

## Rejected paths (defence-in-depth)

SOS dispatch actions (`lib/dispatch/actions.ts:70-74`, `:588-593`) — **doctor tier only**. A
receptionist must be refused whether the request arrives through the page or directly against the
action. `lib/dispatch/geo.ts:12-14` must stop resolving a receptionist to the owner's doctor id.

## Staff account administration

| Action | Before | After |
|---|---|---|
| `app/doctor/staff/actions.ts:120-124` peer password reset | only *self* blocked | owner/admin tier only for accounts outside the caller's own staff |
| `app/doctor/roles/actions.ts:213-225` `saveStaffPermissions` | any catalog perm grantable to a peer (self blocked) | granted set limited to the grantor's own permissions; self-refusal retained |

## Compatibility

- JSON error bodies keep their existing shape (`{ error: string }`); only status codes and the set of
  rows returned change.
- `Cache-Control: no-store` retained on every PHI response.
- No endpoint is removed; the admin tier gains access to its own business's records, and two
  permissions become grantable rather than permanently inert.
