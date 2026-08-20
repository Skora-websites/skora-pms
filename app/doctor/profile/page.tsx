import type { Metadata } from "next";
import { BadgeCheck, GraduationCap, IdCard, Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { PhotoUpload } from "./photo-upload";
import { SignatureUpload } from "./signature-upload";

export const metadata: Metadata = { title: "Profile · Doctor" };

export default async function ProfilePage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile settings" subtitle="Your account details" />

      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-800 to-accent-700" />
        <div className="px-7 pb-7">
          <div className="-mt-10 flex items-end gap-4">
            <PhotoUpload
              name={user.name}
              photoUrl={user.profilePhotoPath ? "/api/doctor/profile/photo" : null}
            />
            <div className="pb-1">
              <h1 className="font-display text-xl font-extrabold text-slate-900">{user.name}</h1>
              <p className="text-sm capitalize text-slate-400">{user.role.replace("_", " ")}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoTile icon={Mail} label="Email" value={user.email ?? "—"} />
            <InfoTile icon={Phone} label="Phone" value={user.phone ?? "—"} />
            <InfoTile icon={GraduationCap} label="Qualification" value={user.qualification ?? "—"} />
            <InfoTile icon={IdCard} label="Registration number" value={user.registrationNumber ?? "—"} />
            <InfoTile icon={BadgeCheck} label="Member since" value={formatDate(user.createdAt)} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProfileForm />
      </div>

      <div className="mt-6">
        <SignatureUpload signatureUrl={user.signaturePath ? "/api/doctor/profile/signature" : null} />
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-100">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
