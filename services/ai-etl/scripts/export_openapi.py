"""Headless OpenAPI 3.1 exporter for the ai-etl FastAPI service."""

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from ai_etl.main import app  # noqa: E402


def export_openapi(output_path: Path | None = None) -> Path:
    """Serialize FastAPI's OpenAPI schema to disk without starting uvicorn."""
    target = output_path or (ROOT_DIR / "dist" / "openapi-ai.json")
    target.parent.mkdir(parents=True, exist_ok=True)
    spec = app.openapi()
    target.write_text(json.dumps(spec, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return target


if __name__ == "__main__":
    exported = export_openapi()
    print(f"Exported OpenAPI spec to {exported}")
