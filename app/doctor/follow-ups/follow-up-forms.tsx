"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CalendarPlus, CheckCircle2, XCircle, CalendarClock, MessageSquarePlus, Loader2 } from "lucide-react";
import {
  createFollowUpReminder,
  updateFollowUpDetail,
  updateReminderStatus,
  type FollowUpActionResult,
} from "./actions";
import { QuickContactActions } from "@/components/ui/dashboard-ui";
import { todayStr } from "@/lib/utils";

const initialState: FollowUpActionResult = { error: null };

type PatientOption = { id: number; name: string; phone: string | null };

/** "New follow-up" dialog form — schedules a reminder for an existing patient. */
export function NewFollowUpForm({ patients }: { patients: PatientOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createFollowUpReminder, initialState);
  const awaitingClose = useRef(false);
  const today = todayStr();

  // Close the dialog after a successful server-action round-trip (pending
  // flips false and no error came back). Errors keep the form open.
  useEffect(() => {
    if (awaitingClose.current && !pending && state.error === null) {
      awaitingClose.current = false;
      setOpen(false);
    }
  }, [pending, state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        <CalendarPlus className="h-4 w-4" />
        New follow-up
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">New follow-up</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
                aria-label="Close"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Schedule a follow-up call or visit reminder for a registered patient.
            </p>
            <form
              action={formAction}
              onSubmit={() => { awaitingClose.current = true; }}
              className="mt-5 space-y-4"
            >
              <div>
                <label htmlFor="fu_patient" className="label">Patient</label>
                <select id="fu_patient" name="patient_id" required className="input" defaultValue="">
                  <option value="" disabled>Select a patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.phone ? ` · ${p.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fu_date" className="label">Follow-up date</label>
                <input
                  id="fu_date"
                  name="follow_up_date"
                  type="date"
                  required
                  min={today}
                  defaultValue={today}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="fu_note" className="label">Note (optional)</label>
                <textarea
                  id="fu_note"
                  name="note"
                  rows={3}
                  className="input resize-none"
                  placeholder="e.g. Check dressing, review reports…"
                />
              </div>
              {state.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
              )}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                  {pending ? "Saving…" : "Schedule follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ActionError({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <p className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
      {error}
      <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="shrink-0 font-semibold">✕</button>
    </p>
  );
}

/** Status-flow actions for a consultation follow-up: comment, reschedule, resolve. */
export function FollowUpFlowActions({
  consultationId,
  status,
  patientPhone,
}: {
  consultationId: number;
  status: string;
  patientPhone?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [nextDate, setNextDate] = useState(todayStr());

  const run = (fn: () => Promise<FollowUpActionResult>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else {
        setShowComment(false);
        setShowReschedule(false);
      }
    });
  };

  if (status !== "pending" && status !== "rescheduled") {
    // Terminal states show nothing actionable (badge already communicates it).
    return null;
  }

  return (
    <div className="inline-flex flex-col items-stretch">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {patientPhone && <QuickContactActions phone={patientPhone} size="xs" />}
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => updateFollowUpDetail(consultationId, { status: "addressed" }))}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3.5 py-1.5 text-xs font-semibold text-accent-800 transition-colors hover:bg-accent-200 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mark addressed
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => { setShowComment((v) => !v); setShowReschedule(false); }}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-800"
          title="Add a follow-up note"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Note
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => { setShowReschedule((v) => !v); setShowComment(false); }}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-800"
          title="Reschedule to a new date"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Reschedule
        </button>
      </div>
      {showComment && (
        <div className="mt-2 flex items-end gap-1.5">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Follow-up note (e.g. patient confirmed)…"
            className="input !py-1.5 !text-xs"
            autoFocus
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => updateFollowUpDetail(consultationId, { comment }))}
            className="btn-primary shrink-0 !px-3 !py-1.5 !text-xs"
          >
            Save
          </button>
        </div>
      )}
      {showReschedule && (
        <div className="mt-2 flex items-end gap-1.5">
          <input
            type="date"
            value={nextDate}
            min={todayStr()}
            onChange={(e) => setNextDate(e.target.value)}
            className="input !w-auto !py-1.5 !text-xs"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => updateFollowUpDetail(consultationId, { followUpDate: nextDate }))}
            className="btn-primary shrink-0 !px-3 !py-1.5 !text-xs"
          >
            Reschedule
          </button>
        </div>
      )}
      {error && <ActionError error={error} onDismiss={() => setError(null)} />}
    </div>
  );
}

/** Reminder status actions: mark addressed / cancel. */
export function ReminderActions({
  reminderId,
  status,
}: {
  reminderId: number;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status !== "pending") return null;

  return (
    <div className="inline-flex flex-col items-end">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await updateReminderStatus(reminderId, "addressed");
              if (res.error) setError(res.error);
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3.5 py-1.5 text-xs font-semibold text-accent-800 transition-colors hover:bg-accent-200 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Done
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await updateReminderStatus(reminderId, "cancelled");
              if (res.error) setError(res.error);
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-600"
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
      {error && <ActionError error={error} onDismiss={() => setError(null)} />}
    </div>
  );
}
