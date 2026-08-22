"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { UserPlus, Stethoscope, User } from "lucide-react";
import { signupAction } from "./actions";
import { sendSignupOtp } from "./otp-actions";

const initialState = { error: null as string | null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [otpSending, startOtpSend] = useTransition();
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  function handleSendOtp() {
    const phone = (document.getElementById("phone") as HTMLInputElement | null)?.value ?? "";
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value ?? "";
    if (phone.replace(/[^0-9]/g, "").length < 10) {
      setOtpMessage("Enter a valid phone number first.");
      return;
    }
    setOtpMessage(null);
    startOtpSend(async () => {
      const fd = new FormData();
      fd.set("phone", phone);
      fd.set("email", email);
      const res = await sendSignupOtp(initialState, fd);
      if (res.error) setOtpMessage(res.error);
      else {
        setOtpSent(true);
        setOtpMessage(
          res.devOtp
            ? `OTP sent! (Dev mode — your OTP is ${res.devOtp})`
            : "OTP sent! Check your email."
        );
      }
    });
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className="label">I am a</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("patient")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
              role === "patient"
                ? "border-accent-500 bg-accent-50 text-accent-800"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <User className="h-4 w-4" />
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole("doctor")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
              role === "doctor"
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Doctor / Clinic
          </button>
        </div>
        <input type="hidden" name="role" value={role} />
        {role === "doctor" && (
          <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            Doctor accounts start with a free trial — no credit card required.
          </p>
        )}
      </div>
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

      {/* OTP verification */}
      <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
        <label className="label">Phone verification</label>
        <div className="flex gap-2">
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit OTP"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpSending || otpSent}
            className="btn-secondary shrink-0 !py-2.5 text-xs disabled:opacity-50"
          >
            {otpSending ? "Sending…" : otpSent ? "OTP sent ✓" : "Send OTP"}
          </button>
        </div>
        {otpMessage && <p className="mt-2 text-xs text-brand-800">{otpMessage}</p>}
        <p className="mt-1 text-xs text-slate-400">
          We&apos;ll send a 6-digit code to verify your phone number.
        </p>
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
