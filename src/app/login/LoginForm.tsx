"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface SsoAvailability { google: boolean; microsoft: boolean }

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
    </svg>
  );
}

export function LoginForm({ sso }: { sso?: SsoAvailability }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = params.get("callbackUrl") ?? "/";
  const hasSso = sso?.google || sso?.microsoft;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("E-Mail oder Passwort falsch.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <>
      {/* SSO buttons */}
      {hasSso && (
        <>
          <div className="sso-section">
            {sso?.google && (
              <button
                type="button"
                className="sso-btn sso-btn-google"
                onClick={() => signIn("google", { callbackUrl })}
              >
                <GoogleIcon />
                Mit Google anmelden
              </button>
            )}
            {sso?.microsoft && (
              <button
                type="button"
                className="sso-btn sso-btn-microsoft"
                onClick={() => signIn("microsoft-entra-id", { callbackUrl })}
              >
                <MicrosoftIcon />
                Mit Microsoft anmelden
              </button>
            )}
          </div>
          <div className="sso-divider"><span>oder mit E-Mail &amp; Passwort</span></div>
        </>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label className="login-label" htmlFor="email">E-Mail-Adresse</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="login-input"
            placeholder="a.voss@continuum-audit.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="login-error">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4M10 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <span className="login-spinner" /> : null}
          {loading ? "Anmelden..." : "Anmelden"}
        </button>

        <div className="login-demo">
          <div className="login-demo-label">Demo-Zugänge</div>
          <div className="login-demo-grid">
            {[
              { label: "Head of Audit", email: "a.voss@continuum-audit.de" },
              { label: "Owner", email: "m.weiss@continuum-audit.de" },
              { label: "Reviewer", email: "s.hartmann@continuum-audit.de" },
              { label: "Admin", email: "admin@continuum-audit.de" },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                className="login-demo-btn"
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.label === "Admin" ? "admin2026!" : "audit2026!");
                }}
              >
                <span className="login-demo-role">{u.label}</span>
                <span className="login-demo-email">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </>
  );
}
