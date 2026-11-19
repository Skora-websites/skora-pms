import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, staffAttendances } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * POST /api/mobile/doctor/clock
 * Self shift punch-in / punch-out for doctors and clinic staff.
 * Body: {
 *   action: "check_in" | "check_out",
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "manager", "admin"]);
  if (user instanceof Response) return user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const action = body?.action;
  if (action !== "check_in" && action !== "check_out") {
    return apiError("action must be 'check_in' or 'check_out'.", 400);
  }

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 8); // "HH:MM:SS"
  const dateStr = todayStr();
  const doctorId = user.role === "doctor" ? user.id : (user.doctorId ?? user.id);

  const [existing] = await db
    .select()
    .from(staffAttendances)
    .where(
      and(
        eq(staffAttendances.staffId, user.id),
        eq(staffAttendances.date, dateStr as never)
      )
    )
    .limit(1);

  if (action === "check_in") {
    if (existing) {
      await db
        .update(staffAttendances)
        .set({
          status: "present",
          checkIn: timeStr,
          notes: body?.notes ?? existing.notes,
          updatedAt: now,
        })
        .where(eq(staffAttendances.id, existing.id));
    } else {
      await db.insert(staffAttendances).values({
        staffId: user.id,
        doctorId,
        date: dateStr as never,
        status: "present",
        checkIn: timeStr,
        notes: body?.notes ?? null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Mark clinic duty active
    await db
      .update(users)
      .set({ clinicOnDuty: true, updatedAt: now })
      .where(eq(users.id, user.id));

    return apiOk({
      action: "check_in",
      time: timeStr.slice(0, 5),
      date: dateStr,
      status: "present",
      clinicOnDuty: true,
    });
  } else {
    // check_out
    if (existing) {
      await db
        .update(staffAttendances)
        .set({
          checkOut: timeStr,
          notes: body?.notes ?? existing.notes,
          updatedAt: now,
        })
        .where(eq(staffAttendances.id, existing.id));
    } else {
      await db.insert(staffAttendances).values({
        staffId: user.id,
        doctorId,
        date: dateStr as never,
        status: "present",
        checkOut: timeStr,
        notes: body?.notes ?? null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Mark clinic duty inactive
    await db
      .update(users)
      .set({ clinicOnDuty: false, updatedAt: now })
      .where(eq(users.id, user.id));

    return apiOk({
      action: "check_out",
      time: timeStr.slice(0, 5),
      date: dateStr,
      status: "present",
      clinicOnDuty: false,
    });
  }
}
