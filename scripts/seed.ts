/**
 * Minimal environment seeder — reference data + one operator account.
 *
 * Seeds ONLY:
 *  - Permission catalog + role grants. Signup, staff creation and every login
 *    resolve roles/permissions BY NAME (lib/auth, app/(auth)/signup), so an
 *    empty catalog silently locks all module access.
 *  - Company settings (id 1) — read by every page via lib/queries/admin.
 *  - Starter master catalogs (symptoms / examinations / diagnoses / lab tests /
 *    medicines) — owned by the super-admin masters CRUD, seeded empty-friendly
 *    but a few rows make fresh installs usable.
 *  - Landing page CMS — the marketing homepage, pricing and doctor FAQ are all
 *    DB-driven (lib/queries/landing.ts); without rows the homepage is blank.
 *  - ONE super-admin operator account, configured through the environment:
 *      SEED_ADMIN_EMAIL  (required)
 *      SEED_PASSWORD     (required, min 8 chars)
 *
 * Deliberately NOT seeded: demo users, demo patients, demo appointments,
 * consultations, bills, transactions, chat rooms/messages, blog fixtures,
 * demo clinics/schedules/businesses. Demo records belong to a test
 * environment, never to this script.
 *
 * Idempotency: run once against a fresh database (after migrations). The
 * operator account is checked first — an existing account is reported and
 * left untouched, never deleted (a colliding real account must not be
 * destroyed). Reference rows (permissions, roles, catalogs, CMS) are inserted
 * unconditionally: re-running against an already-seeded DB fails on unique
 * keys — reset the database and re-run instead.
 *
 * Run with: npx tsx scripts/seed.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";
// The seed runs under plain Node (tsx), outside Next.js — so it builds its
// own pool from DATABASE_URL instead of importing lib/db (whose `server-only`
// guard is a build-time contract for the Next.js runtime).
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../lib/db/schema";
import {
  users,
  roles,
  permissions,
  modelHasRoles,
  roleHasPermissions,
  companySettings,
  symptoms,
  examinations,
  diagnoses,
  labTests,
  medicines,
  landingSections,
  landingItems,
} from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import { eq, inArray } from "drizzle-orm";

const now = () => new Date();

async function main() {
  const connection = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 5 });
  const db = drizzle(connection, { schema, mode: "default" });
  console.log("🌱 Seeding SkoraCares (reference data + operator account)…");

  // ── Roles & Permissions ────────────────────────────────────────────────
  const modules: Record<string, string[]> = {
    dashboard: [
      "dashboard-view",
      "dashboard-income-view",
      "dashboard-expense-view",
      "dashboard-appointments-view",
      "dashboard-billing-view",
      "dashboard-test-view",
      "dashboard-home-visit-view",
    ],
    schedule: ["schedule-list", "schedule-create", "schedule-edit", "schedule-delete"],
    registrations: [
      "registrations-list",
      "registrations-create",
      "registrations-edit",
      "registrations-delete",
    ],
    appointments: [
      "appointments-list",
      // The doctor role carries this and drizzle/0019 revokes it from that
      // role (product boundary: doctors treat, reception books). The row must
      // still exist in the catalog — the doctor-role template below validates
      // for it, and the revoke is a role grant, not a catalog entry.
      "appointments-create",
      "appointments-edit",
      "appointments-delete",
      "appointments-cancel",
      "appointments-complete",
    ],
    "income-expense": [
      "income-expense-list",
      "income-expense-create",
      "income-expense-edit",
      "income-expense-delete",
      "income-expense-approve",
      "income-expense-export",
    ],
    "home-visit": ["home-visit-list", "home-visit-create", "home-visit-edit", "home-visit-delete"],
    "test-booking": ["test-booking-list", "test-booking-create", "test-booking-edit", "test-booking-delete"],
    billing: ["billing-list", "billing-create", "billing-edit", "billing-delete", "billing-print", "billing-approve"],
    support: ["support-view"],
    chat: ["chat-view", "chat-send", "chat-delete"],
    shop: ["shop-view"],
    "follow-up": ["follow-up-list", "follow-up-status-update"],
    // Owner-parity modules gated by ADMIN_ROUTE_PERMISSIONS — the names MUST
    // exist in the catalogue or the routes are only reachable via the owner
    // role bypass (enforced by `npm run check:permissions`).
    consultations: ["consultations-view", "consultations-create", "consultations-edit", "consultations-delete"],
    "online-consultations": ["online-consultations-view", "online-consultations-create", "online-consultations-edit", "online-consultations-delete"],
    "roles-permissions": [
      "roles-permissions-view",
      "roles-create",
      "roles-edit",
      "roles-delete",
      "staff-create",
      "staff-edit",
      "staff-delete",
    ],
  };

  // Idempotent by NAME: a fresh database gets the full catalogue, while an
  // existing one (or one already migrated by drizzle/0020_permission_rows.sql,
  // which adds consultations/online-consultations) must not collide on the
  // (name, guard_name) unique index. Skip anything already present and reuse
  // its id so role grants still resolve.
  const existing = await db.select().from(permissions);
  const idByName = new Map(existing.map((p) => [p.name, p.id]));

  const allPermissions: number[] = [];
  for (const [moduleName, subs] of Object.entries(modules)) {
    let parentId = idByName.get(moduleName);
    if (parentId === undefined) {
      const [parent] = await db
        .insert(permissions)
        .values({ name: moduleName, guardName: "web", createdAt: now(), updatedAt: now() });
      parentId = Number(parent.insertId);
      idByName.set(moduleName, parentId);
    }
    allPermissions.push(parentId);

    for (const sub of subs) {
      let subId = idByName.get(sub);
      if (subId === undefined) {
        const [r] = await db
          .insert(permissions)
          .values({
            name: sub,
            guardName: "web",
            parentId,
            createdAt: now(),
            updatedAt: now(),
          });
        subId = Number(r.insertId);
        idByName.set(sub, subId);
      }
      allPermissions.push(subId);
    }
  }

  // Idempotent by NAME for the same reason as the catalog above: re-running
  // the seed (or running it after a migration that added role rows) must not
  // collide on the (name, guard_name) unique index.
  const existingRoles = await db.select().from(roles);
  const roleIdByName = new Map(existingRoles.map((r) => [r.name, r.id]));
  const ensureRole = async (name: string): Promise<number> => {
    const existingId = roleIdByName.get(name);
    if (existingId !== undefined) return existingId;
    const [r] = await db
      .insert(roles)
      .values({ name, guardName: "web", createdAt: now(), updatedAt: now() });
    const id = Number(r.insertId);
    roleIdByName.set(name, id);
    return id;
  };

  const superAdminRoleId = await ensureRole("Super Admin");
  const doctorRoleId = await ensureRole("Doctor");
  const receptionistRoleId = await ensureRole("Receptionist");
  const accountantRoleId = await ensureRole("Accountant");
  await ensureRole("Nurse");

  // Grants: only add missing pairs, never duplicate them on a re-run.
  const existingGrants = await db
    .select({ roleId: roleHasPermissions.roleId, permissionId: roleHasPermissions.permissionId })
    .from(roleHasPermissions);
  const grantKey = (r: number, p: number) => `${r}:${p}`;
  const granted = new Set(existingGrants.map((g) => grantKey(Number(g.roleId), Number(g.permissionId))));
  const toGrant = allPermissions
    .map((permissionId) => ({ permissionId, roleId: superAdminRoleId }))
    .filter((g) => !granted.has(grantKey(g.roleId, g.permissionId)));
  if (toGrant.length > 0) {
    await db.insert(roleHasPermissions).values(toGrant);
  }

  /**
   * Grant a role a set of permissions, skipping pairs already present so a
   * re-run cannot collide on the primary key. Every seed path that writes
   * role_has_permissions goes through here.
   */
  const grantedKeys = new Set(
    (
      await db
        .select({ roleId: roleHasPermissions.roleId, permissionId: roleHasPermissions.permissionId })
        .from(roleHasPermissions)
    ).map((g) => `${Number(g.roleId)}:${Number(g.permissionId)}`)
  );
  async function grantRole(roleId: number, names: string[]): Promise<void> {
    const missing = names.filter((name) => {
      const p = idByName.get(name);
      return p !== undefined && !grantedKeys.has(`${roleId}:${p}`);
    });
    if (missing.length === 0) return;
    const values = missing.map((name) => ({ permissionId: idByName.get(name)!, roleId }));
    await db.insert(roleHasPermissions).values(values);
    for (const v of values) grantedKeys.add(`${roleId}:${v.permissionId}`);
  }
  // Accountant: finance read/print only. Receptionist panel: dashboard +
  // Schedule, Registration, Appointment, Test, Follow-up only
  // (drizzle/0005_receptionist_scope.sql).
  const rolePermTemplates: [number, string[]][] = [
    [
      accountantRoleId,
      ["income-expense", "income-expense-list", "income-expense-export", "billing", "billing-list", "billing-print"],
    ],
    [
      receptionistRoleId,
      [
        "dashboard", "dashboard-view",
        "schedule", "schedule-list", "schedule-create", "schedule-edit", "schedule-delete",
        "registrations", "registrations-list", "registrations-create", "registrations-edit", "registrations-delete",
        "appointments", "appointments-list", "appointments-create", "appointments-edit", "appointments-delete", "appointments-cancel", "appointments-complete",
        "test-booking", "test-booking-list", "test-booking-create", "test-booking-edit", "test-booking-delete",
        "follow-up", "follow-up-list", "follow-up-status-update",
      ],
    ],
  ];
  for (const [roleId, names] of rolePermTemplates) {
    await grantRole(roleId, names);
  }

  // Doctor role = clinical core (D3, docs/planning/ROLE_MODEL_PLAN.md):
  // dashboard, appointments, schedule, follow-up, support. Server actions
  // check child perms ("appointments-create", "schedule-edit", …) while
  // getUserPermissions only expands child→parent, so the role must carry
  // both the parents and their action children. Every doctor created by the
  // app (signup / super-admin / clinic staff) attaches this role, so this
  // template IS the effective doctor default; super admins can grant more
  // per doctor via the permissions dialog.
  const doctorRolePerms = [
    "dashboard", "dashboard-view",
    "appointments",
    "appointments-list", "appointments-create", "appointments-edit",
    "appointments-delete", "appointments-cancel", "appointments-complete",
    "schedule",
    "schedule-list", "schedule-create", "schedule-edit", "schedule-delete",
    "follow-up", "follow-up-list", "follow-up-status-update",
    "support", "support-view",
  ];
  const doctorPerms = await db
    .select({ id: permissions.id, name: permissions.name })
    .from(permissions)
    .where(inArray(permissions.name, doctorRolePerms));
  if (doctorPerms.length !== doctorRolePerms.length) {
    throw new Error(
      `Doctor clinical-core permissions missing from catalog: found ${doctorPerms.length}/${doctorRolePerms.length}`
    );
  }
  await grantRole(doctorRoleId, doctorRolePerms);

  // ── Company settings ───────────────────────────────────────────────────
  await db.insert(companySettings).values({
    id: 1,
    companyName: "SkoraCares",
    companyShortName: "Skora",
    companyTagline: "Smarter Patient & Clinic Management",
    companyEmail1: "info@skoracares.com",
    companyMobile1: "+91 9217375831",
    companyWhatsapp1: "+91 9217375832",
    currencyName: "INR",
    currencySymbol: "₹",
    defaultTrialDays: 15,
    createdAt: now(),
    updatedAt: now(),
  });

  // ── Master data ────────────────────────────────────────────────────────
  const symptomNames = ["Fever", "Cough", "Headache", "Fatigue", "Nausea", "Body Ache", "Sore Throat", "Dizziness"];
  const examNames = ["General Examination", "Cardiovascular", "Respiratory", "Abdominal", "Neurological", "ENT", "Ophthalmic"];
  const diagnosisNames = ["Hypertension", "Type 2 Diabetes", "Viral Fever", "Migraine", "Gastroenteritis", "Upper Respiratory Infection", "Anemia", "Arthritis"];
  const labTestNames = ["CBC", "Blood Sugar (Fasting)", "Lipid Profile", "Liver Function Test", "Kidney Function Test", "Thyroid Profile", "Urine Analysis", "HbA1c"];
  const medicineNames = ["Paracetamol 500mg", "Amoxicillin 500mg", "Omeprazole 20mg", "Cetirizine 10mg", "Metformin 500mg", "Amlodipine 5mg", "Azithromycin 250mg", "Vitamin D3 60K"];

  for (const name of symptomNames) await db.insert(symptoms).values({ name, createdAt: now(), updatedAt: now() });
  for (const name of examNames) await db.insert(examinations).values({ name, createdAt: now(), updatedAt: now() });
  for (const name of diagnosisNames) await db.insert(diagnoses).values({ name, createdAt: now(), updatedAt: now() });
  for (const name of labTestNames) await db.insert(labTests).values({ name, createdAt: now(), updatedAt: now() });
  for (const name of medicineNames) await db.insert(medicines).values({ name, createdAt: now(), updatedAt: now() });

  // ── Landing page CMS (mirrors LandingPageSeeder) ───────────────────────
  const section = (
    key: string,
    name: string,
    title?: string | null,
    subtitle?: string | null,
    metadata?: object
  ) =>
    db.insert(landingSections).values({
      key,
      name,
      title: title ?? null,
      subtitle: subtitle ?? null,
      metadata: metadata as never,
      createdAt: now(),
      updatedAt: now(),
    });
  const item = (v: Omit<typeof landingItems.$inferInsert, "createdAt" | "updatedAt">) =>
    db.insert(landingItems).values({ ...v, createdAt: now(), updatedAt: now() });

  await section("hero", "Hero Slider");
  await item({ sectionKey: "hero", title: "SkoraCares – Smarter Patient & Clinic Management", description: "Online Prescription Upload, Multi Clinic Management, Home Visit with Map Integration — everything your practice needs in one powerful platform.", link: "#demo", linkText: "Request a demo →", order: 0 });
  await item({ sectionKey: "hero", title: "Your Digital Backbone for Clinical Excellence", description: "From Consent Form Submission to Staff Management and Role Management — SkoraCares simplifies every step of care with multi vendor integration for lab tests.", link: "#demo", linkText: "Request a demo →", order: 1 });
  await item({ sectionKey: "hero", title: "Your digital partner for smarter, faster, personalized care.", description: "I/E Management, Ledger Feature, Follow-up Management — healthcare teams get smart digital tools to deliver efficient, personalized patient care seamlessly.", link: "#demo", linkText: "Request a demo →", order: 2 });

  await section("features", "Platform Features", "Everything Your Clinic Needs", "Purpose-built tools for modern healthcare professionals — from solo practitioners to multi-branch hospitals.", { badge: "Platform Features" });
  const features: [string, string, string][] = [
    ["📋", "Online Prescription Upload", "Submit and manage prescriptions digitally for faster, error-free dispensing and retrieval."],
    ["✍️", "Consent Form Submission", "Collect and store patient consent forms electronically with full compliance and audit trails."],
    ["🧪", "Multi Vendor Lab Tests", "Seamlessly integrate with multiple lab vendors to order tests and receive results in one place."],
    ["👥", "Staff Management", "Manage your entire team — schedules, roles, access permissions — from a single dashboard."],
    ["📦", "I/E Management", "Track inventory and expenses efficiently to keep your clinic operations running smoothly."],
    ["📍", "Home Visit with Map Integration", "Schedule and track home visits with live map integration for accurate, timely care delivery."],
    ["🏥", "Multi Clinic Management", "Operate and oversee multiple clinic locations from one unified, centralized platform."],
    ["📱", "Role Management", "Define granular access roles for doctors, staff, and admins to keep your data secure."],
    ["🔐", "White Label", "Launch under your own brand identity with full white-label customization options available."],
    ["📒", "Ledger Feature", "Maintain transparent financial records and patient accounts with a built-in ledger system."],
    ["🔔", "Follow-up Management", "Never miss a follow-up — automate reminders and track patient follow-up schedules easily."],
    ["📁", "Patient Record", "Store and manage complete patient information securely in one place. Access medical history, prescription, lab reports, and treatment notes anytime, anywhere."],
  ];
  features.forEach((f, i) => item({ sectionKey: "features", icon: f[0], title: f[1], description: f[2], order: i }));

  await section("how_it_works", "How It Works", "Get Started in 4 Simple Steps", "From signup to fully operational in under a day — no IT team required.", { badge: "How It Works" });
  const steps: [string, string][] = [
    ["Create Your Account", "Sign up in 2 minutes. No credit card needed for the free trial."],
    ["Set Up Your Clinic", "Add your doctors, departments, schedule, and branding easily."],
    ["Add Patient Data", "Easily add new patient details or import existing records in just a few clicks."],
    ["Go Live & Grow", "Start seeing patients digitally and watch your efficiency soar."],
  ];
  steps.forEach((s, i) => item({ sectionKey: "how_it_works", title: s[0], description: s[1], badge: String(i + 1), order: i }));

  await section("products", "Core Products", "Explore Our Suite of Solutions", null, { badge: "Core Products" });
  await item({
    sectionKey: "products", title: "All-in-One Healthcare Management Platform",
    description: "Manage your complete healthcare operations with a powerful and easy-to-use platform. From patient records and prescriptions to staff management, billing, home visits, and multi-clinic operations — everything is available in one smart dashboard.",
    badge: "⚙️ Explore Our Suite of Solutions", link: "tel:9217375832", linkText: "Contact Sales →", icon: "normal", order: 0,
    features: ["Online Prescription Upload & Consent Form Submission", "Multi Vendor Integration for Lab Tests", "Staff, Role & Profile Management", "Home Visit Management with Map Integration", "Multi Clinic Management & White Label Solution", "Ledger Feature, I/E Management & Follow Up Management"],
  });
  await item({
    sectionKey: "products", title: "Smart, Affordable & Trusted Solution",
    description: "Designed for modern healthcare professionals, our platform offers premium features at the best price. Hundreds of doctors, clinics, and healthcare businesses already trust us to streamline their daily operations and improve patient care.",
    badge: "🚀 Why Choose Us", link: "tel:9217375832", linkText: "Contact Sales →", icon: "reverse", order: 1,
    features: ["PMS Complimentary for Existing Customers", "Affordable Paid PMS Plans Available", "30 Days Free Trial", "Easy to Use Interface", "Highest Features at Lowest Price", "24×7 Training & Support"],
  });

  await section("testimonials", "Testimonials", "Loved by Doctors Across India", "Here's what healthcare professionals say after switching to SkoraCares.", { badge: "Testimonials" });
  await item({ sectionKey: "testimonials", stars: 5, description: "SkoraCares helped me improve my clinic's online presence with professional SEO and Google My Business management. My clinic now ranks better locally, and I have seen a steady increase in appointments. Excellent service and support.", title: "RS", linkText: "Dr. Ranjit Singh", link: "General Physician, Delhi", order: 0 });
  await item({ sectionKey: "testimonials", stars: 5, description: "As a doctor, I wanted a marketing company that understands patient trust and ethics. SkoraCares delivered exactly that. Their campaigns are professional, transparent, and focused on quality patient leads.", title: "PM", linkText: "Dr. Priya Mehta", link: "Pediatrician, Mumbai", badge: "linear-gradient(135deg,#00c9a7,#0a6e8a)", order: 1 });
  await item({ sectionKey: "testimonials", stars: 5, description: "If you are a doctor looking for reliable digital marketing support, SkoraCares is the right choice. They know how to generate patient leads ethically while improving online visibility and reputation.", title: "AK", linkText: "Dr. Anil Kumar", link: "Cardiologist, Bengaluru", badge: "linear-gradient(135deg,#533ab7,#0a6e8a)", order: 2 });

  await section("pricing", "Pricing", "Simple, Transparent Pricing", "No hidden fees. No per-patient charges. Just one flat monthly price for your entire clinic.", { badge: "Pricing", monthly_label: "Monthly", yearly_label: "Yearly", discount_badge: "Save 16.6%" });
  const planFeatures = (users: string, multiVendor: boolean, roleMgmt: boolean, gmb: boolean, landing: string) => [
    { name: `${users} User${users === "1" ? "" : "s"}`, included_monthly: true, included_yearly: true },
    { name: "OPD Management", included_monthly: true, included_yearly: true },
    { name: "Staff Management", included_monthly: true, included_yearly: true },
    { name: "Appointment Management", included_monthly: true, included_yearly: true },
    { name: "Billing System Integrated", included_monthly: true, included_yearly: true },
    { name: "Comprehensive Patient Record", included_monthly: true, included_yearly: true },
    { name: "Digital Prescription", included_monthly: true, included_yearly: true },
    { name: "Ledger Management", included_monthly: true, included_yearly: true },
    { name: "Online/Offline Consultation", included_monthly: true, included_yearly: true },
    { name: "Multi Clinic Management", included_monthly: true, included_yearly: true },
    { name: "Multi Vendor for Lab Test", included_monthly: multiVendor, included_yearly: multiVendor },
    { name: "Role Management", included_monthly: roleMgmt, included_yearly: roleMgmt },
    { name: "GMB Optimization", included_monthly: gmb, included_yearly: gmb },
    { name: "Landing Page", included_monthly: false, included_yearly: true, text_monthly: landing, text_yearly: landing },
  ];
  await item({ sectionKey: "pricing", title: "Package 1", priceMonthly: "799", priceYearly: "7990", priceOriginalYearly: "9588", features: planFeatures("1", false, false, false, "Landing Page"), linkText: "Get Started", link: "#", order: 0 });
  await item({ sectionKey: "pricing", title: "Package 2", priceMonthly: "1299", priceYearly: "12990", priceOriginalYearly: "15588", features: planFeatures("3", true, true, true, "Static Pages"), badge: "✦ Most Popular", linkText: "Get Started", link: "#", order: 1 });
  await item({ sectionKey: "pricing", title: "Package 3", priceMonthly: "2499", priceYearly: "24990", priceOriginalYearly: "29988", features: planFeatures("5", true, true, true, "Dynamic Pages"), linkText: "Get Started", link: "#", order: 2 });

  await section("faq", "FAQ", "Frequently Asked Questions", "Still have questions? We're here to help.", { badge: "FAQ", contact_btn_text: "Contact Support", contact_btn_link: "/contact" });
  const faqs: [string, string, string][] = [
    ["What is this healthcare management system?", "This platform is a digital healthcare management system designed to streamline patient records, doctor information, appointments, and medical history in one secure place.", "open"],
    ["How can I register as a patient?", "You can register by filling out the patient registration form with your basic details such as name, contact number, email, and medical information.", ""],
    ["Can I book appointments online?", "Yes, patients can easily book appointments with doctors through the platform by selecting their preferred date and time.", ""],
    ["Can I get digital prescriptions?", "Yes, doctors can generate and share digital prescriptions which can be viewed and downloaded by patients anytime.", ""],
    ["How do doctors manage their profiles?", "Doctors can update their profile details, specialization, availability, and consultation timings through their dashboard", ""],
  ];
  faqs.forEach((f, i) => item({ sectionKey: "faq", title: f[0], description: f[1], badge: f[2], order: i }));

  await section("cta", "CTA Banner", "Ready to Transform Your Clinic?", "Join 2,000+ healthcare providers who've already made the switch. Start your free 14-day trial.", { primary_btn_text: "Start Free Trial", primary_btn_link: "/contact", secondary_btn_text: "Request a Demo", secondary_btn_link: "#demo" });

  // ── Operator account (one super admin, from env) ───────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.SEED_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_PASSWORD must be set — the seed creates exactly one operator account and ships no credentials."
    );
  }
  if (adminPassword.length < 8) {
    throw new Error("SEED_PASSWORD must be at least 8 characters.");
  }

  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  if (existingAdmin) {
    console.log(`ℹ️  Operator account ${adminEmail} already exists (id ${existingAdmin.id}) — left untouched.`);
  } else {
    const [admin] = await db
      .insert(users)
      .values({
        name: "Super Admin",
        email: adminEmail,
        password: await hashPassword(adminPassword),
        role: "super_admin",
        status: "active",
        emailVerifiedAt: now(),
        createdAt: now(),
        updatedAt: now(),
      });
    await db.insert(modelHasRoles).values({
      roleId: superAdminRoleId,
      modelType: "App\\Models\\User",
      modelId: Number(admin.insertId),
    });
    console.log(`✅ Operator account created: ${adminEmail}`);
  }

  await connection.end();
  console.log("🌱 Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
