import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, staffAttendances } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Daily attendance data for the doctor's staff (legacy `getAttendanceData` parity).
 * GET /api/doctor/staff/attendance?date=YYYY-MM-DD
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const date = req.nextUrl.searchParams.get("date") ?? todayStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const [staff, attendances] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
      .from(users)
      .where(and(eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")))
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