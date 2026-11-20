import { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type VaccineStatus = "administered" | "due" | "overdue" | "upcoming";

export type VaccineRecord = {
  id: string;
  vaccineName: string;
  diseasePrevented: string;
  doseNumber: string;
  targetAge: string;
  status: VaccineStatus;
  administeredDate: string | null;
  dueDate: string | null;
  batchNumber: string | null;
  clinicOrDoctor: string | null;
  notes: string | null;
};

export type VaccinationSummary = {
  totalAdministered: number;
  upcomingDue: number;
  overdueCount: number;
};

export type VaccinationResponse = {
  summary: VaccinationSummary;
  vaccines: VaccineRecord[];
};

const STANDARD_SCHEDULE: Omit<
  VaccineRecord,
  "id" | "status" | "administeredDate" | "dueDate" | "batchNumber" | "clinicOrDoctor" | "notes"
>[] = [
  {
    vaccineName: "BCG (Tuberculosis)",
    diseasePrevented: "Tuberculosis",
    doseNumber: "Single Dose",
    targetAge: "At Birth",
  },
  {
    vaccineName: "Hepatitis B (Birth Dose)",
    diseasePrevented: "Hepatitis B Virus",
    doseNumber: "Birth Dose",
    targetAge: "At Birth",
  },
  {
    vaccineName: "Oral Polio Vaccine (OPV-0)",
    diseasePrevented: "Poliomyelitis",
    doseNumber: "Zero Dose",
    targetAge: "At Birth",
  },
  {
    vaccineName: "DTP / Pentavalent (DTP+HepB+Hib) - 1",
    diseasePrevented: "Diphtheria, Tetanus, Pertussis, Hep B, Hib",
    doseNumber: "Dose 1",
    targetAge: "6 Weeks",
  },
  {
    vaccineName: "Inactivated Polio (IPV) - 1",
    diseasePrevented: "Poliomyelitis",
    doseNumber: "Dose 1",
    targetAge: "6 Weeks",
  },
  {
    vaccineName: "Rotavirus Oral - 1",
    diseasePrevented: "Rotavirus Diarrhea",
    doseNumber: "Dose 1",
    targetAge: "6 Weeks",
  },
  {
    vaccineName: "Pneumococcal Conjugate (PCV) - 1",
    diseasePrevented: "Pneumococcal Pneumonia & Meningitis",
    doseNumber: "Dose 1",
    targetAge: "6 Weeks",
  },
  {
    vaccineName: "DTP / Pentavalent - 2",
    diseasePrevented: "Diphtheria, Tetanus, Pertussis",
    doseNumber: "Dose 2",
    targetAge: "10 Weeks",
  },
  {
    vaccineName: "DTP / Pentavalent - 3",
    diseasePrevented: "Diphtheria, Tetanus, Pertussis",
    doseNumber: "Dose 3",
    targetAge: "14 Weeks",
  },
  {
    vaccineName: "MMR (Measles, Mumps, Rubella) - 1",
    diseasePrevented: "Measles, Mumps, Rubella",
    doseNumber: "Dose 1",
    targetAge: "9-12 Months",
  },
  {
    vaccineName: "Typhoid Conjugate Vaccine",
    diseasePrevented: "Typhoid Fever",
    doseNumber: "Dose 1",
    targetAge: "9-12 Months",
  },
  {
    vaccineName: "Hepatitis A - 1",
    diseasePrevented: "Hepatitis A Virus",
    doseNumber: "Dose 1",
    targetAge: "12 Months",
  },
  {
    vaccineName: "Varicella (Chickenpox) - 1",
    diseasePrevented: "Varicella Zoster Virus",
    doseNumber: "Dose 1",
    targetAge: "15 Months",
  },
  {
    vaccineName: "MMR - 2",
    diseasePrevented: "Measles, Mumps, Rubella",
    doseNumber: "Dose 2",
    targetAge: "15-18 Months",
  },
  {
    vaccineName: "DTP Booster - 1",
    diseasePrevented: "Diphtheria, Tetanus, Pertussis",
    doseNumber: "Booster 1",
    targetAge: "16-18 Months",
  },
  {
    vaccineName: "Influenza (Flu Shot)",
    diseasePrevented: "Seasonal Influenza Virus",
    doseNumber: "Annual Dose",
    targetAge: "Annual / All Ages",
  },
  {
    vaccineName: "Tdap Booster",
    diseasePrevented: "Tetanus, Diphtheria, Pertussis",
    doseNumber: "Booster",
    targetAge: "10-12 Years / Adult",
  },
  {
    vaccineName: "Human Papillomavirus (HPV)",
    diseasePrevented: "Cervical & HPV-related Cancers",
    doseNumber: "Dose 1",
    targetAge: "9-14 Years / Adult",
  },
  {
    vaccineName: "COVID-19 Updated Booster",
    diseasePrevented: "SARS-CoV-2",
    doseNumber: "Booster",
    targetAge: "Adult / Annual",
  },
];

// Persistent logged doses map per patient/dependent key: `${userId}_${dependentId ?? 0}`
const userLoggedVaccines = new Map<string, VaccineRecord[]>();

/**
 * GET /api/mobile/patient/vaccinations
 * Retrieve full immunization card, schedule, and administered records.
 * Query params: ?dependentId=123 (optional)
 */
export async function GET(req: NextRequest) {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  const { searchParams } = req.nextUrl;
  const rawDepId = searchParams.get("dependentId");
  const dependentId = rawDepId ? Number(rawDepId) : 0;
  const cacheKey = `${user.id}_${dependentId}`;

  const loggedList = userLoggedVaccines.get(cacheKey) || [];

  // Seed default starter administered records if fresh account
  if (loggedList.length === 0) {
    const starterDoses: VaccineRecord[] = [
      {
        id: "rec-bcg",
        vaccineName: "BCG (Tuberculosis)",
        diseasePrevented: "Tuberculosis",
        doseNumber: "Single Dose",
        targetAge: "At Birth",
        status: "administered",
        administeredDate: "2024-02-15",
        dueDate: null,
        batchNumber: "BCG-9942A",
        clinicOrDoctor: "SkoraCare Central Hospital",
        notes: "Administered at birth, left deltoid",
      },
      {
        id: "rec-hepb",
        vaccineName: "Hepatitis B (Birth Dose)",
        diseasePrevented: "Hepatitis B Virus",
        doseNumber: "Birth Dose",
        targetAge: "At Birth",
        status: "administered",
        administeredDate: "2024-02-15",
        dueDate: null,
        batchNumber: "HB-7821B",
        clinicOrDoctor: "SkoraCare Central Hospital",
        notes: "Birth dose given within 24h",
      },
      {
        id: "rec-opv",
        vaccineName: "Oral Polio Vaccine (OPV-0)",
        diseasePrevented: "Poliomyelitis",
        doseNumber: "Zero Dose",
        targetAge: "At Birth",
        status: "administered",
        administeredDate: "2024-02-15",
        dueDate: null,
        batchNumber: "OPV-4411C",
        clinicOrDoctor: "SkoraCare Central Hospital",
        notes: "Oral drops administered",
      },
    ];
    userLoggedVaccines.set(cacheKey, starterDoses);
  }

  const currentLogged = userLoggedVaccines.get(cacheKey) || [];

  // Merge with standard schedule
  const mergedVaccines: VaccineRecord[] = [];
  const loggedMap = new Map<string, VaccineRecord>();

  for (const l of currentLogged) {
    loggedMap.set(l.vaccineName, l);
  }

  for (const std of STANDARD_SCHEDULE) {
    if (loggedMap.has(std.vaccineName)) {
      mergedVaccines.push(loggedMap.get(std.vaccineName)!);
    } else {
      mergedVaccines.push({
        id: `std-${std.vaccineName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        vaccineName: std.vaccineName,
        diseasePrevented: std.diseasePrevented,
        doseNumber: std.doseNumber,
        targetAge: std.targetAge,
        status: "due",
        administeredDate: null,
        dueDate: "Scheduled per age protocol",
        batchNumber: null,
        clinicOrDoctor: null,
        notes: null,
      });
    }
  }

  // Also include any custom vaccines logged by user not in standard list
  for (const l of currentLogged) {
    if (!STANDARD_SCHEDULE.some((s) => s.vaccineName === l.vaccineName)) {
      mergedVaccines.unshift(l);
    }
  }

  const totalAdministered = mergedVaccines.filter(
    (v) => v.status === "administered"
  ).length;
  const upcomingDue = mergedVaccines.filter(
    (v) => v.status === "due" || v.status === "upcoming"
  ).length;
  const overdueCount = mergedVaccines.filter(
    (v) => v.status === "overdue"
  ).length;

  const response: VaccinationResponse = {
    summary: {
      totalAdministered,
      upcomingDue,
      overdueCount,
    },
    vaccines: mergedVaccines,
  };

  return apiOk(response);
}

/**
 * POST /api/mobile/patient/vaccinations
 * Log or update an administered vaccine record.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const vaccineName = String(body.vaccineName ?? "").trim();
  const doseNumber = String(body.doseNumber ?? "Dose 1").trim();
  const administeredDate = String(
    body.administeredDate ?? new Date().toISOString().split("T")[0]
  ).trim();
  const batchNumber = body.batchNumber ? String(body.batchNumber).trim() : null;
  const clinicOrDoctor = body.clinicOrDoctor
    ? String(body.clinicOrDoctor).trim()
    : "SkoraCare Health Clinic";
  const notes = body.notes ? String(body.notes).trim() : null;
  const dependentId = body.dependentId ? Number(body.dependentId) : 0;

  if (!vaccineName) return apiError("Vaccine name is required", 400);

  const cacheKey = `${user.id}_${dependentId}`;
  const currentLogged = userLoggedVaccines.get(cacheKey) || [];

  const newRecord: VaccineRecord = {
    id: `rec-${Date.now()}`,
    vaccineName,
    diseasePrevented: body.diseasePrevented || "Infectious Disease",
    doseNumber,
    targetAge: body.targetAge || "Immunized",
    status: "administered",
    administeredDate,
    dueDate: null,
    batchNumber,
    clinicOrDoctor,
    notes,
  };

  // Replace if vaccine already exists in logged list, else push
  const existingIdx = currentLogged.findIndex(
    (v) => v.vaccineName.toLowerCase() === vaccineName.toLowerCase()
  );

  if (existingIdx >= 0) {
    currentLogged[existingIdx] = newRecord;
  } else {
    currentLogged.push(newRecord);
  }

  userLoggedVaccines.set(cacheKey, currentLogged);

  return apiOk({ record: newRecord });
}
