/** MySQL/MariaDB duplicate-key detection (errno 1062 / ER_DUP_ENTRY). */
export function isDupKey(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { errno?: number; code?: string };
  return e.errno === 1062 || e.code === "ER_DUP_ENTRY";
}

/** Constraint name from a duplicate-key error's `sqlMessage` ("... for key 'users_email_unique'"), or null. */
export function dupKeyConstraint(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;
  const msg = (err as { sqlMessage?: string }).sqlMessage ?? "";
  const m = msg.match(/for key '([^']+)'/);
  return m ? m[1] : null;
}
