import type { Metadata } from "next";
import { FileText, FileDown, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getDoctorConsultPdf } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { ConsultPdfForm } from "./consult-pdf-form";

export const metadata: Metadata = { title: "Consultation PDF · Doctor" };

export default async function ConsultPdfPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const consultPdf = await getDoctorConsultPdf(doctorId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Consultation PDF"
        subtitle="This PDF is embedded in the patient consent email so patients can review your clinic&apos;s consultation terms."
      />

      <div className="card p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-accent-600 text-white shadow-md">
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">Your consultation PDF</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload a PDF with your clinic&apos;s consultation terms, disclaimers and fee structure.
              It will be attached automatically when patients are asked for consent.
            </p>
          </div>
        </div>

        {consultPdf?.pdfPath ? (
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-accent-200 bg-accent-50/60 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-accent-900">✓ PDF uploaded</p>
              <p className="mt-0.5 truncate font-mono text-xs text-accent-700">{consultPdf.pdfPath}</p>
            </div>
            <a href="/api/doctor/consult-pdf" target="_blank" className="btn-secondary">
              <FileDown className="h-4 w-4" />
              View current
            </a>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            No PDF uploaded yet. Upload one below to enable it in the consent flow.
          </p>
        )}

        <ConsultPdfForm />

        <p className="mt-6 flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4 text-sm text-brand-900">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Only you can change this file. Patients always see the latest version you upload.
        </p>
      </div>
    </div>
  );
}
