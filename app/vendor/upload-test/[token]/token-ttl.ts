/**
 * Vendor upload-link lifetime (audit F-11).
 *
 * The upload link used to be non-expiring: whoever held the token could
 * read booking identity (doctor/vendor/patient names, test list) and submit
 * a clinical document forever, with no revocation short of regenerating.
 * The token is now time-bounded — anchored on the booking's `updatedAt`,
 * which is written at booking creation AND reset by
 * `regenerateUploadLink`, so a doctor can always re-arm a stale link.
 *
 * Window mirrors the consent-link TTL (7 days).
 */
export const VENDOR_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** True when a booking's upload link has aged past the window. */
export function isVendorTokenExpired(updatedAt: Date | string | null): boolean {
  // No timestamp → age unprovable → fail closed.
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > VENDOR_TOKEN_TTL_MS;
}
