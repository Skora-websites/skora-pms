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
              Welcome back to your
              <br />
              clinic&apos;s command center.
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Appointments, prescriptions, billing, staff and follow-ups — all in one secure
              dashboard built for healthcare professionals.
            </p>
          </div>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} SkoraCares · Trusted by 2,000+ providers
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
          <h2 className="font-display text-3xl font-extrabold text-ink">Sign in</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Use your clinic account to access the dashboard.
          </p>
          <LoginForm />
          <p className="mt-8 text-center text-sm text-ink-muted">
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
