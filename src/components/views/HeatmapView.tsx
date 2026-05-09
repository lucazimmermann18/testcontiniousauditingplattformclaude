"use client";
import type { Kpi } from "@/types";
import { AREAS } from "@/data/audit-data";
import { StatusDot } from "@/components/ui/StatusDot";
import { RiskBars } from "@/components/ui/RiskBars";

const STATUS_COLOR: Record<string, string> = {
  finding: "var(--alert)",
  review:  "var(--warn)",
  running: "var(--info)",
  pending: "var(--muted)",
  ok:      "var(--ok)",
};

const STATUS_BG: Record<string, string> = {
  finding: "var(--alert-bg)",
  review:  "var(--warn-bg)",
  running: "var(--info-bg)",
  pending: "var(--muted-bg)",
  ok:      "var(--ok-bg)",
};

export function HeatmapView({ kpis, onOpenKpi }: { kpis: Kpi[]; onOpenKpi: (id: string) => void }) {
  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">Risiko-Heatmap</h2>
        <p className="view-sub">Alle Kennzahlen nach inhärentem Risiko und aktuellem Status</p>
      </div>

      <div className="heatmap-grid">
        {/* Header row */}
        <div className="heatmap-header">
          <div className="heatmap-corner" />
          {[5, 4, 3, 2, 1].map((r) => (
            <div key={r} className="heatmap-risk-label">Risiko {r}</div>
          ))}
        </div>

        {/* Rows per area */}
        {AREAS.map((area) => {
          const areaKpis = kpis.filter((k) => k.area === area.id);
          if (areaKpis.length === 0) return null;
          return (
            <div key={area.id} className="heatmap-row">
              <div className="heatmap-area-label">
                <span className="area-badge" style={{ background: area.color }}>{area.short}</span>
                <span className="heatmap-area-name">{area.name}</span>
              </div>
              {[5, 4, 3, 2, 1].map((riskLevel) => {
                const cell = areaKpis.filter((k) => k.risk === riskLevel);
                return (
                  <div key={riskLevel} className={`heatmap-cell${riskLevel >= 4 ? " heatmap-cell-high" : riskLevel === 3 ? " heatmap-cell-mid" : " heatmap-cell-low"}`}>
                    {cell.map((k) => (
                      <button key={k.id} className="heatmap-kpi-chip"
                        style={{ background: STATUS_BG[k.status], borderColor: STATUS_COLOR[k.status] }}
                        onClick={() => onOpenKpi(k.id)}
                        title={k.title}>
                        <StatusDot status={k.status} size={6} />
                        <span>{k.code}</span>
                      </button>
                    ))}
                    {cell.length === 0 && <span className="heatmap-empty" />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        {Object.entries({ finding: "Befund", review: "In Prüfung", running: "Läuft", pending: "Offen", ok: "Konform" }).map(([s, l]) => (
          <div key={s} className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLOR[s] }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
