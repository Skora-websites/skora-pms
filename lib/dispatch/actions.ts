"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  sosRequests,
  sosOffers,
  sosCases,
  users,
  billings,
  billingTypes,
  doctorClinics,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { authRateLimit } from "@/lib/security/rate-limit";
import { auditLog } from "@/lib/security/audit-log";
import { notifyUser } from "@/lib/notifications";
import { SOS_FARE } from "@/lib/config";
import { generateBillNumber } from "@/lib/utils";
import { findNearbyOnDutyDoctors, haversineKm, maskPatient, resolveDoctorId, SOS_TTL_MIN } from "./geo";
import { broadcastToMany, announceSosToDoctors } from "./hub";
import { expireStalePendingRequest } from "./expiry";

const sosSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().int().min(1).max(50).default(10),
  // FormData.get returns null for missing keys — accept null/empty/absent.
  complaint: z.string().trim().max(500).optional().or(z.literal("")).or(z.null()),
  notes: z.string().trim().max(2000).optional().or(z.literal("")).or(z.null()),
});

/**
 * Parse a stored latitude/longitude (Drizzle returns these as `string | null`
 * from varchar columns).
 *
 * Returns null for null, empty and non-numeric input. `Number()` alone is not
 * enough: `Number(null)` and `Number("")` are both `0`, which satisfies
 * `Number.isFinite` and silently turns a missing coordinate into (0, 0) —
 * billing a patient the haversine distance from the Gulf of Guinea.
 */
function parseCoord(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export type SosActionResult = {
  error: string | null;
  requestId?: number;
  /** Plaintext arrival code — returned to the doctor's panel only, never persisted. */
  otp?: string;
  etaMinutes?: number;
};

async function requirePatient() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "patient") redirect("/patient");
  return user;
}

async function requireDoctor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Doctor tier only (audit H12). Receptionists previously passed here and
  // were then resolved to the practice OWNER's doctor id, which let a
  // front-desk account accept the owner's emergency case and read the
  // patient's PHI through the dispatch panel.
  if (user.role !== "doctor") redirect("/doctor");
  return user;
}

/**
 * Patient triggers an SOS → inserts pending request → finds nearby on-duty
 * doctors → creates offers → broadcasts live (SSE) + in-app notification.
 * (In-app notification ONLY — WhatsApp intentionally not used per product.)
 */
export async function triggerSos(
  _prev: SosActionResult,
  formData: FormData
): Promise<SosActionResult> {
  const user = await requirePatient();
  const parsed = sosSchema.safeParse({
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    radiusKm: formData.get("radius_km") ?? "10",
    complaint: formData.get("complaint"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { allowed } = authRateLimit.emergency(user.id);
  if (!allowed) return { error: "Too many SOS requests. Please wait a minute." };

  // Server-side re-trigger guard: if the patient already has an active
  // (pending) request, reject instead of stacking a second one. Stale
  // pending requests past the TTL are expired first so the guard can't
  // permanently lock the patient out after a dead poll.
  const [active] = await db
    .select({ id: sosRequests.id, createdAt: sosRequests.createdAt })
    .from(sosRequests)
    .where(and(eq(sosRequests.patientId, user.id), eq(sosRequests.status, "pending")))
    .orderBy(desc(sosRequests.createdAt))
    .limit(1);
  if (active) {
    const expired = await expireStalePendingRequest(active.id);
    if (!expired) {
      return {
        error: "You already have an active SOS request. Cancel it before triggering a new one.",
      };
    }
  }

  const lat = parsed.data.latitude;
  const lng = parsed.data.longitude;

  const [req] = await db
    .insert(sosRequests)
    .values({
      patientId: user.id,
      status: "pending",
      latitude: String(lat),
      longitude: String(lng),
      radiusKm: parsed.data.radiusKm,
      complaint: parsed.data.complaint || null,
      patientNotes: parsed.data.notes || null,
    })
    .$returningId();
  const requestId = Number(req.id);

  const nearby = await findNearbyOnDutyDoctors(lat, lng, parsed.data.radiusKm);

  if (nearby.length === 0) {
    // No on-duty doctor within radius → expire the request so the patient
    // sees "no doctor available" rather than waiting forever.
    await db
      .update(sosRequests)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(sosRequests.id, requestId));
    return { error: null, requestId };
  }

  for (const doc of nearby) {
    await db
      .insert(sosOffers)
      .values({
        sosRequestId: requestId,
        doctorId: doc.doctorId,
        clinicId: doc.clinicId,
        distanceKm: String(doc.distanceKm),
        status: "broadcast",
      })
      .catch(() => undefined); // UNIQUE(sos_request_id, doctor_id) — idempotent
  }

  await announceSosToDoctors(
    nearby.map((d) => d.doctorId),
    {
      requestId,
      distanceKm: nearby[0].distanceKm,
      complaint: parsed.data.complaint || null,
      patient: maskPatient(user.name),
    }
  );

  void auditLog({
    userId: user.id,
    action: "sos_triggered",
    metadata: { requestId, nearbyDoctors: nearby.length },
  });

  revalidatePath("/patient/emergency");
  return { error: null, requestId };
}

/**
 * Doctor accepts an SOS — ATOMIC claim. Only the first doctor whose
 * conditional UPDATE matches a still-pending request wins; everyone else
 * gets a friendly "already taken" error.
 */
export async function acceptSos(requestId: number): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);

  // Doctor must have been offered this request (ownership + offer check).
  // The clinic join supplies the doctor's departure point for distance/ETA
  // (null clinic — the doctor-GPS fallback entry — resolves below).
  const [offer] = await db
    .select({
      offer: sosOffers,
      clinicLatitude: doctorClinics.latitude,
      clinicLongitude: doctorClinics.longitude,
    })
    .from(sosOffers)
    .leftJoin(doctorClinics, eq(doctorClinics.id, sosOffers.clinicId))
    .where(and(eq(sosOffers.sosRequestId, requestId), eq(sosOffers.doctorId, doctorId)))
    .limit(1);
  if (!offer) return { error: "This emergency request is not assigned to you." };
  if (offer.offer.status !== "broadcast") {
    return { error: "This emergency request is no longer available." };
  }

  const [req] = await db
    .select()
    .from(sosRequests)
    .where(eq(sosRequests.id, requestId))
    .limit(1);
  if (!req) return { error: "Emergency request not found." };

  // Business TTL: stale pending requests are expired inline (guarded on
  // status='pending' so a concurrent cancel/accept always wins).
  const expired = await expireStalePendingRequest(requestId);
  if (expired) return { error: "This emergency request has expired." };

  // ATOMIC CLAIM: conditional update — affectedRows === 1 means this doctor won.
  const claimed = await db
    .update(sosRequests)
    .set({ status: "accepted", acceptedBy: doctorId, acceptedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sosRequests.id, requestId), eq(sosRequests.status, "pending")));
  if (claimed[0].affectedRows !== 1) {
    return { error: "Another doctor accepted this request first." };
  }

  // Winner offer → accepted; all OTHER offers → declined.
  await db
    .update(sosOffers)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(eq(sosOffers.id, offer.offer.id));
  await db
    .update(sosOffers)
    .set({ status: "declined", respondedAt: new Date() })
    .where(and(eq(sosOffers.sosRequestId, requestId), ne(sosOffers.doctorId, doctorId)));

  // Create the emergency case record.
  await db.insert(sosCases).values({
    sosRequestId: requestId,
    patientId: req.patientId,
    doctorId,
    clinicId: offer.offer.clinicId,
    patientSymptoms: req.complaint ?? null,
    notes: req.patientNotes ?? null,
    status: "open",
  });

  // ── Arrival identity + fare basis ──
  // Departure point: the offered clinic when it has coordinates, otherwise the
  // doctor's own GPS (the mobile-fallback offer carries no clinic).
  //
  // Number(null) is 0, which passes Number.isFinite — a missing coordinate
  // would silently become (0,0) and bill the patient for the distance from
  // the Gulf of Guinea. parseCoord rejects null/empty/non-numeric instead.
  const originLat = parseCoord(offer.clinicLatitude);
  const originLng = parseCoord(offer.clinicLongitude);

  const [origin] =
    originLat === null || originLng === null
      ? await db
          .select({ latitude: users.latitude, longitude: users.longitude })
          .from(users)
          .where(eq(users.id, doctorId))
          .limit(1)
      : [null];
  const startLat = originLat ?? parseCoord(origin?.latitude);
  const startLng = originLng ?? parseCoord(origin?.longitude);

  // The plaintext code is returned to the doctor's panel and never stored;
  // only the sha256 digest lands on the row the patient can also read.
  const otp = String(crypto.randomInt(100000, 999999));
  let distanceKm: number | null = null;
  let etaMinutes: number | null = null;
  const patientLat = parseCoord(req.latitude);
  const patientLng = parseCoord(req.longitude);
  if (startLat !== null && startLng !== null && patientLat !== null && patientLng !== null) {
    distanceKm = haversineKm(startLat, startLng, patientLat, patientLng);
    // 30 km/h city average → minutes; at least 1 so the UI never shows 0.
    etaMinutes = Math.max(1, Math.round((distanceKm / 30) * 60));
  }

  await db
    .update(sosCases)
    .set({
      patientOtp: crypto.createHash("sha256").update(otp).digest("hex"),
      distanceKm: distanceKm === null ? null : String(distanceKm),
      etaMinutes: etaMinutes,
    })
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId)));

  // Tell other offered doctors it's taken (live + notification).
  const otherOffers = await db
    .select({ doctorId: sosOffers.doctorId })
    .from(sosOffers)
    .where(and(eq(sosOffers.sosRequestId, requestId), ne(sosOffers.doctorId, doctorId)));
  broadcastToMany(otherOffers.map((o) => o.doctorId), { type: "sos:taken", requestId });
  for (const o of otherOffers) {
    void notifyUser({
      userId: o.doctorId,
      title: "Emergency request taken",
      message: "Another doctor accepted this emergency request.",
      type: "info",
      link: "/doctor/emergency",
    });
  }

  // Notify the patient that a doctor is on the way (in-app).
  const [patient] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, req.patientId))
    .limit(1);
  void notifyUser({
    userId: req.patientId,
    title: "Doctor on the way",
    message: `Dr. ${doctor.name} has accepted your emergency request. Help is on the way.`,
    type: "success",
    link: "/patient/emergency",
  });

  void auditLog({
    userId: doctorId,
    action: "sos_accepted",
    metadata: { requestId, patientId: req.patientId, patientPhone: patient?.phone ?? null },
  });

  revalidatePath("/doctor/emergency");
  // The plaintext OTP and ETA go to the doctor's panel only. The patient is
  // asked to obtain the code from the doctor verbally — that is the identity
  // check, so it must never be served to the patient's own session.
  return { error: null, otp, etaMinutes: etaMinutes ?? undefined };
}

/** Doctor declines their own offer (idempotent). */
export async function declineSos(requestId: number): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  await db
    .update(sosOffers)
    .set({ status: "declined", respondedAt: new Date() })
    .where(and(eq(sosOffers.sosRequestId, requestId), eq(sosOffers.doctorId, doctorId), eq(sosOffers.status, "broadcast")));
  void auditLog({ userId: doctorId, action: "sos_declined", metadata: { requestId } });
  revalidatePath("/doctor/emergency");
  return { error: null };
}

/** Patient cancels their own pending request (owner-only). */
export async function cancelSos(requestId: number): Promise<SosActionResult> {
  const user = await requirePatient();
  await db
    .update(sosRequests)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sosRequests.id, requestId), eq(sosRequests.patientId, user.id), eq(sosRequests.status, "pending")));
  const offers = await db
    .select({ doctorId: sosOffers.doctorId })
    .from(sosOffers)
    .where(eq(sosOffers.sosRequestId, requestId));
  broadcastToMany(offers.map((o) => o.doctorId), { type: "sos:cancelled", requestId });
  void auditLog({ userId: user.id, action: "sos_cancelled", metadata: { requestId } });
  revalidatePath("/patient/emergency");
  return { error: null };
}

/**
 * Accepting doctor marks the case completed. Generates the patient's bill
 * (base + distance, floored at the minimum fare) and links it to the case.
 *
 * A billing failure never blocks completion: an un-billed completed case is
 * recoverable from the case row, but a case stuck open because billing failed
 * is not.
 */
export async function completeSos(requestId: number): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  await db
    .update(sosCases)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId)));
  // Keep the request in sync so the patient tracker flips to resolved.
  await db
    .update(sosRequests)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(sosRequests.id, requestId), eq(sosRequests.acceptedBy, doctorId)));
  const [req] = await db
    .select({ patientId: sosRequests.patientId })
    .from(sosRequests)
    .where(eq(sosRequests.id, requestId))
    .limit(1);
  if (req) {
    void notifyUser({
      userId: req.patientId,
      title: "Emergency resolved",
      message: "The emergency response has been completed. Stay safe.",
      type: "success",
      link: "/patient/emergency",
    });
  }

  // ── Earnings ledger: bill the visit, then link the bill to the case ──
  if (req) {
    await billSosCase(requestId, req.patientId, doctorId);
  }

  void auditLog({ userId: doctorId, action: "sos_completed", metadata: { requestId } });
  revalidatePath("/doctor/emergency");
  revalidatePath("/patient/emergency");
  return { error: null };
}

/**
 * Doctor marks arrival at the patient. Sets the arrival timestamp the patient
 * tracker reads; separate from OTP verification so the two states are
 * independently observable ("doctor is here" vs "identity confirmed").
 */
export async function markSosArrived(requestId: number): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  const [caseRow] = await db
    .select({ arrivedAt: sosCases.arrivedAt })
    .from(sosCases)
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId)))
    .limit(1);
  if (!caseRow) return { error: "Case not found." };
  if (caseRow.arrivedAt) return { error: "Already marked as arrived." };
  await db
    .update(sosCases)
    .set({ arrivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId)));
  revalidatePath("/doctor/emergency");
  revalidatePath("/patient/emergency");
  return { error: null };
}

const otpSchema = z.object({ otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") });

/**
 * Doctor confirms the patient's identity with the code from acceptSos. The
 * row stores only the sha256 digest, compared in constant time; the plaintext
 * never leaves the doctor's panel.
 */
export async function verifySosOtp(requestId: number, otp: string): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  const parsed = otpSchema.safeParse({ otp });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid code." };

  const [caseRow] = await db
    .select({ patientOtp: sosCases.patientOtp })
    .from(sosCases)
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId)))
    .limit(1);
  if (!caseRow?.patientOtp) return { error: "No arrival code for this case." };

  const candidate = crypto.createHash("sha256").update(parsed.data.otp).digest("hex");
  // Both are 64-char hex digests, so the buffers are equal length.
  const match = crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(caseRow.patientOtp, "hex"));
  if (!match) return { error: "Incorrect code." };

  await db
    .update(sosCases)
    .set({ otpVerifiedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId)));
  revalidatePath("/doctor/emergency");
  revalidatePath("/patient/emergency");
  return { error: null };
}

const ratingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().max(500).optional(),
});

/** Patient rates a completed SOS case (one rating per case). */
export async function rateSosCase(
  requestId: number,
  rating: number,
  note: string
): Promise<SosActionResult> {
  const user = await requirePatient();
  const parsed = ratingSchema.safeParse({ rating, note });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid rating." };

  const [caseRow] = await db
    .select({
      id: sosCases.id,
      doctorId: sosCases.doctorId,
      status: sosCases.status,
      rating: sosCases.rating,
    })
    .from(sosCases)
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.patientId, user.id)))
    .limit(1);
  if (!caseRow) return { error: "Case not found." };
  if (caseRow.status !== "completed") return { error: "This visit is not completed yet." };
  if (caseRow.rating !== null) return { error: "You already rated this visit." };

  await db
    .update(sosCases)
    .set({ rating: parsed.data.rating, ratingNote: parsed.data.note ?? null, updatedAt: new Date() })
    .where(eq(sosCases.id, caseRow.id));

  void notifyUser({
    userId: caseRow.doctorId,
    title: "New SOS rating",
    message: `The patient rated the emergency visit ${parsed.data.rating}/5.`,
    type: "success",
    link: "/doctor/emergency",
  });
  revalidatePath("/patient/emergency");
  return { error: null };
}

/**
 * Bill a completed SOS case: base fare + distance, floored at the minimum.
 * Resolves (or creates) the doctor's own "Emergency Home Visit" billing type
 * — never the generic "Consultation" type, whose default amount would corrupt
 * the ledger.
 */
async function billSosCase(requestId: number, patientId: number, doctorId: number): Promise<void> {
  try {
    const [caseRow] = await db
      .select({
        distanceKm: sosCases.distanceKm,
        billingId: sosCases.billingId,
        otpVerifiedAt: sosCases.otpVerifiedAt,
      })
      .from(sosCases)
      .where(eq(sosCases.sosRequestId, requestId))
      .limit(1);
    if (!caseRow || caseRow.billingId !== null) return;

    const distanceKm = Number(caseRow.distanceKm ?? 0);
    const fare = Math.max(
      SOS_FARE.minFare,
      SOS_FARE.baseFare + distanceKm * SOS_FARE.perKm
    );

    let billingTypeId: number;
    const [existing] = await db
      .select({ id: billingTypes.id })
      .from(billingTypes)
      .where(and(eq(billingTypes.doctorId, doctorId), eq(billingTypes.name, "Emergency Home Visit")))
      .limit(1);
    if (existing) {
      billingTypeId = existing.id;
    } else {
      const [created] = await db.insert(billingTypes).values({
        doctorId,
        name: "Emergency Home Visit",
        defaultAmount: "0",
        description: "SOS emergency dispatch",
        isActive: true,
      });
      billingTypeId = Number(created.insertId);
    }

    const billNumber = generateBillNumber();
    const [bill] = await db.insert(billings).values({
      billNumber,
      patientId,
      doctorId,
      billingTypeId,
      totalAmount: String(fare),
      receivedAmount: "0",
      pendingAmount: String(fare),
      paymentMethod: "cash",
      status: "pending",
      billDate: new Date().toISOString().slice(0, 10),
      notes: `SOS emergency dispatch #${requestId}`,
    });

    await db
      .update(sosCases)
      .set({ billingId: Number(bill.insertId) })
      .where(eq(sosCases.sosRequestId, requestId));
  } catch (err) {
    // Completing the case matters more than the bill; an un-billed case is
    // recoverable, a case stuck open is not.
    console.error(
      `[sos] billing failed for request ${requestId}:`,
      err instanceof Error ? err.message : err
    );
  }
}

/** Doctor toggles on-duty availability (opt-in for SOS dispatch). */
export async function setDoctorOnDuty(onDuty: boolean): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  await db.update(users).set({ onDuty, updatedAt: new Date() }).where(eq(users.id, doctor.id));
  revalidatePath("/doctor/emergency");
  return { error: null };
}

/**
 * Doctor updates their live location for the accepted emergency case.
 * Called periodically (e.g. every 5s) while en route so the patient sees
 * the doctor moving on the map (Uber-style live tracking).
 */
export async function updateDoctorLocation(
  requestId: number,
  latitude: number,
  longitude: number
): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  if (!Number.isInteger(requestId) || requestId <= 0) return { error: "Invalid request." };
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { error: "Invalid location." };
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return { error: "Invalid coordinates." };

  // Only the accepting doctor of an open case may update location.
  // ETA is recomputed from the NEW coordinates against the patient's stored
  // position, so the patient's countdown moves as the doctor drives.
  const [caseRow] = await db
    .select({ patientLatitude: sosRequests.latitude, patientLongitude: sosRequests.longitude })
    .from(sosCases)
    .innerJoin(sosRequests, eq(sosRequests.id, sosCases.sosRequestId))
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId), eq(sosCases.status, "open")))
    .limit(1);

  let etaMinutes: number | null = null;
  if (caseRow) {
    const patientLat = parseCoord(caseRow.patientLatitude);
    const patientLng = parseCoord(caseRow.patientLongitude);
    if (patientLat !== null && patientLng !== null) {
      const dist = haversineKm(latitude, longitude, patientLat, patientLng);
      // 30 km/h city average; 1-minute floor so the tracker never shows 0.
      etaMinutes = Math.max(1, Math.round((dist / 30) * 60));
    }
  }

  await db
    .update(sosCases)
    .set({
      doctorLatitude: String(latitude),
      doctorLongitude: String(longitude),
      doctorLastSeenAt: new Date(),
      etaMinutes: etaMinutes,
      updatedAt: new Date(),
    })
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId), eq(sosCases.status, "open")));
  return { error: null, etaMinutes: etaMinutes ?? undefined };
}

/** Doctor's own broadcast offers (initial load / polling fallback). */
export async function getMySosOffers() {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  const ttlCutoff = new Date(Date.now() - SOS_TTL_MIN * 60_000);
  const rows = await db
    .select({
      id: sosOffers.id,
      requestId: sosOffers.sosRequestId,
      distanceKm: sosOffers.distanceKm,
      status: sosOffers.status,
      complaint: sosRequests.complaint,
      patientName: users.name,
      createdAt: sosRequests.createdAt,
    })
    .from(sosOffers)
    .innerJoin(sosRequests, eq(sosRequests.id, sosOffers.sosRequestId))
    .innerJoin(users, eq(users.id, sosRequests.patientId))
    .where(
      and(
        eq(sosOffers.doctorId, doctorId),
        eq(sosOffers.status, "broadcast"),
        eq(sosRequests.status, "pending"),
        gt(sosRequests.createdAt, ttlCutoff)
      )
    )
    .orderBy(desc(sosRequests.createdAt));
  return rows.map((r) => ({
    id: r.id,
    requestId: r.requestId,
    distanceKm: r.distanceKm,
    complaint: r.complaint,
    patient: maskPatient(r.patientName),
    createdAt: r.createdAt,
  }));
}

/** Patient's latest ACTIVE request (pending or accepted) — for tracker resume. */
export async function getMyActiveRequest() {
  const user = await requirePatient();
  const [req] = await db
    .select()
    .from(sosRequests)
    .where(and(eq(sosRequests.patientId, user.id), sql`${sosRequests.status} IN ('pending','accepted')`))
    .orderBy(desc(sosRequests.createdAt))
    .limit(1);
  return req ?? null;
}

/** Doctor's current open case (for the en-route banner + live map resume). */
export async function getMyActiveCase() {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  const [caseRow] = await db
    .select({
      sosRequestId: sosCases.sosRequestId,
      patientLatitude: sosRequests.latitude,
      patientLongitude: sosRequests.longitude,
      etaMinutes: sosCases.etaMinutes,
      distanceKm: sosCases.distanceKm,
      arrivedAt: sosCases.arrivedAt,
      otpVerifiedAt: sosCases.otpVerifiedAt,
      // patientOtp is deliberately NOT selected: it holds only the sha256
      // digest and must never cross to the client.
    })
    .from(sosCases)
    .innerJoin(sosRequests, eq(sosRequests.id, sosCases.sosRequestId))
    .where(and(eq(sosCases.doctorId, doctorId), eq(sosCases.status, "open")))
    .orderBy(desc(sosCases.createdAt))
    .limit(1);
  return caseRow ?? null;
}

/** Patient's past SOS requests (resolved/cancelled/expired) — history view. */
export async function getMySosHistory() {
  const user = await requirePatient();
  const rows = await db
    .select({
      id: sosRequests.id,
      status: sosRequests.status,
      complaint: sosRequests.complaint,
      createdAt: sosRequests.createdAt,
      acceptedAt: sosRequests.acceptedAt,
      cancelledAt: sosRequests.cancelledAt,
      acceptedBy: users.name,
    })
    .from(sosRequests)
    .leftJoin(users, eq(users.id, sosRequests.acceptedBy))
    .where(and(eq(sosRequests.patientId, user.id), sql`${sosRequests.status} IN ('completed','cancelled','expired')`))
    .orderBy(desc(sosRequests.createdAt))
    .limit(20);
  return rows;
}

/** Doctor's past SOS cases — history view. */
export async function getMySosCaseHistory() {
  const doctor = await requireDoctor();
  const doctorId = resolveDoctorId(doctor);
  const rows = await db
    .select({
      id: sosCases.id,
      requestId: sosCases.sosRequestId,
      status: sosCases.status,
      acceptedAt: sosCases.acceptedAt,
      updatedAt: sosCases.updatedAt,
      patientName: users.name,
      complaint: sosRequests.complaint,
    })
    .from(sosCases)
    .innerJoin(sosRequests, eq(sosRequests.id, sosCases.sosRequestId))
    .innerJoin(users, eq(users.id, sosCases.patientId))
    .where(and(eq(sosCases.doctorId, doctorId), ne(sosCases.status, "open")))
    .orderBy(desc(sosCases.acceptedAt))
    .limit(20);
  return rows;
}
