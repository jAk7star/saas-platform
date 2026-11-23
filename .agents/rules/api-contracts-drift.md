---
trigger: always_on
description: Regras para sincronização de contratos OpenAPI entre FastAPI, Ktor e Next.js sem API drift.
---

# Regra de Contratos OpenAPI & Zero Drift

1. **Proibido `fetch`/`axios` manual para backends:** No frontend `apps/web`, todas as chamadas para os serviços `ai-etl` (FastAPI) e `core-jvm` (Ktor) devem usar exclusivamente os SDKs tipados gerados em `@saas/api-ai` e `@saas/api-core`.
2. **Regeneração obrigatória:** Qualquer alteração em schemas Pydantic v2 (FastAPI) ou DTOs/rotas do Ktor exige a execução imediata de `export-openapi` e `generate-client` via Nx antes de concluir a tarefa.
3. **Versão fixada:** `@hey-api/openapi-ts` deve permanecer com versão exata fixada no `package.json`.
