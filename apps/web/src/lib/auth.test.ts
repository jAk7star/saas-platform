import { describe, expect, it } from "vitest";
import { auth } from "./auth";

describe("Better Auth configuration", () => {
  it("exposes handler and API methods with organization plugin enabled", () => {
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe("function");
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
    expect(
      auth.options.plugins?.some((plugin) => plugin.id === "organization"),
    ).toBe(true);
  });
});
