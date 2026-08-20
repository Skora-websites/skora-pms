"use client";

import { useActionState, useEffect, useState } from "react";
import { Building2, MapPin, Pencil, Phone, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteClinic, storeClinic, updateClinic } from "../actions";
import { StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatINR, formatDate } from "@/lib/utils";

const initialState = { error: null as string | null };

type ClinicRow = {
  id: number;
  clinicName: string;
  address: string | null;
  phone: string | null;
  consultationFee: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  doctorName: string;
  doctorId: number;
  clinicLogo: string | null;
};

type DoctorOption = { id: number; name: string };

function ClinicForm({
  clinic,
  doctors,
  onDone,
}: {
  clinic?: ClinicRow | null;
  doctors: DoctorOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(clinic ? updateClinic : storeClinic, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {clinic ? `Edit clinic: ${clinic.clinicName}` : "Create clinic"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Add or update a clinic location for any doctor.</p>
          </div>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          {clinic && <input type="hidden" name="id" value={clinic.id} />}
          <div>
            <label htmlFor="clinic_doctor" className="label">Owning doctor</label>
            <select id="clinic_doctor" name="doctor_id" required defaultValue={clinic?.doctorId ?? ""} className="input">
              <option value="" disabled>Select a doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="clinic_name" className="label">Clinic name</label>
            <input id="clinic_name" name="clinic_name" required maxLength={255} defaultValue={clinic?.clinicName ?? ""} className="input" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="clinic_phone" className="label">Phone</label>
              <input id="clinic_phone" name="phone" required maxLength={20} defaultValue={clinic?.phone ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="clinic_fee" className="label">Consultation fee (₹)</label>
              <input
                id="clinic_fee"
                name="consultation_fee"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={clinic?.consultationFee ?? ""}
                className="input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="clinic_address" className="label">Address</label>
            <textarea id="clinic_address" name="address" required rows={2} defaultValue={clinic?.address ?? ""} className="input" />
            <input type="hidden" name="address_type" value="manual" />
          </div>
          <div>
            <label htmlFor="clinic_logo" className="label">Logo (optional, under 2 MB)</label>
            <input id="clinic_logo" name="clinic_logo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
            {clinic?.clinicLogo && (
              <p className="mt-1 text-xs text-slate-400">Existing logo will be replaced when a new file is chosen.</p>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              value="1"
              defaultChecked={clinic ? (clinic.isActive ?? true) : true}
              className="h-4 w-4 rounded border-slate-300 accent-brand-700"
            />
            Clinic is active (accepts appointments)
          </label>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : clinic ? "Save clinic" : "Create clinic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClinicsPanel({
  clinics,
  doctors,
}: {
  clinics: ClinicRow[];
  doctors: DoctorOption[];
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ClinicRow | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClinicRow | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function handleDelete(clinic: ClinicRow) {
    if (confirmDelete?.id !== clinic.id) {
      setConfirmDelete(clinic);
      return;
    }
    setDeleting(clinic.id);
    setMsg(null);
    const res = await deleteClinic(clinic.id);
    setDeleting(null);
    setConfirmDelete(null);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: `Clinic "${clinic.clinicName}" deleted.` });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New clinic
        </button>
      </div>

      {msg && (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            msg.type === "ok" ? "border-accent-200 bg-accent-50 text-accent-800" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      {clinics.length === 0 ? (
        <EmptyState icon={Building2} title="No clinics yet" description="Clinics created by doctors appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clinics.map((c) => (
            <div key={c.id} className="card card-hover overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-brand-800 to-accent-700 p-4">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <StatusBadge status={c.isActive ? "active" : "inactive"} />
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-base font-bold text-slate-900">{c.clinicName}</h3>
                <p className="mt-1 text-sm text-slate-500">Owned by {c.doctorName}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
                    {c.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0 text-brand-700" /> {c.phone}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="font-semibold text-brand-800">{formatINR(c.consultationFee)} / visit</span>
                  <span>Since {formatDate(c.createdAt)}</span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={deleting === c.id}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      confirmDelete?.id === c.id
                        ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
                        : "border-red-200 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete?.id === c.id ? "Click again to confirm" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <ClinicForm doctors={doctors} onDone={() => setCreating(false)} />}
      {editing && <ClinicForm clinic={editing} doctors={doctors} onDone={() => setEditing(null)} />}
    </div>
  );
}