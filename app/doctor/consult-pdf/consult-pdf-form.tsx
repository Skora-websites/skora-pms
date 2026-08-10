"use client";

import { useActionState, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadConsultPdf } from "./actions";

const initialState = { error: null as string | null };

export function ConsultPdfForm() {
  const [state, formAction, pending] = useActionState(uploadConsultPdf, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="mt-6">
      <label
        htmlFor="pdf-input"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file && inputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            inputRef.current.files = dt.files;
            setFileName(file.name);
          }
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
      >
        <UploadCloud className="h-8 w-8 text-brand-600" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          {fileName ?? "Drag & drop your PDF here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-slate-400">PDF up to 10 MB</p>
        <input
          ref={inputRef}
          id="pdf-input"
          name="pdf"
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      {state.error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          <UploadCloud className="h-4 w-4" />
          {pending ? "Uploading…" : "Upload PDF"}
        </button>
      </div>
    </form>
  );
}
