# Proposed Constitution Amendment — Principle V gate table

**Status**: PROPOSED — not applied. Per the Governance section of
`.specify/memory/constitution.md`, adding a gate to Principle V is a MINOR amendment
that must be proposed as its own explicit change, never folded into a code change.
Apply it with a separate `/speckit.constitution` run.

**Feature**: `specs/001-role-security-fixes`
**Date**: 2026-10-19

## Change

Replace the gate table in **Principle V — Verification Gates Before Done** with the
version below (two rows added: `npm run test` and `npm run check:permissions`), and
replace the sentence that follows it.

### Current text (v1.0.0)

> A change is NOT complete until the applicable gates pass, because this repository
> currently has no automated test suite (the Playwright e2e suite was removed in commit
> `0ff2475`; there is no unit-test runner or config). The gates that exist MUST
> therefore be run and MUST NOT be skipped or waived:
>
> | Gate | Command | Covers |
> |---|---|---|
> | Type check + build | `npm run build` | TypeScript `strict`, whole app |
> | Lint | `npm run lint` | ESLint + `eslint-config-next` |
> | Storage containment | `npm run check:storage` | Principle III path rule |
> | Schema check | `npm run db:check` | Principle IV schema parity |
> | Feature inventory | manual, against `docs/planning/DASHBOARD_FEATURES.md` | Routes match reality |
>
> Rationale: with no runtime test suite, these scripts and the documentation audits ARE
> the regression protection. A gate that is skipped is an unverified release.

### Proposed text (v1.1.0)

> A change is NOT complete until the applicable gates pass. The gates MUST be run and
> MUST NOT be skipped or waived:
>
> | Gate | Command | Covers |
> |---|---|---|
> | Type check + build | `npm run build` | TypeScript `strict`, whole app |
> | Lint | `npm run lint` | ESLint + `eslint-config-next`; 0 errors, new warnings justified |
> | Unit & scope regression | `npm run test` | Authorization scoping, role isolation, invariants (`node --test`) |
> | Permission catalog parity | `npm run check:permissions` | Every route-map permission name exists in the catalog |
> | Storage containment | `npm run check:storage` | Principle III path rule |
> | Schema check | `npm run db:check` | Principle IV schema parity |
> | Feature inventory | manual, against `docs/planning/DASHBOARD_FEATURES.md` | Routes match reality |
>
> A gate that is skipped is an unverified release. A test that fails in CI is a
> regression the intended feature genuinely broke — the intended feature MUST then be
> removed because it needs to be rewritten or revised, not the test weakened.

## Version effect

`CONSTITUTION_VERSION`: **1.0.0 → 1.1.0** (MINOR — materially expands Principle V's
guidance: two gates added, one runtime claim corrected). `RATIFICATION_DATE` stays
`2026-10-19`; `LAST_AMENDED_DATE` becomes the date the amendment is applied.

## Why this is a separate command

The governance rule in this constitution is explicit:

> Amendments that add a principle or materially expand guidance are MINOR. […] The
> version MUST increment in the same change that amends the text.

The `401-vs-403` / gate-table change above is exactly that. Bundling it into the
implementation PR would have let a code change silently alter the project's own rules.

## Evidence the new gates work

Captured 2026-10-19 (full detail in `quickstart.md`, "Recorded evidence"):

- `npm run test` — 19 tests, 0 failures; each suite failed before its fix.
- `npm run check:permissions` — caught the two missing permission names (68 catalog
  rows, both absent) before migration `drizzle/0020` added them; exits 0 after.
- Both are wired into `package.json` and `docs/README.md`.
