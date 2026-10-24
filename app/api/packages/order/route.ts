import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { packagePayments } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getPackagePricing, type PackagePeriod } from "@/lib/packages/config";
import { resolvePlanPurchaseTarget } from "@/lib/packages/buyers";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/packages/razorpay";

/**
 * Creates a Razorpay order + package_payments row for the signed-in buyer.
 *
 * The BUYER and the CREDITED user differ by tier: a doctor buys their own
 * practice, a business owner buys for their practice's anchor doctor
 * (lib/packages/buyers.ts). `package_payments.user_id` is the credited user
 * because fulfillment writes `users.package_id` / `users.trial_ends_at` on
 * that row — never the caller.
 *
 * Body: { packageId, period }
 */
export async function POST(request: Request) {
  // Role-only gate: buying a package is how an expired trial pays its way
  // back in (self-serve renewal from /trial-expired and /pricing), so this
  // route deliberately does NOT reject expired trials — the previous
  // isTrialExpired 403 made the renew button on /trial-expired dead code.
  const user = await requireApiRole(["doctor", "admin"]);
  if (user instanceof Response) return user;

  // Owner tier: which practice are we paying for? Managers are excluded —
  // purchase is owner-gated, mirroring /admin/settings.
  const businessDoctorIds =
    user.role === "admin" ? (await getBusinessScope()).doctorIds : [];
  const { targetUserId } = resolvePlanPurchaseTarget({
    role: user.role,
    userId: user.id,
    businessDoctorIds,
  });
  if (targetUserId === null) {
    return NextResponse.json(
      { error: "No clinic is linked to your business yet — add a clinic before buying a plan." },
      { status: 400 }
    );
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
      receipt: `pkg_${targetUserId}_${Date.now()}`,
      notes: { buyerId: String(user.id), userId: String(targetUserId), packageId, period },
    });

    await db.insert(packagePayments).values({
      userId: targetUserId,
      buyerId: user.id,
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
