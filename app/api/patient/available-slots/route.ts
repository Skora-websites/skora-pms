import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/** "h:mm AM/PM" or "HH:MM" -> minutes since midnight, or null. */
function parseTimeToMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
  } else {
    if (h > 23) return null;
  }
  if (min > 59) return null;
  return h * 60 + min;
}

/** Normalize "09:30 AM" / "9:30 AM" / "14:05" → "9:30 AM" (no leading zero). */
function normalizeTime(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2];
  const meridiem = (m[3] ?? "").toUpperCase();
  if (!meridiem) {
    // 24h → 12h for comparison
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${min} ${period}`;
  }
  return `${h}:${min} ${meridiem}`;
}

function toDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(min).padStart(2, "0")} ${period}`;
}

/**
 * GET /api/patient/available-slots?doctor_id=N&date=YYYY-MM-DD
 *
 * Returns free time slots for a doctor on a given date:
 *   - slots come from the doctor's active schedule windows (30-min increments)
 *   - booked/cancelled-excluded appointments are removed
 *   - past times are removed for today
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "patient") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const doctorId = Number(searchParams.get("doctor_id"));
  const date = searchParams.get("date") ?? "";

  if (!doctorId || !Number.isInteger(doctorId) || doctorId <= 0) {
    return NextResponse.json({ error: "Invalid doctor" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // The doctor must exist and be a doctor role.
  const [doctor] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "doctor"), eq(schema.users.id, doctorId)))
    .limit(1);
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  // Active clinics + schedules for that weekday.
  const clinics = await db
    .select({ id: schema.doctorClinics.id })
    .from(schema.doctorClinics)
    .where(and(eq(schema.doctorClinics.doctorId, doctorId), eq(schema.doctorClinics.isActive, true)));

  let schedules: typeof schema.doctorSchedules.$inferSelect[] = [];
  if (clinics.length > 0) {
    const dayOfWeek = new Date(`${date}T00:00:00`)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    schedules = await db
      .select()
      .from(schema.doctorSchedules)
      .where(
        and(
          eq(schema.doctorSchedules.dayOfWeek, dayOfWeek as never),
          eq(schema.doctorSchedules.isActive, true),
          inArray(
            schema.doctorSchedules.doctorClinicId,
            clinics.map((c) => c.id)
          )
        )
      );
  }

  if (schedules.length === 0) {
    return NextResponse.json({ slots: [], message: "Doctor is not available on this day." });
  }

  // Booked times (exclude cancelled).
  const bookedRows = await db
    .select({ time: schema.appointments.time })
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.doctorId, doctorId),
        eq(schema.appointments.date, date as never),
        ne(schema.appointments.status, "cancelled")
      )
    );
  const booked = new Set(bookedRows.map((r) => normalizeTime(r.time)));

  // Build 30-min slots across each schedule window, skip booked + past.
  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots = new Set<string>();
  for (const s of schedules) {
    if (s.is24Hours) {
      for (let t = 0; t < 24 * 60; t += 30) {
        slots.add(toDisplay(t));
      }
    } else {
      const start = parseTimeToMinutes(s.startTime ?? "");
      const end = parseTimeToMinutes(s.endTime ?? "");
      if (start === null || end === null) continue;
      let endAdj = end;
      if (end <= start) endAdj = end + 24 * 60;
      for (let t = start; t < endAdj; t += 30) {
        slots.add(toDisplay(t % (24 * 60)));
      }
    }
  }

  const free = [...slots]
    .filter((slot) => !booked.has(slot))
    .filter((slot) => {
      if (!isToday) return true;
      const min = parseTimeToMinutes(slot);
      return min !== null && min > nowMin;
    })
    .sort();

  return NextResponse.json({ slots: free, message: null });
}