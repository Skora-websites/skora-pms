import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/guard";
import { getPracticeDoctorIds } from "@/lib/queries/clinic";
import { getHomeVisitPatientDetail } from "@/lib/queries/doctor";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Module permission matches the /doctor/home-visits page (audit F-01).
  const user = await requireApiPermission(["doctor", "receptionist"], "home-visit");
  if (user instanceof Response) return user;

  const { id } = await params;
  const patientId = Number(id);
  if (!Number.isInteger(patientId)) return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });

  // Read scope, not a practice anchor: doctors see strictly their own rows
  // (rule D4); receptionists see the practice they operate in.
  const anchor = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const doctorIds =
    user.role === "doctor" ? [user.id] : await getPracticeDoctorIds(anchor);

  // A patient outside the scope yields the same 404 as a non-existent one —
  // no existence oracle.
  const data = await getHomeVisitPatientDetail(doctorIds, patientId);
  if (!data) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}