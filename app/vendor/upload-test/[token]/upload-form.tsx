"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadTestReport } from "./actions";

export function VendorUploadForm({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "err", text: "Please choose a report file." });
      return;
    }
    setBusy(true);
    setMessage(null);
    const fd = new FormData();
    fd.set("test_report", file);
    const res = await uploadTestReport(token, fd);
    setBusy(false);
    if (res.success) {
      setMessage({ type: "ok", text: "Report uploaded successfully! The doctor has been notified." });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } else {
      setMessage({ type: "err", text: res.error ?? "Upload failed. Please try again." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Upload className="h-6 w-6" />
        </span>
        <span className="text-sm font-semibold text-slate-700">{file ? file.name : "Choose report file"}</span>
        <span className="text-xs text-slate-400">PDF, JPG or PNG · max 5 MB</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-accent-200 bg-accent-50 text-accent-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <button type="submit" disabled={busy || !file} className="btn-primary w-full !py-3 disabled:opacity-60">
        {busy ? "Uploading…" : "Upload report"}
      </button>
    </form>
  );
}