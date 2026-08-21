import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  longtext,
  mediumtext,
  int,
  tinyint,
  bigint,
  decimal,
  boolean,
  json,
  date,
  datetime,
  timestamp,
  time,
  index,
  uniqueIndex,
  primaryKey,
  foreignKey,
  mysqlSchema,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Auth / Framework tables (Laravel-compatible)
// ─────────────────────────────────────────────────────────────────────────────

export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    referenceRoleId: bigint("reference_role_id", { mode: "number" }),
    doctorId: bigint("doctor_id", { mode: "number" }),
    name: varchar("name", { length: 255 }).notNull(),
    qualification: varchar("qualification", { length: 255 }),
    registrationNumber: varchar("registration_number", { length: 255 }),
    registrationId: varchar("registration_id", { length: 255 }),
    role: mysqlEnum("role", [
      "admin",
      "super_admin",
      "doctor",
      "patient",
      "receptionist",
    ])
      .default("patient")
      .notNull(),
    email: varchar("email", { length: 255 }),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),
    profilePhotoPath: varchar("profile_photo_path", { length: 2048 }),
    signaturePath: varchar("signature_path", { length: 2048 }),
    notificationPreferences: json("notification_preferences"),
    address: varchar("address", { length: 255 }),
    gender: varchar("gender", { length: 255 }),
    referredBy: varchar("referred_by", { length: 200 }),
    dob: varchar("dob", { length: 50 }),
    pincode: int("pincode"),
    state: varchar("state", { length: 100 }),
    city: varchar("city", { length: 100 }),
    streetAddress: varchar("street_address", { length: 100 }),
    latitude: varchar("latitude", { length: 255 }),
    longitude: varchar("longitude", { length: 255 }),
    status: varchar("status", { length: 255 }).default("active"),
    emailVerifiedAt: timestamp("email_verified_at"),
    rememberToken: varchar("remember_token", { length: 100 }),
    currentTeamId: bigint("current_team_id", { mode: "number" }),
    twoFactorSecret: text("two_factor_secret"),
    twoFactorRecoveryCodes: text("two_factor_recovery_codes"),
    twoFactorConfirmedAt: timestamp("two_factor_confirmed_at"),
    salutation: varchar("salutation", { length: 50 }),
    aadhaarNo: varchar("aadhaar_no", { length: 12 }),
    trialEndsAt: timestamp("trial_ends_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    uniqueIndex("users_registration_id_unique").on(t.registrationId),
    index("users_reference_role_id_foreign").on(t.referenceRoleId),
    index("users_doctor_id_foreign").on(t.doctorId),
    foreignKey({
      columns: [t.referenceRoleId],
      foreignColumns: [t.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [t.id],
    }).onDelete("set null"),
  ]
);

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  email: varchar("email", { length: 255 }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
});

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    payload: longtext("payload").notNull(),
    lastActivity: int("last_activity").notNull(),
  },
  (t) => [index("sessions_user_id_index").on(t.userId), index("sessions_last_activity_index").on(t.lastActivity)]
);

export const cache = mysqlTable("cache", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: mediumtext("value").notNull(),
  expiration: int("expiration").notNull(),
});

export const cacheLocks = mysqlTable("cache_locks", {
  key: varchar("key", { length: 255 }).primaryKey(),
  owner: varchar("owner", { length: 255 }).notNull(),
  expiration: int("expiration").notNull(),
});

export const jobs = mysqlTable(
  "jobs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    queue: varchar("queue", { length: 255 }).notNull(),
    payload: longtext("payload").notNull(),
    attempts: tinyint("attempts").notNull(),
    reservedAt: int("reserved_at"),
    availableAt: int("available_at").notNull(),
    createdAt: int("created_at").notNull(),
  },
  (t) => [index("jobs_queue_index").on(t.queue)]
);

export const jobBatches = mysqlTable("job_batches", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  totalJobs: int("total_jobs").notNull(),
  pendingJobs: int("pending_jobs").notNull(),
  failedJobs: int("failed_jobs").notNull(),
  failedJobIds: longtext("failed_job_ids").notNull(),
  options: mediumtext("options"),
  cancelledAt: int("cancelled_at"),
  createdAt: int("created_at").notNull(),
  finishedAt: int("finished_at"),
});

export const failedJobs = mysqlTable(
  "failed_jobs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    uuid: varchar("uuid", { length: 255 }).notNull(),
    connection: text("connection").notNull(),
    queue: text("queue").notNull(),
    payload: longtext("payload").notNull(),
    exception: longtext("exception").notNull(),
    failedAt: timestamp("failed_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [uniqueIndex("failed_jobs_uuid_unique").on(t.uuid)]
);

export const personalAccessTokens = mysqlTable(
  "personal_access_tokens",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    tokenableType: varchar("tokenable_type", { length: 255 }).notNull(),
    tokenableId: bigint("tokenable_id", { mode: "number" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    token: varchar("token", { length: 64 }).notNull(),
    abilities: text("abilities"),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("personal_access_tokens_token_unique").on(t.token),
    index("personal_access_tokens_tokenable_type_tokenable_id_index").on(
      t.tokenableType,
      t.tokenableId
    ),
    index("personal_access_tokens_expires_at_index").on(t.expiresAt),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Audit log (added for S4 defense-in-depth)
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" }),
    action: varchar("action", { length: 100 }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("audit_logs_user_id_index").on(t.userId),
    index("audit_logs_action_index").on(t.action),
    index("audit_logs_created_at_index").on(t.createdAt),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// In-app notifications (P7.5)
// ─────────────────────────────────────────────────────────────────────────────

export const notifications = mysqlTable(
  "notifications",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    type: varchar("type", { length: 50 }).default("info"),
    link: varchar("link", { length: 255 }),
    read: boolean("is_read").default(false),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("notifications_user_id_index").on(t.userId),
    index("notifications_read_index").on(t.read),
    index("notifications_created_at_index").on(t.createdAt),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export const mailSettings = mysqlTable("mail_settings", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  mailer: varchar("mailer", { length: 255 }).default("smtp"),
  host: varchar("host", { length: 255 }),
  port: int("port"),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  encryption: varchar("encryption", { length: 255 }),
  fromAddress: varchar("from_address", { length: 255 }),
  fromName: varchar("from_name", { length: 255 }),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const companySettings = mysqlTable("company_settings", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  companyName: varchar("company_name", { length: 255 }),
  companyShortName: varchar("company_short_name", { length: 255 }),
  companyTagline: varchar("company_tagline", { length: 255 }),
  companyDescription: text("company_description"),
  lightLogo: varchar("light_logo", { length: 255 }),
  darkLogo: varchar("dark_logo", { length: 255 }),
  favicon: varchar("favicon", { length: 255 }),
  companyEmail1: varchar("company_email1", { length: 255 }),
  companyEmail2: varchar("company_email2", { length: 255 }),
  companyMobile1: varchar("company_mobile1", { length: 255 }),
  companyMobile2: varchar("company_mobile2", { length: 255 }),
  companyWhatsapp1: varchar("company_whatsapp1", { length: 255 }),
  companyWhatsapp2: varchar("company_whatsapp2", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  twitter: varchar("twitter", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  instagram: varchar("instagram", { length: 255 }),
  pintrest: varchar("pintrest", { length: 255 }),
  map: varchar("map", { length: 255 }),
  companyAddress1: text("company_address1"),
  companyAddress2: text("company_address2"),
  currencyName: varchar("currency_name", { length: 255 }),
  currencySymbol: varchar("currency_symbol", { length: 255 }),
  defaultTrialDays: int("default_trial_days").default(15),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Appointments
// ─────────────────────────────────────────────────────────────────────────────

export const appointments = mysqlTable(
  "appointments",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    patientId: bigint("patient_id", { mode: "number" }),
    patientString: varchar("patient_string", { length: 255 }),
    date: date("date", { mode: "string" }).notNull(),
    time: varchar("time", { length: 30 }).notNull(),
    caseType: mysqlEnum("case_type", [
      "clinical_visit",
      "home_visit",
      "online_visit",
      "on_call_visit",
    ])
      .default("clinical_visit")
      .notNull(),
    bloodGroup: varchar("blood_group", { length: 255 }),
    bp: varchar("bp", { length: 255 }),
    weight: decimal("weight", { precision: 5, scale: 2 }),
    height: decimal("height", { precision: 5, scale: 2 }),
    remarks: text("remarks"),
    note: text("note"),
    consentType: mysqlEnum("consent_type", [
      "otp",
      "consent",
      "upload",
      "skipped",
      "email",
    ]),
    consentValue: varchar("consent_value", { length: 255 }),
    consentFile: varchar("consent_file", { length: 255 }),
    mobileNumber: varchar("mobile_number", { length: 255 }),
    status: mysqlEnum("status", [
      "pending",
      "pending_consent",
      "confirmed",
      "completed",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    clinicId: bigint("clinic_id", { mode: "number" }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("appointments_doctor_id_foreign").on(t.doctorId),
    index("appointments_patient_id_foreign").on(t.patientId),
    index("appointments_doctor_id_date_index").on(t.doctorId, t.date),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.patientId],
      foreignColumns: [users.id],
    }).onDelete("set null"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Masters (symptoms, examinations, diagnoses, lab tests, medicines)
// ─────────────────────────────────────────────────────────────────────────────

export const symptoms = mysqlTable("symptoms", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const examinations = mysqlTable("examinations", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const diagnoses = mysqlTable("diagnoses", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const labTests = mysqlTable("lab_tests", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const medicines = mysqlTable("medicines", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  strength: varchar("strength", { length: 255 }),
  form: varchar("form", { length: 255 }).default("Tablet"),
  unit: varchar("unit", { length: 255 }).default("mg"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const medicineMasters = mysqlTable("medicine_masters", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Clinics & Schedules
// ─────────────────────────────────────────────────────────────────────────────

export const doctorClinics = mysqlTable(
  "doctor_clinics",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    clinicName: varchar("clinic_name", { length: 255 }).notNull(),
    addressType: mysqlEnum("address_type", ["manual", "map"]).default("manual"),
    address: text("address").notNull(),
    latitude: varchar("latitude", { length: 255 }),
    longitude: varchar("longitude", { length: 255 }),
    phone: varchar("phone", { length: 255 }).notNull(),
    consultationFee: decimal("consultation_fee", { precision: 8, scale: 2 }),
    clinicLogo: varchar("clinic_logo", { length: 255 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("doctor_clinics_doctor_id_is_active_index").on(t.doctorId, t.isActive),
    index("doctor_clinics_address_type_index").on(t.addressType),
    index("doctor_clinics_clinic_name_index").on(t.clinicName),
    index("doctor_clinics_is_active_index").on(t.isActive),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const doctorSchedules = mysqlTable(
  "doctor_schedules",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorClinicId: bigint("doctor_clinic_id", { mode: "number" }).notNull(),
    dayOfWeek: mysqlEnum("day_of_week", [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]).notNull(),
    startTime: varchar("start_time", { length: 255 }),
    endTime: varchar("end_time", { length: 255 }),
    slotDuration: int("slot_duration"),
    gapDuration: int("gap_duration"),
    sessionType: mysqlEnum("session_type", [
      "morning",
      "afternoon",
      "evening",
      "night",
      "full_day",
    ]).notNull(),
    maxPatients: int("max_patients").default(10),
    is24Hours: boolean("is_24_hours").default(false),
    breakStartTime: varchar("break_start_time", { length: 255 }),
    breakEndTime: varchar("break_end_time", { length: 255 }),
    durationHours: int("duration_hours").default(0),
    durationMinutes: int("duration_minutes").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("doctor_schedules_doctor_clinic_id_day_of_week_index").on(
      t.doctorClinicId,
      t.dayOfWeek
    ),
    index("doctor_schedules_is_active_index").on(t.isActive),
    index("doctor_schedules_session_type_index").on(t.sessionType),
    index("doctor_schedules_is_24_hours_index").on(t.is24Hours),
    index("doctor_schedules_day_of_week_index").on(t.dayOfWeek),
    foreignKey({
      columns: [t.doctorClinicId],
      foreignColumns: [doctorClinics.id],
    }).onDelete("cascade"),
  ]
);

export const doctorConsultPdfs = mysqlTable(
  "doctor_consult_pdfs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    pdfPath: varchar("pdf_path", { length: 255 }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("doctor_consult_pdfs_doctor_id_unique").on(t.doctorId),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Blogs
// ─────────────────────────────────────────────────────────────────────────────

export const categories = mysqlTable("categories", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const blogs = mysqlTable(
  "blogs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    categoryId: bigint("category_id", { mode: "number" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    shortcontent: text("shortcontent").notNull(),
    content: text("content").notNull(),
    image: varchar("image", { length: 255 }),
    status: boolean("status").default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("blogs_slug_unique").on(t.slug),
    index("blogs_category_id_foreign").on(t.categoryId),
    foreignKey({
      columns: [t.categoryId],
      foreignColumns: [categories.id],
    }).onDelete("cascade"),
  ]
);

export const blogImages = mysqlTable(
  "blog_images",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    blogId: bigint("blog_id", { mode: "number" }).notNull(),
    image: varchar("image", { length: 255 }).notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("blog_images_blog_id_foreign").on(t.blogId),
    foreignKey({
      columns: [t.blogId],
      foreignColumns: [blogs.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Transactions (unified income/expense)
// ─────────────────────────────────────────────────────────────────────────────

export const incomeTypes = mysqlTable(
  "income_types",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("income_types_user_id_name_index").on(t.userId, t.name),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const expenseTypes = mysqlTable(
  "expense_types",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("expense_types_user_id_name_index").on(t.userId, t.name),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const billings = mysqlTable(
  "billings",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    billNumber: varchar("bill_number", { length: 50 }).notNull(),
    patientId: bigint("patient_id", { mode: "number" }).notNull(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    billingTypeId: bigint("billing_type_id", { mode: "number" }).notNull(),
    appointmentId: bigint("appointment_id", { mode: "number" }),
    consultationId: bigint("consultation_id", { mode: "number" }),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    receivedAmount: decimal("received_amount", { precision: 12, scale: 2 }).default("0"),
    pendingAmount: decimal("pending_amount", { precision: 12, scale: 2 }).default("0"),
    paymentMethod: mysqlEnum("payment_method", ["upi", "cash", "card", "netbanking"]),
    paymentDetails: json("payment_details"),
    status: mysqlEnum("status", ["pending", "partial", "paid"]).default("pending"),
    notes: text("notes"),
    billDate: date("bill_date", { mode: "string" }).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("billings_bill_number_unique").on(t.billNumber),
    index("idx_bill_doctor_date").on(t.doctorId, t.billDate),
    index("idx_bill_patient").on(t.patientId),
    index("idx_bill_doctor_status").on(t.doctorId, t.status),
    index("idx_bill_appointment").on(t.appointmentId),
    foreignKey({
      columns: [t.patientId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.billingTypeId],
      foreignColumns: [billingTypes.id],
    }).onDelete("cascade"),
  ]
);

export const transactions = mysqlTable(
  "transactions",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    type: tinyint("type", { unsigned: true }).notNull(),
    incomeTypeId: bigint("income_type_id", { mode: "number" }),
    expenseTypeId: bigint("expense_type_id", { mode: "number" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    date: date("date", { mode: "string" }).notNull(),
    status: mysqlEnum("status", ["approved", "unapproved", "pending"]).default("approved"),
    billingId: bigint("billing_id", { mode: "number" }),
    referenceNumber: varchar("reference_number", { length: 100 }),
    paymentMethod: varchar("payment_method", { length: 50 }),
    description: text("description"),
    createdBy: varchar("created_by", { length: 150 }).notNull(),
    filePath: varchar("file_path", { length: 255 }),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("idx_tx_user_type").on(t.userId, t.type),
    index("idx_tx_user_date").on(t.userId, t.date),
    index("idx_tx_user_status").on(t.userId, t.status),
    index("idx_tx_billing").on(t.billingId),
    index("idx_tx_type_status_user").on(t.type, t.status, t.userId),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.incomeTypeId],
      foreignColumns: [incomeTypes.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [t.expenseTypeId],
      foreignColumns: [expenseTypes.id],
    }).onDelete("set null"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Vendors & Test Bookings
// ─────────────────────────────────────────────────────────────────────────────

export const vendors = mysqlTable(
  "vendors",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    mobile: varchar("mobile", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    address: text("address").notNull(),
    status: boolean("status").default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("vendors_doctor_id_foreign").on(t.doctorId),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const tests = mysqlTable(
  "tests",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).default("0"),
    status: boolean("status").default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("tests_doctor_id_foreign").on(t.doctorId),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const testBookings = mysqlTable(
  "test_bookings",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    patientId: bigint("patient_id", { mode: "number" }).notNull(),
    vendorId: bigint("vendor_id", { mode: "number" }).notNull(),
    bookingDate: datetime("booking_date").default(sql`CURRENT_TIMESTAMP`),
    bookingTime: time("booking_time"),
    tests: json("tests"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
    paymentMethod: varchar("payment_method", { length: 255 }),
    paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).default("0"),
    paymentDate: date("payment_date", { mode: "string" }),
    paymentDetails: json("payment_details"),
    status: mysqlEnum("status", ["pending", "in-progress", "completed", "cancelled"]).default(
      "pending"
    ),
    notes: text("notes"),
    uploadLinkToken: varchar("upload_link_token", { length: 255 }),
    uploadedFilePath: varchar("uploaded_file_path", { length: 255 }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("test_bookings_doctor_id_foreign").on(t.doctorId),
    index("test_bookings_patient_id_foreign").on(t.patientId),
    index("test_bookings_vendor_id_foreign").on(t.vendorId),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.patientId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.vendorId],
      foreignColumns: [vendors.id],
    }).onDelete("cascade"),
  ]
);

export const testBookingTest = mysqlTable(
  "test_booking_test",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    testBookingId: bigint("test_booking_id", { mode: "number" }).notNull(),
    testId: bigint("test_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("test_booking_test_test_booking_id_foreign").on(t.testBookingId),
    index("test_booking_test_test_id_foreign").on(t.testId),
    foreignKey({
      columns: [t.testBookingId],
      foreignColumns: [testBookings.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.testId],
      foreignColumns: [tests.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Billing types
// ─────────────────────────────────────────────────────────────────────────────

export const billingTypes = mysqlTable(
  "billing_types",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    defaultAmount: decimal("default_amount", { precision: 10, scale: 2 }).default("0"),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("billing_types_doctor_id_foreign").on(t.doctorId),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────────────────────

export const chatRooms = mysqlTable("chat_rooms", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).default("group"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const messages = mysqlTable(
  "messages",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    chatRoomId: bigint("chat_room_id", { mode: "number" }),
    senderId: bigint("sender_id", { mode: "number" }).notNull(),
    content: text("content").notNull(),
    doctorId: bigint("doctor_id", { mode: "number" }),
    timestamp: timestamp("timestamp").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("messages_chat_room_id_foreign").on(t.chatRoomId),
    index("messages_sender_id_foreign").on(t.senderId),
    index("messages_doctor_id_foreign").on(t.doctorId),
    index("messages_timestamp_index").on(t.timestamp),
    foreignKey({
      columns: [t.chatRoomId],
      foreignColumns: [chatRooms.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.senderId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("set null"),
  ]
);

export const userChatSettings = mysqlTable(
  "user_chat_settings",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    chatRoomId: bigint("chat_room_id", { mode: "number" }).notNull(),
    muted: boolean("muted").default(false),
    lastClearedAt: timestamp("last_cleared_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("user_chat_settings_user_id_foreign").on(t.userId),
    index("user_chat_settings_chat_room_id_foreign").on(t.chatRoomId),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.chatRoomId],
      foreignColumns: [chatRooms.id],
    }).onDelete("cascade"),
  ]
);

export const favorites = mysqlTable(
  "favorites",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("favorites_user_id_foreign").on(t.userId),
    index("favorites_message_id_foreign").on(t.messageId),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.messageId],
      foreignColumns: [messages.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Consultations
// ─────────────────────────────────────────────────────────────────────────────

export const consultations = mysqlTable(
  "consultations",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    patientId: bigint("patient_id", { mode: "number" }).notNull(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    appointmentId: bigint("appointment_id", { mode: "number" }),
    consultationDate: timestamp("consultation_date").default(sql`CURRENT_TIMESTAMP`),
    symptomsNote: text("symptoms_note"),
    examinationNote: text("examination_note"),
    diagnosisNote: text("diagnosis_note"),
    labNote: text("lab_note"),
    medicalHistory: text("medical_history"),
    privateNotes: text("private_notes"),
    medicalRecords: text("medical_records"),
    labResults: text("lab_results"),
    medicationsNote: text("medications_note"),
    additionalInfo: json("additional_info"),
    followUpDate: varchar("follow_up_date", { length: 255 }),
    additionalNotes: text("additional_notes"),
    followUpStatus: varchar("follow_up_status", { length: 255 }).default("pending"),
    followUpComment: text("follow_up_comment"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("consultations_patient_id_doctor_id_index").on(t.patientId, t.doctorId),
    index("consultations_consultation_date_index").on(t.consultationDate),
    index("consultations_patient_id_foreign").on(t.patientId),
    index("consultations_doctor_id_foreign").on(t.doctorId),
    index("consultations_appointment_id_foreign").on(t.appointmentId),
    foreignKey({
      columns: [t.patientId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.appointmentId],
      foreignColumns: [appointments.id],
    }).onDelete("set null"),
  ]
);

export const consultationSymptoms = mysqlTable(
  "consultation_symptoms",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    consultationId: bigint("consultation_id", { mode: "number" }).notNull(),
    symptom: varchar("symptom", { length: 255 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("consultation_symptoms_consultation_id_foreign").on(t.consultationId),
    foreignKey({
      columns: [t.consultationId],
      foreignColumns: [consultations.id],
    }).onDelete("cascade"),
  ]
);

export const consultationExaminations = mysqlTable(
  "consultation_examinations",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    consultationId: bigint("consultation_id", { mode: "number" }).notNull(),
    examinationName: varchar("examination_name", { length: 255 }).notNull(),
    note: text("note"),
    order: int("order").default(0),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("consultation_examinations_consultation_id_foreign").on(t.consultationId),
    foreignKey({
      name: "c_examinations_consultation_id_fk",
      columns: [t.consultationId],
      foreignColumns: [consultations.id],
    }).onDelete("cascade"),
  ]
);

export const consultationDiagnoses = mysqlTable(
  "consultation_diagnoses",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    consultationId: bigint("consultation_id", { mode: "number" }).notNull(),
    diagnosisName: varchar("diagnosis_name", { length: 255 }).notNull(),
    note: text("note"),
    order: int("order").default(0),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("consultation_diagnoses_consultation_id_foreign").on(t.consultationId),
    foreignKey({
      columns: [t.consultationId],
      foreignColumns: [consultations.id],
    }).onDelete("cascade"),
  ]
);

export const consultationLabTests = mysqlTable(
  "consultation_lab_tests",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    consultationId: bigint("consultation_id", { mode: "number" }).notNull(),
    labTestName: varchar("lab_test_name", { length: 255 }).notNull(),
    note: text("note"),
    order: int("order").default(0),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("consultation_lab_tests_consultation_id_foreign").on(t.consultationId),
    foreignKey({
      columns: [t.consultationId],
      foreignColumns: [consultations.id],
    }).onDelete("cascade"),
  ]
);

export const consultationMedications = mysqlTable(
  "consultation_medications",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    consultationId: bigint("consultation_id", { mode: "number" }).notNull(),
    medicineName: varchar("medicine_name", { length: 255 }).notNull(),
    dose: varchar("dose", { length: 255 }),
    frequency: varchar("frequency", { length: 255 }),
    whenToTake: varchar("when_to_take", { length: 255 }),
    duration: varchar("duration", { length: 255 }),
    note: text("note"),
    order: int("order").default(0),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("consultation_medications_consultation_id_foreign").on(t.consultationId),
    foreignKey({
      columns: [t.consultationId],
      foreignColumns: [consultations.id],
    }).onDelete("cascade"),
  ]
);

export const consultationPrescriptionUploads = mysqlTable(
  "consultation_prescription_uploads",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    consultationId: bigint("consultation_id", { mode: "number" }),
    patientId: bigint("patient_id", { mode: "number" }).notNull(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    filePath: varchar("file_path", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 255 }),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("consultation_prescription_uploads_patient_id_doctor_id_index").on(
      t.patientId,
      t.doctorId
    ),
    index("consultation_prescription_uploads_consultation_id_index").on(t.consultationId),
    foreignKey({
      name: "c_prescription_uploads_consultation_id_fk",
      columns: [t.consultationId],
      foreignColumns: [consultations.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [t.patientId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Consents
// ─────────────────────────────────────────────────────────────────────────────

export const appointmentConsultConsents = mysqlTable(
  "appointment_consult_consents",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    appointmentId: bigint("appointment_id", { mode: "number" }),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    patientId: bigint("patient_id", { mode: "number" }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    isAccepted: boolean("is_accepted").default(false),
    isRejected: boolean("is_rejected").default(false),
    rejectedAt: timestamp("rejected_at"),
    consentFile: varchar("consent_file", { length: 255 }),
    acceptedAt: timestamp("accepted_at"),
    status: mysqlEnum("status", [
      "pending",
      "pending_consent",
      "confirmed",
      "completed",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("appointment_consult_consents_appointment_id_unique").on(t.appointmentId),
    uniqueIndex("appointment_consult_consents_slug_unique").on(t.slug),
    index("appointment_consult_consents_doctor_id_foreign").on(t.doctorId),
    index("appointment_consult_consents_patient_id_foreign").on(t.patientId),
    foreignKey({
      name: "consents_appointment_id_fk",
      columns: [t.appointmentId],
      foreignColumns: [appointments.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.patientId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Roles & Permissions (spatie/laravel-permission compatible)
// ─────────────────────────────────────────────────────────────────────────────

export const permissions = mysqlTable(
  "permissions",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    parentId: bigint("parent_id", { mode: "number" }),
    name: varchar("name", { length: 255 }).notNull(),
    guardName: varchar("guard_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("permissions_name_guard_name_unique").on(t.name, t.guardName),
    index("permissions_parent_id_foreign").on(t.parentId),
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("cascade"),
  ]
);

export const roles = mysqlTable(
  "roles",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    guardName: varchar("guard_name", { length: 255 }).notNull(),
    doctorId: bigint("doctor_id", { mode: "number" }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("roles_name_guard_name_unique").on(t.name, t.guardName),
    index("roles_doctor_id_index").on(t.doctorId),
  ]
);

export const modelHasPermissions = mysqlTable(
  "model_has_permissions",
  {
    permissionId: bigint("permission_id", { mode: "number" }).notNull(),
    modelType: varchar("model_type", { length: 255 }).notNull(),
    modelId: bigint("model_id", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.permissionId, t.modelId, t.modelType] }),
    index("model_has_permissions_model_id_model_type_index").on(t.modelId, t.modelType),
    foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.id],
    }).onDelete("cascade"),
  ]
);

export const modelHasRoles = mysqlTable(
  "model_has_roles",
  {
    roleId: bigint("role_id", { mode: "number" }).notNull(),
    modelType: varchar("model_type", { length: 255 }).notNull(),
    modelId: bigint("model_id", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.modelId, t.modelType] }),
    index("model_has_roles_model_id_model_type_index").on(t.modelId, t.modelType),
    foreignKey({
      columns: [t.roleId],
      foreignColumns: [roles.id],
    }).onDelete("cascade"),
  ]
);

export const roleHasPermissions = mysqlTable(
  "role_has_permissions",
  {
    permissionId: bigint("permission_id", { mode: "number" }).notNull(),
    roleId: bigint("role_id", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.permissionId, t.roleId] }),
    foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.roleId],
      foreignColumns: [roles.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Support
// ─────────────────────────────────────────────────────────────────────────────

export const supportTickets = mysqlTable(
  "support_tickets",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["open", "closed"]).default("open"),
    priority: varchar("priority", { length: 20 }).default("normal"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("support_tickets_user_id_index").on(t.userId),
    index("support_tickets_status_index").on(t.status),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const supportVideos = mysqlTable("support_videos", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoType: mysqlEnum("video_type", ["upload", "youtube"]).default("upload"),
  videoUrl: varchar("video_url", { length: 255 }),
  videoPath: varchar("video_path", { length: 255 }),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const supportTicketMessages = mysqlTable(
  "support_ticket_messages",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    supportTicketId: bigint("support_ticket_id", { mode: "number" }).notNull(),
    senderId: bigint("sender_id", { mode: "number" }).notNull(),
    message: text("message").notNull(),
    attachmentPath: varchar("attachment_path", { length: 255 }),
    attachmentType: varchar("attachment_type", { length: 255 }),
    isAdminReply: boolean("is_admin_reply").default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("support_ticket_messages_support_ticket_id_index").on(t.supportTicketId),
    index("support_ticket_messages_sender_id_foreign").on(t.senderId),
    foreignKey({
      name: "st_messages_ticket_id_fk",
      columns: [t.supportTicketId],
      foreignColumns: [supportTickets.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.senderId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Staff
// ─────────────────────────────────────────────────────────────────────────────

export const staffAttendances = mysqlTable(
  "staff_attendances",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    staffId: bigint("staff_id", { mode: "number" }).notNull(),
    doctorId: bigint("doctor_id", { mode: "number" }).notNull(),
    date: date("date", { mode: "string" }).notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    checkIn: time("check_in"),
    checkOut: time("check_out"),
    notes: text("notes"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    uniqueIndex("staff_attendances_staff_id_date_unique").on(t.staffId, t.date),
    index("staff_attendances_date_index").on(t.date),
    index("staff_attendances_doctor_id_index").on(t.doctorId),
    foreignKey({
      columns: [t.staffId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.doctorId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Landing page CMS
// ─────────────────────────────────────────────────────────────────────────────

export const landingSections = mysqlTable("landing_sections", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  isActive: boolean("is_active").default(true),
  metadata: json("metadata"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const landingItems = mysqlTable(
  "landing_items",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    sectionKey: varchar("section_key", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    image: varchar("image", { length: 255 }),
    icon: varchar("icon", { length: 255 }),
    badge: varchar("badge", { length: 255 }),
    link: varchar("link", { length: 255 }),
    linkText: varchar("link_text", { length: 255 }),
    priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
    priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
    priceOriginalMonthly: decimal("price_original_monthly", { precision: 10, scale: 2 }),
    priceOriginalYearly: decimal("price_original_yearly", { precision: 10, scale: 2 }),
    features: json("features"),
    stars: int("stars"),
    order: int("order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("landing_items_section_key_foreign").on(t.sectionKey),
    foreignKey({
      columns: [t.sectionKey],
      foreignColumns: [landingSections.key],
    }).onDelete("cascade"),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// Marketing leads (demo bookings)
// ─────────────────────────────────────────────────────────────────────────────

export const leads = mysqlTable("leads", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export const schema = mysqlSchema("skoracare");

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;
export type LandingSection = typeof landingSections.$inferSelect;
export type LandingItem = typeof landingItems.$inferSelect;
