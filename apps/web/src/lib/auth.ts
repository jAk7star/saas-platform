import { createDb, schema } from "@saas/db-schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

const db = createDb();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization()],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  secret:
    process.env.BETTER_AUTH_SECRET ?? "change-me-in-production-32-chars-min",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});
