import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/auth.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["auth"],
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/saas_db",
  },
});
