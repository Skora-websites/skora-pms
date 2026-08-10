import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getBlogBySlug } from "@/lib/queries/blog";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  return { title: post?.title ?? "Article" };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-accent-50/40 to-brand-50 pb-16 pt-36 lg:pt-44">
        <div className="mx-auto max-w-3xl px-5 lg:px-0">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <div className="mt-6 flex items-center gap-3 text-xs text-ink-muted">
            <span className="badge bg-brand-100 text-brand-800">{post.category}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(post.createdAt)}
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink lg:text-4xl">
            {post.title}
          </h1>
        </div>
      </section>

      <article className="py-14">
        <div className="prose mx-auto max-w-3xl px-5 lg:px-0">
          {post.content.split("\n\n").map((para, i) => (
            <p
              key={i}
              className="mb-5 text-[16px] leading-[1.85] text-ink-muted"
            >
              {para}
            </p>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-gradient-to-r from-brand-800 to-accent-700 p-8 text-center px-5">
          <h2 className="font-display text-xl font-bold text-white">
            Ready to try SkoraCares for your clinic?
          </h2>
          <Link
            href="/contact"
            className="mt-5 inline-block rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-800 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Book a free demo
          </Link>
        </div>
      </article>
    </>
  );
}
