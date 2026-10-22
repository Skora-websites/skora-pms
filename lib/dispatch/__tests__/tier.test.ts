/**
 * US5/T050 — every exported SOS dispatch action refuses a receptionist.
 *
 * Audit H12: the dispatch actions resolved the acting doctor from the session,
 * and a receptionist resolved to their linked practice OWNER's doctor id — so a
 * front-desk account could accept, complete and bill the owner's emergency
 * cases and read the patient's PHI through the dispatch panel. The tier guard
 * now sits at the top of every action: requireDoctor() admits the doctor tier
 * only, requirePatient() admits the patient tier only, and both redirect() for
 * anyone else.
 *
 * HOW THIS IS EXERCISED: the real action modules ARE driven here, not a
 * re-implementation of the guard. Three obstacles are worked around, all with
 * one synchronous `module.registerHooks` resolve hook local to this test
 * process (no production code and no `npm run test` change):
 *
 *  1. `next/navigation` / `next/cache` / `next/headers` cannot be imported
 *     under the runner's `react-server` condition — they resolve to Next's TS
 *     source, whose CJS output then dies on React's react-server build — and
 *     this Node build ships no `mock.module` to replace them. Both specifiers
 *     are redirected to tests/helpers/next-stubs.ts, whose `redirect` throws
 *     the same never-returns signal the guards rely on.
 *  2. The session cookie cannot be forged outside a request scope, and the
 *     Node 26 runner cannot mock an ESM namespace export that tsx exposed as a
 *     getter. So `@/lib/auth/user` is redirected to
 *     tests/helpers/session-stub.ts, which returns a receptionist.
 *
 * With a receptionist session in place every export is called and must be
 * refused by the guard. A guard that stopped refusing would let the action run
 * and either return a result or fail on a missing row — both surface here.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { count } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosCases, sosOffers, sosRequests } from "@/lib/db/schema";
import { resolveDoctorId } from "../geo";
import type * as DispatchActionsModule from "../actions";

type DispatchActions = typeof DispatchActionsModule;

/**
 * Specifiers redirected to test doubles. `next/headers` is stubbed because
 * lib/security/ip.ts (reached through the rate limiter) imports it, and
 * `@/lib/auth/user` is stubbed because the guards read the session from it.
 */
const SPECIFIER_STUBS: Record<string, string> = {
  "next/navigation": "../../../tests/helpers/next-stubs.ts",
  "next/cache": "../../../tests/helpers/next-stubs.ts",
  "next/headers": "../../../tests/helpers/next-stubs.ts",
  "@/lib/auth/user": "../../../tests/helpers/session-stub.ts",
};

const STUB_URLS = Object.values(SPECIFIER_STUBS).map((relative) => new URL(relative, import.meta.url).href);

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => { url: string }
) => { url: string };

/**
 * `node:module` types predate `registerHooks`; the runtime has it (Node 26),
 * so the shape is asserted on a named const rather than inline at the call.
 */
type ModuleWithHooks = {
  registerHooks: (hooks: { resolve: ResolveHook }) => void;
};

const moduleWithHooks = nodeModule as unknown as ModuleWithHooks;

moduleWithHooks.registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubIndex = Object.keys(SPECIFIER_STUBS).indexOf(specifier);
    // Every branch must declare shortCircuit: the synchronous hook chain
    // rejects a resolution that does not.
    if (stubIndex !== -1) {
      return { url: STUB_URLS[stubIndex], shortCircuit: true };
    }
    return { url: nextResolve(specifier, context).url, shortCircuit: true };
  },
});

let cached: DispatchActions | undefined;

/**
 * Import the action module once.
 *
 * EXCEPTION (dynamic import): a static value import is hoisted above the
 * `registerHooks` call, so the real `next/*` modules would load first and
 * crash the process. The specifier is a known literal, not runtime-selected.
 */
async function actions(): Promise<DispatchActions> {
  cached ??= await import("../actions");
  return cached;
}

/**
 * Assert the action refused via the guard's redirect, not by running.
 *
 * The signal is matched by name and message rather than `instanceof`: the stub
 * module is loaded once per loader path (tsx transforms it for CommonJS
 * consumers, Node's strip-only loader serves the redirecting URL), so the
 * thrown class is not reference-identical to the imported one.
 */
async function expectRefusal(
  label: string,
  expectedTarget: string,
  run: () => Promise<unknown>
): Promise<void> {
  await assert.rejects(run, (err: unknown) => {
    assert.equal(redirectTarget(err) !== null, true, `${label} did not refuse the session: ${String(err)}`);
    assert.equal(redirectTarget(err), expectedTarget, `${label} refused to the wrong shell`);
    return true;
  });
}

/** The destination of a `redirect()` signal, or null for any other throw. */
function redirectTarget(err: unknown): string | null {
  const error = err as { name?: unknown; message?: unknown };
  if (error.name !== "Redirected" || typeof error.message !== "string") return null;
  return error.message.startsWith("NEXT_REDIRECT:")
    ? error.message.slice("NEXT_REDIRECT:".length)
    : null;
}

/** The SOS write surface any rejected call must leave untouched. */
async function sosRowCount(): Promise<number> {
  const [requests, offers, cases] = await Promise.all([
    db.select({ n: count() }).from(sosRequests),
    db.select({ n: count() }).from(sosOffers),
    db.select({ n: count() }).from(sosCases),
  ]);
  return Number(requests[0].n) + Number(offers[0].n) + Number(cases[0].n);
}

/** A patient-triggered SOS submission, the shape triggerSos parses. */
function sosForm(): FormData {
  const data = new FormData();
  data.set("latitude", "12.9716");
  data.set("longitude", "77.5946");
  data.set("radius_km", "10");
  data.set("complaint", "chest pain");
  return data;
}

test("a receptionist is never resolved to their linked practice owner", () => {
  // H12: the old resolution handed the receptionist the owner's doctor id.
  // The identity for dispatch purposes is the acting user's own id.
  const receptionist = { role: "receptionist", id: 4242, doctorId: 99 };
  assert.equal(resolveDoctorId(receptionist), 4242);
  const doctor = { role: "doctor", id: 77, doctorId: null };
  assert.equal(resolveDoctorId(doctor), 77);
});

test("every doctor-tier dispatch action refuses a receptionist", async () => {
  const dispatch = await actions();

  const doctorTier: Record<string, () => Promise<unknown>> = {
    acceptSos: () => dispatch.acceptSos(1),
    declineSos: () => dispatch.declineSos(1),
    completeSos: () => dispatch.completeSos(1),
    markSosArrived: () => dispatch.markSosArrived(1),
    verifySosOtp: () => dispatch.verifySosOtp(1, "123456"),
    setDoctorOnDuty: () => dispatch.setDoctorOnDuty(true),
    updateDoctorLocation: () => dispatch.updateDoctorLocation(1, 12.9716, 77.5946),
    getMySosOffers: () => dispatch.getMySosOffers(),
    getMyActiveCase: () => dispatch.getMyActiveCase(),
    getMySosCaseHistory: () => dispatch.getMySosCaseHistory(),
  };

  for (const [name, run] of Object.entries(doctorTier)) {
    await expectRefusal(name, "/doctor", run);
  }
});

test("every patient-tier dispatch action refuses a receptionist", async () => {
  const dispatch = await actions();

  const patientTier: Record<string, () => Promise<unknown>> = {
    triggerSos: () => dispatch.triggerSos({ error: null }, sosForm()),
    cancelSos: () => dispatch.cancelSos(1),
    rateSosCase: () => dispatch.rateSosCase(1, 5, "note"),
    getMyActiveRequest: () => dispatch.getMyActiveRequest(),
    getMySosHistory: () => dispatch.getMySosHistory(),
  };

  for (const [name, run] of Object.entries(patientTier)) {
    await expectRefusal(name, "/patient", run);
  }
});

test("no dispatch action writes anything for a receptionist session", async () => {
  const dispatch = await actions();

  await withCleanFixtures(async () => {
    const before = await sosRowCount();

    const mutations: Record<string, () => Promise<unknown>> = {
      triggerSos: () => dispatch.triggerSos({ error: null }, sosForm()),
      acceptSos: () => dispatch.acceptSos(1),
      declineSos: () => dispatch.declineSos(1),
      cancelSos: () => dispatch.cancelSos(1),
      completeSos: () => dispatch.completeSos(1),
      markSosArrived: () => dispatch.markSosArrived(1),
      verifySosOtp: () => dispatch.verifySosOtp(1, "123456"),
      rateSosCase: () => dispatch.rateSosCase(1, 5, "note"),
      setDoctorOnDuty: () => dispatch.setDoctorOnDuty(true),
      updateDoctorLocation: () => dispatch.updateDoctorLocation(1, 12.9716, 77.5946),
    };

    for (const [name, run] of Object.entries(mutations)) {
      await assert.rejects(run, (err: unknown) => {
        assert.equal(redirectTarget(err) !== null, true, `${name} ran for a receptionist: ${String(err)}`);
        return true;
      });
    }

    assert.equal(await sosRowCount(), before, "a refused session must write no SOS rows");
  });
});
