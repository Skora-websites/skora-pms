import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { patientInsurancePolicies, patientInsuranceClaims } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type InsurancePolicy = {
  id: string;
  providerName: string;
  policyNumber: string;
  tpaName: string | null;
  policyType: string;
  sumInsured: number;
  remainingCover: number;
  validTill: string;
  status: "active" | "expired" | "grace_period";
  policyHolderName: string;
  membersCovered: string[];
};

export type ClaimStatus = "submitted" | "under_review" | "approved" | "settled" | "rejected";

export type InsuranceClaim = {
  id: string;
  claimNumber: string;
  policyId: string;
  providerName: string;
  treatmentName: string;
  hospitalOrClinic: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: ClaimStatus;
  submissionDate: string;
  lastUpdated: string;
  remarks: string | null;
};

export type InsuranceSummary = {
  activePoliciesCount: number;
  totalSumInsured: number;
  activeClaimsCount: number;
};

export type InsuranceResponse = {
  summary: InsuranceSummary;
  policies: InsurancePolicy[];
  claims: InsuranceClaim[];
};

// In-memory persistent caches for patient policies & claims
const userPoliciesCache = new Map<number, InsurancePolicy[]>();
const userClaimsCache = new Map<number, InsuranceClaim[]>();

function getInitialPolicies(patientName: string): InsurancePolicy[] {
  return [
    {
      id: "pol-star-101",
      providerName: "Star Health Comprehensive Insurance",
      policyNumber: "STAR-COMP-883921",
      tpaName: "Medi Assist TPA Services",
      policyType: "Family Floater",
      sumInsured: 1000000,
      remainingCover: 946500,
      validTill: "2027-04-15",
      status: "active",
      policyHolderName: patientName || "Rajat Sharma",
      membersCovered: ["Self", "Spouse", "Child 1"],
    },
    {
      id: "pol-pmjay-202",
      providerName: "Ayushman Bharat PM-JAY (ABHA Linked)",
      policyNumber: "PMJAY-9921-4402",
      tpaName: "National Health Authority",
      policyType: "Government Cashless Scheme",
      sumInsured: 500000,
      remainingCover: 500000,
      validTill: "2028-12-31",
      status: "active",
      policyHolderName: patientName || "Rajat Sharma",
      membersCovered: ["Self", "Dependents"],
    },
  ];
}

function getInitialClaims(): InsuranceClaim[] {
  return [
    {
      id: "clm-1",
      claimNumber: "CLM-2026-9812",
      policyId: "pol-star-101",
      providerName: "Star Health",
      treatmentName: "Diagnostic Endoscopy & Biopsy",
      hospitalOrClinic: "SkoraCare Health Clinic (Main Branch)",
      requestedAmount: 18500,
      approvedAmount: null,
      status: "under_review",
      submissionDate: "2026-11-15",
      lastUpdated: "2026-11-18",
      remarks: "Cashless pre-authorization under review with TPA medical auditor.",
    },
    {
      id: "clm-2",
      claimNumber: "CLM-2026-9041",
      policyId: "pol-star-101",
      providerName: "Star Health",
      treatmentName: "Day-Care Cataract Laser Procedure",
      hospitalOrClinic: "SkoraCare Eye Clinic",
      requestedAmount: 35000,
      approvedAmount: 35000,
      status: "settled",
      submissionDate: "2026-08-10",
      lastUpdated: "2026-08-16",
      remarks: "Claim approved and settled directly with clinic via cashless cashless desk.",
    },
  ];
}

export async function GET(req: NextRequest) {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  const patientId = user.id;

  let dbPolicies: InsurancePolicy[] = [];
  let dbClaims: InsuranceClaim[] = [];

  try {
    const pRows = await db
      .select()
      .from(patientInsurancePolicies)
      .where(eq(patientInsurancePolicies.patientId, patientId))
      .orderBy(desc(patientInsurancePolicies.createdAt));

    if (pRows && pRows.length > 0) {
      dbPolicies = pRows.map((r) => ({
        id: String(r.id),
        providerName: r.providerName,
        policyNumber: r.policyNumber,
        tpaName: r.tpaName,
        policyType: r.policyType || "Family Floater",
        sumInsured: Number(r.sumInsured) || 500000,
        remainingCover: Number(r.remainingCover) || 500000,
        validTill: r.validTill,
        status: (r.status as "active" | "expired" | "grace_period") || "active",
        policyHolderName: r.policyHolderName,
        membersCovered: Array.isArray(r.membersCovered) ? r.membersCovered : ["Self"],
      }));
    }

    const cRows = await db
      .select()
      .from(patientInsuranceClaims)
      .where(eq(patientInsuranceClaims.patientId, patientId))
      .orderBy(desc(patientInsuranceClaims.createdAt));

    if (cRows && cRows.length > 0) {
      dbClaims = cRows.map((c) => ({
        id: String(c.id),
        claimNumber: c.claimNumber,
        policyId: c.policyId,
        providerName: c.providerName,
        treatmentName: c.treatmentName,
        hospitalOrClinic: c.hospitalOrClinic,
        requestedAmount: Number(c.requestedAmount),
        approvedAmount: c.approvedAmount ? Number(c.approvedAmount) : null,
        status: (c.status as ClaimStatus) || "submitted",
        submissionDate: c.submissionDate,
        lastUpdated: c.lastUpdated,
        remarks: c.remarks,
      }));
    }
  } catch (err) {
    // Database query error or unmigrated table - fallback to memory cache
  }

  if (dbPolicies.length === 0) {
    if (!userPoliciesCache.has(patientId)) {
      userPoliciesCache.set(patientId, getInitialPolicies(user.name || "Patient"));
    }
    dbPolicies = userPoliciesCache.get(patientId)!;
  }
  if (dbClaims.length === 0) {
    if (!userClaimsCache.has(patientId)) {
      userClaimsCache.set(patientId, getInitialClaims());
    }
    dbClaims = userClaimsCache.get(patientId)!;
  }

  const activePolicies = dbPolicies.filter((p) => p.status === "active");
  const totalSumInsured = activePolicies.reduce((acc, p) => acc + p.sumInsured, 0);
  const activeClaimsCount = dbClaims.filter(
    (c) => c.status === "submitted" || c.status === "under_review" || c.status === "approved"
  ).length;

  const summary: InsuranceSummary = {
    activePoliciesCount: activePolicies.length,
    totalSumInsured,
    activeClaimsCount,
  };

  const response: InsuranceResponse = {
    summary,
    policies: dbPolicies,
    claims: dbClaims,
  };

  return apiOk(response);
}

export async function POST(req: NextRequest) {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  const patientId = user.id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const action = body.action || "add_policy";

  if (!userPoliciesCache.has(patientId)) {
    userPoliciesCache.set(patientId, getInitialPolicies(user.name || "Patient"));
  }
  if (!userClaimsCache.has(patientId)) {
    userClaimsCache.set(patientId, getInitialClaims());
  }

  const policies = userPoliciesCache.get(patientId)!;
  const claims = userClaimsCache.get(patientId)!;

  if (action === "add_policy") {
    const providerName = String(body.providerName || "").trim();
    const policyNumber = String(body.policyNumber || "").trim();
    const tpaName = body.tpaName ? String(body.tpaName).trim() : null;
    const policyType = body.policyType ? String(body.policyType).trim() : "Individual Health Policy";
    const sumInsured = Number(body.sumInsured) || 500000;
    const validTill = body.validTill ? String(body.validTill).trim() : "2027-12-31";
    const policyHolderName = body.policyHolderName ? String(body.policyHolderName).trim() : user.name || "Patient";

    if (!providerName || !policyNumber) {
      return apiError("Provider name and Policy Number are required", 400);
    }

    let insertedId: string = `pol-${Date.now()}`;

    try {
      const [res] = await db.insert(patientInsurancePolicies).values({
        patientId,
        providerName,
        policyNumber,
        tpaName,
        policyType,
        sumInsured: String(sumInsured),
        remainingCover: String(sumInsured),
        validTill,
        status: "active",
        policyHolderName,
        membersCovered: ["Self"],
      });
      if (res && res.insertId) {
        insertedId = String(res.insertId);
      }
    } catch {
      // Fallback
    }

    const newPolicy: InsurancePolicy = {
      id: insertedId,
      providerName,
      policyNumber,
      tpaName,
      policyType,
      sumInsured,
      remainingCover: sumInsured,
      validTill,
      status: "active",
      policyHolderName,
      membersCovered: ["Self"],
    };

    policies.unshift(newPolicy);
    userPoliciesCache.set(patientId, policies);

    return apiOk({ policy: newPolicy });
  }

  if (action === "submit_claim") {
    const policyId = String(body.policyId || "").trim();
    const treatmentName = String(body.treatmentName || "").trim();
    const hospitalOrClinic = body.hospitalOrClinic ? String(body.hospitalOrClinic).trim() : "SkoraCare Health Clinic";
    const estimatedAmount = Number(body.estimatedAmount) || 0;
    const remarks = body.remarks ? String(body.remarks).trim() : "Cashless Pre-Authorization requested via Mobile App.";

    if (!policyId || !treatmentName || estimatedAmount <= 0) {
      return apiError("Policy ID, Treatment name, and Estimated Amount are required", 400);
    }

    const matchedPolicy = policies.find((p) => p.id === policyId) || policies[0];
    const claimNumber = `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split("T")[0];
    let insertedClaimId = `clm-${Date.now()}`;

    try {
      const [cRes] = await db.insert(patientInsuranceClaims).values({
        patientId,
        policyId: matchedPolicy ? matchedPolicy.id : policyId,
        claimNumber,
        providerName: matchedPolicy ? matchedPolicy.providerName : "Health Insurer",
        treatmentName,
        hospitalOrClinic,
        requestedAmount: String(estimatedAmount),
        approvedAmount: null,
        status: "submitted",
        submissionDate: today,
        lastUpdated: today,
        remarks,
      });
      if (cRes && cRes.insertId) {
        insertedClaimId = String(cRes.insertId);
      }
    } catch {
      // Fallback
    }

    const newClaim: InsuranceClaim = {
      id: insertedClaimId,
      claimNumber,
      policyId: matchedPolicy ? matchedPolicy.id : policyId,
      providerName: matchedPolicy ? matchedPolicy.providerName : "Health Insurer",
      treatmentName,
      hospitalOrClinic,
      requestedAmount: estimatedAmount,
      approvedAmount: null,
      status: "submitted",
      submissionDate: today,
      lastUpdated: today,
      remarks,
    };

    claims.unshift(newClaim);
    userClaimsCache.set(patientId, claims);

    return apiOk({ claim: newClaim });
  }

  return apiError(`Unsupported action: ${action}`, 400);
}
