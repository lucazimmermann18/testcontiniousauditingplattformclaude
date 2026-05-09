"use client";
import { useState, useEffect, useCallback } from "react";

interface Kpi {
  id: string;
  code: string;
  title: string;
}

interface DataSource {
  id: string;
  kpiId: string;
  name: string;
  type: "REST" | "CSV" | "MANUAL";
  url?: string | null;
  method: string;
  hasHeaders: boolean;
  bodyTemplate?: string | null;
  jsonPath?: string | null;
  active: boolean;
  lastFetchedAt?: string | null;
  lastData: boolean;
  lastError?: string | null;
  kpi: { id: string; code: string; title: string };
}

const TYPE_LABELS = { REST: "REST API", CSV: "CSV-Upload", MANUAL: "Manuell" };
const TYPE_COLORS: Record<string, string> = {
  REST: "#2952ff",
  CSV: "#10a37f",
  MANUAL: "#888",
};

const BLANK_FORM = {
  name: "",
  type: "REST" as "REST" | "CSV" | "MANUAL",
  url: "",
  method: "GET" as "GET" | "POST",
  headerKey: "",
  headerValue: "",
  headers: {} as Record<string, string>,
  bodyTemplate: "",
  jsonPath: "",
  active: true,
};

export function DataSourceSettings({ kpis }: { kpis: Kpi[] }) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [uploadKpi, setUploadKpi] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/datasources");
    if (res.ok) setSources(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function sourceForKpi(kpiId: string): DataSource | undefined {
    return sources.find((s) => s.kpiId === kpiId);
  }

  function openEdit(kpiId: string) {
    if (expandedKpi === kpiId) { setExpandedKpi(null); return; }
    const existing = sourceForKpi(kpiId);
    if (existing) {
      setForm({
        name: existing.name,
        type: existing.type,
        url: existing.url ?? "",
        method: (existing.method as "GET" | "POST"),
        headerKey: "",
        headerValue: "",
        headers: {},
        bodyTemplate: existing.bodyTemplate ?? "",
        jsonPath: existing.jsonPath ?? "",
        active: existing.active,
      });
    } else {
      setForm({ ...BLANK_FORM, name: kpis.find((k) => k.id === kpiId)?.code ?? "" });
    }
    setMsg(null);
    setExpandedKpi(kpiId);
  }

  function addHeader() {
    if (!form.headerKey.trim()) return;
    setForm((f) => ({
      ...f,
      headers: { ...f.headers, [f.headerKey.trim()]: f.headerValue },
      headerKey: "",
      headerValue: "",
    }));
  }

  function removeHeader(key: string) {
    setForm((f) => { const h = { ...f.headers }; delete h[key]; return { ...f, headers: h }; });
  }

  async function save(kpiId: string) {
    setSaving(true);
    setMsg(null);
    const body: Record<string, unknown> = {
      kpiId,
      name: form.name,
      type: form.type,
      active: form.active,
    };
    if (form.type === "REST") {
      body.url = form.url || null;
      body.method = form.method;
      body.headers = Object.keys(form.headers).length > 0 ? form.headers : null;
      body.bodyTemplate = form.bodyTemplate || null;
      body.jsonPath = form.jsonPath || null;
    }

    const res = await fetch("/api/datasources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg({ text: "Datenquelle gespeichert.", ok: true });
      await load();
    } else {
      const err = await res.json();
      setMsg({ text: err.error ?? "Fehler beim Speichern.", ok: false });
    }
    setSaving(false);
  }

  async function deleteSource(id: string) {
    await fetch(`/api/datasources/${id}`, { method: "DELETE" });
    setExpandedKpi(null);
    await load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/datasources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    await load();
  }

  async function triggerFetch(sourceId: string, kpiId: string) {
    setTesting(sourceId);
    const res = await fetch(`/api/datasources/${sourceId}/fetch`, { method: "POST" });
    const data = await res.json();
    setTestResult((prev) => ({
      ...prev,
      [kpiId]: res.ok
        ? { ok: true, text: `✓ ${data.rowCount != null ? data.rowCount + " Datensätze" : "Daten"} empfangen` }
        : { ok: false, text: `✗ ${data.error ?? "Fehler"}` },
    }));
    setTesting(null);
    await load();
  }

  async function uploadCsv(sourceId: string, kpiId: string, file: File) {
    setUploading(true);
    setUploadKpi(kpiId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/datasources/${sourceId}/upload`, { method: "POST", body: fd });
    const data = await res.json();
    setTestResult((prev) => ({
      ...prev,
      [kpiId]: res.ok
        ? { ok: true, text: `✓ ${data.rowCount} Zeilen importiert` }
        : { ok: false, text: `✗ ${data.error ?? "Fehler"}` },
    }));
    setUploading(false);
    setUploadKpi(null);
    await load();
  }

  if (loading) return <div className="settings-empty">Laden…</div>;

  return (
    <div className="ds-wrap">
      <p className="ds-intro">
        Konfiguriere für jeden KPI eine Datenquelle. Der KI-Agent verwendet echte Daten, wenn eine aktive Quelle mit gecachten Daten vorliegt — andernfalls greift er auf Mock-Daten zurück.
      </p>

      {kpis.map((kpi) => {
        const src = sourceForKpi(kpi.id);
        const isOpen = expandedKpi === kpi.id;
        const tr = testResult[kpi.id];

        return (
          <div key={kpi.id} className={`ds-row${isOpen ? " ds-row-open" : ""}`}>
            {/* Header */}
            <div className="ds-row-head" onClick={() => openEdit(kpi.id)}>
              <div className="ds-row-info">
                <span className="ds-kpi-code">{kpi.code}</span>
                <span className="ds-kpi-title">{kpi.title}</span>
              </div>
              <div className="ds-row-meta">
                {src ? (
                  <>
                    <span className="ds-type-badge" style={{ background: TYPE_COLORS[src.type] + "22", color: TYPE_COLORS[src.type] }}>
                      {TYPE_LABELS[src.type]}
                    </span>
                    <span className={`ds-status-dot${src.active ? " ds-dot-active" : " ds-dot-inactive"}`} title={src.active ? "Aktiv" : "Inaktiv"} />
                    {src.lastData && (
                      <span className="ds-data-badge">
                        Daten vorhanden
                      </span>
                    )}
                    {src.lastFetchedAt && (
                      <span className="ds-last-fetch">
                        {new Date(src.lastFetchedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="ds-no-source">Keine Quelle</span>
                )}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" className={`ds-chevron${isOpen ? " ds-chevron-open" : ""}`}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Expanded editor */}
            {isOpen && (
              <div className="ds-editor">
                {src?.lastError && (
                  <div className="settings-msg settings-msg-err" style={{ marginBottom: "1rem" }}>
                    Letzter Fehler: {src.lastError}
                  </div>
                )}

                <div className="ds-form-grid">
                  <div className="settings-row">
                    <label className="settings-label">Name der Quelle</label>
                    <input className="settings-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="z.B. SAP-Buchungsexport" />
                  </div>
                  <div className="settings-row">
                    <label className="settings-label">Typ</label>
                    <select className="settings-input settings-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "REST" | "CSV" | "MANUAL" }))}>
                      <option value="REST">REST API</option>
                      <option value="CSV">CSV-Upload</option>
                      <option value="MANUAL">Manuell (Mock-Daten)</option>
                    </select>
                  </div>
                </div>

                {form.type === "REST" && (
                  <div className="ds-rest-section">
                    <div className="ds-form-grid">
                      <div className="settings-row" style={{ gridColumn: "1 / -1" }}>
                        <label className="settings-label">URL</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <select className="settings-input settings-select" style={{ maxWidth: 80 }} value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as "GET" | "POST" }))}>
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                          </select>
                          <input className="settings-input" style={{ flex: 1 }} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://api.example.com/data" />
                        </div>
                      </div>
                      <div className="settings-row">
                        <label className="settings-label">JSONPath (optional)</label>
                        <input className="settings-input" value={form.jsonPath} onChange={(e) => setForm((f) => ({ ...f, jsonPath: e.target.value }))} placeholder="z.B. data.rows" />
                        <span className="settings-hint">Dot-Notation um einen Array aus der Antwort zu extrahieren</span>
                      </div>
                      {form.method === "POST" && (
                        <div className="settings-row">
                          <label className="settings-label">Request-Body (JSON)</label>
                          <textarea className="settings-input" rows={3} value={form.bodyTemplate} onChange={(e) => setForm((f) => ({ ...f, bodyTemplate: e.target.value }))} placeholder='{"filter": "Q2-2026"}' style={{ fontFamily: "monospace", fontSize: "0.8rem" }} />
                        </div>
                      )}
                    </div>

                    {/* Headers */}
                    <div className="settings-row" style={{ marginTop: "8px" }}>
                      <label className="settings-label">Auth-Header {src?.hasHeaders && !Object.keys(form.headers).length ? "(gespeichert — zum Überschreiben neu eingeben)" : ""}</label>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                        <input className="settings-input" style={{ flex: 1 }} value={form.headerKey} onChange={(e) => setForm((f) => ({ ...f, headerKey: e.target.value }))} placeholder="Header-Name (z.B. Authorization)" />
                        <input className="settings-input" style={{ flex: 2 }} value={form.headerValue} onChange={(e) => setForm((f) => ({ ...f, headerValue: e.target.value }))} placeholder="Wert (z.B. Bearer eyJ...)" />
                        <button type="button" className="btn btn-ghost" onClick={addHeader}>+</button>
                      </div>
                      {Object.entries(form.headers).map(([k, v]) => (
                        <div key={k} className="ds-header-chip">
                          <span className="ds-header-key">{k}</span>
                          <span className="ds-header-val">{v.slice(0, 20)}{v.length > 20 ? "…" : ""}</span>
                          <button onClick={() => removeHeader(k)} className="ds-header-del">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" }}>
                  <label className="settings-check-label">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                    Aktiv
                  </label>
                  <button className="btn-primary" onClick={() => save(kpi.id)} disabled={saving}>
                    {saving ? "Speichern…" : "Speichern"}
                  </button>
                  {src && (
                    <button className="btn btn-ghost btn-sm-danger" onClick={() => deleteSource(src.id)}>
                      Löschen
                    </button>
                  )}
                </div>

                {msg && (
                  <div className={`settings-msg${msg.ok ? " settings-msg-ok" : " settings-msg-err"}`} style={{ marginTop: "8px" }}>
                    {msg.text}
                  </div>
                )}

                {/* Test / Upload section */}
                {src && (
                  <div className="ds-test-section">
                    {src.type === "REST" && src.url && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => triggerFetch(src.id, kpi.id)}
                        disabled={testing === src.id}
                      >
                        {testing === src.id ? "Abruf läuft…" : "Jetzt abrufen (Test)"}
                      </button>
                    )}
                    {src.type === "CSV" && (
                      <label className="btn btn-ghost ds-upload-btn">
                        {uploading && uploadKpi === kpi.id ? "Hochladen…" : "CSV hochladen"}
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadCsv(src.id, kpi.id, f);
                          }}
                        />
                      </label>
                    )}
                    {tr && (
                      <span className={`ds-test-result${tr.ok ? " ds-test-ok" : " ds-test-err"}`}>
                        {tr.text}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
