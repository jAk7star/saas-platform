import { expect, test } from "@playwright/test";

test("Tracer Bullet E2E: Signup -> Tenant -> Ktor Quota -> FastAPI Zero-Exposure PII", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/");
  await page.getByTestId("tab-telemetry").click();
  await expect(
    page.getByRole("heading", { name: /Telemetria Multitenant/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Criar Conta & Tenant/i }).click();
  const tenantStatus = page.getByTestId("tenant-status");
  await expect(tenantStatus).toBeVisible({ timeout: 15_000 });
  await expect(tenantStatus).toContainText("Tenant ativo:");

  await page.getByRole("button", { name: /Disparar Tracer Bullet/i }).click();

  const quotaResult = page.getByTestId("quota-result");
  await expect(quotaResult).toBeVisible({ timeout: 15_000 });
  await expect(quotaResult).toContainText("starter");
  await expect(quotaResult).toContainText("permitido: true");

  const eventsList = page.getByTestId("events-list");
  await expect(eventsList).toBeVisible({ timeout: 15_000 });
  await expect(eventsList).toContainText("user_signup_completed");
  await expect(eventsList).toContainText("192.168.10.0");
  await expect(eventsList).toContainText("[REDACTED_PII]");

  const renderedText = await eventsList.innerText();
  expect(renderedText).not.toContain("maria.silva@empresa.com");
  expect(renderedText).not.toContain("192.168.10.55");
  expect(renderedText).not.toContain("99887-7665");
  expect(renderedText).not.toContain("123.456.789-00");

  expect(consoleErrors).toEqual([]);
});
