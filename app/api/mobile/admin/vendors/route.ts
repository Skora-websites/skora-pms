import { NextRequest } from "next/server";
import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import {
  apiOk,
  apiError,
  anchorDoctorId,
  resolveDoctorScope,
} from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type VendorItem = {
  id: number;
  doctorId: number;
  name: string;
  mobile: string;
  email: string;
  address: string;
  status: boolean;
  createdAt: string | null;
};

export type VendorsResponse = {
  vendors: VendorItem[];
  total: number;
};

/**
 * GET /api/mobile/admin/vendors
 * List all medical supply vendors and diagnostic laboratory partners.
 * Query params:
 *   ?search=metro
 */
export async function GET(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "doctor", "receptionist", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";

  const doctorIds = await resolveDoctorScope(user);
  const targetDoctorId = anchorDoctorId(user) || user.id;

  const scopeCond =
    doctorIds.length > 0
      ? inArray(vendors.doctorId, doctorIds)
      : eq(vendors.doctorId, targetDoctorId);

  const conditions = [scopeCond];

  if (search.length > 0) {
    conditions.push(
      or(
        like(vendors.name, `%${search}%`),
        like(vendors.mobile, `%${search}%`),
        like(vendors.email, `%${search}%`),
        like(vendors.address, `%${search}%`)
      )!
    );
  }

  const rows = await db
    .select({
      id: vendors.id,
      doctorId: vendors.doctorId,
      name: vendors.name,
      mobile: vendors.mobile,
      email: vendors.email,
      address: vendors.address,
      status: vendors.status,
      createdAt: vendors.createdAt,
    })
    .from(vendors)
    .where(and(...conditions))
    .orderBy(desc(vendors.id))
    .limit(100);

  const list: VendorItem[] = rows.map((r) => ({
    id: r.id,
    doctorId: r.doctorId,
    name: r.name,
    mobile: r.mobile,
    email: r.email,
    address: r.address,
    status: r.status ?? true,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  }));

  const response: VendorsResponse = {
    vendors: list,
    total: list.length,
  };

  return apiOk(response);
}

/**
 * POST /api/mobile/admin/vendors
 * Create or update a diagnostic laboratory or medical supply vendor.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "doctor", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const name = String(body.name ?? "").trim();
  const mobile = String(body.mobile ?? "").trim();
  const email = String(body.email ?? "").trim();
  const address = String(body.address ?? "").trim();
  const status = body.status !== undefined ? Boolean(body.status) : true;
  const vendorId = body.id ? Number(body.id) : null;

  if (!name) return apiError("Vendor name is required", 400);
  if (name.length > 255) return apiError("Vendor name must be <= 255 characters", 400);
  if (!mobile) return apiError("Mobile number is required", 400);
  if (!/^[\d+\s()-]{7,20}$/.test(mobile)) {
    return apiError("Enter a valid mobile phone number", 400);
  }
  if (!email) return apiError("Email is required", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("Enter a valid email address", 400);
  }
  if (!address) return apiError("Address is required", 400);

  const targetDoctorId = anchorDoctorId(user) || user.id;

  if (vendorId) {
    // Update existing vendor
    await db
      .update(vendors)
      .set({
        name,
        mobile,
        email,
        address,
        status,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId));

    const updated: VendorItem = {
      id: vendorId,
      doctorId: targetDoctorId,
      name,
      mobile,
      email,
      address,
      status,
      createdAt: new Date().toISOString(),
    };

    return apiOk({ vendor: updated });
  }

  // Create new vendor
  const [insertResult] = await db.insert(vendors).values({
    doctorId: targetDoctorId,
    name,
    mobile,
    email,
    address,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createdId = Number(insertResult.insertId);

  const created: VendorItem = {
    id: createdId,
    doctorId: targetDoctorId,
    name,
    mobile,
    email,
    address,
    status,
    createdAt: new Date().toISOString(),
  };

  return apiOk({ vendor: created });
}
