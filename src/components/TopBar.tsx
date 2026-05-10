"use client";
import type { ViewId } from "./AppShell";
import { NotificationBell } from "./NotificationBell";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Übersicht" },
  { id: "heatmap"   as const, label: "Risiko-Heatmap" },
  { id: "timeline"  as const, label: "Quartals-Timeline" },
  { id: "findings"  as const, label: "Findings" },
  { id: "tasks"     as const, label: "Aufgaben" },
  { id: "agents"    as const, label: "KI-Agenten" },
  { id: "history"   as const, label: "Audit-Verlauf" },
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
  darkMode,
  onToggleDarkMode,
  onOpenSearch,
}: {
  quarter: string;
  view: ViewId;
  setView: (v: ViewId) => void;
  me: MeUser | null;
  onOpenKpi: (id: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSearch?: () => void;
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
        {/* Search trigger */}
        <button
          className="topbar-search-btn"
          onClick={onOpenSearch}
          title="Suchen (Cmd+K)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="topbar-search-label">Suchen</span>
          <kbd className="topbar-search-kbd">⌘K</kbd>
        </button>

        <NotificationBell onOpenKpi={onOpenKpi} />

        {/* Dark mode toggle */}
        <button
          className="topbar-settings-btn"
          onClick={onToggleDarkMode}
          title={darkMode ? "Light Mode" : "Dark Mode"}
          aria-label="Theme wechseln"
        >
          {darkMode ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {isAdmin && (
          <a href="/report" className="topbar-settings-btn" title="Audit-Bericht (PDF)" target="_blank">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </a>
        )}
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
        <div className="user-chip-wrap">
          <a href="/profile" className="user-chip" title="Mein Profil">
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-name">{displayName}</div>
              <div className="user-role">{roleLabel}</div>
            </div>
          </a>
          {isAdmin && (
            <a href="/team" className="topbar-settings-btn" title="Team">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
