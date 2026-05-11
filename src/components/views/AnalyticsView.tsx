"use client";

import type { Kpi, Finding } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = {
  finding: 4,
  review:  3,
  running: 2,
  pending: 1,
  ok:      0,
};

function avgRisk(kpis: Kpi[]): number {
  if (kpis.length === 0) return 0;
  return kpis.reduce((s, k) => s + k.risk, 0) / kpis.length;
}

function avgConf(kpis: Kpi[]): number {
  const active = kpis.filter((k) => k.confidence > 0);
  if (active.length === 0) return 0;
  return active.reduce((s, k) => s + k.confidence, 0) / active.length;
}

function riskColor(risk: number): string {
  if (risk >= 4.5) return "var(--alert)";
  if (risk >= 3.5) return "var(--alert)";
  if (risk >= 2.5) return "var(--warn)";
  return "var(--ok)";
}

function confColor(conf: number): string {
  if (conf >= 0.8) return "var(--ok-fg)";
  if (conf >= 0.6) return "var(--warn-fg)";
  return "var(--alert-fg)";
}

function confBg(conf: number): string {
  if (conf >= 0.8) return "var(--ok-bg)";
  if (conf >= 0.6) return "var(--warn-bg)";
  return "var(--alert-bg)";
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ── SVG Radar Chart ───────────────────────────────────────────

interface RadarArea {
  name: string;
  short: string;
  color: string;
  value: number; // 0-5
}

function radarPoint(cx: number, cy: number, r: number, angle: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function RadarChart({ areas }: { areas: RadarArea[] }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const n = areas.length;
  if (n === 0) return null;

  const step = 360 / n;

  // Grid polygons at r = 1..5
  const gridLevels = [1, 2, 3, 4, 5];

  function polyPoints(r: number): string {
    return Array.from({ length: n }, (_, i) => {
      const [x, y] = radarPoint(cx, cy, (r / 5) * maxR, i * step);
      return `${x},${y}`;
    }).join(" ");
  }

  const dataPoints = areas.map((a, i) => {
    const [x, y] = radarPoint(cx, cy, (Math.min(a.value, 5) / 5) * maxR, i * step);
    return `${x},${y}`;
  });

  const labelPad = 22;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Risiko-Radar">
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={polyPoints(level)}
          fill="none"
          stroke="var(--line)"
          strokeWidth={level === 5 ? 1.5 : 0.8}
          strokeDasharray={level < 5 ? "3 3" : undefined}
        />
      ))}

      {/* Axis spokes */}
      {areas.map((_, i) => {
        const [x, y] = radarPoint(cx, cy, maxR, i * step);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--line)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoints.join(" ")}
        fill="rgba(41,82,255,0.18)"
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {areas.map((a, i) => {
        const [x, y] = radarPoint(cx, cy, (Math.min(a.value, 5) / 5) * maxR, i * step);
        return (
          <circle key={i} cx={x} cy={y} r={4} fill="var(--brand)" stroke="var(--surface)" strokeWidth={1.5} />
        );
      })}

      {/* Labels */}
      {areas.map((a, i) => {
        const [x, y] = radarPoint(cx, cy, maxR + labelPad, i * step);
        const anchor = x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";
        return (
          <g key={i}>
            <text
              x={x}
              y={y - 5}
              textAnchor={anchor}
              fontSize={11}
              fontWeight={700}
              fill="var(--ink)"
            >
              {a.short}
            </text>
            <text
              x={x}
              y={y + 9}
              textAnchor={anchor}
              fontSize={10}
              fill="var(--ink-3)"
            >
              Ø {a.value.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Center grid labels */}
      {gridLevels.map((level) => (
        <text
          key={level}
          x={cx + 3}
          y={cy - (level / 5) * maxR + 4}
          fontSize={8}
          fill="var(--ink-4)"
        >
          {level}
        </text>
      ))}
    </svg>
  );
}

// ── Risk Squares ──────────────────────────────────────────────

function RiskSquares({ risk }: { risk: number }) {
  const colors = ["var(--ok)", "var(--ok)", "var(--warn)", "var(--alert)", "var(--alert)"];
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: i <= risk ? colors[risk - 1] : "var(--line)",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  finding: "Befund",
  review:  "Prüfung",
  running: "Läuft",
  pending: "Ausstehend",
  ok:      "Konform",
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  finding: { background: "var(--alert-bg)", color: "var(--alert-fg)" },
  review:  { background: "var(--warn-bg)",  color: "var(--warn-fg)" },
  running: { background: "var(--info-bg)",  color: "var(--info-fg)" },
  pending: { background: "var(--muted-bg)", color: "var(--muted-fg)" },
  ok:      { background: "var(--ok-bg)",    color: "var(--ok-fg)" },
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 9px",
        borderRadius: "var(--r-pill)",
        display: "inline-block",
        ...STATUS_STYLE[status],
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────

export function AnalyticsView({ kpis, findings }: { kpis: Kpi[]; findings: Finding[] }) {
  // ── Summary stats ──
  const total = kpis.length;
  const weightedRisk = total > 0 ? kpis.reduce((s, k) => s + k.risk, 0) / total : 0;
  const avgConfidence = avgConf(kpis);
  const openFindings = findings.filter(
    (f) => f.status === "offen" || f.status === "in_bearbeitung"
  ).length;
  const okCount = kpis.filter((k) => k.status === "ok").length;
  const progressPct = total > 0 ? Math.round((okCount / total) * 100) : 0;

  // ── Area grouping ──
  type AreaGroup = {
    id: string;
    name: string;
    short: string;
    color: string;
    kpis: Kpi[];
  };

  const areaMap = new Map<string, AreaGroup>();
  for (const k of kpis) {
    const id = k.area;
    if (!areaMap.has(id)) {
      areaMap.set(id, {
        id,
        name:  k.areaName  ?? id,
        short: k.areaShort ?? id.toUpperCase().slice(0, 3),
        color: k.areaColor ?? "var(--brand)",
        kpis:  [],
      });
    }
    areaMap.get(id)!.kpis.push(k);
  }
  const areas = Array.from(areaMap.values());

  // ── Radar data ──
  const radarAreas: RadarArea[] = areas.map((a) => ({
    name:  a.name,
    short: a.short,
    color: a.color,
    value: avgRisk(a.kpis),
  }));

  // ── Risk ranking (top 20 by risk desc, then status desc) ──
  const rankedKpis = [...kpis]
    .sort((a, b) => {
      if (b.risk !== a.risk) return b.risk - a.risk;
      return (STATUS_ORDER[b.status] ?? 0) - (STATUS_ORDER[a.status] ?? 0);
    })
    .slice(0, 20);

  // ── Confidence by area (for bar chart) ──
  const areaConf = areas
    .map((a) => ({ ...a, conf: avgConf(a.kpis) }))
    .sort((a, b) => b.conf - a.conf);

  // ── Top findings per area ──
  const findingsBySeverity: Record<string, number> = { hoch: 3, mittel: 2, niedrig: 1 };
  function topSeverityForArea(areaId: string): string | null {
    const rel = findings
      .filter((f) => {
        const kpi = kpis.find((k) => k.id === f.kpi || k.code === f.kpiCode);
        return kpi?.area === areaId && (f.status === "offen" || f.status === "in_bearbeitung");
      })
      .sort((a, b) => (findingsBySeverity[b.severity] ?? 0) - (findingsBySeverity[a.severity] ?? 0));
    return rel[0]?.severity ?? null;
  }

  const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
    hoch:     { background: "var(--alert-bg)", color: "var(--alert-fg)" },
    mittel:   { background: "var(--warn-bg)",  color: "var(--warn-fg)" },
    niedrig:  { background: "var(--ok-bg)",    color: "var(--ok-fg)" },
  };
  const SEVERITY_LABEL: Record<string, string> = {
    hoch: "Hoch", mittel: "Mittel", niedrig: "Niedrig",
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* ── Header ── */}
      <div className="view-header">
        <h2 className="view-title">Analytics &amp; Risikoanalyse</h2>
        <p className="view-sub">
          {total} KPIs &middot; Ø Konfidenz {Math.round(avgConfidence * 100)}% &middot;{" "}
          {openFindings} offene Finding{openFindings !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Gesamt-Risikoscore */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Gesamt-Risikoscore
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: riskColor(weightedRisk), lineHeight: 1 }}>
            {weightedRisk.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>Gewichteter Ø (R1–R5)</div>
        </div>

        {/* Ø KI-Konfidenz */}
        <div
          style={{
            background: confBg(avgConfidence),
            border: `1px solid var(--line)`,
            borderRadius: "var(--r-lg)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Ø KI-Konfidenz
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: confColor(avgConfidence), lineHeight: 1 }}>
            {Math.round(avgConfidence * 100)}%
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>
            {avgConfidence >= 0.8 ? "Hoch – verlässlich" : avgConfidence >= 0.6 ? "Mittel – prüfen" : "Niedrig – Handlung erforderlich"}
          </div>
        </div>

        {/* Offene Findings */}
        <div
          style={{
            background: openFindings > 0 ? "var(--alert-bg)" : "var(--ok-bg)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Offene Findings
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: openFindings > 0 ? "var(--alert-fg)" : "var(--ok-fg)", lineHeight: 1 }}>
            {openFindings}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>
            {findings.length} gesamt &middot; {findings.filter((f) => f.status === "geschlossen").length} geschlossen
          </div>
        </div>

        {/* Prüffortschritt */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Prüffortschritt
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: progressPct >= 80 ? "var(--ok-fg)" : "var(--warn-fg)", lineHeight: 1 }}>
            {progressPct}%
          </div>
          <div style={{ marginTop: 10, background: "var(--line)", borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: progressPct >= 80 ? "var(--ok)" : "var(--warn)", borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>
            {okCount} von {total} KPIs konform
          </div>
        </div>
      </div>

      {/* ── Main 2-column: Radar + Area Health ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: 24,
          marginBottom: 32,
          alignItems: "start",
        }}
      >
        {/* Radar Chart */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
            Risiko-Radar
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 16 }}>
            Ø Risikoscore je Prüfbereich (R1–R5)
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart areas={radarAreas} />
          </div>
        </div>

        {/* Area Health Grid */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
            Bereichs-Übersicht
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 16 }}>
            Status und Konfidenz je Prüfbereich
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {areas.map((area) => {
              const counts = {
                ok:      area.kpis.filter((k) => k.status === "ok").length,
                review:  area.kpis.filter((k) => k.status === "review").length,
                finding: area.kpis.filter((k) => k.status === "finding").length,
                pending: area.kpis.filter((k) => k.status === "pending" || k.status === "running").length,
              };
              const t = area.kpis.length;
              const conf = avgConf(area.kpis);
              const topSev = topSeverityForArea(area.id);

              return (
                <div
                  key={area.id}
                  style={{
                    background: "var(--surface-3)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-md)",
                    padding: "12px 16px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "8px 16px",
                    alignItems: "center",
                  }}
                >
                  {/* Left: area name + bar */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: area.color,
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{area.name}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{t} KPI{t !== 1 ? "s" : ""}</span>
                      {topSev && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 7px",
                            borderRadius: "var(--r-pill)",
                            marginLeft: "auto",
                            ...SEVERITY_STYLE[topSev],
                          }}
                        >
                          {SEVERITY_LABEL[topSev]}
                        </span>
                      )}
                    </div>
                    {/* Stacked status bar */}
                    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--line)" }}>
                      {counts.finding > 0 && (
                        <div
                          style={{ width: `${(counts.finding / t) * 100}%`, background: "var(--alert)", flexShrink: 0 }}
                          title={`${counts.finding} Befund`}
                        />
                      )}
                      {counts.review > 0 && (
                        <div
                          style={{ width: `${(counts.review / t) * 100}%`, background: "var(--warn)", flexShrink: 0 }}
                          title={`${counts.review} in Prüfung`}
                        />
                      )}
                      {counts.ok > 0 && (
                        <div
                          style={{ width: `${(counts.ok / t) * 100}%`, background: "var(--ok)", flexShrink: 0 }}
                          title={`${counts.ok} konform`}
                        />
                      )}
                      {counts.pending > 0 && (
                        <div
                          style={{ width: `${(counts.pending / t) * 100}%`, background: "var(--muted)", flexShrink: 0 }}
                          title={`${counts.pending} ausstehend`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: confidence */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: confColor(conf),
                      }}
                    >
                      {conf > 0 ? `${Math.round(conf * 100)}%` : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ink-4)" }}>Konfidenz</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Risk Ranking Table ── */}
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
          marginBottom: 32,
          overflowX: "auto",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
          Risiko-Ranking
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 20 }}>
          Top {Math.min(20, kpis.length)} KPIs nach Risikopriorität
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Code", "KPI-Titel", "Bereich", "Risiko", "Status", "Konfidenz", "Letzter Lauf"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ink-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "0 12px 10px 0",
                    borderBottom: "1px solid var(--line)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rankedKpis.map((kpi, idx) => {
              const isFinding = kpi.status === "finding";
              const areaGroup = areaMap.get(kpi.area);
              const conf = kpi.confidence;

              return (
                <tr
                  key={kpi.id}
                  style={{
                    borderLeft: isFinding ? "3px solid var(--alert)" : "3px solid transparent",
                    background: idx % 2 === 0 ? "transparent" : "var(--surface-3)",
                  }}
                >
                  {/* Code */}
                  <td
                    style={{
                      padding: "10px 12px 10px 10px",
                      borderBottom: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--brand)",
                      }}
                    >
                      {kpi.code}
                    </span>
                  </td>

                  {/* Title */}
                  <td
                    style={{
                      padding: "10px 12px 10px 0",
                      borderBottom: "1px solid var(--line)",
                      maxWidth: 240,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 240,
                      }}
                      title={kpi.title}
                    >
                      {kpi.title}
                    </div>
                  </td>

                  {/* Bereich */}
                  <td
                    style={{
                      padding: "10px 12px 10px 0",
                      borderBottom: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: areaGroup?.color ?? "var(--muted)",
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "var(--ink-2)", fontSize: 11 }}>
                        {areaGroup?.short ?? kpi.area.toUpperCase().slice(0, 3)}
                      </span>
                    </div>
                  </td>

                  {/* Risiko */}
                  <td
                    style={{
                      padding: "10px 12px 10px 0",
                      borderBottom: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <RiskSquares risk={kpi.risk} />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: riskColor(kpi.risk),
                        }}
                      >
                        R{kpi.risk}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td
                    style={{
                      padding: "10px 12px 10px 0",
                      borderBottom: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <StatusPill status={kpi.status} />
                  </td>

                  {/* Konfidenz */}
                  <td
                    style={{
                      padding: "10px 12px 10px 0",
                      borderBottom: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conf > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: 48,
                            height: 5,
                            borderRadius: 3,
                            background: "var(--line)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.round(conf * 100)}%`,
                              height: "100%",
                              background: confColor(conf).replace("-fg", "").replace("var(--ok-fg)", "var(--ok)").replace("var(--warn-fg)", "var(--warn)").replace("var(--alert-fg)", "var(--alert)"),
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: confColor(conf) }}>
                          {Math.round(conf * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--ink-4)", fontSize: 11 }}>läuft…</span>
                    )}
                  </td>

                  {/* Letzter Lauf */}
                  <td
                    style={{
                      padding: "10px 0 10px 0",
                      borderBottom: "1px solid var(--line)",
                      color: "var(--ink-3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {kpi.lastRun}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Confidence by Area Bar Chart ── */}
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
          KI-Konfidenz nach Bereich
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 20 }}>
          Durchschnittliche Modell-Konfidenz je Prüfbereich, absteigend sortiert
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {areaConf.map((area) => {
            const pct = Math.round(area.conf * 100);
            return (
              <div key={area.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 48px", alignItems: "center", gap: 12 }}>
                {/* Label */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: area.color,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {area.name}
                  </span>
                </div>

                {/* Bar */}
                <div
                  style={{
                    height: 12,
                    background: "var(--line)",
                    borderRadius: 6,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: area.conf > 0 ? `${pct}%` : "0%",
                      height: "100%",
                      background: area.conf >= 0.8 ? "var(--ok)" : area.conf >= 0.6 ? "var(--warn)" : "var(--alert)",
                      borderRadius: 6,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                {/* Value */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "right",
                    color: area.conf > 0 ? confColor(area.conf) : "var(--ink-4)",
                  }}
                >
                  {area.conf > 0 ? `${pct}%` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
