import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorClinics, clinicDoctors, users } from "@/lib/db/schema";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/clinics
 * Returns list of active clinic branches with address, coordinates, contact,
 * consultation fee, and active practicing doctors.
 */
export async function GET() {
  const patient = await requirePatientActor();
  if (patient instanceof Response) return patient;

  const clinics = await db
    .select({
      id: doctorClinics.id,
      doctorId: doctorClinics.doctorId,
      clinicName: doctorClinics.clinicName,
      addressType: doctorClinics.addressType,
      address: doctorClinics.address,
      latitude: doctorClinics.latitude,
      longitude: doctorClinics.longitude,
      phone: doctorClinics.phone,
      consultationFee: doctorClinics.consultationFee,
      clinicLogo: doctorClinics.clinicLogo,
    })
    .from(doctorClinics)
    .where(eq(doctorClinics.isActive, true));

  if (clinics.length === 0) {
    return apiOk([]);
  }

  const clinicIds = clinics.map((c) => c.id);

  // Fetch affiliated doctors for all these clinics
  const affiliatedRows = await db
    .select({
      clinicId: clinicDoctors.clinicId,
      doctorId: clinicDoctors.doctorId,
    })
    .from(clinicDoctors)
    .where(
      and(
        inArray(clinicDoctors.clinicId, clinicIds),
        eq(clinicDoctors.isActive, true)
      )
    );

  // Collect all doctor IDs (both primary clinic owners and affiliated)
  const doctorIdMapByClinic = new Map<number, Set<number>>();
  const allDoctorIds = new Set<number>();

  for (const c of clinics) {
    if (!doctorIdMapByClinic.has(c.id)) {
      doctorIdMapByClinic.set(c.id, new Set<number>());
    }
    if (c.doctorId) {
      doctorIdMapByClinic.get(c.id)!.add(c.doctorId);
      allDoctorIds.add(c.doctorId);
    }
  }

  for (const aff of affiliatedRows) {
    if (doctorIdMapByClinic.has(aff.clinicId)) {
      doctorIdMapByClinic.get(aff.clinicId)!.add(aff.doctorId);
      allDoctorIds.add(aff.doctorId);
    }
  }

  // Fetch doctor profiles
  const doctorProfiles = allDoctorIds.size > 0
    ? await db
        .select({
          id: users.id,
          name: users.name,
          salutation: users.salutation,
          qualification: users.qualification,
          specialization: users.specialization,
          profilePhotoPath: users.profilePhotoPath,
        })
        .from(users)
        .where(
          and(
            inArray(users.id, Array.from(allDoctorIds)),
            eq(users.status, "active")
          )
        )
    : [];

  const doctorMap = new Map<number, (typeof doctorProfiles)[number]>();
  for (const doc of doctorProfiles) {
    doctorMap.set(doc.id, doc);
  }

  const payload = clinics.map((clinic) => {
    const docIds = doctorIdMapByClinic.get(clinic.id) ?? new Set<number>();
    const practicingDoctors: Array<{
      id: number;
      name: string;
      salutation: string | null;
      qualification: string | null;
      specialization: string | null;
      profilePhotoPath: string | null;
    }> = [];

    for (const docId of docIds) {
      const doc = doctorMap.get(docId);
      if (doc) {
        practicingDoctors.push(doc);
      }
    }

    return {
      id: clinic.id,
      clinicName: clinic.clinicName,
      addressType: clinic.addressType,
      address: clinic.address,
      latitude: clinic.latitude ? Number(clinic.latitude) : null,
      longitude: clinic.longitude ? Number(clinic.longitude) : null,
      phone: clinic.phone,
      consultationFee: clinic.consultationFee,
      clinicLogo: clinic.clinicLogo,
      doctors: practicingDoctors,
    };
  });

  return apiOk(payload);
}
