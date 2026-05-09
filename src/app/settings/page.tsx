import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApiKeySettings } from "./ApiKeySettings";

export const metadata = { title: "Einstellungen · Continuum Audit" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "head_of_audit") redirect("/");

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-1)", padding: "2rem" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
        <ApiKeySettings />
      </div>
    </div>
  );
}
