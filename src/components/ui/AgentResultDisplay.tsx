"use client";
import type { AgentResult } from "@/lib/agents/types";

export function AgentResultDisplay({ result }: { result: AgentResult }) {
  return (
    <div className="agent-result">
      <div className="ar-summary-text" style={{ marginBottom: "1rem", lineHeight: 1.6 }}>{result.summary}</div>

      <div className="ar-confidence">
        <span className="ar-conf-label">Konfidenz</span>
        <div className="ar-conf-bar">
          <div className="ar-conf-fill" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
        </div>
        <span className="ar-conf-val">{Math.round(result.confidence * 100)}%</span>
      </div>

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
