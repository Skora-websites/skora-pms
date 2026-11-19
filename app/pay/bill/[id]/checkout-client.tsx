"use client";

import { useEffect, useState } from "react";

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function getRazorpay(): RazorpayConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
}

export function CheckoutClient({
  billId,
  billNumber,
  amountPaise,
  amountDisplay,
  orderId,
  keyId,
  patientName,
  patientEmail,
  patientPhone,
}: {
  billId: number;
  billNumber: string;
  amountPaise: number;
  amountDisplay: number;
  orderId: string;
  keyId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
}) {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startPayment = () => {
    const RazorpayClass = getRazorpay();
    if (!RazorpayClass) {
      setErrorMessage("Razorpay payment gateway is still loading. Please tap Retry.");
      return;
    }

    setErrorMessage(null);
    setStatus("processing");

    const options = {
      key: keyId,
      amount: amountPaise,
      currency: "INR",
      name: "Skora Care",
      description: `Bill #${billNumber}`,
      order_id: orderId,
      prefill: {
        name: patientName,
        email: patientEmail,
        contact: patientPhone,
      },
      theme: {
        color: "#114232",
      },
      handler: async function (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) {
        try {
          const verifyRes = await fetch(`/api/mobile/patient/bills/${billId}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          const data = await verifyRes.json();
          if (verifyRes.ok && data.data?.success) {
            setStatus("success");
            // Deep link back to the mobile app
            setTimeout(() => {
              window.location.href = `skoramobile://payment-complete?status=success&billId=${billId}&paymentId=${response.razorpay_payment_id}`;
            }, 600);
          } else {
            setStatus("failed");
            setErrorMessage(data.error ?? "Payment verification failed on the server.");
          }
        } catch {
          setStatus("failed");
          setErrorMessage("Failed to communicate with payment server.");
        }
      },
      modal: {
        ondismiss: function () {
          setStatus("idle");
        },
      },
    };

    const rzp = new RazorpayClass(options);
    rzp.open();
  };

  useEffect(() => {
    // Attempt auto-trigger when Razorpay script is ready
    const timer = setTimeout(() => {
      if (getRazorpay()) {
        startPayment();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
        <span className="text-2xl font-bold text-emerald-800">₹</span>
      </div>

      <h1 className="text-xl font-bold text-slate-800">Skora Care Checkout</h1>
      <p className="text-xs text-slate-400 mt-1">Invoice #{billNumber}</p>

      <div className="bg-slate-50 rounded-2xl p-4 my-6 border border-slate-100">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount Due</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{amountDisplay.toLocaleString("en-IN")}</p>
        <p className="text-xs text-slate-400 mt-1">Patient: {patientName}</p>
      </div>

      {status === "success" ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
          <p className="font-bold text-emerald-800 text-base">Payment Successful!</p>
          <p className="text-xs text-emerald-600 mt-1">Returning to Skora Care mobile app...</p>
          <a
            href={`skoramobile://payment-complete?status=success&billId=${billId}`}
            className="inline-block mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
          >
            Return to App
          </a>
        </div>
      ) : (
        <div>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {errorMessage}
            </div>
          )}

          <button
            onClick={startPayment}
            disabled={status === "processing"}
            className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-98 transition text-white font-semibold rounded-2xl text-sm shadow-sm"
          >
            {status === "processing" ? "Opening Gateway…" : `Pay ₹${amountDisplay.toLocaleString("en-IN")} via UPI / Card`}
          </button>

          <p className="text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1">
            🔒 Secured by Razorpay 256-bit encryption
          </p>
        </div>
      )}
    </div>
  );
}
