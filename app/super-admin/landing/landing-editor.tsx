"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteLandingItem,
  storeLandingItem,
  updateLandingItem,
  updateLandingSection,
} from "../actions";
import { StatusBadge } from "@/components/ui/dashboard-ui";

const initialState = { error: null as string | null };

type ItemRow = {
  id: number;
  title: string | null;
  description: string | null;
  badge: string | null;
  link: string | null;
  linkText: string | null;
  icon: string | null;
  image: string | null;
  priceMonthly: string | null;
  priceYearly: string | null;
  priceOriginalMonthly: string | null;
  priceOriginalYearly: string | null;
  features: unknown;
  stars: number | null;
  isActive: boolean | null;
};

type SectionRow = {
  id: number;
  key: string;
  name: string;
  title: string | null;
  subtitle: string | null;
  isActive: boolean | null;
  metadata: unknown;
  items: ItemRow[];
};

function SectionForm({
  section,
  onDone,
}: {
  section: SectionRow;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateLandingSection, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const metadata = section.metadata && typeof section.metadata === "object"
    ? JSON.stringify(section.metadata, null, 2)
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Edit section: {section.name}</h2>
            <p className="mt-1 font-mono text-xs text-slate-400">key: {section.key}</p>
          </div>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="section_key" value={section.key} />
          <div>
            <label htmlFor="sec_title" className="label">Heading</label>
            <input id="sec_title" name="title" maxLength={255} defaultValue={section.title ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="sec_subtitle" className="label">Subheading</label>
            <textarea id="sec_subtitle" name="subtitle" rows={2} defaultValue={section.subtitle ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="sec_metadata" className="label">Metadata (JSON, optional)</label>
            <textarea id="sec_metadata" name="metadata" rows={4} defaultValue={metadata} className="input font-mono text-xs" placeholder='{"key": "value"}' />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="is_active" value="1" defaultChecked={section.isActive ?? true} className="h-4 w-4 rounded border-slate-300 accent-brand-700" />
            Section is visible on the public site
          </label>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : "Save section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemForm({
  section,
  item,
  onDone,
}: {
  section: SectionRow;
  item?: ItemRow | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(item ? updateLandingItem : storeLandingItem, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const features = Array.isArray(item?.features) ? (item!.features as string[]).join("\n") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {item ? `Edit item: ${item.title}` : `Add item to "${section.name}"`}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-400">section: {section.key}</p>
          </div>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="section_key" value={section.key} />
          {item && <input type="hidden" name="id" value={item.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="item_title" className="label">Title</label>
              <input id="item_title" name="title" required maxLength={255} defaultValue={item?.title ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_badge" className="label">Badge</label>
              <input id="item_badge" name="badge" maxLength={255} defaultValue={item?.badge ?? ""} className="input" placeholder="e.g. Popular" />
            </div>
            <div>
              <label htmlFor="item_icon" className="label">Icon</label>
              <input id="item_icon" name="icon" maxLength={255} defaultValue={item?.icon ?? ""} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="item_desc" className="label">Description</label>
              <textarea id="item_desc" name="description" rows={2} defaultValue={item?.description ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_link" className="label">Link URL</label>
              <input id="item_link" name="link" maxLength={255} defaultValue={item?.link ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_link_text" className="label">Link text</label>
              <input id="item_link_text" name="link_text" maxLength={255} defaultValue={item?.linkText ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_pm" className="label">Price / month</label>
              <input id="item_pm" name="price_monthly" type="number" min={0} step="0.01" defaultValue={item?.priceMonthly ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_py" className="label">Price / year</label>
              <input id="item_py" name="price_yearly" type="number" min={0} step="0.01" defaultValue={item?.priceYearly ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_pom" className="label">Original price / month</label>
              <input id="item_pom" name="price_original_monthly" type="number" min={0} step="0.01" defaultValue={item?.priceOriginalMonthly ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_poy" className="label">Original price / year</label>
              <input id="item_poy" name="price_original_yearly" type="number" min={0} step="0.01" defaultValue={item?.priceOriginalYearly ?? ""} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="item_features" className="label">Features (one per line or comma-separated)</label>
              <textarea id="item_features" name="features" rows={4} defaultValue={features} className="input font-mono text-xs" />
            </div>
            <div>
              <label htmlFor="item_stars" className="label">Stars (0–5)</label>
              <input id="item_stars" name="stars" type="number" min={0} max={5} step={1} defaultValue={item?.stars ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="item_image" className="label">Image (optional)</label>
              <input id="item_image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="is_active" value="1" defaultChecked={item ? (item.isActive ?? true) : true} className="h-4 w-4 rounded border-slate-300 accent-brand-700" />
            Item is visible
          </label>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : item ? "Save item" : "Add item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LandingEditor({ sections }: { sections: SectionRow[] }) {
  const [editingSection, setEditingSection] = useState<SectionRow | null>(null);
  const [itemForm, setItemForm] = useState<{ section: SectionRow; item?: ItemRow | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ItemRow | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function handleDeleteItem(section: SectionRow, item: ItemRow) {
    if (confirmDelete?.id !== item.id) {
      setConfirmDelete(item);
      return;
    }
    setConfirmDelete(null);
    const res = await deleteLandingItem(item.id);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: `Item "${item.title}" deleted from "${section.name}".` });
      router.refresh();
    }
  }

  return (
    <div>
      {msg && (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            msg.type === "ok" ? "border-accent-200 bg-accent-50 text-accent-800" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">{s.name}</h3>
                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  key: {s.key} · {s.title ?? "no heading"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <StatusBadge status={s.isActive ? "active" : "inactive"} />
                <button
                  type="button"
                  onClick={() => setEditingSection(s)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit section
                </button>
                <button
                  type="button"
                  onClick={() => setItemForm({ section: s })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </button>
              </div>
            </div>

            {s.items.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">No items in this section yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {s.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title ?? "Untitled"}
                        {item.badge && <span className="ml-2 badge bg-amber-100 text-amber-800">{item.badge}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {item.description ?? "—"}
                        {item.priceMonthly && ` · ₹${item.priceMonthly}/mo`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemForm({ section: s, item })}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-800"
                      aria-label={`Edit item ${item.title ?? item.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(s, item)}
                      className={`rounded-lg border p-2 transition-colors ${
                        confirmDelete?.id === item.id
                          ? "border-red-300 bg-red-600 text-white"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                      aria-label={confirmDelete?.id === item.id ? `Confirm delete ${item.title ?? item.id}` : `Delete item ${item.title ?? item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {editingSection && <SectionForm section={editingSection} onDone={() => setEditingSection(null)} />}
      {itemForm && (
        <ItemForm section={itemForm.section} item={itemForm.item ?? null} onDone={() => setItemForm(null)} />
      )}
    </div>
  );
}