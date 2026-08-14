"use server";

import { redirect } from "next/navigation";
import { destroySession, getSessionUserId } from "@/lib/auth/session";
import { audit } from "@/lib/security/audit-log";

export async function logoutAction() {
  const userId = await getSessionUserId();
  await destroySession();
  if (userId) await audit.logout(userId);
  redirect("/");
}
