import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { getPublishedBlogs } from "@/lib/queries/blog";
import { PageHeader } from "@/components/marketing/page-header";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPublishedBlogs();

  return (
    <>
      <PageHeader
        badge="Blog"
        title="Insights for modern practices"
        subtitle="Practical advice on clinic management, digital prescriptions, billing and more."
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-brand-900/20 py-24 text-center">
              <p className="text-lg font-semibold text-ink">No articles published yet</p>
              <p className="mt-2 text-sm text-ink-muted">Check back soon for fresh insights.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-brand-900/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-brand-800 to-accent-700">
                    <span className="text-5xl opacity-90 transition-transform duration-300 group-hover:scale-110">
                      🩺
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span className="badge bg-brand-100 text-brand-800">{post.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-800">
                      {post.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                      {post.shortcontent}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800">
                      Read article
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
