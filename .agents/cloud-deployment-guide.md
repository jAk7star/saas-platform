# Guia Operacional de Deploy Cloud: Neon, Railway & Vercel

Este documento detalha o mapa de segredos, variáveis de ambiente e o fluxo de execução para a publicação em produção da plataforma SaaS/BaaS poliglota.

---

## 1. Arquitetura de Produção

```mermaid
flowchart TD
    User["Usuário / Agente de IA"] --> Vercel["apps/web (Next.js 15)\nVercel Fluid Compute"]
    
    subgraph Railway["Railway Private Network (*.railway.internal)"]
        Ktor["services/core-jvm (Ktor 3.4)\nJDK 25 LTS - Port 8080"]
        FastAPI["services/ai-etl (FastAPI)\nPython 3.12 - Port 8000"]
    end
    
    Vercel -->|BFF SDK Calls| Ktor
    Vercel -->|BFF SDK Calls| FastAPI
    
    subgraph Neon["Neon Serverless PostgreSQL 16"]
        AuthSchema["schema 'auth' (Drizzle / Better Auth)"]
        CoreSchema["schema 'core' (Flyway / Exposed)"]
        AISchema["schema 'ai' (Alembic / SQLAlchemy - RLS)"]
    end
    
    Vercel -->|Pooler Connection :6543| AuthSchema
    Ktor -->|Direct Connection :5432| CoreSchema
    FastAPI -->|Direct Connection :5432| AISchema
```

---

## 2. Mapa de Segredos no GitHub Actions (`Settings -> Secrets and variables -> Actions`)

Para que o workflow `.github/workflows/deploy-production.yml` e o `.github/workflows/neon-preview.yml` operem de forma autônoma:

| Nome do Segredo | Descrição | Onde Obter |
| :--- | :--- | :--- |
| `NEON_DATABASE_URL` | String de conexão direta do PostgreSQL Neon para produção | Neon Console -> Dashboard -> Connection String (`postgres://...`) |
| `NEON_PROJECT_ID` | Identificador do projeto no Neon (ex: `ep-mute-pond-123456`) | URL do projeto no Neon Console |
| `NEON_API_KEY` | Token de API pessoal do Neon para automação de branches efêmeras | Neon Console -> Account Settings -> API Keys |
| `RAILWAY_TOKEN` | Token de autenticação CLI da Railway | Railway Dashboard -> Account Settings -> Tokens |
| `VERCEL_TOKEN` | Token de deploy da Vercel | Vercel Dashboard -> Account Settings -> Tokens |
| `VERCEL_ORG_ID` | ID do time/usuário na Vercel | Vercel Project -> Settings -> General |
| `VERCEL_PROJECT_ID` | ID do projeto na Vercel | Vercel Project -> Settings -> General |
| `PROD_WEB_URL` | URL pública da aplicação após deploy (ex: `https://meu-saas.vercel.app`) | Vercel Deployment Domain |

---

## 3. Variáveis de Ambiente por Serviço

### A. Vercel (`apps/web`)
Configurar no painel da Vercel (`Project Settings -> Environment Variables`):
- `DATABASE_URL`: String de conexão do Neon com pooling (porta `6543`, `sslmode=require`).
- `BETTER_AUTH_SECRET`: Chave secreta de 32+ caracteres (`openssl rand -hex 32`).
- `BETTER_AUTH_URL`: URL pública da aplicação (ex: `https://meu-saas.vercel.app`).
- `NEXT_PUBLIC_APP_URL`: URL pública da aplicação (ex: `https://meu-saas.vercel.app`).
- `CORE_JVM_URL`: URL pública ou privada gerada pelo Railway para o Ktor (ex: `https://core-jvm-production.up.railway.app`).
- `AI_ETL_URL`: URL pública ou privada gerada pelo Railway para o FastAPI (ex: `https://ai-etl-production.up.railway.app`).

### B. Railway — `services/ai-etl`
Configurar nas variáveis do serviço `ai-etl`:
- `PORT`: `8000`
- `DATABASE_URL`: `postgresql+psycopg://user:password@ep-host.neon.tech/neondb?sslmode=require`
- `PII_HASH_PEPPER`: Segredo longo para salteamento do hashing LGPD (`openssl rand -hex 32`).

### C. Railway — `services/core-jvm`
Configurar nas variáveis do serviço `core-jvm`:
- `PORT`: `8080`
- `CORE_JDBC_URL`: `jdbc:postgresql://ep-host.neon.tech:5432/neondb?sslmode=require`
- `POSTGRES_USER`: Usuário do Neon
- `POSTGRES_PASSWORD`: Senha do Neon

---

## 4. Pipeline de Continuous Deployment (CD)

O pipeline `.github/workflows/deploy-production.yml` executa 4 fases em sequência estrita:
1. **Validate & Migrate:** Roda auditoria de segurança (`pnpm audit:security`), drift check de contratos OpenAPI e aplica migrações no banco Neon (`db:push` e `alembic upgrade head`).
2. **Deploy Railway:** Usa a Railway CLI para atualizar os contêineres de `ai-etl` e `core-jvm`.
3. **Deploy Vercel:** Compila e publica `apps/web` em modo produção.
4. **Smoke Test:** Efetua healthcheck na URL pública para confirmar prontidão operacional.
