"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, isNull } from "drizzle-orm";
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
    // Exact match only — a LIKE '%phone%' can bind the wrong patient when
    // one number is a suffix of another (e.g. 98111 vs 9811123456).
    conds.push(eq(users.phone, phone));
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
  /** Optional transaction handle — pass when the booking insert shares the same tx. */
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0];
}) {
  const dbx = args.tx ?? db;
  try {
    // Get-or-create "Medical Test" billing type. Unique index (doctor_id,
    // name, is_active) closes the two-requests-both-create race.
    const [existingType] = await dbx
      .select({ id: billingTypes.id })
      .from(billingTypes)
      .where(and(eq(billingTypes.doctorId, args.doctorId), eq(billingTypes.name, "Medical Test")));
    let billingTypeId: number;
    if (existingType) {
      billingTypeId = existingType.id;
    } else {
      const [created] = await dbx
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
    const [bill] = await dbx
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
      await dbx.insert(transactions).values({
        userId: args.doctorId,
        type: 1,
        billingId,
        amount: args.receivedAmount.toFixed(2),
        date: todayStr(now),
        status: "approved",
        description: `Bill ${billNumber} — Medical Test (test booking)`,
        paymentMethod: args.paymentMethod,
        createdBy: "System",
        createdAt: now,
        updatedAt: now,
      });
    }

    void audit.billCreated(args.doctorId, { billingId, billNumber, source: "test_booking" });
  } catch (err) {
    // When inside the booking's own transaction, billing failure must ROLL
    // THE WHOLE BOOKING BACK — a booking without its auto-bill is a silent
    // accounting gap (legacy tolerated it; we do not).
    if (args.tx) throw err;
    console.error("[test-booking] auto-bill generation failed:", { bookingId: args.bookingId, err });
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
  // Booking + auto-generated bill in ONE transaction — previously a failure
  // between the two left either an unbilled booking or (worse) an orphan bill.
  const bookingId = await db.transaction(async (tx) => {
    const [createdBooking] = await tx
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
      tx,
    });

    return bookingId;
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
    .select({ id: testBookings.id, status: testBookings.status })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.doctorId, doctorId)));
  if (!existing) return { error: "Test booking not found." };

  // Terminal states are immutable (same rule as updateTestBookingStatus) —
  // the booking may already have a bill, vendor report, or patient records.
  if (existing.status === "completed" || existing.status === "cancelled") {
    return { error: `A ${existing.status} booking can no longer be edited.` };
  }

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

  let paymentDetails: Record<string, string>;
  try {
    ({ details: paymentDetails } = buildPaymentDetails(paymentMethod, formData));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid payment details." };
  }

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

  // Keep the auto-generated bill + income transaction in sync with the edit —
  // otherwise totals in Billing/Income-Expense go stale vs the booking.
  const [linkedBill] = await db
    .select({
      id: billings.id,
      totalAmount: billings.totalAmount,
      receivedAmount: billings.receivedAmount,
      paymentMethod: billings.paymentMethod,
      paymentDetails: billings.paymentDetails,
    })
    .from(billings)
    .where(and(eq(billings.testBookingId, bookingId), isNull(billings.deletedAt)))
    .limit(1);
  if (linkedBill) {
    const pending = Math.max(0, totalAmount - amountNum);
    await db
      .update(billings)
      .set({
        totalAmount: totalAmount.toFixed(2),
        receivedAmount: amountNum.toFixed(2),
        pendingAmount: pending.toFixed(2),
        paymentMethod: paymentMethod as never,
        paymentDetails,
        status: pending <= 0 ? "paid" : amountNum > 0 ? "partial" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(billings.id, linkedBill.id));
    const [tx] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.billingId, linkedBill.id), isNull(transactions.deletedAt)))
      .limit(1);
    if (tx) {
      if (amountNum > 0) {
        await db
          .update(transactions)
          .set({
            amount: amountNum.toFixed(2),
            paymentMethod,
            updatedAt: new Date(),
          })
          .where(eq(transactions.id, tx.id));
      } else {
        // Payment fully removed — soft-delete the income row so totals match.
        await db
          .update(transactions)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(eq(transactions.id, tx.id));
      }
    }
  }

  void audit.transactionUpdated(doctorId, { source: "test_booking", bookingId });

  revalidatePath("/doctor/test-bookings");
  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function deleteTestBooking(bookingId: number): Promise<TestBookingActionResult> {
  const doctorId = await requireDoctorPermission("test-booking-delete");
  if (!doctorId) return { error: "You don't have permission to delete test bookings." };
  if (!bookingId || !Number.isInteger(bookingId)) return { error: "Invalid booking ID." };

  const [existing] = await db
    .select({ id: testBookings.id, uploadedFilePath: testBookings.uploadedFilePath })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.doctorId, doctorId)));
  if (!existing) return { error: "Test booking not found." };

  // Atomic delete: soft-delete linked bills + income transactions in the
  // same transaction as the booking delete. The FK (test_booking_id →
  // test_bookings ON DELETE SET NULL) would otherwise keep hard-deleted
  // bookings' bills alive as orphans (audit found 4).
  const linkedBills = await db.transaction(async (tx) => {
    const bills = await tx
      .select({ id: billings.id })
      .from(billings)
      .where(eq(billings.testBookingId, bookingId));
    for (const bill of bills) {
      await tx
        .update(transactions)
        .set({ deletedAt: new Date() })
        .where(eq(transactions.billingId, bill.id));
      await tx
        .update(billings)
        .set({ deletedAt: new Date(), testBookingId: null })
        .where(eq(billings.id, bill.id));
    }
    await tx.delete(testBookings).where(eq(testBookings.id, bookingId));
    return bills;
  });

  // Unlink the vendor-uploaded report file (PHI) — the row is gone, so the
  // file must go with it. Path is server-generated (dir + uuid), still
  // resolve-guarded against traversal.
  if (existing.uploadedFilePath) {
    const resolved = path.resolve(process.cwd(), "storage", "uploads", existing.uploadedFilePath);
    if (resolved.startsWith(path.join(process.cwd(), "storage", "uploads"))) {
      await fs.unlink(resolved).catch(() => undefined);
    }
  }

  void audit.transactionDeleted(doctorId, {
    source: "test_booking",
    bookingId,
    linkedBills: linkedBills.length,
  });

  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");

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

  // Duplicate active-name check (DB also enforces via unique index).
  const [dup] = await db
    .select({ id: tests.id })
    .from(tests)
    .where(and(eq(tests.doctorId, doctorId), eq(tests.name, name), eq(tests.status, true)));
  if (dup) return { error: "A test with this name already exists." };

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