"use client";

import { useActionState, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateBusiness, type SettingsActionResult } from "./actions";

const initial: SettingsActionResult = { error: null };

export type BusinessProfile = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
};

export function BusinessSettingsForm({ business }: { business: BusinessProfile }) {
  const [state, formAction, pending] = useActionState(updateBusiness, initial);
  const router = useRouter();
  const [name, setName] = useState(business.name);
  const [slug, setSlug] = useState(business.slug);

  // Close the success state by refreshing server data after a clean save.
  useEffect(() => {
    if (state !== initial && state.error === null) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={(fd) => { fd.set("id", String(business.id)); formAction(fd); }} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Business name</label>
          <input
            id="name"
            name="name"
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="slug" className="label">Slug (unique identifier)</label>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="input"
            placeholder="auto-generated from name if left empty"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and single dashes"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Leave empty to regenerate from the business name.
          </p>
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={business.email ?? ""}
            className="input"
            placeholder="ops@yourbusiness.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input
            id="phone"
            name="phone"
            defaultValue={business.phone ?? ""}
            className="input"
            placeholder="+91…"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="label">Address</label>
          <textarea
            id="address"
            name="address"
            rows={2}
            defaultValue={business.address ?? ""}
            className="input"
            placeholder="Registered business address"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={business.isActive}
              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
            />
            Business is active
          </label>
          <p className="mt-1 text-xs text-slate-400">
            An inactive business drops out of your dashboard scope. Your only business cannot be deactivated.
          </p>
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}
      {state.error === null && state !== initial && (
        <p className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          Business settings saved.
        </p>
      )}

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          <Save className="h-4 w-4" />
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
