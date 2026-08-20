"use client";

import { useActionState, useState } from "react";
import { Check, X, UploadCloud } from "lucide-react";
import { respondConsent } from "./actions";

const initialState = { error: null as string | null };

export function ConsentForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(respondConsent, initialState);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="mt-7">
      <input type="hidden" name="slug" value={slug} />
      {state.error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {/* Optional document upload (jpg/png/pdf, max 5 MB) */}
      <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40">
        <UploadCloud className="h-6 w-6 text-brand-600" />
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {fileName ?? "Upload document / prescription (optional)"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">JPG, PNG or PDF · max 5 MB</p>
        <input
          type="file"
          name="consent_file"
          accept="image/jpeg,image/png,application/pdf"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

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
