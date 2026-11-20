import { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type ClinicalTemplateMedication = {
  medicineName: string;
  dose?: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type ClinicalTemplate = {
  id: string;
  name: string;
  category: string;
  icon: string;
  diagnosis: string;
  symptoms: string;
  examination: string;
  followUp: string;
  medications: ClinicalTemplateMedication[];
  isCustom?: boolean;
};

// Standard evidence-based clinical protocols
const SYSTEM_TEMPLATES: ClinicalTemplate[] = [
  {
    id: "tpl-uri",
    name: "Viral Fever & Upper Respiratory Infection",
    category: "General / ENT",
    icon: "🤒",
    diagnosis: "Acute Upper Respiratory Tract Infection (Viral Pharyngitis)",
    symptoms: "Fever, dry cough, sore throat, nasal congestion, body ache",
    examination: "Pharyngeal erythema present, chest clear bilaterally, febrile",
    followUp: "Review after 3-5 days if fever persists above 101°F",
    medications: [
      {
        medicineName: "Paracetamol 650mg",
        dose: "650 mg",
        frequency: "1-0-1",
        duration: "3 days",
        instructions: "After food",
      },
      {
        medicineName: "Cetirizine 10mg",
        dose: "10 mg",
        frequency: "0-0-1",
        duration: "5 days",
        instructions: "At bedtime",
      },
      {
        medicineName: "Azithromycin 500mg",
        dose: "500 mg",
        frequency: "1-0-0",
        duration: "3 days",
        instructions: "Before food",
      },
    ],
  },
  {
    id: "tpl-ge",
    name: "Acute Gastroenteritis & Food Poisoning",
    category: "Gastroenterology",
    icon: "🤢",
    diagnosis: "Acute Infectious Gastroenteritis with Mild Dehydration",
    symptoms: "Watery diarrhea, nausea, abdominal cramping, mild weakness",
    examination: "Mild diffuse abdominal tenderness, soft abdomen, dry mucous membranes",
    followUp: "Follow-up in 2-3 days or SOS if unable to retain fluids",
    medications: [
      {
        medicineName: "Oral Rehydration Salts (ORS)",
        dose: "1 sachet in 1L water",
        frequency: "SOS",
        duration: "3 days",
        instructions: "With water",
      },
      {
        medicineName: "Ofloxacin + Ornidazole",
        dose: "200/500 mg",
        frequency: "1-0-1",
        duration: "5 days",
        instructions: "After food",
      },
      {
        medicineName: "Pantoprazole 40mg",
        dose: "40 mg",
        frequency: "1-0-0",
        duration: "5 days",
        instructions: "Before food",
      },
      {
        medicineName: "Dicyclomine 20mg",
        dose: "20 mg",
        frequency: "SOS",
        duration: "3 days",
        instructions: "After food",
      },
    ],
  },
  {
    id: "tpl-htn",
    name: "Primary Essential Hypertension Review",
    category: "Cardiology",
    icon: "❤️",
    diagnosis: "Primary Essential Hypertension (Stage 1 / Maintenance)",
    symptoms: "Occasional morning headache, neck stiffness, routine BP check",
    examination: "Elevated systolic/diastolic BP, S1/S2 heard, no peripheral edema",
    followUp: "Log BP daily for 2 weeks; review with vitals chart",
    medications: [
      {
        medicineName: "Telmisartan 40mg",
        dose: "40 mg",
        frequency: "1-0-0",
        duration: "1 month",
        instructions: "After food",
      },
      {
        medicineName: "Amlodipine 5mg",
        dose: "5 mg",
        frequency: "0-0-1",
        duration: "1 month",
        instructions: "After food",
      },
    ],
  },
  {
    id: "tpl-t2d",
    name: "Type 2 Diabetes Mellitus Maintenance",
    category: "Endocrinology",
    icon: "🍬",
    diagnosis: "Type 2 Diabetes Mellitus (Uncomplicated / Routine Care)",
    symptoms: "Polydipsia, post-prandial fatigue, routine glycemic review",
    examination: "Distal pulses intact, feet inspected, monofilament sensation intact",
    followUp: "Fasting & PP blood sugar weekly; HbA1c in 3 months",
    medications: [
      {
        medicineName: "Metformin 500mg SR",
        dose: "500 mg",
        frequency: "1-0-1",
        duration: "1 month",
        instructions: "After food",
      },
      {
        medicineName: "Glimepiride 1mg",
        dose: "1 mg",
        frequency: "1-0-0",
        duration: "1 month",
        instructions: "Before food",
      },
    ],
  },
  {
    id: "tpl-mig",
    name: "Acute Migraine & Tension Headache",
    category: "Neurology",
    icon: "🤕",
    diagnosis: "Acute Episodic Migraine / Tension Headache",
    symptoms: "Unilateral throbbing head pain, photophobia, phonophobia",
    examination: "Cranial nerves grossly intact, no neck rigidity, normal pupillary light reflex",
    followUp: "Maintain headache diary; review in 2 weeks",
    medications: [
      {
        medicineName: "Naproxen 500mg + Domperidone 10mg",
        dose: "1 tablet",
        frequency: "1-0-1",
        duration: "3 days",
        instructions: "After food",
      },
      {
        medicineName: "Propranolol 20mg",
        dose: "20 mg",
        frequency: "1-0-1",
        duration: "14 days",
        instructions: "After food",
      },
    ],
  },
  {
    id: "tpl-allergy",
    name: "Allergic Rhinitis & Dermatitis",
    category: "Allergy / Dermatology",
    icon: "🌿",
    diagnosis: "Allergic Rhinitis / Acute Urticarial Rash",
    symptoms: "Sneezing paroxysms, watery eyes, rhinorrhea, pruritic skin wheals",
    examination: "Turbinate swelling with pale mucosa, scattered erythematous wheals",
    followUp: "Avoid identified allergen triggers; review in 7 days",
    medications: [
      {
        medicineName: "Levocetirizine 5mg + Montelukast 10mg",
        dose: "1 tablet",
        frequency: "0-0-1",
        duration: "10 days",
        instructions: "At bedtime",
      },
      {
        medicineName: "Calamine Lotion",
        dose: "Apply topically",
        frequency: "1-0-1",
        duration: "5 days",
        instructions: "External use",
      },
    ],
  },
];

// In-memory custom templates cache per doctor session
const customTemplatesMap = new Map<number, ClinicalTemplate[]>();

/**
 * GET /api/mobile/doctor/templates
 * Returns available clinical diagnosis & prescription bundle templates.
 */
export async function GET() {
  const user = await requireApiRole(["doctor", "admin", "manager"]);
  if (user instanceof Response) return user;

  const doctorCustoms = customTemplatesMap.get(user.id) || [];
  const allTemplates = [...SYSTEM_TEMPLATES, ...doctorCustoms];

  return apiOk({ templates: allTemplates });
}

/**
 * POST /api/mobile/doctor/templates
 * Save a custom consultation template for the doctor.
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

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "Custom").trim();
  const diagnosis = String(body.diagnosis ?? "").trim();
  const symptoms = String(body.symptoms ?? "").trim();
  const examination = String(body.examination ?? "").trim();
  const followUp = String(body.followUp ?? "").trim();
  const medications = Array.isArray(body.medications) ? body.medications : [];

  if (!name) return apiError("Template name is required", 400);
  if (!diagnosis) return apiError("Primary diagnosis is required", 400);

  const newTemplate: ClinicalTemplate = {
    id: `custom-${Date.now()}`,
    name,
    category,
    icon: "📋",
    diagnosis,
    symptoms,
    examination,
    followUp,
    medications,
    isCustom: true,
  };

  const current = customTemplatesMap.get(user.id) || [];
  customTemplatesMap.set(user.id, [newTemplate, ...current]);

  return apiOk({ template: newTemplate });
}
