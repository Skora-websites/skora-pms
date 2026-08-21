import { getAllSupportTickets } from "@/lib/queries/support";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/** GET /api/super-admin/support/export → CSV of all support tickets. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!["super_admin", "admin"].includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const tickets = await getAllSupportTickets();
  const header = ["ID", "Subject", "User", "Role", "Status", "Created At"];
  const rows = tickets.map((t) => [
    String(t.id),
    `"${(t.subject ?? "").replace(/"/g, '""')}"`,
    `"${(t.userName ?? "").replace(/"/g, '""')}"`,
    t.userRole ?? "",
    t.status ?? "",
    t.createdAt ? new Date(t.createdAt).toISOString() : "",
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="support_tickets_${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}