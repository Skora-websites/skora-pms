/**
 * Minimal structured logger (audit R3).
 *
 * The codebase had no logger and only two `console.error` calls, so a failed
 * payment fulfillment was an ungreppable line in `pm2 logs`. This keeps the
 * same zero-dependency footprint (`console` remains the sink) but emits
 * single-line JSON, so a failure can be found, counted and alerted on.
 *
 * Convention: one line per event, `level` + `msg` + `context`, never a
 * stack-printed Error — a thrown object's message is extracted instead so the
 * line stays one record. Development keeps the human-readable form.
 *
 * Deliberately NOT a wrapper around a logging library: nothing in this app
 * ships logs off-box yet, and adding a dependency for a console.* wrapper
 * would be premature. The shape is what matters; `lib/security/logger` is the
 * single seam to swap for pino later.
 */

export type LogLevel = "error" | "warn" | "info";

export type LogContext = Record<string, unknown>;

function serialize(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function write(
  level: LogLevel,
  component: string,
  message: string,
  context?: LogContext
): void {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const tail = context && Object.keys(context).length > 0
      ? " " + Object.entries(context).map(([k, v]) => `${k}=${serialize(v)}`).join(" ")
      : "";
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `[${component}] ${message}${tail}`
    );
    return;
  }

  const record = {
    level,
    component,
    msg: message,
    ...(context
      ? Object.fromEntries(
          Object.entries(context).map(([k, v]) => [k, v instanceof Error ? serialize(v) : v])
        )
      : {}),
    at: new Date().toISOString(),
  };

  try {
    const line = JSON.stringify(record);
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line);
  } catch {
    // A context holding a circular reference or a BigInt must never take the
    // process down while it is already handling a failure.
    // eslint-disable-next-line no-console
    console.error(`[${component}] ${message}`);
  }
}

/** A logger bound to one component, e.g. `createLogger("packages/webhook")`. */
export function createLogger(component: string) {
  return {
    error: (message: string, context?: LogContext) => write("error", component, message, context),
    warn: (message: string, context?: LogContext) => write("warn", component, message, context),
    info: (message: string, context?: LogContext) => write("info", component, message, context),
  };
}

export const logger = {
  error: (component: string, message: string, context?: LogContext) =>
    write("error", component, message, context),
  warn: (component: string, message: string, context?: LogContext) =>
    write("warn", component, message, context),
  info: (component: string, message: string, context?: LogContext) =>
    write("info", component, message, context),
};
