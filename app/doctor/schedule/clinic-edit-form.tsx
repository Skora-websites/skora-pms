"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MapPin, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateClinic } from "./actions";

const initialState = { error: null as string | null };

type Clinic = {
  id: number;
  clinicName: string;
  addressType: "manual" | "map" | null;
  address: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  consultationFee: string | null;
  clinicLogo: string | null;
};

export function ClinicEditForm({ clinic, onClose }: { clinic: Clinic; onClose: () => void }) {
  const [addressType, setAddressType] = useState<"manual" | "map">(clinic.addressType ?? "manual");
  const [logoName, setLogoName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(updateClinic, initialState);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Edit clinic</h2>
            <p className="mt-1 text-sm text-slate-500">Update clinic details and consultation fee.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={(fd) => {
            fd.set("id", String(clinic.id));
            formAction(fd);
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label htmlFor="clinic_name" className="label">Clinic name</label>
            <input id="clinic_name" name="clinic_name" required maxLength={255} defaultValue={clinic.clinicName} className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" name="phone" required maxLength={20} defaultValue={clinic.phone} className="input" />
            </div>
            <div>
              <label htmlFor="consultation_fee" className="label">Consultation fee (₹)</label>
              <input
                id="consultation_fee"
                name="consultation_fee"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={clinic.consultationFee ?? "0"}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Address type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddressType("manual")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  addressType === "manual" ? "border-brand-300 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-500"
                }`}
              >
                Manual address
              </button>
              <button
                type="button"
                onClick={() => setAddressType("map")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  addressType === "map" ? "border-brand-300 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-500"
                }`}
              >
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Map location
              </button>
            </div>
            <input type="hidden" name="address_type" value={addressType} />
          </div>

          {addressType === "manual" ? (
            <div>
              <label htmlFor="address" className="label">Address</label>
              <textarea id="address" name="address" required rows={2} defaultValue={clinic.address} className="input" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="latitude" className="label">Latitude</label>
                <input id="latitude" name="latitude" required step="any" defaultValue={clinic.latitude ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor="longitude" className="label">Longitude</label>
                <input id="longitude" name="longitude" required step="any" defaultValue={clinic.longitude ?? ""} className="input" />
              </div>
            </div>
          )}

          <div>
            <label className="label">Clinic logo (optional)</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <Upload className="h-4 w-4" />
              {logoName ?? "Choose a new image (max 2 MB)"}
            </button>
            <input
              ref={fileRef}
              id="clinic_logo"
              name="clinic_logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => setLogoName(e.target.files?.[0]?.name ?? null)}
            />
          </div>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}