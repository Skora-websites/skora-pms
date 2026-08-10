"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { respondConsent } from "./actions";

const initialState = { error: null as string | null };

export function ConsentForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(respondConsent, initialState);

  return (
    <form action={formAction} className="mt-7">
      <input type="hidden" name="slug" value={slug} />
      {state.error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          name="decision"
          value="accept"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-accent-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-700/25 transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> I Consent
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 py-3.5 text-sm font-semibold text-red-700 transition-colors hover:border-red-400 hover:bg-red-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" /> Decline
        </button>
      </div>
    </form>
  );
}
