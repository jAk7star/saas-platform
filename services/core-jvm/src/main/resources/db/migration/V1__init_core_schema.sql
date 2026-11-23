-- Schema 'core' initial multitenant subscriptions table with PostgreSQL RLS
CREATE TABLE IF NOT EXISTS core.subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_tier VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    monthly_event_limit INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_core_subscriptions_tenant_id
    ON core.subscriptions (tenant_id);

ALTER TABLE core.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON core.subscriptions;
CREATE POLICY tenant_isolation_policy ON core.subscriptions
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
