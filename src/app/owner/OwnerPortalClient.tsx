"use client";
import { useState } from "react";

interface OwnerKpi {
  id: string; code: string; areaId: string; areaName: string;
  title: string; desc: string; risk: number; status: string;
  confidence: number; value: string; delta: string; lastRun: string;
  openFindings: number; lastRunSummary: string | null;
  lastRunStatus: string | null; lastRunConf: number | null;
}

interface OwnerFinding {
  id: string; kpiCode: string; kpiTitle: string; areaId: string;
  title: string; severity: string; status: string; dueDate: string;
  responseStatus: string | null; aiScore: number | null;
}

interface PendingResponse {
  id: string; findingTitle: string; severity: string;
  status: string; aiScore: number | null; reviewerNote: string | null;
}

interface OwnerData {
  kpis: OwnerKpi[]; findings: OwnerFinding[];
  pendingResponses: PendingResponse[]; userName: string;
}

const STATUS_LABEL: Record<string, string> = {
  ok: "OK", review: "Review", finding: "Finding", running: "Läuft", pending: "Ausstehend",
};
const SEV_LABEL: Record<string, string> = { hoch: "Hoch", mittel: "Mittel", niedrig: "Niedrig" };

function DueBadge({ dueDate }: { dueDate: string }) {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  const cls = diff < 0 ? "op-due-overdue" : diff <= 7 ? "op-due-soon" : "op-due-ok";
  const label = diff < 0 ? `${Math.abs(diff)}d überfällig` : diff === 0 ? "Heute" : `${diff}d`;
  return <span className={`op-due ${cls}`}>{label}</span>;
}

export function OwnerPortalClient({ data }: { data: OwnerData }) {
  const [tab, setTab] = useState<"kpis" | "findings" | "responses">("kpis");
  const { kpis, findings, pendingResponses, userName } = data;

  const okCount = kpis.filter((k) => k.status === "ok").length;
  const findingCount = kpis.filter((k) => k.status === "finding").length;
  const overdueFindings = findings.filter((f) => new Date(f.dueDate) < new Date()).length;

  return (
    <div className="op-shell">
      {/* Slim header */}
      <header className="op-header">
        <div className="op-brand">
          <div className="op-brand-mark">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 12h3l2-5 3 10 2-5h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div className="op-brand-name">CONTINUUM·AUDIT</div>
          <div className="op-brand-badge">Process Owner Portal</div>
        </div>
        <div className="op-header-r">
          <span className="op-user-name">👋 {userName}</span>
          <a href="/" className="op-back-link">← Zur Hauptplattform</a>
        </div>
      </header>

      <div className="op-body">
        {/* Hero strip */}
        <div className="op-hero">
          <div className="op-hero-title">Guten Tag, {userName.split(" ")[0]}</div>
          <div className="op-hero-sub">Hier sind alle KPIs und Findings, die Ihrer Verantwortung unterliegen.</div>
          <div className="op-stats-row">
            <div className="op-stat">
              <div className="op-stat-num op-stat-ok">{okCount}</div>
              <div className="op-stat-label">KPIs in Ordnung</div>
            </div>
            <div className="op-stat">
              <div className="op-stat-num op-stat-finding">{findingCount}</div>
              <div className="op-stat-label">Offene Findings</div>
            </div>
            <div className="op-stat">
              <div className="op-stat-num op-stat-overdue">{overdueFindings}</div>
              <div className="op-stat-label">Überfällig</div>
            </div>
            <div className="op-stat">
              <div className="op-stat-num">{pendingResponses.length}</div>
              <div className="op-stat-label">Antworten ausstehend</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="op-tabs">
          <button className={`op-tab${tab === "kpis" ? " active" : ""}`} onClick={() => setTab("kpis")}>
            Meine KPIs ({kpis.length})
          </button>
          <button className={`op-tab${tab === "findings" ? " active" : ""}`} onClick={() => setTab("findings")}>
            Offene Findings ({findings.length})
          </button>
          <button className={`op-tab${tab === "responses" ? " active" : ""}`} onClick={() => setTab("responses")}>
            Maßnahmenpläne ({pendingResponses.length})
          </button>
        </div>

        {/* KPIs tab */}
        {tab === "kpis" && (
          <div className="op-kpi-grid">
            {kpis.length === 0 && <div className="op-empty">Keine KPIs zugewiesen.</div>}
            {kpis.map((k) => (
              <div key={k.id} className={`op-kpi-card op-kpi-${k.status}`}>
                <div className="op-kpi-head">
                  <span className="op-kpi-code">{k.code}</span>
                  <span className={`op-kpi-status op-kpi-status-${k.status}`}>{STATUS_LABEL[k.status] ?? k.status}</span>
                </div>
                <div className="op-kpi-title">{k.title}</div>
                <div className="op-kpi-area">{k.areaName}</div>
                {k.lastRunSummary && (
                  <div className="op-kpi-summary">{k.lastRunSummary.slice(0, 140)}…</div>
                )}
                <div className="op-kpi-meta">
                  <span className="op-kpi-meta-item">
                    <span className="op-kpi-meta-label">Wert</span> {k.value}
                  </span>
                  <span className="op-kpi-meta-item">
                    <span className="op-kpi-meta-label">Konfidenz</span> {Math.round(k.confidence * 100)}%
                  </span>
                  <span className="op-kpi-meta-item">
                    <span className="op-kpi-meta-label">Risiko</span> {k.risk}/5
                  </span>
                </div>
                {k.openFindings > 0 && (
                  <div className="op-kpi-finding-badge">{k.openFindings} offene Finding{k.openFindings > 1 ? "s" : ""}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Findings tab */}
        {tab === "findings" && (
          <div className="op-findings">
            {findings.length === 0 && <div className="op-empty">Keine offenen Findings.</div>}
            {findings.map((f) => (
              <div key={f.id} className={`op-finding op-finding-${f.severity}`}>
                <div className="op-finding-head">
                  <span className={`op-finding-sev op-sev-${f.severity}`}>{SEV_LABEL[f.severity] ?? f.severity}</span>
                  <span className="op-finding-kpi">{f.kpiCode}</span>
                  <DueBadge dueDate={f.dueDate} />
                  {f.responseStatus && (
                    <span className={`op-resp-badge op-resp-${f.responseStatus}`}>{f.responseStatus}</span>
                  )}
                </div>
                <div className="op-finding-title">{f.title}</div>
                <div className="op-finding-sub">{f.kpiTitle}</div>
                {f.aiScore !== null && (
                  <div className="op-ai-score">
                    KI-Bewertung des Maßnahmenplans: <strong>{Math.round(f.aiScore * 10)}/10</strong>
                  </div>
                )}
                <div className="op-finding-actions">
                  <a href={`/?finding=${f.id}`} className="op-finding-link">
                    Maßnahmenplan einreichen →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Responses tab */}
        {tab === "responses" && (
          <div className="op-responses">
            {pendingResponses.length === 0 && <div className="op-empty">Keine ausstehenden Maßnahmenpläne.</div>}
            {pendingResponses.map((r) => (
              <div key={r.id} className={`op-response op-response-${r.status}`}>
                <div className="op-response-head">
                  <span className={`op-finding-sev op-sev-${r.severity}`}>{SEV_LABEL[r.severity] ?? r.severity}</span>
                  <span className={`op-resp-badge op-resp-${r.status}`}>
                    {r.status === "submitted" ? "Eingereicht — wartet auf Review" : "Abgelehnt — bitte überarbeiten"}
                  </span>
                </div>
                <div className="op-response-title">{r.findingTitle}</div>
                {r.aiScore !== null && (
                  <div className="op-ai-score">KI-Bewertung: <strong>{Math.round(r.aiScore * 10)}/10</strong></div>
                )}
                {r.reviewerNote && r.status === "rejected" && (
                  <div className="op-reviewer-note">
                    <strong>Reviewer-Anmerkung:</strong> {r.reviewerNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
