"use client";

import { useActionState } from "react";
import { LifeBuoy } from "lucide-react";
import { createSupportTicket } from "../actions";

const initialState = { error: null as string | null };

export function NewTicketForm() {
  const [state, formAction, pending] = useActionState(createSupportTicket, initialState);

  return (
    <div className="card h-fit p-7">
      <h2 className="font-display text-base font-bold text-slate-900">Open a new ticket</h2>
      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="subject" className="label">Subject</label>
          <input id="subject" name="subject" required placeholder="Brief summary of the issue" className="input" />
        </div>
        <div>
          <label htmlFor="message" className="label">Message</label>
          <textarea id="message" name="message" rows={5} required placeholder="Describe the issue in detail…" className="input resize-none" />
        </div>
        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full !rounded-xl !py-3">
          <LifeBuoy className="h-4 w-4" />
          {pending ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </div>
  );
}
