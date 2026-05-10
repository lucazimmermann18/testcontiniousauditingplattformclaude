"use client";
import { useState, useEffect, useCallback } from "react";

interface Area { id: string; name: string; short: string; color: string; }
interface User { id: string; name: string; role: string; }
interface Kpi {
  id: string; code: string; title: string; desc: string;
  risk: number; status: string; agent: string;
  area: string; areaName: string;
  owner: string; ownerId: string;
  reviewer: string; reviewerId: string;
}

const RISK_LABELS = ["", "1 – Minimal", "2 – Niedrig", "3 – Mittel", "4 – Hoch", "5 – Kritisch"];

export function KpiManagement() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    code: "", areaId: "", title: "", desc: "", risk: 3, agent: "", ownerId: "", reviewerId: "",
  });

  const load = useCallback(async () => {
    const [kRes, aRes, uRes] = await Promise.all([
      fetch("/api/kpis"),
      fetch("/api/areas"),
      fetch("/api/users"),
    ]);
    if (kRes.ok) {
      const data = await kRes.json();
      setKpis(data.map((k: any) => ({
        id: k.id, code: k.code, title: k.title, desc: k.desc, risk: k.risk,
        status: k.status, agent: k.agent,
        area: k.area, areaName: k.areaName,
        owner: k.owner, ownerId: k.ownerId,
        reviewer: k.reviewer, reviewerId: k.reviewerId,
      })));
    }
    if (aRes.ok) setAreas(await aRes.json());
    if (uRes.ok) setUsers(await uRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/kpis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
    });
    if (res.ok) {
      setMsg({ text: "KPI erfolgreich angelegt.", ok: true });
      setForm({ code: "", areaId: "", title: "", desc: "", risk: 3, agent: "", ownerId: "", reviewerId: "" });
      setShowForm(false);
      await load();
    } else {
      const err = await res.json();
      setMsg({ text: err.error?.fieldErrors ? Object.values(err.error.fieldErrors).flat().join(", ") : (err.error ?? "Fehler"), ok: false });
    }
    setSaving(false);
  }

  const STATUS_COLOR: Record<string, string> = {
    ok: "var(--ok)", review: "var(--warn)", finding: "var(--alert)",
    running: "var(--info)", pending: "var(--ink-3)",
  };

  return (
    <div className="settings-section">
      <div className="settings-section-head">
        <div>
          <div className="settings-section-title">KPI-Verwaltung</div>
          <div className="settings-section-desc">KPIs anlegen und verwalten ({kpis.length} total)</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Abbrechen" : "+ KPI anlegen"}
        </button>
      </div>

      {msg && (
        <div style={{
          padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: "0.875rem",
          background: msg.ok ? "var(--ok-bg)" : "var(--alert-bg)",
          color: msg.ok ? "var(--ok)" : "var(--alert)",
          border: `1px solid ${msg.ok ? "var(--ok)" : "var(--alert)"}22`,
        }}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <form className="kpi-create-form" onSubmit={submit}>
          <div className="kpi-form-title">Neuen KPI anlegen</div>
          <div className="kpi-form-grid">
            <div className="kpi-form-field">
              <label className="kpi-form-label">KPI-Code *</label>
              <input
                className="settings-input"
                placeholder="z.B. FIN-007"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                pattern="[A-Z0-9-]+"
                required
              />
              <span className="kpi-form-hint">Großbuchstaben, Zahlen, Bindestrich</span>
            </div>
            <div className="kpi-form-field">
              <label className="kpi-form-label">Bereich *</label>
              <select
                className="settings-input"
                value={form.areaId}
                onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
                required
              >
                <option value="">Bereich auswählen…</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.short} – {a.name}</option>)}
              </select>
            </div>
            <div className="kpi-form-field kpi-form-full">
              <label className="kpi-form-label">Titel *</label>
              <input
                className="settings-input"
                placeholder="Aussagekräftiger KPI-Titel"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="kpi-form-field kpi-form-full">
              <label className="kpi-form-label">Beschreibung</label>
              <textarea
                className="settings-input"
                placeholder="Was wird gemessen? Wie wird es berechnet?"
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="kpi-form-field">
              <label className="kpi-form-label">Risiko-Level *</label>
              <select
                className="settings-input"
                value={form.risk}
                onChange={(e) => setForm((f) => ({ ...f, risk: Number(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{RISK_LABELS[v]}</option>)}
              </select>
            </div>
            <div className="kpi-form-field">
              <label className="kpi-form-label">Agent-Name *</label>
              <input
                className="settings-input"
                placeholder="z.B. Finanz-Audit-Agent v2"
                value={form.agent}
                onChange={(e) => setForm((f) => ({ ...f, agent: e.target.value }))}
                required
              />
            </div>
            <div className="kpi-form-field">
              <label className="kpi-form-label">Owner *</label>
              <select
                className="settings-input"
                value={form.ownerId}
                onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
                required
              >
                <option value="">Owner auswählen…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="kpi-form-field">
              <label className="kpi-form-label">Reviewer *</label>
              <select
                className="settings-input"
                value={form.reviewerId}
                onChange={(e) => setForm((f) => ({ ...f, reviewerId: e.target.value }))}
                required
              >
                <option value="">Reviewer auswählen…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Anlegen…" : "KPI anlegen"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: "var(--ink-3)", fontSize: "0.875rem", padding: "1rem 0" }}>Laden…</div>
      ) : (
        <div className="kpi-manage-list">
          <div className="kpi-manage-header">
            <span>Code</span>
            <span>Titel</span>
            <span>Bereich</span>
            <span>Risiko</span>
            <span>Status</span>
            <span>Owner</span>
          </div>
          {kpis.map((k) => (
            <div key={k.id} className="kpi-manage-row">
              <span className="kpi-code-badge">{k.code}</span>
              <span className="kpi-manage-title">{k.title}</span>
              <span className="kpi-manage-area">{k.areaName}</span>
              <span className="kpi-manage-risk">{"▮".repeat(k.risk)}{"▯".repeat(5 - k.risk)}</span>
              <span className="kpi-manage-status" style={{ color: STATUS_COLOR[k.status] }}>
                {k.status}
              </span>
              <span className="kpi-manage-owner">{k.owner}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
