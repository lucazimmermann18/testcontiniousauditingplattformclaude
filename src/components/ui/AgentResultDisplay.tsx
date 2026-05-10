"use client";
import type { AgentResult } from "@/lib/agents/types";

const STAGE_META: Record<string, { icon: string; label: string; color: string }> = {
  scout:         { icon: "🔍", label: "Scout",        color: "var(--info)" },
  analyst:       { icon: "🧪", label: "Analyst",       color: "var(--brand)" },
  cross_checker: { icon: "🔗", label: "Cross-Checker", color: "var(--warn)" },
  risk_rater:    { icon: "⚖️", label: "Risk-Rater",    color: "var(--ok)" },
};

export function AgentResultDisplay({ result }: { result: AgentResult }) {
  return (
    <div className="agent-result">
      <div className="ar-summary-text" style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
        {result.summary}
      </div>

      <div className="ar-confidence">
        <span className="ar-conf-label">Konfidenz</span>
        <div className="ar-conf-bar">
          <div className="ar-conf-fill" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
        </div>
        <span className="ar-conf-val">{Math.round(result.confidence * 100)}%</span>
      </div>

      {/* Stage pipeline results */}
      {result.stages && result.stages.length > 0 && (
        <div className="ar-stages">
          <div className="ar-section-label">Prüfungspipeline ({result.stages.length} Stufen)</div>
          <div className="ar-stages-grid">
            {result.stages.map((stage) => {
              const meta = STAGE_META[stage.stage] ?? { icon: "▶", label: stage.stage, color: "var(--ink-3)" };
              return (
                <div key={stage.stage} className="ar-stage-card">
                  <div className="ar-stage-head">
                    <span className="ar-stage-icon">{meta.icon}</span>
                    <span className="ar-stage-name" style={{ color: meta.color }}>{meta.label}</span>
                  </div>
                  <div className="ar-stage-agent">{stage.agentName}</div>
                  <div className="ar-stage-summary">{stage.summary}</div>
                  {stage.keyFindings.length > 0 && (
                    <ul className="ar-stage-findings">
                      {stage.keyFindings.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical trend */}
      {result.historicalTrend && (
        <div className="ar-historical">
          <div className="ar-section-label">Historischer Trend</div>
          <div className="ar-historical-text">{result.historicalTrend}</div>
        </div>
      )}

      {/* Cross-KPI insights */}
      {result.crossKpiInsights && (
        <div className="ar-cross-kpi">
          <div className="ar-section-label">Cross-KPI Erkenntnisse</div>
          <div className="ar-cross-kpi-text">{result.crossKpiInsights}</div>
        </div>
      )}

      {result.anomalies.length > 0 && (
        <div className="ar-anomalies">
          <div className="ar-section-label">Auffälligkeiten ({result.anomalies.length})</div>
          {result.anomalies.map((a, i) => (
            <div key={i} className={`ar-anomaly ar-anomaly-${a.severity}`}>
              <div className="ar-anomaly-head">
                <span className={`ar-sev-badge ar-sev-${a.severity}`}>{a.severity}</span>
                <span className="ar-anomaly-title">{a.title}</span>
              </div>
              <div className="ar-anomaly-desc">{a.description}</div>
            </div>
          ))}
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div className="ar-recommendations">
          <div className="ar-section-label">Handlungsempfehlungen</div>
          <ul className="ar-rec-list">
            {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {result.details && (
        <details className="ar-details-wrap">
          <summary className="ar-details-toggle">Vollständige Analyse</summary>
          <div className="ar-details-body">{result.details}</div>
        </details>
      )}
    </div>
  );
}
