/**
 * Seeds the SkoraCares database with:
 *  - Spatie-compatible roles & permissions
 *  - Demo users (admin / doctor / patient / receptionist)
 *  - Master data (symptoms, examinations, diagnoses, lab tests, medicines)
 *  - Landing page CMS content (mirrors LandingPageSeeder)
 *  - Company settings, chat room, blog category + posts
 *  - Realistic demo records for the doctor dashboard
 *
 * Run with: npx tsx scripts/seed.ts
 */
import "dotenv/config";
import { db } from "../lib/db";
import {
  users,
  roles,
  permissions,
  modelHasRoles,
  roleHasPermissions,
  landingSections,
  landingItems,
  symptoms,
  examinations,
  diagnoses,
  labTests,
  medicines,
  companySettings,
  chatRooms,
  messages,
  categories,
  blogs,
  appointments,
  consultations,
  consultationMedications,
  doctorClinics,
  doctorSchedules,
  billingTypes,
  billings,
  transactions,
  incomeTypes,
  expenseTypes,
  vendors,
  tests,
} from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";

const now = () => new Date();
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  console.log("🌱 Seeding SkoraCares…");

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

  const allPermissions: number[] = [];
  for (const [moduleName, subs] of Object.entries(modules)) {
    const [parent] = await db
      .insert(permissions)
      .values({ name: moduleName, guardName: "web", createdAt: now(), updatedAt: now() });
    const parentId = Number(parent.insertId);
    allPermissions.push(parentId);
    for (const sub of subs) {
      const [r] = await db
        .insert(permissions)
        .values({
          name: sub,
          guardName: "web",
          parentId,
          createdAt: now(),
          updatedAt: now(),
        });
      allPermissions.push(Number(r.insertId));
    }
  }

  const [superAdminRole] = await db
    .insert(roles)
    .values({ name: "Super Admin", guardName: "web", createdAt: now(), updatedAt: now() });
  const [doctorRole] = await db
    .insert(roles)
    .values({ name: "Doctor", guardName: "web", createdAt: now(), updatedAt: now() });
  const [receptionistRole] = await db
    .insert(roles)
    .values({ name: "Receptionist", guardName: "web", createdAt: now(), updatedAt: now() });
  await db
    .insert(roles)
    .values({ name: "Nurse", guardName: "web", createdAt: now(), updatedAt: now() });
  const [accountantRole] = await db
    .insert(roles)
    .values({ name: "Accountant", guardName: "web", createdAt: now(), updatedAt: now() });

  await db.insert(roleHasPermissions).values(
    allPermissions.map((permissionId) => ({
      permissionId,
      roleId: Number(superAdminRole.insertId),
    }))
  );

  const findPerm = (name: string) => db.query.permissions.findFirst({ where: (p, { eq }) => eq(p.name, name) });
  const accountantPerms = ["income-expense", "income-expense-list", "income-expense-export", "billing", "billing-list", "billing-print"];
  const receptionistPerms = [
    "appointments", "appointments-list", "appointments-create",
    "billing", "billing-list", "billing-create",
    "registrations", "registrations-list", "registrations-create",
  ];

  for (const name of accountantPerms) {
    const p = await findPerm(name);
    if (p) await db.insert(roleHasPermissions).values({ permissionId: p.id, roleId: Number(accountantRole.insertId) });
  }
  for (const name of receptionistPerms) {
    const p = await findPerm(name);
    if (p) await db.insert(roleHasPermissions).values({ permissionId: p.id, roleId: Number(receptionistRole.insertId) });
  }

  // ── Users ──────────────────────────────────────────────────────────────
  const adminPassword = await hashPassword("Admin@123");
  const [admin] = await db
    .insert(users)
    .values({
      name: "Super Admin",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "super_admin",
      status: "active",
      emailVerifiedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    });
  const adminId = Number(admin.insertId);

  const [doctor] = await db
    .insert(users)
    .values({
      name: "Dr. Aarav Sharma",
      email: "doctor@gmail.com",
      password: adminPassword,
      role: "doctor",
      status: "active",
      qualification: "MBBS, MD (General Medicine)",
      registrationNumber: "DEL-MC-20451",
      salutation: "Dr.",
      emailVerifiedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    });
  const doctorId = Number(doctor.insertId);

  const [patient] = await db
    .insert(users)
    .values({
      name: "Priya Verma",
      email: "patient@gmail.com",
      password: adminPassword,
      role: "patient",
      status: "active",
      phone: "9812345670",
      gender: "female",
      dob: "1992-04-18",
      city: "Delhi",
      state: "Delhi",
      emailVerifiedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    });
  const patientId = Number(patient.insertId);

  const [receptionist] = await db
    .insert(users)
    .values({
      name: "Reception Desk",
      email: "receptionist@gmail.com",
      password: adminPassword,
      role: "receptionist",
      status: "active",
      doctorId,
      emailVerifiedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    });
  const receptionistId = Number(receptionist.insertId);

  // Extra patients for demo
  const demoPatients = [
    { name: "Rohit Malhotra", phone: "9876501234", gender: "male", dob: "1985-09-12", city: "Delhi", state: "Delhi" },
    { name: "Sneha Iyer", phone: "9876505678", gender: "female", dob: "1998-02-03", city: "Noida", state: "UP" },
    { name: "Arjun Kapoor", phone: "9876509012", gender: "male", dob: "1976-11-27", city: "Gurugram", state: "Haryana" },
    { name: "Meera Nair", phone: "9876503456", gender: "female", dob: "2001-07-08", city: "Delhi", state: "Delhi" },
  ];
  const patientIds: number[] = [patientId];
  for (const p of demoPatients) {
    const [r] = await db
      .insert(users)
      .values({ ...p, password: adminPassword, role: "patient", status: "active", doctorId, createdAt: now(), updatedAt: now() });
    patientIds.push(Number(r.insertId));
  }

  await db.insert(modelHasRoles).values([
    { roleId: Number(superAdminRole.insertId), modelType: "App\\Models\\User", modelId: adminId },
    { roleId: Number(doctorRole.insertId), modelType: "App\\Models\\User", modelId: doctorId },
    { roleId: Number(receptionistRole.insertId), modelType: "App\\Models\\User", modelId: receptionistId },
  ]);

  // Grant the Doctor role every module-level permission (demo convenience).
  const doctorPerms = await db
    .select({ id: permissions.id, name: permissions.name })
    .from(permissions);
  const doctorModulePermIds = doctorPerms
    .filter((p) => Object.keys(modules).includes(p.name))
    .map((p) => p.id);
  await db.insert(roleHasPermissions).values(
    doctorModulePermIds.map((permissionId) => ({
      permissionId,
      roleId: Number(doctorRole.insertId),
    }))
  );

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

  // ── Chat room ──────────────────────────────────────────────────────────
  const [room] = await db.insert(chatRooms).values({ name: "Doctors Group", type: "group", createdAt: now(), updatedAt: now() });
  const roomId = Number(room.insertId);

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
  await item({ sectionKey: "hero", title: "SkoraCares – Smarter Patient & Clinic Management", description: "Online Prescription Upload, Multi Clinic Management, Home Visit with Map Integration — everything your practice needs in one powerful platform.", image: "front-assets/img/banner1.png", link: "#demo", linkText: "Request a demo →", order: 0 });
  await item({ sectionKey: "hero", title: "Your Digital Backbone for Clinical Excellence", description: "From Consent Form Submission to Staff Management and Role Management — SkoraCares simplifies every step of care with multi vendor integration for lab tests.", image: "front-assets/img/banner1.png", link: "#demo", linkText: "Request a demo →", order: 1 });
  await item({ sectionKey: "hero", title: "Your digital partner for smarter, faster, personalized care.", description: "I/E Management, Ledger Feature, Follow-up Management — healthcare teams get smart digital tools to deliver efficient, personalized patient care seamlessly.", image: "front-assets/img/banner1.png", link: "#demo", linkText: "Request a demo →", order: 2 });

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
    badge: "⚙️ Explore Our Suite of Solutions", link: "tel:9217375832", linkText: "Contact Sales →", image: "front-assets/img/explore.jpeg", icon: "normal", order: 0,
    features: ["Online Prescription Upload & Consent Form Submission", "Multi Vendor Integration for Lab Tests", "Staff, Role & Profile Management", "Home Visit Management with Map Integration", "Multi Clinic Management & White Label Solution", "Ledger Feature, I/E Management & Follow Up Management"],
  });
  await item({
    sectionKey: "products", title: "Smart, Affordable & Trusted Solution",
    description: "Designed for modern healthcare professionals, our platform offers premium features at the best price. Hundreds of doctors, clinics, and healthcare businesses already trust us to streamline their daily operations and improve patient care.",
    badge: "🚀 Why Choose Us", link: "tel:9217375832", linkText: "Contact Sales →", image: "front-assets/img/choose.jpeg", icon: "reverse", order: 1,
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

  // ── Blog ────────────────────────────────────────────────────────────────
  const [cat] = await db.insert(categories).values({ name: "Clinic Management", slug: "clinic-management", createdAt: now(), updatedAt: now() });
  const catId = Number(cat.insertId);
  await db.insert(blogs).values([
    {
      categoryId: catId, title: "5 Ways Digital Prescriptions Transform Your Clinic",
      slug: "digital-prescriptions-transform-clinic", shortcontent: "Moving from paper to digital prescriptions saves time, reduces errors, and keeps records organized. Here's how.",
      content: "Digital prescriptions are no longer a luxury — they are becoming the standard of care. By switching to an electronic prescribing system, clinics eliminate illegible handwriting, reduce transcription errors, and make every medication record instantly searchable. Patients appreciate receiving a clean, legible prescription they can share with any pharmacy. Practices also gain a complete audit trail of what was prescribed, when, and by whom. In this article we explore five practical ways digital prescriptions improve daily clinic operations and patient outcomes.",
      image: null, status: true, createdAt: now(), updatedAt: now(),
    },
    {
      categoryId: catId, title: "Scheduling Home Visits with Map Integration",
      slug: "home-visits-map-integration", shortcontent: "Home visits are back — and map integration makes them precise, safe, and time-efficient for doctors.",
      content: "Home visits offer patients convenience and doctors a deeper understanding of living conditions that influence health. The challenge has always been logistics. With map-integrated scheduling, doctors can see exactly where each patient lives, cluster visits by proximity, and get turn-by-turn navigation without leaving the booking screen. Clinics can also share live visit status with patients so families know when to expect the doctor. This article walks through best practices for running a smooth home-visit service powered by location-aware scheduling.",
      image: null, status: true, createdAt: now(), updatedAt: now(),
    },
  ]);

  // ── Doctor demo records ─────────────────────────────────────────────────
  const [clinic] = await db.insert(doctorClinics).values({
    doctorId, clinicName: "SkoraCares Wellness Clinic", addressType: "manual" as never,
    address: "24, Green Park Extension, New Delhi", phone: "011-46190000",
    consultationFee: "500", isActive: true, createdAt: now(), updatedAt: now(),
  });
  const clinicId = Number(clinic.insertId);

  const daySeeds: [string, string, string, string][] = [
    ["monday", "09:00", "14:00", "morning"],
    ["monday", "16:00", "20:00", "evening"],
    ["tuesday", "09:00", "14:00", "morning"],
    ["wednesday", "09:00", "14:00", "morning"],
    ["wednesday", "16:00", "20:00", "evening"],
    ["thursday", "09:00", "14:00", "morning"],
    ["friday", "09:00", "14:00", "morning"],
    ["friday", "16:00", "20:00", "evening"],
    ["saturday", "10:00", "13:00", "morning"],
  ];
  for (const [dow, st, et, stype] of daySeeds) {
    await db.insert(doctorSchedules).values({
      doctorClinicId: clinicId, dayOfWeek: dow as never, startTime: st, endTime: et,
      sessionType: stype as never, maxPatients: 10, slotDuration: 15, gapDuration: 5,
      isActive: true, createdAt: now(), updatedAt: now(),
    });
  }

  // Chat messages (demo conversation between the doctor and the admin)
  const chatSeeds = [
    "Welcome to the Doctors Group chat! 🎉",
    "Quick reminder: the quarterly CME workshop is on Friday at 7 PM at the conference hall.",
    "Has anyone tried the new lab vendor integration for CBC reports? Much faster turnaround.",
    "Yes — results now land in the patient record within 2 hours. Highly recommended.",
    "I'll be on leave next Monday. Happy to cover any on-call patients from Tuesday onward.",
  ];
  for (let i = 0; i < chatSeeds.length; i++) {
    const t = new Date();
    t.setMinutes(t.getMinutes() - (chatSeeds.length - i) * 23);
    await db.insert(messages).values({
      chatRoomId: roomId,
      senderId: i % 2 === 0 ? adminId : doctorId,
      doctorId: i % 2 === 0 ? adminId : doctorId,
      content: chatSeeds[i],
      timestamp: t,
      createdAt: t,
      updatedAt: t,
    });
  }

  // Appointments across today / upcoming / past
  const dateStr = (d: Date) => d.toISOString().slice(0, 10);
  const apptRows: { patientId: number; date: string; time: string; caseType: string; status: string; note?: string }[] = [
    { patientId, date: dateStr(daysFromNow(0)), time: "10:00 AM", caseType: "clinical_visit", status: "confirmed" },
    { patientId: patientIds[1], date: dateStr(daysFromNow(0)), time: "11:30 AM", caseType: "home_visit", status: "pending_consent", note: "Patient requested evening visit — family will be home after 6 PM." },
    { patientId: patientIds[2], date: dateStr(daysFromNow(0)), time: "04:00 PM", caseType: "online_visit", status: "confirmed" },
    { patientId: patientIds[3], date: dateStr(daysFromNow(1)), time: "10:30 AM", caseType: "clinical_visit", status: "pending" },
    { patientId: patientIds[4], date: dateStr(daysFromNow(1)), time: "12:00 PM", caseType: "clinical_visit", status: "confirmed" },
    { patientId: patientIds[2], date: dateStr(daysFromNow(2)), time: "05:00 PM", caseType: "home_visit", status: "confirmed", note: "Post-surgery follow-up at residence." },
    { patientId, date: dateStr(daysFromNow(-3)), time: "09:30 AM", caseType: "clinical_visit", status: "completed" },
    { patientId: patientIds[2], date: dateStr(daysFromNow(-6)), time: "05:30 PM", caseType: "online_visit", status: "completed" },
    { patientId: patientIds[4], date: dateStr(daysFromNow(-8)), time: "11:00 AM", caseType: "home_visit", status: "completed", note: "Routine check-up — vitals stable." },
  ];
  const apptIds: number[] = [];
  for (const a of apptRows) {
    const [r] = await db.insert(appointments).values({
      doctorId, patientId: a.patientId, date: a.date, time: a.time,
      caseType: a.caseType as never, status: a.status as never, note: a.note ?? null, createdAt: now(), updatedAt: now(),
    });
    apptIds.push(Number(r.insertId));
  }

  // One completed consultation with medications
  const [consult] = await db.insert(consultations).values({
    patientId, doctorId, appointmentId: apptIds[6],
    consultationDate: daysFromNow(-3),
    symptomsNote: "Fever for 3 days, mild cough, body ache",
    examinationNote: "Temperature 101.2°F, throat congested",
    diagnosisNote: "Upper Respiratory Infection",
    labNote: "CBC recommended if fever persists beyond 5 days",
    medicalHistory: "No known allergies. Non-smoker.",
    medicationsNote: "Take paracetamol only after food.",
    followUpDate: daysFromNow(4).toISOString().slice(0, 10),
    followUpStatus: "pending",
    createdAt: now(), updatedAt: now(),
  });
  const consultId = Number(consult.insertId);
  await db.insert(consultationMedications).values([
    { consultationId: consultId, medicineName: "Paracetamol 500mg", dose: "1 tab", frequency: "3 times a day", whenToTake: "After food", duration: "5 days", order: 0, createdAt: now(), updatedAt: now() },
    { consultationId: consultId, medicineName: "Cetirizine 10mg", dose: "1 tab", frequency: "Once at night", whenToTake: "After food", duration: "5 days", order: 1, createdAt: now(), updatedAt: now() },
    { consultationId: consultId, medicineName: "Warm saline gargles", dose: "-", frequency: "3 times a day", whenToTake: "Anytime", duration: "5 days", order: 2, createdAt: now(), updatedAt: now() },
  ]);

  // Billing types + a bill
  const [billingType] = await db.insert(billingTypes).values({
    doctorId, name: "Consultation", defaultAmount: "500", description: "Standard OPD consultation", isActive: true, createdAt: now(), updatedAt: now(),
  });
  const billingTypeId = Number(billingType.insertId);
  await db.insert(billings).values({
    billNumber: `INV-${Date.now().toString().slice(-6)}`,
    patientId, doctorId, billingTypeId, appointmentId: apptIds[6], consultationId: consultId,
    totalAmount: "500", receivedAmount: "500", pendingAmount: "0", paymentMethod: "upi",
    status: "paid", billDate: daysFromNow(-3).toISOString().slice(0, 10), createdAt: now(), updatedAt: now(),
  });

  // Income & expense types + transactions
  const [incomeType] = await db.insert(incomeTypes).values({ name: "Consultation Fees", userId: doctorId, createdAt: now(), updatedAt: now() });
  const incomeTypeId = Number(incomeType.insertId);
  const [expenseType] = await db.insert(expenseTypes).values({ name: "Clinic Rent", userId: doctorId, createdAt: now(), updatedAt: now() });
  const expenseTypeId = Number(expenseType.insertId);

  const txSeeds: { amount: string; date: string; type: number; incomeTypeId?: number; expenseTypeId?: number; description: string }[] = [
    { amount: "3500", date: dateStr(daysFromNow(-1)), type: 1, incomeTypeId, description: "OPD consultation earnings" },
    { amount: "1200", date: dateStr(daysFromNow(-2)), type: 1, incomeTypeId, description: "Home visit fee" },
    { amount: "800", date: dateStr(daysFromNow(-3)), type: 1, incomeTypeId, description: "Online consultation" },
    { amount: "2500", date: dateStr(daysFromNow(-2)), type: 2, expenseTypeId, description: "Medical supplies" },
    { amount: "1500", date: dateStr(daysFromNow(-4)), type: 1, incomeTypeId, description: "Consultation fees" },
    { amount: "4000", date: dateStr(daysFromNow(-5)), type: 2, expenseTypeId, description: "Staff salaries advance" },
  ];
  for (const t of txSeeds) {
    await db.insert(transactions).values({
      userId: doctorId, type: t.type, incomeTypeId: t.incomeTypeId ?? null, expenseTypeId: t.expenseTypeId ?? null,
      amount: t.amount, date: t.date, status: "approved", description: t.description,
      createdBy: "Dr. Aarav Sharma", createdAt: now(), updatedAt: now(),
    });
  }

  // Vendor + test
  await db.insert(vendors).values({ doctorId, name: "PathLab Diagnostics", mobile: "9811122233", email: "info@pathlab.example", address: "Connaught Place, New Delhi", status: true, createdAt: now(), updatedAt: now() });
  await db.insert(tests).values({ doctorId, name: "Complete Blood Count", description: "CBC with ESR", price: "450", status: true, createdAt: now(), updatedAt: now() });

  console.log("✅ Seed complete.");
  console.log("   admin@gmail.com / Admin@123  → /super-admin");
  console.log("   doctor@gmail.com / Admin@123 → /doctor");
  console.log("   patient@gmail.com / Admin@123 → /patient");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
