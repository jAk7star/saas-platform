"use client";

import { animate, createScope, stagger } from "animejs";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface SanitizedEvent {
  id: string;
  tenant_id: string;
  event_name: string;
  source: string;
  actor_hash: string | null;
  sanitized_payload: Record<string, unknown>;
  occurred_at: string;
}

interface QuotaInfo {
  tenantId: string;
  allowed: boolean;
  planTier: string;
  remainingQuota: number;
}

export function TelemetryDashboard() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

  const [name, setName] = useState("Ana Silva");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("SenhaForte!2026");
  const [orgName, setOrgName] = useState("Acme Labs");
  const [tenantId, setTenantId] = useState<string>("");
  const [authStatus, setAuthStatus] = useState<string>("");

  const [piiEmail, setPiiEmail] = useState("maria.silva@empresa.com");
  const [piiIp, setPiiIp] = useState("192.168.10.55");
  const [piiPhone, setPiiPhone] = useState("+55 11 99887-7665");
  const [piiNote, setPiiNote] = useState("Cliente CPF 123.456.789-00");

  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [events, setEvents] = useState<SanitizedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    scopeRef.current = createScope({ root: rootRef }).add(() => {
      animate(".js-tracer-card", {
        opacity: [0, 1],
        translateY: [16, 0],
        delay: stagger(90),
        duration: 550,
        ease: "outCubic",
      });
    });

    return () => {
      scopeRef.current?.revert();
    };
  }, []);

  async function handleSignupAndCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setAuthStatus("Criando conta e organização...");

    const signupEmail =
      email.trim() || `tracer-${Date.now()}@saas-platform.dev`;
    const signUpRes = await authClient.signUp.email({
      name,
      email: signupEmail,
      password,
    });

    if (signUpRes.error) {
      setErrorMsg(signUpRes.error.message ?? "Erro ao criar conta");
      setAuthStatus("");
      return;
    }

    const slug = `tenant-${Date.now()}`;
    const orgRes = await authClient.organization.create({
      name: orgName,
      slug,
    });

    if (orgRes.error || !orgRes.data) {
      setErrorMsg(orgRes.error?.message ?? "Erro ao criar organização");
      setAuthStatus("");
      return;
    }

    setTenantId(orgRes.data.id);
    setAuthStatus(`Tenant ativo: ${orgRes.data.name} (${orgRes.data.id})`);
  }

  async function handleRunTracerBullet(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      setErrorMsg("Crie um tenant primeiro antes de disparar o Tracer Bullet.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/tracer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          eventName: "user_signup_completed",
          email: piiEmail,
          ipAddress: piiIp,
          phone: piiPhone,
          note: piiNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Falha no Tracer Bullet");
        return;
      }
      setQuota(data.quota);

      const listRes = await fetch(
        `/api/tracer?tenantId=${encodeURIComponent(tenantId)}`,
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        setEvents(listData.items ?? []);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={rootRef}
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "3rem 1.5rem",
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <header className="js-tracer-card">
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#93c5fd",
            marginBottom: "0.5rem",
          }}
        >
          M2 Tracer Bullet · Zero-Exposure LGPD
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
          Telemetria Multitenant &amp; Sanitização Local
        </h1>
      </header>

      {errorMsg ? (
        <div
          role="alert"
          style={{
            padding: "0.875rem 1rem",
            borderRadius: "0.5rem",
            background: "rgba(220, 38, 38, 0.2)",
            border: "1px solid rgba(248, 113, 113, 0.5)",
            color: "#fecaca",
          }}
        >
          {errorMsg}
        </div>
      ) : null}

      <section
        className="js-tracer-card"
        style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(15, 23, 42, 0.78)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", marginTop: 0 }}>
          1. Autenticação &amp; Tenant (Better Auth)
        </h2>
        <form
          onSubmit={handleSignupAndCreateTenant}
          style={{ display: "grid", gap: "0.75rem", maxWidth: "460px" }}
        >
          <input
            aria-label="Nome"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Email de cadastro"
            placeholder="Email (deixe vazio para gerar único)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Nome da Organização"
            placeholder="Nome da Organização"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Criar Conta &amp; Tenant
          </button>
        </form>
        {authStatus ? (
          <p
            data-testid="tenant-status"
            style={{ marginTop: "0.75rem", color: "#86efac" }}
          >
            {authStatus}
          </p>
        ) : null}
      </section>

      <section
        className="js-tracer-card"
        style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(15, 23, 42, 0.78)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", marginTop: 0 }}>
          2. Ingestão com PII Intencional (Ktor Quota → FastAPI Sanitizer)
        </h2>
        <form
          onSubmit={handleRunTracerBullet}
          style={{ display: "grid", gap: "0.75rem", maxWidth: "460px" }}
        >
          <input
            aria-label="Email PII"
            value={piiEmail}
            onChange={(e) => setPiiEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="IP PII"
            value={piiIp}
            onChange={(e) => setPiiIp(e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Telefone PII"
            value={piiPhone}
            onChange={(e) => setPiiPhone(e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Nota com CPF"
            value={piiNote}
            onChange={(e) => setPiiNote(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Processando..." : "Disparar Tracer Bullet"}
          </button>
        </form>

        {quota ? (
          <div
            data-testid="quota-result"
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              background: "rgba(30, 41, 59, 0.9)",
            }}
          >
            <strong>Quota Ktor:</strong> plano <code>{quota.planTier}</code> ·
            restante <code>{quota.remainingQuota}</code> · permitido:{" "}
            <code>{String(quota.allowed)}</code>
          </div>
        ) : null}
      </section>

      <section
        className="js-tracer-card"
        style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(15, 23, 42, 0.78)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", marginTop: 0 }}>
          3. Eventos Higienizados (Schema ai)
        </h2>
        {events.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>Nenhum evento ingerido ainda.</p>
        ) : (
          <ul
            data-testid="events-list"
            style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}
          >
            {events.map((ev) => (
              <li
                key={ev.id}
                style={{
                  padding: "0.875rem",
                  borderRadius: "0.5rem",
                  background: "rgba(30, 41, 59, 0.9)",
                  fontSize: "0.875rem",
                }}
              >
                <div>
                  <strong>{ev.event_name}</strong> · actor_hash:{" "}
                  <code>{ev.actor_hash ?? "null"}</code>
                </div>
                <pre
                  style={{
                    margin: "0.5rem 0 0",
                    whiteSpace: "pre-wrap",
                    color: "#cbd5e1",
                  }}
                >
                  {JSON.stringify(ev.sanitized_payload, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 0.75rem",
  borderRadius: "0.375rem",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.625rem 1rem",
  borderRadius: "0.375rem",
  border: "none",
  background: "#3b82f6",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
};
