/**
 * Fixture helper for the role-scoping suites.
 *
 * WHY NOT A ROLLED-BACK TRANSACTION: the code under test
 * (`lib/queries/*`, `lib/auth/*`) imports the app's module-level `db`
 * singleton. Fixture rows written on a *different* connection's uncommitted
 * transaction are invisible to that singleton, so every assertion would see
 * an empty database. ESM live bindings also make the singleton un-patchable
 * without changing production signatures. So: fixtures write through the
 * real `db`, and every row carries a `fixture-%` marker that
 * `cleanFixtures()` deletes before and after each test.
 *
 * That trades rollback isolation for correctness of the code under test. The
 * cost is that a killed test can leave marker rows behind — hence the
 * idempotent `cleanFixtures()` sweep at START as well as in the `finally`.
 *
 * Resolving `@/lib/db` requires the `react-server` export condition (the
 * module imports `server-only`, which throws otherwise) — `npm run test`
 * passes `--conditions react-server`.
 */

// MUST be the first import: `@/lib/db` reads process.env.DATABASE_URL at
// module scope and throws when unset; import order evaluates this module
// before the code under test.
import "dotenv/config";

import { and, eq, like, or } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  appointmentConsultConsents,
  appointments,
  clinicDoctors,
  clinicManagers,
  doctorClinics,
  modelHasPermissions,
  modelHasRoles,
  receptionistClinics,
  users,
} from "../../lib/db/schema";

/** Every fixture user is marked so the sweep can find it. */
export const FIXTURE_EMAIL_SUFFIX = "@fixture.test";

/**
 * Delete every fixture-marked row, children first. Idempotent.
 *
 * Emails are recorded before deletion because several tables reference users
 * by id only.
 */
export async function cleanFixtures(): Promise<void> {
  const marked = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `%${FIXTURE_EMAIL_SUFFIX}`));
  const ids = marked.map((m) => m.id);
  if (ids.length === 0) {
    // Orphaned clinics can exist from a killed run even with no users left.
    await db.delete(doctorClinics).where(like(doctorClinics.clinicName, "Fixture Clinic%"));
    return;
  }

  await db.delete(modelHasPermissions).where(
    or(...ids.map((id) => eq(modelHasPermissions.modelId, id)))
  );
  await db.delete(modelHasRoles).where(or(...ids.map((id) => eq(modelHasRoles.modelId, id))));
  await db.delete(appointments).where(
    or(...ids.map((id) => eq(appointments.doctorId, id)))
  );
  await db.delete(appointmentConsultConsents).where(
    or(...ids.map((id) => eq(appointmentConsultConsents.doctorId, id)))
  );
  await db.delete(receptionistClinics).where(
    or(...ids.map((id) => eq(receptionistClinics.receptionistId, id)))
  );
  await db.delete(clinicManagers).where(or(...ids.map((id) => eq(clinicManagers.userId, id))));
  await db.delete(clinicDoctors).where(or(...ids.map((id) => eq(clinicDoctors.doctorId, id))));

  await db.delete(users).where(like(users.email, `%${FIXTURE_EMAIL_SUFFIX}`));
  await db.delete(doctorClinics).where(like(doctorClinics.clinicName, "Fixture Clinic%"));
}

/**
 * Run `body` with fixture rows guaranteed to be gone before and after,
 * even when the body throws.
 */
export async function withCleanFixtures(body: () => Promise<void>): Promise<void> {
  await cleanFixtures();
  try {
    await body();
  } finally {
    await cleanFixtures();
  }
}

/**
 * NOTE ON PROCESS LIFETIME: the app's MySQL pool keeps the Node event loop
 * alive after the last assertion, which is why `npm run test` passes
 * `--test-force-exit`. Do NOT close the pool from a test-level `after()`
 * hook: when the runner executes several files in one process, that hook
 * fires after the first file and breaks every later file's inserts with
 * foreign-key / duplicate-key errors.
 */

export { and, eq };
