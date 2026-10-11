import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { geoDataQuerySchema } from "@/lib/validation/integrations";

export const runtime = "nodejs";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

/** Static country list (registration dropdowns). REST Countries is key-gated since v5. */
const COUNTRIES = [
  "India", "Afghanistan", "Bangladesh", "Bhutan", "Maldives", "Myanmar",
  "Nepal", "Pakistan", "Sri Lanka", "United Arab Emirates", "Saudi Arabia",
  "Qatar", "Kuwait", "Oman", "Bahrain", "Singapore", "Malaysia", "United States",
  "United Kingdom", "Canada", "Australia", "Germany", "France",
];

/**
 * GET /api/integrations/geo-data?q=… — India-first state list + country
 * search for registration dropdowns. Fully static (zero runtime
 * dependency): REST Countries v1–v4 was retired and v5 needs an API key,
 * which violates this project's no-key constraint.
 */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager", "patient"]);
  if (user instanceof Response) return user;
  const parsed = geoDataQuerySchema.safeParse({ q: request.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const q = parsed.data.q.trim().toLowerCase();
  const states = INDIAN_STATES.filter((s) => !q || s.toLowerCase().includes(q));
  const countries = COUNTRIES.filter((c) => !q || c.toLowerCase().includes(q)).slice(0, 30);
  return NextResponse.json({ states, countries, cached: false, static: true });
}
