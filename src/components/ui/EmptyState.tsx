import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  sub?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

export function EmptyState({ icon, title, sub, action, compact }: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? " empty-state-compact" : ""}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {sub && <div className="empty-state-sub">{sub}</div>}
      {action && (
        <button className="btn-primary empty-state-cta" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export function TabSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="tab-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="tab-skeleton-row" style={{ opacity: 1 - i * 0.2 }}>
          <div className="skel skel-circle" />
          <div className="tab-skeleton-lines">
            <div className="skel skel-line" style={{ width: `${70 - i * 10}%` }} />
            <div className="skel skel-line skel-line-sm" style={{ width: `${45 - i * 5}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
