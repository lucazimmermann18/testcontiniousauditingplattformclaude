"use client";
import type { Kpi, Finding } from "@/types";
import { AreaTag } from "@/components/ui/AreaTag";

const SEVERITY_COLOR = {
  hoch:    "var(--alert)",
  mittel:  "var(--warn)",
  niedrig: "var(--ok)",
};

const SEVERITY_BG = {
  hoch:    "var(--alert-bg)",
  mittel:  "var(--warn-bg)",
  niedrig: "var(--ok-bg)",
};

export function FindingsView({
  kpis,
  findings,
  onOpenKpi,
}: {
  kpis: Kpi[];
  findings: Finding[];
  onOpenKpi: (id: string) => void;
}) {
  const openFindings = findings.filter((f) => f.status !== "geschlossen");
  const closedFindings = findings.filter((f) => f.status === "geschlossen");

  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">Findings</h2>
        <p className="view-sub">{openFindings.length} offene Befunde · {closedFindings.length} geschlossen</p>
      </div>

      {/* Summary cards */}
      <div className="findings-summary">
        {(["hoch", "mittel", "niedrig"] as const).map((sev) => {
          const count = openFindings.filter((f) => f.severity === sev).length;
          return (
            <div
              key={sev}
              className="findings-summary-card"
              style={{ borderColor: SEVERITY_COLOR[sev], background: SEVERITY_BG[sev] }}
            >
              <div className="fsc-num" style={{ color: SEVERITY_COLOR[sev] }}>{count}</div>
              <div className="fsc-label">{sev.charAt(0).toUpperCase() + sev.slice(1)}</div>
            </div>
          );
        })}
      </div>

      {/* Findings list */}
      <div className="findings-table-wrap">
        {openFindings.map((f) => {
          const kpi = kpis.find((k) => k.id === f.kpi);
          return (
            <div key={f.id} className="finding-row" onClick={() => kpi && onOpenKpi(kpi.id)}>
              <div className="fr-sev-bar" style={{ background: SEVERITY_COLOR[f.severity] }} />
              <div className="fr-body">
                <div className="fr-head">
                  <span
                    className="severity-badge"
                    style={{ background: SEVERITY_BG[f.severity], color: SEVERITY_COLOR[f.severity] }}
                  >
                    {f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}
                  </span>
                  {kpi && <AreaTag areaId={kpi.area} />}
                  {kpi && <span className="kpi-code">{kpi.code}</span>}
                  <span className={`finding-status-badge finding-status-${f.status}`}>
                    {f.status === "offen" ? "Offen" : f.status === "in_bearbeitung" ? "In Bearbeitung" : "Geschlossen"}
                  </span>
                </div>
                <div className="fr-title">{f.title}</div>
                <div className="fr-desc">{f.desc}</div>
                <div className="fr-meta">
                  <span>Owner: {f.owner}</span>
                  <span>·</span>
                  <span>Fällig: <strong>{f.due}</strong></span>
                  <span>·</span>
                  <span>Eröffnet: {f.opened}</span>
                </div>
              </div>
              <div className="fr-arrow">→</div>
            </div>
          );
        })}

        {openFindings.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-3)", fontSize: "0.875rem" }}>
            Keine offenen Findings
          </div>
        )}
      </div>
    </div>
  );
}
