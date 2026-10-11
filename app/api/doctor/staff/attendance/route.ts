import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, staffAttendances } from "@/lib/db/schema";
import { requireApiPermission } from "@/lib/auth/guard";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Daily attendance data for the doctor's staff (legacy `getAttendanceData` parity).
 * GET /api/doctor/staff/attendance?date=YYYY-MM-DD
 */
export async function GET(req: NextRequest) {
  // Module permission matches the /doctor/staff page (`roles-permissions`,
  // audit F-01) — staff PII + attendance sit behind the same module.
  const user = await requireApiPermission(["doctor", "receptionist"], "roles-permissions");
  if (user instanceof Response) return user;
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const date = req.nextUrl.searchParams.get("date") ?? todayStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const [staff, attendances] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
      .from(users)
      // F-06: match EITHER link column (defence-in-depth).
      .where(
        and(
          or(eq(users.referenceRoleId, doctorId), eq(users.doctorId, doctorId)),
          eq(users.role, "receptionist")
        )
      )
      .orderBy(users.name),
    db
      .select()
      .from(staffAttendances)
      .where(and(eq(staffAttendances.doctorId, doctorId), eq(staffAttendances.date, date as never))),
  ]);

  const byStaff = new Map(attendances.map((a) => [a.staffId, a]));

  return NextResponse.json({
    date,
    data: staff.map((s) => {
      const att = byStaff.get(s.id);
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        attendance: att
          ? {
              status: att.status,
              check_in: att.checkIn ? att.checkIn.slice(0, 5) : null,
              check_out: att.checkOut ? att.checkOut.slice(0, 5) : null,
              notes: att.notes,
            }
          : null,
      };
    }),
  });
}