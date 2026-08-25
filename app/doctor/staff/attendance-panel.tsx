"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAttendance } from "./actions";

type StaffLite = { id: number; name: string; email: string | null; phone: string | null };

type DailyAtt = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  attendance: { status: string; check_in: string | null; check_out: string | null; notes: string | null } | null;
};

type ReportRow = {
  staff_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  summary: { present: number; absent: number; half_day: number; leave: number; total_marked: number };
  days: Record<number, { status: string; check_in: string | null; check_out: string | null } | null>;
};

const STATUSES = ["present", "absent", "half_day", "leave"] as const;
const STATUS_STYLE: Record<string, string> = {
  present: "bg-accent-500",
  absent: "bg-rose-400",
  half_day: "bg-amber-400",
  leave: "bg-slate-300",
};

export function AttendancePanel({ staff }: { staff: StaffLite[] }) {
  const [tab, setTab] = useState<"daily" | "report">("daily");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [daily, setDaily] = useState<DailyAtt[]>([]);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [report, setReport] = useState<{ rows: ReportRow[]; daysInMonth: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<number, { status: string; check_in: string; check_out: string; notes: string }>>({});
  const router = useRouter();

  async function loadDaily(d: string) {
    setLoading(true);
    const res = await fetch(`/api/doctor/staff/attendance?date=${d}`);
    if (res.ok) {
      const data = await res.json();
      setDaily(data.data as DailyAtt[]);
      const next: typeof edits = {};
      for (const row of data.data as DailyAtt[]) {
        next[row.id] = {
          status: row.attendance?.status ?? "present",
          check_in: row.attendance?.check_in ?? "09:00",
          check_out: row.attendance?.check_out ?? "18:00",
          notes: row.attendance?.notes ?? "",
        };
      }
      setEdits(next);
    }
    setLoading(false);
  }

  async function loadReport(m: number, y: number) {
    setLoading(true);
    const res = await fetch(`/api/doctor/staff/attendance/report?month=${m}&year=${y}`);
    if (res.ok) {
      const data = await res.json();
      setReport({ rows: data.report as ReportRow[], daysInMonth: data.days_in_month as number });
    }
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (tab === "daily") loadDaily(date);
      else loadReport(month, year);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, date, month, year, staff.length]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const payload = Object.entries(edits).map(([staff_id, e]) => ({
      staff_id: Number(staff_id),
      status: e.status,
      check_in: e.check_in || undefined,
      check_out: e.check_out || undefined,
      notes: e.notes || undefined,
    }));
    const fd = new FormData();
    fd.set("date", date);
    fd.set("attendance", JSON.stringify(payload));
    const res = await saveAttendance({ error: null }, fd);
    setSaving(false);
    if (res.error) setMsg(res.error);
    else {
      setMsg("Attendance saved.");
      router.refresh();
      await loadDaily(date);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
            <CalendarCheck className="h-4.5 w-4.5" />
          </span>
          <h2 className="font-display text-base font-bold text-slate-900">Attendance</h2>
        </div>
        <div className="flex rounded-xl border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => setTab("daily")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === "daily" ? "bg-brand-700 text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Daily marking
          </button>
          <button
            type="button"
            onClick={() => setTab("report")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === "report" ? "bg-brand-700 text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Monthly report
          </button>
        </div>
      </div>

      <div className="p-6">
        {tab === "daily" ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input !w-auto"
                aria-label="Attendance date"
              />
              <button type="button" onClick={handleSave} disabled={saving || staff.length === 0} className="btn-primary disabled:opacity-60">
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save attendance"}
              </button>
            </div>

            {msg && (
              <p className="mb-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">{msg}</p>
            )}

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
            ) : daily.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No staff members to mark attendance for.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2.5">Staff</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Check in</th>
                      <th className="px-4 py-2.5">Check out</th>
                      <th className="px-4 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {daily.map((row) => {
                      const edit = edits[row.id] ?? { status: "present", check_in: "09:00", check_out: "18:00", notes: "" };
                      const isWorkDay = edit.status === "present" || edit.status === "half_day";
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{row.name}</p>
                            <p className="text-xs text-slate-400">{row.phone ?? row.email ?? ""}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={edit.status}
                              onChange={(e) =>
                                setEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], status: e.target.value } }))
                              }
                              className="input !w-auto !py-1.5 !text-xs capitalize"
                              aria-label={`${row.name} status`}
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s} className="capitalize">
                                  {s.replace("_", " ")}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={edit.check_in}
                              disabled={!isWorkDay}
                              onChange={(e) =>
                                setEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], check_in: e.target.value } }))
                              }
                              className="input !w-auto !py-1.5 !text-xs disabled:opacity-40"
                              aria-label={`${row.name} check in`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={edit.check_out}
                              disabled={!isWorkDay}
                              onChange={(e) =>
                                setEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], check_out: e.target.value } }))
                              }
                              className="input !w-auto !py-1.5 !text-xs disabled:opacity-40"
                              aria-label={`${row.name} check out`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={edit.notes}
                              onChange={(e) =>
                                setEdits((prev) => ({ ...prev, [row.id]: { ...prev[row.id], notes: e.target.value } }))
                              }
                              placeholder="Notes"
                              className="input !w-40 !py-1.5 !text-xs"
                              aria-label={`${row.name} notes`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="input !w-24"
                aria-label="Report month"
              />
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="input !w-28"
                aria-label="Report year"
              />
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
            ) : !report || report.rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No data for this month.</p>
            ) : (
              <div className="slim-scroll overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2.5">Staff</th>
                      <th className="px-3 py-2.5 text-center">P</th>
                      <th className="px-3 py-2.5 text-center">A</th>
                      <th className="px-3 py-2.5 text-center">HD</th>
                      <th className="px-3 py-2.5 text-center">L</th>
                      <th className="px-3 py-2.5">Day map</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.rows.map((r) => (
                      <tr key={r.staff_id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-slate-800">{r.name}</p>
                          <p className="text-xs text-slate-400">{r.email ?? ""}</p>
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-accent-700">{r.summary.present}</td>
                        <td className="px-3 py-3 text-center font-semibold text-rose-600">{r.summary.absent}</td>
                        <td className="px-3 py-3 text-center font-semibold text-amber-600">{r.summary.half_day}</td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-500">{r.summary.leave}</td>
                        <td className="px-3 py-3">
                          <div className="flex max-w-md flex-wrap gap-0.5">
                            {Array.from({ length: report.daysInMonth }, (_, i) => i + 1).map((d) => {
                              const rec = r.days[d];
                              if (!rec) return <span key={d} className="h-4 w-4 rounded-[4px] bg-slate-100" title={`${d} — no mark`} />;
                              return (
                                <span
                                  key={d}
                                  className={`h-4 w-4 rounded-[4px] ${STATUS_STYLE[rec.status] ?? "bg-slate-300"}`}
                                  title={`${d} — ${rec.status}${rec.check_in ? ` (in ${rec.check_in}, out ${rec.check_out})` : ""}`}
                                />
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}