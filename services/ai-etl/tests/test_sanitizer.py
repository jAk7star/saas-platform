"""Unit tests for the local Zero-Exposure PII sanitizer."""

from datetime import UTC, datetime
from uuid import uuid4

from ai_etl.sanitizer import (
    hash_identifier,
    mask_ip_address,
    redact_pii_text,
    sanitize_telemetry_payload,
)
from ai_etl.schemas import ActorRawInput, TelemetryIngestRequest


def test_mask_ip_address_ipv4_and_ipv6() -> None:
    assert mask_ip_address("192.168.1.142") == "192.168.1.0"
    assert mask_ip_address("2001:db8:85a3::8a2e:370:7334") == "2001:db8:85a3::"
    assert mask_ip_address("not-an-ip") == "[REDACTED_IP]"


def test_redact_pii_text_removes_cpf_cnpj_phone_email() -> None:
    raw = "User joao@example.com CPF 123.456.789-00 CNPJ 12.345.678/0001-99 Tel +55 (11) 99999-8888"
    redacted = redact_pii_text(raw)
    assert "joao@example.com" not in redacted
    assert "123.456.789-00" not in redacted
    assert "12.345.678/0001-99" not in redacted
    assert "99999-8888" not in redacted
    assert "[REDACTED_PII]" in redacted


def test_sanitize_telemetry_payload_never_keeps_raw_email() -> None:
    tenant_id = uuid4()
    req = TelemetryIngestRequest(
        event_name="user_signup_completed",
        source="web",
        actor_raw=ActorRawInput(
            email="User@Example.com",
            ip_address="10.20.30.44",
            phone="+55 11 91234-5678",
        ),
        metadata={"note": "cpf 111.222.333-44", "plan": "starter"},
        occurred_at=datetime.now(UTC),
    )
    sanitized = sanitize_telemetry_payload(req, tenant_id)
    assert sanitized.actor_hash == hash_identifier("user@example.com", tenant_id)
    serialized = str(sanitized.sanitized_payload)
    assert "User@Example.com" not in serialized
    assert "10.20.30.44" not in serialized
    assert "10.20.30.0" in serialized
    assert "91234-5678" not in serialized
    assert "111.222.333-44" not in serialized
