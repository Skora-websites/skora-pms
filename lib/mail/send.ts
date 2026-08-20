/**
 * Minimal SMTP client used for transactional mail. Avoids a heavy dependency
 * by speaking SMTP directly over node:net/node:tls.
 *
 * Settings are read from the `mail_settings` row (password decrypted from
 * our AES-GCM envelope). When SMTP is not configured, sendMail silently
 * no-ops so callers don't need special-casing.
 */

import net from "node:net";
import tls from "node:tls";
import { db } from "@/lib/db";
import { mailSettings, companySettings } from "@/lib/db/schema";
import { decryptSecret } from "@/lib/security/crypto";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
};

async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  const [mail] = await db.select().from(mailSettings).limit(1);
  const [company] = await db.select().from(companySettings).limit(1);
  if (!mail?.host) return null;
  return {
    host: mail.host,
    port: mail.port ?? 587,
    secure: (mail.encryption ?? "").toLowerCase() === "ssl",
    user: mail.username ?? "",
    pass: decryptSecret(mail.password),
    from: mail.fromAddress ?? company?.companyEmail1 ?? "no-reply@localhost",
    fromName: mail.fromName ?? company?.companyName ?? "SkoraCare",
  };
}

/**
 * Send a single SMTP command and wait for a reply whose code starts with
 * `expected`. The command is skipped when null (used to await the greeting).
 */
function smtpCommand(
  socket: net.Socket,
  command: string | null,
  expected: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let buffer = "";
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      if (!buffer.includes("\r\n")) return;
      const lines = buffer.split("\r\n");
      const last = lines[lines.length - 2] ?? "";
      if (last.length < 4 || last[3] !== "-") {
        cleanup();
        if (last.startsWith(expected)) resolve(last);
        else reject(new Error(`SMTP expected ${expected} response, got: ${last.slice(0, 120)}`));
      }
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const onClose = () => {
      cleanup();
      reject(new Error("SMTP connection closed unexpectedly"));
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };
    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("close", onClose);
    if (command) socket.write(command + "\r\n");
  });
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const config = await loadSmtpConfig();
  if (!config) return false;

  const toList = Array.isArray(opts.to) ? opts.to : [opts.to];
  const toHeader = toList.join(", ");

  const socket: net.Socket = config.secure
    ? tls.connect({ host: config.host, port: config.port })
    : net.connect({ host: config.host, port: config.port });

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });

    await smtpCommand(socket, null, "220");
    await smtpCommand(socket, `EHLO ${config.host}`, "250");

    if (config.user) {
      await smtpCommand(socket, "AUTH LOGIN", "334");
      await smtpCommand(socket, Buffer.from(config.user, "utf8").toString("base64"), "334");
      await smtpCommand(socket, Buffer.from(config.pass, "utf8").toString("base64"), "235");
    }

    await smtpCommand(socket, `MAIL FROM:<${config.from}>`, "250");
    for (const to of toList) {
      await smtpCommand(socket, `RCPT TO:<${to}>`, "250");
    }

    await smtpCommand(socket, "DATA", "354");
    const headers = [
      `From: ${config.fromName} <${config.from}>`,
      `To: ${toHeader}`,
      `Subject: ${opts.subject}`,
      "MIME-Version: 1.0",
      `Content-Type: ${opts.html ? "text/html" : "text/plain"}; charset=utf-8`,
      "",
      opts.html ?? opts.text,
    ];
    await smtpCommand(socket, headers.join("\r\n").replace(/\r?\n/g, "\r\n") + "\r\n.", "250");

    await smtpCommand(socket, "QUIT", "221");
    socket.end();
    return true;
  } catch (err) {
    socket.destroy();
    console.error("[mail] send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}