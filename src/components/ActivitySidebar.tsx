"use client";
import { useState } from "react";
import type { Activity } from "@/types";

// ── SVG icons per activity type ──────────────────────────────

function FindingIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <path d="M10 3L18 17H2L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v4M10 13.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ApprovedIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10l2.5 2.5L13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AgentIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <path d="M4 14.5C4 12 6.5 10 10 10s6 2 6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 3l1.5 1.5L15.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function RerunIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <path d="M4 10a6 6 0 016-6 6 6 0 015.66 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 4v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function StatusChangeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <path d="M10 3v14M6 7l4-4 4 4M6 13l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ICON_MAP: Record<string, React.FC> = {
  finding:       FindingIcon,
  approved:      ApprovedIcon,
  rerun:         RerunIcon,
  comment:       CommentIcon,
  agent:         AgentIcon,
  status_change: StatusChangeIcon,
  user_joined:   UserIcon,
};

const COLOR_MAP: Record<string, string> = {
  finding:       "var(--alert)",
  approved:      "var(--ok)",
  rerun:         "var(--info)",
  comment:       "var(--ink-3)",
  agent:         "var(--warn)",
  status_change: "var(--info)",
  user_joined:   "var(--ink-3)",
};

const TYPE_LABEL: Record<string, string> = {
  finding:       "Befund",
  approved:      "Freigabe",
  rerun:         "Neuprüfung",
  comment:       "Kommentar",
  agent:         "KI-Agent",
  status_change: "Status",
  user_joined:   "Beitritt",
};

// ── Live indicator ───────────────────────────────────────────

function LiveDot() {
  return (
    <span className="live-dot-wrap" aria-label="Live-Updates aktiv">
      <span className="live-dot" />
      <span className="live-dot-ring" />
    </span>
  );
}

// ── Activity item ────────────────────────────────────────────

function ActivityItem({ a, onOpenKpi, isNew }: {
  a: Activity;
  onOpenKpi: (id: string) => void;
  isNew: boolean;
}) {
  const IconComponent = ICON_MAP[a.type] ?? AgentIcon;
  const color = COLOR_MAP[a.type] ?? "var(--ink-3)";

  return (
    <button
      className={`activity-item${isNew ? " activity-item-new" : ""}`}
      onClick={() => a.kpiId && onOpenKpi(a.kpiId)}
      aria-label={`${TYPE_LABEL[a.type] ?? a.type}: ${a.msg}`}
    >
      <div
        className="activity-icon-wrap"
        style={{ background: color + "18", color }}
      >
        <IconComponent />
      </div>
      <div className="activity-content">
        <div className="activity-top-row">
          {a.kpiCode && <span className="activity-kpi-code">{a.kpiCode}</span>}
          <span className="activity-type-tag" style={{ color }}>{TYPE_LABEL[a.type] ?? a.type}</span>
        </div>
        <div className="activity-msg">{a.msg}</div>
        <div className="activity-footer">
          <span className="activity-avatar-mini">{(a.avatar ?? a.user?.slice(0, 1) ?? "?").toUpperCase()}</span>
          <span className="activity-user">{a.user}</span>
          <span className="activity-sep">·</span>
          <span className="activity-time">{a.time}</span>
        </div>
      </div>
      <div className="activity-item-line" style={{ background: color }} />
    </button>
  );
}

// ── Sidebar ──────────────────────────────────────────────────

export function ActivitySidebar({
  activities,
  onOpenKpi,
}: {
  activities: Activity[];
  onOpenKpi: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? activities : activities.slice(0, 8);
  const findingCount = activities.filter((a) => a.type === "finding").length;

  return (
    <aside className="activity-side">
      {/* Header */}
      <div className="activity-header">
        <div className="activity-header-l">
          <div className="activity-title">Aktivitäten</div>
          <LiveDot />
        </div>
        <div className="activity-header-r">
          {findingCount > 0 && (
            <span className="activity-finding-badge">{findingCount}</span>
          )}
          <span className="activity-total-badge">{activities.length}</span>
        </div>
      </div>

      {/* Summary pills */}
      {activities.length > 0 && (
        <div className="activity-summary">
          {(["finding", "approved", "agent", "comment"] as const).map((type) => {
            const count = activities.filter((a) => a.type === type).length;
            if (count === 0) return null;
            return (
              <span
                key={type}
                className="activity-summary-pill"
                style={{ color: COLOR_MAP[type], background: COLOR_MAP[type] + "15" }}
              >
                {count} {TYPE_LABEL[type]}
              </span>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="activity-list">
        {activities.length === 0 && (
          <div className="activity-empty">
            <div className="activity-empty-icon">📋</div>
            <div>Noch keine Aktivitäten</div>
          </div>
        )}
        {visible.map((a, i) => (
          <ActivityItem key={a.id} a={a} onOpenKpi={onOpenKpi} isNew={i === 0} />
        ))}
      </div>

      {/* Footer */}
      {activities.length > 8 && (
        <button className="activity-show-more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Weniger anzeigen ↑" : `${activities.length - 8} weitere anzeigen ↓`}
        </button>
      )}
    </aside>
  );
}
