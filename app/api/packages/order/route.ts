import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { packagePayments } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { getPackagePricing, type PackagePeriod } from "@/lib/packages/config";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/packages/razorpay";

/**
 * Creates a Razorpay order + package_payments row for the signed-in doctor.
 * Body: { packageId, period }
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.role !== "doctor") {
    return NextResponse.json({ error: "Only doctors can purchase packages." }, { status: 403 });
  }

  let body: { packageId?: unknown; period?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const packageId = typeof body.packageId === "string" ? body.packageId : "";
  const period: PackagePeriod = body.period === "yearly" ? "yearly" : "monthly";
  const pricing = getPackagePricing(packageId, period);
  if (!pricing) return NextResponse.json({ error: "Unknown package." }, { status: 400 });

  try {
    const order = await createRazorpayOrder({
      amount: pricing.amount,
      receipt: `pkg_${user.id}_${Date.now()}`,
      notes: { userId: String(user.id), packageId, period },
    });

    await db.insert(packagePayments).values({
      userId: user.id,
      packageId,
      packageName: pricing.plan.name,
      period,
      amount: pricing.amount,
      status: "created",
      razorpayOrderId: order.id,
      createdAt: new Date(),
    });

    return NextResponse.json({
      orderId: order.id,
      amount: pricing.amount,
      currency: "INR",
      keyId: getRazorpayKeyId(),
      packageName: pricing.plan.name,
      period,
    });
  } catch (err) {
    console.error("[packages/order] Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 }
    );
  }
}
