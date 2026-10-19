"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  doctorPathToReceptionist,
  resolveDoctorPanelRedirect,
} from "@/lib/auth/permissions";

/**
 * Client-side page guard for the doctor dashboard.
 *
 * The server remains the authority (every server action re-checks the
 * permission), but this prevents a staff member from *seeing* a page they
 * don't have permission for when they open the URL directly.
 *
 * The boundary rule lives in `resolveDoctorPanelRedirect` so this gate and the
 * server bounce in app/doctor/layout.tsx cannot drift apart — they used to be
 * two separate implementations, and this one omitted DOCTOR_ONLY_PATHS (audit
 * M7). Only the /receptionist URL translation stays local, because it is about
 * which prefix the browser shows rather than who may see what.
 */
export function DoctorPermissionGate({ perms, isReceptionist = false }: { perms: string[]; isReceptionist?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const target = resolveDoctorPanelRedirect(pathname, isReceptionist, new Set(perms));
    if (target === null) return;
    router.replace(isReceptionist ? doctorPathToReceptionist(target) : target);
  }, [pathname, router, perms, isReceptionist]);

  return null;
}
