"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  doctorPathToReceptionist,
  doctorPermissionForPath,
  firstPermittedDoctorPath,
  receptionistPathToDoctor,
} from "@/lib/auth/permissions";

/**
 * Client-side page guard for the doctor dashboard.
 *
 * The server remains the authority (every server action re-checks the
 * permission), but this prevents a staff member from *seeing* a page they
 * don't have permission for when they open the URL directly. Users without
 * the required module permission are redirected to their first permitted
 * page.
 */
export function DoctorPermissionGate({ perms, isReceptionist = false }: { perms: string[]; isReceptionist?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const permSet = new Set(perms);
    // Under /receptionist/* the proxy rewrites onto /doctor/* — usePathname()
    // reports the browser URL, so translate before matching route perms.
    const internalPath = isReceptionist ? receptionistPathToDoctor(pathname) : pathname;
    const required = doctorPermissionForPath(internalPath);
    if (required === null) return;
    if (!permSet.has(required)) {
      const target = firstPermittedDoctorPath(permSet);
      router.replace(isReceptionist ? doctorPathToReceptionist(target) : target);
    }
  }, [pathname, router, perms, isReceptionist]);

  return null;
}
