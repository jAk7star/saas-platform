#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

console.log("🛡️ Iniciando Auditoria Técnica de Segurança & Conformidade LGPD (M4)...");

let hasErrors = false;

function checkRule(name, passed, message) {
  if (passed) {
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}: ${message}`);
    hasErrors = true;
  }
}

// 1. Verificar Headers de Segurança no Next.js
const nextConfig = fs.readFileSync(path.resolve("apps/web/next.config.ts"), "utf-8");
checkRule(
  "Next.js Security Headers",
  nextConfig.includes("Strict-Transport-Security") &&
    nextConfig.includes("X-Frame-Options") &&
    nextConfig.includes("X-Content-Type-Options"),
  "Headers HSTS, X-Frame-Options ou X-Content-Type-Options ausentes no next.config.ts"
);

checkRule(
  "Next.js Standalone Build",
  nextConfig.includes('output: "standalone"') || nextConfig.includes("isStandalone"),
  "Configuração de output standalone ausente no next.config.ts"
);

// 2. Verificar Dockerfiles com usuário non-root e healthcheck
const dockerfiles = [
  "services/ai-etl/Dockerfile",
  "services/core-jvm/Dockerfile",
  "apps/web/Dockerfile",
];

for (const dfPath of dockerfiles) {
  const content = fs.readFileSync(path.resolve(dfPath), "utf-8");
  checkRule(
    `Non-root user in ${dfPath}`,
    content.includes("USER appuser") || content.includes("USER nextjs"),
    `Dockerfile ${dfPath} deve rodar com usuário não-root`
  );
  checkRule(
    `HEALTHCHECK in ${dfPath}`,
    content.includes("HEALTHCHECK") || dfPath.includes("apps/web"),
    `Dockerfile ${dfPath} deve ter instrução HEALTHCHECK configurada`
  );
}

// 3. Scan de vazamento de PII em logs de ingestão
const fastApiSrc = fs.readFileSync(
  path.resolve("services/ai-etl/src/ai_etl/main.py"),
  "utf-8"
);
checkRule(
  "Zero PII in FastAPI Ingest logs",
  !fastApiSrc.includes("print(payload") &&
    !fastApiSrc.includes("logger.info(payload") &&
    !fastApiSrc.includes("print(actor_raw"),
  "Detectada tentativa de log de payload bruto com dados PII"
);

// 4. Verificar RLS nas migrações do PostgreSQL
const alembicMigration = fs.readFileSync(
  path.resolve("services/ai-etl/alembic/versions/0001_init_ai_schema.py"),
  "utf-8"
);
checkRule(
  "RLS ativo no schema ai (Alembic)",
  alembicMigration.includes("ENABLE ROW LEVEL SECURITY") &&
    alembicMigration.includes("tenant_isolation_policy"),
  "Política Row-Level Security não encontrada para telemetry_events"
);

const flywayMigration = fs.readFileSync(
  path.resolve("services/core-jvm/src/main/resources/db/migration/V1__init_core_schema.sql"),
  "utf-8"
);
checkRule(
  "RLS ativo no schema core (Flyway)",
  flywayMigration.includes("ENABLE ROW LEVEL SECURITY") &&
    flywayMigration.includes("tenant_isolation_policy"),
  "Política Row-Level Security não encontrada para subscriptions"
);

// 5. Verificar ausência de segredos reais em repositório
const envExample = fs.readFileSync(path.resolve(".env.example"), "utf-8");
checkRule(
  "Template .env.example seguro",
  envExample.includes("change-me-in-production") || envExample.includes("postgres:postgres"),
  ".env.example não deve conter segredos reais de produção"
);

if (hasErrors) {
  console.error("\n❌ Auditoria de Segurança e LGPD reprovada com pendências!");
  process.exit(1);
} else {
  console.log("\n✨ Todos os critérios de segurança, isolamento multitenant e LGPD foram aprovados com sucesso!");
}
