"use client";
import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  active: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  head_of_audit: "Head of Audit",
  owner: "Process Owner",
  reviewer: "Reviewer",
};

const ROLE_COLOR: Record<string, string> = {
  admin: "#7c3aed",
  head_of_audit: "#2952ff",
  owner: "#c96a2a",
  reviewer: "#10a37f",
};

export function TeamClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reviewer" as string });
  const [formMsg, setFormMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/users?all=true");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    await load();
  }

  async function changeRole(user: User, role: string) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await load();
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormMsg(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "reviewer" });
      setCreating(false);
      setFormMsg({ text: "Benutzer erstellt.", ok: true });
      await load();
    } else {
      const err = await res.json();
      setFormMsg({ text: err.error ?? "Fehler.", ok: false });
    }
    setSaving(false);
  }

  const visible = users.filter((u) => showInactive || u.active);
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-1)", padding: "2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <a href="/" style={{ color: "var(--ink-3)", fontSize: "0.875rem", textDecoration: "none" }}>
              ← Zurück zum Dashboard
            </a>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--ink-1)", marginTop: "1rem" }}>
              Team
            </h1>
            <p style={{ color: "var(--ink-3)", fontSize: "0.875rem", marginTop: "4px" }}>
              {activeCount} aktive Mitglieder · {users.length} gesamt
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <label className="settings-check-label" style={{ fontSize: "0.8rem" }}>
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Inaktive anzeigen
            </label>
            <button className="btn-primary" onClick={() => setCreating((c) => !c)}>
              + Benutzer anlegen
            </button>
          </div>
        </div>

        {/* Create form */}
        {creating && (
          <div className="settings-card" style={{ marginBottom: "1.5rem" }}>
            <div className="settings-card-head">
              <h2 className="settings-section-title">Neuen Benutzer anlegen</h2>
            </div>
            <form className="apikey-form" onSubmit={createUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="settings-row">
                  <label className="settings-label">Name</label>
                  <input className="settings-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Max Mustermann" />
                </div>
                <div className="settings-row">
                  <label className="settings-label">E-Mail</label>
                  <input className="settings-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required placeholder="m.mustermann@continuum-audit.de" />
                </div>
                <div className="settings-row">
                  <label className="settings-label">Passwort</label>
                  <input className="settings-input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} placeholder="Min. 8 Zeichen" />
                </div>
                <div className="settings-row">
                  <label className="settings-label">Rolle</label>
                  <select className="settings-input settings-select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {formMsg && (
                <div className={`settings-msg${formMsg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>
                  {formMsg.text}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>Abbrechen</button>
              </div>
            </form>
          </div>
        )}

        {/* User table */}
        <div className="settings-card">
          {loading ? (
            <div className="settings-empty">Laden…</div>
          ) : (
            <div className="team-table">
              <div className="team-table-head">
                <span>Mitglied</span>
                <span>Rolle</span>
                <span>Dabei seit</span>
                <span>Status</span>
                <span>Aktionen</span>
              </div>
              {visible.map((u) => {
                const initials = u.avatar ?? u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={u.id} className={`team-row${!u.active ? " team-row-inactive" : ""}`}>
                    <div className="team-member">
                      <div className="team-avatar" style={{ background: ROLE_COLOR[u.role] + "22", color: ROLE_COLOR[u.role] }}>
                        {initials}
                      </div>
                      <div>
                        <div className="team-name">{u.name}</div>
                        <div className="team-email">{u.email}</div>
                      </div>
                    </div>
                    <div>
                      <select
                        className="task-status-select"
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        style={{ fontSize: "0.8rem" }}
                      >
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="team-since">
                      {new Date(u.createdAt).toLocaleDateString("de-DE")}
                    </div>
                    <div>
                      <span className={`team-status-badge${u.active ? " team-active" : " team-inactive"}`}>
                        {u.active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                    <div>
                      <button
                        className={`btn-sm${u.active ? " btn-sm-danger" : ""}`}
                        onClick={() => toggleActive(u)}
                      >
                        {u.active ? "Deaktivieren" : "Aktivieren"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Role legend */}
        <div className="team-legend">
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <div key={k} className="team-legend-item">
              <span className="team-legend-dot" style={{ background: ROLE_COLOR[k] }} />
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
