import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-700 font-display text-2xl font-extrabold text-white shadow-lg shadow-brand-700/20">
            S
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-ink">Forgot your password?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand-800 hover:text-brand-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
