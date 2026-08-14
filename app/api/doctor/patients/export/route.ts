import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const startDate = searchParams.get("start_date")?.trim() ?? "";
  const endDate = searchParams.get("end_date")?.trim() ?? "";

  const conds = [eq(users.referenceRoleId, doctorId), eq(users.role, "patient")];
  if (q) {
    const like = `%${q}%`;
    conds.push(sql`(${users.name} LIKE ${like} OR ${users.phone} LIKE ${like} OR ${users.email} LIKE ${like})`);
  }
  if (startDate && endDate) {
    conds.push(sql`${users.createdAt} >= ${startDate} 00:00:00`);
    conds.push(sql`${users.createdAt} <= ${endDate} 23:59:59`);
  }

  const rows = await db
    .select({
      id: users.id,
      registrationId: users.registrationId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      dob: users.dob,
      address: users.address,
      city: users.city,
      state: users.state,
      pincode: users.pincode,
      aadhaarNo: users.aadhaarNo,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conds))
    .orderBy(desc(users.createdAt));

  const header = ["ID", "Registration ID", "Name", "Email", "Phone", "Gender", "DOB", "Address", "City", "State", "Pincode", "Aadhaar", "Status", "Registered On"];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows.map((r) => [
    r.id, r.registrationId, r.name, r.email, r.phone, r.gender, r.dob,
    r.address, r.city, r.state, r.pincode, r.aadhaarNo, r.status,
    r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "",
  ])].map((row) => row.map(esc).join(",")).join("\r\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="patients-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}