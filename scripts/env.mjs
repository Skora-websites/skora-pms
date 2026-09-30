/**
 * Shared, env-driven configuration for repo scripts (seed, verify, cleanup,
 * provision). No hardcoded hosts, ports, credentials, or account emails.
 *
 *   DB_URL            full mysql:// connection string (falls back to
 *                     DATABASE_URL, then the standard local default)
 *   E2E_BASE_URL      dev server the scripts talk to (default :3000)
 *   E2E_DB_HOST/PORT/USER/PASSWORD/NAME   discrete DB config (verify tools)
 *   SEED_*_EMAIL / SEED_PASSWORD   seeded demo accounts (shared with e2e)
 */
import "dotenv/config";

export const DB_URL =
  process.env.DB_URL ??
  process.env.DATABASE_URL ??
  "mysql://root@127.0.0.1:3306/skoracares_db";

/** Discrete form for scripts that build connections field-by-field. */
export const DB = {
  host: process.env.E2E_DB_HOST ?? "127.0.0.1",
  port: Number(process.env.E2E_DB_PORT ?? 3306),
  user: process.env.E2E_DB_USER ?? "root",
  password: process.env.E2E_DB_PASSWORD ?? "",
  database: process.env.E2E_DB_NAME ?? "skoracares_db",
};

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/** Shared password of every seeded demo account (must match scripts/seed.ts). */
export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Admin@123";

/** Seeded demo accounts — emails overridable to match a custom seed. */
export const ACCOUNTS = {
  superAdmin: process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@gmail.com",
  doctor: process.env.SEED_DOCTOR_EMAIL ?? "doctor@gmail.com",
  patient: process.env.SEED_PATIENT_EMAIL ?? "patient@gmail.com",
  receptionist: process.env.SEED_RECEPTIONIST_EMAIL ?? "receptionist@gmail.com",
  owner: process.env.SEED_OWNER_EMAIL ?? "owner@gmail.com",
  manager1: process.env.SEED_MANAGER1_EMAIL ?? "manager1@gmail.com",
  manager2: process.env.SEED_MANAGER2_EMAIL ?? "manager2@gmail.com",
};
