"use client";
import { useState, useEffect, useRef } from "react";
import type { Kpi } from "@/types";
import { AREAS, QUARTERS, CURRENT_QUARTER } from "@/data/audit-data";
import { exportKpisExcel } from "@/lib/export";
import { StatusPill, StatusDot } from "@/components/ui/StatusDot";
import { Sparkline } from "@/components/ui/Sparkline";
import { RiskBars } from "@/components/ui/RiskBars";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";
import { StatusDonut, QuarterlyTrend, RiskDistribution, ConfidenceGauge } from "@/components/ui/Charts";

const STATUS_ORDER = ["finding", "review", "running", "pending", "ok"];

// ── Animated counter ─────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

// ── Hero ─────────────────────────────────────────────────────

function HeroStats({ kpis }: { kpis: Kpi[] }) {
  const total = kpis.length;
  const findings = kpis.filter((k) => k.status === "finding").length;
  const review = kpis.filter((k) => k.status === "review").length;
  const ok = kpis.filter((k) => k.status === "ok").length;
  const running = kpis.filter((k) => k.status === "running").length;
  const confKpis = kpis.filter((k) => k.confidence > 0);
  const avgConf = confKpis.length > 0
    ? confKpis.reduce((s, k) => s + k.confidence, 0) / confKpis.length : 0;

  const animFindings = useCountUp(findings);
  const animReview = useCountUp(review);
  const animOk = useCountUp(ok);
  const animTotal = useCountUp(total);
  const animConf = useCountUp(Math.round(avgConf * 100));
  const conformPct = total > 0 ? Math.round((ok / total) * 100) : 0;
  const ringPct = useCountUp(conformPct);
  const r = 50;
  const circ = 2 * Math.PI * r;

  return (
    <div className="hero">
      <div className="hero-l">
        <div className="hero-eyebrow">
          <span className="hero-pulse-dot" />
          Continuous Auditing · {CURRENT_QUARTER}
        </div>
        <h1 className="hero-title">
          {findings > 0 ? (
            <><span className="hero-title-num hero-title-alert">{animFindings}</span> offene Findings</>
          ) : (
            <>Alle <span className="hero-title-num hero-title-ok">{animOk}</span> KPIs konform</>
          )}
        </h1>
        <p className="hero-sub">
          {review} in Prüfung · {running} Agent{running !== 1 ? "en" : ""} aktiv · Ø {animConf}% KI-Konfidenz
        </p>
        <div className="hero-stats">
          <div className="stat-tile">
            <div className="stat-tile-val">{animTotal}</div>
            <div className="stat-tile-label">KPIs gesamt</div>
          </div>
          <div className="stat-tile stat-tile-danger">
            <div className="stat-tile-val">{animFindings}</div>
            <div className="stat-tile-label">Befunde offen</div>
          </div>
          <div className="stat-tile stat-tile-warn">
            <div className="stat-tile-val">{animReview}</div>
            <div className="stat-tile-label">In Prüfung</div>
          </div>
          <div className="stat-tile stat-tile-ok">
            <div className="stat-tile-val">{animOk}</div>
            <div className="stat-tile-label">Konform</div>
          </div>
        </div>
      </div>
      <div className="hero-r">
        <div className="hero-ring-wrap">
          <svg viewBox="0 0 120 120" width="128" height="128" className="hero-ring">
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="10"
              strokeDasharray={`${(ringPct / 100) * circ} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray 0.05s linear" }}
            />
          </svg>
          <div className="hero-ring-label">
            <div className="hero-ring-pct">{ringPct}%</div>
            <div className="hero-ring-sub">konform</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Charts row ───────────────────────────────────────────────

function ChartsRow({ kpis }: { kpis: Kpi[] }) {
  const total = kpis.length;
  if (total === 0) return null;

  // Status donut data
  const statusData = (["ok", "review", "finding", "running", "pending"] as const)
    .map((s) => ({ status: s, count: kpis.filter((k) => k.status === s).length }))
    .filter((d) => d.count > 0);

  // Quarterly trend — derive from KPI trend arrays
  const trendData = QUARTERS.map((q, qi) => {
    // Simulate historical status based on trend direction
    const okNow = kpis.filter((k) => k.status === "ok").length;
    const findingNow = kpis.filter((k) => k.status === "finding").length;
    const reviewNow = kpis.filter((k) => k.status === "review").length;
    const progress = qi / (QUARTERS.length - 1);
    return {
      quarter: q.replace("Q", "Q"),
      ok: Math.max(0, Math.round(okNow * (0.55 + 0.45 * progress))),
      review: Math.round(reviewNow * (1.3 - 0.3 * progress)),
      finding: Math.max(0, Math.round(findingNow * (1.6 - 0.6 * progress))),
    };
  });

  // Risk distribution
  const riskColors = ["", "#94a3b8", "#3b82f6", "#f59e0b", "#ef4444", "#dc2626"];
  const riskLabels = ["", "1 – Minimal", "2 – Niedrig", "3 – Mittel", "4 – Hoch", "5 – Kritisch"];
  const riskData = [1, 2, 3, 4, 5].map((r) => ({
    level: `R${r}`,
    count: kpis.filter((k) => k.risk === r).length,
    color: riskColors[r],
  })).filter((d) => d.count > 0);

  // Avg confidence
  const confKpis = kpis.filter((k) => k.confidence > 0);
  const avgConf = confKpis.length > 0
    ? confKpis.reduce((s, k) => s + k.confidence, 0) / confKpis.length : 0;

  return (
    <div className="charts-row">
      <StatusDonut data={statusData} />
      <QuarterlyTrend data={trendData} />
      <RiskDistribution data={riskData} />
      <ConfidenceGauge value={avgConf} label={`${confKpis.length} geprüfte KPIs`} />
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────

type QuickAction = "agent" | "finding" | "task";

function KpiCard({ kpi, onClick, onQuickAction }: {
  kpi: Kpi;
  onClick: () => void;
  onQuickAction?: (kpiId: string, action: QuickAction) => void;
}) {
  return (
    <div
      className={`kpi-card kpi-card-${kpi.status}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
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
        <div className={`kpi-card-delta${kpi.delta.startsWith("+") ? " delta-up" : kpi.delta.startsWith("−") || kpi.delta.startsWith("-") ? " delta-down" : ""}`}>
          {kpi.delta}
        </div>
      </div>
      <div className="kpi-card-foot">
        <div className="kpi-card-foot-l">
          <RiskBars risk={kpi.risk} />
          <Confidence value={kpi.confidence} />
        </div>
        <Sparkline data={kpi.trend} status={kpi.status} width={80} height={24} />
      </div>
      {kpi.status === "running" && <div className="kpi-card-running-bar" />}

      {/* Quick action overlay — visible on hover */}
      {onQuickAction && (
        <div className="kpi-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="kpi-qa-btn"
            title="KI-Agent starten"
            onClick={() => onQuickAction(kpi.id, "agent")}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
              <polygon points="5,3 19,12 5,21" fill="currentColor"/>
            </svg>
            Agent
          </button>
          <button
            className="kpi-qa-btn kpi-qa-btn-warn"
            title="Finding anlegen"
            onClick={() => onQuickAction(kpi.id, "finding")}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Finding
          </button>
          <button
            className="kpi-qa-btn kpi-qa-btn-info"
            title="Aufgabe erstellen"
            onClick={() => onQuickAction(kpi.id, "task")}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Aufgabe
          </button>
        </div>
      )}
    </div>
  );
}

// ── Area section ─────────────────────────────────────────────

function AreaSection({ area, kpis, onOpenKpi, onQuickAction }: {
  area: typeof AREAS[0];
  kpis: Kpi[];
  onOpenKpi: (id: string) => void;
  onQuickAction?: (kpiId: string, action: QuickAction) => void;
}) {
  const sorted = [...kpis].sort((a, b) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );
  const findings = kpis.filter((k) => k.status === "finding").length;
  const review = kpis.filter((k) => k.status === "review").length;
  const ok = kpis.filter((k) => k.status === "ok").length;

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
          {review > 0 && <span className="area-badge-review">{review} Review</span>}
          {findings === 0 && review === 0 && <span className="area-badge-ok">✓ {ok} konform</span>}
        </div>
      </div>
      <div className="kpi-grid">
        {sorted.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} onClick={() => onOpenKpi(kpi.id)} onQuickAction={onQuickAction} />
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────

export function Dashboard({
  kpis,
  onOpenKpi,
  filterArea,
  setFilterArea,
  filterStatus,
  setFilterStatus,
  onQuickAction,
}: {
  kpis: Kpi[];
  onOpenKpi: (id: string) => void;
  filterArea: string;
  setFilterArea: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  onQuickAction?: (kpiId: string, action: QuickAction) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [visibleCount, setVisibleCount] = useState(3); // show N area groups initially

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const q = search.trim().toLowerCase();

  const filtered = kpis.filter((k) => {
    if (filterArea !== "all" && k.area !== filterArea) return false;
    if (filterStatus !== "all" && k.status !== filterStatus) return false;
    if (filterRisk !== "all" && String(k.risk) !== filterRisk) return false;
    if (q) {
      const haystack = `${k.code} ${k.title} ${k.areaName ?? ""} ${k.agent}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const areaGroups = AREAS.map((area) => ({
    area,
    kpis: filtered.filter((k) => k.area === area.id),
  })).filter((g) => g.kpis.length > 0);

  const isFiltered = q || filterArea !== "all" || filterStatus !== "all" || filterRisk !== "all";

  function clearAll() {
    setSearch("");
    setFilterArea("all");
    setFilterStatus("all");
    setFilterRisk("all");
    setVisibleCount(3);
  }

  const STATUS_FILTER_ITEMS = [
    { id: "all", label: "Alle" },
    { id: "finding", label: "Befund" },
    { id: "review", label: "In Prüfung" },
    { id: "running", label: "Läuft" },
    { id: "pending", label: "Ausstehend" },
    { id: "ok", label: "Konform" },
  ];

  const RISK_ITEMS = [
    { id: "all", label: "Alle" },
    { id: "5", label: "R5 Kritisch", color: "#dc2626" },
    { id: "4", label: "R4 Hoch",     color: "#ef4444" },
    { id: "3", label: "R3 Mittel",   color: "#f59e0b" },
    { id: "2", label: "R2 Niedrig",  color: "#3b82f6" },
    { id: "1", label: "R1 Minimal",  color: "#94a3b8" },
  ];

  return (
    <div className={`dashboard-wrap${mounted ? " dashboard-mounted" : ""}`}>
      <HeroStats kpis={kpis} />

      {/* Insights charts */}
      <ChartsRow kpis={kpis} />

      {/* Search + Filter bar */}
      <div className="filterbar">
        {/* Search */}
        <div className="filterbar-search">
          <svg className="filterbar-search-icon" viewBox="0 0 24 24" width="15" height="15" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="filterbar-search-input"
            type="text"
            placeholder="KPI-Code, Titel oder Bereich suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="filterbar-search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        {/* Export + clear */}
        <div className="filterbar-r" style={{ marginLeft: "auto", gap: 8, display: "flex", alignItems: "center" }}>
          {isFiltered && (
            <button className="chip chip-clear" onClick={clearAll} title="Alle Filter zurücksetzen">
              Filter zurücksetzen
            </button>
          )}
          <button className="btn-export" onClick={() => exportKpisExcel(filtered)} title="Gefilterte KPIs als Excel exportieren">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path d="M12 3v12M8 11l4 4 4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Excel
          </button>
        </div>

        <div className="filterbar-l">
          <span className="filter-label">Bereich</span>
          <div className="filter-chips">
            <button className={`chip${filterArea === "all" ? " chip-active" : ""}`} onClick={() => setFilterArea("all")}>Alle</button>
            {AREAS.map((a) => (
              <button
                key={a.id}
                className={`chip${filterArea === a.id ? " chip-active" : ""}`}
                style={filterArea === a.id ? { "--chip-color": a.color } as React.CSSProperties : undefined}
                onClick={() => setFilterArea(a.id)}
              >
                {a.short}
              </button>
            ))}
          </div>
        </div>

        <div className="filterbar-r">
          <span className="filter-label">Status</span>
          <div className="filter-chips">
            {STATUS_FILTER_ITEMS.map((s) => (
              <button
                key={s.id}
                className={`chip${filterStatus === s.id ? ` chip-active chip-status-${s.id}` : ""}`}
                onClick={() => setFilterStatus(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filterbar-r">
          <span className="filter-label">Risiko</span>
          <div className="filter-chips">
            {RISK_ITEMS.map((r) => (
              <button
                key={r.id}
                className={`chip${filterRisk === r.id ? " chip-active" : ""}`}
                style={filterRisk === r.id && r.color ? { "--chip-color": r.color } as React.CSSProperties : undefined}
                onClick={() => setFilterRisk(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count when filtering */}
      {isFiltered && (
        <div className="filterbar-result-count">
          {filtered.length} KPI{filtered.length !== 1 ? "s" : ""} gefunden
          {q && <span className="filterbar-result-query"> für „{q}"</span>}
        </div>
      )}

      {/* KPI areas with pagination */}
      <div className="areas">
        {areaGroups.slice(0, visibleCount).map(({ area, kpis: aKpis }) => (
          <AreaSection key={area.id} area={area} kpis={aKpis} onOpenKpi={onOpenKpi} onQuickAction={onQuickAction} />
        ))}
        {areaGroups.length > visibleCount && (
          <div className="dashboard-load-more">
            <button
              className="btn btn-ghost"
              onClick={() => setVisibleCount((c) => c + 3)}
            >
              Weitere {Math.min(3, areaGroups.length - visibleCount)} Bereiche anzeigen
              <span className="dashboard-load-more-count">
                ({visibleCount} von {areaGroups.length})
              </span>
            </button>
          </div>
        )}
        {areaGroups.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Keine Kennzahlen gefunden</div>
            <div className="empty-state-sub">
              {isFiltered ? (
                <><span>Filter anpassen oder </span><button className="link-btn" onClick={clearAll}>alle zurücksetzen</button></>
              ) : "Keine KPIs vorhanden."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
