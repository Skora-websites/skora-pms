import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { mailSettings, companySettings } from "@/lib/db/schema";
import { PageHeader } from "@/components/ui/dashboard-ui";

export const metadata: Metadata = { title: "Email Setup · Super Admin" };

export default async function EmailSetupPage() {
  await requireRole(["super_admin", "admin"]);
  const [mail] = await db.select().from(mailSettings).limit(1);
  const [company] = await db.select().from(companySettings).limit(1);

  return (
    <div>
      <PageHeader
        title="Email setup"
        subtitle="SMTP configuration for transactional mail"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="font-display text-base font-bold text-slate-900">SMTP settings</h2>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            {[
              ["Mailer", mail?.mailer ?? "smtp"],
              ["Host", mail?.host ?? "—"],
              ["Port", mail?.port?.toString() ?? "—"],
              ["Username", mail?.username ?? "—"],
              ["Encryption", mail?.encryption ?? "—"],
              ["From address", mail?.fromAddress ?? company?.companyEmail1 ?? "—"],
              ["From name", mail?.fromName ?? company?.companyName ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-400">{label}</dt>
                <dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Password is stored encrypted and never displayed. Update it via the admin settings
            page in the legacy app or directly in the <code className="font-mono">mail_settings</code> table.
          </p>
        </div>

        <div className="card p-7">
          <h2 className="font-display text-base font-bold text-slate-900">Sender identity</h2>
          <p className="mt-2 text-sm text-slate-500">
            Emails are sent from the company sender identity configured below.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ["Company", company?.companyName ?? "—"],
              ["Email", company?.companyEmail1 ?? "—"],
              ["Support email", company?.companyEmail2 ?? "—"],
              ["Trial days", company?.defaultTrialDays?.toString() ?? "15"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
