import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authTables from "./schema/auth";

export const schema = {
  ...authTables,
};

export function createDb(connectionString?: string) {
  const pool = new Pool({
    connectionString:
      connectionString ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/saas_db",
  });
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDb>;
