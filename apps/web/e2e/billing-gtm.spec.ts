import { expect, test } from "@playwright/test";

test("M3 GTM & Billing E2E: Landing Page -> Upgrade to Pro -> Quota Updated via Webhook", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/");

  // 1. Check Hero & Value Proposition
  await expect(
    page.getByRole("heading", { name: /Telemetria e Inteligência Analítica/i }),
  ).toBeVisible();

  // 2. Check 3 Pricing Tiers (CRO elements)
  await expect(page.getByTestId("pricing-card-starter")).toBeVisible();
  await expect(page.getByTestId("pricing-card-pro")).toBeVisible();
  await expect(page.getByTestId("pricing-card-enterprise")).toBeVisible();

  // 3. Perform Upgrade to Pro (triggers simulated Stripe webhook on Ktor and telemetry event on FastAPI)
  const upgradeBtn = page.getByTestId("btn-checkout-pro");
  await expect(upgradeBtn).toBeVisible();
  await upgradeBtn.click();

  // 4. Verify Upgrade and Quota Synchronization
  const statusAlert = page.getByTestId("checkout-status-alert");
  await expect(statusAlert).toBeVisible({ timeout: 20_000 });
  await expect(statusAlert).toContainText(/Plano atualizado para PRO/i, {
    timeout: 25_000,
  });
  await expect(statusAlert).toContainText("100.000");

  const planBadge = page.getByTestId("current-plan-badge");
  await expect(planBadge).toContainText("PRO");
  await expect(planBadge).toContainText("100.000");

  // 5. Navigate to Telemetry Dashboard tab
  await page.getByTestId("tab-telemetry").click();
  await expect(
    page.getByRole("heading", { name: /1\. Autenticação & Tenant/i }),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
