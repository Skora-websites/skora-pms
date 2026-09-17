"use client";

import { useActionState, useState } from "react";
import { LogIn, ShieldAlert } from "lucide-react";
import { loginAction } from "./actions";

const initialState = { error: null as string | null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  // Dismissal state + the last error seen. When the server returns a NEW
  // error, re-arm the alert (adjusting state during render is the React-
  // documented way to react to changed props/state without effects). While
  // the user edits either field the alert hides — so it never looks like the
  // corrected attempt already failed.
  const [lastError, setLastError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  if (state.error !== lastError) {
    setLastError(state.error);
    setDismissed(false);
  }
  const visibleError = state.error && !dismissed ? state.error : null;

  return (
    <form action={formAction} className="mt-8 space-y-5">
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
          onInput={() => setDismissed(true)}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="input"
          onInput={() => setDismissed(true)}
        />
      </div>

      {visibleError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-red-800">Wrong login information</p>
            <p className="mt-0.5 text-sm text-red-700">{visibleError}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary group w-full !rounded-xl !py-3.5 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <LogIn className="h-4 w-4" />}
      </button>

      {process.env.NODE_ENV === "development" && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-800">
          <p className="font-semibold">Demo accounts</p>
          <p className="mt-1">doctor@gmail.com · patient@gmail.com · admin@gmail.com</p>
          <p>Password: Admin@123</p>
        </div>
      )}
    </form>
  );
}
