"""FastAPI application entrypoint for ai-etl."""

from collections.abc import Generator
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc, select, text
from sqlalchemy.orm import Session

from ai_etl.db import SessionLocal
from ai_etl.models import TelemetryEvent
from ai_etl.sanitizer import sanitize_telemetry_payload
from ai_etl.schemas import (
    HealthResponse,
    TelemetryEventItem,
    TelemetryIngestRequest,
    TelemetryIngestResponse,
    TelemetryListResponse,
)

app = FastAPI(
    title="SaaS AI ETL Service",
    version="0.1.0",
    description="Zero-Exposure telemetry ingestion and AI ETL API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_session(
    x_tenant_id: UUID = Header(..., alias="X-Tenant-Id"),
) -> Generator[Session, None, None]:
    """Provide a SQLAlchemy session with PostgreSQL RLS tenant context set."""
    db = SessionLocal()
    try:
        db.execute(
            text("SELECT set_config('app.current_tenant_id', :tid, true)"),
            {"tid": str(x_tenant_id)},
        )
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health_check() -> HealthResponse:
    """Return service liveness status."""
    return HealthResponse()


@app.post(
    "/v1/telemetry/ingest",
    response_model=TelemetryIngestResponse,
    status_code=202,
    tags=["telemetry"],
)
def ingest_telemetry(
    payload: TelemetryIngestRequest,
    x_tenant_id: UUID = Header(..., alias="X-Tenant-Id"),
    db: Session = Depends(get_db_session),
) -> TelemetryIngestResponse:
    """Sanitize PII locally and persist only anonymized telemetry into schema 'ai'."""
    sanitized = sanitize_telemetry_payload(payload, x_tenant_id)
    event = TelemetryEvent(
        id=uuid4(),
        tenant_id=x_tenant_id,
        event_name=payload.event_name,
        source=payload.source,
        actor_hash=sanitized.actor_hash,
        sanitized_payload=sanitized.sanitized_payload,
        occurred_at=payload.occurred_at,
    )
    db.add(event)
    db.flush()
    return TelemetryIngestResponse(
        event_id=event.id,
        tenant_id=x_tenant_id,
        actor_hash=sanitized.actor_hash,
        sanitized=True,
    )


@app.get(
    "/v1/telemetry/events",
    response_model=TelemetryListResponse,
    tags=["telemetry"],
)
def list_telemetry_events(
    x_tenant_id: UUID = Header(..., alias="X-Tenant-Id"),
    db: Session = Depends(get_db_session),
) -> TelemetryListResponse:
    """List sanitized telemetry events for the current tenant (enforced by RLS)."""
    _ = x_tenant_id
    stmt = select(TelemetryEvent).order_by(desc(TelemetryEvent.occurred_at)).limit(50)
    rows = db.execute(stmt).scalars().all()
    return TelemetryListResponse(
        items=[
            TelemetryEventItem(
                id=row.id,
                tenant_id=row.tenant_id,
                event_name=row.event_name,
                source=row.source,
                actor_hash=row.actor_hash,
                sanitized_payload=row.sanitized_payload,
                occurred_at=row.occurred_at,
            )
            for row in rows
        ]
    )
