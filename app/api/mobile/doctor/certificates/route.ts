import { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type CertificateType =
  | "sick_leave"
  | "fitness"
  | "travel_clearance"
  | "academic_absence";

export type MedicalCertificate = {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  appointmentId: number | null;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  certificateType: CertificateType;
  diagnosis: string;
  restFromDate: string | null;
  restToDate: string | null;
  fitToResumeDate: string | null;
  doctorRemarks: string | null;
  issuedDate: string;
  doctorName: string;
  doctorRegistrationNumber: string;
  clinicName: string;
  status: "issued" | "revoked";
};

// In-memory persistent certificates per doctor
const doctorCertificatesMap = new Map<number, MedicalCertificate[]>();

function getInitialCertificates(doctorName: string): MedicalCertificate[] {
  return [
    {
      id: "cert-1",
      certificateNumber: "MC-2026-4412",
      verificationCode: "VER-9812-4412",
      appointmentId: null,
      patientName: "Rajat Sharma",
      patientAge: 32,
      patientGender: "Male",
      certificateType: "sick_leave",
      diagnosis: "Acute Viral Gastroenteritis with moderate dehydration",
      restFromDate: "2026-11-10",
      restToDate: "2026-11-13",
      fitToResumeDate: "2026-11-14",
      doctorRemarks: "Advised oral rehydration salts, bland diet, and strict rest for 3 days.",
      issuedDate: "2026-11-10",
      doctorName: doctorName || "Dr. Sarah Jenkins",
      doctorRegistrationNumber: "MCI-48921-A",
      clinicName: "SkoraCare Health Clinic (Main OPD)",
      status: "issued",
    },
    {
      id: "cert-2",
      certificateNumber: "MC-2026-3981",
      verificationCode: "VER-1123-3981",
      appointmentId: null,
      patientName: "Priya Patel",
      patientAge: 28,
      patientGender: "Female",
      certificateType: "fitness",
      diagnosis: "Post-Infectious Convalescence (Recovered)",
      restFromDate: null,
      restToDate: null,
      fitToResumeDate: "2026-11-06",
      doctorRemarks: "Examined and found clinically asymptomatic, afebrile, and fit to resume regular employment duties.",
      issuedDate: "2026-11-05",
      doctorName: doctorName || "Dr. Sarah Jenkins",
      doctorRegistrationNumber: "MCI-48921-A",
      clinicName: "SkoraCare Health Clinic (Main OPD)",
      status: "issued",
    },
  ];
}

/**
 * GET /api/mobile/doctor/certificates
 * Retrieve certificates issued by doctor (optionally filter by ?appointmentId=123)
 */
export async function GET(req: NextRequest) {
  const user = await requireApiRole(["doctor", "admin", "manager"]);
  if (user instanceof Response) return user;

  const doctorId = user.id;
  if (!doctorCertificatesMap.has(doctorId)) {
    doctorCertificatesMap.set(doctorId, getInitialCertificates(user.name || "Doctor"));
  }

  const allCerts = doctorCertificatesMap.get(doctorId)!;
  const { searchParams } = req.nextUrl;
  const apptIdParam = searchParams.get("appointmentId");

  if (apptIdParam) {
    const apptId = Number(apptIdParam);
    const filtered = allCerts.filter((c) => c.appointmentId === apptId);
    return apiOk({ certificates: filtered });
  }

  return apiOk({ certificates: allCerts });
}

/**
 * POST /api/mobile/doctor/certificates
 * Issue a new official medical certificate with digital stamp & verification code.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole(["doctor", "admin", "manager"]);
  if (user instanceof Response) return user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const patientName = String(body.patientName || "").trim();
  const diagnosis = String(body.diagnosis || "").trim();
  const certificateType: CertificateType = body.certificateType || "sick_leave";

  if (!patientName) {
    return apiError("Patient name is required", 400);
  }
  if (!diagnosis) {
    return apiError("Diagnosis / Clinical condition is required", 400);
  }

  const doctorId = user.id;
  if (!doctorCertificatesMap.has(doctorId)) {
    doctorCertificatesMap.set(doctorId, getInitialCertificates(user.name || "Doctor"));
  }

  const certs = doctorCertificatesMap.get(doctorId)!;

  const random4 = Math.floor(1000 + Math.random() * 9000);
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const certNumber = `MC-${new Date().getFullYear()}-${random4}`;
  const verificationCode = `VER-${randomCode}-${random4}`;

  const newCert: MedicalCertificate = {
    id: `cert-${Date.now()}`,
    certificateNumber: certNumber,
    verificationCode: verificationCode,
    appointmentId: body.appointmentId ? Number(body.appointmentId) : null,
    patientName,
    patientAge: body.patientAge ? Number(body.patientAge) : null,
    patientGender: body.patientGender ? String(body.patientGender).trim() : null,
    certificateType,
    diagnosis,
    restFromDate: body.restFromDate ? String(body.restFromDate).trim() : null,
    restToDate: body.restToDate ? String(body.restToDate).trim() : null,
    fitToResumeDate: body.fitToResumeDate ? String(body.fitToResumeDate).trim() : null,
    doctorRemarks: body.doctorRemarks ? String(body.doctorRemarks).trim() : null,
    issuedDate: new Date().toISOString().split("T")[0],
    doctorName: user.name ? `Dr. ${user.name}` : "Dr. Attending Physician",
    doctorRegistrationNumber: "MCI-48921-A",
    clinicName: "SkoraCare Health Clinic",
    status: "issued",
  };

  certs.unshift(newCert);
  doctorCertificatesMap.set(doctorId, certs);

  return apiOk({ certificate: newCert });
}
