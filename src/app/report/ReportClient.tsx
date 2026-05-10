"use client";

interface StatusCounts { ok: number; review: number; finding: number; pending: number; }
interface KpiRow {
  id: string; code: string; title: string;
  areaName: string; areaShort: string; areaColor: string;
  risk: number; status: string; confidence: number;
  value: string; delta: string; owner: string; reviewer: string;
  lastRunSummary: string | null; lastRunAt: string | null;
}
interface FindingRow {
  id: string; title: string; desc: string;
  severity: string; status: string;
  kpiCode: string; kpiTitle: string; owner: string;
  createdAt: string; dueDate: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  ok: "OK", review: "Review", finding: "Finding", pending: "Ausstehend", running: "Läuft",
};
const SEV_COLOR: Record<string, string> = {
  hoch: "#dc3545", mittel: "#fd7e14", niedrig: "#0d6efd",
};

export function ReportClient({
  quarter, generatedAt, statusCounts, avgConfidence,
  openFindings, criticalFindings, kpis, findings, totalRuns,
}: {
  quarter: string;
  generatedAt: string;
  statusCounts: StatusCounts;
  avgConfidence: number;
  openFindings: number;
  criticalFindings: number;
  kpis: KpiRow[];
  findings: FindingRow[];
  totalRuns: number;
}) {
  const total = kpis.length;
  const genDate = new Date(generatedAt).toLocaleString("de-DE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // Group KPIs by area
  const byArea: Record<string, KpiRow[]> = {};
  for (const k of kpis) {
    if (!byArea[k.areaName]) byArea[k.areaName] = [];
    byArea[k.areaName].push(k);
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-page { padding: 0 !important; }
          .report-wrap { box-shadow: none !important; border: none !important; }
          .page-break { page-break-before: always; }
        }
        .report-page {
          background: #f5f5f5;
          min-height: 100vh;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .report-wrap {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .report-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          padding: 3rem;
        }
        .report-header-brand {
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .report-header-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .report-header-meta {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
        }
        .report-body { padding: 2rem; }
        .report-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a2e;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
          margin: 2rem 0 1rem;
        }
        .kpi-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin: 1.5rem 0;
        }
        .kpi-stat {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        .kpi-stat-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }
        .kpi-stat-label {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }
        .report-table th {
          background: #f9fafb;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .report-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }
        .report-table tr:last-child td { border-bottom: none; }
        .status-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .area-group-head {
          background: #f3f4f6;
          padding: 6px 10px;
          font-weight: 600;
          font-size: 0.8rem;
          color: #374151;
        }
        .finding-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }
        .finding-card-head {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #fafafa;
          border-bottom: 1px solid #e5e7eb;
        }
        .finding-card-body {
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          color: #374151;
          line-height: 1.5;
        }
        .sev-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .report-footer {
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .conf-bar {
          display: inline-block;
          width: 60px;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          vertical-align: middle;
          overflow: hidden;
        }
        .conf-fill {
          height: 100%;
          background: #10b981;
          border-radius: 3px;
        }
      `}</style>

      <div className="report-page">
        {/* Toolbar (hidden when printing) */}
        <div className="no-print" style={{
          maxWidth: 1000, margin: "0 auto 1rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end",
        }}>
          <a href="/" style={{
            padding: "8px 16px", background: "white", border: "1px solid #e5e7eb",
            borderRadius: 6, textDecoration: "none", color: "#374151", fontSize: "0.875rem",
          }}>
            ← Dashboard
          </a>
          <button
            onClick={() => window.print()}
            style={{
              padding: "8px 20px", background: "#1a1a2e", color: "white",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
            }}
          >
            ⎙ PDF drucken / speichern
          </button>
        </div>

        <div className="report-wrap">
          {/* Cover page header */}
          <div className="report-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="report-header-brand">Continuum Audit Platform</div>
                <div className="report-header-title">Audit-Bericht {quarter}</div>
                <div className="report-header-meta">
                  Erstellt am {genDate} · {total} KPIs · {totalRuns} Prüfläufe · Vertraulich
                </div>
              </div>
              <div style={{ textAlign: "right", opacity: 0.5 }}>
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="3" stroke="white" strokeWidth="1.5" />
                  <path d="M7 12h3l2-5 3 10 2-5h2" stroke="white" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {/* Risk gauge strip */}
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
              {[
                { label: "Gesamtrisiko", value: findings.filter((f) => f.severity === "hoch").length > 2 ? "HOCH" : findings.length > 0 ? "MITTEL" : "NIEDRIG", color: findings.filter((f) => f.severity === "hoch").length > 2 ? "#ef4444" : findings.length > 0 ? "#f59e0b" : "#22c55e" },
                { label: "Prüfabdeckung", value: `${Math.round((statusCounts.ok + statusCounts.finding + statusCounts.review) / Math.max(total, 1) * 100)}%`, color: "#60a5fa" },
                { label: "Ø KI-Konfidenz", value: `${Math.round(avgConfidence * 100)}%`, color: avgConfidence >= 0.8 ? "#22c55e" : avgConfidence >= 0.6 ? "#f59e0b" : "#ef4444" },
              ].map((g) => (
                <div key={g.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 16px", minWidth: 120 }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: g.color }}>{g.value}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{g.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="report-body">
            {/* Table of contents */}
            <div className="report-section-title">Inhaltsverzeichnis</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <tbody>
                {[
                  ["1", "Executive Summary", ""],
                  ["2", "KPI-Übersicht nach Bereich", `${total} KPIs`],
                  ["3", "Offene Findings", `${findings.length} Finding${findings.length !== 1 ? "s" : ""}`],
                  ["4", "Risikoverteilung nach Bereich", "Bereichsanalyse"],
                ].map(([num, title, note]) => (
                  <tr key={num} style={{ borderBottom: "1px dotted #e5e7eb" }}>
                    <td style={{ padding: "6px 8px", width: 24, color: "#9ca3af", fontWeight: 600 }}>{num}</td>
                    <td style={{ padding: "6px 8px", fontWeight: 500 }}>{title}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", color: "#6b7280", fontSize: "0.8rem" }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Executive Summary */}
            <div className="report-section-title">Executive Summary</div>
            <div className="kpi-stat-grid">
              <div className="kpi-stat">
                <div className="kpi-stat-value" style={{ color: "#10b981" }}>{statusCounts.ok}</div>
                <div className="kpi-stat-label">KPIs OK</div>
              </div>
              <div className="kpi-stat">
                <div className="kpi-stat-value" style={{ color: "#f59e0b" }}>{statusCounts.review}</div>
                <div className="kpi-stat-label">In Review</div>
              </div>
              <div className="kpi-stat">
                <div className="kpi-stat-value" style={{ color: "#ef4444" }}>{statusCounts.finding}</div>
                <div className="kpi-stat-label">Findings</div>
              </div>
              <div className="kpi-stat">
                <div className="kpi-stat-value" style={{ color: "#6b7280" }}>{statusCounts.pending}</div>
                <div className="kpi-stat-label">Ausstehend</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="kpi-stat">
                <div className="kpi-stat-value" style={{ color: "#ef4444" }}>{criticalFindings}</div>
                <div className="kpi-stat-label">Kritische Findings</div>
              </div>
              <div className="kpi-stat">
                <div className="kpi-stat-value" style={{ color: "#f59e0b" }}>{openFindings}</div>
                <div className="kpi-stat-label">Offene Findings gesamt</div>
              </div>
              <div className="kpi-stat">
                <div className="kpi-stat-value" style={{ fontSize: "1.5rem", color: "#10b981" }}>
                  {Math.round(avgConfidence * 100)}%
                </div>
                <div className="kpi-stat-label">Ø Konfidenz</div>
              </div>
            </div>

            {/* KPI Overview by Area */}
            <div className="report-section-title page-break">KPI-Übersicht nach Bereich</div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>KPI-Bezeichnung</th>
                  <th>Status</th>
                  <th>Konfidenz</th>
                  <th>Wert</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byArea).map(([areaName, areaKpis]) => (
                  <>
                    <tr key={`area-${areaName}`}>
                      <td colSpan={6} className="area-group-head">{areaName}</td>
                    </tr>
                    {areaKpis.map((k) => {
                      const statusColors: Record<string, { bg: string; text: string }> = {
                        ok: { bg: "#dcfce7", text: "#166534" },
                        review: { bg: "#fef3c7", text: "#92400e" },
                        finding: { bg: "#fee2e2", text: "#991b1b" },
                        pending: { bg: "#f3f4f6", text: "#6b7280" },
                        running: { bg: "#dbeafe", text: "#1e40af" },
                      };
                      const sc = statusColors[k.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
                      return (
                        <tr key={k.id}>
                          <td style={{ fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{k.code}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{k.title}</div>
                            {k.lastRunSummary && (
                              <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>
                                {k.lastRunSummary.slice(0, 100)}…
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="status-pill" style={{ background: sc.bg, color: sc.text }}>
                              {STATUS_LABEL[k.status] ?? k.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div className="conf-bar">
                                <div className="conf-fill" style={{ width: `${Math.round(k.confidence * 100)}%` }} />
                              </div>
                              <span style={{ fontSize: "0.75rem" }}>{Math.round(k.confidence * 100)}%</span>
                            </div>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <div>{k.value}</div>
                            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{k.delta}</div>
                          </td>
                          <td style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{k.owner}</td>
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>

            {/* Open Findings */}
            {findings.length > 0 && (
              <>
                <div className="report-section-title page-break">Offene Findings ({findings.length})</div>
                {findings.map((f) => (
                  <div key={f.id} className="finding-card">
                    <div className="finding-card-head">
                      <span
                        className="sev-badge"
                        style={{
                          background: SEV_COLOR[f.severity] + "22",
                          color: SEV_COLOR[f.severity],
                        }}
                      >
                        {f.severity}
                      </span>
                      <strong style={{ flex: 1 }}>{f.title}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        {f.kpiCode} · Zuständig: {f.owner}
                      </span>
                      {f.dueDate && (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          Fällig: {new Date(f.dueDate).toLocaleDateString("de-DE")}
                        </span>
                      )}
                    </div>
                    <div className="finding-card-body">{f.desc}</div>
                  </div>
                ))}
              </>
            )}

            {/* Area risk distribution */}
            <div className="report-section-title page-break">Risikoverteilung nach Bereich</div>
            <table className="report-table">
              <thead>
                <tr><th>Bereich</th><th>KPIs</th><th>OK</th><th>Review</th><th>Finding</th><th>Ø Konfidenz</th><th>Risikostufe</th></tr>
              </thead>
              <tbody>
                {Object.entries(byArea).map(([areaName, areaKpis]) => {
                  const aOk = areaKpis.filter((k) => k.status === "ok").length;
                  const aRev = areaKpis.filter((k) => k.status === "review").length;
                  const aFind = areaKpis.filter((k) => k.status === "finding").length;
                  const aConf = areaKpis.filter((k) => k.confidence > 0).reduce((s, k) => s + k.confidence, 0) / Math.max(areaKpis.filter((k) => k.confidence > 0).length, 1);
                  const riskLevel = aFind > 0 ? "HOCH" : aRev > 0 ? "MITTEL" : "NIEDRIG";
                  const riskColor = aFind > 0 ? "#ef4444" : aRev > 0 ? "#f59e0b" : "#22c55e";
                  return (
                    <tr key={areaName}>
                      <td style={{ fontWeight: 500 }}>{areaName}</td>
                      <td className="tabular">{areaKpis.length}</td>
                      <td style={{ color: "#10b981", fontWeight: 600 }}>{aOk}</td>
                      <td style={{ color: "#f59e0b", fontWeight: 600 }}>{aRev}</td>
                      <td style={{ color: "#ef4444", fontWeight: 600 }}>{aFind}</td>
                      <td className="tabular">{Math.round(aConf * 100)}%</td>
                      <td>
                        <span style={{ background: riskColor + "20", color: riskColor, padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700 }}>
                          {riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>{/* end report-body */}

          {/* Footer */}
          <div className="report-footer">
            <span>Continuum Audit Platform · Vertraulich · Interne Verwendung</span>
            <span>{quarter} · Erstellt {new Date(generatedAt).toLocaleDateString("de-DE")} · {totalRuns} Prüfläufe</span>
          </div>
        </div>
      </div>
    </>
  );
}
