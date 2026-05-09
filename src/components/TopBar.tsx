"use client";
import type { ViewId } from "./AppShell";
import { NotificationBell } from "./NotificationBell";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Übersicht" },
  { id: "heatmap"   as const, label: "Risiko-Heatmap" },
  { id: "timeline"  as const, label: "Quartals-Timeline" },
  { id: "findings"  as const, label: "Findings" },
  { id: "agents"    as const, label: "KI-Agenten" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  head_of_audit: "Head of Audit",
  owner: "Process Owner",
  reviewer: "Reviewer",
};

interface MeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export function TopBar({
  quarter,
  view,
  setView,
  me,
  onOpenKpi,
}: {
  quarter: string;
  view: ViewId;
  setView: (v: ViewId) => void;
  me: MeUser | null;
  onOpenKpi: (id: string) => void;
}) {
  const initials = me?.avatar ?? me?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "??";
  const displayName = me?.name ? me.name.split(" ").map((w, i) => i === 0 ? w[0] + "." : w).join(" ") : "…";
  const roleLabel = me?.role ? (ROLE_LABELS[me.role] ?? me.role) : "…";
  const isAdmin = me?.role === "admin" || me?.role === "head_of_audit";

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
          <div className="brand-name">CONTINUUM<span>·</span>AUDIT</div>
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
        <NotificationBell onOpenKpi={onOpenKpi} />
        {isAdmin && (
          <a href="/settings" className="topbar-settings-btn" title="Einstellungen">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </a>
        )}
        <div className="quarter-pill">
          <span className="qp-dot" />
          <span className="qp-label">Laufendes Quartal</span>
          <span className="qp-value">{quarter}</span>
        </div>
        <div className="user-chip">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
