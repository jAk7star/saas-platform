"""Initial 'ai' schema tables and PostgreSQL Row-Level Security."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_init_ai_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "telemetry_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_name", sa.String(length=128), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("actor_hash", sa.String(length=64), nullable=True),
        sa.Column("sanitized_payload", postgresql.JSONB(), nullable=False),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        schema="ai",
    )
    op.create_index(
        "ix_ai_telemetry_events_tenant_id",
        "telemetry_events",
        ["tenant_id"],
        schema="ai",
    )
    op.execute("ALTER TABLE ai.telemetry_events ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation_policy ON ai.telemetry_events
            FOR ALL
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_policy ON ai.telemetry_events;")
    op.drop_index("ix_ai_telemetry_events_tenant_id", table_name="telemetry_events", schema="ai")
    op.drop_table("telemetry_events", schema="ai")
