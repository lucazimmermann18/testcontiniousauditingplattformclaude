"use client";
import { useState, useEffect, useCallback } from "react";

type UserRole = "admin" | "head_of_audit" | "owner" | "reviewer";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  active: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  head_of_audit: "Prüfungsleiter",
  owner: "Eigentümer",
  reviewer: "Prüfer",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#c0392b",
  head_of_audit: "#2952ff",
  owner: "#10a37f",
  reviewer: "#888",
};

const ALL_ROLES: UserRole[] = ["admin", "head_of_audit", "owner", "reviewer"];

const BLANK_INVITE = { name: "", email: "", password: "", role: "reviewer" as UserRole };

function UserAvatar({ user }: { user: UserRow }) {
  const initials = user.avatar
    ? user.avatar
    : user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--surface-3, #e8eaf0)",
        color: "var(--ink-2, #444)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: "0.75rem",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Per-row messages (id -> { text, ok })
  const [rowMsg, setRowMsg] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(BLANK_INVITE);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Global load message
  const [globalMsg, setGlobalMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setGlobalMsg({ text: "Fehler beim Laden der Benutzer.", ok: false });
      }
    } catch {
      setGlobalMsg({ text: "Netzwerkfehler beim Laden.", ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.id) setCurrentUserId(data.id); })
      .catch(() => {});
  }, [load]);

  function clearRowMsg(id: string) {
    setTimeout(() => setRowMsg((prev) => { const next = { ...prev }; delete next[id]; return next; }), 3000);
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingRole(userId);
    setRowMsg((prev) => ({ ...prev, [userId]: { text: "Wird gespeichert…", ok: true } }));

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setRowMsg((prev) => ({ ...prev, [userId]: { text: "Rolle aktualisiert.", ok: true } }));
      } else {
        const data = await res.json().catch(() => ({}));
        const errText =
          typeof data?.error === "string"
            ? data.error
            : `Fehler (HTTP ${res.status})`;
        setRowMsg((prev) => ({ ...prev, [userId]: { text: errText, ok: false } }));
        // Revert on failure
        await load();
      }
    } catch {
      setRowMsg((prev) => ({ ...prev, [userId]: { text: "Netzwerkfehler.", ok: false } }));
      await load();
    } finally {
      setUpdatingRole(null);
      clearRowMsg(userId);
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Benutzer „${userName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setGlobalMsg({ text: `Benutzer „${userName}" wurde gelöscht.`, ok: true });
        setTimeout(() => setGlobalMsg(null), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        const errText =
          typeof data?.error === "string"
            ? data.error
            : `Fehler (HTTP ${res.status})`;
        setGlobalMsg({ text: errText, ok: false });
        setTimeout(() => setGlobalMsg(null), 5000);
      }
    } catch {
      setGlobalMsg({ text: "Netzwerkfehler beim Löschen.", ok: false });
      setTimeout(() => setGlobalMsg(null), 5000);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteSaving(true);
    setInviteMsg(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setInviteMsg({ text: `Benutzer „${inviteForm.name}" wurde erfolgreich angelegt.`, ok: true });
        setInviteForm(BLANK_INVITE);
        await load();
        setTimeout(() => {
          setShowInvite(false);
          setInviteMsg(null);
        }, 1500);
      } else {
        const errText =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.fieldErrors
            ? Object.values(data.error.fieldErrors as Record<string, string[]>)
                .flat()
                .join(", ")
            : `Fehler (HTTP ${res.status})`;
        setInviteMsg({ text: errText, ok: false });
      }
    } catch {
      setInviteMsg({ text: "Netzwerkfehler – bitte erneut versuchen.", ok: false });
    } finally {
      setInviteSaving(false);
    }
  }

  function closeInviteModal() {
    setShowInvite(false);
    setInviteForm(BLANK_INVITE);
    setInviteMsg(null);
  }

  return (
    <div>
      <div className="settings-card">
        <div className="settings-card-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="settings-section-title">Benutzerverwaltung</h2>
            <p className="settings-section-sub">
              Benutzer anlegen, Rollen verwalten und Zugänge entfernen.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowInvite(true)}
            style={{ flexShrink: 0 }}
          >
            + Benutzer einladen
          </button>
        </div>

        {globalMsg && (
          <div className={`settings-msg${globalMsg.ok ? " settings-msg-ok" : " settings-msg-err"}`} style={{ marginBottom: "1rem" }}>
            {globalMsg.text}
          </div>
        )}

        {loading ? (
          <div className="settings-empty">Laden…</div>
        ) : users.length === 0 ? (
          <div className="settings-empty">Keine Benutzer gefunden.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border, #e5e7eb)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--ink-3, #888)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    Benutzer
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--ink-3, #888)", fontWeight: 500 }}>
                    E-Mail
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--ink-3, #888)", fontWeight: 500 }}>
                    Rolle
                  </th>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--ink-3, #888)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    Erstellt am
                  </th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "var(--ink-3, #888)", fontWeight: 500 }}>
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isUpdating = updatingRole === user.id;
                  const isDeleting = deletingId === user.id;
                  const msg = rowMsg[user.id];

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: "1px solid var(--border, #f0f0f0)",
                        opacity: isDeleting ? 0.5 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {/* Avatar + Name */}
                      <td style={{ padding: "0.625rem 0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <UserAvatar user={user} />
                          <span style={{ fontWeight: 500, color: "var(--ink-1, #111)", whiteSpace: "nowrap" }}>
                            {user.name}
                            {isSelf && (
                              <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "var(--ink-3, #888)", fontWeight: 400 }}>
                                (Sie)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "0.625rem 0.75rem", color: "var(--ink-2, #444)" }}>
                        {user.email}
                      </td>

                      {/* Role dropdown */}
                      <td style={{ padding: "0.625rem 0.75rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                display: "inline-block",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: ROLE_COLORS[user.role],
                                flexShrink: 0,
                              }}
                            />
                            <select
                              className="settings-input settings-select"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", minWidth: 140 }}
                              value={user.role}
                              disabled={isSelf || isUpdating}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                              title={isSelf ? "Eigene Rolle kann nicht geändert werden" : undefined}
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                            {isUpdating && (
                              <span style={{ fontSize: "0.75rem", color: "var(--ink-3, #888)" }}>…</span>
                            )}
                          </div>
                          {msg && (
                            <span
                              className={`settings-msg${msg.ok ? " settings-msg-ok" : " settings-msg-err"}`}
                              style={{ fontSize: "0.75rem", padding: "2px 4px" }}
                            >
                              {msg.text}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td style={{ padding: "0.625rem 0.75rem", color: "var(--ink-3, #888)", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                        {new Date(user.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.625rem 0.75rem", textAlign: "right" }}>
                        <button
                          className="btn btn-sm btn-sm-danger"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isSelf || isDeleting}
                          title={isSelf ? "Eigenen Account kann nicht gelöscht werden" : `„${user.name}" löschen`}
                          style={{
                            opacity: isSelf ? 0.35 : 1,
                            cursor: isSelf ? "not-allowed" : "pointer",
                          }}
                        >
                          {isDeleting ? "…" : "×"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeInviteModal(); }}
        >
          <div
            style={{
              background: "var(--surface-2, #fff)",
              borderRadius: 12,
              padding: "1.75rem",
              width: "100%",
              maxWidth: 460,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--ink-1, #111)", margin: 0 }}>
                Benutzer einladen
              </h2>
              <button
                onClick={closeInviteModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.25rem",
                  color: "var(--ink-3, #888)",
                  lineHeight: 1,
                  padding: "2px 6px",
                }}
                aria-label="Schließen"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInvite}>
              <div className="settings-row" style={{ marginBottom: "1rem" }}>
                <label className="settings-label" htmlFor="invite-name">
                  Name <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  id="invite-name"
                  className="settings-input"
                  type="text"
                  placeholder="Vor- und Nachname"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="off"
                />
              </div>

              <div className="settings-row" style={{ marginBottom: "1rem" }}>
                <label className="settings-label" htmlFor="invite-email">
                  E-Mail-Adresse <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  id="invite-email"
                  className="settings-input"
                  type="email"
                  placeholder="name@unternehmen.de"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="settings-row" style={{ marginBottom: "1rem" }}>
                <label className="settings-label" htmlFor="invite-password">
                  Passwort <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  id="invite-password"
                  className="settings-input"
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div className="settings-row" style={{ marginBottom: "1.25rem" }}>
                <label className="settings-label" htmlFor="invite-role">
                  Rolle
                </label>
                <select
                  id="invite-role"
                  className="settings-input settings-select"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              {inviteMsg && (
                <div
                  className={`settings-msg${inviteMsg.ok ? " settings-msg-ok" : " settings-msg-err"}`}
                  style={{ marginBottom: "1rem" }}
                >
                  {inviteMsg.text}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeInviteModal}
                  disabled={inviteSaving}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={inviteSaving}
                >
                  {inviteSaving ? "Wird angelegt…" : "Benutzer anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
