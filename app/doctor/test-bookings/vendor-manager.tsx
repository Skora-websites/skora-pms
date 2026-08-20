"use client";

import { useActionState, useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createVendor, updateVendor, deleteVendor } from "./actions";

const initialState = { error: null as string | null };

type Vendor = { id: number; name: string; mobile: string; email: string; address: string };

export function VendorManager({ vendors }: { vendors: Vendor[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [state, formAction, pending] = useActionState(editing ? updateVendor : createVendor, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function close() {
    setOpen(false);
    setEditing(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        <Building2 className="h-4 w-4" />
        Vendors
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={close}>
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Vendors</h2>
                <p className="mt-1 text-sm text-slate-500">Lab vendors that receive test booking upload links.</p>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editing ? (
              <form
                action={(fd) => {
                  fd.set("id", String(editing.id));
                  formAction(fd);
                }}
                className="mt-5 space-y-4"
              >
                <input type="hidden" name="id" value={editing.id} />
                <div>
                  <label className="label">Vendor name</label>
                  <input name="name" defaultValue={editing.name} required maxLength={255} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Mobile</label>
                    <input name="mobile" defaultValue={editing.mobile} required className="input" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input name="email" type="email" defaultValue={editing.email} required className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea name="address" rows={2} defaultValue={editing.address} required className="input" />
                </div>
                {state.error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
                )}
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
                    Save vendor
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form
                  action={(fd) => {
                    formAction(fd);
                  }}
                  id="vendor-form"
                  className="mt-5 space-y-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Name</label>
                      <input name="name" required maxLength={255} className="input" placeholder="Metropolis Labs" />
                    </div>
                    <div>
                      <label className="label">Mobile</label>
                      <input name="mobile" required className="input" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Email</label>
                      <input name="email" type="email" required className="input" placeholder="lab@example.com" />
                    </div>
                    <div>
                      <label className="label">Address</label>
                      <input name="address" required className="input" placeholder="Branch address" />
                    </div>
                  </div>
                  {state.error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
                  )}
                  <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
                    <Plus className="h-4 w-4" />
                    Add vendor
                  </button>
                </form>

                <div className="mt-4 space-y-2">
                  {vendors.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{v.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {v.mobile} · {v.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(v)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Delete vendor "${v.name}"?`)) {
                              await deleteVendor(v.id);
                              router.refresh();
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {vendors.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">No vendors yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}