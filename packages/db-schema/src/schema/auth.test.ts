import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "./auth";

describe("auth schema", () => {
  it("places all Better Auth tables inside the isolated 'auth' PostgreSQL schema", () => {
    const tables = [
      user,
      session,
      account,
      verification,
      organization,
      member,
      invitation,
    ];

    for (const table of tables) {
      const config = getTableConfig(table);
      expect(config.schema).toBe("auth");
    }
  });
});
