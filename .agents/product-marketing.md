# Product Marketing Context: SaaS/BaaS Poliglota (Zero-Exposure)

**Document version:** 1.0.0  
**Last updated:** 2026-11-23  

---

## 1. Product Overview
- **One-line description:** Plataforma SaaS/BaaS poliglota com motor de telemetria analítica Zero-Exposure e isolamento multitenant nativo por RLS.
- **What it does:** Permite que empresas ingiram, monitorem e analisem eventos de telemetria e fluxos de IA sem expor dados pessoais (PII). Todos os identificadores (e-mail, IP, CPF, telefone) são sanitizados e tokenizados localmente antes de qualquer persistência ou chamada a LLMs.
- **Product category:** Developer Tools & Enterprise BaaS / Privacy-First Observability & AI Telemetry.
- **Product type:** B2B SaaS & Developer API Platform.
- **Business model & pricing:** Freemium / Tier-based com quota mensal de eventos.
  - **Starter (Free/Sandbox):** 10.000 eventos/mês, RLS multitenant, sanitização local LGPD.
  - **Pro (\$49/mês):** 100.000 eventos/mês, webhooks de billing automáticos, suporte prioritário.
  - **Enterprise (\$299/mês):** Eventos ilimitados, retenção estendida, suporte a LLM Gateway dedicado.

## 2. Target Audience
- **Target company type:** Startups B2B, scale-ups de tecnologia, fintechs e empresas com fluxos de telemetria/IA sujeitas à conformidade com LGPD/GDPR.
- **Target decision-makers:** CTOs, Tech Leads, Engenheiros de Software e DPOs (Data Protection Officers).
- **Primary use case:** Ingestão de dados analíticos e de telemetria de agentes de IA com garantia matemática de que nenhum dado confidencial ou identificável atinja provedores externos ou bancos desprotegidos.
- **Jobs to be Done:**
  1. Integrar telemetria analítica com SDK tipado gerado automaticamente e zero drift contratual.
  2. Cumprir integralmente regulações de privacidade (LGPD Art. 13 e 46) com sanitização determinística na borda.
  3. Controlar planos e quotas de múltiplos clientes com isolamento estrito via PostgreSQL Row-Level Security (RLS).

## 3. Personas
- **Technical Champion (Tech Lead / Engenheiro Sênior):** Quer SDKs TypeScript com tipagem estrita gerados diretamente do backend (Zero Drift), sem retrabalho de cliente HTTP ou bugs de contrato.
- **Security / DPO (Encarregado de Proteção de Dados):** Exige conformidade formal: PII nunca gravada em texto claro, IPs mascarados para /24 e hashes irreversíveis com salteamento por tenant.
- **Decision Maker (CTO / Founder):** Busca previsibilidade de custos, time-to-market acelerado com arquitetura robusta e escalável (Ktor assíncrono + FastAPI + Next.js).

## 4. Problems & Pain Points
- **Risco LGPD & Multas:** Ferramentas de analytics tradicionais expõem e-mails e IPs de usuários a servidores externos ou logs de aplicação, violando normas de privacidade.
- **Schema Drift & Contratos Frágeis:** Times perdem semanas sincronizando DTOs entre Kotlin/Python e TypeScript no frontend.
- **Isolamento Multitenant Inseguro:** Erros de codificação em queries SQL misturam dados de organizações distintas na mesma base.

## 5. Differentiation
- **Zero-Exposure por Design:** Hashing SHA-256 salteado por organização e mascaramento de rede executado em memória antes do banco.
- **Poliglota de Alta Performance:** Núcleo de regras e cobrança em Ktor 3.4 (Kotlin assíncrono instantâneo), ingestão em FastAPI e interface interativa em Next.js com WebGL Paper Shaders e Anime.js.
- **Garantia Contratual Zero Drift:** `@hey-api/openapi-ts` integrado ao pipeline CI (`git diff --exit-code`) para barrar qualquer discrepância entre backend e frontend.

---

## Changelog
- **2026-11-23 (v1.0.0):** Criação do documento canônico de Product Marketing Context para alinhamento de GTM, landing page e billing no Marco M3.
