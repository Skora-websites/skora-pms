/* Replicate getUserPermissions(152) with app's drizzle schema (dotenv first). */
import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { permissions, modelHasPermissions, modelHasRoles, roleHasPermissions } from "@/lib/db/schema";

const USER_MODEL = "App\\Models\\User";
const userId = 152;

const permSet = new Set<string>();
const direct = await db
  .select({ name: permissions.name })
  .from(permissions)
  .innerJoin(modelHasPermissions, eq(modelHasPermissions.permissionId, permissions.id))
  .where(and(eq(modelHasPermissions.modelId, userId), eq(modelHasPermissions.modelType, USER_MODEL)));
direct.forEach((p) => permSet.add(p.name));

const roleRows = await db
  .select({ roleId: modelHasRoles.roleId })
  .from(modelHasRoles)
  .where(and(eq(modelHasRoles.modelId, userId), eq(modelHasRoles.modelType, USER_MODEL)));
const roleIds = roleRows.map((r) => r.roleId);
console.log("roleIds:", roleIds);
if (roleIds.length > 0) {
  const rolePerms = await db
    .select({ name: permissions.name })
    .from(permissions)
    .innerJoin(roleHasPermissions, eq(roleHasPermissions.permissionId, permissions.id))
    .where(inArray(roleHasPermissions.roleId, roleIds));
  rolePerms.forEach((p) => permSet.add(p.name));
}
console.log("permSet:", [...permSet]);
process.exit(0);
