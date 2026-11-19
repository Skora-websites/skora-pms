import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type DoctorSignatureResponse = {
  doctorId: number;
  doctorName: string;
  qualification: string | null;
  specialization: string | null;
  registrationNumber: string | null;
  signaturePath: string | null;
  isSignatureConfigured: boolean;
  clinicStampTitle: string;
};

/**
 * GET /api/mobile/doctor/signature — Get the doctor's configured signature and stamp metadata.
 */
export async function GET() {
  const user = await requireApiRole(["doctor", "admin"]);
  if (user instanceof Response) return user;

  try {
    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        qualification: users.qualification,
        specialization: users.specialization,
        registrationNumber: users.registrationNumber,
        signaturePath: users.signaturePath,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!row) {
      return apiError("Doctor profile not found", 404);
    }

    const isSignatureConfigured = Boolean(row.signaturePath || row.registrationNumber);

    const data: DoctorSignatureResponse = {
      doctorId: row.id,
      doctorName: row.name,
      qualification: row.qualification ?? null,
      specialization: row.specialization ?? null,
      registrationNumber: row.registrationNumber ?? null,
      signaturePath: row.signaturePath ?? null,
      isSignatureConfigured,
      clinicStampTitle: "Official Medical Practice Seal",
    };

    return apiOk(data);
  } catch (err: any) {
    console.error("Failed to load doctor signature:", err);
    return apiError("Could not retrieve signature credentials", 500);
  }
}

/**
 * POST /api/mobile/doctor/signature — Update or register doctor's digital signature and stamp.
 */
export async function POST(request: Request) {
  const user = await requireApiRole(["doctor", "admin"]);
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    const { signatureDataUrl, registrationNumber, qualification, specialization } = body;

    const updates: Record<string, any> = {};

    if (typeof signatureDataUrl === "string" && signatureDataUrl.trim().length > 0) {
      updates.signaturePath = signatureDataUrl.trim();
    }
    if (typeof registrationNumber === "string") {
      updates.registrationNumber = registrationNumber.trim();
    }
    if (typeof qualification === "string") {
      updates.qualification = qualification.trim();
    }
    if (typeof specialization === "string") {
      updates.specialization = specialization.trim();
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No valid credentials supplied for update", 400);
    }

    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id));

    return apiOk({
      success: true,
      message: "Digital signature and credentials saved successfully.",
      isSignatureConfigured: true,
    });
  } catch (err: any) {
    console.error("Failed to update doctor signature:", err);
    return apiError("Could not save digital signature credentials", 500);
  }
}
