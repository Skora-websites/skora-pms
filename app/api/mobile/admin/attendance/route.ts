import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, staffAttendances } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

const VALID_STATUSES = ["present", "absent", "half_day", "leave"] as const;
type AttendanceStatus = (typeof VALID_STATUSES)[number];

export type StaffRosterItem = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: AttendanceStatus | "unmarked";
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
};

export type AttendanceResponse = {
  date: string;
  summary: {
    total: number;
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    unmarked: number;
  };
  roster: StaffRosterItem[];
};

/**
 * GET /api/mobile/admin/attendance?date=YYYY-MM-DD
 * Daily staff attendance roster and shift metrics.
 */
export async function GET(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "receptionist", "doctor"]);
  if (user instanceof Response) return user;

  const doctorId = user.role === "doctor" ? user.id : (user.doctorId ?? user.id);
  const dateParam = req.nextUrl.searchParams.get("date") ?? todayStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return apiError("Invalid date format. Expected YYYY-MM-DD.", 400);
  }

  // 1. Fetch practice staff (receptionists, managers, doctors)
  const staffRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      referenceRoleId: users.referenceRoleId,
      doctorId: users.doctorId,
    })
    .from(users)
    .where(
      or(
        eq(users.referenceRoleId, doctorId),
        eq(users.doctorId, doctorId),
        eq(users.id, doctorId)
      )
    )
    .orderBy(users.name);

  // 2. Fetch attendance rows for the specified date
  const attendances = await db
    .select()
    .from(staffAttendances)
    .where(
      and(
        eq(staffAttendances.doctorId, doctorId),
        eq(staffAttendances.date, dateParam as never)
      )
    );

  const byStaffId = new Map(attendances.map((a) => [a.staffId, a]));

  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let leave = 0;
  let unmarked = 0;

  const roster: StaffRosterItem[] = staffRows.map((s) => {
    const att = byStaffId.get(s.id);
    let status: AttendanceStatus | "unmarked" = "unmarked";
    let checkIn: string | null = null;
    let checkOut: string | null = null;
    let notes: string | null = null;

    if (att) {
      status = VALID_STATUSES.includes(att.status as AttendanceStatus)
        ? (att.status as AttendanceStatus)
        : "present";
      checkIn = att.checkIn ? att.checkIn.slice(0, 5) : null;
      checkOut = att.checkOut ? att.checkOut.slice(0, 5) : null;
      notes = att.notes ?? null;
    }

    if (status === "present") present++;
    else if (status === "absent") absent++;
    else if (status === "half_day") halfDay++;
    else if (status === "leave") leave++;
    else unmarked++;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: s.role,
      status,
      checkIn,
      checkOut,
      notes,
    };
  });

  const response: AttendanceResponse = {
    date: dateParam,
    summary: {
      total: roster.length,
      present,
      absent,
      halfDay,
      leave,
      unmarked,
    },
    roster,
  };

  return apiOk(response);
}

/**
 * POST /api/mobile/admin/attendance
 * Save or update staff attendance records.
 * Body: {
 *   date: "YYYY-MM-DD",
 *   attendances: [
 *     {
 *       staffId: number,
 *       status: "present" | "absent" | "half_day" | "leave",
 *       checkIn?: string | null,
 *       checkOut?: string | null,
 *       notes?: string | null
 *     }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "receptionist", "doctor"]);
  if (user instanceof Response) return user;

  const doctorId = user.role === "doctor" ? user.id : (user.doctorId ?? user.id);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const { date, attendances } = body ?? {};
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError("Valid date (YYYY-MM-DD) is required.", 400);
  }

  if (!Array.isArray(attendances) || attendances.length === 0) {
    return apiError("attendances must be a non-empty array.", 400);
  }

  const now = new Date();

  for (const item of attendances) {
    if (!item.staffId || typeof item.staffId !== "number") continue;
    const status: AttendanceStatus = VALID_STATUSES.includes(item.status)
      ? item.status
      : "present";

    const checkIn = item.checkIn ? String(item.checkIn).slice(0, 8) : null;
    const checkOut = item.checkOut ? String(item.checkOut).slice(0, 8) : null;
    const notes = item.notes ? String(item.notes) : null;

    // Check if attendance already exists for (staffId, date)
    const [existing] = await db
      .select({ id: staffAttendances.id })
      .from(staffAttendances)
      .where(
        and(
          eq(staffAttendances.staffId, item.staffId),
          eq(staffAttendances.date, date as never)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(staffAttendances)
        .set({
          status,
          checkIn,
          checkOut,
          notes,
          updatedAt: now,
        })
        .where(eq(staffAttendances.id, existing.id));
    } else {
      await db.insert(staffAttendances).values({
        staffId: item.staffId,
        doctorId,
        date: date as never,
        status,
        checkIn,
        checkOut,
        notes,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return apiOk({ success: true, count: attendances.length });
}
