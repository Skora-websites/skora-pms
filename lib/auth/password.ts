import bcrypt from "bcryptjs";

/**
 * Verify a plaintext password against a hash. Compatible with Laravel's
 * bcrypt hashes ($2y$ prefix is handled transparently by bcryptjs).
 */
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Hash a password (bcrypt, cost 10 — same default as Laravel). */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
