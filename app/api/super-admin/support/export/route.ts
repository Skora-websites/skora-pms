import { getAllSupportTickets } from "@/lib/queries/support";
import { getCurrentUser } from "@/lib/auth/user";
import { sanitizeSpreadsheetCell } from "@/lib/utils";

export const runtime = "nodejs";

/** GET /api/super-admin/support/export → CSV of all support tickets. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  // Platform-operator only: "admin" is the business owner (a tenant principal).
  // Admitting it here let a tenant export every ticket platform-wide.
  if (user.role !== "super_admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const tickets = await getAllSupportTickets();
  const header = ["ID", "Subject", "User", "Role", "Status", "Created At"];
  const rows = tickets.map((t) => [
    String(t.id),
    `"${sanitizeSpreadsheetCell(t.subject ?? "").replace(/"/g, '""')}"`,
    `"${sanitizeSpreadsheetCell(t.userName ?? "").replace(/"/g, '""')}"`,
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