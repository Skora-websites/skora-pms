import { NextRequest } from "next/server";
import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogs, categories } from "@/lib/db/schema";
import { apiOk } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type HealthArticleItem = {
  id: number;
  title: string;
  slug: string;
  shortcontent: string;
  image: string | null;
  category: string;
  createdAt: string;
  readTime: string;
};

export type HealthArticlesResponse = {
  categories: string[];
  articles: HealthArticleItem[];
};

function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

const STARTER_ARTICLES: HealthArticleItem[] = [
  {
    id: 1001,
    title: "10 Proven Habits to Keep Your Blood Pressure in the Safe Zone",
    slug: "managing-blood-pressure-habits",
    shortcontent:
      "Hypertension is often called the silent condition. Simple daily dietary adjustments, walking 30 minutes, and monitoring sodium intake can transform cardiovascular health.",
    image: null,
    category: "Heart & Vitals",
    createdAt: new Date().toISOString(),
    readTime: "3 min read",
  },
  {
    id: 1002,
    title: "Understanding Your Lab Biomarkers: CBC, Blood Sugar & Lipid Panels",
    slug: "understanding-lab-biomarkers",
    shortcontent:
      "A complete guide to interpreting diagnostic laboratory reports. Learn what Hemoglobin, Fasting Blood Glucose, and HDL/LDL ratios signify for your wellness.",
    image: null,
    category: "Diagnostics",
    createdAt: new Date().toISOString(),
    readTime: "4 min read",
  },
  {
    id: 1003,
    title: "The Importance of Adhering to Your Prescription Timelines",
    slug: "prescription-timeline-adherence",
    shortcontent:
      "Missing antibiotic or chronic doses can lead to bacterial resistance and unstable vitals. Learn how routine alarms and dose logging improve long-term outcomes.",
    image: null,
    category: "Medication Care",
    createdAt: new Date().toISOString(),
    readTime: "2 min read",
  },
  {
    id: 1004,
    title: "Hydration & Electrolytes: How Much Water Does Your Body Actually Need?",
    slug: "daily-hydration-guide",
    shortcontent:
      "From regulating body temperature to kidney filtration, proper hydration is foundational. Tips on balancing water intake with electrolyte balance during workdays.",
    image: null,
    category: "Wellness & Nutrition",
    createdAt: new Date().toISOString(),
    readTime: "3 min read",
  },
];

/**
 * GET /api/mobile/patient/articles
 * Published clinical articles and health wellness guides.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search")?.toLowerCase().trim();

  // Query database published blogs
  const conditions = [
    eq(blogs.status, true),
    or(isNull(blogs.publishAt), sql`${blogs.publishAt} <= NOW()`),
  ];

  if (categoryFilter && categoryFilter !== "All") {
    conditions.push(eq(categories.name, categoryFilter));
  }

  if (searchQuery) {
    conditions.push(
      or(
        like(blogs.title, `%${searchQuery}%`),
        like(blogs.shortcontent, `%${searchQuery}%`)
      )
    );
  }

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
    .where(and(...conditions))
    .orderBy(desc(blogs.createdAt))
    .limit(50);

  let articles: HealthArticleItem[] = [];

  if (rows.length > 0) {
    articles = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      shortcontent: r.shortcontent,
      image: r.image,
      category: r.category,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      readTime: estimateReadTime(r.shortcontent),
    }));
  } else {
    // If no custom blogs are seeded yet, serve starter articles with optional in-memory filter
    articles = STARTER_ARTICLES.filter((a) => {
      const matchCat =
        !categoryFilter || categoryFilter === "All" || a.category === categoryFilter;
      const matchSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery) ||
        a.shortcontent.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });
  }

  const distinctCategories = Array.from(
    new Set(["All", ...articles.map((a) => a.category)])
  );

  const response: HealthArticlesResponse = {
    categories: distinctCategories,
    articles,
  };

  return apiOk(response);
}
