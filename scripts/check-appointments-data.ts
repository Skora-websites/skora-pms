import "dotenv/config";
import { db } from "../lib/db";
import { appointments, doctorSchedules, doctorClinics } from "../lib/db/schema";
import { and, eq, ne } from "drizzle-orm";

async function main() {
  const appts = await db
    .select({
      id: appointments.id,
      doctorId: appointments.doctorId,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      patientString: appointments.patientString,
    })
    .from(appointments)
    .orderBy(appointments.id)
    .limit(15);
  console.log("=== appointments (last 15) ===");
  for (const a of appts) console.log(JSON.stringify(a));

  const count = await db.select({ n: db.$count(appointments) }).from(appointments);
  console.log("total appointments:", count[0].n);

  const clinics = await db
    .select({ id: doctorClinics.id, doctorId: doctorClinics.doctorId, clinicName: doctorClinics.clinicName, isActive: doctorClinics.isActive })
    .from(doctorClinics);
  console.log("=== clinics ===", clinics);

  const schedules = await db
    .select({
      id: doctorSchedules.id,
      doctorClinicId: doctorSchedules.doctorClinicId,
      dayOfWeek: doctorSchedules.dayOfWeek,
      startTime: doctorSchedules.startTime,
      endTime: doctorSchedules.endTime,
      sessionType: doctorSchedules.sessionType,
      maxPatients: doctorSchedules.maxPatients,
      is24Hours: doctorSchedules.is24Hours,
      isActive: doctorSchedules.isActive,
    })
    .from(doctorSchedules)
    .orderBy(doctorSchedules.doctorClinicId);
  console.log("=== schedules ===");
  for (const s of schedules) console.log(JSON.stringify(s));
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
