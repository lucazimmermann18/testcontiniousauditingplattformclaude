"use client";
import type { Kpi } from "@/types";
import { QUARTERS, AREAS } from "@/data/audit-data";
import { StatusDot } from "@/components/ui/StatusDot";

export function TimelineView({ kpis }: { kpis: Kpi[] }) {
  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">Quartals-Timeline</h2>
        <p className="view-sub">Entwicklung aller Kennzahlen über 8 Quartale</p>
      </div>

      <div className="timeline-table-wrap">
        <table className="timeline-table">
          <thead>
            <tr>
              <th className="tl-kpi-col">Kennzahl</th>
              {QUARTERS.map((q, i) => (
                <th key={q} className={i === QUARTERS.length - 1 ? "tl-current" : ""}>{q}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREAS.map((area) => {
              const areaKpis = kpis.filter((k) => k.area === area.id);
              if (areaKpis.length === 0) return null;
              return [
                <tr key={`area-${area.id}`} className="tl-area-row">
                  <td colSpan={QUARTERS.length + 1}>
                    <span className="area-badge" style={{ background: area.color }}>{area.short}</span>
                    {" "}{area.name}
                  </td>
                </tr>,
                ...areaKpis.map((kpi) => (
                  <tr key={kpi.id} className="tl-kpi-row">
                    <td className="tl-kpi-name">
                      <StatusDot status={kpi.status} size={7} />
                      <span className="tl-code">{kpi.code}</span>
                      <span className="tl-title">{kpi.title}</span>
                    </td>
                    {kpi.trend.map((val, i) => {
                      const max = Math.max(...kpi.trend.filter((v) => v !== 0), 0.001);
                      const pct = val === 0 ? 0 : Math.round((val / max) * 100);
                      return (
                        <td key={i} className={`tl-val-cell${i === QUARTERS.length - 1 ? " tl-current" : ""}`}>
                          {val !== 0 ? (
                            <div className="tl-bar-wrap" title={String(val)}>
                              <div
                                className={`tl-bar tl-bar-${kpi.status}`}
                                style={{ height: `${Math.max(pct, 10)}%` }}
                              />
                            </div>
                          ) : <span className="tl-empty">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
