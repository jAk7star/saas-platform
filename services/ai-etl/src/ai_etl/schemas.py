"""Pydantic v2 request and response contracts for AI ETL endpoints."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Service health status."""

    status: Literal["ok"] = "ok"
    service: str = "ai-etl"


class ActorRawInput(BaseModel):
    """Raw actor fields that must be sanitized locally before persistence."""

    email: str | None = Field(default=None, description="Optional email, hashed locally.")
    ip_address: str | None = Field(default=None, description="Optional IP, masked to /24.")
    phone: str | None = Field(default=None, description="Optional phone, redacted locally.")


class TelemetryIngestRequest(BaseModel):
    """Payload accepted by POST /v1/telemetry/ingest."""

    event_name: str = Field(..., min_length=1, max_length=128)
    source: Literal["web", "mobile", "api"]
    actor_raw: ActorRawInput | None = None
    metadata: dict[str, str | int | float | bool] = Field(default_factory=dict)
    occurred_at: datetime


class TelemetryIngestResponse(BaseModel):
    """Sanitized acknowledgement returned after telemetry ingestion."""

    event_id: UUID
    tenant_id: UUID
    actor_hash: str | None = None
    sanitized: bool = True


class TelemetryEventItem(BaseModel):
    """Sanitized telemetry event returned to the dashboard."""

    id: UUID
    tenant_id: UUID
    event_name: str
    source: str
    actor_hash: str | None = None
    sanitized_payload: dict[str, object]
    occurred_at: datetime


class TelemetryListResponse(BaseModel):
    """List of sanitized telemetry events for the current tenant."""

    items: list[TelemetryEventItem]
