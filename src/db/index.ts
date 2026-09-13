import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import "dotenv/config";

const dbUrl = process.env["DATABASE_URL"];
if (!dbUrl || (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://"))) {
  throw new Error("DATABASE_URL environment variable must be set to a valid PostgreSQL connection string.");
}

const sql = neon(dbUrl);
export const db = drizzle(sql, { schema });
