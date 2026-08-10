"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { bookDemo } from "./actions";

const initialState = { success: false, error: null as string | null };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(bookDemo, initialState);

  return (
    <div className="rounded-3xl border border-brand-900/10 bg-white p-8 shadow-soft" id="demo">
      <h2 className="font-display text-2xl font-extrabold text-ink">Book a free demo</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Tell us about your practice and we&apos;ll show you exactly how SkoraCares can help.
      </p>

      {state.success ? (
        <div className="mt-8 rounded-2xl border border-accent-500/30 bg-accent-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-accent-600" />
          <h3 className="mt-4 font-display text-lg font-bold text-ink">Request received!</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Our team will reach out within one business day to schedule your demo.
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" required placeholder="Dr. Ramesh Kumar" className="input" />
            </div>
            <div>
              <label htmlFor="email" className="label">Work email</label>
              <input id="email" name="email" type="email" required placeholder="you@clinic.com" className="input" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="label">Phone number</label>
              <input id="phone" name="phone" type="tel" required placeholder="+91 98XXXXXXXX" className="input" />
            </div>
            <div>
              <label htmlFor="clinic" className="label">Clinic / practice name</label>
              <input id="clinic" name="clinic" placeholder="Your Clinic" className="input" />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="label">How can we help?</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Tell us about your practice size, number of doctors, and what you're looking for…"
              className="input resize-none"
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
            {pending ? "Sending…" : "Request Demo"}
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      )}
    </div>
  );
}
