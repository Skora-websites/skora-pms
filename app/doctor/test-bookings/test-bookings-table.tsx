"use client";

import Link from "next/link";
import {
  Copy,
  Pencil,
  RefreshCw,
  Trash2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDateTime, formatINR } from "@/lib/utils";
import { deleteTestBooking, updateTestBookingStatus, regenerateUploadLink } from "./actions";
import { BookingForm } from "./booking-form";

export type BookingRow = {
  id: number;
  bookingDate: Date | null;
  bookingTime: string | null;
  totalAmount: string | null;
  paymentAmount: string | null;
  paymentMethod: string | null;
  status: string | null;
  notes: string | null;
  tests: unknown;
  uploadLinkToken: string | null;
  uploadedFilePath: string | null;
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  patientRegistrationId: string | null;
  vendorId: number;
  vendorName: string | null;
  vendorEmail: string | null;
};

type Vendor = { id: number; name: string };
type Test = { id: number; name: string; price: string | null };

const STATUSES = ["pending", "in-progress", "completed", "cancelled"];

// Must match BOOKING_TRANSITIONS in ./actions.ts — the server rejects any
// transition not listed here, so this only controls which options the UI
// suggests (the backend remains the source of truth).
const TRANSITIONS: Record<string, string[]> = {
  pending: ["pending", "in-progress", "completed", "cancelled"],
  "in-progress": ["in-progress", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

export function TestBookingsTable({
  bookings,
  vendors,
  tests,
}: {
  bookings: BookingRow[];
  vendors: Vendor[];
  tests: Test[];
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<BookingRow | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const uploadUrl = (token: string) => `${window.location.origin}/vendor/upload-test/${token}`;

  async function run(id: number, fn: () => Promise<{ error: string | null }>) {
    setBusyId(id);
    const res = await fn();
    setBusyId(null);
    if (!res?.error) router.refresh();
    else alert(res.error);
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(uploadUrl(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {/* Mobile: card-per-booking list */}
      <div className="space-y-3 sm:hidden">
        {bookings.map((b) => {
          const testList = (b.tests as { name: string }[] | null) ?? [];
          const token = b.uploadLinkToken;
          return (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/doctor/patients/${b.patientId}`} className="truncate text-sm font-semibold text-slate-800 hover:text-brand-800">
                    {b.patientName}
                  </Link>
                  <p className="truncate text-xs text-slate-400">
                    {b.patientRegistrationId ?? "—"} · {b.patientPhone ?? "—"}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <p className="mt-2 truncate text-xs text-slate-500">
                {testList.map((t) => t.name).join(", ") || (b.notes ?? "")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400">Vendor</p>
                  <p className="truncate font-medium text-slate-700">{b.vendorName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Booking</p>
                  <p className="font-medium text-slate-700">{formatDateTime(b.bookingDate)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Total</p>
                  <p className="font-semibold text-slate-900">{formatINR(b.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Paid</p>
                  <p className="font-medium capitalize text-slate-700">
                    {formatINR(b.paymentAmount)} {b.paymentMethod ? `· ${b.paymentMethod}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
                {b.uploadedFilePath ? (
                  <Link
                    href={`/api/doctor/test-bookings/${b.id}/report`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent-200 px-2.5 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-50"
                  >
                    <FileText className="h-3.5 w-3.5" /> View report
                  </Link>
                ) : token ? (
                  <button
                    type="button"
                    onClick={() => copyLink(token)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-700" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
                <select
                  value={b.status ?? "pending"}
                  disabled={busyId === b.id}
                  onChange={(e) => run(b.id, () => updateTestBookingStatus(b.id, e.target.value))}
                  className="input !w-auto !py-1.5 !text-xs"
                >
                  {(TRANSITIONS[b.status ?? "pending"] ?? STATUSES).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="button" title="Edit booking" onClick={() => setEditing(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" title="Regenerate upload link" onClick={() => run(b.id, () => regenerateUploadLink(b.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Delete booking"
                  onClick={() => { if (confirm(`Delete test booking for ${b.patientName}?`)) run(b.id, () => deleteTestBooking(b.id)); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: full table */}
      <div className="card hidden overflow-hidden sm:block">
      <div className="slim-scroll overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3.5">Patient</th>
              <th className="px-5 py-3.5">Vendor</th>
              <th className="px-5 py-3.5">Booking</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Report</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.map((b) => {
              const testList = (b.tests as { name: string }[] | null) ?? [];
              const token = b.uploadLinkToken;
              return (
                <tr key={b.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-5 py-4">
                    <Link href={`/doctor/patients/${b.patientId}`} className="font-semibold text-slate-800 hover:text-brand-800">
                      {b.patientName}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {b.patientRegistrationId ?? "—"} · {b.patientPhone ?? "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-700">{b.vendorName ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{b.vendorEmail ?? ""}</p>
                  </td>
                  <td className="max-w-[220px] px-5 py-4">
                    <p className="font-medium text-slate-700">{formatDateTime(b.bookingDate)}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {testList.map((t) => t.name).join(", ") || (b.notes ?? "")}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{formatINR(b.totalAmount)}</p>
                    <p className="mt-0.5 text-xs capitalize text-slate-400">
                      {b.paymentMethod ?? "—"} · paid {formatINR(b.paymentAmount)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-4">
                    {b.uploadedFilePath ? (
                      <Link
                        href={`/api/doctor/test-bookings/${b.id}/report`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent-200 px-2.5 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-50"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View report
                      </Link>
                    ) : token ? (
                      <button
                        type="button"
                        onClick={() => copyLink(token)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-700" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy link"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <select
                        value={b.status ?? "pending"}
                        disabled={busyId === b.id}
                        onChange={(e) => run(b.id, () => updateTestBookingStatus(b.id, e.target.value))}
                        className="input !w-auto !py-1.5 !text-xs"
                      >
                        {(TRANSITIONS[b.status ?? "pending"] ?? STATUSES).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        title="Edit booking"
                        onClick={() => setEditing(b)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Regenerate upload link"
                        onClick={() => run(b.id, () => regenerateUploadLink(b.id))}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete booking"
                        onClick={() => {
                          if (confirm(`Delete test booking for ${b.patientName}?`)) {
                            run(b.id, () => deleteTestBooking(b.id));
                          }
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

      {editing && <BookingForm vendors={vendors} tests={tests} booking={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}