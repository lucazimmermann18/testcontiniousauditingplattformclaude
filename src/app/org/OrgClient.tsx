"use client";
import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────

interface Org {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
  allowedDomains: string | null;
  ssoGoogle: boolean;
  ssoMicrosoft: boolean;
  createdAt: string;
  _count?: { members: number; invites: number };
}

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  head_of_audit: "Head of Audit",
  owner: "Process Owner",
  reviewer: "Reviewer",
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  trial:      { label: "Trial",       color: "#94a3b8" },
  pro:        { label: "Pro",         color: "#3b82f6" },
  enterprise: { label: "Enterprise",  color: "#8b5cf6" },
};

// ── Sub-components ────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "#ef4444",
    head_of_audit: "#f59e0b",
    owner: "#3b82f6",
    reviewer: "#94a3b8",
  };
  return (
    <span className="org-role-badge" style={{ background: (colors[role] ?? "#94a3b8") + "18", color: colors[role] ?? "#94a3b8" }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ── Overview tab ──────────────────────────────────────────────

function OverviewTab({ org, onUpdate }: { org: Org; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(org.name);
  const [logoUrl, setLogoUrl] = useState(org.logoUrl ?? "");
  const [domains, setDomains] = useState(org.allowedDomains ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, logoUrl: logoUrl || null, allowedDomains: domains || null }),
    });
    setSaving(false);
    setEditing(false);
    onUpdate();
  }

  const plan = PLAN_LABELS[org.plan] ?? { label: org.plan, color: "#94a3b8" };

  return (
    <div className="org-overview">
      <div className="org-info-card">
        <div className="org-info-head">
          <div className="org-logo-wrap">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="org-logo-img" />
            ) : (
              <div className="org-logo-placeholder">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="org-info-name">{org.name}</h2>
            <div className="org-info-slug">/{org.slug}</div>
          </div>
          <span className="org-plan-badge" style={{ background: plan.color + "18", color: plan.color }}>
            {plan.label}
          </span>
          <button className="org-edit-btn" onClick={() => setEditing(!editing)}>
            {editing ? "Abbrechen" : "Bearbeiten"}
          </button>
        </div>

        {editing && (
          <div className="org-edit-form">
            <label className="org-field-label">Organisationsname</label>
            <input className="org-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meine Organisation" />
            <label className="org-field-label">Logo-URL (optional)</label>
            <input className="org-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            <label className="org-field-label">Erlaubte Domains für automatischen Beitritt</label>
            <input className="org-input" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="continuum-audit.de, example.com" />
            <div className="org-field-hint">Kommagetrennte Domains — Nutzer mit diesen E-Mail-Domains treten automatisch bei.</div>
            <button className="org-save-btn" onClick={save} disabled={saving}>
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        )}

        <div className="org-stat-row">
          <div className="org-stat">
            <div className="org-stat-val">{org._count?.members ?? "—"}</div>
            <div className="org-stat-label">Mitglieder</div>
          </div>
          <div className="org-stat">
            <div className="org-stat-val">{org._count?.invites ?? 0}</div>
            <div className="org-stat-label">Offene Einladungen</div>
          </div>
          <div className="org-stat">
            <div className="org-stat-val">{new Date(org.createdAt).toLocaleDateString("de-DE", { month: "short", year: "numeric" })}</div>
            <div className="org-stat-label">Erstellt</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Members tab ───────────────────────────────────────────────

function MembersTab({ members, onUpdate }: { members: Member[]; onUpdate: () => void }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function changeRole(member: Member, role: string) {
    setLoadingId(member.id);
    await fetch("/api/org/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id, role }),
    });
    setLoadingId(null);
    onUpdate();
  }

  async function removeMember(member: Member) {
    if (!confirm(`${member.user.name} wirklich entfernen?`)) return;
    setLoadingId(member.id);
    await fetch(`/api/org/members?memberId=${member.id}`, { method: "DELETE" });
    setLoadingId(null);
    onUpdate();
  }

  return (
    <div className="org-members">
      {members.length === 0 && <div className="tab-empty">Keine Mitglieder gefunden.</div>}
      <div className="org-member-list">
        {members.map((m) => (
          <div key={m.id} className="org-member-row">
            <div className="org-member-avatar">{m.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
            <div className="org-member-info">
              <div className="org-member-name">{m.user.name}</div>
              <div className="org-member-email">{m.user.email}</div>
            </div>
            <RoleBadge role={m.role} />
            <select
              className="org-role-select"
              value={m.role}
              disabled={loadingId === m.id}
              onChange={(e) => changeRole(m, e.target.value)}
            >
              <option value="reviewer">Reviewer</option>
              <option value="owner">Process Owner</option>
              <option value="head_of_audit">Head of Audit</option>
              <option value="admin">Administrator</option>
            </select>
            <button
              className="org-remove-btn"
              onClick={() => removeMember(m)}
              disabled={loadingId === m.id}
              title="Entfernen"
            >
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <path d="M3 6h14M8 6V4h4v2M19 6l-1 11a2 2 0 01-2 2H4a2 2 0 01-2-2L1 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Invites tab ───────────────────────────────────────────────

function InvitesTab({ invites, onUpdate }: { invites: Invite[]; onUpdate: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reviewer");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function sendInvite() {
    if (!email) return;
    setSending(true);
    const res = await fetch("/api/org/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setEmail("");
      setToast(data.autoAdded ? `${email} wurde direkt hinzugefügt.` : `Einladung an ${email} erstellt.`);
      setTimeout(() => setToast(null), 4000);
      onUpdate();
    } else {
      setToast(data.error ?? "Fehler");
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function revokeInvite(id: string) {
    await fetch(`/api/org/invite?id=${id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <div className="org-invites">
      {toast && <div className="org-toast">{toast}</div>}

      <div className="org-invite-form">
        <h3 className="org-section-title">Neues Mitglied einladen</h3>
        <div className="org-invite-row">
          <input
            className="org-input org-invite-email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select className="org-role-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="reviewer">Reviewer</option>
            <option value="owner">Process Owner</option>
            <option value="head_of_audit">Head of Audit</option>
            <option value="admin">Administrator</option>
          </select>
          <button className="org-save-btn" onClick={sendInvite} disabled={sending || !email}>
            {sending ? "..." : "Einladen"}
          </button>
        </div>
        <div className="org-field-hint">Wenn der Nutzer bereits ein Konto hat, wird er sofort hinzugefügt. Andernfalls tritt er bei der nächsten Anmeldung bei.</div>
      </div>

      <div className="org-invite-list">
        <h3 className="org-section-title">Offene Einladungen ({invites.length})</h3>
        {invites.length === 0 && <div className="tab-empty">Keine offenen Einladungen.</div>}
        {invites.map((inv) => (
          <div key={inv.id} className="org-invite-row-item">
            <div className="org-invite-email-cell">{inv.email}</div>
            <RoleBadge role={inv.role} />
            <div className="org-invite-expires">
              Läuft ab: {new Date(inv.expiresAt).toLocaleDateString("de-DE")}
            </div>
            <button className="org-remove-btn" onClick={() => revokeInvite(inv.id)} title="Widerrufen">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SSO tab ───────────────────────────────────────────────────

function SsoTab({ ssoConfigured }: { ssoConfigured: { google: boolean; microsoft: boolean } }) {
  return (
    <div className="org-sso">
      <p className="org-sso-intro">
        Single Sign-On erlaubt Ihrem Team, sich mit bestehenden Google- oder Microsoft-Accounts anzumelden — ohne separate Passwörter. Zur Einrichtung sind App-Registrierungen in den jeweiligen Developer-Konsolen erforderlich.
      </p>

      {/* Google */}
      <div className={`org-sso-card${ssoConfigured.google ? " org-sso-active" : ""}`}>
        <div className="org-sso-card-head">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <div>
            <div className="org-sso-provider-name">Google Workspace</div>
            <div className="org-sso-provider-sub">OAuth 2.0 via Google Cloud Console</div>
          </div>
          <span className={`org-sso-status-badge${ssoConfigured.google ? " active" : ""}`}>
            {ssoConfigured.google ? "✓ Aktiv" : "Nicht konfiguriert"}
          </span>
        </div>
        {!ssoConfigured.google && (
          <div className="org-sso-steps">
            <div className="org-sso-step"><span className="org-sso-step-n">1</span> Öffnen Sie <strong>console.cloud.google.com</strong> → APIs &amp; Services → Credentials</div>
            <div className="org-sso-step"><span className="org-sso-step-n">2</span> Erstellen Sie einen <strong>OAuth 2.0 Client</strong> (Web application)</div>
            <div className="org-sso-step"><span className="org-sso-step-n">3</span> Authorized redirect URI: <code className="org-sso-code">{typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}/api/auth/callback/google</code></div>
            <div className="org-sso-step"><span className="org-sso-step-n">4</span> Setzen Sie in <code className="org-sso-code">.env</code>:<br/><code className="org-sso-code">GOOGLE_CLIENT_ID=&quot;...&quot;<br/>GOOGLE_CLIENT_SECRET=&quot;...&quot;</code></div>
          </div>
        )}
      </div>

      {/* Microsoft */}
      <div className={`org-sso-card${ssoConfigured.microsoft ? " org-sso-active" : ""}`}>
        <div className="org-sso-card-head">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
            <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
            <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
            <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
          </svg>
          <div>
            <div className="org-sso-provider-name">Microsoft Entra ID</div>
            <div className="org-sso-provider-sub">Azure Active Directory / Entra ID</div>
          </div>
          <span className={`org-sso-status-badge${ssoConfigured.microsoft ? " active" : ""}`}>
            {ssoConfigured.microsoft ? "✓ Aktiv" : "Nicht konfiguriert"}
          </span>
        </div>
        {!ssoConfigured.microsoft && (
          <div className="org-sso-steps">
            <div className="org-sso-step"><span className="org-sso-step-n">1</span> Öffnen Sie <strong>portal.azure.com</strong> → Microsoft Entra ID → App registrations → New</div>
            <div className="org-sso-step"><span className="org-sso-step-n">2</span> Redirect URI (Web): <code className="org-sso-code">{typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}/api/auth/callback/microsoft-entra-id</code></div>
            <div className="org-sso-step"><span className="org-sso-step-n">3</span> Erstellen Sie ein <strong>Client Secret</strong> unter Certificates &amp; secrets</div>
            <div className="org-sso-step"><span className="org-sso-step-n">4</span> Setzen Sie in <code className="org-sso-code">.env</code>:<br/><code className="org-sso-code">MICROSOFT_CLIENT_ID=&quot;...&quot;<br/>MICROSOFT_CLIENT_SECRET=&quot;...&quot;<br/>MICROSOFT_TENANT_ID=&quot;common&quot;</code></div>
          </div>
        )}
      </div>

      <div className="org-sso-note">
        Nach dem Setzen der Umgebungsvariablen erscheinen die SSO-Buttons automatisch auf der Anmeldeseite. Benutzer, die sich erstmalig per SSO anmelden, erhalten die Rolle <strong>Reviewer</strong> und können dann von einem Admin hochgestuft werden.
      </div>
    </div>
  );
}

// ── Create org form ───────────────────────────────────────────

function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function toSlug(s: string) {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function create() {
    if (!name || !slug) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      onCreated();
    } else {
      setError(data.error ?? "Fehler beim Erstellen");
    }
  }

  return (
    <div className="org-create-wrap">
      <div className="org-create-card">
        <div className="org-create-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
            <path d="M3 21h18M3 7v14M21 7v14M9 21V12h6v9M3 7l9-4 9 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="org-create-title">Organisation erstellen</h2>
        <p className="org-create-sub">Richten Sie Ihre Organisation ein, um Mitglieder zu verwalten und SSO zu aktivieren.</p>
        <div className="org-edit-form">
          <label className="org-field-label">Name der Organisation</label>
          <input
            className="org-input"
            placeholder="Continuum Audit GmbH"
            value={name}
            onChange={(e) => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)); }}
          />
          <label className="org-field-label">URL-Slug</label>
          <div className="org-slug-wrap">
            <span className="org-slug-prefix">app/</span>
            <input
              className="org-input org-slug-input"
              placeholder="continuum-audit"
              value={slug}
              onChange={(e) => setSlug(toSlug(e.target.value))}
            />
          </div>
          {error && <div className="org-error">{error}</div>}
          <button className="org-save-btn" onClick={create} disabled={creating || !name || !slug}>
            {creating ? "Erstellen..." : "Organisation erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

type Tab = "overview" | "members" | "invites" | "sso";

export function OrgClient({ ssoConfigured }: { ssoConfigured: { google: boolean; microsoft: boolean } }) {
  const [org, setOrg] = useState<Org | null | undefined>(undefined); // undefined = loading
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tab, setTab] = useState<Tab>("overview");

  const loadOrg = useCallback(async () => {
    const res = await fetch("/api/org");
    const data = await res.json();
    setOrg(data);
  }, []);

  const loadMembers = useCallback(async () => {
    const res = await fetch("/api/org/members");
    if (res.ok) setMembers(await res.json());
  }, []);

  const loadInvites = useCallback(async () => {
    const res = await fetch("/api/org/invite");
    if (res.ok) setInvites(await res.json());
  }, []);

  const refresh = useCallback(() => {
    loadOrg();
    loadMembers();
    loadInvites();
  }, [loadOrg, loadMembers, loadInvites]);

  useEffect(() => { refresh(); }, [refresh]);

  if (org === undefined) {
    return (
      <div className="org-loading">
        <div className="loading-spinner" />
        Laden...
      </div>
    );
  }

  if (org === null) {
    return <CreateOrgForm onCreated={refresh} />;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Übersicht" },
    { id: "members",  label: `Mitglieder (${members.length})` },
    { id: "invites",  label: `Einladungen (${invites.length})` },
    { id: "sso",      label: "Single Sign-On" },
  ];

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Organisationsverwaltung</h2>
          <p className="view-sub">{org.name} · /{org.slug}</p>
        </div>
      </div>

      <div className="org-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`org-tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="org-tab-content">
        {tab === "overview" && <OverviewTab org={org} onUpdate={refresh} />}
        {tab === "members"  && <MembersTab  members={members} onUpdate={refresh} />}
        {tab === "invites"  && <InvitesTab  invites={invites} onUpdate={refresh} />}
        {tab === "sso"      && <SsoTab ssoConfigured={ssoConfigured} />}
      </div>
    </div>
  );
}
