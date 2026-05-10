import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Anmelden · Continuum Audit",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const sso = {
    google: !!process.env.GOOGLE_CLIENT_ID,
    microsoft: !!process.env.MICROSOFT_CLIENT_ID,
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-mark">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 12h3l2-5 3 10 2-5h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="login-brand-name">CONTINUUM<span>·</span>AUDIT</div>
            <div className="login-brand-sub">Continuous Auditing Plattform</div>
          </div>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1 className="login-title">Willkommen zurück</h1>
          <p className="login-subtitle">Melden Sie sich mit Ihrem Audit-Account an</p>
        </div>

        <Suspense>
          <LoginForm sso={sso} />
        </Suspense>

        {/* Footer */}
        <div className="login-footer">
          <span>© 2026 Continuum Audit GmbH</span>
          <span>·</span>
          <span>Datenschutz</span>
          <span>·</span>
          <span>Impressum</span>
        </div>
      </div>

      {/* Right panel — visual */}
      <div className="login-visual">
        <div className="login-visual-content">
          <div className="lv-eyebrow">Continuous Auditing · Q2 2026</div>
          <h2 className="lv-headline">KI-gestützte Prüfung.<br />Rund um die Uhr.</h2>
          <p className="lv-sub">Autonome Agenten überwachen Ihre Kennzahlen in Echtzeit und eskalieren nur dann, wenn menschliche Beurteilung wirklich gefragt ist.</p>

          <div className="lv-stats">
            <div className="lv-stat">
              <div className="lv-stat-num">28</div>
              <div className="lv-stat-label">KPIs überwacht</div>
            </div>
            <div className="lv-stat">
              <div className="lv-stat-num">10</div>
              <div className="lv-stat-label">Prüfbereiche</div>
            </div>
            <div className="lv-stat">
              <div className="lv-stat-num">91%</div>
              <div className="lv-stat-label">Ø KI-Konfidenz</div>
            </div>
          </div>

          {/* Decorative card */}
          <div className="lv-card">
            <div className="lv-card-head">
              <span className="lv-card-dot lv-dot-alert" />
              <span className="lv-card-code">REW-01</span>
              <span className="lv-card-tag">Befund</span>
            </div>
            <div className="lv-card-title">Manuelle Buchungen außerhalb Geschäftszeiten</div>
            <div className="lv-card-meta">JournalSentry v3.1 · 47 Auffälligkeiten · +18 vs. Q1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
