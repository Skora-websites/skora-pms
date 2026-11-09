import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret } from "../crypto";

test("round trip is stable", () => {
  const enc = encryptSecret("smtp-p@ssw0rd");
  assert.ok(enc.startsWith("skc1:"));
  assert.equal(decryptSecret(enc), "smtp-p@ssw0rd");
});
test("two encryptions of the same plaintext differ (random IV)", () => {
  assert.notEqual(encryptSecret("same"), encryptSecret("same"));
});
test("legacy plain values pass through untouched", () => {
  assert.equal(decryptSecret("plainvalue"), "plainvalue");
  assert.equal(decryptSecret(null), "");
});
test("tampered ciphertext never decrypts", () => {
  const enc = encryptSecret("secret");
  const tampered = "skc1:" + Buffer.from(enc.slice(6), "base64").map((b,i)=> i===0 ? b^1 : b).toString("base64");
  assert.equal(decryptSecret(tampered), "");
});
