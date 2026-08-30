"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { sosRequests, sosOffers, sosCases, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { authRateLimit } from "@/lib/security/rate-limit";
import { auditLog } from "@/lib/security/audit-log";
import { notifyUser } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/push/client";
import { findNearbyOnDutyDoctors, maskPatient, SOS_TTL_MIN } from "./geo";
import { broadcastToMany } from "./hub";

const sosSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().int().min(1).max(50).default(10),
  // FormData.get returns null for missing keys — accept null/empty/absent.
  complaint: z.string().trim().max(500).optional().or(z.literal("")).or(z.null()),
  notes: z.string().trim().max(2000).optional().or(z.literal("")).or(z.null()),
});

export type SosActionResult = { error: string | null; requestId?: number };

async function requirePatient() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "patient") redirect("/patient");
  return user;
}

async function requireDoctor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) redirect("/doctor");
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

  const event = {
    type: "sos:new",
    requestId,
    distanceKm: nearby[0].distanceKm,
    complaint: parsed.data.complaint || null,
    patient: maskPatient(user.name),
  } as const;
  broadcastToMany(nearby.map((d) => d.doctorId), event);

  for (const doc of nearby) {
    void notifyUser({
      userId: doc.doctorId,
      title: "🚨 Emergency request nearby",
      message: `${maskPatient(user.name)} needs urgent help — ${doc.distanceKm} km away${parsed.data.complaint ? ` (${parsed.data.complaint})` : ""}.`,
      type: "error",
      link: "/doctor/emergency",
    });
  }

  // Web Push to on-duty doctors even when the app tab is closed (PWA).
  const payload = {
    title: "🚨 Emergency request nearby",
    body: `${maskPatient(user.name)} needs urgent help — ${nearby[0].distanceKm} km away${parsed.data.complaint ? ` (${parsed.data.complaint})` : ""}.`,
    url: "/doctor/emergency",
    tag: "sos-new",
  } as const;
  for (const doc of nearby) {
    void sendPushToUser(doc.doctorId, payload);
  }

  void auditLog({
    userId: user.id,
    action: "appointment_created",
    metadata: { sos: true, requestId, action: "sos_triggered", nearbyDoctors: nearby.length },
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
  const doctorId = doctor.role === "receptionist" ? (doctor.doctorId ?? doctor.id) : doctor.id;

  // Doctor must have been offered this request (ownership + offer check).
  const [offer] = await db
    .select()
    .from(sosOffers)
    .where(and(eq(sosOffers.sosRequestId, requestId), eq(sosOffers.doctorId, doctorId)))
    .limit(1);
  if (!offer) return { error: "This emergency request is not assigned to you." };
  if (offer.status !== "broadcast") {
    return { error: "This emergency request is no longer available." };
  }

  const [req] = await db
    .select()
    .from(sosRequests)
    .where(eq(sosRequests.id, requestId))
    .limit(1);
  if (!req) return { error: "Emergency request not found." };

  // Business TTL: stale pending requests are treated as expired.
  if (Date.now() - req.createdAt.getTime() > SOS_TTL_MIN * 60_000) {
    await db
      .update(sosRequests)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(sosRequests.id, requestId));
    await db
      .update(sosOffers)
      .set({ status: "expired", respondedAt: new Date() })
      .where(eq(sosOffers.sosRequestId, requestId));
    return { error: "This emergency request has expired." };
  }

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
    .where(eq(sosOffers.id, offer.id));
  await db
    .update(sosOffers)
    .set({ status: "declined", respondedAt: new Date() })
    .where(and(eq(sosOffers.sosRequestId, requestId), ne(sosOffers.doctorId, doctorId)));

  // Create the emergency case record.
  await db.insert(sosCases).values({
    sosRequestId: requestId,
    patientId: req.patientId,
    doctorId,
    clinicId: offer.clinicId,
    patientSymptoms: req.complaint ?? null,
    notes: req.patientNotes ?? null,
    status: "open",
  });

  // Tell other offered doctors it's taken (live + notification).
  const otherOffers = await db
    .select({ doctorId: sosOffers.doctorId })
    .from(sosOffers)
    .where(and(eq(sosOffers.sosRequestId, requestId), eq(sosOffers.status, "declined")));
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
    action: "appointment_updated",
    metadata: { sos: true, requestId, action: "sos_accepted", patientId: req.patientId, patientPhone: patient?.phone ?? null },
  });

  revalidatePath("/doctor/emergency");
  return { error: null };
}

/** Doctor declines their own offer (idempotent). */
export async function declineSos(requestId: number): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = doctor.role === "receptionist" ? (doctor.doctorId ?? doctor.id) : doctor.id;
  await db
    .update(sosOffers)
    .set({ status: "declined", respondedAt: new Date() })
    .where(and(eq(sosOffers.sosRequestId, requestId), eq(sosOffers.doctorId, doctorId), eq(sosOffers.status, "broadcast")));
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
  revalidatePath("/patient/emergency");
  return { error: null };
}

/** Accepting doctor marks the case completed. */
export async function completeSos(requestId: number): Promise<SosActionResult> {
  const doctor = await requireDoctor();
  const doctorId = doctor.role === "receptionist" ? (doctor.doctorId ?? doctor.id) : doctor.id;
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
  revalidatePath("/doctor/emergency");
  return { error: null };
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
  const doctorId = doctor.role === "receptionist" ? (doctor.doctorId ?? doctor.id) : doctor.id;
  if (!Number.isInteger(requestId) || requestId <= 0) return { error: "Invalid request." };
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { error: "Invalid location." };
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return { error: "Invalid coordinates." };

  // Only the accepting doctor of an open case may update location.
  await db
    .update(sosCases)
    .set({
      doctorLatitude: String(latitude),
      doctorLongitude: String(longitude),
      doctorLastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, doctorId), eq(sosCases.status, "open")));
  return { error: null };
}

/** Doctor's own broadcast offers (initial load / polling fallback). */
export async function getMySosOffers() {
  const doctor = await requireDoctor();
  const doctorId = doctor.role === "receptionist" ? (doctor.doctorId ?? doctor.id) : doctor.id;
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
    .where(and(eq(sosOffers.doctorId, doctorId), eq(sosOffers.status, "broadcast"), eq(sosRequests.status, "pending")))
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

/** Doctor's current open case request id (for the en-route banner resume). */
export async function getMyActiveCase() {
  const doctor = await requireDoctor();
  const doctorId = doctor.role === "receptionist" ? (doctor.doctorId ?? doctor.id) : doctor.id;
  const [caseRow] = await db
    .select({ sosRequestId: sosCases.sosRequestId })
    .from(sosCases)
    .where(and(eq(sosCases.doctorId, doctorId), eq(sosCases.status, "open")))
    .orderBy(desc(sosCases.createdAt))
    .limit(1);
  return caseRow?.sosRequestId ?? null;
}
