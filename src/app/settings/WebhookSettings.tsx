"use client";
import { useState, useEffect } from "react";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string;
  active: boolean;
  createdAt: string;
}

const EVENT_OPTIONS = [
  { value: "finding_created", label: "Finding erstellt" },
  { value: "agent_completed", label: "Agent abgeschlossen" },
  { value: "approval_requested", label: "Freigabe angefragt" },
];

export function WebhookSettings() {
  const [hooks, setHooks] = useState<WebhookConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", secret: "", events: ["finding_created"] });
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/webhooks");
    if (res.ok) setHooks(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.url) { setError("Name und URL sind Pflicht."); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, url: form.url, secret: form.secret || undefined, events: form.events }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", url: "", secret: "", events: ["finding_created"] });
      load();
    } else {
      setError("Fehler beim Speichern");
    }
  }

  async function toggleActive(hook: WebhookConfig) {
    await fetch(`/api/webhooks/${hook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !hook.active }),
    });
    load();
  }

  async function deleteHook(id: string) {
    if (!confirm("Webhook wirklich löschen?")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    load();
  }

  async function testHook(id: string, url: string) {
    setTestResult((p) => ({ ...p, [id]: "…" }));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "test", payload: { message: "Continuum Audit Webhook Test" }, ts: Date.now() }),
      });
      setTestResult((p) => ({ ...p, [id]: res.ok ? "✓ OK" : `✗ HTTP ${res.status}` }));
    } catch {
      setTestResult((p) => ({ ...p, [id]: "✗ Verbindungsfehler" }));
    }
  }

  function toggleEvent(val: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(val) ? f.events.filter((e) => e !== val) : [...f.events, val],
    }));
  }

  return (
    <div className="settings-section">
      <div className="settings-section-head">
        <div>
          <div className="settings-section-title">Webhook-Integrationen</div>
          <div className="settings-section-sub">
            Sende automatische HTTP-Benachrichtigungen bei Plattform-Events (Slack, Teams, Custom)
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Abbrechen" : "+ Webhook hinzufügen"}
        </button>
      </div>

      {showForm && (
        <form className="webhook-form" onSubmit={handleCreate}>
          <div className="fcf-row">
            <div className="fcf-field">
              <label className="fcf-label">Name</label>
              <input className="fcf-input" placeholder="z.B. Slack #audit-alerts" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="fcf-field" style={{ flex: 2 }}>
              <label className="fcf-label">URL</label>
              <input className="fcf-input" type="url" placeholder="https://hooks.slack.com/…" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
          </div>
          <div className="fcf-field">
            <label className="fcf-label">Secret (optional — für HMAC-Signatur)</label>
            <input className="fcf-input" type="password" placeholder="Leer lassen wenn nicht benötigt" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} />
          </div>
          <div className="fcf-field">
            <label className="fcf-label">Events</label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {EVENT_OPTIONS.map((ev) => (
                <label key={ev.value} className="webhook-event-check">
                  <input type="checkbox" checked={form.events.includes(ev.value)} onChange={() => toggleEvent(ev.value)} />
                  {ev.label}
                </label>
              ))}
            </div>
          </div>
          {error && <div className="fcf-error">{error}</div>}
          <div className="fcf-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Speichert…" : "Webhook speichern"}</button>
          </div>
        </form>
      )}

      <div className="webhook-list">
        {hooks.length === 0 && !showForm && (
          <div className="settings-empty">Noch keine Webhooks konfiguriert.</div>
        )}
        {hooks.map((hook) => {
          const events: string[] = JSON.parse(hook.events);
          return (
            <div key={hook.id} className="webhook-row">
              <div className="webhook-row-info">
                <div className="webhook-name">{hook.name}</div>
                <div className="webhook-url">{hook.url}</div>
                <div className="webhook-events">
                  {events.map((e) => (
                    <span key={e} className="webhook-event-tag">
                      {EVENT_OPTIONS.find((o) => o.value === e)?.label ?? e}
                    </span>
                  ))}
                </div>
              </div>
              <div className="webhook-row-actions">
                {testResult[hook.id] && (
                  <span className={`webhook-test-result${testResult[hook.id].startsWith("✓") ? " wtr-ok" : " wtr-err"}`}>
                    {testResult[hook.id]}
                  </span>
                )}
                <button className="btn-sm" onClick={() => testHook(hook.id, hook.url)}>Test</button>
                <button className={`schedule-toggle${hook.active ? " schedule-toggle-on" : ""}`} onClick={() => toggleActive(hook)}>
                  {hook.active ? "Aktiv" : "Inaktiv"}
                </button>
                <button className="btn-sm btn-sm-danger" onClick={() => deleteHook(hook.id)}>Löschen</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
