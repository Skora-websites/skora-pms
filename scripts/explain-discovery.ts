import "dotenv/config";

import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { boundingBox } from "../lib/dispatch/geo";

async function main(): Promise<void> {
  const box = boundingBox(18.5204, 73.8567, 5);
  const plans: Array<{ name: string; query: ReturnType<typeof sql> }> = [
    {
      name: "clinic read FORCE coordinate index",
      query: sql`
EXPLAIN SELECT dc.id, dc.doctor_id
FROM doctor_clinics dc FORCE INDEX (doctor_clinics_coordinates_index)
JOIN users u ON u.id = dc.doctor_id
WHERE u.role = 'doctor' AND u.status = 'active' AND u.on_duty = 1
  AND dc.is_active = 1
  AND dc.latitude > ${box.latMin.toFixed(7)}
  AND dc.latitude < ${box.latMax.toFixed(7)}
  AND dc.longitude > ${box.lngMin.toFixed(7)}
  AND dc.longitude < ${box.lngMax.toFixed(7)}`,
    },
    {
      name: "mobile read FORCE coordinate index",
      query: sql`
EXPLAIN SELECT id
FROM users FORCE INDEX (doctors_duty_coordinates_index)
WHERE role = 'doctor' AND status = 'active' AND on_duty = 1
  AND latitude > ${box.latMin.toFixed(7)}
  AND latitude < ${box.latMax.toFixed(7)}
  AND longitude > ${box.lngMin.toFixed(7)}
  AND longitude < ${box.lngMax.toFixed(7)}`,
    },
  ];
  for (const { name, query } of plans) {
    const [result] = (await db.execute(query)) as unknown as [
      Array<Record<string, unknown>>
    ];
    console.log(`\n== ${name} ==`);
    for (const row of result) {
      console.log(
        `table=${row.table} type=${row.type} key=${row.key ?? "-"} rows=${row.rows} extra=${String(row.Extra ?? "").slice(0, 90)}`
      );
    }
  }
  process.exit(0);
}

void main();
