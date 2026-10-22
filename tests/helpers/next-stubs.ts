/**
 * Stand-ins for the two `next/*` modules the app's server actions import.
 *
 * WHY THIS EXISTS: under the `react-server` export condition the test runner
 * needs (the app's database layer is `server-only` guarded), `next/navigation`
 * and `next/cache` resolve to Next's TypeScript source. tsx compiles that to
 * CommonJS, where React's react-server build has no default export, and the
 * import dies with `_react.default.createContext is not a function`. This
 * runtime also ships no `mock.module` (node:test's mock tracker exposes
 * `method`, `fn`, `timers` — not `module`), so the usual replacement route is
 * closed too.
 *
 * `lib/dispatch/__tests__/tier.test.ts` redirects both specifiers here with
 * `module.registerHooks`, which lets the real action modules load. The stub
 * keeps the one contract the guards depend on: `redirect` never returns — it
 * throws a signal carrying the destination, exactly like Next's own redirect.
 *
 * Also usable by any future suite that must drive a `"use server"` module.
 */

/** The redirect signal Next throws from `redirect()`; this stub mirrors it. */
export class Redirected extends Error {
  readonly target: string;

  constructor(target: string) {
    super(`NEXT_REDIRECT:${target}`);
    this.name = "Redirected";
    this.target = target;
  }
}

/** Throw the redirect signal instead of returning, mirroring `next/navigation`. */
export function redirect(target: string): never {
  throw new Redirected(target);
}

/** Cache invalidation is a no-op without a Next runtime. */
export function revalidatePath(): void {}

/** Cache invalidation is a no-op without a Next runtime. */
export function revalidateTag(): void {}

/**
 * Request-bound readers. The suites that redirect modules here mock the
 * session reader, so these must never be reached — if one is, the test is
 * silently talking to a live request scope it does not have.
 */
export function cookies(): never {
  throw new Error("cookies() reached in a test: the session reader must be mocked");
}

export function headers(): never {
  throw new Error("headers() reached in a test: the request scope must be mocked");
}
