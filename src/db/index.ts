import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import "dotenv/config";

function getDbUrl(): string {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl || (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://"))) {
    throw new Error(
      "DATABASE_URL environment variable must be set to a valid PostgreSQL connection string.",
    );
  }

  return dbUrl;
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    const sql = neon(getDbUrl());
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    return Reflect.get(instance as object, prop);
  },
});
