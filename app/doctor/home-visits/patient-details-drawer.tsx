"use client";

import { useState } from "react";
import { CalendarDays, ClipboardList, FileText, Home, MapPin, Phone, UserRound, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/dashboard-ui";

type PatientDetail = {
  patient: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    gender: string | null;
    dob: string | null;
    address: string | null;
    streetAddress: string | null;
    city: string | null;
    state: string | null;
    pincode: number | null;
    registrationId: string | null;
    referredBy: string | null;
  };
  appointments: {
    id: number;
    date: string;
    time: string | null;
    status: string;
    caseType: string | null;
    note: string | null;
    doctorName: string | null;
  }[];
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</span>;
}

export function PatientDetailsDrawer({ patientId, patientName }: { patientId: number; patientName: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDrawer() {
    setOpen(true);
    if (data) return;
    setLoading(true);
    setError(null);
    fetch(`/api/doctor/home-visits/patient-details/${patientId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load patient details.");
        return res.json();
      })
      .then((d) => setData(d as PatientDetail))
      .catch(() => setError("Could not load patient details."))
      .finally(() => setLoading(false));
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
      >
        <UserRound className="h-3.5 w-3.5" />
        Details
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`${patientName} details`}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Patient details</p>
                <h2 className="mt-1 font-display text-lg font-bold text-slate-900">{patientName}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {loading && <p className="py-10 text-center text-sm text-slate-400">Loading…</p>}
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              {data && (
                <>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                        {data.patient.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{data.patient.name}</p>
                        <p className="text-xs text-slate-400">
                          {data.patient.registrationId ? `ID: ${data.patient.registrationId}` : "No registration ID"}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label>Phone</Label>
                        <p className="mt-0.5 flex items-center gap-1 text-slate-700">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {data.patient.phone ?? "—"}
                        </p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="mt-0.5 truncate text-slate-700">{data.patient.email ?? "—"}</p>
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <p className="mt-0.5 capitalize text-slate-700">{data.patient.gender ?? "—"}</p>
                      </div>
                      <div>
                        <Label>Date of birth</Label>
                        <p className="mt-0.5 text-slate-700">{data.patient.dob ?? "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <Label>Address</Label>
                        <p className="mt-0.5 flex items-start gap-1 text-slate-700">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                          {[data.patient.streetAddress, data.patient.address, data.patient.city, data.patient.state, data.patient.pincode]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                      <div>
                        <Label>Referred by</Label>
                        <p className="mt-0.5 text-slate-700">{data.patient.referredBy ?? "—"}</p>
                      </div>
                    </dl>
                  </div>

                  <h3 className="mt-6 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <ClipboardList className="h-4 w-4 text-brand-700" />
                    Appointment history
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {data.appointments.length}
                    </span>
                  </h3>

                  <div className="mt-3 space-y-2">
                    {data.appointments.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                        No appointments yet.
                      </p>
                    )}
                    {data.appointments.map((a) => (
                      <div key={a.id} className="rounded-xl border border-slate-100 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(a.date)}
                            {a.time && <span className="text-xs font-normal text-slate-400">{a.time}</span>}
                          </p>
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 capitalize">
                            <Home className="h-3 w-3" />
                            {a.caseType?.replace("_", " ") ?? "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Dr. {a.doctorName ?? "—"}
                          </span>
                        </div>
                        {a.note && <p className="mt-1.5 text-xs text-slate-400">“{a.note}”</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}