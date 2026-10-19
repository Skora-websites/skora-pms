import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminTier } from "@/lib/auth/guard";
import { getCurrentUser, getUserPermissions } from "@/lib/auth/user";
import { EmptyState } from "@/components/ui/dashboard-ui";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = { title: "No access · Business" };

/**
 * Where a module-less manager lands.
 *
 * `requireAdminTier` used to send them to `redirect("/")` — the public
 * marketing home page, with no explanation of why the dashboard was
 * unavailable (audit L5). An admin-scoped empty state is the honest answer.
 */
export default async function AdminNoAccessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Only the admin tier belongs here; anyone else goes to their own home.
  if (user.role !== "manager" && user.role !== "admin") redirect("/");

  // Pass NO pathname: this route maps to the /admin prefix, whose `dashboard`
  // perm a module-less manager by definition lacks — so the guard would send
  // them back to /admin, which sends them here again. The tier check (role,
  // session) is still enforced; the module check is what this page exists to
  // answer, and it does so explicitly below.
  await requireAdminTier();

  // An owner always has access, so this page is only meaningful for managers.
  if (user.role === "admin") redirect("/admin");

  const perms = await getUserPermissions(user.id);
  if (perms.size > 0) redirect("/admin");

  return (
    <EmptyState
      icon={ShieldAlert}
      title="No modules yet"
      description="Your account has not been granted any dashboard modules. Ask the business owner to assign the modules you need — then this dashboard becomes available."
    />
  );
}
