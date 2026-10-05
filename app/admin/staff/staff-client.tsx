"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  addDoctorMembership,
  assignReceptionistClinics,
  createStaffMember,
  deleteStaffMember,
  removeDoctorMembership,
  updateStaffMember,
  type StaffActionResult,
} from "./actions";

const initial: StaffActionResult = { error: null };

type ClinicOption = { id: number; clinicName: string };

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function ClinicSelect({ clinics, name = "clinic_id", id = "clinic_id" }: { clinics: ClinicOption[]; name?: string; id?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">Clinic</label>
      <select id={id} name={name} required className="input" defaultValue="">
        <option value="" disabled>Select clinic…</option>
        {clinics.map((c) => (
          <option key={c.id} value={c.id}>{c.clinicName}</option>
        ))}
      </select>
      {clinics.length === 0 && (
        <p className="mt-1.5 text-xs text-amber-700">No clinics yet — add one from the Clinics page first.</p>
      )}
    </div>
  );
}

function StaffFields({ staff }: { staff?: ReceptionistRow | null }) {
  return (
    <>
      <div>
        <label htmlFor="staff_name" className="label">Full name</label>
        <input id="staff_name" name="name" required maxLength={255} defaultValue={staff?.name ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="staff_email" className="label">Email</label>
          <input id="staff_email" name="email" type="email" required defaultValue={staff?.email ?? ""} className="input" placeholder="staff@clinic.com" />
        </div>
        <div>
          <label htmlFor="staff_phone" className="label">Phone</label>
          <input id="staff_phone" name="phone" defaultValue={staff?.phone ?? ""} className="input" placeholder="+91…" />
        </div>
      </div>
      <div>
        <label htmlFor="staff_password" className="label">
          {staff ? "New password (leave blank to keep)" : "Password"}
        </label>
        <input
          id="staff_password"
          name="password"
          type="password"
          minLength={staff ? undefined : 8}
          required={!staff}
          className="input"
          placeholder="Min 8 characters"
        />
      </div>
    </>
  );
}

export function AddStaffButtons({ clinics }: { clinics: ClinicOption[] }) {
  const [openStaff, setOpenStaff] = useState(false);
  const [openDoctor, setOpenDoctor] = useState(false);
  const [staffState, staffAction, staffPending] = useActionState(createStaffMember, initial);
  const [doctorState, doctorAction, doctorPending] = useActionState(addDoctorMembership, initial);
  const router = useRouter();

  useEffect(() => {
    if (staffState !== initial && staffState.error === null) {
      router.refresh();
      closeStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffState]);

  useEffect(() => {
    if (doctorState !== initial && doctorState.error === null) {
      router.refresh();
      closeDoctor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorState]);

  function closeStaff() {
    setOpenStaff(false);
  }

  function closeDoctor() {
    setOpenDoctor(false);
  }

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setOpenDoctor(true)} className="btn-ghost">
        <UserPlus className="h-4 w-4" />
        Add doctor to clinic
      </button>
      <button type="button" onClick={() => setOpenStaff(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Add receptionist
      </button>

      {openStaff && (
        <Modal
          title="Add receptionist"
          subtitle="They get a login attached to the selected clinic's practice."
          onClose={closeStaff}
        >
          <form
            action={(fd) => {
              staffAction(fd);
            }}
            className="space-y-4"
          >
            <ClinicSelect clinics={clinics} id="staff_clinic_id" />
            <StaffFields />
            {staffState.error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{staffState.error}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeStaff} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={staffPending || clinics.length === 0} className="btn-primary disabled:opacity-60">
                {staffPending ? "Saving…" : "Add staff"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {openDoctor && (
        <Modal
          title="Add doctor to clinic"
          subtitle="Existing doctor email → links them to the clinic. New email → creates a doctor account."
          onClose={closeDoctor}
        >
          <form
            action={(fd) => {
              doctorAction(fd);
            }}
            className="space-y-4"
          >
            <ClinicSelect clinics={clinics} id="doctor_clinic_id" />
            <div>
              <label htmlFor="doctor_name" className="label">Full name</label>
              <input id="doctor_name" name="doctor_name" required maxLength={255} className="input" placeholder="Dr. …" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="doctor_email" className="label">Email</label>
                <input id="doctor_email" name="doctor_email" type="email" required className="input" placeholder="doctor@clinic.com" />
              </div>
              <div>
                <label htmlFor="doctor_phone" className="label">Phone</label>
                <input id="doctor_phone" name="doctor_phone" className="input" placeholder="+91…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="doctor_specialization" className="label">Specialization</label>
                <input id="doctor_specialization" name="doctor_specialization" className="input" placeholder="e.g. Cardiology" />
              </div>
              <div>
                <label htmlFor="doctor_qualification" className="label">Qualification</label>
                <input id="doctor_qualification" name="doctor_qualification" className="input" placeholder="e.g. MBBS, MD" />
              </div>
            </div>
            <div>
              <label htmlFor="doctor_password" className="label">
                Password <span className="text-slate-400">(only for a brand-new account)</span>
              </label>
              <input id="doctor_password" name="doctor_password" type="password" minLength={8} className="input" placeholder="Min 8 characters" />
            </div>
            {doctorState.error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{doctorState.error}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeDoctor} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={doctorPending || clinics.length === 0} className="btn-primary disabled:opacity-60">
                {doctorPending ? "Saving…" : "Add doctor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export type ReceptionistRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

export function ReceptionistActions({ staff }: { staff: ReceptionistRow }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [, deleteAction, deletePending] = useActionState(deleteStaffMember, initial);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    const fd = new FormData();
    fd.set("id", String(staff.id));
    deleteAction(fd);
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Edit staff"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deletePending}
          className={`rounded-lg p-1.5 transition-colors disabled:opacity-60 ${
            confirming ? "bg-red-50 text-red-600" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
          }`}
          title={confirming ? "Click again to confirm" : "Delete staff"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {editing && (
        <Modal title={`Edit ${staff.name}`} subtitle="Update details or reset their password." onClose={() => setEditing(false)}>
          <EditStaffForm staff={staff} onDone={() => setEditing(false)} />
        </Modal>
      )}
    </>
  );
}

function EditStaffForm({ staff, onDone }: { staff: ReceptionistRow; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateStaffMember, initial);
  const router = useRouter();

  useEffect(() => {
    if (state !== initial && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={(fd) => {
        fd.set("id", String(staff.id));
        formAction(fd);
      }}
      className="space-y-4"
    >
      <StaffFields staff={staff} />
      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export type ClinicAssignmentOption = { id: number; clinicName: string };

/** Owner-side "Assign clinics" control for one receptionist row. */
export function AssignClinicsButton({
  staffId,
  clinics,
  assigned,
}: {
  staffId: number;
  clinics: ClinicAssignmentOption[];
  assigned: number[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(assignReceptionistClinics, initial);
  const router = useRouter();

  useEffect(() => {
    if (state !== initial && state.error === null) {
      router.refresh();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
        title="Assign clinics"
      >
        Clinics ({assigned.length})
      </button>

      {open && (
        <Modal
          title="Assign clinics"
          subtitle="The receptionist will only see and operate the clinics selected here."
          onClose={close}
        >
          <form action={(fd) => { fd.set("id", String(staffId)); formAction(fd); }} className="space-y-4">
            <div className="space-y-1.5">
              {clinics.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="clinic_id"
                    value={c.id}
                    defaultChecked={assigned.includes(c.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                  />
                  {c.clinicName}
                </label>
              ))}
              {clinics.length === 0 && (
                <p className="text-sm text-slate-400">No clinics exist yet.</p>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Leave all unchecked to revoke every clinic — the receptionist will see no data until reassigned.
            </p>
            {state.error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={close} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
                {pending ? "Saving…" : "Save assignment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function RemoveDoctorButton({
  clinicId,
  doctorId,
}: {
  clinicId: number;
  doctorId: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [, action, pending] = useActionState(removeDoctorMembership, initial);

  function handleRemove() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    const fd = new FormData();
    fd.set("clinic_id", String(clinicId));
    fd.set("doctor_id", String(doctorId));
    action(fd);
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={pending}
      className={`rounded-lg p-1.5 transition-colors disabled:opacity-60 ${
        confirming ? "bg-red-50 text-red-600" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
      }`}
      title={confirming ? "Click again to confirm" : "Remove from clinic"}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
