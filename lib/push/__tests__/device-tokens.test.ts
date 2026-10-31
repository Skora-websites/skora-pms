/**
 * Device-token registry (native push — FCM/APNs via Expo).
 *
 * The registry owns one row per device. Two properties matter for an emergency
 * channel: re-registering must never accumulate rows (one SOS would ring
 * twice), and a token may only ever belong to one user, so a device that signs
 * into a second account stops alerting the first.
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import { count, eq } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeUser } from "../../../tests/helpers/fixtures";
import { db } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";
import {
  listDeviceTokens,
  registerDeviceToken,
  unregisterDeviceToken,
} from "../device-tokens";

const rowsFor = async (token: string) =>
  db.select().from(deviceTokens).where(eq(deviceTokens.token, token));

test("registering stores the device for that user", async () => {
  await withCleanFixtures(async () => {
    const doctor = await makeUser({ role: "doctor", name: "Push Doctor" });

    const result = await registerDeviceToken(doctor, "ExponentPushToken[reg0001]", "android");

    assert.equal(result.ok, true);
    const rows = await rowsFor("ExponentPushToken[reg0001]");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].userId, doctor);
    assert.equal(rows[0].platform, "android");
  });
});

test("re-registering the same device keeps exactly one row", async () => {
  await withCleanFixtures(async () => {
    const doctor = await makeUser({ role: "doctor", name: "Push Doctor" });

    await registerDeviceToken(doctor, "ExponentPushToken[reg0002]", "android");
    await registerDeviceToken(doctor, "ExponentPushToken[reg0002]", "ios");

    const rows = await rowsFor("ExponentPushToken[reg0002]");
    assert.equal(rows.length, 1, "a re-registered device must not double-alert");
    assert.equal(rows[0].platform, "ios", "the latest registration wins");
  });
});

test("a device that signs into a second account stops alerting the first", async () => {
  await withCleanFixtures(async () => {
    const first = await makeUser({ role: "doctor", name: "First Doctor" });
    const second = await makeUser({ role: "doctor", name: "Second Doctor" });

    await registerDeviceToken(first, "ExponentPushToken[shared]", "android");
    await registerDeviceToken(second, "ExponentPushToken[shared]", "android");

    const rows = await rowsFor("ExponentPushToken[shared]");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].userId, second);
    assert.deepEqual(
      (await listDeviceTokens(first)).map((t) => t.token),
      [],
      "the previous owner gets no further alerts on this device"
    );
  });
});

test("unregistering removes only the caller's own device", async () => {
  await withCleanFixtures(async () => {
    const owner = await makeUser({ role: "doctor", name: "Owner Doctor" });
    const stranger = await makeUser({ role: "doctor", name: "Stranger Doctor" });
    await registerDeviceToken(owner, "ExponentPushToken[mine0001]", "ios");

    await unregisterDeviceToken(stranger, "ExponentPushToken[mine0001]");

    assert.equal(
      (await rowsFor("ExponentPushToken[mine0001]")).length,
      1,
      "another user's logout must not delete a device"
    );

    await unregisterDeviceToken(owner, "ExponentPushToken[mine0001]");
    assert.equal((await rowsFor("ExponentPushToken[mine0001]")).length, 0);
  });
});

test("a malformed token is refused rather than stored", async () => {
  await withCleanFixtures(async () => {
    const doctor = await makeUser({ role: "doctor", name: "Push Doctor" });

    const result = await registerDeviceToken(doctor, "not a token", "android");

    assert.equal(result.ok, false);
    const rows = await db
      .select({ value: count() })
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, doctor));
    assert.equal(Number(rows[0].value), 0);
  });
});

test("listing returns only the user's own devices", async () => {
  await withCleanFixtures(async () => {
    const doctor = await makeUser({ role: "doctor", name: "Push Doctor" });
    const other = await makeUser({ role: "doctor", name: "Other Doctor" });
    await registerDeviceToken(doctor, "ExponentPushToken[own0001]", "ios");
    await registerDeviceToken(other, "ExponentPushToken[own0002]", "android");

    const mine = await listDeviceTokens(doctor);

    assert.deepEqual(
      mine.map((t) => t.token),
      ["ExponentPushToken[own0001]"]
    );
  });
});
