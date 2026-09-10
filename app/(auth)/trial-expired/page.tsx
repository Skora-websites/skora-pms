import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { getCompanySettings } from "@/lib/queries/landing";
import { logoutAction } from "@/lib/actions/auth";
import { isRazorpayConfigured } from "@/lib/packages/razorpay";
import { getPackagePricing } from "@/lib/packages/config";
import { PackageCheckoutButton } from "@/components/packages/package-checkout-button";
import { PhoneCall, Mail, MessageCircle, LogOut } from "lucide-react";

export const metadata: Metadata = { title: "Trial Expired · SkoraCares" };

export default async function TrialExpiredPage() {
  const user = await getCurrentUser();
  // Mirror legacy trialExpired guard: only doctors with an ended trial see this.
  if (!user || user.role !== "doctor" || !user.trialEndsAt || user.trialEndsAt > new Date()) {
    redirect(user ? (user.role === "doctor" ? "/doctor" : "/") : "/login");
  }

  const settings = await getCompanySettings();
  const supportEmail = settings?.companyEmail1 ?? "Support@skoracares.in";
  const supportPhone = settings?.companyMobile1 ?? "+91 9876543210";
  const whatsapp = settings?.companyWhatsapp1 ?? settings?.companyMobile1 ?? "+91 9876543210";
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, "");
  const wa = cleanWhatsapp.length === 10 ? `91${cleanWhatsapp}` : cleanWhatsapp;
  const message = encodeURIComponent(
    `Hi, my trial plan on SkoraCares has expired.\nDoctor: ${user.name}\nEmail: ${user.email}\nI want to extend/renew my plan.`
  );
  const whatsappUrl = `https://wa.me/${wa}?text=${message}`;
  const emailUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(`Subscription Renewal Request - ${user.name}`)}&body=${message}`;
  const callUrl = `tel:${supportPhone.replace(/[^0-9+]/g, "")}`;

  // Self-serve renewal: pay for a package right here and access is restored
  // immediately after signature verification (no support round-trip).
  const renewPlanId = "package-2";
  const renewPricing = isRazorpayConfigured() ? getPackagePricing(renewPlanId, "monthly") : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-5 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-2">
        {/* Left — gradient panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-brand-800 p-10 text-white">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
          <div>
            <p className="font-display text-2xl font-extrabold">
              Skora<span className="text-accent-400">Cares</span>
            </p>
            <h1 className="mt-10 font-display text-3xl font-extrabold leading-tight">
              Your trial plan has expired!
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Your trial period has ended. Upgrade your plan to continue using the doctor dashboard.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border-2 border-dashed border-white/25 bg-accent-400 p-5 text-ink">
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Need more time?</h3>
            <p className="mt-1 text-sm opacity-90">
              Need more time to evaluate? Request a temporary trial extension from our support
              team on WhatsApp.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <MessageCircle className="h-4 w-4" />
              Extend your trial plan
            </a>
          </div>
        </div>

        {/* Right — features + contact */}
        <div className="flex flex-col justify-between bg-white p-10">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Upgrade your plan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Continue using premium features:
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-700">
              {[
                "Clinic management and staff portal access in one place.",
                "Secure, cloud-based access to patient medical records.",
                "E-prescriptions with less paperwork.",
                "AI-powered smart prescriptions.",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-800">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            {renewPricing && (
              <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Renew now — {renewPricing.plan.name}</p>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-ink">
                    ₹{(renewPricing.amount / 100).toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Pay securely with UPI, cards or netbanking. Your dashboard unlocks instantly after payment.
                </p>
                <div className="mt-4">
                  <PackageCheckoutButton
                    packageId={renewPlanId}
                    packageName={renewPricing.plan.name}
                    period="monthly"
                    label={`Renew for ₹${(renewPricing.amount / 100).toLocaleString("en-IN")}`}
                    buyer={{ name: user.name, email: user.email, phone: user.phone }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={callUrl}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-700 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                <PhoneCall className="h-4 w-4" />
                Request a call back
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                <MessageCircle className="h-4 w-4" />
                Get unlimited access
              </a>
            </div>

            <div className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-700" />
                Email: <a className="font-semibold text-brand-700 hover:underline" href={emailUrl}>{supportEmail}</a>
              </p>
              <p className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-brand-700" />
                Call: <a className="font-semibold text-brand-700 hover:underline" href={callUrl}>{supportPhone}</a>
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out from account
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
