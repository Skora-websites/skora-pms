import { getMySosCaseHistory } from "@/lib/dispatch/actions";
import {
  apiError,
  apiOk,
  redirectError,
  requireDoctorActor,
} from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/emergency/history — the doctor's past SOS cases
 * (FR-025).
 *
 * Doctor-only area: `/doctor/emergency` is in `DOCTOR_ONLY_PATHS`
 * (lib/auth/permissions.ts:58). Guarded with the existing
 * `requireApiDoctorOnly`, which rejects every role that is not `doctor` — so
 * a receptionist is never resolved to a linked practice owner here (the
 * audience the audit-H12 comment in lib/dispatch/actions.ts:70 warns about).
 *
 * Wraps the existing `getMySosCaseHistory` server action
 * (lib/dispatch/actions.ts:751) — the same action
 * `app/doctor/emergency/page.tsx` calls. Its own private `requireDoctor`
 * guard and `resolveDoctorId` scoping are authoritative, so neither is
 * re-implemented; any `NEXT_REDIRECT` it throws is mapped to the JSON
 * envelope. Active cases come from the existing read
 * `GET /api/doctor/sos/status`, not from this route.
 */
export async function GET() {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  try {
    const rows = await getMySosCaseHistory();
    return apiOk(rows);
  } catch (err) {
    const mapped = redirectError(err);
    if (mapped) return mapped;
    return apiError("Could not load case history", 500);
  }
}
