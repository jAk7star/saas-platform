---
trigger: always_on
description: Regras invariantes de privacidade LGPD e sanitização Zero-Exposure no backend Python/FastAPI e logs.
---

# Regra Zero-Exposure & Conformidade LGPD

1. **Proibido PII em texto claro no schema `ai`:** Campos como `email`, `cpf`, `cnpj`, `telefone` e `ip_address` recebidos na ingestão devem ser sanitizados localmente (SHA-256 com salt do tenant ou mascaramento `/24`) antes de qualquer persistência ou envio para LLMs.
2. **Proibido PII em logs:** Nunca usar `print()`, `logger.info()` ou `console.log()` com payloads brutos de entrada (`actor_raw`) ou tokens de sessão.
3. **Isolamento Multitenant:** Toda tabela de negócio nos schemas `core` e `ai` deve exigir `tenant_id UUID NOT NULL` com Row-Level Security (RLS) ativo no PostgreSQL.
