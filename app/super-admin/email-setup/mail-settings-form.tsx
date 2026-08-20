"use client";

import { useActionState, useEffect } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveMailSettings } from "../actions";

const initialState = { error: null as string | null };

export function MailSettingsForm({
  mail,
  defaults,
}: {
  mail?: {
    host: string | null;
    port: number | null;
    username: string | null;
    encryption: string | null;
    fromAddress: string | null;
    fromName: string | null;
  } | null;
  defaults: { fromAddress: string | null; fromName: string | null };
}) {
  const [state, formAction, pending] = useActionState(saveMailSettings, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="card p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
          <Save className="h-5 w-5" />
        </span>
        <h2 className="font-display text-base font-bold text-slate-900">SMTP settings</h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mail_host" className="label">SMTP host</label>
          <input id="mail_host" name="host" required maxLength={255} defaultValue={mail?.host ?? ""} className="input" placeholder="smtp.example.com" />
        </div>
        <div>
          <label htmlFor="mail_port" className="label">Port</label>
          <input id="mail_port" name="port" type="number" required min={1} max={65535} defaultValue={mail?.port ?? 587} className="input" />
        </div>
        <div>
          <label htmlFor="mail_user" className="label">Username</label>
          <input id="mail_user" name="username" maxLength={255} defaultValue={mail?.username ?? ""} className="input" />
        </div>
        <div>
          <label htmlFor="mail_encryption" className="label">Encryption</label>
          <select id="mail_encryption" name="encryption" defaultValue={mail?.encryption ?? "tls"} className="input">
            <option value="">None</option>
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="mail_password" className="label">Password (leave blank to keep the current one)</label>
          <input id="mail_password" name="password" type="password" className="input" placeholder="••••••••" />
          <p className="mt-1 text-xs text-slate-400">Stored encrypted at rest and never displayed again.</p>
        </div>
        <div>
          <label htmlFor="mail_from" className="label">From address</label>
          <input id="mail_from" name="from_address" type="email" maxLength={255} defaultValue={mail?.fromAddress ?? defaults.fromAddress ?? ""} className="input" />
        </div>
        <div>
          <label htmlFor="mail_from_name" className="label">From name</label>
          <input id="mail_from_name" name="from_name" maxLength={255} defaultValue={mail?.fromName ?? defaults.fromName ?? ""} className="input" />
        </div>
      </div>

      {state.error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          <ShieldCheck className="h-4 w-4" />
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}