import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, staffAttendances } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/**
 * Monthly attendance report (legacy `getAttendanceReport` parity).
 * GET /api/doctor/staff/attendance/report?month=1&year=2026&staff_id=optional
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const month = Number(req.nextUrl.searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const conds = [eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")];
  const staffIdParam = req.nextUrl.searchParams.get("staff_id");
  if (staffIdParam) {
    const sid = Number(staffIdParam);
    if (Number.isInteger(sid)) conds.push(eq(users.id, sid));
  }
  const staff = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(and(...conds))
    .orderBy(users.name);

  const attendances = await db
    .select()
    .from(staffAttendances)
    .where(
      and(
        eq(staffAttendances.doctorId, doctorId),
        gte(staffAttendances.date, startDate as never),
        lte(staffAttendances.date, endDate as never)
      )
    );

  const report = staff.map((s) => {
    const staffAtts = attendances.filter((a) => a.staffId === s.id);
    const summary = {
      present: staffAtts.filter((a) => a.status === "present").length,
      absent: staffAtts.filter((a) => a.status === "absent").length,
      half_day: staffAtts.filter((a) => a.status === "half_day").length,
      leave: staffAtts.filter((a) => a.status === "leave").length,
      total_marked: staffAtts.length,
    };
    const byDate = new Map(staffAtts.map((a) => [a.date, a]));
    const days: Record<number, { status: string; check_in: string | null; check_out: string | null } | null> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const rec = byDate.get(dateStr);
      days[d] = rec
        ? {
            status: rec.status,
            check_in: rec.checkIn ? rec.checkIn.slice(0, 5) : null,
            check_out: rec.checkOut ? rec.checkOut.slice(0, 5) : null,
          }
        : null;
    }
    return {
      staff_id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      summary,
      days,
    };
  });

  return NextResponse.json({
    report,
    days_in_month: daysInMonth,
    month,
    year,
  });
}