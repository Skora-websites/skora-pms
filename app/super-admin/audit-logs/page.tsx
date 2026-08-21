import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getAuditLogs, getAuditActions } from "@/lib/queries/super-admin";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { AuditLogTable } from "./audit-log-table";

export const metadata: Metadata = { title: "Audit Logs · Super Admin" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ action?: string; page?: string }> };

export default async function AuditLogsPage({ searchParams }: Props) {
  await requireRole(["super_admin", "admin"]);
  const { action, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const limit = 50;
  const offset = (currentPage - 1) * limit;
  const [logs, actions] = await Promise.all([
    getAuditLogs({ limit, offset, action }),
    getAuditActions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Audit logs"
        subtitle="Activity log for all sensitive operations across the platform"
      />

      <form action="" method="GET" className="mb-5 flex max-w-xs gap-2">
        <select name="action" className="input" defaultValue={action ?? ""}>
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary shrink-0">Filter</button>
      </form>

      {logs.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No audit logs yet"
          description="Audit events will appear here as users interact with the platform."
        />
      ) : (
        <AuditLogTable logs={logs} />
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Showing {logs.length} entries</span>
        {currentPage > 1 && (
          <a href={`?action=${action ?? ""}&page=${currentPage - 1}`} className="font-semibold text-brand-800 hover:underline">← Previous</a>
        )}
        {logs.length === limit && (
          <a href={`?action=${action ?? ""}&page=${currentPage + 1}`} className="font-semibold text-brand-800 hover:underline">Next →</a>
        )}
      </div>
    </div>
  );
}