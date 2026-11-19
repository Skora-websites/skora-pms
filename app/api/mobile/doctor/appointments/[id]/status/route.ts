import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, users } from "@/lib/db/schema";
import {
  anchorDoctorId,
  apiError,
  apiOk,
  csrfGuard,
  requireDoctorModule,
} from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

const VALID_STATUSES = ["confirmed", "en_route", "arrived", "completed", "cancelled"] as const;
type ActionStatus = (typeof VALID_STATUSES)[number];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const user = await requireDoctorModule("dashboard");
  if (user instanceof Response) return user;

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return apiError("Invalid appointment ID.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request payload.", 400);
  }

  const raw = (body ?? {}) as { status?: string };
  const actionStatus = raw.status as ActionStatus;

  if (!VALID_STATUSES.includes(actionStatus)) {
    return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }

  // Fetch appointment
  const [appt] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      doctorId: appointments.doctorId,
      caseType: appointments.caseType,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      intakeNotes: appointments.intakeNotes,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appt) {
    return apiError("Appointment not found.", 404);
  }

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  let dbStatus: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" = "confirmed";
  let checkedInAt: Date | null = null;
  let intakeNoteSuffix = "";

  if (actionStatus === "en_route") {
    dbStatus = "confirmed";
    intakeNoteSuffix = `\n[Home Visit: Doctor en route at ${timeStr}]`;
  } else if (actionStatus === "arrived") {
    dbStatus = "checked_in";
    checkedInAt = now;
    intakeNoteSuffix = `\n[Home Visit: Doctor arrived at ${timeStr}]`;
  } else if (actionStatus === "completed") {
    dbStatus = "completed";
  } else if (actionStatus === "cancelled") {
    dbStatus = "cancelled";
  }

  const updatedNotes = appt.intakeNotes
    ? `${appt.intakeNotes}${intakeNoteSuffix}`
    : intakeNoteSuffix.trim();

  await db
    .update(appointments)
    .set({
      status: dbStatus,
      checkedInAt: checkedInAt ?? undefined,
      intakeNotes: updatedNotes || undefined,
      updatedAt: now,
    })
    .where(eq(appointments.id, appointmentId));

  // If patient is registered, notify them of real-time home visit approach!
  if (appt.patientId) {
    if (actionStatus === "en_route") {
      await notifyUser({
        userId: appt.patientId,
        title: "Doctor En Route 🚗",
        message: `Dr. ${user.name} is on the way to your home for your scheduled consultation.`,
        type: "appointment",
        link: "/(patient)",
        critical: true,
      });
    } else if (actionStatus === "arrived") {
      await notifyUser({
        userId: appt.patientId,
        title: "Doctor Has Arrived 📍",
        message: `Dr. ${user.name} has arrived outside your home address.`,
        type: "appointment",
        link: "/(patient)",
        critical: true,
      });
    }
  }

  return apiOk({
    appointmentId,
    status: actionStatus,
    dbStatus,
    message: `Appointment marked as ${actionStatus.replace("_", " ")}.`,
  });
}
