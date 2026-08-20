import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getHomeVisitPatientDetail } from "@/lib/queries/doctor";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { id } = await params;
  const patientId = Number(id);
  if (!Number.isInteger(patientId)) return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });

  const data = await getHomeVisitPatientDetail(doctorId, patientId);
  if (!data) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}