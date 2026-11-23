"""Local Zero-Exposure PII sanitization pipeline (LGPD compliant)."""

import hashlib
import ipaddress
import os
import re
from dataclasses import dataclass
from uuid import UUID

from ai_etl.schemas import TelemetryIngestRequest

_CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
_CNPJ_RE = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{4,5}-?\d{4}\b")

_SALT_PEPPER = os.getenv("PII_HASH_PEPPER", "saas-local-dev-pepper")


@dataclass(frozen=True)
class SanitizedTelemetry:
    """Sanitized representation safe for persistence and LLM consumption."""

    actor_hash: str | None
    sanitized_payload: dict[str, object]


def hash_identifier(value: str, tenant_id: UUID) -> str:
    """Compute a deterministic SHA-256 hash salted by tenant_id."""
    normalized = value.strip().lower()
    material = f"{tenant_id}:{_SALT_PEPPER}:{normalized}".encode()
    return hashlib.sha256(material).hexdigest()


def mask_ip_address(raw_ip: str) -> str:
    """Mask IPv4 to /24 or IPv6 to /64 network prefix."""
    try:
        addr = ipaddress.ip_address(raw_ip.strip())
    except ValueError:
        return "[REDACTED_IP]"

    if isinstance(addr, ipaddress.IPv4Address):
        network = ipaddress.IPv4Network(f"{addr}/24", strict=False)
        return str(network.network_address)

    network6 = ipaddress.IPv6Network(f"{addr}/64", strict=False)
    return str(network6.network_address)


def redact_pii_text(value: str) -> str:
    """Replace emails, CPFs, CNPJs, and phone numbers with [REDACTED_PII]."""
    sanitized = _EMAIL_RE.sub("[REDACTED_PII]", value)
    sanitized = _CNPJ_RE.sub("[REDACTED_PII]", sanitized)
    sanitized = _CPF_RE.sub("[REDACTED_PII]", sanitized)
    sanitized = _PHONE_RE.sub("[REDACTED_PII]", sanitized)
    return sanitized


def sanitize_telemetry_payload(
    payload: TelemetryIngestRequest,
    tenant_id: UUID,
) -> SanitizedTelemetry:
    """Sanitize actor_raw and metadata locally before any DB write or LLM call."""
    actor_hash: str | None = None
    sanitized_metadata: dict[str, object] = {}

    for key, val in payload.metadata.items():
        sanitized_metadata[key] = redact_pii_text(val) if isinstance(val, str) else val

    sanitized_actor: dict[str, object] = {}
    if payload.actor_raw is not None:
        if payload.actor_raw.email:
            actor_hash = hash_identifier(payload.actor_raw.email, tenant_id)
        if payload.actor_raw.ip_address:
            sanitized_actor["ip_network"] = mask_ip_address(payload.actor_raw.ip_address)
        if payload.actor_raw.phone:
            sanitized_actor["phone"] = "[REDACTED_PII]"

    return SanitizedTelemetry(
        actor_hash=actor_hash,
        sanitized_payload={
            "actor": sanitized_actor,
            "metadata": sanitized_metadata,
        },
    )
