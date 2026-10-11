import "server-only";
import { PUBLIC_API_VALIDATION_ENABLED } from "@/lib/config";
import { assertPublicApiEnabled, fetchPublicJson } from "./client";
import { cached, cacheKey } from "./cache";

export type EmailVerdict = "valid" | "risky" | "invalid";

export type EmailCheck = {
  email: string;
  verdict: EmailVerdict;
  reason: string;
  source: string;
};

function isDisposableDomain(domain: string): boolean {
  // Small built-in blocklist so signup still guards when upstreams are down.
  const known = new Set([
    "mailinator.com",
    "guerrillamail.com",
    "10minutemail.com",
    "tempmail.com",
    "throwawaymail.com",
    "yopmail.com",
  ]);
  return known.has(domain.toLowerCase());
}

type EvaResponse = { valid?: boolean; disposable?: boolean; reason?: string };
type DisifyResponse = { disposable?: boolean; dns?: boolean };

/**
 * Email deliverability guard for signup/patient-create.
 * invalid (bad MX/syntax) should block; risky (disposable/role) warns only.
 * Email is hashed into the cache key; raw address is never logged.
 */
export async function checkEmail(email: string): Promise<{ data: EmailCheck; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_VALIDATION_ENABLED);
  const clean = email.trim().toLowerCase().slice(0, 255);
  const m = clean.match(/^[^@\s]+@([^@\s]+\.[^@\s]+)$/);
  if (!m) {
    return { data: { email: clean, verdict: "invalid", reason: "Invalid email format", source: "local" }, cached: false };
  }
  const domain = m[1];
  if (isDisposableDomain(domain)) {
    return { data: { email: clean, verdict: "risky", reason: "Disposable domain", source: "local" }, cached: false };
  }
  const key = cacheKey(["email", clean]);
  return cached<EmailCheck>(key, 30 * 24 * 3600, async () => {
    // EVA first (syntax/MX/disposable), Disify as disposable cross-check.
    try {
      const eva = await fetchPublicJson<EvaResponse>(
        "eva",
        `https://api.eva.pingutil.com/email?email=${encodeURIComponent(clean)}`
      );
      if (eva.valid === false) {
        return { email: clean, verdict: "invalid" as const, reason: eva.reason ?? "Undeliverable", source: "eva" };
      }
      if (eva.disposable) {
        return { email: clean, verdict: "risky" as const, reason: "Disposable address", source: "eva" };
      }
      try {
        const dis = await fetchPublicJson<DisifyResponse>(
          "disify",
          `https://www.disify.com/api/email/${encodeURIComponent(clean)}`
        );
        if (dis.disposable) {
          return { email: clean, verdict: "risky" as const, reason: "Disposable address", source: "disify" };
        }
      } catch {
        // Disify is advisory only.
      }
      return { email: clean, verdict: "valid" as const, reason: "Deliverable", source: "eva" };
    } catch {
      // Upstream down → local verdict so signup is never blocked by us.
      return { email: clean, verdict: "valid" as const, reason: "Validation unavailable", source: "local-fallback" };
    }
  });
}

export type NameHint = { name: string; kind: "age" | "gender" | "nationality"; label: string };

/** Optional demographics hints for analytics only — never clinical facts. */
export async function hintName(name: string, kind: "age" | "gender" | "nationality"): Promise<{ data: NameHint; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_VALIDATION_ENABLED);
  const first = name.trim().split(/\s+/)[0]?.slice(0, 50) ?? "";
  if (!first) throw new Error("Name required");
  const key = cacheKey(["namehint", kind, first]);
  return cached<NameHint>(key, 30 * 24 * 3600, async () => {
    try {
      if (kind === "age") {
        const r = await fetchPublicJson<{ age?: number }>("agify", `https://api.agify.io?name=${encodeURIComponent(first)}`);
        return { name: first, kind, label: typeof r.age === "number" ? `Estimated age ${r.age}` : "No estimate" };
      }
      if (kind === "gender") {
        const r = await fetchPublicJson<{ gender?: string; probability?: number }>(
          "genderize",
          `https://api.genderize.io?name=${encodeURIComponent(first)}`
        );
        return { name: first, kind, label: r.gender ? `${r.gender} (${Math.round((r.probability ?? 0) * 100)}%)` : "No estimate" };
      }
      const r = await fetchPublicJson<{ country?: Array<{ country_id?: string; probability?: number }> }>(
        "nationalize",
        `https://api.nationalize.io?name=${encodeURIComponent(first)}`
      );
      const top = r.country?.[0];
      return { name: first, kind, label: top?.country_id ? `${top.country_id} (${Math.round((top.probability ?? 0) * 100)}%)` : "No estimate" };
    } catch {
      return { name: first, kind, label: "Estimate unavailable" };
    }
  });
}
