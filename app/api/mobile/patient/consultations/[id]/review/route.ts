import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations, users } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

/**
 * POST /api/mobile/patient/consultations/[id]/review
 * Submit a 1-5 star patient review with tags & comments for a completed consultation.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  const { id } = await params;
  const consultationId = Number(id);
  if (!consultationId || isNaN(consultationId)) {
    return apiError("Invalid consultation ID.", 400);
  }

  let body: { rating?: number; tags?: string[]; review?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", 400);
  }

  const { rating, tags, review } = body;
  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return apiError("Rating must be an integer between 1 and 5.", 400);
  }

  // Ensure consultation belongs to this patient
  const [consultation] = await db
    .select({
      id: consultations.id,
      patientId: consultations.patientId,
      doctorId: consultations.doctorId,
      additionalInfo: consultations.additionalInfo,
    })
    .from(consultations)
    .where(
      and(
        eq(consultations.id, consultationId),
        eq(consultations.patientId, user.id)
      )
    )
    .limit(1);

  if (!consultation) {
    return apiError("Consultation not found or unauthorized.", 404);
  }

  const existingInfo =
    typeof consultation.additionalInfo === "object" && consultation.additionalInfo !== null
      ? (consultation.additionalInfo as Record<string, unknown>)
      : {};

  const cleanTags = Array.isArray(tags)
    ? tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 10)
    : [];
  const cleanReview = review && typeof review === "string" ? review.trim().slice(0, 500) : null;
  const ratedAt = new Date().toISOString();

  const patientReview = {
    rating,
    tags: cleanTags,
    review: cleanReview,
    ratedAt,
    patientName: user.name || "Patient",
  };

  const updatedInfo = {
    ...existingInfo,
    patientReview,
  };

  await db
    .update(consultations)
    .set({
      additionalInfo: updatedInfo,
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId));

  // Notify the doctor about the new review
  try {
    const starString = "⭐".repeat(rating);
    await notifyUser({
      userId: consultation.doctorId,
      title: `${starString} New Patient Review`,
      message: `${user.name || "A patient"} gave you a ${rating}-star review.${
        cleanReview ? ` "${cleanReview.slice(0, 80)}"` : ""
      }`,
      type: "consultation_review",
      link: "/doctor/home",
    });
  } catch (err) {
    console.error("Failed to notify doctor about review:", err);
  }

  return apiOk({
    consultationId,
    review: patientReview,
  });
}
