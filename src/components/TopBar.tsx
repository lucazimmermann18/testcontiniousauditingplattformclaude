"use client";
import type { ViewId } from "./AppShell";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Übersicht" },
  { id: "heatmap"   as const, label: "Risiko-Heatmap" },
  { id: "timeline"  as const, label: "Quartals-Timeline" },
  { id: "findings"  as const, label: "Findings" },
  { id: "agents"    as const, label: "KI-Agenten" },
];

export function TopBar({
  quarter,
  view,
  setView,
}: {
  quarter: string;
  view: ViewId;
  setView: (v: ViewId) => void;
}) {
  return (
    <header className="topbar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 12h3l2-5 3 10 2-5h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">
            CONTINUUM<span>·</span>AUDIT
          </div>
          <div className="brand-sub">Continuous Auditing Plattform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="topnav">
        {NAV_ITEMS.map((n) => (
          <button
            key={n.id}
            className={`topnav-btn${view === n.id ? " active" : ""}`}
            onClick={() => setView(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div className="topbar-right">
        <div className="quarter-pill">
          <span className="qp-dot" />
          <span className="qp-label">Laufendes Quartal</span>
          <span className="qp-value">{quarter}</span>
        </div>
        <div className="user-chip">
          <div className="avatar">AV</div>
          <div>
            <div className="user-name">A. Voss</div>
            <div className="user-role">Head of Audit</div>
          </div>
        </div>
      </div>
    </header>
  );
}
