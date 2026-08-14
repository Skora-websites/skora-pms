import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.query(
    `SELECT id, name, role, doctor_id, reference_role_id, registration_id,
            LEFT(password, 20) AS pw_prefix, email, phone, gender, status,
            DATE(created_at) AS created
       FROM users
      WHERE role = 'patient'
      ORDER BY id DESC
      LIMIT 15`
  );
  console.table(rows as unknown as Record<string, unknown>[]);

  const [counts] = await conn.query(
    `SELECT role,
            COUNT(*) AS total,
            SUM(doctor_id IS NOT NULL) AS with_doctor_id,
            SUM(reference_role_id IS NOT NULL) AS with_ref_role_id
       FROM users GROUP BY role`
  );
  console.table(counts as unknown as Record<string, unknown>[]);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
