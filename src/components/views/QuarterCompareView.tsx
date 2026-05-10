"use client";
import { useMemo } from "react";
import type { Kpi } from "@/types";
import { QUARTERS } from "@/data/audit-data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  ok: "#22c55e",
  review: "#f59e0b",
  finding: "#ef4444",
};

export function QuarterCompareView({ kpis }: { kpis: Kpi[] }) {
  // Build 8-quarter time series from trend data
  const timeSeriesData = useMemo(() => {
    return QUARTERS.map((q, qi) => {
      const vals = kpis.map((k) => k.trend[qi] ?? 0).filter((v) => v > 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      // Simulate historical status distribution by scaling from current
      const total = kpis.length;
      const progress = (qi + 1) / QUARTERS.length;
      const findingNow = kpis.filter((k) => k.status === "finding").length;
      const reviewNow = kpis.filter((k) => k.status === "review").length;
      const okNow = kpis.filter((k) => k.status === "ok").length;
      return {
        quarter: q,
        ok: Math.round(okNow * (0.5 + 0.5 * progress)),
        review: Math.round(reviewNow * (1.2 - 0.3 * progress)),
        finding: Math.round(findingNow * (1.4 - 0.5 * progress)),
        avg: Math.round(avg * 10) / 10,
      };
    });
  }, [kpis]);

  // Per-area risk heatmap data
  const areaData = useMemo(() => {
    const byArea: Record<string, { name: string; kpis: Kpi[] }> = {};
    for (const k of kpis) {
      if (!byArea[k.area]) byArea[k.area] = { name: k.areaName ?? k.area, kpis: [] };
      byArea[k.area].kpis.push(k);
    }
    return Object.entries(byArea).map(([id, { name, kpis: aKpis }]) => ({
      id, name,
      ok: aKpis.filter((k) => k.status === "ok").length,
      review: aKpis.filter((k) => k.status === "review").length,
      finding: aKpis.filter((k) => k.status === "finding").length,
      total: aKpis.length,
      avgRisk: aKpis.reduce((s, k) => s + k.risk, 0) / aKpis.length,
      avgConf: aKpis.filter((k) => k.confidence > 0).reduce((s, k) => s + k.confidence, 0) / Math.max(aKpis.filter((k) => k.confidence > 0).length, 1),
    }));
  }, [kpis]);

  // KPI improvement table: compare Q1 vs current
  const kpiDelta = useMemo(() => {
    return kpis
      .filter((k) => k.trend.length >= 2)
      .map((k) => {
        const first = k.trend[0] ?? 0;
        const last = k.trend[k.trend.length - 1] ?? 0;
        const delta = last - first;
        return { ...k, trendDelta: delta, trendFirst: first, trendLast: last };
      })
      .sort((a, b) => Math.abs(b.trendDelta) - Math.abs(a.trendDelta))
      .slice(0, 10);
  }, [kpis]);

  const currentQ = QUARTERS[QUARTERS.length - 1];
  const firstQ = QUARTERS[0];

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Quartalsvergleich</h2>
          <p className="view-sub">{firstQ} → {currentQ} · {kpis.length} KPIs · 8 Quartale</p>
        </div>
        <div className="qcv-legend">
          <span className="qcv-legend-item qcv-ok">● OK</span>
          <span className="qcv-legend-item qcv-review">● Review</span>
          <span className="qcv-legend-item qcv-finding">● Finding</span>
        </div>
      </div>

      {/* Status timeline chart */}
      <div className="qcv-chart-card">
        <div className="qcv-chart-title">Status-Entwicklung über 8 Quartale</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gOk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gReview" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFinding" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="ok" stroke="#22c55e" fill="url(#gOk)" name="OK" strokeWidth={2} />
            <Area type="monotone" dataKey="review" stroke="#f59e0b" fill="url(#gReview)" name="Review" strokeWidth={2} />
            <Area type="monotone" dataKey="finding" stroke="#ef4444" fill="url(#gFinding)" name="Finding" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="qcv-two-col">
        {/* Per-area comparison bar chart */}
        <div className="qcv-chart-card">
          <div className="qcv-chart-title">Risikoverteilung nach Bereich</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ok" stackId="a" fill="#22c55e" name="OK" radius={[0, 0, 0, 0]} />
              <Bar dataKey="review" stackId="a" fill="#f59e0b" name="Review" />
              <Bar dataKey="finding" stackId="a" fill="#ef4444" name="Finding" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area health table */}
        <div className="qcv-chart-card">
          <div className="qcv-chart-title">Bereichs-Gesundheit</div>
          <table className="qcv-area-table">
            <thead>
              <tr><th>Bereich</th><th>KPIs</th><th>Ø Risiko</th><th>Ø Konfidenz</th><th>Findings</th></tr>
            </thead>
            <tbody>
              {areaData.sort((a, b) => b.finding - a.finding).map((a) => (
                <tr key={a.id}>
                  <td className="qcv-area-name">{a.name}</td>
                  <td className="tabular">{a.total}</td>
                  <td className="tabular">
                    <span className={`qcv-risk-badge qcv-risk-${a.avgRisk >= 4 ? "high" : a.avgRisk >= 3 ? "med" : "low"}`}>
                      {a.avgRisk.toFixed(1)}
                    </span>
                  </td>
                  <td className="tabular">{Math.round(a.avgConf * 100)}%</td>
                  <td className="tabular">
                    {a.finding > 0 ? <span className="qcv-finding-badge">{a.finding}</span> : <span className="qcv-ok-text">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top movers table */}
      <div className="qcv-chart-card">
        <div className="qcv-chart-title">Stärkste Veränderungen — {firstQ} → {currentQ}</div>
        <table className="qcv-delta-table">
          <thead>
            <tr><th>KPI</th><th>Titel</th><th>Status</th><th>{firstQ}</th><th>{currentQ}</th><th>Δ</th></tr>
          </thead>
          <tbody>
            {kpiDelta.map((k) => (
              <tr key={k.id}>
                <td className="tabular qcv-code">{k.code}</td>
                <td className="qcv-kpi-title">{k.title}</td>
                <td>
                  <span className={`qcv-status-pill qcv-status-${k.status}`}>{k.status}</span>
                </td>
                <td className="tabular">{k.trendFirst}</td>
                <td className="tabular">{k.trendLast}</td>
                <td className={`tabular ${k.trendDelta > 0 ? "qcv-delta-pos" : k.trendDelta < 0 ? "qcv-delta-neg" : ""}`}>
                  {k.trendDelta > 0 ? "+" : ""}{k.trendDelta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
