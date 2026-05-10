import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ApiKeySettings } from "./ApiKeySettings";
import { DataSourceSettings } from "./DataSourceSettings";
import { WebhookSettings } from "./WebhookSettings";

export const metadata = { title: "Einstellungen · Continuum Audit" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "head_of_audit") redirect("/");

  const { tab } = await searchParams;
  const activeTab = tab === "datasources" ? "datasources" : tab === "webhooks" ? "webhooks" : "apikeys";

  const kpis = await db.kpi.findMany({
    select: { id: true, code: true, title: true },
    orderBy: { code: "asc" },
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-1)", padding: "2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <a href="/" style={{ color: "var(--ink-3)", fontSize: "0.875rem", textDecoration: "none" }}>
            ← Zurück zum Dashboard
          </a>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--ink-1)", marginTop: "1rem" }}>
            Einstellungen
          </h1>
          <p style={{ color: "var(--ink-3)", fontSize: "0.875rem" }}>
            Plattform-Konfiguration und KI-Agenten-Einstellungen
          </p>
        </div>

        {/* Tab bar */}
        <div className="settings-tabs">
          <a href="/settings?tab=apikeys" className={`settings-tab${activeTab === "apikeys" ? " settings-tab-active" : ""}`}>
            KI-Provider & API-Keys
          </a>
          <a href="/settings?tab=datasources" className={`settings-tab${activeTab === "datasources" ? " settings-tab-active" : ""}`}>
            Datenquellen
          </a>
          <a href="/settings?tab=webhooks" className={`settings-tab${activeTab === "webhooks" ? " settings-tab-active" : ""}`}>
            Webhooks
          </a>
        </div>

        {activeTab === "apikeys" && <ApiKeySettings />}
        {activeTab === "datasources" && <DataSourceSettings kpis={kpis} />}
        {activeTab === "webhooks" && <WebhookSettings />}
      </div>
    </div>
  );
}
