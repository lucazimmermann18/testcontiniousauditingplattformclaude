"use client";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";

// ── Status distribution donut ────────────────────────────────

const STATUS_COLOR_MAP: Record<string, string> = {
  ok:      "#10b981",
  review:  "#f59e0b",
  finding: "#ef4444",
  running: "#3b82f6",
  pending: "#94a3b8",
};
const STATUS_LABEL_MAP: Record<string, string> = {
  ok: "Konform", review: "In Prüfung", finding: "Befund",
  running: "Läuft", pending: "Offen",
};

interface StatusEntry { status: string; count: number; }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: "0.8rem",
      color: "var(--ink-1)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <div style={{ fontWeight: 600, color: STATUS_COLOR_MAP[d.status] ?? "var(--ink-1)" }}>
        {STATUS_LABEL_MAP[d.status] ?? d.status}
      </div>
      <div style={{ color: "var(--ink-3)", marginTop: 2 }}>{d.count} KPIs</div>
    </div>
  );
}

export function StatusDonut({ data }: { data: StatusEntry[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const okPct = Math.round(((data.find((d) => d.status === "ok")?.count ?? 0) / total) * 100);

  return (
    <div className="chart-card">
      <div className="chart-card-title">KPI-Statusverteilung</div>
      <div className="chart-card-sub">{total} Kennzahlen total</div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              dataKey="count"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLOR_MAP[entry.status] ?? "#94a3b8"}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--ink-1)", lineHeight: 1 }}>
            {okPct}%
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--ink-4)", marginTop: 2 }}>konform</div>
        </div>
      </div>
      {/* Legend */}
      <div className="donut-legend">
        {data.filter((d) => d.count > 0).map((d) => (
          <div key={d.status} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: STATUS_COLOR_MAP[d.status] ?? "#94a3b8" }} />
            <span className="donut-legend-label">{STATUS_LABEL_MAP[d.status] ?? d.status}</span>
            <span className="donut-legend-count">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quarterly trend area chart ───────────────────────────────

interface TrendEntry { quarter: string; ok: number; review: number; finding: number; }

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: "0.78rem",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <div style={{ fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function QuarterlyTrend({ data }: { data: TrendEntry[] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">Quartalstrend</div>
      <div className="chart-card-sub">Statusentwicklung über 8 Quartale</div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gradOk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradReview" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFinding" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.5} />
          <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} />
          <Tooltip content={<TrendTooltip />} />
          <Area type="monotone" dataKey="ok" name="Konform" stroke="#10b981" strokeWidth={2} fill="url(#gradOk)" dot={false} />
          <Area type="monotone" dataKey="review" name="In Prüfung" stroke="#f59e0b" strokeWidth={2} fill="url(#gradReview)" dot={false} />
          <Area type="monotone" dataKey="finding" name="Befunde" stroke="#ef4444" strokeWidth={2} fill="url(#gradFinding)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Risk distribution bar chart ──────────────────────────────

interface RiskEntry { level: string; count: number; color: string; }

export function RiskDistribution({ data }: { data: RiskEntry[] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">Risikoverteilung</div>
      <div className="chart-card-sub">KPIs nach Risiko-Level</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="level" tick={{ fontSize: 11, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "var(--ink-4)" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{
                  background: "var(--surface)", border: "1px solid var(--line)",
                  borderRadius: 8, padding: "8px 12px", fontSize: "0.78rem",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                }}>
                  <span style={{ color: d.color, fontWeight: 600 }}>{d.level}</span>
                  <span style={{ color: "var(--ink-3)", marginLeft: 8 }}>{d.count} KPIs</span>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.level} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Confidence gauge ─────────────────────────────────────────

export function ConfidenceGauge({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "#10b981" : pct >= 65 ? "#f59e0b" : "#ef4444";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="chart-card conf-gauge-card">
      <div className="chart-card-title">Ø KI-Konfidenz</div>
      <div className="chart-card-sub">{label}</div>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
        <svg viewBox="0 0 100 100" width="110" height="110">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
          <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--ink-1)">{pct}%</text>
          <text x="50" y="61" textAnchor="middle" fontSize="9" fill="var(--ink-4)">Konfidenz</text>
        </svg>
      </div>
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <span style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 99,
          background: color + "22",
          color,
          fontSize: "0.75rem",
          fontWeight: 600,
        }}>
          {pct >= 85 ? "Ausgezeichnet" : pct >= 65 ? "Akzeptabel" : "Niedrig"}
        </span>
      </div>
    </div>
  );
}
