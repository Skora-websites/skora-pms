import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, like, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctor/appointments/export?status=&search_name=&search_phone=&start_date=&end_date=&selected_ids=
 * Downloads a CSV of the doctor's appointments (RFC-4180 + UTF-8 BOM),
 * mirroring the legacy AppointmentsExport columns.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? null;
  const searchName = url.searchParams.get("search_name") ?? null;
  const searchPhone = url.searchParams.get("search_phone") ?? null;
  const startDate = url.searchParams.get("start_date") ?? null;
  const endDate = url.searchParams.get("end_date") ?? null;
  const selectedIds = url.searchParams.get("selected_ids");

  const conds = [eq(appointments.doctorId, doctorId)];

  if (status) {
    // Legacy treats "pending" filter as status = confirmed.
    conds.push(eq(appointments.status, (status === "pending" ? "confirmed" : status) as never));
  }
  if (searchName) {
    conds.push(like(users.name, `%${searchName}%`));
  }
  if (searchPhone) {
    conds.push(like(users.phone, `%${searchPhone}%`));
  }
  if (startDate && endDate) {
    conds.push(gte(appointments.date, startDate as never));
    conds.push(lte(appointments.date, endDate as never));
  }

  // Default to today when no date/search filters are given (legacy behaviour).
  const hasFilters = Boolean(startDate || endDate || searchName || searchPhone);
  if (!hasFilters) {
    conds.push(eq(appointments.date, new Date().toISOString().slice(0, 10) as never));
  }

  let ids: number[] = [];
  if (selectedIds) {
    try {
      const parsed = JSON.parse(selectedIds);
      if (Array.isArray(parsed)) ids = parsed.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    } catch {
      ids = [];
    }
    if (ids.length > 0) conds.push(inArray(appointments.id, ids));
  }

  const rows = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      caseType: appointments.caseType,
      status: appointments.status,
      bloodGroup: appointments.bloodGroup,
      bp: appointments.bp,
      weight: appointments.weight,
      height: appointments.height,
      remarks: appointments.remarks,
      note: appointments.note,
      patientId: appointments.patientId,
      patientString: appointments.patientString,
      mobileNumber: appointments.mobileNumber,
      patientName: users.name,
      patientPhone: users.phone,
      patientGender: users.gender,
      patientDob: users.dob,
    })
    .from(appointments)
    .leftJoin(users, eq(users.id, appointments.patientId))
    .where(and(...conds))
    .orderBy(desc(appointments.date), desc(appointments.time));

  // ── Build CSV (RFC-4180) ──
  const headers = [
    "Sr No",
    "Patient Name",
    "Contact",
    "Visit Type",
    "Date",
    "Time",
    "Gender",
    "Age",
    "Blood Group",
    "BP",
    "Weight",
    "Height",
    "Status",
    "Remarks",
    "Note",
  ];

  const csv = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "N/A" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const age = (dob: string | Date | null): string => {
    if (!dob) return "N/A";
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "N/A";
    const diff = Date.now() - birth.getTime();
    const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    return years >= 0 ? `${years} years` : "N/A";
  };

  const lines = [headers.map(csv).join(",")];
  rows.forEach((r, i) => {
    const visitType = r.caseType ? r.caseType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A";
    const status = r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "N/A";
    const patientName = r.patientName ?? r.patientString ?? "N/A";
    const contact = r.patientPhone ?? r.mobileNumber ?? "N/A";
    const date = r.date ? formatDate(r.date) : "N/A";
    lines.push(
      [
        i + 1,
        patientName,
        contact,
        visitType,
        date,
        r.time ?? "N/A",
        r.patientGender ?? "N/A",
        age(r.patientDob ?? null),
        r.bloodGroup ?? "N/A",
        r.bp ?? "N/A",
        r.weight ? `${r.weight} kg` : "N/A",
        r.height ? `${r.height} cm` : "N/A",
        status,
        r.remarks ?? "N/A",
        r.note ?? "N/A",
      ]
        .map(csv)
        .join(",")
    );
  });

  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const filename = `appointments_${stamp}.csv`;

  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}
