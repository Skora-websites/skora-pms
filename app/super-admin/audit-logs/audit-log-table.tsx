"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Log = {
  id: number;
  action: string;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: Date;
  userName: string | null;
};

const ACTION_TONES: Record<string, string> = {
  login: "bg-emerald-50 text-emerald-700",
  login_failed: "bg-red-50 text-red-600",
  logout: "bg-slate-100 text-slate-600",
  signup: "bg-brand-50 text-brand-800",
  bill_created: "bg-amber-50 text-amber-800",
  transaction_created: "bg-emerald-50 text-emerald-700",
  pdf_downloaded: "bg-violet-50 text-violet-700",
  file_uploaded: "bg-sky-50 text-sky-700",
};

export function AuditLogTable({ logs }: { logs: Log[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>User</th>
            <th>Time</th>
            <th>IP</th>
            <th className="text-right">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <Fragment key={log.id}>
              <tr>
                <td>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ACTION_TONES[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="text-slate-600">{log.userName ?? "—"}</td>
                <td>{formatDate(log.createdAt)}</td>
                <td className="font-mono text-xs text-slate-400">{log.ipAddress ?? "—"}</td>
                <td className="text-right">
                  {log.metadata != null && typeof log.metadata === "object" && (
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
                    >
                      Metadata <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === log.id ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </td>
              </tr>
              {expanded === log.id && log.metadata != null && typeof log.metadata === "object" && (
                <tr>
                  <td colSpan={5} className="bg-slate-50/60">
                    <pre className="whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-xs text-slate-600">
                      {JSON.stringify(log.metadata as Record<string, unknown>, null, 2)}
                    </pre>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}