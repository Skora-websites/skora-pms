"use client";

import { useActionState, useRef } from "react";
import { PenLine } from "lucide-react";
import { uploadSignature } from "./actions";

const initialState = { error: null as string | null };

export function SignatureUpload({ signatureUrl }: { signatureUrl: string | null }) {
  const [state, formAction, pending] = useActionState(uploadSignature, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="card p-7">
      <h2 className="font-display text-base font-bold text-slate-900">Signature</h2>
      <p className="mt-1 text-xs text-slate-400">
        Used on prescriptions and PDFs. Upload a JPG or PNG of your signature.
      </p>
      <form action={formAction} className="mt-4 space-y-4">
        <input
          ref={inputRef}
          type="file"
          name="signature"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) e.target.form?.requestSubmit();
          }}
        />
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-40 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-slate-300">No signature</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="btn-secondary !py-2.5 text-xs"
          >
            <PenLine className="h-4 w-4" />
            {pending ? "Uploading..." : "Upload signature"}
          </button>
        </div>
        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}
      </form>
    </div>
  );
}