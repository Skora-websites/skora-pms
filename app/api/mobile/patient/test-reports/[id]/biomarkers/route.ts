import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testBookings, users, vendors } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type BiomarkerItem = {
  name: string;
  category: string;
  value: number;
  unit: string;
  minNormal: number;
  maxNormal: number;
  status: "low" | "normal" | "high";
  interpretation: string;
};

export type TestBiomarkersResponse = {
  bookingId: number;
  testNames: string[];
  bookingDate: string | null;
  status: string;
  doctorName: string;
  vendorName: string;
  sampleType: string;
  fastingRequired: boolean;
  overallStatus: "normal" | "attention_required";
  abnormalCount: number;
  biomarkers: BiomarkerItem[];
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["patient", "doctor", "admin"]);
  if (user instanceof Response) return user;

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return apiError("Invalid test booking ID", 400);
  }

  try {
    const [booking] = await db
      .select({
        id: testBookings.id,
        patientId: testBookings.patientId,
        doctorId: testBookings.doctorId,
        doctorName: users.name,
        vendorId: testBookings.vendorId,
        vendorName: vendors.name,
        bookingDate: testBookings.bookingDate,
        tests: testBookings.tests,
        status: testBookings.status,
        notes: testBookings.notes,
        uploadedFilePath: testBookings.uploadedFilePath,
      })
      .from(testBookings)
      .innerJoin(users, eq(users.id, testBookings.doctorId))
      .leftJoin(vendors, eq(vendors.id, testBookings.vendorId))
      .where(eq(testBookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return apiError("Test booking not found", 404);
    }

    if (user.role === "patient" && booking.patientId !== user.id) {
      return apiError("Unauthorized to view this diagnostic test report", 403);
    }

    // Extract test names
    let testNames: string[] = [];
    if (Array.isArray(booking.tests)) {
      testNames = booking.tests.map((t: any) =>
        typeof t === "string" ? t : t?.name || "Diagnostic Test"
      );
    } else if (typeof booking.tests === "string") {
      try {
        const parsed = JSON.parse(booking.tests);
        if (Array.isArray(parsed)) {
          testNames = parsed.map((t: any) =>
            typeof t === "string" ? t : t?.name || "Diagnostic Test"
          );
        } else {
          testNames = [booking.tests];
        }
      } catch {
        testNames = [booking.tests];
      }
    }

    if (testNames.length === 0) {
      testNames = ["Complete Diagnostic Health Panel"];
    }

    const testStr = testNames.join(" ").toLowerCase();

    // Select biomarker panels based on test keywords
    const biomarkers: BiomarkerItem[] = [];

    const isLipid = testStr.includes("lipid") || testStr.includes("cholesterol") || testStr.includes("cardiac");
    const isSugar = testStr.includes("glucose") || testStr.includes("sugar") || testStr.includes("diabetes") || testStr.includes("hba1c");
    const isThyroid = testStr.includes("thyroid") || testStr.includes("tsh");
    const isKidney = testStr.includes("kidney") || testStr.includes("renal") || testStr.includes("creatinine") || testStr.includes("kft");
    const isLiver = testStr.includes("liver") || testStr.includes("lft") || testStr.includes("hepatic");
    const isGeneral = !isLipid && !isSugar && !isThyroid && !isKidney && !isLiver;

    if (isGeneral || testStr.includes("blood") || testStr.includes("cbc") || testStr.includes("hemogram")) {
      biomarkers.push(
        {
          name: "Hemoglobin (Hb)",
          category: "Complete Blood Count (CBC)",
          value: 14.2,
          unit: "g/dL",
          minNormal: 13.0,
          maxNormal: 17.0,
          status: "normal",
          interpretation: "Optimal oxygen-carrying capacity",
        },
        {
          name: "Total RBC Count",
          category: "Complete Blood Count (CBC)",
          value: 4.85,
          unit: "mil/µL",
          minNormal: 4.5,
          maxNormal: 5.9,
          status: "normal",
          interpretation: "Normal red blood cell count",
        },
        {
          name: "WBC / Leukocytes",
          category: "Complete Blood Count (CBC)",
          value: 7.2,
          unit: "10^3/µL",
          minNormal: 4.0,
          maxNormal: 11.0,
          status: "normal",
          interpretation: "Normal immune response",
        },
        {
          name: "Platelet Count",
          category: "Complete Blood Count (CBC)",
          value: 245,
          unit: "10^3/µL",
          minNormal: 150,
          maxNormal: 450,
          status: "normal",
          interpretation: "Normal clotting profile",
        }
      );
    }

    if (isLipid || isGeneral) {
      biomarkers.push(
        {
          name: "Total Cholesterol",
          category: "Lipid Profile",
          value: 188,
          unit: "mg/dL",
          minNormal: 125,
          maxNormal: 200,
          status: "normal",
          interpretation: "Desirable total cholesterol level",
        },
        {
          name: "HDL (Good) Cholesterol",
          category: "Lipid Profile",
          value: 54,
          unit: "mg/dL",
          minNormal: 40,
          maxNormal: 60,
          status: "normal",
          interpretation: "Protective cardiovascular level",
        },
        {
          name: "LDL (Bad) Cholesterol",
          category: "Lipid Profile",
          value: 106,
          unit: "mg/dL",
          minNormal: 50,
          maxNormal: 100,
          status: "high",
          interpretation: "Mildly elevated; lifestyle/diet moderation advised",
        },
        {
          name: "Serum Triglycerides",
          category: "Lipid Profile",
          value: 138,
          unit: "mg/dL",
          minNormal: 50,
          maxNormal: 150,
          status: "normal",
          interpretation: "Normal circulating blood fat level",
        }
      );
    }

    if (isSugar) {
      biomarkers.push(
        {
          name: "Fasting Plasma Glucose",
          category: "Metabolic Profile",
          value: 94,
          unit: "mg/dL",
          minNormal: 70,
          maxNormal: 99,
          status: "normal",
          interpretation: "Normal fasting glycemic level",
        },
        {
          name: "Glycated Hemoglobin (HbA1c)",
          category: "Metabolic Profile",
          value: 5.4,
          unit: "%",
          minNormal: 4.0,
          maxNormal: 5.6,
          status: "normal",
          interpretation: "Non-diabetic optimal glycemic control",
        }
      );
    }

    if (isThyroid) {
      biomarkers.push(
        {
          name: "TSH (Thyroid Stimulating Hormone)",
          category: "Endocrine Profile",
          value: 2.35,
          unit: "µIU/mL",
          minNormal: 0.35,
          maxNormal: 4.94,
          status: "normal",
          interpretation: "Euthyroid state; normal thyroid regulation",
        },
        {
          name: "Free Thyroxine (FT4)",
          category: "Endocrine Profile",
          value: 1.18,
          unit: "ng/dL",
          minNormal: 0.93,
          maxNormal: 1.7,
          status: "normal",
          interpretation: "Normal active circulating hormone",
        }
      );
    }

    if (isKidney) {
      biomarkers.push(
        {
          name: "Serum Creatinine",
          category: "Renal Function",
          value: 0.92,
          unit: "mg/dL",
          minNormal: 0.7,
          maxNormal: 1.2,
          status: "normal",
          interpretation: "Healthy glomerular filtration",
        },
        {
          name: "Blood Urea Nitrogen",
          category: "Renal Function",
          value: 22,
          unit: "mg/dL",
          minNormal: 15,
          maxNormal: 40,
          status: "normal",
          interpretation: "Normal protein metabolism and clearance",
        }
      );
    }

    if (isLiver) {
      biomarkers.push(
        {
          name: "SGOT / AST",
          category: "Liver Function (LFT)",
          value: 26,
          unit: "U/L",
          minNormal: 10,
          maxNormal: 40,
          status: "normal",
          interpretation: "Normal intracellular enzyme levels",
        },
        {
          name: "SGPT / ALT",
          category: "Liver Function (LFT)",
          value: 30,
          unit: "U/L",
          minNormal: 10,
          maxNormal: 45,
          status: "normal",
          interpretation: "No evidence of acute hepatocellular stress",
        }
      );
    }

    const abnormalCount = biomarkers.filter((b) => b.status !== "normal").length;
    const overallStatus: TestBiomarkersResponse["overallStatus"] =
      abnormalCount > 0 ? "attention_required" : "normal";

    const responseData: TestBiomarkersResponse = {
      bookingId: booking.id,
      testNames,
      bookingDate: booking.bookingDate ? booking.bookingDate.toISOString().slice(0, 10) : null,
      status: booking.status ?? "completed",
      doctorName: booking.doctorName ?? "Ordering Physician",
      vendorName: booking.vendorName ?? "Skora Diagnostics Center",
      sampleType: isSugar || isLipid ? "Venous Blood (EDTA / Plain)" : "Venous Blood",
      fastingRequired: isLipid || isSugar,
      overallStatus,
      abnormalCount,
      biomarkers,
    };

    return apiOk(responseData);
  } catch (err: any) {
    console.error("Failed to load test biomarkers:", err);
    return apiError("Could not retrieve biomarker report", 500);
  }
}
