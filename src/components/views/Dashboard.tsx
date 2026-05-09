"use client";
import type { Kpi } from "@/types";
import { AREAS, KPIS, QUARTERS, CURRENT_QUARTER } from "@/data/audit-data";
import { StatusPill, StatusDot } from "@/components/ui/StatusDot";
import { Sparkline } from "@/components/ui/Sparkline";
import { RiskBars } from "@/components/ui/RiskBars";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";

const STATUS_ORDER = ["finding", "review", "running", "pending", "ok"];

function HeroStats({ kpis }: { kpis: Kpi[] }) {
  const total = kpis.length;
  const findings = kpis.filter((k) => k.status === "finding").length;
  const review = kpis.filter((k) => k.status === "review").length;
  const ok = kpis.filter((k) => k.status === "ok").length;
  const running = kpis.filter((k) => k.status === "running").length;
  const avgConf = kpis.filter((k) => k.confidence > 0).reduce((s, k) => s + k.confidence, 0) /
    Math.max(kpis.filter((k) => k.confidence > 0).length, 1);

  return (
    <div className="hero">
      <div className="hero-l">
        <div className="hero-eyebrow">Continuous Auditing · {CURRENT_QUARTER}</div>
        <h1 className="hero-title">
          {findings > 0 ? (
            <><span className="hero-title-num">{findings}</span> offene Findings</>
          ) : (
            <>Alle {ok} Kennzahlen konform</>
          )}
        </h1>
        <p className="hero-sub">
          {review} in Prüfung · {running} Agent{running !== 1 ? "en" : ""} laufend · Ø {Math.round(avgConf * 100)}% KI-Konfidenz
        </p>
        <div className="hero-stats">
          <div className="stat-tile">
            <div className="stat-tile-val">{total}</div>
            <div className="stat-tile-label">Kennzahlen gesamt</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-val stat-tile-alert">{findings}</div>
            <div className="stat-tile-label">Findings offen</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-val stat-tile-warn">{review}</div>
            <div className="stat-tile-label">In Prüfung</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-val stat-tile-ok">{ok}</div>
            <div className="stat-tile-label">Konform</div>
          </div>
        </div>
      </div>
      <div className="hero-r">
        <div className="hero-ring-wrap">
          <svg viewBox="0 0 120 120" width="120" height="120" className="hero-ring">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="10"
              strokeDasharray={`${(ok / total) * 314} 314`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="hero-ring-label">
            <div className="hero-ring-pct">{Math.round((ok / total) * 100)}%</div>
            <div className="hero-ring-sub">konform</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ kpi, onClick }: { kpi: Kpi; onClick: () => void }) {
  return (
    <div className={`kpi-card kpi-card-${kpi.status}`} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className="kpi-card-head">
        <div className="kpi-card-meta">
          <AreaTag areaId={kpi.area} />
          <span className="kpi-code">{kpi.code}</span>
        </div>
        <StatusPill status={kpi.status} />
      </div>
      <div className="kpi-card-title">{kpi.title}</div>
      <div className="kpi-card-row">
        <div className="kpi-card-value">{kpi.value}</div>
        <div className="kpi-card-delta">{kpi.delta}</div>
      </div>
      <div className="kpi-card-foot">
        <div className="kpi-card-foot-l">
          <RiskBars risk={kpi.risk} />
          <Confidence value={kpi.confidence} />
        </div>
        <Sparkline data={kpi.trend} status={kpi.status} width={80} height={24} />
      </div>
    </div>
  );
}

function AreaSection({ area, kpis, onOpenKpi }: {
  area: typeof AREAS[0];
  kpis: Kpi[];
  onOpenKpi: (id: string) => void;
}) {
  const sorted = [...kpis].sort((a, b) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );
  const findings = kpis.filter((k) => k.status === "finding").length;
  const review = kpis.filter((k) => k.status === "review").length;

  return (
    <div className="area-section">
      <div className="area-header">
        <div className="area-header-l">
          <span className="area-badge" style={{ background: area.color }}>{area.short}</span>
          <span className="area-name">{area.name}</span>
          <span className="area-count">{kpis.length} KPIs</span>
        </div>
        <div className="area-header-r">
          {findings > 0 && <span className="area-badge-finding">{findings} Finding{findings > 1 ? "s" : ""}</span>}
          {review > 0 && <span className="area-badge-review">{review} in Prüfung</span>}
        </div>
      </div>
      <div className="kpi-grid">
        {sorted.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} onClick={() => onOpenKpi(kpi.id)} />
        ))}
      </div>
    </div>
  );
}

export function Dashboard({
  kpis,
  onOpenKpi,
  filterArea,
  setFilterArea,
  filterStatus,
  setFilterStatus,
}: {
  kpis: Kpi[];
  onOpenKpi: (id: string) => void;
  filterArea: string;
  setFilterArea: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
}) {
  const filtered = kpis.filter((k) => {
    if (filterArea !== "all" && k.area !== filterArea) return false;
    if (filterStatus !== "all" && k.status !== filterStatus) return false;
    return true;
  });

  const areaGroups = AREAS.map((area) => ({
    area,
    kpis: filtered.filter((k) => k.area === area.id),
  })).filter((g) => g.kpis.length > 0);

  return (
    <>
      <HeroStats kpis={kpis} />

      {/* Filter bar */}
      <div className="filterbar">
        <div className="filterbar-l">
          <span className="filter-label">Bereich</span>
          <div className="filter-chips">
            <button className={`chip${filterArea === "all" ? " chip-active" : ""}`} onClick={() => setFilterArea("all")}>Alle</button>
            {AREAS.map((a) => (
              <button key={a.id} className={`chip${filterArea === a.id ? " chip-active" : ""}`}
                style={filterArea === a.id ? { "--chip-color": a.color } as React.CSSProperties : undefined}
                onClick={() => setFilterArea(a.id)}>
                {a.short}
              </button>
            ))}
          </div>
        </div>
        <div className="filterbar-r">
          <span className="filter-label">Status</span>
          <div className="filter-chips">
            {["all", "finding", "review", "running", "pending", "ok"].map((s) => (
              <button key={s} className={`chip${filterStatus === s ? " chip-active chip-status-" + s : ""}`}
                onClick={() => setFilterStatus(s)}>
                {s === "all" ? "Alle" : s === "finding" ? "Befund" : s === "review" ? "In Prüfung" :
                 s === "running" ? "Läuft" : s === "pending" ? "Offen" : "Konform"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Areas */}
      <div className="areas">
        {areaGroups.map(({ area, kpis: aKpis }) => (
          <AreaSection key={area.id} area={area} kpis={aKpis} onOpenKpi={onOpenKpi} />
        ))}
        {areaGroups.length === 0 && (
          <div className="empty-state">Keine Kennzahlen für diese Filterauswahl.</div>
        )}
      </div>
    </>
  );
}
