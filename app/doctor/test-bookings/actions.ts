"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  testBookings,
  vendors,
  tests,
  users,
  billings,
  billingTypes,
  transactions,
} from "@/lib/db/schema";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";
import { audit } from "@/lib/security/audit-log";
import { generateBillNumber, todayStr } from "@/lib/utils";

export type TestBookingActionResult = { error: string | null };

const BOOKING_STATUSES = ["pending", "in-progress", "completed", "cancelled"] as const;

/**
 * Business state machine for test bookings (legacy had no guard; the UI must
 * not be able to jump states arbitrarily).
 *
 *   pending ──► in-progress ──► completed
 *      │            │
 *      └────► cancelled ◄──────┘
 *
 * `completed` and `cancelled` are terminal — reversal is not allowed because
 * the booking may have generated a bill, a vendor upload, or patient-facing
 * records.
 */
const BOOKING_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["in-progress", "completed", "cancelled"],
  "in-progress": ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
const PAYMENT_METHODS = ["upi", "cash", "card", "netbanking"] as const;

function randomToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// ── Test booking CRUD ──────────────────────────────────────────────────────

async function resolvePatient(doctorId: number, registrationId: string, phone: string) {
  const conds = [eq(users.role, "patient")];
  if (registrationId) {
    conds.push(eq(users.registrationId, registrationId));
  } else if (phone) {
    const phoneCond = or(eq(users.phone, phone), like(users.phone, `%${phone}%`));
    if (phoneCond) conds.push(phoneCond);
  } else {
    return null;
  }
  const [patient] = await db
    .select({ id: users.id, name: users.name, registrationId: users.registrationId })
    .from(users)
    .where(and(...conds))
    .limit(1);
  if (!patient) return null;
  // Must be one of this doctor's patients (legacy checked registration_id globally;
  // we scope it to the doctor's patient list to prevent cross-doctor access).
  const [owned] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, patient.id), eq(users.referenceRoleId, doctorId)));
  return owned ? patient : null;
}

function detectCardBrand(digits: string): string {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5|4[4-9])/.test(digits)) return "discover";
  if (/^(?:60|65|81|82|508)/.test(digits)) return "rupay";
  return "card";
}

function buildPaymentDetails(
  method: string,
  formData: FormData
): { details: Record<string, string>; paymentDate: string | null } {
  const details: Record<string, string> = {};
  let paymentDate: string | null = null;
  if (method === "upi") {
    const upiId = String(formData.get("upi_id") ?? "").trim();
    if (!upiId) throw new Error("UPI ID is required.");
    details.upi_id = upiId;
    paymentDate = String(formData.get("transaction_date") ?? "").trim() || null;
  } else if (method === "cash") {
    paymentDate = String(formData.get("payment_date") ?? "").trim() || null;
    if (!paymentDate) throw new Error("Payment date is required.");
  } else if (method === "card") {
    const rawCard = String(formData.get("card_number") ?? "").replace(/[\s-]/g, "");
    const expiry = String(formData.get("expiry") ?? "").trim();
    const cvv = String(formData.get("cvv") ?? "").trim();
    if (!rawCard || !expiry || !cvv) throw new Error("Card details are required.");
    if (!/^\d{12,19}$/.test(rawCard)) throw new Error("Invalid card number.");
    // PCI-DSS: never persist full PAN or CVV — store brand + last4 only.
    details.card_brand = detectCardBrand(rawCard);
    details.card_last4 = rawCard.slice(-4);
    details.expiry = expiry;
  } else if (method === "netbanking") {
    const bankName = String(formData.get("bank_name") ?? "").trim();
    const txId = String(formData.get("transaction_id") ?? "").trim();
    if (!bankName || !txId) throw new Error("Bank name and transaction ID are required.");
    details.bank_name = bankName;
    details.transaction_id = txId;
    paymentDate = String(formData.get("transaction_date") ?? "").trim() || null;
  }
  return { details, paymentDate };
}

async function createBillingForBooking(args: {
  doctorId: number;
  patientId: number;
  totalAmount: number;
  receivedAmount: number;
  paymentMethod: string;
  paymentDetails: Record<string, string>;
  bookingId?: number;
}) {
  try {
    const [existingType] = await db
      .select({ id: billingTypes.id })
      .from(billingTypes)
      .where(and(eq(billingTypes.doctorId, args.doctorId), eq(billingTypes.name, "Medical Test")));
    let billingTypeId: number;
    if (existingType) {
      billingTypeId = existingType.id;
    } else {
      const [created] = await db
        .insert(billingTypes)
        .values({
          doctorId: args.doctorId,
          name: "Medical Test",
          defaultAmount: "0",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .$returningId();
      billingTypeId = Number(created.id);
    }

    const now = new Date();
    const billNumber = generateBillNumber();
    const pending = Math.max(0, args.totalAmount - args.receivedAmount);
    const [bill] = await db
      .insert(billings)
      .values({
        billNumber,
        patientId: args.patientId,
        doctorId: args.doctorId,
        billingTypeId,
        testBookingId: args.bookingId,
        totalAmount: args.totalAmount.toFixed(2),
        receivedAmount: args.receivedAmount.toFixed(2),
        pendingAmount: pending.toFixed(2),
        paymentMethod: args.paymentMethod as never,
        paymentDetails: args.paymentDetails,
        status: pending <= 0 ? "paid" : args.receivedAmount > 0 ? "partial" : "pending",
        notes: "Automated bill from Test Booking",
        billDate: todayStr(now),
        createdAt: now,
        updatedAt: now,
      })
      .$returningId();
    const billingId = Number(bill.id);

    if (args.receivedAmount > 0) {
      await db.insert(transactions).values({
        userId: args.doctorId,
        type: 1,
        billingId,
        amount: args.receivedAmount.toFixed(2),
        date: now.toISOString().slice(0, 10),
        status: "approved",
        description: `Bill ${billNumber} — Medical Test (test booking)`,
        paymentMethod: args.paymentMethod,
        createdBy: "System",
        createdAt: now,
        updatedAt: now,
      });
    }

    void audit.billCreated(args.doctorId, { billingId, billNumber, source: "test_booking" });
  } catch {
    // Legacy parity: billing sync failure must not fail the booking itself.
  }
}

export async function createTestBooking(
  _prev: TestBookingActionResult,
  formData: FormData
): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-create");
  if (!doctorId) return { error: "You don't have permission to create test bookings." };
  const registrationId = String(formData.get("registration_id") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const vendorId = Number(formData.get("vendor_id"));
  const testIds = String(formData.get("test_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  const paymentMethod = String(formData.get("payment_method") ?? "cash");
  const amount = String(formData.get("amount") ?? "0");
  const bookingDate = String(formData.get("booking_date") ?? "");
  const bookingTime = String(formData.get("booking_time") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!registrationId && !phone) return { error: "Patient registration ID or phone is required." };
  const patient = await resolvePatient(doctorId, registrationId, phone);
  if (!patient) return { error: "Patient not found for this doctor. Check registration ID / phone." };

  if (!vendorId || !Number.isInteger(vendorId)) return { error: "Vendor is required." };
  const [vendor] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.doctorId, doctorId)));
  if (!vendor) return { error: "Vendor not found for this doctor." };

  if (testIds.length === 0) return { error: "Select at least one test." };
  const testRows = await db
    .select({ id: tests.id, name: tests.name, price: tests.price })
    .from(tests)
    .where(and(eq(tests.doctorId, doctorId)));
  const ownedTests = testRows.filter((t) => testIds.includes(t.id));
  if (ownedTests.length !== testIds.length) return { error: "One or more selected tests are not yours." };

  if (!(PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    return { error: "Invalid payment method." };
  }
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) return { error: "Invalid payment amount." };
  if (bookingDate && !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) return { error: "Invalid booking date." };

  let paymentDetails: Record<string, string>;
  let paymentDate: string | null;
  try {
    ({ details: paymentDetails, paymentDate } = buildPaymentDetails(paymentMethod, formData));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid payment details." };
  }

  const totalAmount = ownedTests.reduce((sum, t) => sum + Number(t.price ?? 0), 0);
  const testsJson = ownedTests.map((t) => ({ id: t.id, name: t.name, price: Number(t.price ?? 0) }));

  const now = new Date();
  const [createdBooking] = await db
    .insert(testBookings)
    .values({
      doctorId,
      patientId: patient.id,
      vendorId,
      bookingDate: bookingDate ? new Date(`${bookingDate}T00:00:00`) : now,
      bookingTime,
      tests: testsJson,
      totalAmount: totalAmount.toFixed(2),
      paymentMethod,
      paymentAmount: amountNum.toFixed(2),
      paymentDate: paymentDate as never,
      paymentDetails,
      status: "pending",
      notes,
      uploadLinkToken: randomToken(),
      createdAt: now,
      updatedAt: now,
    })
    .$returningId();
  const bookingId = Number(createdBooking.id);

  await createBillingForBooking({
    doctorId,
    patientId: patient.id,
    totalAmount,
    receivedAmount: amountNum,
    paymentMethod,
    paymentDetails,
    bookingId,
  });

  void audit.transactionCreated(doctorId, { source: "test_booking", vendorId, patientId: patient.id, totalAmount });

  revalidatePath("/doctor/test-bookings");
  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function updateTestBooking(
  _prev: TestBookingActionResult,
  formData: FormData
): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-edit");
  if (!doctorId) return { error: "You don't have permission to edit test bookings." };
  const bookingId = Number(formData.get("id"));
  const vendorId = Number(formData.get("vendor_id"));
  const testIds = String(formData.get("test_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  const paymentMethod = String(formData.get("payment_method") ?? "cash");
  const amount = String(formData.get("amount") ?? "0");
  const bookingDate = String(formData.get("booking_date") ?? "");
  const bookingTime = String(formData.get("booking_time") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!bookingId || !Number.isInteger(bookingId)) return { error: "Invalid booking ID." };
  const [existing] = await db
    .select({ id: testBookings.id })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.doctorId, doctorId)));
  if (!existing) return { error: "Test booking not found." };

  const [vendor] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.doctorId, doctorId)));
  if (!vendor) return { error: "Vendor not found for this doctor." };

  const testRows = await db
    .select({ id: tests.id, name: tests.name, price: tests.price })
    .from(tests)
    .where(eq(tests.doctorId, doctorId));
  const ownedTests = testRows.filter((t) => testIds.includes(t.id));
  if (ownedTests.length !== testIds.length) return { error: "One or more selected tests are not yours." };

  if (!(PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    return { error: "Invalid payment method." };
  }
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) return { error: "Invalid payment amount." };

  const totalAmount = ownedTests.reduce((sum, t) => sum + Number(t.price ?? 0), 0);
  const testsJson = ownedTests.map((t) => ({ id: t.id, name: t.name, price: Number(t.price ?? 0) }));

  await db
    .update(testBookings)
    .set({
      vendorId,
      tests: testsJson,
      totalAmount: totalAmount.toFixed(2),
      paymentMethod,
      paymentAmount: amountNum.toFixed(2),
      bookingDate: bookingDate ? new Date(`${bookingDate}T00:00:00`) : undefined,
      bookingTime,
      notes,
      updatedAt: new Date(),
    })
    .where(eq(testBookings.id, bookingId));

  void audit.transactionUpdated(doctorId, { source: "test_booking", bookingId });

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

export async function deleteTestBooking(bookingId: number): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-delete");
  if (!doctorId) return { error: "You don't have permission to delete test bookings." };
  if (!bookingId || !Number.isInteger(bookingId)) return { error: "Invalid booking ID." };

  const [existing] = await db
    .select({ id: testBookings.id })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.doctorId, doctorId)));
  if (!existing) return { error: "Test booking not found." };

  // Cascade soft-delete the auto-generated bill + its income transaction so
  // no orphaned financial record remains after the booking is deleted.
  const linkedBills = await db
    .select({ id: billings.id })
    .from(billings)
    .where(eq(billings.testBookingId, bookingId));
  for (const bill of linkedBills) {
    await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(eq(transactions.billingId, bill.id));
    await db
      .update(billings)
      .set({ deletedAt: new Date() })
      .where(eq(billings.id, bill.id));
  }

  await db.delete(testBookings).where(eq(testBookings.id, bookingId));

  void audit.transactionDeleted(doctorId, {
    source: "test_booking",
    bookingId,
    linkedBills: linkedBills.length,
  });

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

export async function updateTestBookingStatus(
  bookingId: number,
  status: string
): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-edit");
  if (!doctorId) return { error: "You don't have permission to change booking status." };
  if (!bookingId || !Number.isInteger(bookingId)) return { error: "Invalid booking ID." };
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) return { error: "Invalid status." };

  const [existing] = await db
    .select({ id: testBookings.id, status: testBookings.status })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.doctorId, doctorId)));
  if (!existing) return { error: "Test booking not found." };

  // Enforce the business state machine — arbitrary jumps are rejected
  // server-side, not just hidden in the UI.
  const allowed = BOOKING_TRANSITIONS[existing.status ?? "pending"] ?? [];
  if (!allowed.includes(status)) {
    return {
      error: `Cannot change a ${existing.status} booking to ${status}.`,
    };
  }

  await db
    .update(testBookings)
    .set({ status: status as never, updatedAt: new Date() })
    .where(eq(testBookings.id, bookingId));

  void audit.transactionStatusChanged(doctorId, { source: "test_booking", bookingId, status });

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

export async function regenerateUploadLink(bookingId: number): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-edit");
  if (!doctorId) return { error: "You don't have permission to manage upload links." };
  if (!bookingId || !Number.isInteger(bookingId)) return { error: "Invalid booking ID." };

  const [existing] = await db
    .select({ id: testBookings.id })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.doctorId, doctorId)));
  if (!existing) return { error: "Test booking not found." };

  await db
    .update(testBookings)
    .set({ uploadLinkToken: randomToken(), updatedAt: new Date() })
    .where(eq(testBookings.id, bookingId));

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

// ── Vendor CRUD ────────────────────────────────────────────────────────────

export async function createVendor(
  _prev: TestBookingActionResult,
  formData: FormData
): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-create");
  if (!doctorId) return { error: "You don't have permission to add vendors." };
  const name = String(formData.get("name") ?? "").trim();
  const mobile = String(formData.get("mobile") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name) return { error: "Vendor name is required." };
  if (name.length > 255) return { error: "Vendor name must be at most 255 characters." };
  if (!mobile) return { error: "Mobile is required." };
  if (!/^[\d+\s()-]{7,20}$/.test(mobile)) return { error: "Enter a valid mobile number." };
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (!address) return { error: "Address is required." };

  await db.insert(vendors).values({
    doctorId,
    name,
    mobile,
    email,
    address,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

export async function updateVendor(
  _prev: TestBookingActionResult,
  formData: FormData
): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-edit");
  if (!doctorId) return { error: "You don't have permission to edit vendors." };
  const vendorId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const mobile = String(formData.get("mobile") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!vendorId || !Number.isInteger(vendorId)) return { error: "Invalid vendor ID." };
  if (!name || !mobile || !email || !address) return { error: "All fields are required." };

  const [existing] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.doctorId, doctorId)));
  if (!existing) return { error: "Vendor not found." };

  await db
    .update(vendors)
    .set({ name, mobile, email, address, updatedAt: new Date() })
    .where(eq(vendors.id, vendorId));

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

export async function deleteVendor(vendorId: number): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-delete");
  if (!doctorId) return { error: "You don't have permission to delete vendors." };
  if (!vendorId || !Number.isInteger(vendorId)) return { error: "Invalid vendor ID." };

  const [existing] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.doctorId, doctorId)));
  if (!existing) return { error: "Vendor not found." };

  // Business rule / data integrity: deleting a vendor cascades to every one
  // of their test bookings (FK cascade), including completed bookings with
  // uploaded lab reports — clinical records would be destroyed while the
  // auto-generated bills remain. Deactivate the vendor (status toggle)
  // instead; old bookings stay traceable.
  const [linkedBooking] = await db
    .select({ id: testBookings.id })
    .from(testBookings)
    .where(and(eq(testBookings.vendorId, vendorId), eq(testBookings.doctorId, doctorId)))
    .limit(1);
  if (linkedBooking) {
    return {
      error: "This vendor has historical test bookings and cannot be deleted. You can edit its details instead.",
    };
  }

  await db.delete(vendors).where(eq(vendors.id, vendorId));

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

// ── Test CRUD ──────────────────────────────────────────────────────────────

export async function createTest(
  _prev: TestBookingActionResult,
  formData: FormData
): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-create");
  if (!doctorId) return { error: "You don't have permission to add tests." };
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = String(formData.get("price") ?? "0");

  if (!name) return { error: "Test name is required." };
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) return { error: "Invalid price." };

  await db.insert(tests).values({
    doctorId,
    name,
    description,
    price: priceNum.toFixed(2),
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

export async function updateTest(
  _prev: TestBookingActionResult,
  formData: FormData
): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-edit");
  if (!doctorId) return { error: "You don't have permission to edit tests." };
  const testId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = String(formData.get("price") ?? "0");

  if (!testId || !Number.isInteger(testId)) return { error: "Invalid test ID." };
  if (!name) return { error: "Test name is required." };
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) return { error: "Invalid price." };

  const [existing] = await db
    .select({ id: tests.id })
    .from(tests)
    .where(and(eq(tests.id, testId), eq(tests.doctorId, doctorId)));
  if (!existing) return { error: "Test not found." };

  await db
    .update(tests)
    .set({ name, description, price: priceNum.toFixed(2), updatedAt: new Date() })
    .where(eq(tests.id, testId));

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}

export async function deleteTest(testId: number): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-delete");
  if (!doctorId) return { error: "You don't have permission to delete tests." };
  if (!testId || !Number.isInteger(testId)) return { error: "Invalid test ID." };

  const [existing] = await db
    .select({ id: tests.id })
    .from(tests)
    .where(and(eq(tests.id, testId), eq(tests.doctorId, doctorId)));
  if (!existing) return { error: "Test not found." };

  await db.delete(tests).where(eq(tests.id, testId));

  revalidatePath("/doctor/test-bookings");
  return { error: null };
}