import { NextRequest } from "next/server";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogs, categories } from "@/lib/db/schema";
import { apiError, apiOk } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type HealthArticleDetail = {
  id: number;
  title: string;
  slug: string;
  shortcontent: string;
  content: string;
  image: string | null;
  category: string;
  createdAt: string;
  readTime: string;
  author: string;
};

const STARTER_DETAILS: Record<string, HealthArticleDetail> = {
  "managing-blood-pressure-habits": {
    id: 1001,
    title: "10 Proven Habits to Keep Your Blood Pressure in the Safe Zone",
    slug: "managing-blood-pressure-habits",
    shortcontent:
      "Hypertension is often called the silent condition. Simple daily dietary adjustments, walking 30 minutes, and monitoring sodium intake can transform cardiovascular health.",
    content: `Maintaining optimal blood pressure (consistently under 120/80 mmHg) is one of the most effective ways to prevent heart attack, stroke, and chronic kidney disease.

### 1. Reduce Sodium Intake
Excess dietary sodium forces kidneys to retain water, raising vascular hydrostatic pressure. Aim for less than 2,000 mg of sodium daily by preparing fresh meals and inspecting nutrition labels for hidden salt in processed snacks.

### 2. Thirty Minutes of Daily Aerobic Exercise
Moderate brisk walking, cycling, or swimming strengthens myocardial contractility, allowing your heart to pump more blood with less strain on arterial walls.

### 3. Emphasize Potassium-Rich Whole Foods
Potassium counters the vascular effects of sodium and relaxes vascular tone. Leafy greens, avocados, sweet potatoes, and bananas are premier sources.

### 4. Consistent Sleep Architecture
Chronic insomnia or sleep fragmentation elevates nighttime cortisol and catecholamines. Ensure 7-8 hours of uninterrupted rest in a cool, dark room.

### 5. Monitor and Log Your Vitals Regularly
Use an upper-arm automated cuff at the same time each morning. Record readings in the SkoraCare Vitals Tracker so your physician can evaluate trends during routine check-ups.`,
    image: null,
    category: "Heart & Vitals",
    createdAt: new Date().toISOString(),
    readTime: "3 min read",
    author: "SkoraCare Clinical Team",
  },
  "understanding-lab-biomarkers": {
    id: 1002,
    title: "Understanding Your Lab Biomarkers: CBC, Blood Sugar & Lipid Panels",
    slug: "understanding-lab-biomarkers",
    shortcontent:
      "A complete guide to interpreting diagnostic laboratory reports. Learn what Hemoglobin, Fasting Blood Glucose, and HDL/LDL ratios signify for your wellness.",
    content: `Laboratory blood tests offer an objective snapshot of metabolic, immunological, and organ health. Here is a physician guide to understanding core panels:

### Complete Blood Count (CBC)
- **Hemoglobin (Hb):** Normal range 13.5-17.5 g/dL (men) and 12.0-15.5 g/dL (women). Low levels indicate anemia and potential iron or B12 deficiency.
- **White Blood Cells (WBC):** 4,500-11,000 cells/mcL. Elevation frequently points to active infections, inflammation, or acute physiological stress.
- **Platelets:** Crucial for hemostasis and clotting; typical bounds are 150,000-450,000/mcL.

### Comprehensive Lipid Profile
- **Total Cholesterol:** Ideally under 200 mg/dL.
- **LDL (Low-Density Lipoprotein):** Often deemed 'bad cholesterol'; guidelines recommend maintaining LDL < 100 mg/dL (< 70 mg/dL for cardiac patients).
- **HDL (High-Density Lipoprotein):** Protective scavenger particles; values above 50 mg/dL in females and 40 mg/dL in males correlate with cardiovascular resilience.

### Fasting Blood Glucose & HbA1c
Fasting glucose between 70-99 mg/dL is standard. An HbA1c of < 5.7% indicates healthy three-month glycemic control. Elevated numbers warrant physician consultation and dietary recalibration.`,
    image: null,
    category: "Diagnostics",
    createdAt: new Date().toISOString(),
    readTime: "4 min read",
    author: "Dr. Alistair Vance, MD",
  },
  "prescription-timeline-adherence": {
    id: 1003,
    title: "The Importance of Adhering to Your Prescription Timelines",
    slug: "prescription-timeline-adherence",
    shortcontent:
      "Missing antibiotic or chronic doses can lead to bacterial resistance and unstable vitals. Learn how routine alarms and dose logging improve long-term outcomes.",
    content: `When a doctor prescribes medication, timing and consistency are calculated to maintain therapeutic plasma drug levels.

### The Problem of Trough Levels
If you skip a dose or delay ingestion by several hours, systemic concentration plunges below the minimum effective concentration. Symptoms may rebound, and bacteria can mutate resistance in the case of anti-infectives.

### How to Stay Consistent
1. **Pair with Daily Rituals:** Take morning tablets immediately alongside your routine glass of water or breakfast.
2. **Utilize In-App Notifications:** SkoraCare provides active medication reminders and refill triggers when pill counts deplete.
3. **Never Double Up Without Clinical Guidance:** If you miss a dose by more than half the dosing interval, consult your physician or pharmacist before taking a double dose.`,
    image: null,
    category: "Medication Care",
    createdAt: new Date().toISOString(),
    readTime: "2 min read",
    author: "SkoraCare Clinical Team",
  },
  "daily-hydration-guide": {
    id: 1004,
    title: "Hydration & Electrolytes: How Much Water Does Your Body Actually Need?",
    slug: "daily-hydration-guide",
    shortcontent:
      "From regulating body temperature to kidney filtration, proper hydration is foundational. Tips on balancing water intake with electrolyte balance during workdays.",
    content: `Water constitutes approximately 60% of adult body weight and supports every enzymatic, renal, and neurological pathway.

### Signs of Sub-Clinical Dehydration
Dry mouth is a late indicator. Early clues include dark amber urine, persistent lethargy, brain fog, and tension headaches.

### How Much Is Enough?
The standard baseline is 30-35 mL of fluid per kilogram of body weight, varying with temperature and physical exertion. A 70 kg individual requires approximately 2.1 to 2.5 liters of total fluids daily.

### Don't Forget Electrolytes
If you exercise or work outdoors, plain water can dilute plasma sodium. Incorporate natural mineral sources like coconut water, lemon water with a pinch of sea salt, or mineral broths.`,
    image: null,
    category: "Wellness & Nutrition",
    createdAt: new Date().toISOString(),
    readTime: "3 min read",
    author: "SkoraCare Clinical Team",
  },
};

function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

/**
 * GET /api/mobile/patient/articles/[slug]
 * Full article content reader by slug.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return apiError("Article slug required", 400);
  }

  // 1. Check MySQL database
  const rows = await db
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
        eq(blogs.status, true),
        or(isNull(blogs.publishAt), sql`${blogs.publishAt} <= NOW()`)
      )
    )
    .limit(1);

  if (rows.length > 0) {
    const r = rows[0];
    const article: HealthArticleDetail = {
      id: r.id,
      title: r.title,
      slug: r.slug,
      shortcontent: r.shortcontent,
      content: r.content,
      image: r.image,
      category: r.category,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      readTime: estimateReadTime(r.content || r.shortcontent),
      author: "SkoraCare Clinical Team",
    };
    return apiOk({ article });
  }

  // 2. Check starter fallback
  const starter = STARTER_DETAILS[slug];
  if (starter) {
    return apiOk({ article: starter });
  }

  return apiError("Article not found", 404);
}
