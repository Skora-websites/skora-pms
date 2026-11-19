import { NextResponse } from "next/server";
import { and, desc, eq, isNull, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations, followUpReminders, appointments, users } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type PatientFollowUpItem = {
  id: number;
  source: "consultation" | "reminder";
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string | null;
  doctorQualification: string | null;
  consultationDate: string | null;
  followUpDate: string;
  daysRemaining: number;
  status: "pending" | "overdue" | "scheduled" | "completed";
  notes: string | null;
  isBooked: boolean;
  bookedAppointmentId?: number;
  bookedAppointmentDate?: string;
};

/**
 * GET /api/mobile/patient/follow-ups — Retrieves recommended follow-ups and continuity alerts.
 */
export async function GET() {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    // 1. Fetch consultations with follow-up dates
    const consultRows = await db
      .select({
        id: consultations.id,
        doctorId: consultations.doctorId,
        doctorName: users.name,
        doctorSpecialization: users.specialization,
        doctorQualification: users.qualification,
        consultationDate: consultations.consultationDate,
        followUpDate: consultations.followUpDate,
        followUpStatus: consultations.followUpStatus,
        diagnosisNote: consultations.diagnosisNote,
        symptomsNote: consultations.symptomsNote,
      })
      .from(consultations)
      .innerJoin(users, eq(users.id, consultations.doctorId))
      .where(
        and(
          eq(consultations.patientId, user.id),
          isNull(consultations.deletedAt),
          sql`${consultations.followUpDate} IS NOT NULL AND ${consultations.followUpDate} != ''`
        )
      )
      .orderBy(desc(consultations.consultationDate))
      .limit(20);

    // 2. Fetch direct follow-up reminders
    const reminderRows = await db
      .select({
        id: followUpReminders.id,
        doctorId: followUpReminders.doctorId,
        doctorName: users.name,
        doctorSpecialization: users.specialization,
        doctorQualification: users.qualification,
        followUpDate: followUpReminders.followUpDate,
        status: followUpReminders.status,
        note: followUpReminders.note,
        createdAt: followUpReminders.createdAt,
      })
      .from(followUpReminders)
      .innerJoin(users, eq(users.id, followUpReminders.doctorId))
      .where(eq(followUpReminders.patientId, user.id))
      .orderBy(desc(followUpReminders.followUpDate))
      .limit(20);

    // 3. Fetch active appointments to detect if already re-booked
    const activeAppts = await db
      .select({
        id: appointments.id,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.date,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, user.id),
          sql`${appointments.status} NOT IN ('cancelled', 'completed')`,
          gte(appointments.date, todayStr)
        )
      );

    const items: PatientFollowUpItem[] = [];

    for (const c of consultRows) {
      if (!c.followUpDate) continue;
      const fDate = new Date(c.followUpDate);
      const diffTime = fDate.getTime() - todayDate.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Match booked appointment with same doctor on/after consultation
      const bookedAppt = activeAppts.find((a) => a.doctorId === c.doctorId);
      const isBooked = Boolean(bookedAppt);

      let status: PatientFollowUpItem["status"] = "pending";
      if (c.followUpStatus === "completed") {
        status = "completed";
      } else if (isBooked) {
        status = "scheduled";
      } else if (daysRemaining < 0) {
        status = "overdue";
      }

      items.push({
        id: c.id,
        source: "consultation",
        doctorId: c.doctorId,
        doctorName: c.doctorName ?? "Treating Doctor",
        doctorSpecialization: c.doctorSpecialization ?? null,
        doctorQualification: c.doctorQualification ?? null,
        consultationDate: c.consultationDate ? c.consultationDate.toISOString().slice(0, 10) : null,
        followUpDate: c.followUpDate,
        daysRemaining,
        status,
        notes: c.diagnosisNote || c.symptomsNote || null,
        isBooked,
        bookedAppointmentId: bookedAppt?.id,
        bookedAppointmentDate: bookedAppt?.appointmentDate ?? undefined,
      });
    }

    for (const r of reminderRows) {
      const fDate = new Date(r.followUpDate);
      const diffTime = fDate.getTime() - todayDate.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const bookedAppt = activeAppts.find((a) => a.doctorId === r.doctorId);
      const isBooked = Boolean(bookedAppt);

      let status: PatientFollowUpItem["status"] = "pending";
      if (r.status === "completed") {
        status = "completed";
      } else if (isBooked) {
        status = "scheduled";
      } else if (daysRemaining < 0) {
        status = "overdue";
      }

      // Avoid exact duplicate if consultation already covered it
      const alreadyIncluded = items.some(
        (it) => it.doctorId === r.doctorId && it.followUpDate === r.followUpDate
      );
      if (!alreadyIncluded) {
        items.push({
          id: r.id,
          source: "reminder",
          doctorId: r.doctorId,
          doctorName: r.doctorName ?? "Doctor",
          doctorSpecialization: r.doctorSpecialization ?? null,
          doctorQualification: r.doctorQualification ?? null,
          consultationDate: r.createdAt ? r.createdAt.toISOString().slice(0, 10) : null,
          followUpDate: r.followUpDate,
          daysRemaining,
          status,
          notes: r.note || null,
          isBooked,
          bookedAppointmentId: bookedAppt?.id,
          bookedAppointmentDate: bookedAppt?.appointmentDate ?? undefined,
        });
      }
    }

    // Sort: pending & overdue first by followUpDate, completed last
    items.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (b.status === "completed" && a.status !== "completed") return -1;
      return a.followUpDate.localeCompare(b.followUpDate);
    });

    return apiOk(items);
  } catch (err: any) {
    console.error("Failed to fetch patient follow-ups:", err);
    return apiError("Could not load follow-up reminders", 500);
  }
}
