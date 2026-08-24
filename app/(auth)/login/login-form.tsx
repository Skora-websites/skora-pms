"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "./actions";

const initialState = { error: null as string | null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

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
        />
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
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
