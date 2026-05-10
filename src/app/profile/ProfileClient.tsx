"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
  totpEnabled: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  head_of_audit: "Head of Audit",
  owner: "Process Owner",
  reviewer: "Reviewer",
};

// ── 2FA Section ─────────────────────────────────────────────

function TwoFactorSection({ totpEnabled, onChanged }: { totpEnabled: boolean; onChanged: () => void }) {
  const [step, setStep] = useState<"idle" | "setup" | "disable">("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function startSetup() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/2fa/setup", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setQr(data.qr);
      setSecret(data.secret);
      setStep("setup");
    }
    setSaving(false);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      setMsg({ text: "2FA erfolgreich aktiviert.", ok: true });
      setStep("idle");
      setCode("");
      setQr(null);
      onChanged();
    } else {
      const err = await res.json();
      setMsg({ text: err.error ?? "Fehler", ok: false });
    }
    setSaving(false);
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      setMsg({ text: "2FA deaktiviert.", ok: true });
      setStep("idle");
      setCode("");
      onChanged();
    } else {
      const err = await res.json();
      setMsg({ text: err.error ?? "Fehler", ok: false });
    }
    setSaving(false);
  }

  return (
    <div className="settings-card" style={{ marginTop: "1.5rem" }}>
      <div className="settings-card-head">
        <h2 className="settings-section-title">Zwei-Faktor-Authentifizierung (2FA)</h2>
        <span className={`twofa-badge${totpEnabled ? " twofa-badge-on" : ""}`}>
          {totpEnabled ? "✓ Aktiv" : "Inaktiv"}
        </span>
      </div>

      {step === "idle" && (
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-3)", marginBottom: 12 }}>
            {totpEnabled
              ? "2FA ist aktiviert. Du benötigst beim Login deinen TOTP-Code aus der Authenticator-App."
              : "Schütze dein Konto mit einem zusätzlichen Einmal-Code via Google Authenticator, Authy o.ä."}
          </p>
          {msg && (
            <div className={`settings-msg${msg.ok ? " settings-msg-ok" : " settings-msg-err"}`} style={{ marginBottom: 12 }}>
              {msg.text}
            </div>
          )}
          {totpEnabled ? (
            <button className="btn-danger" onClick={() => { setStep("disable"); setMsg(null); setCode(""); }}>
              2FA deaktivieren
            </button>
          ) : (
            <button className="btn-primary" onClick={startSetup} disabled={saving}>
              {saving ? "Wird eingerichtet…" : "2FA einrichten"}
            </button>
          )}
        </div>
      )}

      {step === "setup" && (
        <div className="twofa-setup">
          <p className="twofa-instructions">
            1. Öffne deine Authenticator-App (Google Authenticator, Authy…)<br />
            2. Scanne den QR-Code oder gib den Secret manuell ein<br />
            3. Gib den 6-stelligen Code zur Bestätigung ein
          </p>
          {qr && (
            <div className="twofa-qr-wrap">
              <Image src={qr} alt="QR Code" width={180} height={180} />
            </div>
          )}
          {secret && (
            <div className="twofa-secret">
              <span className="twofa-secret-label">Manueller Secret:</span>
              <code className="twofa-secret-code">{secret}</code>
            </div>
          )}
          <form onSubmit={verify} className="twofa-verify-form">
            <input
              className="settings-input twofa-code-input"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            {msg && <div className={`settings-msg${msg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>{msg.text}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn-primary" disabled={saving || code.length !== 6}>
                {saving ? "Prüfe…" : "Bestätigen & aktivieren"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setStep("idle")}>Abbrechen</button>
            </div>
          </form>
        </div>
      )}

      {step === "disable" && (
        <form className="twofa-verify-form" onSubmit={disable}>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-3)", marginBottom: 12 }}>
            Gib deinen aktuellen TOTP-Code ein, um 2FA zu deaktivieren.
          </p>
          <input
            className="settings-input twofa-code-input"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          {msg && <div className={`settings-msg${msg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>{msg.text}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn-danger" disabled={saving || code.length !== 6}>
              {saving ? "Prüfe…" : "2FA deaktivieren"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep("idle")}>Abbrechen</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

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

  async function loadMe() {
    const r = await fetch("/api/me");
    const data: Me = await r.json();
    setMe(data);
    setNameVal(data.name);
    setAvatarVal(data.avatar ?? "");
  }

  useEffect(() => { loadMe(); }, []);

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
      setMe((prev) => prev ? { ...prev, ...updated } : prev);
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
          <a href="/" style={{ color: "var(--ink-3)", fontSize: "0.875rem", textDecoration: "none" }}>← Zurück zum Dashboard</a>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--ink-1)", marginTop: "1rem" }}>Mein Profil</h1>
        </div>

        <div className="profile-hero">
          <div className="profile-avatar-lg">{initials}</div>
          <div>
            <div className="profile-name">{me?.name ?? "…"}</div>
            <div className="profile-email">{me?.email}</div>
            <div className="profile-role-badge">{ROLE_LABELS[me?.role ?? ""] ?? me?.role}</div>
          </div>
        </div>

        <div className="settings-card" style={{ marginTop: "1.5rem" }}>
          <div className="settings-card-head">
            <h2 className="settings-section-title">Profildaten bearbeiten</h2>
          </div>
          <form className="apikey-form" onSubmit={saveProfile}>
            <div className="settings-row">
              <label className="settings-label">Anzeigename</label>
              <input className="settings-input" value={nameVal} onChange={(e) => setNameVal(e.target.value)} required minLength={2} />
            </div>
            <div className="settings-row">
              <label className="settings-label">Avatar-Kürzel (max. 2 Buchstaben)</label>
              <input className="settings-input" value={avatarVal} onChange={(e) => setAvatarVal(e.target.value.slice(0, 2).toUpperCase())} maxLength={2} placeholder="z.B. AV" style={{ maxWidth: 80 }} />
            </div>
            {profileMsg && (
              <div className={`settings-msg${profileMsg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>{profileMsg.text}</div>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Speichern…" : "Profil speichern"}</button>
          </form>
        </div>

        <div className="settings-card" style={{ marginTop: "1.5rem" }}>
          <div className="settings-card-head">
            <h2 className="settings-section-title">Passwort ändern</h2>
          </div>
          <form className="apikey-form" onSubmit={changePassword}>
            <div className="settings-row">
              <label className="settings-label">Aktuelles Passwort</label>
              <input className="settings-input" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="settings-row">
              <label className="settings-label">Neues Passwort</label>
              <input className="settings-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div className="settings-row">
              <label className="settings-label">Neues Passwort bestätigen</label>
              <input className="settings-input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required autoComplete="new-password" />
            </div>
            {pwMsg && (
              <div className={`settings-msg${pwMsg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>{pwMsg.text}</div>
            )}
            <button type="submit" className="btn-primary" disabled={pwSaving}>{pwSaving ? "Ändern…" : "Passwort ändern"}</button>
          </form>
        </div>

        {me && (
          <TwoFactorSection
            totpEnabled={me.totpEnabled}
            onChanged={loadMe}
          />
        )}

        <div style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--ink-3)" }}>
          Mitglied seit {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("de-DE") : "…"}
        </div>
      </div>
    </div>
  );
}
