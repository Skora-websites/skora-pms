import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getAllBlogs, getCategoriesWithCounts } from "@/lib/queries/super-admin";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BlogManager } from "./blog-manager";

export const metadata: Metadata = { title: "Blogs · Super Admin" };

export default async function BlogsPage() {
  await requireRole(["super_admin", "admin"]);
  const [posts, categories] = await Promise.all([getAllBlogs(), getCategoriesWithCounts()]);

  const rows = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortcontent: p.shortcontent,
    content: p.content,
    image: p.image,
    status: p.status,
    publishAt: p.publishAt ? p.publishAt.toISOString() : null,
    createdAt: p.createdAt ? p.createdAt.toISOString() : null,
    categoryName: p.categoryName,
    categoryId: p.categoryId,
  }));

  return (
    <div>
      <PageHeader
        title="Blog posts"
        subtitle={`${posts.length} article${posts.length === 1 ? "" : "s"} — drafts included`}
      />
      <BlogManager blogs={rows} categories={categories} />
    </div>
  );
}