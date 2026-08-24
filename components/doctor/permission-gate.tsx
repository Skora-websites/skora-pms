"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  doctorPermissionForPath,
  firstPermittedDoctorPath,
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
export function DoctorPermissionGate({ perms }: { perms: string[] }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const permSet = new Set(perms);
    const required = doctorPermissionForPath(pathname);
    if (required === null) return;
    if (!permSet.has(required)) {
      router.replace(firstPermittedDoctorPath(permSet));
    }
  }, [pathname, router, perms]);

  return null;
}
