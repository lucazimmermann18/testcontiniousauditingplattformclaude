"use client";
import { useState, useEffect, useCallback } from "react";
import type { Kpi } from "@/types";

interface AuditRun {
  id: string;
  kpiId: string;
  agent: string;
  status: "ok" | "finding" | "review" | "error" | "running";
  confidence: number;
  summary: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  kpi: { id: string; code: string; title: string; agent: string };
}

const STATUS_COLOR: Record<string, string> = {
  ok:      "var(--ok)",
  finding: "var(--alert)",
  review:  "var(--warn)",
  error:   "var(--alert)",
  running: "var(--info, #3b82f6)",
};

const STATUS_BG: Record<string, string> = {
  ok:      "var(--ok-bg)",
  finding: "var(--alert-bg)",
  review:  "var(--warn-bg)",
  error:   "var(--alert-bg)",
  running: "#eff6ff",
};

const STATUS_LABEL: Record<string, string> = {
  ok: "OK", finding: "Finding", review: "Review", error: "Fehler", running: "Läuft",
};

export function AuditHistoryView({ kpis, onOpenKpi }: { kpis: Kpi[]; onOpenKpi: (id: string) => void }) {
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKpi, setFilterKpi] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterKpi !== "all")     params.set("kpiId", filterKpi);
    if (filterStatus !== "all")  params.set("status", filterStatus);
    const res = await fetch(`/api/audit-runs?${params}`);
    if (res.ok) setRuns(await res.json());
    setLoading(false);
  }, [filterKpi, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const total = runs.length;
  const okCount = runs.filter((r) => r.status === "ok").length;
  const findingCount = runs.filter((r) => r.status === "finding").length;

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Audit-Verlauf</h2>
          <p className="view-sub">{total} Agent-Läufe · {findingCount} Findings ausgelöst · {okCount} konform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ah-filters">
        <select className="ah-filter-select" value={filterKpi} onChange={(e) => setFilterKpi(e.target.value)}>
          <option value="all">Alle KPIs</option>
          {kpis.map((k) => <option key={k.id} value={k.id}>{k.code} – {k.title}</option>)}
        </select>
        <select className="ah-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Alle Status</option>
          <option value="ok">OK</option>
          <option value="finding">Finding</option>
          <option value="review">Review</option>
          <option value="error">Fehler</option>
        </select>
        <button className="ah-refresh-btn" onClick={load} disabled={loading}>↻ Aktualisieren</button>
      </div>

      {loading ? (
        <div className="ah-loading">Lädt…</div>
      ) : runs.length === 0 ? (
        <div className="ah-empty">Noch keine Agent-Läufe vorhanden. Starte einen Agenten im KI-Agenten-Bereich.</div>
      ) : (
        <div className="ah-table">
          <div className="ah-table-head">
            <span>KPI</span>
            <span>Agent</span>
            <span>Status</span>
            <span>Konfidenz</span>
            <span>Dauer</span>
            <span>Zeitpunkt</span>
          </div>
          {runs.map((run) => {
            const dur = run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—";
            const ts = new Date(run.startedAt).toLocaleString("de-DE", {
              day: "2-digit", month: "2-digit", year: "2-digit",
              hour: "2-digit", minute: "2-digit",
            });
            return (
              <div
                key={run.id}
                className="ah-row"
                onClick={() => onOpenKpi(run.kpi.id)}
                title={run.summary ?? undefined}
              >
                <span className="ah-kpi-code">{run.kpi.code}</span>
                <span className="ah-agent">{run.kpi.agent}</span>
                <span>
                  <span className="ah-status-badge" style={{
                    color: STATUS_COLOR[run.status],
                    background: STATUS_BG[run.status],
                  }}>
                    {STATUS_LABEL[run.status]}
                  </span>
                </span>
                <span className="ah-conf">{run.confidence > 0 ? `${Math.round(run.confidence * 100)}%` : "—"}</span>
                <span className="ah-dur">{dur}</span>
                <span className="ah-ts">{ts}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
