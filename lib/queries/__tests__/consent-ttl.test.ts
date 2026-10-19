/**
 * US7 — consent link lifetime (audit M5 / FR-019).
 *
 * getConsentBySlug selected no `createdAt` and applied no retention window, so
 * an undecided slug kept serving patient and doctor names for as long as the
 * row lived — while the answer action (`my-consent/[slug]/actions.ts`) and the
 * file download (`/api/consents/[slug]/file`) both enforced CONSENT_TTL_MS.
 * These tests MUST fail before the fix and pass after.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeConsent, makeUser } from "../../../tests/helpers/fixtures";
import { getConsentBySlug } from "../consent";

test("an undecided consent inside the window resolves with both names", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor", name: "Dr Ttl Window" });
    const patientId = await makeUser({
      role: "patient",
      name: "Ttl Patient",
      doctorId,
      referenceRoleId: doctorId,
    });
    const slug = await makeConsent({ doctorId, patientId });

    const consent = await getConsentBySlug(slug);

    assert.ok(consent, "a fresh undecided consent must resolve");
    assert.equal(consent.slug, slug);
    assert.equal(consent.doctorName, "Dr Ttl Window", "the doctor name still resolves");
    assert.equal(consent.patientName, "Ttl Patient", "the patient name still resolves");
  });
});

test("an undecided consent past the retention window resolves to null", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor", name: "Dr Ttl Expired" });
    const patientId = await makeUser({
      role: "patient",
      name: "Ttl Expired Patient",
      doctorId,
      referenceRoleId: doctorId,
    });
    // Eight days old — two days past the 7-day window, and fresh enough that a
    // same-week insert cannot make this pass by accident.
    const slug = await makeConsent({ doctorId, patientId, ageDays: 8 });

    assert.equal(
      await getConsentBySlug(slug),
      null,
      "an out-of-window consent is indistinguishable from a non-existent slug"
    );
  });
});

test("a decided consent resolves to null regardless of age", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor", name: "Dr Ttl Decided" });
    const patientId = await makeUser({
      role: "patient",
      name: "Ttl Decided Patient",
      doctorId,
      referenceRoleId: doctorId,
    });
    const accepted = await makeConsent({ doctorId, patientId, isAccepted: true });
    const rejected = await makeConsent({ doctorId, patientId, isRejected: true });

    assert.equal(await getConsentBySlug(accepted), null, "an accepted consent is not servable");
    assert.equal(await getConsentBySlug(rejected), null, "a rejected consent is not servable");
  });
});

test("a slug that never existed resolves to null", async () => {
  await withCleanFixtures(async () => {
    assert.equal(await getConsentBySlug("no-such-consent-slug"), null);
  });
});
