import { NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations, followUpReminders, users } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type DoctorFollowUpRow = {
  id: number;
  source: "consultation" | "reminder";
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  consultationDate: string | null;
  followUpDate: string;
  daysRemaining: number;
  status: string;
  notes: string | null;
  comment: string | null;
};

/**
 * GET /api/mobile/doctor/follow-ups — Retrieves patients due for clinical follow-up.
 */
export async function GET() {
  const user = await requireApiRole(["doctor", "admin"]);
  if (user instanceof Response) return user;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    // 1. Fetch consultations with followUpDate for this doctor
    const consultRows = await db
      .select({
        id: consultations.id,
        patientId: consultations.patientId,
        patientName: users.name,
        patientPhone: users.phone,
        patientEmail: users.email,
        consultationDate: consultations.consultationDate,
        followUpDate: consultations.followUpDate,
        followUpStatus: consultations.followUpStatus,
        followUpComment: consultations.followUpComment,
        diagnosisNote: consultations.diagnosisNote,
        symptomsNote: consultations.symptomsNote,
      })
      .from(consultations)
      .innerJoin(users, eq(users.id, consultations.patientId))
      .where(
        and(
          eq(consultations.doctorId, user.id),
          isNull(consultations.deletedAt),
          sql`${consultations.followUpDate} IS NOT NULL AND ${consultations.followUpDate} != ''`
        )
      )
      .orderBy(desc(consultations.consultationDate))
      .limit(50);

    // 2. Fetch followUpReminders for this doctor
    const reminderRows = await db
      .select({
        id: followUpReminders.id,
        patientId: followUpReminders.patientId,
        patientName: users.name,
        patientPhone: users.phone,
        patientEmail: users.email,
        followUpDate: followUpReminders.followUpDate,
        status: followUpReminders.status,
        note: followUpReminders.note,
        createdAt: followUpReminders.createdAt,
      })
      .from(followUpReminders)
      .innerJoin(users, eq(users.id, followUpReminders.patientId))
      .where(eq(followUpReminders.doctorId, user.id))
      .orderBy(desc(followUpReminders.followUpDate))
      .limit(50);

    const list: DoctorFollowUpRow[] = [];

    for (const c of consultRows) {
      if (!c.followUpDate) continue;
      const fDate = new Date(c.followUpDate);
      const diffTime = fDate.getTime() - todayDate.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      list.push({
        id: c.id,
        source: "consultation",
        patientId: c.patientId,
        patientName: c.patientName ?? "Patient",
        patientPhone: c.patientPhone ?? null,
        patientEmail: c.patientEmail ?? null,
        consultationDate: c.consultationDate ? c.consultationDate.toISOString().slice(0, 10) : null,
        followUpDate: c.followUpDate,
        daysRemaining,
        status: c.followUpStatus || "pending",
        notes: c.diagnosisNote || c.symptomsNote || null,
        comment: c.followUpComment || null,
      });
    }

    for (const r of reminderRows) {
      const fDate = new Date(r.followUpDate);
      const diffTime = fDate.getTime() - todayDate.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      list.push({
        id: r.id,
        source: "reminder",
        patientId: r.patientId,
        patientName: r.patientName ?? "Patient",
        patientPhone: r.patientPhone ?? null,
        patientEmail: r.patientEmail ?? null,
        consultationDate: r.createdAt ? r.createdAt.toISOString().slice(0, 10) : null,
        followUpDate: r.followUpDate,
        daysRemaining,
        status: r.status || "pending",
        notes: r.note || null,
        comment: null,
      });
    }

    // Sort earliest follow-up date first
    list.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

    return apiOk(list);
  } catch (err: any) {
    console.error("Doctor follow-ups error:", err);
    return apiError("Could not load doctor follow-ups", 500);
  }
}

/**
 * PATCH /api/mobile/doctor/follow-ups — Updates follow-up status (called / completed / cancelled).
 */
export async function PATCH(request: Request) {
  const user = await requireApiRole(["doctor", "admin"]);
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    const { id, source, status, comment } = body;

    if (!id || typeof id !== "number") {
      return apiError("Valid follow-up ID is required", 400);
    }

    const nextStatus = typeof status === "string" ? status : "completed";

    if (source === "consultation") {
      await db
        .update(consultations)
        .set({
          followUpStatus: nextStatus,
          followUpComment: comment ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(consultations.id, id),
            eq(consultations.doctorId, user.id)
          )
        );
    } else {
      await db
        .update(followUpReminders)
        .set({
          status: nextStatus,
          note: comment ?? undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(followUpReminders.id, id),
            eq(followUpReminders.doctorId, user.id)
          )
        );
    }

    return apiOk({ success: true, id, status: nextStatus });
  } catch (err: any) {
    console.error("Update doctor follow-up error:", err);
    return apiError("Could not update follow-up", 500);
  }
}
