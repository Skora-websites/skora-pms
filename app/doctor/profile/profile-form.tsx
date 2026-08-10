"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { updateProfileAction } from "./actions";

export function ProfileForm() {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const res = await updateProfileAction(formData);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  };

  return (
    <div className="card p-7">
      <h2 className="font-display text-base font-bold text-slate-900">Update details & password</h2>
      <form action={onSubmit} className="mt-5 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" name="name" className="input" required />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <input id="phone" name="phone" className="input" />
          </div>
        </div>
        <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="current_password" className="label">Current password</label>
            <input id="current_password" name="current_password" type="password" className="input" placeholder="Required to change password" />
          </div>
          <div>
            <label htmlFor="new_password" className="label">New password</label>
            <input id="new_password" name="new_password" type="password" minLength={8} className="input" placeholder="At least 8 characters" />
          </div>
        </div>
        {saved && (
          <p className="flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
            <CheckCircle2 className="h-4 w-4" /> Profile updated successfully.
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        <button type="submit" disabled={pending} className="btn-primary">
          <Save className="h-4 w-4" />
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
