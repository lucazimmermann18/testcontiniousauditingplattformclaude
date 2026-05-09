"use client";
import { ACTIVITIES } from "@/data/audit-data";

const ACTIVITY_ICON: Record<string, string> = {
  finding:  "⚠",
  approved: "✓",
  rerun:    "↻",
  comment:  "💬",
  agent:    "⚡",
};

const ACTIVITY_COLOR: Record<string, string> = {
  finding:  "var(--alert)",
  approved: "var(--ok)",
  rerun:    "var(--info)",
  comment:  "var(--ink-3)",
  agent:    "var(--warn)",
};

export function ActivitySidebar({ onOpenKpi }: { onOpenKpi: (id: string) => void }) {
  return (
    <aside className="activity-side">
      <div className="activity-header">
        <div className="activity-title">Aktivitäten</div>
        <span className="activity-badge">{ACTIVITIES.length}</span>
      </div>

      <div className="activity-list">
        {ACTIVITIES.map((a) => (
          <div key={a.id} className="activity-item" onClick={() => onOpenKpi(a.kpiId)}
            role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpenKpi(a.kpiId)}>
            <div className="activity-icon-wrap" style={{ background: ACTIVITY_COLOR[a.type] + "22", color: ACTIVITY_COLOR[a.type] }}>
              {ACTIVITY_ICON[a.type]}
            </div>
            <div className="activity-content">
              <div className="activity-kpi-code">{a.kpiCode}</div>
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
