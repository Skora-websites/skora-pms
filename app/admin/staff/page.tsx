import type { Metadata } from "next";
import { Stethoscope, UserCog, Users } from "lucide-react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicDoctors, doctorClinics, users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { initials, formatDate } from "@/lib/utils";
import {
  AddStaffButtons,
  AssignClinicsButton,
  ReceptionistActions,
  RemoveDoctorButton,
} from "./staff-client";
import { getReceptionistAssignments } from "./actions";

export const metadata: Metadata = { title: "Clinic Staff · Business" };

/**
 * Clinic staff for the business: doctor members grouped per clinic
 * (owner-anchored, removable non-owners) and receptionist accounts
 * anchored to any scoped clinic's practice. Writes are owner-only.
 */
export default async function AdminStaffPage() {
  const { viewerRole } = await requireAdminTier("/admin/staff");
  // Write controls mirror the action guards: staff CRUD is an owner-only
  // operation; managers holding roles-permissions get the read-only roster.
  const isOwner = viewerRole === "owner";
  const scope = await getBusinessScope();
  const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];

  // Doctor memberships per clinic + each clinic's owning doctor.
  const [memberRows, clinics, receptionists] = await Promise.all([
    db
      .select({
        clinicId: clinicDoctors.clinicId,
        doctorId: clinicDoctors.doctorId,
        isActive: clinicDoctors.isActive,
        name: users.name,
        email: users.email,
        phone: users.phone,
        specialization: users.specialization,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(clinicDoctors)
      .innerJoin(users, eq(users.id, clinicDoctors.doctorId))
      .where(and(inArray(clinicDoctors.clinicId, clinicIds), eq(clinicDoctors.isActive, true)))
      .orderBy(asc(clinicDoctors.id)),
    db
      .select({ id: doctorClinics.id, clinicName: doctorClinics.clinicName, ownerDoctorId: doctorClinics.doctorId, isActive: doctorClinics.isActive })
      .from(doctorClinics)
      .where(inArray(doctorClinics.id, clinicIds))
      .orderBy(asc(doctorClinics.id)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        status: users.status,
        referenceRoleId: users.referenceRoleId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "receptionist")),
  ]);

  // Receptionists anchored to a doctor inside the business scope; keyed by
  // their anchoring practice-owner doctor for a clinic label.
  const scopedReceptionists = receptionists.filter(
    (r) => r.referenceRoleId !== null && scope.doctorIds.includes(r.referenceRoleId)
  );
  const receptionistAssignments = isOwner ? await getReceptionistAssignments() : new Map<number, number[]>();
  const anchorNameByDoctor = new Map<number, string>();
  for (const m of memberRows) anchorNameByDoctor.set(m.doctorId, m.name);

  const memberByClinic = new Map<number, typeof memberRows>();
  for (const m of memberRows) {
    const list = memberByClinic.get(m.clinicId) ?? [];
    list.push(m);
    memberByClinic.set(m.clinicId, list);
  }

  return (
    <div>
      <PageHeader
        title="Clinic staff"
        subtitle={`Doctors and staff across ${clinics.length} clinic${clinics.length === 1 ? "" : "s"}`}
        action={isOwner ? <AddStaffButtons clinics={clinics.map((c) => ({ id: c.id, clinicName: c.clinicName }))} /> : undefined}
      />

      {/* Doctors grouped per clinic */}
      <section className="space-y-4">
        {clinics.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clinics yet"
            description="Add a clinic first — then add doctors and staff to it."
          />
        ) : (
          clinics.map((clinic) => {
            const members = memberByClinic.get(clinic.id) ?? [];
            const hasInactiveClinic = !(clinic.isActive ?? true);
            return (
              <div key={clinic.id} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                    {clinic.clinicName}
                    {hasInactiveClinic && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                        Inactive clinic
                      </span>
                    )}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {members.length} member{members.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {members.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-slate-400">No doctors at this clinic yet.</p>
                  ) : (
                    members.map((m) => {
                      const isClinicOwner = m.doctorId === clinic.ownerDoctorId;
                      return (
                        <div key={`${m.clinicId}-${m.doctorId}`} className="flex items-center justify-between gap-3 px-6 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                              {initials(m.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink">
                                {m.name}
                                {isClinicOwner && (
                                  <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                                    Owner
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {m.specialization ?? "—"} · {m.email ?? ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={m.status ?? "active"} />
                            {isOwner && !isClinicOwner && (
                              <RemoveDoctorButton clinicId={clinic.id} doctorId={m.doctorId} />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Receptionist accounts across the business */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
          <UserCog className="h-4 w-4 text-slate-400" />
          Receptionists
        </h2>
        {scopedReceptionists.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No receptionists yet"
            description="Add a receptionist account — they log in with their own credentials under the clinic's practice."
          />
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Practice</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {scopedReceptionists.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                          {initials(r.name)}
                        </span>
                        <p className="font-semibold text-ink">{r.name}</p>
                      </div>
                    </td>
                    <td className="text-slate-500">
                      {r.referenceRoleId !== null
                        ? (anchorNameByDoctor.get(r.referenceRoleId) ?? `Doctor #${r.referenceRoleId}`)
                        : "—"}
                    </td>
                    <td className="text-slate-500">
                      <p>{r.phone ?? "—"}</p>
                      <p className="text-xs text-slate-400">{r.email ?? ""}</p>
                    </td>
                    <td className="text-slate-500">{formatDate(r.createdAt)}</td>
                    <td>
                      <StatusBadge status={r.status ?? "active"} />
                    </td>
                    <td>
                      {isOwner ? (
                        <div className="flex items-center justify-end gap-2">
                          <AssignClinicsButton
                            staffId={r.id}
                            clinics={clinics.map((c) => ({ id: c.id, clinicName: c.clinicName }))}
                            assigned={receptionistAssignments.get(r.id) ?? []}
                          />
                          <ReceptionistActions
                            staff={{ id: r.id, name: r.name, email: r.email, phone: r.phone }}
                          />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
