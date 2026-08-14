"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UploadCloud } from "lucide-react";
import { updatePatient } from "../../actions";
import { GENDERS } from "@/lib/constants";

const initialState = { error: null as string | null };

export type PatientFormData = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dob: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: number | null;
  streetAddress: string | null;
  salutation: string | null;
  aadhaarNo: string | null;
  referredBy: string | null;
  profilePhotoPath: string | null;
};

export function EditPatientForm({ patient }: { patient: PatientFormData }) {
  const [state, formAction, pending] = useActionState(updatePatient, initialState);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  return (
    <div className="card p-7">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="patient_id" value={patient.id} />

        {/* Row: Salutation + Name */}
        <div className="grid grid-cols-[9rem_1fr] gap-4">
          <div>
            <label htmlFor="salutation" className="label">Salutation</label>
            <select id="salutation" name="salutation" className="input" defaultValue={patient.salutation ?? ""}>
              <option value="">— Select —</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>
          <div>
            <label htmlFor="name" className="label">Full name <span className="text-red-500">*</span></label>
            <input id="name" name="name" type="text" required defaultValue={patient.name} className="input" />
          </div>
        </div>

        {/* Row: Gender + DOB */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="gender" className="label">Gender <span className="text-red-500">*</span></label>
            <select id="gender" name="gender" required className="input" defaultValue={patient.gender ?? "Male"}>
              <option value="" disabled>Select gender...</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dob" className="label">Date of birth</label>
            <input id="dob" name="dob" type="date" defaultValue={patient.dob ?? ""} className="input" />
          </div>
        </div>

        {/* Row: Phone + Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="label">Phone <span className="text-red-500">*</span></label>
            <input id="phone" name="phone" type="tel" required defaultValue={patient.phone ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" defaultValue={patient.email ?? ""} className="input" />
          </div>
        </div>

        {/* Aadhaar */}
        <div>
          <label htmlFor="aadhaar_no" className="label">Aadhaar number</label>
          <input id="aadhaar_no" name="aadhaar_no" type="text" defaultValue={patient.aadhaarNo ?? ""} className="input" maxLength={12} />
        </div>

        {/* Address fields */}
        <div>
          <label htmlFor="address" className="label">Address</label>
          <input id="address" name="address" type="text" defaultValue={patient.address ?? ""} className="input" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="label">City</label>
            <input id="city" name="city" type="text" defaultValue={patient.city ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="state" className="label">State</label>
            <input id="state" name="state" type="text" defaultValue={patient.state ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="pincode" className="label">Pincode</label>
            <input id="pincode" name="pincode" type="text" defaultValue={patient.pincode ? String(patient.pincode) : ""} className="input" maxLength={6} />
          </div>
        </div>

        {/* Referred by */}
        <div>
          <label htmlFor="referred_by" className="label">Referred by</label>
          <input id="referred_by" name="referred_by" type="text" defaultValue={patient.referredBy ?? ""} className="input" />
        </div>

        {/* Photo replace */}
        <div>
          <label className="label">Profile photo</label>
          {patient.profilePhotoPath ? (
            <div className="mb-3 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/doctor/patients/${patient.id}/photo`}
                alt={patient.name}
                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
              />
              <p className="text-xs text-slate-400">Current photo. Upload a new one to replace it.</p>
            </div>
          ) : null}
          <label
            htmlFor="photo-input"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <UploadCloud className="h-6 w-6 text-brand-600" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {photoName ?? "Upload a new photo (JPG, PNG or WEBP, max 2 MB)"}
            </p>
            <input
              ref={photoRef}
              id="photo-input"
              name="profile_photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
        </div>

        {/* Error */}
        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-primary !rounded-xl !py-3">
            <Save className="h-4 w-4" />
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}