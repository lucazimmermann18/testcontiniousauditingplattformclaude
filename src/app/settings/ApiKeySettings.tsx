"use client";
import { useState, useEffect } from "react";

type Provider = "anthropic" | "openai" | "deepseek" | "openrouter";

interface ApiKeyRecord {
  id: string;
  provider: Provider;
  model: string;
  isActive: boolean;
  maskedKey: string;
  updatedAt: string;
}

const PROVIDER_META: Record<Provider, { label: string; color: string; models: string[]; placeholder: string }> = {
  anthropic: {
    label: "Anthropic",
    color: "#c96a2a",
    models: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    placeholder: "sk-ant-api03-…",
  },
  openai: {
    label: "OpenAI",
    color: "#10a37f",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o3-mini"],
    placeholder: "sk-proj-…",
  },
  deepseek: {
    label: "DeepSeek",
    color: "#4b6cf7",
    models: ["deepseek-chat", "deepseek-reasoner"],
    placeholder: "sk-…",
  },
  openrouter: {
    label: "OpenRouter",
    color: "#7c3aed",
    models: [
      "anthropic/claude-sonnet-4-6",
      "openai/gpt-4o",
      "deepseek/deepseek-chat",
      "google/gemini-2.5-pro",
      "meta-llama/llama-4-maverick",
    ],
    placeholder: "sk-or-v1-…",
  },
};

export function ApiKeySettings() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ provider: Provider; apiKey: string; model: string; setActive: boolean }>({
    provider: "anthropic",
    apiKey: "",
    model: "claude-sonnet-4-6",
    setActive: true,
  });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/settings/apikeys");
      if (res.ok) {
        setKeys(await res.json());
      } else {
        console.error("GET /api/settings/apikeys returned", res.status);
      }
    } catch (e) {
      console.error("load error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function onProviderChange(p: Provider) {
    const meta = PROVIDER_META[p];
    setForm((f) => ({ ...f, provider: p, model: meta.models[0] }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (res.ok) {
        setMsg({ text: "API-Key gespeichert und aktiv.", ok: true });
        setForm((f) => ({ ...f, apiKey: "" }));
        await load();
      } else {
        const errText = typeof data?.error === "string"
          ? data.error
          : data?.error?.fieldErrors
            ? Object.values(data.error.fieldErrors).flat().join(", ")
            : `Fehler (HTTP ${res.status})`;
        setMsg({ text: errText, ok: false });
      }
    } catch (err) {
      setMsg({ text: "Netzwerkfehler – bitte erneut versuchen.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(id: string) {
    await fetch(`/api/settings/apikeys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setActive: true }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("API-Key wirklich löschen?")) return;
    await fetch(`/api/settings/apikeys/${id}`, { method: "DELETE" });
    await load();
  }

  const meta = PROVIDER_META[form.provider];

  return (
    <div>
      {/* Existing keys */}
      <div className="settings-card">
        <div className="settings-card-head">
          <h2 className="settings-section-title">Hinterlegte API-Keys</h2>
          <p className="settings-section-sub">Nur der aktive Key wird von den KI-Agenten verwendet.</p>
        </div>

        {loading ? (
          <div className="settings-empty">Laden…</div>
        ) : keys.length === 0 ? (
          <div className="settings-empty">Noch kein API-Key hinterlegt.</div>
        ) : (
          <div className="apikey-list">
            {keys.map((k) => {
              const m = PROVIDER_META[k.provider];
              return (
                <div key={k.id} className={`apikey-row${k.isActive ? " apikey-row-active" : ""}`}>
                  <div className="apikey-provider-badge" style={{ background: m.color + "22", color: m.color }}>
                    {m.label}
                  </div>
                  <div className="apikey-info">
                    <div className="apikey-model">{k.model}</div>
                    <div className="apikey-masked">{k.maskedKey}</div>
                  </div>
                  <div className="apikey-actions">
                    {k.isActive ? (
                      <span className="apikey-active-badge">● Aktiv</span>
                    ) : (
                      <button className="btn-sm" onClick={() => handleSetActive(k.id)}>
                        Aktivieren
                      </button>
                    )}
                    <button className="btn-sm btn-sm-danger" onClick={() => handleDelete(k.id)}>
                      Löschen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new key */}
      <div className="settings-card" style={{ marginTop: "1.5rem" }}>
        <div className="settings-card-head">
          <h2 className="settings-section-title">API-Key hinzufügen</h2>
          <p className="settings-section-sub">Keys werden AES-256-GCM verschlüsselt gespeichert.</p>
        </div>

        <form className="apikey-form" onSubmit={handleSave}>
          <div className="settings-row">
            <label className="settings-label">Provider</label>
            <div className="provider-tabs">
              {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`provider-tab${form.provider === p ? " active" : ""}`}
                  style={form.provider === p ? { borderColor: PROVIDER_META[p].color, color: PROVIDER_META[p].color } : {}}
                  onClick={() => onProviderChange(p)}
                >
                  {PROVIDER_META[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label" htmlFor="ak-key">API-Key</label>
            <input
              id="ak-key"
              type="password"
              className="settings-input"
              placeholder={meta.placeholder}
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              required
              autoComplete="off"
            />
          </div>

          <div className="settings-row">
            <label className="settings-label" htmlFor="ak-model">Modell</label>
            <select
              id="ak-model"
              className="settings-input settings-select"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            >
              {meta.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="settings-row settings-row-check">
            <label className="settings-check-label">
              <input
                type="checkbox"
                checked={form.setActive}
                onChange={(e) => setForm((f) => ({ ...f, setActive: e.target.checked }))}
              />
              Als aktiven Key setzen (ersetzt aktuellen)
            </label>
          </div>

          {msg && (
            <div className={`settings-msg${msg.ok ? " settings-msg-ok" : " settings-msg-err"}`}>
              {msg.text}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Speichern…" : "Key speichern"}
          </button>
        </form>
      </div>
    </div>
  );
}
