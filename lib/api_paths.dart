/// The `/api/mobile/*` contract.
///
/// Both sides of the wire live in this repo — the Next.js routes under
/// `app/api/mobile/**` and the Flutter client under `lib/*.dart` — so the paths
/// are declared once here instead of being duplicated as string literals on
/// each side. Renaming a route is now a compile error on the client rather than
/// a 404 discovered at runtime.
library;

/// POST — exchange credentials for a session token.
///
/// Request:  `{ "email": string, "password": string }`
/// Response: `{ "sessionToken": string, "maxAgeSeconds": number,
///             "user": { id, email, role } }`
/// Errors:   400 invalid body · 401 invalid credentials · 403 inactive · 429 limited
const kMobileLoginPath = '/api/mobile/login';

/// Path segments under `/api/mobile/sos`.
///
///   trigger   POST { latitude, longitude, radiusKm?, complaint?, notes? }
///             -> { requestId }
///   location  POST /{id}/location { latitude, longitude } -> { ok, etaMinutes? }
///   cancel    POST /{id}/cancel                            -> { ok }
const kMobileSosRoot = '/api/mobile/sos';

/// `…/sos/<requestId>` — the id-scoped sub-path.
String mobileSosRequest(int requestId) => '$kMobileSosRoot/$requestId';

/// `…/sos/<requestId>/location`
String mobileSosLocation(int requestId) => '${mobileSosRequest(requestId)}/location';

/// `…/sos/<requestId>/cancel`
String mobileSosCancel(int requestId) => '${mobileSosRequest(requestId)}/cancel';

/// The patient status endpoint, shared with the web app.
///
/// `…/status/<requestId>` -> live dispatch state including the SOS parity
/// fields (etaMinutes, distanceKm, arrivedAt, otpVerifiedAt, rating,
/// billingId, fare). Deliberately carries no OTP: only the doctor's panel
/// ever holds the plaintext code.
String patientSosStatus(int requestId) => '/api/patient/sos/status/$requestId';
