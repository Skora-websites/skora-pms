"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Razorpay Checkout button for package purchases (pricing page + the
 * trial-expired page's renew flow).
 *
 * Flow: POST /api/packages/order → open Razorpay Checkout with the order id
 * → handler POSTs the checkout result to /api/packages/verify, which
 * verifies the signature and extends access → router.refresh() so the
 * server components (doctor layout guard) re-evaluate with the new expiry.
 */

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PackageCheckoutButton({
  packageId,
  packageName,
  period,
  label,
  variant = "primary",
  className,
  buyer,
}: {
  packageId: string;
  packageName: string;
  period: "monthly" | "yearly";
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
  buyer?: { name?: string | null; email?: string | null; phone?: string | null };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setError(null);
    setPending(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Could not load the payment gateway. Check your connection and retry.");
        return;
      }

      const res = await fetch("/api/packages/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, period }),
      });
      const data = (await res.json()) as {
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        error?: string;
      };
      if (!res.ok || !data.orderId || !data.keyId) {
        setError(data.error ?? "Could not start the payment. Please try again.");
        return;
      }

      const rzp = new window.Razorpay!({
        key: data.keyId,
        amount: data.amount!,
        currency: data.currency ?? "INR",
        name: "SkoraCares",
        description: `${packageName} · ${period === "yearly" ? "Yearly" : "Monthly"} plan`,
        order_id: data.orderId,
        prefill: {
          name: buyer?.name ?? undefined,
          email: buyer?.email ?? undefined,
          contact: buyer?.phone ?? undefined,
        },
        theme: { color: "#114232" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/packages/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = (await verifyRes.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
          };
          if (verifyRes.ok && verifyData.ok) {
            // Re-run server guards/layouts with the extended expiry.
            router.refresh();
          } else {
            setError(verifyData.error ?? "Payment received but activation failed. Contact support with your payment id.");
          }
        },
        modal: {
          ondismiss: () => {
            setPending(false);
            setError("Payment cancelled — you were not charged.");
          },
        },
      });
      rzp.open();
    } catch {
      setError("Something went wrong starting the payment. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending}
        className={cn(
          "w-full rounded-full py-3 text-center text-sm font-semibold transition-all",
          variant === "primary"
            ? "bg-brand-700 text-white hover:bg-brand-600 shadow-lg shadow-brand-700/25 hover:-translate-y-0.5"
            : "border-2 border-brand-200 text-brand-800 hover:border-brand-700 hover:bg-brand-50"
        )}
      >
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Opening checkout…
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
