import { ingestTelemetryV1TelemetryIngestPost } from "@saas/api-ai";
import { getTenantPlan, handleBillingWebhook } from "@saas/api-core";
import { NextResponse } from "next/server";

const CORE_URL = process.env.CORE_JVM_URL ?? "http://localhost:8080";
const AI_URL = process.env.AI_ETL_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const res = await getTenantPlan({
    baseUrl: CORE_URL,
    path: { id: tenantId },
  });

  if (res.error || !res.data) {
    return NextResponse.json(
      { error: "Failed to retrieve tenant plan" },
      { status: 502 },
    );
  }

  return NextResponse.json(res.data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tenantId: string;
    planTier: string;
    customerEmail?: string;
    customerIp?: string;
  };

  if (!body.tenantId || !body.planTier) {
    return NextResponse.json(
      { error: "tenantId and planTier are required" },
      { status: 400 },
    );
  }

  // 1. Process simulated webhook in Core JVM (Stripe / Polar synchronization)
  const billingRes = await handleBillingWebhook({
    baseUrl: CORE_URL,
    body: {
      event: "checkout.session.completed",
      tenantId: body.tenantId,
      planTier: body.planTier,
      status: "active",
    },
  });

  if (billingRes.error || !billingRes.data || !billingRes.data.success) {
    return NextResponse.json(
      { error: "Failed to update tenant subscription" },
      { status: 502 },
    );
  }

  // 2. Dispatch sanitized funnel conversion event to FastAPI AI ETL
  const ingestRes = await ingestTelemetryV1TelemetryIngestPost({
    baseUrl: AI_URL,
    headers: { "X-Tenant-Id": body.tenantId },
    body: {
      event_name: "funnel_checkout_completed",
      source: "web",
      actor_raw: {
        email: body.customerEmail ?? null,
        ip_address: body.customerIp ?? null,
      },
      metadata: {
        planTier: body.planTier,
        conversion_step: "checkout",
        amount_usd: body.planTier === "pro" ? 49 : 299,
      },
      occurred_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    billing: billingRes.data,
    telemetry: ingestRes.data ?? null,
  });
}
