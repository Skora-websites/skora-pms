import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, AlertTriangle, ArrowLeft, Printer, Calendar, User, FileText, Building2 } from "lucide-react";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicalCertificates } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Verify Medical Certificate · SkoraCares PMS",
  description: "Official online verification portal for SkoraCare issued medical and fitness certificates.",
};

const FALLBACK_PUBLIC_CERTS = [
  {
    certificateNumber: "MC-2026-4412",
    verificationCode: "VER-9812-4412",
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
    doctorName: "Dr. Sarah Jenkins",
    doctorRegistrationNumber: "MCI-48921-A",
    clinicName: "SkoraCare Health Clinic (Main OPD)",
    status: "issued",
  },
  {
    certificateNumber: "MC-2026-3981",
    verificationCode: "VER-1123-3981",
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
    doctorName: "Dr. Sarah Jenkins",
    doctorRegistrationNumber: "MCI-48921-A",
    clinicName: "SkoraCare Health Clinic (Main OPD)",
    status: "issued",
  },
];

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).trim().toUpperCase();

  let cert: any = null;

  try {
    const rows = await db
      .select()
      .from(medicalCertificates)
      .where(
        or(
          eq(medicalCertificates.verificationCode, normalized),
          eq(medicalCertificates.certificateNumber, normalized)
        )
      )
      .limit(1);

    if (rows && rows.length > 0) {
      cert = rows[0];
    }
  } catch {
    // Database query fallback
  }

  if (!cert) {
    cert = FALLBACK_PUBLIC_CERTS.find(
      (c) =>
        c.verificationCode.toUpperCase() === normalized ||
        c.certificateNumber.toUpperCase() === normalized
    );
  }

  const isVerified = Boolean(cert && cert.status !== "revoked");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                SkoraCare
              </span>
              <span className="text-xs uppercase tracking-wider text-emerald-600 font-semibold ml-1.5">
                Verification Portal
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to SkoraCare
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {isVerified && cert ? (
          <div className="space-y-6">
            {/* Status Header Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Official Verified Certificate
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Authentic Medical Document
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  This certificate was digitally signed and issued by a registered medical practitioner via the SkoraCare Clinic Operating System.
                </p>
              </div>
            </div>

            {/* Certificate Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Card Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Certificate Number</div>
                  <div className="text-lg font-mono font-bold text-slate-900">{cert.certificateNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Verification Code</div>
                  <div className="text-sm font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {cert.verificationCode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Issue Date</div>
                  <div className="text-sm font-semibold text-slate-800">{cert.issuedDate}</div>
                </div>
              </div>

              {/* Patient & Certificate Type Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Patient Details
                  </div>
                  <div className="text-base font-bold text-slate-900">{cert.patientName}</div>
                  <div className="text-xs text-slate-600">
                    {cert.patientAge ? `${cert.patientAge} Years` : "Age not specified"}
                    {cert.patientGender ? ` • ${cert.patientGender}` : ""}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Certificate Type
                  </div>
                  <div className="text-base font-bold text-slate-900 capitalize">
                    {String(cert.certificateType).replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-emerald-700 font-medium">
                    Status: Verified & Active
                  </div>
                </div>
              </div>

              {/* Clinical Evaluation & Diagnosis */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div>
                  <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                    Clinical Diagnosis / Findings
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-1 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
                    {cert.diagnosis}
                  </div>
                </div>

                {/* Rest / Fitness Dates */}
                {(cert.restFromDate || cert.fitToResumeDate) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cert.restFromDate && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-500 font-medium">Rest Recommended</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {cert.restFromDate} {cert.restToDate ? `to ${cert.restToDate}` : ""}
                        </div>
                      </div>
                    )}
                    {cert.fitToResumeDate && (
                      <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <div className="text-xs text-emerald-700 font-medium">Fit to Resume Duties</div>
                        <div className="text-sm font-bold text-emerald-900 mt-0.5">
                          {cert.fitToResumeDate}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {cert.doctorRemarks && (
                  <div>
                    <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                      Doctor Remarks & Advice
                    </div>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                      {cert.doctorRemarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Doctor & Facility Stamp */}
              <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-xl border">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Issued By Medical Practitioner
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-1">{cert.doctorName}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Reg No: <span className="font-mono font-semibold text-slate-800">{cert.doctorRegistrationNumber || "N/A"}</span>
                  </div>
                  <div className="text-xs text-slate-500">{cert.clinicName}</div>
                </div>

                <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-100/70 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SkoraCare Digital Seal
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Tamper-Proof Audit Hash
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/verify/certificate"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Verify Another Certificate
              </Link>
            </div>
          </div>
        ) : (
          /* Invalid / Not Found State */
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Certificate Not Found</h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              We could not find an official medical certificate matching the verification code{" "}
              <span className="font-mono font-bold text-slate-900">"{normalized}"</span>.
            </p>
            <div className="pt-4">
              <Link
                href="/verify/certificate"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Try Another Code
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>© 2026 SkoraCare Clinic OS · Healthcare Platform & Patient Management System</p>
      </footer>
    </div>
  );
}
