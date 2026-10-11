import "server-only";
import { PUBLIC_API_GEO_ENABLED } from "@/lib/config";
import { assertPublicApiEnabled, fetchPublicJson, PublicApiUpstreamError } from "./client";
import { cached, cacheKey } from "./cache";

export type GeoResult = {
  lat: string;
  lon: string;
  displayName: string;
  source: "nominatim";
};

type NominatimRow = {
  lat: string;
  lon: string;
  display_name: string;
};

/** Forward-geocode a structured Indian address. No PHI beyond address text. */
export async function geocodeAddress(address: string): Promise<{ data: GeoResult[]; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_GEO_ENABLED);
  const q = address.trim().slice(0, 300);
  if (q.length < 4) throw new Error("Address too short to geocode");
  const key = cacheKey(["geo", q.slice(0, 120)]);
  return cached<GeoResult[]>(key, 30 * 24 * 3600, async () => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=in&q=${encodeURIComponent(q)}`;
    const rows = await fetchPublicJson<NominatimRow[]>("nominatim", url, {
      headers: { Referer: "https://skoracares.local/" },
    });
    return rows.map((r) => ({ lat: r.lat, lon: r.lon, displayName: r.display_name, source: "nominatim" as const }));
  });
}

export type ReverseGeo = { displayName: string; source: "nominatim" };

/** Reverse-geocode home-visit GPS coordinates to a human address. */
export async function reverseGeocode(lat: number, lon: number): Promise<{ data: ReverseGeo; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_GEO_ENABLED);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Invalid coordinates");
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("Coordinates out of range");
  const key = cacheKey(["revgeo", lat.toFixed(3), lon.toFixed(3)]);
  return cached<ReverseGeo>(key, 30 * 24 * 3600, async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const row = await fetchPublicJson<{ display_name?: string }>("nominatim", url);
    return { displayName: row.display_name ?? `${lat}, ${lon}`, source: "nominatim" as const };
  });
}

export type PincodeInfo = {
  pincode: string;
  district: string;
  state: string;
  postOffices: string[];
};

type SearchPinResponse = Array<{
  Message?: string;
  Status?: string;
  PostOffice?: Array<{ Name?: string; District?: string; State?: string }>;
}>;

/** Indian PIN lookup for patient-registration autofill. Cached 90 days. */
export async function lookupPincode(pincode: string): Promise<{ data: PincodeInfo; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_GEO_ENABLED);
  if (!/^[1-9][0-9]{5}$/.test(pincode)) throw new Error("Pincode must be 6 digits");
  const key = cacheKey(["pincode", pincode]);
  return cached<PincodeInfo>(key, 90 * 24 * 3600, async () => {
    // searchpincode.in: postal-API-compatible envelope
    // [{ Status: "Success", PostOffice: [{ Name, District, State, ... }] }]
    // CC BY 4.0 — callers must credit SearchPincode.in (see route attribution).
    const url = `https://searchpincode.in/api/pincode/${pincode}`;
    const rows = await fetchPublicJson<SearchPinResponse>("searchpincode", url);
    const first = Array.isArray(rows) ? rows[0] : undefined;
    if (!first || first.Status !== "Success" || !first.PostOffice?.length) {
      throw new PublicApiUpstreamError("searchpincode", 404, first?.Message ?? "PIN not found");
    }
    const offices = first.PostOffice;
    const postOffices = offices
      .map((o) => (o.Name ?? "").trim())
      .filter(Boolean)
      .slice(0, 10);
    return {
      pincode,
      district: (offices[0]?.District ?? "").trim(),
      state: (offices[0]?.State ?? "").trim(),
      postOffices,
    };
  });
}

export type IpGeo = { country: string; city: string; source: "ipwhois" };

/** IP -> city/country for audit-log enrichment only. Never keyed by PHI. */
export async function lookupIp(ip: string): Promise<{ data: IpGeo; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_GEO_ENABLED);
  const clean = ip.trim().slice(0, 45);
  if (!clean) throw new Error("IP required");
  const key = cacheKey(["ipgeo", clean]);
  return cached<IpGeo>(key, 7 * 24 * 3600, async () => {
    const url = `https://ipwhois.io/json/${encodeURIComponent(clean)}?fields=country,city,success`;
    const raw = await fetchPublicJson<{ country?: string; city?: string }>("ipwhois", url);
    return { country: raw.country ?? "", city: raw.city ?? "", source: "ipwhois" as const };
  });
}
