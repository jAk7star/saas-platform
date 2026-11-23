import {
  ingestTelemetryV1TelemetryIngestPost,
  listTelemetryEventsV1TelemetryEventsGet,
} from "@saas/api-ai";
import { verifyTenantLimit } from "@saas/api-core";
import { NextResponse } from "next/server";

const CORE_URL = process.env.CORE_JVM_URL ?? "http://localhost:8080";
const AI_URL = process.env.AI_ETL_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing tenantId query parameter" },
      { status: 400 },
    );
  }

  const { data, error } = await listTelemetryEventsV1TelemetryEventsGet({
    baseUrl: AI_URL,
    headers: { "X-Tenant-Id": tenantId },
  });

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to fetch telemetry events" },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tenantId: string;
    eventName?: string;
    email?: string;
    ipAddress?: string;
    phone?: string;
    note?: string;
  };

  if (!body.tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const quotaRes = await verifyTenantLimit({
    baseUrl: CORE_URL,
    path: { id: body.tenantId },
    body: { requestedEvents: 1 },
  });

  if (quotaRes.error || !quotaRes.data) {
    return NextResponse.json(
      { error: "Core quota verification failed" },
      { status: 502 },
    );
  }

  if (!quotaRes.data.allowed) {
    return NextResponse.json(
      { error: "Tenant quota exceeded", quota: quotaRes.data },
      { status: 429 },
    );
  }

  const ingestRes = await ingestTelemetryV1TelemetryIngestPost({
    baseUrl: AI_URL,
    headers: { "X-Tenant-Id": body.tenantId },
    body: {
      event_name: body.eventName ?? "tracer_bullet_event",
      source: "web",
      actor_raw: {
        email: body.email ?? null,
        ip_address: body.ipAddress ?? null,
        phone: body.phone ?? null,
      },
      metadata: {
        note: body.note ?? "",
        flow: "m2-tracer-bullet",
      },
      occurred_at: new Date().toISOString(),
    },
  });

  if (ingestRes.error || !ingestRes.data) {
    return NextResponse.json(
      { error: "AI ETL telemetry ingestion failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    quota: quotaRes.data,
    ingest: ingestRes.data,
  });
}
