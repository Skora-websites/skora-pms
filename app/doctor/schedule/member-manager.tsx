"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Clock,
  GraduationCap,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import { initials } from "@/lib/utils";
import {
  addClinicDoctor,
  removeClinicDoctor,
  updateClinicDoctorProfile,
  type ScheduleActionResult,
} from "./actions";

type MemberSchedule = {
  id: number;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  sessionType: string;
  is24Hours: boolean | null;
};

type Member = {
  id: number;
  name: string;
  salutation: string | null;
  qualification: string | null;
  specialization: string | null;
  registrationNumber: string | null;
  phone: string | null;
  email: string | null;
  profilePhotoPath: string | null;
  schedules: MemberSchedule[];
};

const initialState: ScheduleActionResult = { error: null };

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/** Owner/receptionist: manage which doctors practice here + their profiles. */
export function MemberManager({
  clinicId,
  members,
}: {
  clinicId: number;
  members: Member[];
}) {
  const [addState, addAction, addPending] = useActionState(addClinicDoctor, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeClinicDoctor, initialState);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const error = addState.error ?? removeState.error;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700">Doctors at this clinic</h3>
      <p className="mt-0.5 text-xs text-slate-400">
        Added doctors can set their own OPD hours here and receive appointments booked for them.
      </p>

      <ul className="mt-3 space-y-2">
        {members.map((m) => {
          const expanded = expandedId === m.id;
          return (
            <li key={m.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                  {m.profilePhotoPath ? (
                    <Image
                      src={`/api/doctor/profile/photo?user_id=${m.id}`}
                      alt=""
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    initials(m.name)
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={expanded}
                >
                  <span className="block truncate text-sm font-medium text-slate-700">
                    {m.salutation ? `${m.salutation} ` : ""}
                    {m.name}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {[m.specialization, m.qualification].filter(Boolean).join(" · ") || "No profile details yet"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                  aria-label={expanded ? `Hide ${m.name}'s profile` : `Show ${m.name}'s profile`}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                <form action={removeAction}>
                  <input type="hidden" name="clinic_id" value={clinicId} />
                  <input type="hidden" name="doctor_id" value={m.id} />
                  <button
                    type="submit"
                    disabled={removePending}
                    aria-label={`Remove ${m.name}`}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {expanded && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ProfileRow icon={Stethoscope} label="Specialization" value={m.specialization} />
                    <ProfileRow icon={GraduationCap} label="Qualification" value={m.qualification} />
                    <ProfileRow icon={IdCard} label="Registration no." value={m.registrationNumber} />
                    <ProfileRow icon={Phone} label="Phone" value={m.phone} />
                    <ProfileRow icon={Mail} label="Email" value={m.email} />
                  </div>

                  <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-brand-700" /> OPD timings at this clinic
                  </p>
                  {m.schedules.length === 0 ? (
                    <p className="mt-1.5 text-xs text-slate-400">
                      No OPD hours set yet — the doctor sets these from their own schedule page.
                    </p>
                  ) : (
                    <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                      {DAYS.map((day) => {
                        const slots = m.schedules.filter((s) => s.dayOfWeek === day);
                        if (slots.length === 0) return null;
                        return (
                          <div key={day} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
                            <p className="text-[11px] font-bold capitalize text-slate-500">{day}</p>
                            {slots.map((s) => (
                              <p key={s.id} className="mt-0.5 text-xs text-slate-600">
                                {s.is24Hours
                                  ? "24 hours"
                                  : s.startTime && s.endTime
                                    ? `${s.startTime} – ${s.endTime}`
                                    : "—"}{" "}
                                <span className="text-slate-400">({s.sessionType.replace(/_/g, " ")})</span>
                              </p>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <MemberProfileEditor clinicId={clinicId} member={m} />
                </div>
              )}
            </li>
          );
        })}
        {members.length === 0 && <li className="text-xs text-slate-400">No doctors added yet.</li>}
      </ul>

      {addOpen ? (
        <form action={addAction} className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <input type="hidden" name="clinic_id" value={clinicId} />
          <p className="text-xs font-semibold text-slate-600">Add a doctor</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            New email → creates a doctor account. Existing doctor email → links them to this clinic.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="doctor_name" className="label">Full name *</label>
              <input id="doctor_name" name="doctor_name" required maxLength={255} className="input !py-2 text-sm" placeholder="e.g. Anil Mehta" />
            </div>
            <div>
              <label htmlFor="doctor_email" className="label">Email *</label>
              <input id="doctor_email" name="doctor_email" type="email" required className="input !py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="doctor_phone" className="label">Phone</label>
              <input id="doctor_phone" name="doctor_phone" maxLength={20} className="input !py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="doctor_specialization" className="label">Specialization</label>
              <input id="doctor_specialization" name="doctor_specialization" maxLength={255} className="input !py-2 text-sm" placeholder="e.g. Cardiologist" />
            </div>
            <div>
              <label htmlFor="doctor_qualification" className="label">Qualification</label>
              <input id="doctor_qualification" name="doctor_qualification" maxLength={255} className="input !py-2 text-sm" placeholder="e.g. MBBS, MD" />
            </div>
            <div>
              <label htmlFor="doctor_registration" className="label">Registration no.</label>
              <input id="doctor_registration" name="doctor_registration" maxLength={255} className="input !py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="doctor_password" className="label">Initial password (new accounts only)</label>
              <input
                id="doctor_password"
                name="doctor_password"
                type="password"
                minLength={8}
                className="input !py-2 text-sm"
                placeholder="At least 8 characters — ignored when the email already exists"
              />
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" disabled={addPending} className="btn-primary !px-3 !py-1.5 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              {addPending ? "Adding…" : "Add doctor"}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add doctor
        </button>
      )}

      {!addOpen && error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
      <Icon className="h-3.5 w-3.5 shrink-0 text-brand-700" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-xs font-medium text-slate-700">{value || "—"}</p>
      </div>
    </div>
  );
}

/** Inline editor for the member doctor's profile details. */
function MemberProfileEditor({ clinicId, member }: { clinicId: number; member: Member }) {
  const [state, action, pending] = useActionState(updateClinicDoctorProfile, initialState);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Pencil className="h-3 w-3" /> Edit profile
      </button>
    );
  }

  return (
    <form action={action} className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
      <input type="hidden" name="clinic_id" value={clinicId} />
      <input type="hidden" name="doctor_id" value={member.id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`spec-${member.id}`} className="label">Specialization</label>
          <input
            id={`spec-${member.id}`}
            name="specialization"
            defaultValue={member.specialization ?? ""}
            maxLength={255}
            className="input !py-2 text-sm"
            placeholder="e.g. Cardiologist"
          />
        </div>
        <div>
          <label htmlFor={`qual-${member.id}`} className="label">Qualification</label>
          <input
            id={`qual-${member.id}`}
            name="qualification"
            defaultValue={member.qualification ?? ""}
            maxLength={255}
            className="input !py-2 text-sm"
            placeholder="e.g. MBBS, MD"
          />
        </div>
        <div>
          <label htmlFor={`phone-${member.id}`} className="label">Phone</label>
          <input
            id={`phone-${member.id}`}
            name="phone"
            defaultValue={member.phone ?? ""}
            maxLength={20}
            className="input !py-2 text-sm"
          />
        </div>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn-primary !px-3 !py-1.5 text-xs">
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
