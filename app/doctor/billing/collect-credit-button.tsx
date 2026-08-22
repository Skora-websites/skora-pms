"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
import { collectCreditPayment } from "./actions";

/** Button shown on pending credit bills: marks the 48h credit as collected. */
export function CollectCreditButton({ billId }: { billId: number }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleCollect() {
    if (!window.confirm("Mark this credit bill as collected? Income will be added to your ledger.")) return;
    setPending(true);
    await collectCreditPayment(billId);
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleCollect}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-lg border border-accent-200 bg-accent-50 px-2.5 py-1.5 text-xs font-semibold text-accent-800 transition-colors hover:bg-accent-100 disabled:opacity-50"
      title="Collect credit payment"
    >
      <HandCoins className="h-3.5 w-3.5" />
      {pending ? "Collecting…" : "Collect"}
    </button>
  );
}