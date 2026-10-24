/**
 * Who may buy a package, and WHICH user row the purchase credits.
 *
 * `users.package_id` / `users.trial_ends_at` live on a DOCTOR row: a plan
 * belongs to a practice, and a practice is anchored at its doctor (see
 * lib/queries/packages.ts). Before this module the buyer and the credited
 * user were the same person, which made the owner tier unable to renew at
 * all — an `admin` never appeared in the checkout routes.
 *
 * Rules:
 *  - A `doctor` buys their own practice: target = self.
 *  - An `admin` (business owner) buys for their practice: target = the
 *    practice anchor doctor, the SAME convention `requireWriteScope` uses
 *    for the admin tier (scope.doctorIds[0]), so the plan that governs the
 *    owner's writes is the plan the owner pays for.
 *  - Every other tier is refused at the route; `manager` users are included
 *    in neither set (purchase is owner-gated like /admin/settings, while a
 *    clinic manager may still see the practice state).
 *
 * `mayCreditUserIds` is the fulfillment binding: the browser checkout
 * callback may only mark paid a payment whose credited user is one of
 * these ids (audit F-14, in set form because the buyer is no longer always
 * the credited user).
 */

export function resolvePlanPurchaseTarget(input: {
  role: string;
  userId: number;
  /** Doctor ids of the caller's business (admin tier only). */
  businessDoctorIds: number[];
}): { targetUserId: number | null; mayCreditUserIds: number[] } {
  const businessDoctors = [...new Set(input.businessDoctorIds)].filter(
    (id) => Number.isInteger(id) && id > 0
  );

  if (input.role === "doctor") {
    return { targetUserId: input.userId, mayCreditUserIds: [input.userId] };
  }
  if (input.role === "admin") {
    return { targetUserId: businessDoctors[0] ?? null, mayCreditUserIds: businessDoctors };
  }
  return { targetUserId: null, mayCreditUserIds: [] };
}

/**
 * Checkout binding: may this caller fulfill a payment credited to
 * `paymentUserId`? An absent list means "no session" (webhook only) and is
 * never produced by the checkout route.
 */
export function mayFulfillForUser(
  paymentUserId: number,
  mayCreditUserIds: number[] | undefined
): boolean {
  if (mayCreditUserIds === undefined) return true;
  return mayCreditUserIds.includes(paymentUserId);
}
