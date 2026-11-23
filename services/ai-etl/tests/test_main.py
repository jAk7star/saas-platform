"""Unit and contract tests for ai-etl FastAPI service."""

import json
from collections.abc import Generator
from pathlib import Path
from unittest.mock import MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from ai_etl.main import app, get_db_session

client = TestClient(app)


def _override_session() -> Generator[MagicMock, None, None]:
    yield MagicMock()


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai-etl"}


def test_ingest_telemetry_sanitizes_and_hashes() -> None:
    app.dependency_overrides[get_db_session] = _override_session
    try:
        tenant_id = str(uuid4())
        response = client.post(
            "/v1/telemetry/ingest",
            headers={"X-Tenant-Id": tenant_id},
            json={
                "event_name": "user_signup_completed",
                "source": "web",
                "actor_raw": {
                    "email": "test@example.com",
                    "ip_address": "192.168.1.99",
                    "phone": "+55 11 98765-4321",
                },
                "metadata": {"plan": "starter"},
                "occurred_at": "2026-11-23T17:00:00Z",
            },
        )
        assert response.status_code == 202
        body = response.json()
        assert body["tenant_id"] == tenant_id
        assert body["sanitized"] is True
        assert body["actor_hash"] is not None
        assert len(body["actor_hash"]) == 64
        assert "event_id" in body
    finally:
        app.dependency_overrides.clear()


def test_openapi_schema_contains_ingest_and_list_routes(tmp_path: Path) -> None:
    from scripts.export_openapi import export_openapi

    out_file = export_openapi(tmp_path / "openapi-ai.json")
    spec = json.loads(out_file.read_text(encoding="utf-8"))
    assert "/v1/telemetry/ingest" in spec["paths"]
    assert "/v1/telemetry/events" in spec["paths"]
    assert "/health" in spec["paths"]
