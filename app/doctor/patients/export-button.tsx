"use client";

import { Download } from "lucide-react";

export function ExportPatientsButton() {
  return (
    <button
      type="button"
      onClick={() => {
        // Forward current search/filter params to the export API route.
        const form = document.querySelector<HTMLFormElement>("form");
        const fd = new FormData(form ?? undefined);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          if (typeof v === "string" && v) params.set(k, v);
        }
        const url = `/api/doctor/patients/export?${params.toString()}`;
        window.open(url, "_blank");
      }}
      className="btn-secondary shrink-0"
    >
      <Download className="h-4 w-4" /> Export CSV
    </button>
  );
}