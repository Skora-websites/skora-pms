"use client";

import { useActionState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveCompanySettings } from "../actions";

const initialState = { error: null as string | null };

type CompanyRow = {
  companyName: string | null;
  companyShortName: string | null;
  companyTagline: string | null;
  companyDescription: string | null;
  lightLogo: string | null;
  darkLogo: string | null;
  favicon: string | null;
  companyEmail1: string | null;
  companyEmail2: string | null;
  companyMobile1: string | null;
  companyMobile2: string | null;
  companyWhatsapp1: string | null;
  companyWhatsapp2: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  pintrest: string | null;
  map: string | null;
  companyAddress1: string | null;
  companyAddress2: string | null;
  currencyName: string | null;
  currencySymbol: string | null;
  defaultTrialDays: number | null;
};

export function CompanySettingsForm({ company }: { company: CompanyRow | null }) {
  const [state, formAction, pending] = useActionState(saveCompanySettings, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const c = company;

  return (
    <form action={formAction} className="space-y-6">
      <div className="card p-7">
        <h2 className="font-display text-base font-bold text-slate-900">Company profile</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cs_name" className="label">Company name</label>
            <input id="cs_name" name="company_name" maxLength={255} defaultValue={c?.companyName ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_short" className="label">Short name</label>
            <input id="cs_short" name="company_short_name" maxLength={255} defaultValue={c?.companyShortName ?? ""} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cs_tagline" className="label">Tagline</label>
            <input id="cs_tagline" name="company_tagline" maxLength={255} defaultValue={c?.companyTagline ?? ""} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cs_desc" className="label">Description</label>
            <textarea id="cs_desc" name="company_description" rows={3} defaultValue={c?.companyDescription ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_email1" className="label">Primary email</label>
            <input id="cs_email1" name="company_email1" type="email" maxLength={255} defaultValue={c?.companyEmail1 ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_email2" className="label">Secondary email</label>
            <input id="cs_email2" name="company_email2" type="email" maxLength={255} defaultValue={c?.companyEmail2 ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_mob1" className="label">Primary mobile</label>
            <input id="cs_mob1" name="company_mobile1" maxLength={255} defaultValue={c?.companyMobile1 ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_mob2" className="label">Secondary mobile</label>
            <input id="cs_mob2" name="company_mobile2" maxLength={255} defaultValue={c?.companyMobile2 ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_wa1" className="label">WhatsApp 1</label>
            <input id="cs_wa1" name="company_whatsapp1" maxLength={255} defaultValue={c?.companyWhatsapp1 ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_wa2" className="label">WhatsApp 2</label>
            <input id="cs_wa2" name="company_whatsapp2" maxLength={255} defaultValue={c?.companyWhatsapp2 ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_addr1" className="label">Address line 1</label>
            <input id="cs_addr1" name="company_address1" maxLength={255} defaultValue={c?.companyAddress1 ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="cs_addr2" className="label">Address line 2</label>
            <input id="cs_addr2" name="company_address2" maxLength={255} defaultValue={c?.companyAddress2 ?? ""} className="input" />
          </div>
        </div>
      </div>

      <div className="card p-7">
        <h2 className="font-display text-base font-bold text-slate-900">Branding</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="cs_light" className="label">Light logo</label>
            <input id="cs_light" name="light_logo" type="file" accept="image/*" className="input" />
            {c?.lightLogo && <p className="mt-1 truncate text-xs text-slate-400">{c.lightLogo}</p>}
          </div>
          <div>
            <label htmlFor="cs_dark" className="label">Dark logo</label>
            <input id="cs_dark" name="dark_logo" type="file" accept="image/*" className="input" />
            {c?.darkLogo && <p className="mt-1 truncate text-xs text-slate-400">{c.darkLogo}</p>}
          </div>
          <div>
            <label htmlFor="cs_favicon" className="label">Favicon</label>
            <input id="cs_favicon" name="favicon" type="file" accept="image/*" className="input" />
            {c?.favicon && <p className="mt-1 truncate text-xs text-slate-400">{c.favicon}</p>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="cs_cur_name" className="label">Currency name</label>
            <input id="cs_cur_name" name="currency_name" maxLength={255} defaultValue={c?.currencyName ?? ""} className="input" placeholder="Indian Rupee" />
          </div>
          <div>
            <label htmlFor="cs_cur_sym" className="label">Currency symbol</label>
            <input id="cs_cur_sym" name="currency_symbol" maxLength={255} defaultValue={c?.currencySymbol ?? ""} className="input" placeholder="₹" />
          </div>
          <div>
            <label htmlFor="cs_trial" className="label">Default trial days (doctors)</label>
            <input id="cs_trial" name="default_trial_days" type="number" required min={1} max={365} defaultValue={c?.defaultTrialDays ?? 15} className="input" />
          </div>
        </div>
      </div>

      <div className="card p-7">
        <h2 className="font-display text-base font-bold text-slate-900">Social &amp; maps</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              ["facebook", "Facebook"],
              ["twitter", "Twitter / X"],
              ["linkedin", "LinkedIn"],
              ["instagram", "Instagram"],
              ["pintrest", "Pinterest"],
              ["map", "Map embed URL"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`cs_${key}`} className="label">{label}</label>
              <input id={`cs_${key}`} name={key} maxLength={255} defaultValue={(c as unknown as Record<string, string | null>)?.[key] ?? ""} className="input" />
            </div>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          <ShieldCheck className="h-4 w-4" />
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}