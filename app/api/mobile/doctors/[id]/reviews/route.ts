import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations, users } from "@/lib/db/schema";
import { apiError, apiOk } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

type PatientReviewItem = {
  rating: number;
  tags: string[];
  review: string | null;
  ratedAt: string;
  patientName: string;
};

/**
 * GET /api/mobile/doctors/[id]/reviews — public verified patient reviews for a doctor.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doctorId = Number(id);
  if (!doctorId || isNaN(doctorId)) {
    return apiError("Invalid doctor ID.", 400);
  }

  const [doctor] = await db
    .select({
      id: users.id,
      name: users.name,
      qualification: users.qualification,
      specialization: users.specialization,
    })
    .from(users)
    .where(and(eq(users.id, doctorId), eq(users.role, "doctor")))
    .limit(1);

  if (!doctor) {
    return apiError("Doctor not found.", 404);
  }

  const rows = await db
    .select({
      id: consultations.id,
      additionalInfo: consultations.additionalInfo,
      consultationDate: consultations.consultationDate,
    })
    .from(consultations)
    .where(
      and(
        eq(consultations.doctorId, doctorId),
        isNotNull(consultations.additionalInfo)
      )
    )
    .orderBy(desc(consultations.consultationDate))
    .limit(100);

  const reviews: PatientReviewItem[] = [];
  let totalRating = 0;

  for (const r of rows) {
    if (typeof r.additionalInfo === "object" && r.additionalInfo !== null) {
      const info = r.additionalInfo as Record<string, unknown>;
      if (typeof info.patientReview === "object" && info.patientReview !== null) {
        const rev = info.patientReview as Record<string, unknown>;
        const rating = typeof rev.rating === "number" ? rev.rating : 5;
        const tags = Array.isArray(rev.tags) ? (rev.tags as string[]) : [];
        const reviewText = typeof rev.review === "string" ? rev.review : null;
        const ratedAt = typeof rev.ratedAt === "string" ? rev.ratedAt : r.consultationDate?.toISOString() ?? new Date().toISOString();
        const patientName = typeof rev.patientName === "string" ? rev.patientName : "Verified Patient";

        reviews.push({
          rating,
          tags,
          review: reviewText,
          ratedAt,
          patientName,
        });
        totalRating += rating;
      }
    }
  }

  const reviewCount = reviews.length;
  // If no reviews yet, baseline 5.0 with 0 count
  const ratingAvg = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 5.0;

  return apiOk({
    doctorId,
    doctorName: doctor.name,
    doctorQualification: doctor.qualification,
    doctorSpecialization: doctor.specialization,
    ratingAvg,
    reviewCount,
    reviews,
  });
}
