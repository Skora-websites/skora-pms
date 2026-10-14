# Server action placement

Next.js requires every mutating server action to live in a `"use server"` file.
This repo holds 34 of them, and the split between `lib/actions/` and
`app/**/actions.ts` is deliberate.

## The rule

> An action moves to `lib/actions/` when it is imported by **more than one route
> group**, or by a shared component under `components/`.

Otherwise it stays next to the route that owns it, in `app/<group>/<feature>/actions.ts`.

## Why

`"use server"` files are their own module boundary — anything they export
becomes an HTTP endpoint. Keeping a feature's mutations beside that feature
makes the surface auditable: `app/doctor/billing/actions.ts` is the complete
list of things a client can ask the billing feature to do, and nothing else can
add to it.

Cross-cutting actions are different. `logoutAction` is needed by the marketing
header, the admin shell, the doctor shell and the patient shell alike; duplicating
it four times, or reaching sideways into one route group from another, are both
worse than one shared module.

## How to check

```bash
# Who imports lib/actions/auth?
grep -rl 'from "@/lib/actions/auth"' app components --include=*.ts --include=*.tsx

# Verify a feature's actions stay route-local (should print only that feature)
grep -rl 'from "@/app/doctor/billing/actions"' app/doctor/billing app components
```

## Current state

| Module | Importers | Placement |
|---|---|---|
| `lib/actions/auth.ts` | 3 files across `(auth)` + `components/` | `lib/` — correct |
| `lib/actions/duty.ts` | `components/doctor/duty-toggle.tsx` | `lib/` — correct |
| `lib/actions/inventory.ts` | 2 shared components + shop | `lib/` — correct |
| `lib/dispatch/actions.ts` | doctor + patient emergency panels | `lib/` — correct (a feature spanning two route groups) |
| `lib/push/actions.ts` | doctor + patient panels, PWA setup | `lib/` — correct |
| `app/*/**/actions.ts` | route-local pages and forms | `app/` — correct |

## When adding a new action

1. Write it in the feature's own `actions.ts`.
2. When a **second** route group needs it, move it to `lib/actions/<name>.ts`
   and update the importers. Do not import across route groups
   (`app/doctor/...` must never import from `app/admin/...`).
3. Cross-group reads go to `lib/queries/<domain>.ts`; only mutations belong in
   `lib/actions/`.

## Related

`lib/queries/` follows the same shape: `lib/queries/admin.ts` exists precisely
because the admin and super-admin dashboards share scope semantics, and
`lib/queries/doctor.ts` because the doctor pages and their actions share one
practice-scoped read layer. Page components never import `@/lib/db` directly —
they go through `lib/queries/`.
