"use client";
import { useState, useRef, useCallback } from "react";
import type { Kpi } from "@/types";
import type { AgentResult } from "@/lib/agents/types";
import { StatusPill } from "@/components/ui/StatusDot";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";

interface RunState {
  kpiId: string;
  status: "streaming" | "done" | "error";
  text: string;
  result?: AgentResult;
  error?: string;
}

export function AgentsView({
  kpis,
  onKpisUpdated,
}: {
  kpis: Kpi[];
  onKpisUpdated?: () => void;
}) {
  const [runs, setRuns] = useState<Record<string, RunState>>({});
  const [activeKpiId, setActiveKpiId] = useState<string | null>(null);
  const abortRefs = useRef<Record<string, AbortController>>({});

  const agentGroups = kpis.reduce<Record<string, Kpi[]>>((acc, k) => {
    acc[k.agent] = acc[k.agent] ?? [];
    acc[k.agent].push(k);
    return acc;
  }, {});

  const running = kpis.filter((k) => k.status === "running").length;
  const total = Object.keys(agentGroups).length;

  const startAgent = useCallback(async (kpiId: string) => {
    abortRefs.current[kpiId]?.abort();
    const ctrl = new AbortController();
    abortRefs.current[kpiId] = ctrl;

    setRuns((prev) => ({ ...prev, [kpiId]: { kpiId, status: "streaming", text: "" } }));
    setActiveKpiId(kpiId);

    try {
      const res = await fetch(`/api/agents/${kpiId}`, {
        method: "POST",
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Verbindungsfehler" }));
        setRuns((prev) => ({ ...prev, [kpiId]: { kpiId, status: "error", text: "", error: err.error } }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = JSON.parse(line.slice(6));
          if (chunk.type === "text") {
            setRuns((prev) => ({
              ...prev,
              [kpiId]: { ...prev[kpiId], text: (prev[kpiId]?.text ?? "") + chunk.content },
            }));
          } else if (chunk.type === "done") {
            setRuns((prev) => ({
              ...prev,
              [kpiId]: { ...prev[kpiId], status: "done", result: chunk.result },
            }));
            onKpisUpdated?.();
          } else if (chunk.type === "error") {
            setRuns((prev) => ({
              ...prev,
              [kpiId]: { ...prev[kpiId], status: "error", error: chunk.error },
            }));
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setRuns((prev) => ({
        ...prev,
        [kpiId]: { kpiId, status: "error", text: "", error: String(err) },
      }));
    }
  }, [onKpisUpdated]);

  const activeRun = activeKpiId ? runs[activeKpiId] : null;
  const activeKpi = activeKpiId ? kpis.find((k) => k.id === activeKpiId) : null;

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">KI-Agenten</h2>
          <p className="view-sub">{total} autonome Prüf-Agenten · {running} gerade aktiv</p>
        </div>
        <a href="/settings" className="btn-settings-link">
          ⚙ Einstellungen
        </a>
      </div>

      {/* Stats */}
      <div className="agents-stats">
        <div className="agent-stat-card">
          <div className="asc-num">{total}</div>
          <div className="asc-label">Agenten gesamt</div>
        </div>
        <div className="agent-stat-card agent-stat-ok">
          <div className="asc-num">{kpis.filter((k) => k.status === "ok").length}</div>
          <div className="asc-label">Ohne Befund</div>
        </div>
        <div className="agent-stat-card agent-stat-running">
          <div className="asc-num">{running}</div>
          <div className="asc-label">Läuft gerade</div>
        </div>
        <div className="agent-stat-card agent-stat-alert">
          <div className="asc-num">{kpis.filter((k) => k.status === "finding").length}</div>
          <div className="asc-label">Finding ausgelöst</div>
        </div>
      </div>

      <div className="agents-layout">
        {/* Agent cards */}
        <div className="agents-grid">
          {Object.entries(agentGroups).map(([agentName, agentKpis]) => {
            const kpi = agentKpis[0];
            const avgConf = agentKpis.filter((k) => k.confidence > 0)
              .reduce((s, k) => s + k.confidence, 0) /
              Math.max(agentKpis.filter((k) => k.confidence > 0).length, 1);
            const run = runs[kpi.id];
            const isStreaming = run?.status === "streaming";

            return (
              <div
                key={agentName}
                className={`agent-card agent-card-${kpi.status}${activeKpiId === kpi.id ? " agent-card-selected" : ""}`}
                onClick={() => setActiveKpiId(kpi.id)}
              >
                <div className="agent-card-head">
                  <div className={`agent-icon${isStreaming ? " agent-icon-pulse" : ""}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="agent-name">{agentName}</div>
                    <div className="agent-kpi-ref">
                      {agentKpis.map((k) => <AreaTag key={k.id} areaId={k.area} />)}
                    </div>
                  </div>
                  <StatusPill status={isStreaming ? "running" : kpi.status} />
                </div>

                <div className="agent-card-body">
                  <div className="agent-kpi-title">
                    {agentKpis.map((k) => k.code).join(", ")} · {kpi.title}
                  </div>
                  <div className="agent-meta-row">
                    <span className="agent-meta-item">
                      <span className="agent-meta-label">Konfidenz</span>
                      <Confidence value={avgConf} />
                    </span>
                    <span className="agent-meta-item">
                      <span className="agent-meta-label">Letzter Lauf</span>
                      <span className="agent-meta-val">{kpi.lastRun}</span>
                    </span>
                  </div>
                </div>

                <div className="agent-card-foot">
                  <button
                    className={`agent-run-btn${isStreaming ? " agent-run-btn-running" : ""}`}
                    onClick={(e) => { e.stopPropagation(); startAgent(kpi.id); }}
                    disabled={isStreaming}
                  >
                    {isStreaming ? (
                      <><span className="login-spinner" style={{ width: 12, height: 12 }} /> Analysiert…</>
                    ) : (
                      <>▶ Agent starten</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live output panel */}
        {activeKpi && (
          <div className="agent-output-panel">
            <div className="agent-output-head">
              <div>
                <div className="agent-output-title">{activeKpi.agent}</div>
                <div className="agent-output-sub">{activeKpi.code} · {activeKpi.title}</div>
              </div>
              {activeRun?.status === "done" && activeRun.result && (
                <div className={`agent-result-badge agent-result-${activeRun.result.status}`}>
                  {activeRun.result.status === "ok" ? "✓ OK" : activeRun.result.status === "review" ? "⚠ Review" : "⛔ Finding"}
                </div>
              )}
            </div>

            {!activeRun && (
              <div className="agent-output-empty">
                <p>Klicke auf „Agent starten" um eine KI-Prüfung zu starten.</p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--ink-3)" }}>
                  Der Agent analysiert Mock-Daten für {activeKpi.code} und gibt eine strukturierte Prüfungseinschätzung aus.
                </p>
              </div>
            )}

            {activeRun?.status === "error" && (
              <div className="agent-output-error">
                <strong>Fehler:</strong> {activeRun.error}
                {activeRun.error?.includes("API-Key") && (
                  <div style={{ marginTop: "8px" }}>
                    <a href="/settings?tab=apikeys" className="agent-setup-link">
                      → Jetzt API-Key in den Einstellungen hinterlegen
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeRun && activeRun.status !== "error" && (
              <div className="agent-output-body">
                {activeRun.result ? (
                  <AgentResultDisplay result={activeRun.result} />
                ) : (
                  <pre className="agent-stream-pre">{activeRun.text}<span className="agent-cursor">▋</span></pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentResultDisplay({ result }: { result: AgentResult }) {
  return (
    <div className="agent-result">
      <div className="ar-summary">{result.summary}</div>

      <div className="ar-confidence">
        <span className="ar-conf-label">Konfidenz</span>
        <div className="ar-conf-bar">
          <div className="ar-conf-fill" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
        </div>
        <span className="ar-conf-val">{Math.round(result.confidence * 100)}%</span>
      </div>

      {result.anomalies.length > 0 && (
        <div className="ar-anomalies">
          <div className="ar-section-label">Auffälligkeiten</div>
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
            {result.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="ar-details-wrap">
        <summary className="ar-details-toggle">Vollständige Analyse</summary>
        <div className="ar-details-body">{result.details}</div>
      </details>
    </div>
  );
}
