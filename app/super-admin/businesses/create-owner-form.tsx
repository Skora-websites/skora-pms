"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { createBusinessOwner } from "./actions";

/**
 * Onboard a business + owner + first clinic in one form.
 *
 * The `admin` tier had no creation surface anywhere in the app, so this is the
 * missing top of the role hierarchy — kept behind the super-admin shell rather
 * than public signup.
 */
export function CreateOwnerForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        setDone(false);
        startTransition(async () => {
          const res = await createBusinessOwner({ error: null }, formData);
          setError(res.error);
          setDone(res.error === null);
        });
      }}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-ink">Onboard a business owner</h2>
      </div>
      <p className="text-xs text-slate-500">
        Creates the owner account, the business, and its first clinic. The owner signs in with this
        email and password, then manages their own managers, staff and clinics from{" "}
        <code className="text-[11px]">/admin</code>.
      </p>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Owner account
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Full name</span>
            <input name="owner_name" className="input mt-1" required />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Email</span>
            <input name="owner_email" type="email" className="input mt-1" required />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Phone</span>
            <input name="owner_phone" className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Temporary password (min 8 chars)
            </span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              className="input mt-1"
              required
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Business
        </legend>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Business name</span>
          <input name="business_name" className="input mt-1" required />
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          First clinic
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Clinic name</span>
            <input name="clinic_name" className="input mt-1" required />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Phone</span>
            <input name="clinic_phone" className="input mt-1" required />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Address</span>
          <input name="clinic_address" className="input mt-1" required />
        </label>
      </fieldset>

      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="text-xs font-medium text-emerald-600" role="status">
          Business owner created.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create business owner"}
      </button>
    </form>
  );
}
