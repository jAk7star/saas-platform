import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SaaS Platform — Zero-Exposure Telemetry",
  description: "Polyglot SaaS/BaaS Monorepo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#f8fafc",
          backgroundColor: "#070a14",
        }}
      >
        {children}
      </body>
    </html>
  );
}
