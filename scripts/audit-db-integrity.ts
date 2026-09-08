/**
 * DB integrity audit: orphans, duplicates, FK cascade behavior, nullable
 * violations, inconsistent status values. READ-ONLY.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const c = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    database: "skoracares_db",
  });

  const q = async (label: string, sql: string) => {
    try {
      const [rows] = await c.query(sql);
      const r = rows as Record<string, unknown>[];
      console.log(`${label}: ${r.length === 0 ? "OK (0)" : JSON.stringify(r.slice(0, 5))}`);
    } catch (e) {
      console.log(`${label}: QUERY ERROR — ${String(e).slice(0, 120)}`);
    }
  };

  // Orphaned records (FK integrity)
  await q("appointments→patient orphan", `SELECT a.id FROM appointments a LEFT JOIN users u ON u.id = a.patient_id WHERE a.patient_id IS NOT NULL AND u.id IS NULL`);
  await q("appointments→doctor orphan", `SELECT a.id FROM appointments a LEFT JOIN users u ON u.id = a.doctor_id WHERE u.id IS NULL`);
  await q("consultations→patient orphan", `SELECT c.id FROM consultations c LEFT JOIN users u ON u.id = c.patient_id WHERE u.id IS NULL`);
  await q("consultations→appointment orphan", `SELECT c.id FROM consultations c LEFT JOIN appointments a ON a.id = c.appointment_id WHERE c.appointment_id IS NOT NULL AND a.id IS NULL`);
  await q("billings→patient orphan", `SELECT b.id FROM billings b LEFT JOIN users u ON u.id = b.patient_id WHERE b.patient_id IS NOT NULL AND u.id IS NULL`);
  await q("transactions→user orphan", `SELECT t.id FROM transactions t LEFT JOIN users u ON u.id = t.user_id WHERE u.id IS NULL`);
  await q("testBookings→patient orphan", `SELECT t.id FROM test_bookings t LEFT JOIN users u ON u.id = t.patient_id WHERE u.id IS NULL`);
  await q("testBookings→vendor orphan", `SELECT t.id FROM test_bookings t LEFT JOIN vendors v ON v.id = t.vendor_id WHERE t.vendor_id IS NOT NULL AND v.id IS NULL`);
  await q("sosOffers→request orphan", `SELECT o.id FROM sos_offers o LEFT JOIN sos_requests r ON r.id = o.sos_request_id WHERE r.id IS NULL`);
  await q("sosCases→request orphan", `SELECT sc.id FROM sos_cases sc LEFT JOIN sos_requests r ON r.id = sc.sos_request_id WHERE r.id IS NULL`);
  await q("notifications→user orphan", `SELECT n.id FROM notifications n LEFT JOIN users u ON u.id = n.user_id WHERE u.id IS NULL`);
  await q("pushSubs→user orphan", `SELECT p.id FROM push_subscriptions p LEFT JOIN users u ON u.id = p.user_id WHERE u.id IS NULL`);

  // Duplicate checks
  await q("duplicate user emails", `SELECT email, COUNT(*) n FROM users GROUP BY email HAVING n > 1`);
  await q("duplicate active schedules (clinic+day+session)", `SELECT doctor_clinic_id, day_of_week, session_type, COUNT(*) n FROM doctor_schedules WHERE is_active = 1 GROUP BY doctor_clinic_id, day_of_week, session_type HAVING n > 1`);
  await q("duplicate bill numbers", `SELECT bill_number, COUNT(*) n FROM billings GROUP BY bill_number HAVING n > 1`);

  // Status value consistency
  await q("appointment statuses", `SELECT status, COUNT(*) n FROM appointments GROUP BY status`);
  await q("booking statuses", `SELECT status, COUNT(*) n FROM test_bookings GROUP BY status`);
  await q("billing statuses", `SELECT status, COUNT(*) n FROM billings GROUP BY status`);
  await q("transaction statuses", `SELECT status, COUNT(*) n FROM transactions GROUP BY status`);
  await q("sos request statuses", `SELECT status, COUNT(*) n FROM sos_requests GROUP BY status`);

  // Soft-delete consistency: bills soft-deleted but linked tx not
  await q("soft-deleted bill w/ live tx", `SELECT b.id, t.id txId FROM billings b JOIN transactions t ON t.billing_id = b.id WHERE b.deleted_at IS NOT NULL AND t.deleted_at IS NULL`);
  await q("live bill w/ soft-deleted tx", `SELECT b.id, t.id txId FROM billings b JOIN transactions t ON t.billing_id = b.id WHERE b.deleted_at IS NULL AND t.deleted_at IS NOT NULL`);

  // Stale SOS: pending requests older than TTL (5 min)
  await q("stale pending SOS (>5min)", `SELECT id, created_at FROM sos_requests WHERE status = 'pending' AND created_at < NOW() - INTERVAL 5 MINUTE`);

  // FK cascade definitions (verify ON DELETE behavior)
  const [fks] = await c.query(
    `SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE
     FROM information_schema.KEY_COLUMN_USAGE k
     JOIN information_schema.REFERENTIAL_CONSTRAINTS r
       ON r.CONSTRAINT_NAME = k.CONSTRAINT_NAME AND r.CONSTRAINT_SCHEMA = k.TABLE_SCHEMA AND r.TABLE_NAME = k.TABLE_NAME
     WHERE k.TABLE_SCHEMA = 'skoracares_db' AND k.REFERENCED_TABLE_NAME = 'users'`
  );
  console.log("FKs referencing users:", JSON.stringify(fks, null, 1));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
