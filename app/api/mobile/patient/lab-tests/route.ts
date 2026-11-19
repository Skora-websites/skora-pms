import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { tests, users } from "@/lib/db/schema";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export interface LabTestDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  doctorId: number;
  doctorName: string;
  sampleType: string;
  fastingRequired: boolean;
  turnaroundHours: number;
}

const DEFAULT_STANDARD_TESTS = [
  {
    name: "Complete Blood Count (CBC)",
    description: "Evaluates overall health and detects anemia, infection, and leukemia.",
    price: 350,
    sampleType: "Blood",
    fastingRequired: false,
    turnaroundHours: 12,
  },
  {
    name: "Lipid Profile (Cholesterol & Triglycerides)",
    description: "Measures good/bad cholesterol to assess cardiovascular risk.",
    price: 650,
    sampleType: "Blood",
    fastingRequired: true,
    turnaroundHours: 24,
  },
  {
    name: "Thyroid Profile (T3, T4, TSH)",
    description: "Evaluates thyroid gland function and metabolism regulation.",
    price: 550,
    sampleType: "Blood",
    fastingRequired: true,
    turnaroundHours: 24,
  },
  {
    name: "HbA1c (Glycated Hemoglobin)",
    description: "3-month average blood glucose level for diabetes diagnosis and monitoring.",
    price: 450,
    sampleType: "Blood",
    fastingRequired: false,
    turnaroundHours: 12,
  },
  {
    name: "Liver Function Test (LFT)",
    description: "Checks levels of enzymes and proteins processed by the liver.",
    price: 750,
    sampleType: "Blood",
    fastingRequired: true,
    turnaroundHours: 24,
  },
  {
    name: "Kidney Function Test (KFT / RFT)",
    description: "Measures urea, creatinine, and electrolytes to assess kidney performance.",
    price: 700,
    sampleType: "Blood",
    fastingRequired: false,
    turnaroundHours: 24,
  },
  {
    name: "Vitamin D (25-Hydroxy)",
    description: "Checks for vitamin D deficiency affecting bone density and immunity.",
    price: 950,
    sampleType: "Blood",
    fastingRequired: false,
    turnaroundHours: 36,
  },
  {
    name: "Vitamin B12",
    description: "Essential for nerve function and red blood cell production.",
    price: 850,
    sampleType: "Blood",
    fastingRequired: false,
    turnaroundHours: 36,
  },
  {
    name: "Urine Routine & Microscopic Examination",
    description: "Screens for urinary tract infections, kidney disorders, and diabetes.",
    price: 250,
    sampleType: "Urine",
    fastingRequired: false,
    turnaroundHours: 12,
  },
];

/**
 * GET /api/mobile/patient/lab-tests
 * Returns active diagnostic laboratory tests available for patient booking.
 */
export async function GET() {
  const patient = await requirePatientActor();
  if (patient instanceof Response) return patient;

  // Fetch active tests in database
  const dbTests = await db
    .select({
      id: tests.id,
      name: tests.name,
      description: tests.description,
      price: tests.price,
      doctorId: tests.doctorId,
      doctorName: users.name,
    })
    .from(tests)
    .innerJoin(users, eq(users.id, tests.doctorId))
    .where(eq(tests.status, true))
    .limit(100);

  const formatted: LabTestDTO[] = dbTests.map((t) => {
    const isFasting =
      t.name.toLowerCase().includes("fasting") ||
      t.name.toLowerCase().includes("lipid") ||
      t.name.toLowerCase().includes("thyroid") ||
      t.name.toLowerCase().includes("liver");
    const isUrine = t.name.toLowerCase().includes("urine");

    return {
      id: t.id,
      name: t.name,
      description: t.description || "Clinical laboratory diagnostic test.",
      price: Number(t.price ?? 350),
      doctorId: t.doctorId,
      doctorName: t.doctorName,
      sampleType: isUrine ? "Urine" : "Blood",
      fastingRequired: isFasting,
      turnaroundHours: 24,
    };
  });

  // If clinic database currently has few or 0 tests, merge standard catalog so patients can always book
  if (formatted.length < DEFAULT_STANDARD_TESTS.length) {
    const existingNames = new Set(formatted.map((t) => t.name.toLowerCase()));
    // Fallback doctorId
    const fallbackDoctorId = formatted[0]?.doctorId || patient.doctorId || 1;
    const fallbackDoctorName = formatted[0]?.doctorName || "Skora Care Clinical Diagnostics";

    let syntheticId = 9000;
    for (const def of DEFAULT_STANDARD_TESTS) {
      if (!existingNames.has(def.name.toLowerCase())) {
        syntheticId += 1;
        formatted.push({
          id: syntheticId,
          name: def.name,
          description: def.description,
          price: def.price,
          doctorId: fallbackDoctorId,
          doctorName: fallbackDoctorName,
          sampleType: def.sampleType,
          fastingRequired: def.fastingRequired,
          turnaroundHours: def.turnaroundHours,
        });
      }
    }
  }

  return apiOk({ tests: formatted });
}
