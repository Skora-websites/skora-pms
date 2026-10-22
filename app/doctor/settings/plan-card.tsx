import type { ReactNode } from "react";
import { CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react";
import Link from "next/link";
import { PackageCheckoutButton } from "@/components/packages/package-checkout-button";
import { isRazorpayConfigured } from "@/lib/packages/razorpay";
import { PACKAGE_PLANS } from "@/lib/packages/config";
import { getTrialDays } from "@/lib/queries/landing";
import { getPracticePlanSummary } from "@/lib/queries/packages";
import { DAY_MS, msUntilTrialEnd } from "@/lib/auth/trial";
import { formatDate, formatINR } from "@/lib/utils";

const PERIOD_LABEL: Record<string, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

/**
 * The practice's subscription state — the surface the cancellation policy
 * points at ("your account settings"). Read-only truth: current plan, the
 * entitlements it unlocks, the access expiry the layout guard enforces, and
 * the payment history backing it. Rendered server-side so it never ships plan
 * state to a client bundle.
 */
export default async function PlanCard({
  viewerId,
  viewerRole,
  viewerName,
  viewerEmail,
  viewerPhone,
  practiceDoctorId,
}: {
  viewerId: number;
  viewerRole: string;
  viewerName: string;
  viewerEmail: string | null;
  viewerPhone: string | null;
  practiceDoctorId: number;
}) {
  const summary = await getPracticePlanSummary({ id: viewerId, role: viewerRole }, practiceDoctorId);
  const { entitlements, accessUntil, accessExpired, staffSeatsUsed, payments } = summary;
  const trialDays = await getTrialDays();

  const onTrial = entitlements.packageId === null;
  const daysLeft = accessUntil ? Math.floor(msUntilTrialEnd({ role: "doctor", trialEndsAt: accessUntil }) / DAY_MS) : null;
  const seatsLabel = entitlements.staffSeats === null ? "Unlimited" : `${entitlements.staffSeats}`;
  const seatsUsedLabel = `${staffSeatsUsed}${entitlements.staffSeats === null ? "" : ` / ${seatsLabel}`}`;
  const canCheckout = viewerRole === "doctor" && isRazorpayConfigured();
  const renewPlanId = entitlements.packageId ?? "package-2";
  const renewPlan = PACKAGE_PLANS.find((p) => p.id === renewPlanId);

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Current plan",
      value: onTrial ? "Free trial" : entitlements.packageName,
    },
    {
      label: onTrial ? "Trial ends" : "Access until",
      value: accessUntil ? (
        <span className={accessExpired ? "font-semibold text-red-600" : "font-semibold text-ink"}>
          {formatDate(accessUntil)}
          {daysLeft !== null && !accessExpired ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : ""}
        </span>
      ) : (
        "—"
      ),
    },
    { label: "Staff accounts", value: `${seatsUsedLabel}` },
  ];

  return (
    <div className="space-y-6">
      {accessExpired && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Your plan has ended. Renew below to restore access — until then the dashboard stays locked.
        </p>
      )}

      <div className="card p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Plan &amp; subscription</h2>
            <p className="mt-1 text-sm text-slate-500">
              {onTrial
                ? `You are on the free trial (${trialDays} days). Pick a plan when you're ready.`
                : "Your purchased plan and what it unlocks."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
            <CreditCard className="h-3.5 w-3.5" />
            {onTrial ? "Trial" : entitlements.packageName}
          </span>
        </div>

        <dl className="mt-6 divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3 text-sm">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="text-right text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Included in this plan</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { label: "Staff accounts", ok: true, detail: seatsLabel },
              { label: "Role management", ok: entitlements.features.roleManagement, detail: null },
              { label: "Multi-vendor lab tests", ok: entitlements.features.multiVendorLabTests, detail: null },
            ].map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-sm text-ink">
                {f.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                )}
                <span className={f.ok ? "" : "text-slate-400 line-through"}>
                  {f.label}
                  {f.detail ? ` · ${f.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Appointments, prescriptions, billing, patients and ledger are included on every plan.
          </p>
        </div>

        {canCheckout && renewPlan ? (
          <div className="mt-7 border-t border-slate-100 pt-6">
            <p className="mb-3 text-sm font-medium text-ink">
              {onTrial ? "Start a paid plan" : `Renew or switch plan — current: ${entitlements.packageName}`}
            </p>
            <div className="flex flex-wrap items-end gap-4">
              {PACKAGE_PLANS.map((plan) => (
                <div key={plan.id} className="w-40">
                  <p className="text-xs font-medium text-slate-500">{plan.name}</p>
                  <p className="mb-2 text-sm font-semibold text-ink">
                    {formatINR(plan.monthlyAmount / 100)}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </p>
                  <PackageCheckoutButton
                    packageId={plan.id}
                    packageName={plan.name}
                    period="monthly"
                    label={plan.id === renewPlanId ? "Renew" : "Choose"}
                    variant={plan.id === renewPlanId ? "primary" : "secondary"}
                    buyer={{ name: viewerName, email: viewerEmail, phone: viewerPhone }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Payments are one-off — there is no automatic renewal, and access runs to the date above. See the{" "}
              <Link href="/cancellation-policy" className="underline">
                cancellation policy
              </Link>
              .
            </p>
          </div>
        ) : (
          <p className="mt-7 border-t border-slate-100 pt-6 text-sm text-slate-500">
            {viewerRole === "doctor"
              ? "Online payment is not available on this deployment yet — contact support to renew or change plan."
              : "Plan changes are made by your practice owner."}
          </p>
        )}
      </div>

      <div className="card p-7">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Payment history</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No payments yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Plan</th>
                  <th className="pb-2 pr-4 font-medium">Period</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Access until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-4 text-slate-600">{p.createdAt ? formatDate(p.createdAt) : "—"}</td>
                    <td className="py-2.5 pr-4 text-ink">{p.packageName}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{PERIOD_LABEL[p.period] ?? p.period}</td>
                    <td className="num py-2.5 pr-4 text-ink">{formatINR(p.amount / 100)}</td>
                    <td className="py-2.5 text-slate-600">{p.accessUntil ? formatDate(p.accessUntil) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-400">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Plans do not renew automatically. When access ends the dashboard locks until a new plan is purchased; existing
        patients, appointments and records are kept.
      </p>
    </div>
  );
}
