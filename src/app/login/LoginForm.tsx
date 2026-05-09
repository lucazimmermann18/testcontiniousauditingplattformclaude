"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = params.get("callbackUrl") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-Mail oder Passwort falsch.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
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
        {loading ? (
          <span className="login-spinner" />
        ) : null}
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
  );
}
