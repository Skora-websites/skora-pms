"use client";

import Link from "next/link";
import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { signupAction } from "./actions";

const initialState = { error: null as string | null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="name" className="label">
          Full name
        </label>
        <input id="name" name="name" required placeholder="Your full name" className="input" />
      </div>
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="input"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" required placeholder="98XXXXXXXX" className="input" />
        </div>
        <div>
          <label htmlFor="gender" className="label">
            Gender
          </label>
          <select id="gender" name="gender" className="input" defaultValue="">
            <option value="" disabled>
              Select
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
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
          minLength={8}
          placeholder="At least 8 characters"
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password_confirmation" className="label">
          Confirm password
        </label>
        <input
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          required
          placeholder="Repeat your password"
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
        {pending ? "Creating account…" : "Create account"}
        {!pending && <UserPlus className="h-4 w-4" />}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms-conditions" className="text-brand-800 underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-brand-800 underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
