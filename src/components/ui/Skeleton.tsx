"use client";

export function Skeleton({ width, height, radius = 6, className }: {
  width?: string | number;
  height?: string | number;
  radius?: number;
  className?: string;
}) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ""}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width ?? "100%",
        height: typeof height === "number" ? `${height}px` : height ?? "16px",
        borderRadius: radius,
      }}
    />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="kpi-card-skeleton">
      <div className="kpi-card-skeleton-head">
        <Skeleton width={40} height={20} radius={4} />
        <Skeleton width={60} height={20} radius={10} />
      </div>
      <Skeleton width="80%" height={18} radius={4} />
      <Skeleton width="50%" height={14} radius={4} />
      <div className="kpi-card-skeleton-foot">
        <Skeleton width={60} height={10} radius={3} />
        <Skeleton width={80} height={24} radius={4} />
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="activity-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="activity-skeleton-item">
          <Skeleton width={32} height={32} radius={8} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height={12} radius={4} />
            <Skeleton width="85%" height={11} radius={4} />
            <Skeleton width="40%" height={10} radius={4} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      {/* Hero skeleton */}
      <div className="hero-skeleton">
        <div>
          <Skeleton width={200} height={16} radius={4} />
          <Skeleton width={280} height={40} radius={6} />
          <Skeleton width={220} height={14} radius={4} />
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} width={80} height={64} radius={10} />
            ))}
          </div>
        </div>
        <Skeleton width={120} height={120} radius={60} />
      </div>

      {/* Charts skeleton */}
      <div className="charts-row-skeleton">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={240} radius={12} />
        ))}
      </div>

      {/* KPI grid skeleton */}
      <div className="kpi-grid-skeleton">
        {[...Array(6)].map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
