#!/usr/bin/env node
/**
 * Provision an API token for external consumers of /api/* endpoints (Shule).
 *
 *   node scripts/provision-api-token.mjs <user-email> [name]
 *
 * - Creates a 64-char random token, stores its SHA-256 hash in
 *   `personal_access_tokens` (Laravel Sanctum-compatible format, so the same
 *   token also authenticates against the legacy backend).
 * - Prints the plaintext token ONCE — store it in Shule's env/config now.
 *
 * The token authorizes only the API routes that opt in to bearer-token auth
 * (currently /api/shule/doctors). It never grants web-session access.
 */
import { createHash, randomBytes } from "node:crypto";
import mysql from "mysql2/promise";

const USER_MODEL = "App\\Models\\User";

const [email, tokenName = "shule-integration"] = process.argv.slice(2);
if (!email) {
  console.error("Usage: node scripts/provision-api-token.mjs <user-email> [token-name]");
  process.exit(1);
}

const db = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");

const [users] = await db.execute("SELECT id, name, role, status FROM users WHERE email = ? LIMIT 1", [email]);
const user = users[0];
if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}
if (user.status && user.status !== "active") {
  console.error(`User ${email} is not active (status: ${user.status}) — refusing to issue a token.`);
  process.exit(1);
}

const plaintext = randomBytes(48).toString("base64url").slice(0, 64);
const hashed = createHash("sha256").update(plaintext).digest("hex");

const [existing] = await db.execute(
  "SELECT id FROM personal_access_tokens WHERE tokenable_id = ? AND tokenable_type = ? AND name = ? LIMIT 1",
  [user.id, USER_MODEL, tokenName]
);
if (existing.length > 0) {
  // Rotate: replace the old token so stale copies stop working immediately.
  await db.execute("DELETE FROM personal_access_tokens WHERE id = ?", [existing[0].id]);
  console.log(`(rotated existing "${tokenName}" token for ${email})`);
}

await db.execute(
  `INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
  [USER_MODEL, user.id, tokenName, hashed, JSON.stringify(["*"])]
);

console.log(`\nToken created for ${user.name} <${email}> (role: ${user.role}, id: ${user.id})`);
console.log(`Name: ${tokenName}`);
console.log(`\nPlaintext token (shown ONCE — copy it now):\n`);
console.log(plaintext);
console.log(`\nShule should call:\n  curl -H "Authorization: Bearer ${plaintext}" http://localhost:3100/api/shule/doctors\n`);

await db.end();
