"use client";
import { useState } from "react";
import type { Kpi, Finding } from "@/types";
import { AreaTag } from "@/components/ui/AreaTag";

const SEVERITY_COLOR = {
  hoch:    "var(--alert)",
  mittel:  "var(--warn)",
  niedrig: "var(--ok)",
};

const SEVERITY_BG = {
  hoch:    "var(--alert-bg)",
  mittel:  "var(--warn-bg)",
  niedrig: "var(--ok-bg)",
};

const STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  in_bearbeitung: "In Bearbeitung",
  geschlossen: "Geschlossen",
};

function FindingRow({
  finding,
  kpi,
  onOpenKpi,
  onStatusChange,
}: {
  finding: Finding;
  kpi: Kpi | undefined;
  onOpenKpi: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const newStatus = e.target.value;
    setSaving(true);
    await onStatusChange(finding.id, newStatus);
    setSaving(false);
  }

  return (
    <div className="finding-row" onClick={() => kpi && onOpenKpi(kpi.id)}>
      <div className="fr-sev-bar" style={{ background: SEVERITY_COLOR[finding.severity] }} />
      <div className="fr-body">
        <div className="fr-head">
          <span
            className="severity-badge"
            style={{ background: SEVERITY_BG[finding.severity], color: SEVERITY_COLOR[finding.severity] }}
          >
            {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
          </span>
          {kpi && <AreaTag areaId={kpi.area} />}
          {kpi && <span className="kpi-code">{kpi.code}</span>}
        </div>
        <div className="fr-title">{finding.title}</div>
        <div className="fr-desc">{finding.desc}</div>
        <div className="fr-meta">
          <span>Owner: {finding.owner}</span>
          <span>·</span>
          <span>Fällig: <strong>{finding.due}</strong></span>
          <span>·</span>
          <span>Eröffnet: {finding.opened}</span>
        </div>
      </div>
      <div className="fr-actions" onClick={(e) => e.stopPropagation()}>
        <select
          className="finding-status-select"
          value={finding.status}
          onChange={handleStatusChange}
          disabled={saving}
        >
          <option value="offen">Offen</option>
          <option value="in_bearbeitung">In Bearbeitung</option>
          <option value="geschlossen">Geschlossen</option>
        </select>
      </div>
    </div>
  );
}

interface CreateFindingForm {
  kpiId: string;
  title: string;
  desc: string;
  severity: "hoch" | "mittel" | "niedrig";
  dueDate: string;
}

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
};

export function FindingsView({
  kpis,
  findings,
  onOpenKpi,
  onFindingsUpdated,
}: {
  kpis: Kpi[];
  findings: Finding[];
  onOpenKpi: (id: string) => void;
  onFindingsUpdated: () => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFindingForm>({
    kpiId: kpis[0]?.id ?? "",
    title: "",
    desc: "",
    severity: "mittel",
    dueDate: tomorrow(),
  });

  const openFindings = findings.filter((f) => f.status !== "geschlossen");
  const closedFindings = findings.filter((f) => f.status === "geschlossen");

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/findings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onFindingsUpdated();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.kpiId || !form.title || !form.desc) {
      setCreateError("Alle Felder sind Pflichtfelder.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      setShowCreateForm(false);
      setForm({ kpiId: kpis[0]?.id ?? "", title: "", desc: "", severity: "mittel", dueDate: tomorrow() });
      onFindingsUpdated();
    } else {
      const err = await res.json().catch(() => ({}));
      setCreateError(err.error ?? "Fehler beim Anlegen");
    }
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Findings</h2>
          <p className="view-sub">{openFindings.length} offene Befunde · {closedFindings.length} geschlossen</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateForm((v) => !v)}>
          {showCreateForm ? "✕ Abbrechen" : "+ Finding anlegen"}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form className="finding-create-form" onSubmit={handleCreate}>
          <div className="fcf-row">
            <div className="fcf-field">
              <label className="fcf-label">KPI</label>
              <select
                className="fcf-select"
                value={form.kpiId}
                onChange={(e) => setForm((f) => ({ ...f, kpiId: e.target.value }))}
              >
                {kpis.map((k) => (
                  <option key={k.id} value={k.id}>{k.code} – {k.title}</option>
                ))}
              </select>
            </div>
            <div className="fcf-field">
              <label className="fcf-label">Schwere</label>
              <select
                className="fcf-select"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as "hoch" | "mittel" | "niedrig" }))}
              >
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
              </select>
            </div>
            <div className="fcf-field">
              <label className="fcf-label">Fällig am</label>
              <input
                type="date"
                className="fcf-input"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="fcf-field">
            <label className="fcf-label">Titel</label>
            <input
              type="text"
              className="fcf-input"
              placeholder="Kurze Beschreibung des Findings"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="fcf-field">
            <label className="fcf-label">Beschreibung</label>
            <textarea
              className="fcf-textarea"
              rows={3}
              placeholder="Detaillierte Beschreibung, Ursache, Auswirkung…"
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            />
          </div>
          {createError && <div className="fcf-error">{createError}</div>}
          <div className="fcf-actions">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Wird gespeichert…" : "Finding anlegen"}
            </button>
          </div>
        </form>
      )}

      {/* Summary cards */}
      <div className="findings-summary">
        {(["hoch", "mittel", "niedrig"] as const).map((sev) => {
          const count = openFindings.filter((f) => f.severity === sev).length;
          return (
            <div
              key={sev}
              className="findings-summary-card"
              style={{ borderColor: SEVERITY_COLOR[sev], background: SEVERITY_BG[sev] }}
            >
              <div className="fsc-num" style={{ color: SEVERITY_COLOR[sev] }}>{count}</div>
              <div className="fsc-label">{sev.charAt(0).toUpperCase() + sev.slice(1)}</div>
            </div>
          );
        })}
      </div>

      {/* Open findings list */}
      <div className="findings-table-wrap">
        {openFindings.map((f) => {
          const kpi = kpis.find((k) => k.id === f.kpi);
          return (
            <FindingRow
              key={f.id}
              finding={f}
              kpi={kpi}
              onOpenKpi={onOpenKpi}
              onStatusChange={handleStatusChange}
            />
          );
        })}

        {openFindings.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-3)", fontSize: "0.875rem" }}>
            Keine offenen Findings
          </div>
        )}
      </div>

      {/* Closed findings */}
      {closedFindings.length > 0 && (
        <details className="finding-closed-section">
          <summary className="finding-closed-summary">
            Geschlossene Findings ({closedFindings.length})
          </summary>
          <div className="findings-table-wrap" style={{ marginTop: "0.5rem" }}>
            {closedFindings.map((f) => {
              const kpi = kpis.find((k) => k.id === f.kpi);
              return (
                <FindingRow
                  key={f.id}
                  finding={f}
                  kpi={kpi}
                  onOpenKpi={onOpenKpi}
                  onStatusChange={handleStatusChange}
                />
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
