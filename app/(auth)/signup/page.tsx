import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create Account" };

export default function SignupPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-accent-800 lg:block">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="font-display text-2xl font-extrabold text-white">
            Skora<span className="text-accent-400">Cares</span>
          </Link>
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-white">
              Create your free account in minutes.
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              No credit card required. Doctor accounts start with a 14-day free trial.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/80">
              {[
                "Digital prescriptions & patient records",
                "Appointment scheduling & reminders",
                "Billing, ledgers & multi-clinic support",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-xs text-white">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} SkoraCares
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-surface px-5 py-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-600"
          >
            ← Back to home
          </Link>
          <h2 className="font-display text-3xl font-extrabold text-ink">Create your account</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Register as a patient to book appointments, or as a doctor to run your clinic.
          </p>
          <SignupForm />
          <p className="mt-8 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-800 hover:text-brand-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
