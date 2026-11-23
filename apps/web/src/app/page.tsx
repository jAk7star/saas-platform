"use client";

import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { ShaderBackdrop } from "@/components/ShaderBackdrop";
import { TelemetryDashboard } from "@/components/TelemetryDashboard";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"gtm" | "telemetry">("gtm");
  const [sharedTenantId, setSharedTenantId] = useState<string>("");

  return (
    <main style={{ position: "relative", minHeight: "100vh", paddingBottom: "4rem" }}>
      <ShaderBackdrop />

      {/* Top Header Navigation */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#38bdf8",
              boxShadow: "0 0 12px #38bdf8",
            }}
          />
          <span style={{ fontWeight: 700, fontSize: "1.125rem", letterSpacing: "-0.01em" }}>
            SaaS Platform <span style={{ color: "#94a3b8", fontWeight: 400 }}>· BaaS Poliglota</span>
          </span>
        </div>

        <nav style={{ display: "flex", gap: "0.5rem", background: "rgba(15, 23, 42, 0.6)", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
          <button
            type="button"
            data-testid="tab-gtm"
            onClick={() => setActiveTab("gtm")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "0.375rem",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "gtm" ? "#3b82f6" : "transparent",
              color: activeTab === "gtm" ? "#ffffff" : "#94a3b8",
              transition: "all 0.2s ease",
            }}
          >
            Landing &amp; Billing (M3)
          </button>
          <button
            type="button"
            data-testid="tab-telemetry"
            onClick={() => setActiveTab("telemetry")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "0.375rem",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === "telemetry" ? "#3b82f6" : "transparent",
              color: activeTab === "telemetry" ? "#ffffff" : "#94a3b8",
              transition: "all 0.2s ease",
            }}
          >
            Telemetria Tracer Bullet (M2)
          </button>
        </nav>
      </header>

      {/* Active Tab Content */}
      {activeTab === "gtm" ? (
        <LandingPage
          activeTenantId={sharedTenantId}
          onTenantCreated={(id) => setSharedTenantId(id)}
        />
      ) : (
        <TelemetryDashboard />
      )}
    </main>
  );
}
