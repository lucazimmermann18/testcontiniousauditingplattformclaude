"use client";
import { useState, useRef, useEffect } from "react";
import type { ViewId } from "./AppShell";
import { NotificationBell } from "./NotificationBell";

// ── Nav structure ─────────────────────────────────────────────

type NavItem =
  | { kind: "link"; id: ViewId; label: string; highlight?: boolean }
  | { kind: "group"; label: string; icon?: string; children: { id: ViewId; label: string; sub?: string; highlight?: boolean }[] };

const NAV: NavItem[] = [
  { kind: "link", id: "dashboard", label: "Übersicht" },
  {
    kind: "group", label: "Analyse", children: [
      { id: "analytics", label: "Analytics",           sub: "Risiko-Radar & Kennzahlen", highlight: true },
      { id: "heatmap",   label: "Risiko-Heatmap",     sub: "Visuelle Risikoübersicht" },
      { id: "timeline",  label: "Quartals-Timeline",   sub: "Zeitachse aller KPIs" },
      { id: "quarters",  label: "Quartalsvergleich",   sub: "Q/Q Trendanalyse" },
      { id: "history",   label: "Audit-Verlauf",       sub: "Prüfhistorie & Protokoll" },
    ],
  },
  { kind: "link", id: "findings", label: "Findings" },
  { kind: "link", id: "tasks",    label: "Aufgaben" },
  {
    kind: "group", label: "Planung", children: [
      { id: "planning",  label: "Prüfplanung",       sub: "Jahresplanung & Termine" },
      { id: "approvals", label: "Freigabe-Dashboard", sub: "Offene Genehmigungen" },
      { id: "calendar",  label: "Kalender",           sub: "Prüftermine & Fälligkeiten" },
    ],
  },
  {
    kind: "group", label: "KI", children: [
      { id: "agents",    label: "KI-Agenten",   sub: "Automatisierte Prüfläufe" },
      { id: "assistant", label: "KI-Assistent", sub: "Chat & Analyse", highlight: true },
    ],
  },
];

// IDs that belong to each group (for active highlighting)
function groupContains(group: Extract<NavItem, { kind: "group" }>, view: ViewId) {
  return group.children.some((c) => c.id === view);
}

// ── Dropdown group button ─────────────────────────────────────

function NavGroup({
  item,
  view,
  setView,
}: {
  item: Extract<NavItem, { kind: "group" }>;
  view: ViewId;
  setView: (v: ViewId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = groupContains(item, view);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="nav-group" ref={ref}>
      <button
        className={`topnav-btn nav-group-btn${isActive ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {item.label}
        <svg className={`nav-chevron${open ? " nav-chevron-open" : ""}`} viewBox="0 0 10 6" width="10" height="6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="nav-dropdown">
          {item.children.map((child) => (
            <button
              key={child.id}
              className={`nav-dropdown-item${view === child.id ? " active" : ""}${child.highlight ? " nav-dropdown-highlight" : ""}`}
              onClick={() => { setView(child.id); setOpen(false); }}
            >
              <div className="nav-dropdown-label">{child.label}</div>
              {child.sub && <div className="nav-dropdown-sub">{child.sub}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Role / user helpers ───────────────────────────────────────

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

// ── Mobile flat list (all 11 items) ──────────────────────────

const ALL_MOBILE: { id: ViewId; label: string; highlight?: boolean }[] = [
  { id: "dashboard", label: "Übersicht" },
  { id: "heatmap",   label: "Risiko-Heatmap" },
  { id: "timeline",  label: "Quartals-Timeline" },
  { id: "findings",  label: "Findings" },
  { id: "tasks",     label: "Aufgaben" },
  { id: "agents",    label: "KI-Agenten" },
  { id: "history",   label: "Audit-Verlauf" },
  { id: "quarters",  label: "Quartalsvergleich" },
  { id: "planning",  label: "Prüfplanung" },
  { id: "approvals", label: "Freigaben" },
  { id: "calendar",  label: "Kalender" },
  { id: "assistant", label: "KI-Assistent", highlight: true },
];

// ── TopBar ────────────────────────────────────────────────────

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="topbar">
      {/* Mobile hamburger */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Navigation öffnen"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
          <div className="mobile-nav-panel">
            <div className="mobile-nav-head">
              <span className="mobile-nav-brand">CONTINUUM·AUDIT</span>
              <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)}>×</button>
            </div>
            <div className="mobile-nav-items">
              {ALL_MOBILE.map((n) => (
                <button
                  key={n.id}
                  className={`mobile-nav-item${view === n.id ? " active" : ""}${n.highlight ? " mobile-nav-item-highlight" : ""}`}
                  onClick={() => { setView(n.id); setMobileNavOpen(false); }}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
        {NAV.map((item) =>
          item.kind === "link" ? (
            <button
              key={item.id}
              className={`topnav-btn${view === item.id ? " active" : ""}${item.highlight ? " topnav-btn-highlight" : ""}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ) : (
            <NavGroup key={item.label} item={item} view={view} setView={setView} />
          )
        )}
      </nav>

      {/* Right side */}
      <div className="topbar-right">
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
          {isAdmin && (
            <a href="/org" className="topbar-settings-btn" title="Organisation & SSO">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M3 21h18M3 7v14M21 7v14M9 21V12h6v9M3 7l9-4 9 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
