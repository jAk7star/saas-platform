"use client";

import { animate, createScope, stagger } from "animejs";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface PlanTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  badge?: string;
  highlighted?: boolean;
}

const PLANS: PlanTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    period: "grátis para sempre",
    description: "Ambiente sandbox para protótipos e validação de privacidade.",
    features: [
      "10.000 eventos sanitizados/mês",
      "Sanitização local de PII (LGPD Art. 13)",
      "Isolamento multitenant via PostgreSQL RLS",
      "SDKs tipados com Zero Contract Drift",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/mês",
    description: "Para startups em produção com pipelines analíticos e agentes de IA.",
    features: [
      "100.000 eventos sanitizados/mês",
      "Webhooks de Billing (Stripe / Polar)",
      "Mascaramento de rede IPv4/IPv6",
      "Retenção de 90 dias em PostgreSQL",
      "Suporte prioritário via SLA",
    ],
    badge: "Mais Popular",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$299",
    period: "/mês",
    description: "Para scale-ups e operações com auditoria estrita e alto volume.",
    features: [
      "1.000.000+ eventos sanitizados/mês",
      "Gateway de LLM dedicado com RLS",
      "Auditoria hash-chain imutável",
      "SLA de 99.9% e suporte 24/7",
    ],
  },
];

export function LandingPage({
  activeTenantId,
  onTenantCreated,
}: {
  activeTenantId?: string;
  onTenantCreated?: (tenantId: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

  const [tenantId, setTenantId] = useState(activeTenantId || "");
  const [currentPlan, setCurrentPlan] = useState<string>("starter");
  const [currentQuota, setCurrentQuota] = useState<number>(10_000);
  const [checkoutStatus, setCheckoutStatus] = useState<string>("");
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeTenantId) {
      setTenantId(activeTenantId);
      void fetchTenantPlan(activeTenantId);
    }
  }, [activeTenantId]);

  useEffect(() => {
    scopeRef.current = createScope({ root: rootRef }).add(() => {
      animate(".js-landing-hero", {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 650,
        ease: "outCubic",
      });
      animate(".js-pricing-card", {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100, { start: 200 }),
        duration: 600,
        ease: "outCubic",
      });
    });

    return () => {
      scopeRef.current?.revert();
    };
  }, []);

  async function fetchTenantPlan(tid: string) {
    try {
      const res = await fetch(`/api/billing?tenantId=${encodeURIComponent(tid)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data.planTier);
        setCurrentQuota(data.monthlyEventLimit);
      }
    } catch {
      // Ignora erro em modo offline/desconectado
    }
  }

  async function handleAutoCreateTenant() {
    setCheckoutStatus("Provisionando organização para checkout...");
    const email = `gtm-user-${Date.now()}@saas-platform.dev`;
    const signup = await authClient.signUp.email({
      name: "Growth Lead",
      email,
      password: "SenhaSegura!2026",
    });

    if (signup.error) {
      setCheckoutStatus(`Erro de autenticação: ${signup.error.message}`);
      return "";
    }

    const org = await authClient.organization.create({
      name: "Empresa GTM",
      slug: `org-gtm-${Date.now()}`,
    });

    if (org.error || !org.data) {
      setCheckoutStatus(`Erro ao criar organização: ${org.error?.message}`);
      return "";
    }

    const newId = org.data.id;
    setTenantId(newId);
    onTenantCreated?.(newId);
    setCheckoutStatus(`Organização criada: ${org.data.name}`);
    return newId;
  }

  async function handleCheckout(planId: string) {
    setCheckoutLoading(true);
    setCheckoutStatus("");

    let targetTenant = tenantId;
    if (!targetTenant) {
      targetTenant = await handleAutoCreateTenant();
      if (!targetTenant) {
        setCheckoutLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: targetTenant,
          planTier: planId,
          customerEmail: "financeiro@empresa.com",
          customerIp: "201.86.12.94",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutStatus(data.error ?? "Falha no checkout");
      } else {
        setCurrentPlan(data.billing.planTier);
        setCurrentQuota(data.billing.monthlyEventLimit);
        setCheckoutStatus(
          `Plano atualizado para ${data.billing.planTier.toUpperCase()}! Quota mensal: ${data.billing.monthlyEventLimit.toLocaleString("pt-BR")} eventos. Evento de telemetria disparado com sucesso.`,
        );
      }
    } catch (err) {
      setCheckoutStatus(err instanceof Error ? err.message : "Erro no checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div
      ref={rootRef}
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "3.5rem 1.5rem",
        display: "grid",
        gap: "3rem",
      }}
    >
      {/* Hero Section */}
      <section className="js-landing-hero" style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "9999px",
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid rgba(147, 197, 253, 0.3)",
            color: "#93c5fd",
            fontSize: "0.8125rem",
            fontWeight: 500,
            marginBottom: "1.25rem",
          }}
        >
          <span>●</span> Zero-Exposure &amp; LGPD Nativa · Ktor 3.4 + FastAPI
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            margin: "0 0 1.25rem 0",
          }}
        >
          Telemetria e Inteligência Analítica{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            sem expor dados pessoais
          </span>
        </h1>
        <p
          style={{
            maxWidth: "680px",
            margin: "0 auto 2rem auto",
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "#94a3b8",
          }}
        >
          Ingira eventos de aplicações e agentes de IA com sanitização determinística na borda.
          Garantia de zero vazamento de PII em logs, bancos ou chamadas a provedores de LLM.
        </p>

        {tenantId ? (
          <div
            data-testid="landing-tenant-banner"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              fontSize: "0.875rem",
            }}
          >
            Tenant Conectado: <code>{tenantId}</code> · Plano Atual:{" "}
            <strong data-testid="current-plan-badge" style={{ color: "#38bdf8" }}>
              {currentPlan.toUpperCase()} ({currentQuota.toLocaleString("pt-BR")} ev/mês)
            </strong>
          </div>
        ) : null}
      </section>

      {/* Status Alert */}
      {checkoutStatus ? (
        <div
          data-testid="checkout-status-alert"
          role="status"
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "0.5rem",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(52, 211, 153, 0.4)",
            color: "#6ee7b7",
            fontSize: "0.9375rem",
            textAlign: "center",
          }}
        >
          {checkoutStatus}
        </div>
      ) : null}

      {/* Pricing Cards (CRO Optimized) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          alignItems: "stretch",
        }}
      >
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className="js-pricing-card"
              data-testid={`pricing-card-${plan.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
                padding: "2rem 1.75rem",
                borderRadius: "1rem",
                background: plan.highlighted
                  ? "rgba(30, 41, 59, 0.85)"
                  : "rgba(15, 23, 42, 0.75)",
                border: plan.highlighted
                  ? "2px solid #3b82f6"
                  : "1px solid rgba(148, 163, 184, 0.25)",
                backdropFilter: "blur(12px)",
                boxShadow: plan.highlighted
                  ? "0 12px 36px -10px rgba(59, 130, 246, 0.3)"
                  : "none",
              }}
            >
              {plan.badge ? (
                <span
                  style={{
                    position: "absolute",
                    top: "-12px",
                    right: "24px",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    background: "#3b82f6",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {plan.badge}
                </span>
              ) : null}

              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "0 0 1.25rem 0" }}>
                {plan.description}
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>{plan.price}</span>
                <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{plan.period}</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0", display: "grid", gap: "0.75rem", flexGrow: 1 }}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "#cbd5e1" }}>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                data-testid={`btn-checkout-${plan.id}`}
                disabled={checkoutLoading || isCurrent}
                onClick={() => handleCheckout(plan.id)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  cursor: isCurrent || checkoutLoading ? "default" : "pointer",
                  background: isCurrent
                    ? "#334155"
                    : plan.highlighted
                      ? "#3b82f6"
                      : "rgba(255, 255, 255, 0.1)",
                  color: isCurrent ? "#94a3b8" : "#ffffff",
                  transition: "background 0.2s ease",
                }}
              >
                {isCurrent
                  ? "Plano Ativo"
                  : checkoutLoading
                    ? "Processando..."
                    : `Fazer Upgrade para ${plan.name}`}
              </button>
            </div>
          );
        })}
      </section>

      {/* Social Proof / Security Badges */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
          padding: "2rem",
          borderRadius: "0.75rem",
          background: "rgba(15, 23, 42, 0.5)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          textAlign: "center",
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 0.25rem 0", color: "#38bdf8" }}>LGPD Art. 13 &amp; 46</h4>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94a3b8" }}>
            Sanitização antes de persistência ou chamadas externas
          </p>
        </div>
        <div>
          <h4 style={{ margin: "0 0 0.25rem 0", color: "#38bdf8" }}>Zero Schema Drift</h4>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94a3b8" }}>
            SDKs tipados gerados pelo OpenAPI dos backends
          </p>
        </div>
        <div>
          <h4 style={{ margin: "0 0 0.25rem 0", color: "#38bdf8" }}>PostgreSQL RLS Nativo</h4>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94a3b8" }}>
            Isolamento criptográfico e por linha por tenant_id
          </p>
        </div>
      </section>
    </div>
  );
}
