import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { mailSettings, companySettings } from "@/lib/db/schema";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { MailSettingsForm } from "./mail-settings-form";

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
        <MailSettingsForm
          mail={
            mail
              ? {
                  host: mail.host,
                  port: mail.port,
                  username: mail.username,
                  encryption: mail.encryption,
                  fromAddress: mail.fromAddress,
                  fromName: mail.fromName,
                }
              : null
          }
          defaults={{
            fromAddress: company?.companyEmail1 ?? null,
            fromName: company?.companyName ?? null,
          }}
        />

        <div className="card p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="font-display text-base font-bold text-slate-900">Sender identity</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Emails are sent from the company sender identity configured in Settings.
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