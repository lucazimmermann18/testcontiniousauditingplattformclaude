"use client";
import type { Activity } from "@/types";

const ACTIVITY_ICON: Record<string, string> = {
  finding:      "⚠",
  approved:     "✓",
  rerun:        "↻",
  comment:      "💬",
  agent:        "⚡",
  status_change:"↕",
  user_joined:  "👤",
};

const ACTIVITY_COLOR: Record<string, string> = {
  finding:      "var(--alert)",
  approved:     "var(--ok)",
  rerun:        "var(--info)",
  comment:      "var(--ink-3)",
  agent:        "var(--warn)",
  status_change:"var(--info)",
  user_joined:  "var(--ink-3)",
};

export function ActivitySidebar({
  activities,
  onOpenKpi,
}: {
  activities: Activity[];
  onOpenKpi: (id: string) => void;
}) {
  return (
    <aside className="activity-side">
      <div className="activity-header">
        <div className="activity-title">Aktivitäten</div>
        <span className="activity-badge">{activities.length}</span>
      </div>

      <div className="activity-list">
        {activities.map((a) => (
          <div
            key={a.id}
            className="activity-item"
            onClick={() => a.kpiId && onOpenKpi(a.kpiId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && a.kpiId && onOpenKpi(a.kpiId)}
          >
            <div
              className="activity-icon-wrap"
              style={{
                background: (ACTIVITY_COLOR[a.type] ?? "var(--ink-3)") + "22",
                color: ACTIVITY_COLOR[a.type] ?? "var(--ink-3)",
              }}
            >
              {ACTIVITY_ICON[a.type] ?? "·"}
            </div>
            <div className="activity-content">
              {a.kpiCode && <div className="activity-kpi-code">{a.kpiCode}</div>}
              <div className="activity-msg">{a.msg}</div>
              <div className="activity-footer">
                <span className="activity-user">{a.user}</span>
                <span className="activity-time">{a.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="activity-side-footer">
        <button className="btn-link">Alle Aktivitäten anzeigen</button>
      </div>
    </aside>
  );
}
