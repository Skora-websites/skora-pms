/**
 * noShowBand / getPatientNoShowRisk — follow-up no-show prediction (§7.4).
 *
 * §9.2 gate honored: transparent arithmetic (the band comes straight from
 * the cancelled/(completed+cancelled) ratio, the SAME definition the owner
 * dashboard already uses), human approval (badge only — nothing is
 * auto-statused) and a fallback (thin history ⇒ "unknown").
 *
 *  1. pure banding: thresholds 50/25 on the ratio, and "unknown" under 2
 *     recorded outcomes — the fallback is part of the contract, not an
 *     accident of "0/0";
 *  2. DB-backed: the stats key on the caller's own doctor scope — another
 *     practice's terminal rows for the SAME patient never leak in.
 *
 * Run: npm test (needs the live MySQL — same as the other fixture suites).
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeUser, makeClinic, makeAppointment } from "../../../tests/helpers/fixtures";
import { noShowBand, getPatientNoShowRisk, patientNoShow } from "../no-show";

test("banding rules: thresholds and the thin-history fallback", () => {
  // Fall back to unknown under TWO recorded outcomes — "1 of 1 no-showed"
  // must not order a call list off a single event.
  assert.deepEqual(noShowBand(0, 0), { riskPct: null, band: "unknown" });
  assert.deepEqual(noShowBand(1, 0), { riskPct: null, band: "unknown" });
  assert.deepEqual(noShowBand(0, 1), { riskPct: null, band: "unknown" });

  // Ratio runs the bands: <25 low, 25–49 medium, ≥50 high.
  assert.deepEqual(noShowBand(9, 1), { riskPct: 10, band: "low" });
  assert.deepEqual(noShowBand(3, 1), { riskPct: 25, band: "medium" });
  assert.deepEqual(noShowBand(7, 3), { riskPct: 30, band: "medium" });
  assert.deepEqual(noShowBand(4, 4), { riskPct: 50, band: "high" });
  assert.deepEqual(noShowBand(0, 2), { riskPct: 100, band: "high" });
});

const SPECIFIER_STUBS: Record<string, string> = {
  "next/headers": "../../../tests/helpers/next-stubs.ts",
};

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => { url: string }
) => { url: string };

type ModuleWithHooks = { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const moduleWithHooks = nodeModule as unknown as ModuleWithHooks;

moduleWithHooks.registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubIndex = Object.keys(SPECIFIER_STUBS).indexOf(specifier);
    if (stubIndex !== -1) {
      return { url: new URL(SPECIFIER_STUBS[stubIndex], import.meta.url).href, shortCircuit: true };
    }
    return { url: nextResolve(specifier, context).url, shortCircuit: true };
  },
});

test("the scoped read never sees another practice's terminal rows", async () => {
  await withCleanFixtures(async () => {
    const doctorA = await makeUser({ role: "doctor" });
    const doctorB = await makeUser({ role: "doctor" });
    const patient = await makeUser({ role: "patient" });

    await makeClinic(doctorA);
    await makeClinic(doctorB);

    // Same patient under BOTH doctors: 2 completed + 1 cancelled with A
    // (medium by the ratio), plus extra terminal rows under B that must
    // stay invisible to a A-scoped read.
    const aIds = [
      await makeAppointment({ doctorId: doctorA, patientId: patient, status: "completed" }),
      await makeAppointment({ doctorId: doctorA, patientId: patient, status: "completed" }),
      await makeAppointment({ doctorId: doctorA, patientId: patient, status: "cancelled" }),
    ];
    await makeAppointment({ doctorId: doctorB, patientId: patient, status: "cancelled" });
    await makeAppointment({ doctorId: doctorB, patientId: patient, status: "cancelled" });

    // appointments only need doctorId/patientId (the fixtures' NOT NULL set).

    const risk = await getPatientNoShowRisk([doctorA], [patient]);
    const stat = risk.get(patient);
    assert.ok(stat);
    assert.equal(stat.completed, 2);
    assert.equal(stat.cancelled, 1);
    assert.equal(stat.riskPct, 33);
    assert.equal(stat.band, "medium");

    // And a scoping MISS renders as the same shape as no history at all.
    const miss = patientNoShow(await getPatientNoShowRisk([doctorA], [-999]), patient);
    assert.equal(miss.band, "unknown");
    assert.equal(miss.riskPct, null);

    // Sanity: the B-scoped view of the same patient sees B's rows only.
    const bRisk = await getPatientNoShowRisk([doctorB], [patient]);
    assert.equal(bRisk.get(patient)?.cancelled, 2);
    assert.equal(bRisk.get(patient)?.completed, 0);

    // aIds unused beyond forcing the rows into place.
    assert.equal(aIds.length, 3);
  });
});
