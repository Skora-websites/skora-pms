import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPublishedBlogs } from "@/lib/queries/blog";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Blogs · Super Admin" };

export default async function BlogsPage() {
  await requireRole(["super_admin", "admin"]);
  const posts = await getPublishedBlogs();

  return (
    <div>
      <PageHeader
        title="Blog posts"
        subtitle={`${posts.length} published article${posts.length === 1 ? "" : "s"}`}
      />

      {posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No blog posts"
          description="Published articles appear here and on the public blog."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Published</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/blog/${p.slug}`} className="font-semibold text-slate-900 hover:text-brand-800">
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-400">{p.slug}</p>
                  </td>
                  <td><span className="badge bg-brand-100 text-brand-800">{p.category}</span></td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td><StatusBadge status="active" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
