# Comandos de Execução e Verificação do Monorepo

- Subir ambiente local: `docker compose up -d`
- Instalar dependências: `pnpm install`
- Exportar contratos OpenAPI: `pnpm nx run-many --target=export-openapi --all`
- Regenerar SDKs TypeScript: `pnpm nx run-many --target=generate-client --all`
- Validar tipos e drift: `pnpm typecheck && git diff --exit-code packages/`
- Testes unitários e integração: `pnpm nx run-many --target=test --all`
- Testes E2E (Tracer Bullet): `pnpm test:e2e`
- Auditoria de Segurança & LGPD: `pnpm audit:security`
- Formatação e Lint: `pnpm lint && pnpm format`
