/**
 * A forged request scope for suites that must drive `"use server"` modules
 * against a real session.
 *
 * WHY THIS EXISTS: `getCurrentUser` reads the session cookie through
 * `next/headers`, which only reaches a request scope. The Node test runner
 * cannot mock an ESM namespace export that tsx exposed as a getter, and the
 * usual replacement route (mock.module) does not exist here. So the specifier
 * is redirected here with `module.registerHooks` (see
 * lib/dispatch/__tests__/tier.test.ts for the pattern), and the suite mints a
 * REAL session: sign + persist a JWT for the fixture user through
 * `lib/auth/session.ts` and hand it to this stub. Everything downstream —
 * cookie verification, the server-side revocation row, guards, scope
 * resolution — is the production code path, not a double.
 *
 * `headers()` answers an empty bag: getClientIp only trusts a configured
 * proxy header, so it degrades to "unknown" exactly as a direct client would.
 */

/**
 * The session token the forged request carries.
 *
 * Held on `globalThis` because this file is instantiated TWICE: the suite
 * imports it through the tsx (CommonJS) loader, while the redirected
 * `next/headers` specifier is served by Node's strip-only loader — different
 * instances, different module scope. A module-level variable would be written
 * by one instance and read by the other, so the forged session silently reads
 * as anonymous (the first run of the staff suite redirected to /login).
 */
const TOKEN_KEY = "__SKORA_TEST_SESSION_TOKEN__";

/** Called by the suite before it drives an action. */
export function setSessionToken(token: string | null): void {
  (globalThis as unknown as Record<string, string | null>)[TOKEN_KEY] = token;
}

/** The cookie store Next's `cookies()` returns for a server render. */
function cookieStore() {
  const sessionToken = (globalThis as unknown as Record<string, string | null>)[TOKEN_KEY] ?? null;
  return {
    get(name: string) {
      return name === "skora_session" && sessionToken ? { name, value: sessionToken } : undefined;
    },
    getAll() {
      return sessionToken ? [{ name: "skora_session", value: sessionToken }] : [];
    },
  };
}

export function cookies() {
  return Promise.resolve(cookieStore());
}

export async function headers() {
  return { get: () => null };
}
