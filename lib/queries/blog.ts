import { cache } from "react";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogs, categories } from "@/lib/db/schema";

export const getPublishedBlogs = cache(async () => {
  const rows = await db
    .select({
      id: blogs.id,
      title: blogs.title,
      slug: blogs.slug,
      shortcontent: blogs.shortcontent,
      image: blogs.image,
      createdAt: blogs.createdAt,
      category: categories.name,
    })
    .from(blogs)
    .innerJoin(categories, eq(categories.id, blogs.categoryId))
    .where(
      and(
        eq(blogs.status, true),
        // Published now OR scheduled to publish in the past.
        or(isNull(blogs.publishAt), sql`${blogs.publishAt} <= NOW()`)
      )
    )
    .orderBy(desc(blogs.createdAt));

  return rows;
});

export const getBlogBySlug = cache(async (slug: string) => {
  const [row] = await db
    .select({
      id: blogs.id,
      title: blogs.title,
      slug: blogs.slug,
      shortcontent: blogs.shortcontent,
      content: blogs.content,
      image: blogs.image,
      createdAt: blogs.createdAt,
      category: categories.name,
    })
    .from(blogs)
    .innerJoin(categories, eq(categories.id, blogs.categoryId))
    .where(
      and(
        eq(blogs.slug, slug),
        // Same visibility rules as the listing: drafts and future-scheduled
        // posts must not be readable by guessing the direct slug.
        eq(blogs.status, true),
        or(isNull(blogs.publishAt), sql`${blogs.publishAt} <= NOW()`)
      )
    );

  return row ?? null;
});
