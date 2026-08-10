import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { _skoraDb?: ReturnType<typeof createClient> };

function createClient() {
  const connection = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    namedPlaceholders: true,
  });
  return drizzle(connection, { schema, mode: "default" });
}

export const db = globalForDb._skoraDb ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb._skoraDb = db;

export { schema };
