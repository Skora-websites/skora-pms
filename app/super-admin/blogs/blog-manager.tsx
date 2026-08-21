"use client";

import { useActionState, useEffect, useState } from "react";
import { FolderPlus, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteBlog, storeBlog, updateBlog, storeCategory, updateCategory, deleteCategory } from "../actions";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

const initialState = { error: null as string | null };

type BlogRow = {
  id: number;
  title: string;
  slug: string;
  shortcontent: string | null;
  content: string | null;
  image: string | null;
  status: boolean | null;
  publishAt: string | null;
  createdAt: string | null;
  categoryName: string | null;
  categoryId: number | null;
};

type CategoryRow = { id: number; name: string; blogCount: number };

function BlogForm({
  blog,
  categories,
  onDone,
}: {
  blog?: BlogRow | null;
  categories: CategoryRow[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(blog ? updateBlog : storeBlog, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {blog ? `Edit post: ${blog.title}` : "New blog post"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">The slug is generated automatically from the title.</p>
          </div>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          {blog && <input type="hidden" name="id" value={blog.id} />}
          <div>
            <label htmlFor="blog_title" className="label">Title</label>
            <input id="blog_title" name="title" required maxLength={255} defaultValue={blog?.title ?? ""} className="input" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="blog_category" className="label">Category</label>
              <select id="blog_category" name="category_id" defaultValue={blog?.categoryId ?? ""} className="input">
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="blog_image" className="label">Cover image (optional)</label>
              <input id="blog_image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
            </div>
          </div>
          <div>
            <label htmlFor="blog_short" className="label">Short summary</label>
            <input id="blog_short" name="shortcontent" maxLength={255} defaultValue={blog?.shortcontent ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="blog_content" className="label">Content</label>
            <textarea id="blog_content" name="content" required rows={10} defaultValue={blog?.content ?? ""} className="input font-mono text-sm" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="status" value="1" defaultChecked={blog ? (blog.status ?? true) : true} className="h-4 w-4 rounded border-slate-300 accent-brand-700" />
            Published (visible on the public blog)
          </label>
          <div>
            <label htmlFor="blog_publish" className="label">Schedule publish (optional)</label>
            <input
              id="blog_publish"
              name="publish_at"
              type="datetime-local"
              defaultValue={blog?.publishAt ? new Date(blog.publishAt).toISOString().slice(0, 16) : ""}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-400">
              If set, the post appears on the public blog only after this date/time. Leave blank to publish immediately (subject to the Published checkbox).
            </p>
          </div>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : blog ? "Save post" : "Create post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: CategoryRow | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(category ? updateCategory : storeCategory, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {category ? `Edit category: ${category.name}` : "New category"}
          </h2>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form action={formAction} className="mt-5 space-y-4">
          {category && <input type="hidden" name="id" value={category.id} />}
          <div>
            <label htmlFor="cat_name" className="label">Category name</label>
            <input id="cat_name" name="name" required maxLength={255} defaultValue={category?.name ?? ""} className="input" />
          </div>
          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : category ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BlogManager({
  blogs,
  categories,
}: {
  blogs: BlogRow[];
  categories: CategoryRow[];
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BlogRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BlogRow | null>(null);
  const [catForm, setCatForm] = useState<{ open: boolean; category?: CategoryRow | null }>({ open: false });
  const [confirmCatDelete, setConfirmCatDelete] = useState<CategoryRow | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function handleDelete(blog: BlogRow) {
    if (confirmDelete?.id !== blog.id) {
      setConfirmDelete(blog);
      return;
    }
    setConfirmDelete(null);
    const res = await deleteBlog(blog.id);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: `Post "${blog.title}" deleted.` });
      router.refresh();
    }
  }

  async function handleCatDelete(cat: CategoryRow) {
    if (confirmCatDelete?.id !== cat.id) {
      setConfirmCatDelete(cat);
      return;
    }
    setConfirmCatDelete(null);
    const res = await deleteCategory(cat.id);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: `Category "${cat.name}" deleted.` });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      {msg && (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            msg.type === "ok" ? "border-accent-200 bg-accent-50 text-accent-800" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Published</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((p) => (
              <tr key={p.id}>
                <td>
                  <p className="font-semibold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-400">{p.slug}</p>
                </td>
                <td><span className="badge bg-brand-100 text-brand-800">{p.categoryName ?? "Uncategorized"}</span></td>
                <td>{formatDate(p.createdAt)}</td>
                <td>
                  {p.publishAt && new Date(p.publishAt) > new Date() ? (
                    <span className="badge bg-violet-100 text-violet-700">Scheduled {formatDate(p.publishAt)}</span>
                  ) : (
                    <StatusBadge status={p.status ? "active" : "inactive"} />
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-800"
                      aria-label={`Edit ${p.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className={`rounded-lg border p-2 transition-colors ${
                        confirmDelete?.id === p.id
                          ? "border-red-300 bg-red-600 text-white"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                      aria-label={confirmDelete?.id === p.id ? `Confirm delete ${p.title}` : `Delete ${p.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {blogs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">No blog posts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
            <FolderPlus className="h-4.5 w-4.5" />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-slate-900">Categories</h2>
            <p className="text-xs text-slate-500">Used to group blog posts on the public site.</p>
          </div>
          <button
            type="button"
            onClick={() => setCatForm({ open: true })}
            className="btn-ghost"
          >
            <Plus className="h-4 w-4" /> New category
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-2 text-sm font-medium text-slate-700"
            >
              {c.name}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {c.blogCount}
              </span>
              <button
                type="button"
                onClick={() => setCatForm({ open: true, category: c })}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-800"
                aria-label={`Edit category ${c.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleCatDelete(c)}
                className={`rounded-full p-1 transition-colors ${
                  confirmCatDelete?.id === c.id ? "bg-red-600 text-white" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                }`}
                aria-label={confirmCatDelete?.id === c.id ? `Confirm delete category ${c.name}` : `Delete category ${c.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {categories.length === 0 && <p className="text-sm text-slate-400">No categories yet.</p>}
        </div>
      </div>

      {creating && <BlogForm categories={categories} onDone={() => setCreating(false)} />}
      {editing && <BlogForm blog={editing} categories={categories} onDone={() => setEditing(null)} />}
      {catForm.open && (
        <CategoryForm category={catForm.category ?? null} onDone={() => setCatForm({ open: false })} />
      )}
    </div>
  );
}