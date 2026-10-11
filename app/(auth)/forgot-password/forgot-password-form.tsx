"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { requestPasswordReset } from "./actions";

const initialState = { error: null as string | null, sent: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-brand-900/5">
      {state.sent ? (
        <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          {state.error ?? "If an account exists for that email, a password-reset link has been sent. It expires in 60 minutes."}
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          <div>
            <label htmlFor="email" className="label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@clinic.com"
              className="input"
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
            {pending ? "Sending…" : "Send reset link"}
            {!pending && <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
    </div>
  );
}
