import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { DB_POOL_CONNECTION_LIMIT, DB_POOL_QUEUE_LIMIT, DB_CONNECT_TIMEOUT_MS } from "@/lib/config";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { _skoraDb?: ReturnType<typeof createClient> };

function createClient() {
  // Parse DATABASE_URL manually so we can apply SSL config conditionally.
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in your MySQL credentials."
    );
  }

  const connection = mysql.createPool({
    uri: dbUri,
    connectionLimit: DB_POOL_CONNECTION_LIMIT,
    // Cap the queue so a DB outage fails fast instead of unbounded memory growth.
    queueLimit: DB_POOL_QUEUE_LIMIT,
    namedPlaceholders: true,
    // Enable SSL when DB_SSL=true (e.g. DigitalOcean managed MySQL,
    // AWS RDS, PlanetScale). Defaults to off for local dev.
    ssl:
      process.env.DB_SSL === "true"
        ? process.env.DB_SSL_CA
          ? { ca: process.env.DB_SSL_CA }
          : {}
        : undefined,
    // Ms before a connection attempt is considered dead.
    connectTimeout: DB_CONNECT_TIMEOUT_MS,
  });
  return drizzle(connection, { schema, mode: "default" });
}

export const db = globalForDb._skoraDb ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb._skoraDb = db;

export { schema };
