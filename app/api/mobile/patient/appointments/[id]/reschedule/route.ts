import { NextResponse } from "next/server";
import { reschedulePatientAppointment } from "@/app/patient/appointments/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, apiOk, csrfGuard } from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

/**
 * POST /api/mobile/patient/appointments/[id]/reschedule — patient moves their
 * own upcoming appointment to a new date and slot.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return apiError("Invalid appointment ID.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input: expected JSON body with date and time.", 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const date = String(raw.date ?? "").trim();
  const time = String(raw.time ?? "").trim();

  if (!date) return apiError("Date is required.", 400);
  if (!time) return apiError("Time slot is required.", 400);

  const res = await reschedulePatientAppointment(appointmentId, date, time);
  if (res.error) {
    return apiError(res.error, 400);
  }

  // Notify patient confirming reschedule
  void notifyUser({
    userId: user.id,
    title: "Appointment Rescheduled 🗓️",
    message: `Your appointment has been successfully rescheduled to ${date} at ${time}.`,
    type: "info",
    link: "/records",
  });

  return apiOk({ success: true, appointmentId, date, time });
}
