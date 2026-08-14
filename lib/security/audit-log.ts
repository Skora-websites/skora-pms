/**
 * Audit-log helpers for sensitive operations.
 *
 * Logs are written to the `audit_logs` table (created by migration).
 * If the table does not exist yet the insert is silently skipped so
 * that the app continues to work during deployments.
 *
 * In production, consider also streaming to a separate log sink
 * (e.g. CloudWatch, Papertrail) for tamper-evident storage.
 *
 * Usage:
 *   import { auditLog } from "@/lib/security/audit-log";
 *   await auditLog({ userId: 1, action: "login", metadata: { ip: "..." } });
 */

import { db, schema } from "@/lib/db";
import { getClientIp } from "@/lib/security/ip";

// ── Types ───────────────────────────────────────────────────────────

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "signup"
  | "password_change"
  | "consent_given"
  | "consent_revoked"
  | "bill_created"
  | "bill_paid"
  | "transaction_created"
  | "pdf_downloaded"
  | "appointment_created"
  | "appointment_updated"
  | "appointment_cancelled"
  | "patient_created"
  | "patient_updated"
  | "patient_deleted"
  | "role_changed"
  | "settings_updated"
  | "support_ticket_created"
  | "file_uploaded";

export interface AuditLogEntry {
  userId?: number | null;
  action: AuditAction;
  /** Free-form JSON metadata (IP, user-agent, record IDs, etc.). */
  metadata?: Record<string, unknown>;
}

// ── Logger ──────────────────────────────────────────────────────────

/**
 * Persist an audit-log entry to the database.
 *
 * Errors are silently caught so audit-log failures never block the
 * caller's operation.
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const ip = await getClientIp();
    await db.insert(schema.auditLogs).values({
      userId: entry.userId ?? null,
      action: entry.action,
      ipAddress: ip,
      metadata: entry.metadata ?? null,
      createdAt: new Date(),
    });
  } catch {
    // Table may not exist yet; silently ignore.
  }
}

// ── Convenience helpers ─────────────────────────────────────────────

export const audit = {
  login: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "login", metadata }),

  loginFailed: (metadata?: Record<string, unknown>) =>
    auditLog({ action: "login_failed", metadata }),

  logout: (userId: number) =>
    auditLog({ userId, action: "logout" }),

  signup: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "signup", metadata }),

  passwordChange: (userId: number) =>
    auditLog({ userId, action: "password_change" }),

  consentGiven: (metadata?: Record<string, unknown>) =>
    auditLog({ action: "consent_given", metadata }),

  consentRevoked: (metadata?: Record<string, unknown>) =>
    auditLog({ action: "consent_revoked", metadata }),

  billCreated: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "bill_created", metadata }),

  transactionCreated: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "transaction_created", metadata }),

  pdfDownloaded: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "pdf_downloaded", metadata }),

  appointmentCreated: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "appointment_created", metadata }),

  appointmentUpdated: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "appointment_updated", metadata }),

  appointmentCancelled: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "appointment_cancelled", metadata }),

  fileUploaded: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "file_uploaded", metadata }),

  supportTicketCreated: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "support_ticket_created", metadata }),

  patientCreated: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "patient_created", metadata }),

  patientUpdated: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "patient_updated", metadata }),

  patientDeleted: (userId: number, metadata?: Record<string, unknown>) =>
    auditLog({ userId, action: "patient_deleted", metadata }),
};