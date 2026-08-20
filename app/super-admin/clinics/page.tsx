import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getClinics, getDoctorOptions } from "@/lib/queries/super-admin";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { ClinicsPanel } from "./clinics-panel";

export const metadata: Metadata = { title: "Manage Clinics · Super Admin" };

export default async function ClinicsPage() {
  await requireRole(["super_admin", "admin"]);
  const [clinics, doctors] = await Promise.all([getClinics(), getDoctorOptions()]);

  const rows = clinics.map((c) => ({
    id: c.id,
    doctorId: c.doctorId,
    clinicName: c.clinicName,
    address: c.address,
    phone: c.phone,
    consultationFee: c.consultationFee,
    isActive: c.isActive,
    clinicLogo: c.clinicLogo,
    createdAt: c.createdAt ? c.createdAt.toISOString() : null,
    doctorName: c.doctorName,
  }));

  return (
    <div>
      <PageHeader
        title="Manage clinics"
        subtitle={`${clinics.length} clinic location${clinics.length === 1 ? "" : "s"} across your network`}
      />
      <ClinicsPanel clinics={rows} doctors={doctors} />
    </div>
  );
}