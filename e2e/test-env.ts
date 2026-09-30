/**
 * Single source of truth for e2e test configuration. Everything is
 * env-overridable — no hardcoded ports, hosts, account emails, or passwords.
 *
 *   E2E_BASE_URL          dev server under test (default http://localhost:3100)
 *   E2E_DB_HOST/PORT/USER/PASSWORD/NAME   direct-DB assertion connection
 *   SEED_SUPER_ADMIN_EMAIL / SEED_DOCTOR_EMAIL / SEED_PATIENT_EMAIL /
 *   SEED_RECEPTIONIST_EMAIL / SEED_OWNER_EMAIL / SEED_MANAGER1_EMAIL /
 *   SEED_MANAGER2_EMAIL   seeded accounts (shared with scripts/seed.ts)
 *   SEED_PASSWORD         shared password for every seeded account
 */
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export const DB = {
  host: process.env.E2E_DB_HOST ?? "127.0.0.1",
  port: Number(process.env.E2E_DB_PORT ?? 3306),
  user: process.env.E2E_DB_USER ?? "root",
  password: process.env.E2E_DB_PASSWORD ?? "",
  database: process.env.E2E_DB_NAME ?? "skoracares_db",
};

/** Shared password of every seeded demo account (see scripts/seed.ts). */
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

export type DbRow<T> = [T, unknown]; // mysql2 returns [rows, fields]
