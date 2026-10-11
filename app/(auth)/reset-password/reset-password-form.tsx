"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { resetPassword } from "./actions";

const initialState = { error: null as string | null, ok: false };

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-brand-900/5">
        <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          Your password has been updated. All existing sessions were signed out — you can sign in with the new password now.
        </div>
      </div>
    );
  }

  if (!email || !token) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-brand-900/5">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          This reset link is incomplete. Open the link from your email, or request a new one.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-brand-900/5">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="password" className="label">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            placeholder="Min 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            className="input"
            placeholder="Repeat the new password"
          />
        </div>

        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full !rounded-xl !py-3.5 disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update password"}
          {!pending && <KeyRound className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
