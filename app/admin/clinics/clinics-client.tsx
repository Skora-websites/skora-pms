"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Power, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClinic, setClinicActive, updateClinic, type ClinicActionResult } from "./actions";

const initial: ClinicActionResult = { error: null };

type DoctorOption = { id: number; name: string };

/** Shared modal shell (matches app/doctor/staff/staff-form.tsx). */
function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function ClinicFields({ clinic }: { clinic?: ClinicCard | null }) {
  const [addressType, setAddressType] = useState<"manual" | "map">(clinic?.addressType ?? "manual");

  return (
    <>
      <div>
        <label htmlFor="clinic_name" className="label">Clinic name</label>
        <input
          id="clinic_name"
          name="clinic_name"
          required
          maxLength={255}
          defaultValue={clinic?.clinicName ?? ""}
          className="input"
          placeholder="e.g. SkoraCare Multispeciality"
        />
      </div>
      <div>
        <label htmlFor="address_type" className="label">Address type</label>
        <select
          id="address_type"
          name="address_type"
          className="input"
          value={addressType}
          onChange={(e) => setAddressType(e.target.value as "manual" | "map")}
        >
          <option value="manual">Manual address</option>
          <option value="map">Map (lat/lng)</option>
        </select>
      </div>
      {/* Address stays visible for map clinics too — an existing typed address
          must survive an edit; empty address on map type is synthesized from
          lat/lng server-side (doctor-module parity). */}
      <div>
        <label htmlFor="address" className="label">Address{addressType === "manual" ? "" : " (optional)"}</label>
        <textarea
          id="address"
          name="address"
          required={addressType === "manual"}
          rows={2}
          defaultValue={clinic?.address ?? ""}
          className="input"
          placeholder="Full clinic address"
        />
      </div>
      {addressType === "map" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="latitude" className="label">Latitude</label>
            <input id="latitude" name="latitude" required step="any" defaultValue={clinic?.latitude ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="longitude" className="label">Longitude</label>
            <input id="longitude" name="longitude" required step="any" defaultValue={clinic?.longitude ?? ""} className="input" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input id="phone" name="phone" required maxLength={20} defaultValue={clinic?.phone ?? ""} className="input" placeholder="+91…" />
        </div>
        <div>
          <label htmlFor="consultation_fee" className="label">Consultation fee (₹)</label>
          <input
            id="consultation_fee"
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
    </>
  );
}

export function AddClinicButton({ doctors }: { doctors: DoctorOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClinic, initial);
  const router = useRouter();

  useEffect(() => {
    if (state !== initial && state.error === null) {
      router.refresh();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Add clinic
      </button>
      {open && (
        <Modal
          title="Add clinic"
          subtitle="Set up a new location for your business. Schedules are managed per doctor on the Schedule page."
          onClose={close}
        >
          <form
            action={(fd) => {
              formAction(fd);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="doctor_id" className="label">Owning doctor</label>
              <select id="doctor_id" name="doctor_id" required className="input" defaultValue={doctors[0]?.id ?? ""}>
                <option value="" disabled>Select doctor…</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                The clinic is anchored to this doctor&apos;s account (every clinic has an owning doctor).
              </p>
              {doctors.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-700">No active doctors in your business yet.</p>
              )}
            </div>
            <ClinicFields />
            {state.error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={close} className="btn-ghost">Cancel</button>
              <button
                type="submit"
                disabled={pending || doctors.length === 0}
                className="btn-primary disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save clinic"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export type ClinicCard = {
  id: number;
  clinicName: string;
  addressType: "manual" | "map" | null;
  address: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  consultationFee: string | null;
  isActive: boolean;
};

export function ClinicCardActions({ clinic }: { clinic: ClinicCard }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [, action, pending] = useActionState(setClinicActive, initial);

  async function handleToggle() {
    if (!confirming && clinic.isActive) {
      // Two-step confirm only when deactivating (activation is safe).
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    const fd = new FormData();
    fd.set("id", String(clinic.id));
    fd.set("is_active", clinic.isActive ? "false" : "true");
    action(fd);
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Edit clinic"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className={`rounded-lg p-1.5 transition-colors disabled:opacity-60 ${
            confirming ? "bg-red-50 text-red-600" : clinic.isActive ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-accent-700 hover:bg-accent-50"
          }`}
          title={confirming ? "Click again to confirm" : clinic.isActive ? "Deactivate clinic" : "Activate clinic"}
        >
          <Power className="h-4 w-4" />
        </button>
      </div>

      {editing && (
        <Modal
          title={`Edit ${clinic.clinicName}`}
          subtitle="Update clinic details and consultation fee."
          onClose={() => setEditing(false)}
        >
          <EditClinicForm clinic={clinic} onDone={() => setEditing(false)} />
        </Modal>
      )}
    </>
  );
}

function EditClinicForm({ clinic, onDone }: { clinic: ClinicCard; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateClinic, initial);
  const router = useRouter();

  useEffect(() => {
    if (state !== initial && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={(fd) => {
        fd.set("id", String(clinic.id));
        formAction(fd);
      }}
      className="space-y-4"
    >
      <ClinicFields clinic={clinic} />
      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
