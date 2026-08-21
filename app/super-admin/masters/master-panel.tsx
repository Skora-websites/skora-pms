"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Download, Loader2, Pencil, Plus, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteMasterItem, importMasterItems, storeMasterItem, updateMasterItem } from "../actions";
import type { MasterKind, MasterRow } from "@/lib/queries/super-admin";

const initialState = { error: null as string | null };

const TABS: { kind: MasterKind; label: string }[] = [
  { kind: "symptoms", label: "Symptoms" },
  { kind: "examinations", label: "Examinations" },
  { kind: "diagnoses", label: "Diagnoses" },
  { kind: "lab-tests", label: "Lab tests" },
  { kind: "medicines", label: "Medicines" },
];

function MasterForm({
  kind,
  item,
  onDone,
}: {
  kind: MasterKind;
  item?: MasterRow | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(item ? updateMasterItem : storeMasterItem, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const isMedicine = kind === "medicines";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {item ? `Edit ${kind.replace("-", " ").replace(/s$/, "")}` : `Add ${kind.replace("-", " ").replace(/s$/, "")}`}
          </h2>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="kind" value={kind} />
          {item && <input type="hidden" name="id" value={item.id} />}
          <div>
            <label htmlFor="master_name" className="label">Name</label>
            <input id="master_name" name="name" required maxLength={255} defaultValue={item?.name ?? ""} className="input" />
          </div>
          {isMedicine && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="master_strength" className="label">Strength</label>
                <input id="master_strength" name="strength" maxLength={255} defaultValue={item?.strength ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor="master_form" className="label">Form</label>
                <input id="master_form" name="form" maxLength={255} defaultValue={item?.form ?? "Tablet"} className="input" />
              </div>
              <div>
                <label htmlFor="master_unit" className="label">Unit</label>
                <input id="master_unit" name="unit" maxLength={255} defaultValue={item?.unit ?? "mg"} className="input" />
              </div>
            </div>
          )}

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : item ? "Save" : "Add record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MasterPanel({
  data,
}: {
  data: Record<MasterKind, MasterRow[]>;
}) {
  const [active, setActive] = useState<MasterKind>("medicines");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MasterRow | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importState, importFormAction, importPending] = useActionState(importMasterItems, initialState);
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const rows = data[active].filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.name ?? "").toLowerCase().includes(q) ||
      (r.strength ?? "").toLowerCase().includes(q) ||
      (r.form ?? "").toLowerCase().includes(q) ||
      (r.unit ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDelete(item: MasterRow) {
    if (confirmDelete?.id !== item.id) {
      setConfirmDelete(item);
      return;
    }
    setConfirmDelete(null);
    const res = await deleteMasterItem(active, item.id);
    if (res.error) setImportMsg(res.error);
    else {
      setImportMsg(null);
      router.refresh();
    }
  }

  function handleImportFile(file: File) {
    const fd = new FormData();
    fd.set("kind", active);
    fd.set("file", file);
    importFormAction(fd);
  }

  useEffect(() => {
    if (importState !== initialState) {
      setTimeout(() => {
        setImportMsg(importState.error);
        if (importState.error === null) {
          router.refresh();
          setImporting(false);
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importState]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => {
                setActive(t.kind);
                setConfirmDelete(null);
                setImportMsg(null);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active === t.kind
                  ? "bg-navy-950 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-800"
              }`}
            >
              {t.label} ({data[t.kind].length})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${active}…`}
            className="input w-44"
          />
          <a
            href={`/api/super-admin/masters/${active}/export`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
          >
            <Download className="h-4 w-4" /> Export
          </a>
          <button
            type="button"
            onClick={() => setImporting((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {importing && (
        <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-sm text-brand-900">
            Upload an .xlsx or .csv file with a <code className="font-mono">name</code> column
            {active === "medicines" && " (plus optional strength, form, unit columns)"}. Duplicate names are skipped.
          </p>
          <form className="mt-3 flex items-center gap-3">
            <input type="hidden" name="kind" value={active} />
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept=".xlsx,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
              }}
              className="input max-w-sm"
            />
            {importPending && <Loader2 className="h-5 w-5 animate-spin text-brand-700" />}
          </form>
        </div>
      )}

      {importMsg && (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            importMsg.startsWith("No") || importMsg.includes("already")
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {importMsg}
        </p>
      )}

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              {active === "medicines" && (
                <>
                  <th>Strength</th>
                  <th>Form</th>
                  <th>Unit</th>
                </>
              )}
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium text-slate-900">{r.name}</td>
                {active === "medicines" && (
                  <>
                    <td>{r.strength ?? "—"}</td>
                    <td>{r.form ?? "—"}</td>
                    <td>{r.unit ?? "—"}</td>
                  </>
                )}
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(r)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-800"
                      aria-label={`Edit ${r.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className={`rounded-lg border p-2 transition-colors ${
                        confirmDelete?.id === r.id
                          ? "border-red-300 bg-red-600 text-white"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                      aria-label={confirmDelete?.id === r.id ? `Confirm delete ${r.name}` : `Delete ${r.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={active === "medicines" ? 5 : 2} className="py-10 text-center text-sm text-slate-400">
                  No {active.replace("-", " ")} yet. Add one or import from a spreadsheet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && <MasterForm kind={active} onDone={() => setCreating(false)} />}
      {editing && <MasterForm kind={active} item={editing} onDone={() => setEditing(null)} />}
    </div>
  );
}