"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, MapPin, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClinic } from "./actions";

const initialState = { error: null as string | null };

export function AddClinicForm() {
  const [open, setOpen] = useState(false);
  const [addressType, setAddressType] = useState<"manual" | "map">("manual");
  const [logoName, setLogoName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(createClinic, initialState);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      const t = setTimeout(() => setOpen(false), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Add clinic
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold text-slate-900">Add clinic</h2>
            <p className="mt-1 text-sm text-slate-500">Set up a clinic to define weekly working hours and fees.</p>

            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label htmlFor="clinic_name" className="label">Clinic name</label>
                <input id="clinic_name" name="clinic_name" required maxLength={255} className="input" placeholder="e.g. SkoraCare Multispeciality" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="phone" className="label">Phone</label>
                  <input id="phone" name="phone" required maxLength={20} className="input" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label htmlFor="consultation_fee" className="label">Consultation fee (₹)</label>
                  <input id="consultation_fee" name="consultation_fee" required type="number" min="0" step="0.01" className="input" placeholder="500" />
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
                  <textarea id="address" name="address" required rows={2} className="input" placeholder="Full clinic address" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="latitude" className="label">Latitude</label>
                    <input id="latitude" name="latitude" required step="any" className="input" placeholder="28.6139" />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="label">Longitude</label>
                    <input id="longitude" name="longitude" required step="any" className="input" placeholder="77.2090" />
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
                  {logoName ?? "Choose an image (JPG, PNG, WEBP, GIF — max 2 MB)"}
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
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
                  {pending ? "Saving…" : "Save clinic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}