import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations } from "@/lib/db/schema";
import { apiError, apiOk, requireDoctorActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/reviews — doctor's own patient reviews feed and rating score.
 */
export async function GET() {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  const rows = await db
    .select({
      id: consultations.id,
      patientId: consultations.patientId,
      additionalInfo: consultations.additionalInfo,
      consultationDate: consultations.consultationDate,
    })
    .from(consultations)
    .where(
      and(
        eq(consultations.doctorId, user.id),
        isNotNull(consultations.additionalInfo)
      )
    )
    .orderBy(desc(consultations.consultationDate))
    .limit(200);

  const reviews = [];
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
        const patientName = typeof rev.patientName === "string" ? rev.patientName : "Patient";

        reviews.push({
          consultationId: r.id,
          patientId: r.patientId,
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
  const ratingAvg = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 5.0;

  return apiOk({
    doctorId: user.id,
    ratingAvg,
    reviewCount,
    reviews,
  });
}
