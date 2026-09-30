"use client";

import { useState, useTransition } from "react";
import { toggleBusinessOwnerStatus, toggleBusinessStatus } from "./actions";

/**
 * Row actions for the super-admin businesses table: toggle the business's
 * active flag, or deactivate/reactivate the owner account. Server actions
 * run inside a transition so the row stays interactive without local state.
 */
export function BusinessRowActions({
  businessId,
  ownerId,
  ownerStatus,
  isActive,
}: {
  businessId: number;
  ownerId: number;
  ownerStatus: string;
  isActive: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error: string | null }>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res.error);
    });

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => toggleBusinessStatus(businessId))}
        className="text-xs font-semibold text-slate-600 hover:underline disabled:opacity-50"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => toggleBusinessOwnerStatus(ownerId))}
        className={`text-xs font-semibold hover:underline disabled:opacity-50 ${
          ownerStatus === "active" ? "text-rose-600" : "text-brand-800"
        }`}
      >
        {ownerStatus === "active" ? "Deactivate owner" : "Reactivate owner"}
      </button>
    </div>
  );
}
