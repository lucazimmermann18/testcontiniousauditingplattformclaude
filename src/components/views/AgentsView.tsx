"use client";
import type { Kpi } from "@/types";
import { StatusPill } from "@/components/ui/StatusDot";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";

export function AgentsView({ kpis }: { kpis: Kpi[] }) {
  const agentGroups = kpis.reduce<Record<string, Kpi[]>>((acc, k) => {
    acc[k.agent] = acc[k.agent] ?? [];
    acc[k.agent].push(k);
    return acc;
  }, {});

  const running = kpis.filter((k) => k.status === "running").length;
  const total = Object.keys(agentGroups).length;

  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">KI-Agenten</h2>
        <p className="view-sub">{total} autonome Prüf-Agenten · {running} gerade aktiv</p>
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

      {/* Agent cards */}
      <div className="agents-grid">
        {Object.entries(agentGroups).map(([agentName, agentKpis]) => {
          const kpi = agentKpis[0];
          const avgConf = agentKpis.filter((k) => k.confidence > 0).reduce((s, k) => s + k.confidence, 0) /
            Math.max(agentKpis.filter((k) => k.confidence > 0).length, 1);
          return (
            <div key={agentName} className={`agent-card agent-card-${kpi.status}`}>
              <div className="agent-card-head">
                <div className="agent-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="agent-name">{agentName}</div>
                  <div className="agent-kpi-ref">
                    {agentKpis.map((k) => <AreaTag key={k.id} areaId={k.area} />)}
                  </div>
                </div>
                <StatusPill status={kpi.status} />
              </div>
              <div className="agent-card-body">
                <div className="agent-kpi-title">{agentKpis.map((k) => k.code).join(", ")} · {kpi.title}</div>
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
                <span className="ar-tag">Datenquellen: 4</span>
                <span className="ar-tag">Regelwerke: 7</span>
                <span className="ar-tag">∅ Laufzeit: 42s</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
