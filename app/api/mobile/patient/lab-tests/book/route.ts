import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  testBookings,
  testBookingTest,
  tests,
  vendors,
  users,
  billings,
  billingTypes,
} from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";
import { generateBillNumber, todayStr } from "@/lib/utils";

export const runtime = "nodejs";

interface BookLabTestPayload {
  testIds?: number[];
  testNames?: string[];
  collectionType: "clinic_walk_in" | "home_collection";
  bookingDate: string; // YYYY-MM-DD
  bookingTime?: string; // HH:MM or slot label
  homeAddress?: string;
  homeLatitude?: number | null;
  homeLongitude?: number | null;
  paymentMethod?: "online" | "pay_on_sample";
  notes?: string;
}

export async function POST(request: Request) {
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const patient = await requirePatientActor();
  if (patient instanceof Response) return patient;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request payload.", 400);
  }

  const raw = (body ?? {}) as BookLabTestPayload;
  const testIds = Array.isArray(raw.testIds) ? raw.testIds : [];
  const testNames = Array.isArray(raw.testNames) ? raw.testNames : [];

  if (testIds.length === 0 && testNames.length === 0) {
    return apiError("Please select at least one diagnostic test.", 400);
  }

  const collectionType = raw.collectionType === "home_collection" ? "home_collection" : "clinic_walk_in";
  const bookingDate = (raw.bookingDate || todayStr()).trim();
  const bookingTime = (raw.bookingTime || "08:00 AM").trim();
  const homeAddress = (raw.homeAddress || "").trim();

  if (collectionType === "home_collection" && !homeAddress) {
    return apiError("Please enter your complete address for home sample collection.", 400);
  }

  // Resolve tests from database or synthesize standard prices
  const dbTests = testIds.length > 0
    ? await db.select().from(tests).where(inArray(tests.id, testIds))
    : [];

  const bookedItems: { id?: number; name: string; price: number }[] = [];
  let totalAmount = 0;
  let resolvedDoctorId: number | null = null;

  for (const t of dbTests) {
    const p = Number(t.price ?? 350);
    bookedItems.push({ id: t.id, name: t.name, price: p });
    totalAmount += p;
    if (!resolvedDoctorId) resolvedDoctorId = t.doctorId;
  }

  // For any test names that weren't in dbTests (synthetic or default packages)
  for (const name of testNames) {
    if (!bookedItems.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      const p = 500;
      bookedItems.push({ name, price: p });
      totalAmount += p;
    }
  }

  if (bookedItems.length === 0) {
    return apiError("No valid diagnostic tests were found.", 400);
  }

  // Definite doctor ID to anchor records
  let doctorIdToUse: number = resolvedDoctorId ?? patient.doctorId ?? 1;

  const [doc] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, doctorIdToUse), eq(users.role, "doctor")))
    .limit(1);

  if (!doc) {
    const [firstDoc] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.role, "doctor"))
      .limit(1);
    if (firstDoc) {
      doctorIdToUse = firstDoc.id;
    }
  }

  // Resolve or create diagnostic Vendor for this doctor
  const [vendor] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.doctorId, doctorIdToUse))
    .limit(1);

  let vendorId: number = vendor?.id ?? 0;
  if (!vendorId) {
    const [newVendor] = await db
      .insert(vendors)
      .values({
        doctorId: doctorIdToUse,
        name: "Skora Central Pathology Lab",
        mobile: "9876543210",
        email: "lab@skoracare.com",
        address: "Hospital Diagnostics Wing",
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();
    vendorId = newVendor.id;
  }

  // Notes containing collection metadata
  const notesMeta = [
    `Mode: ${collectionType === "home_collection" ? "Home Sample Collection" : "Clinic Walk-in"}`,
    collectionType === "home_collection" ? `Address: ${homeAddress}` : null,
    raw.homeLatitude && raw.homeLongitude ? `GPS: ${raw.homeLatitude}, ${raw.homeLongitude}` : null,
    raw.notes ? `Note: ${raw.notes}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  // Insert test booking
  const [booking] = await db
    .insert(testBookings)
    .values({
      doctorId: doctorIdToUse,
      patientId: patient.id,
      vendorId,
      bookingDate: new Date(`${bookingDate}T00:00:00`),
      tests: bookedItems,
      totalAmount: String(totalAmount),
      paymentMethod: raw.paymentMethod === "online" ? "upi" : "cash",
      paymentAmount: raw.paymentMethod === "online" ? String(totalAmount) : "0",
      status: "pending",
      notes: notesMeta,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  const bookingId = booking.id;

  // Insert each test in testBookingTest where id exists
  for (const item of bookedItems) {
    if (item.id) {
      await db.insert(testBookingTest).values({
        testBookingId: bookingId,
        testId: item.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Find or create a billingType for diagnostics
  const [bType] = await db
    .select({ id: billingTypes.id })
    .from(billingTypes)
    .where(eq(billingTypes.doctorId, doctorIdToUse))
    .limit(1);

  let billingTypeId = bType?.id;
  if (!billingTypeId) {
    const [newType] = await db
      .insert(billingTypes)
      .values({
        doctorId: doctorIdToUse,
        name: "Diagnostic Lab Tests",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();
    billingTypeId = newType.id;
  }

  // Generate invoice record in billings
  const billNum = generateBillNumber();
  const isOnline = raw.paymentMethod === "online";

  const [bill] = await db
    .insert(billings)
    .values({
      billNumber: billNum,
      patientId: patient.id,
      doctorId: doctorIdToUse,
      billingTypeId,
      testBookingId: bookingId,
      totalAmount: String(totalAmount),
      receivedAmount: isOnline ? String(totalAmount) : "0",
      pendingAmount: isOnline ? "0" : String(totalAmount),
      paymentMethod: isOnline ? "upi" : "cash",
      status: isOnline ? "paid" : "pending",
      billDate: todayStr(),
      notes: `Lab tests: ${bookedItems.map((b) => b.name).join(", ")}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  // Notify patient
  await notifyUser({
    userId: patient.id,
    title: "Diagnostic Test Booked",
    message: `Your booking for ${bookedItems.length} test(s) on ${bookingDate} is confirmed. ${
      collectionType === "home_collection" ? "Home sample pickup scheduled." : "Visit clinic for sample submission."
    }`,
    type: "appointment",
  });

  return apiOk({
    bookingId,
    billingId: bill.id,
    totalAmount,
    bookingDate,
    bookingTime,
    collectionType,
    tests: bookedItems,
    message: "Diagnostic lab test booked successfully.",
  });
}
