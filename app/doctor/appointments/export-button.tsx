"use client";

import { Download } from "lucide-react";
import { useTransition } from "react";

/**
 * Client-side export button that streams the current appointment list
 * (respecting the active status tab) as a CSV from the export API route.
 */
export function ExportAppointmentsButton({
  status,
}: {
  status?: string;
}) {
  const [pending, startTransition] = useTransition();

  const exportCsv = () =>
    startTransition(async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      const res = await fetch(`/api/doctor/appointments/export?${params.toString()}`);
      if (!res.ok) {
        alert("Export failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

  return (
    <button
      onClick={exportCsv}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-800 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {pending ? "Exporting..." : "Export CSV"}
    </button>
  );
}
