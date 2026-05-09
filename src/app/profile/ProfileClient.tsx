"use client";
import { useState, useEffect } from "react";

interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  head_of_audit: "Head of Audit",
  owner: "Process Owner",
  reviewer: "Reviewer",
};

export function ProfileClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [nameVal, setNameVal] = useState("");
  const [avatarVal, setAvatarVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((data: Me) => {
      setMe(data);
      setNameVal(data.name);
      setAvatarVal(data.avatar ?? "");
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameVal, avatar: avatarVal || undefined }),
    });
    if (res.ok) {
      const updated: Me = await res.json();
      setMe(updated);
      setProfileMsg({ text: "Profil gespeichert.", ok: true });
    } else {
      setProfileMsg({ text: "Fehler beim Speichern.", ok: false });
    }
    setSaving(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ text: "Passwörter stimmen nicht überein.", ok: false }); return; }
    if (newPw.length < 8) { setPwMsg({ text: "Mindestens 8 Zeichen erforderlich.", ok: false }); return; }
    setPwSaving(true);
    setPwMsg(null);
    const res = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: curPw, next: newPw }),
    });
    if (res.ok) {
      setPwMsg({ text: "Passwort erfolgreich geändert.", ok: true });
      setCurPw(""); setNewPw(""); setConfirmPw("");
    } else {
      const err = await res.json();
      setPwMsg({ text: err.error ?? "Fehler.", ok: false });
    }
    setPwSaving(false);
  }

  const initials = me?.avatar || me?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-1)", padding: "2rem" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <a href="/" style={{ color: "var(--ink-3)", fontSize: "0.875rem", textDecoration: "none" }}>
            ← Zurück zum Dashboard
          </a>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--ink-1)", marginTop: "1rem" }}>
            Mein Profil
          </h1>
        </div>

        {/* Avatar + info */}
        <div className="profile-hero">
          <div className="profile-avatar-lg">{initials}</div>
          <div>
            <div className="profile-name">{me?.name ?? "…"}</div>
            <div className="profile-email">{me?.email}</div>
            <div className="profile-role-badge">{ROLE_LABELS[me?.role ?? ""] ?? me?.role}</div>
          </div>
        </div>

        {/* Edit profile */}
        <div className="settings-card" style={{ marginTop: "1.5rem" }}>
          <div className="settings-card-head">
            <h2 className="settings-section-title">Profildaten bearbeiten</h2>
          </div>
          <form className="apikey-form" onSubmit={saveProfile}>
            <div className="settings-row">
              <label className="settings-label">Anzeigename</label>
              <input
                className="settings-input"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                required minLength={2}
              />
            </div>
            <div className="settings-row">
              <label className="settings-label">Avatar-Kürzel (max. 2 Buchstaben)</label>
              <input
                className="settings-input"
                value={avatarVal}
                onChange={(e) => setAvatarVal(e.target.value.slice(0, 2).toUpperCase())}
                maxLength={2}
                placeholder="z.B. AV"
                style={{ maxWidth: 80 }}
              />
            </div>
            {profileMsg && (
              <div className={`settings-msg${profileMsg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>
                {profileMsg.text}
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Speichern…" : "Profil speichern"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="settings-card" style={{ marginTop: "1.5rem" }}>
          <div className="settings-card-head">
            <h2 className="settings-section-title">Passwort ändern</h2>
          </div>
          <form className="apikey-form" onSubmit={changePassword}>
            <div className="settings-row">
              <label className="settings-label">Aktuelles Passwort</label>
              <input
                className="settings-input"
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                required autoComplete="current-password"
              />
            </div>
            <div className="settings-row">
              <label className="settings-label">Neues Passwort</label>
              <input
                className="settings-input"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="settings-row">
              <label className="settings-label">Neues Passwort bestätigen</label>
              <input
                className="settings-input"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required autoComplete="new-password"
              />
            </div>
            {pwMsg && (
              <div className={`settings-msg${pwMsg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>
                {pwMsg.text}
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={pwSaving}>
              {pwSaving ? "Ändern…" : "Passwort ändern"}
            </button>
          </form>
        </div>

        <div style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--ink-3)" }}>
          Mitglied seit {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("de-DE") : "…"}
        </div>
      </div>
    </div>
  );
}
