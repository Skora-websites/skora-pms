import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
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
              Clinic management,
              <br />
              in one place.
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Appointments, prescriptions, billing, staff and follow-ups in a single dashboard.
            </p>
          </div>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} SkoraCares
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-surface px-5 py-10 lg:py-16">
        <div className="w-full max-w-md">
          {/* Mobile app-style brand header */}
          <div className="mb-8 text-center lg:mb-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-700 to-accent-600 font-display text-2xl font-extrabold text-white shadow-lg shadow-brand-700/20">
              S
            </span>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-ink lg:text-3xl">SkoraCares</h2>
            <p className="mt-1 text-sm text-ink-muted">Sign in to your clinic workspace</p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-brand-800 hover:text-brand-600">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
