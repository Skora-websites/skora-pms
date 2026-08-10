import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { landingItems, landingSections, type LandingItem } from "@/lib/db/schema";

export type LandingSectionData = {
  id: number;
  key: string;
  name: string;
  title: string | null;
  subtitle: string | null;
  isActive: boolean | null;
  metadata: unknown;
  items: LandingItem[];
};

export const getLandingData = cache(async (): Promise<Map<string, LandingSectionData>> => {
  const sections = await db
    .select()
    .from(landingSections)
    .where(eq(landingSections.isActive, true));

  const items = await db
    .select()
    .from(landingItems)
    .where(eq(landingItems.isActive, true))
    .orderBy(asc(landingItems.order));

  const map = new Map<string, LandingSectionData>();
  for (const s of sections) {
    map.set(s.key, { ...s, items: [] });
  }
  for (const item of items) {
    const section = map.get(item.sectionKey);
    if (section) section.items.push(item);
  }
  return map;
});

export type CompanySettings = {
  companyName: string | null;
  companyTagline: string | null;
  companyEmail1: string | null;
  companyMobile1: string | null;
  companyWhatsapp1: string | null;
  currencySymbol: string | null;
  defaultTrialDays: number | null;
};

export const getCompanySettings = cache(async (): Promise<CompanySettings | null> => {
  const [row] = await db.query.companySettings.findMany({ limit: 1 });
  if (!row) return null;
  return {
    companyName: row.companyName,
    companyTagline: row.companyTagline,
    companyEmail1: row.companyEmail1,
    companyMobile1: row.companyMobile1,
    companyWhatsapp1: row.companyWhatsapp1,
    currencySymbol: row.currencySymbol,
    defaultTrialDays: row.defaultTrialDays,
  };
});
